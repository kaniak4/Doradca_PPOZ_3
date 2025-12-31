/**
 * Konfiguracja serwera
 * Wartości mogą być nadpisane przez zmienne środowiskowe
 */

export const config = {
  // Konfiguracja modelu AI
  gemini: {
    // Model Gemini do użycia
    // Dostępne opcje: "gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-3.0-pro"
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    
    // Temperatura modelu (0.0 - 2.0)
    // Niższe wartości = bardziej deterministyczne odpowiedzi
    // Wyższe wartości = bardziej kreatywne odpowiedzi
    // Dla RAG używamy niższej temperatury (0.3) aby AI odpowiadało tylko na podstawie dokumentów
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.3,
  },
  
  // Konfiguracja serwera
  server: {
    port: parseInt(process.env.PORT) || 3003,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // Konfiguracja RAG (Retrieval-Augmented Generation)
  rag: {
    // Ścieżka do vectorstore (ChromaDB)
    vectorStorePath: process.env.VECTOR_STORE_PATH || 'vectorstore',
    
    // Model embeddings: 'gemini' lub 'openai'
    // Gemini może nie mieć embeddings API, więc domyślnie używamy OpenAI
    embeddingModel: process.env.EMBEDDING_MODEL || 'openai',
    
    // Model OpenAI embeddings
    openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    
    // Maksymalny rozmiar chunka (znaki)
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE) || 1500,
    
    // Liczba chunków do zwrócenia w wyszukiwaniu
    topK: parseInt(process.env.RAG_TOP_K) || 20,
    
    // Maksymalna długość tekstu dla embeddings (OpenAI limit ~8000 tokenów ≈ 6000 znaków)
    maxEmbeddingTextLength: parseInt(process.env.RAG_MAX_EMBEDDING_LENGTH) || 6000,
    
    // Rozmiar batch dla embeddings (OpenAI)
    embeddingBatchSize: parseInt(process.env.RAG_EMBEDDING_BATCH_SIZE) || 100,
    
    // Rozmiar batch dla Gemini embeddings (jeśli dostępne)
    geminiEmbeddingBatchSize: parseInt(process.env.RAG_GEMINI_BATCH_SIZE) || 10,
    
    // Maksymalna długość snippet w cytowaniach (znaki)
    maxCitationSnippetLength: parseInt(process.env.RAG_MAX_CITATION_LENGTH) || 1000,
    
    // Próg dla ostatniego zdania w cytowaniu (znaki)
    citationSentenceThreshold: parseInt(process.env.RAG_CITATION_THRESHOLD) || 800,
    
    // Długość klucza dla deduplikacji cytowań (znaki)
    citationKeyLength: parseInt(process.env.RAG_CITATION_KEY_LENGTH) || 100,
  },
  
  // Konfiguracja cache
  cache: {
    // Maksymalna liczba wpisów w cache
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100,
    
    // Domyślny czas życia cache (milisekundy)
    // 24 godziny = 24 * 60 * 60 * 1000
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || (24 * 60 * 60 * 1000),
  },
  
  // Konfiguracja rate limiting
  rateLimit: {
    // Okno czasowe (milisekundy)
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (60 * 1000), // 1 minuta
    
    // Maksymalna liczba zapytań w oknie czasowym
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 10,
    
    // Włącz/wyłącz rate limiting
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false', // domyślnie włączony
  },
  
  // Konfiguracja udostępniania
  share: {
    // Czas życia udostępnień (milisekundy)
    // 7 dni = 7 * 24 * 60 * 60 * 1000
    ttl: parseInt(process.env.SHARE_TTL) || (7 * 24 * 60 * 60 * 1000),
  },
};

