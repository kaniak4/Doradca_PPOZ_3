import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeSafetyQuery } from './services/geminiService.js';
import { securityMiddleware } from './middleware/security.js';
import { rateLimiter, getRateLimitStats } from './middleware/rateLimiter.js';
import cacheService from './services/cacheService.js';
import shareService from './services/shareService.js';
import { validateAnalyzeRequest } from './validation/requestSchema.js';
import { reinitializeClients } from './services/embeddingService.js';
import { ragService } from './services/ragService.js';

dotenv.config();

// Ponownie zainicjalizuj klientów embeddings (teraz z załadowanymi zmiennymi środowiskowymi)
reinitializeClients();

// Inicjalizuj vectorstore przy starcie serwera
(async () => {
  try {
    await ragService.ensureInitialized();
    console.log('✅ Vectorstore zainicjalizowany');
  } catch (error) {
    console.error('⚠️  Błąd podczas inicjalizacji vectorstore:', error.message);
    console.error('   Aplikacja będzie działać, ale RAG może nie działać poprawnie.');
  }
})();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware - HTTPS redirect, CSP, security headers
// Musi być przed innymi middleware
app.use(...securityMiddleware);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Cache stats endpoint (tylko w development)
app.get('/api/cache/stats', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(cacheService.getStats());
});

// Rate limit stats endpoint (tylko w development)
app.get('/api/rate-limit/stats', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(getRateLimitStats());
});

// Clear cache endpoint (tylko w development)
app.delete('/api/cache', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  cacheService.clear();
  res.json({ message: 'Cache cleared' });
});

// Share endpoints
// POST /api/share - Tworzy udostępnienie analizy
app.post('/api/share', async (req, res) => {
  try {
    const { analysisResult } = req.body;
    
    if (!analysisResult) {
      return res.status(400).json({ 
        error: 'analysisResult is required' 
      });
    }

    // Walidacja podstawowa struktury analizy
    if (!analysisResult.summary || !analysisResult.finalRecommendation || !analysisResult.agents) {
      return res.status(400).json({ 
        error: 'Invalid analysis result structure' 
      });
    }

    const shareId = shareService.createShare(analysisResult);
    
    res.json({
      shareId,
      shareUrl: `${req.protocol}://${req.get('host')}/?share=${shareId}`,
      expiresAt: new Date(Date.now() + shareService.getShareTTL()).toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/share:', error);
    res.status(500).json({ 
      error: 'Wystąpił błąd podczas tworzenia udostępnienia.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/share/:id - Pobiera udostępnioną analizę
app.get('/api/share/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Share ID is required' 
      });
    }

    const shareData = shareService.getShare(id);
    
    if (!shareData) {
      return res.status(404).json({ 
        error: 'Udostępnienie nie zostało znalezione lub wygasło.',
        message: 'Link może być nieprawidłowy lub analiza została usunięta.'
      });
    }

    res.json(shareData);
  } catch (error) {
    console.error('Error in /api/share/:id:', error);
    res.status(500).json({ 
      error: 'Wystąpił błąd podczas pobierania udostępnienia.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API endpoint for safety analysis (z rate limitingiem)
app.post('/api/analyze', rateLimiter, async (req, res) => {
  try {
    // Walidacja i sanitizacja request body
    let validatedData;
    try {
      validatedData = validateAnalyzeRequest(req.body);
    } catch (validationError) {
      return res.status(400).json({ 
        error: validationError.message || 'Invalid request data',
        details: process.env.NODE_ENV === 'development' ? validationError.message : undefined
      });
    }

    const { query, mode = 'problem' } = validatedData;

    // Sprawdź cache (uwzględnij tryb w kluczu cache)
    const cacheKey = cacheService.generateKey(`${query}:${mode}`);
    const cachedResult = cacheService.get(cacheKey);
    
    if (cachedResult) {
      return res.json({
        ...cachedResult,
        cached: true
      });
    }

    // Jeśli nie ma w cache, wykonaj analizę
    const result = await analyzeSafetyQuery(query, mode);
    
    // Zapisz w cache
    cacheService.set(cacheKey, result);
    
    res.json({
      ...result,
      cached: false
    });
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    
    // Jeśli błąd walidacji, zwróć 400
    if (error.message && error.message.includes('Walidacja')) {
      return res.status(400).json({ 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      error: 'Wystąpił błąd podczas analizy. Spróbuj ponownie.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`💾 Cache enabled (max ${cacheService.maxSize} entries)`);
  
  const rateLimitStats = getRateLimitStats();
  if (rateLimitStats.enabled) {
    console.log(`🚦 Rate limiting enabled: ${rateLimitStats.limit} requests per ${rateLimitStats.window}s`);
  } else {
    console.log(`🚦 Rate limiting disabled`);
  }
  
  // Sprawdź stan vectorstore
  try {
    const { getStats } = await import('./services/vectorStore.js');
    const stats = await getStats();
    if (stats.chunkCount > 0) {
      console.log(`📚 Vectorstore: ${stats.chunkCount} chunków załadowanych`);
    } else {
      console.log(`⚠️  Vectorstore: Brak chunków. Uruchom: node server/scripts/initializeLegalDatabase.js`);
    }
  } catch (error) {
    console.error(`⚠️  Błąd podczas sprawdzania vectorstore: ${error.message}`);
  }
});

