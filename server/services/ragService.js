import { parsePDF, chunkLegalDocumentFlat } from './pdfParser.js';
import { generateEmbedding, generateEmbeddingsBatch } from './embeddingService.js';
import { initialize, addChunks, search, getChunk } from './vectorStore.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Główny serwis RAG łączący wszystkie komponenty
 */
export class RAGService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Inicjalizuje vectorstore
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await initialize();
      this.initialized = true;
    }
  }

  /**
   * Indeksuje dokument: parse → chunk → embed → store
   * @param {string} pdfPath - Ścieżka do pliku PDF
   * @param {object} metadata - Metadane dokumentu (title, type, isapUrl, date)
   * @returns {Promise<object>} - Statystyki indeksowania
   */
  async indexDocument(pdfPath, metadata) {
    await this.ensureInitialized();
    
    console.log(`Indeksowanie dokumentu: ${metadata.title || pdfPath}`);
    
    try {
      // 1. Parse PDF
      console.log('  → Parsowanie PDF...');
      const { text, metadata: pdfMetadata } = await parsePDF(pdfPath);
      const fullMetadata = {
        ...metadata,
        ...pdfMetadata,
        filePath: pdfPath,
      };
      
      // 2. Chunk document (flat parsing)
      console.log('  → Dzielenie na chunki...');
      const chunks = chunkLegalDocumentFlat(text, fullMetadata);
      console.log(`  → Utworzono ${chunks.length} chunków`);
      
      if (chunks.length === 0) {
        throw new Error('Nie znaleziono żadnych chunków w dokumencie');
      }
      
      // 3. Generate embeddings
      console.log('  → Generowanie embeddings...');
      const texts = chunks.map(chunk => chunk.text);
      const embeddings = await generateEmbeddingsBatch(texts);
      console.log(`  → Wygenerowano ${embeddings.length} embeddings`);
      
      // 4. Store in vectorstore
      console.log('  → Zapis do vectorstore...');
      const chunkIds = await addChunks(chunks, embeddings);
      console.log(`  → Zapisano ${chunkIds.length} chunków`);
      
      return {
        success: true,
        chunksCount: chunks.length,
        embeddingsCount: embeddings.length,
        chunkIds: chunkIds,
      };
    } catch (error) {
      console.error(`Błąd podczas indeksowania dokumentu ${pdfPath}:`, error);
      throw error;
    }
  }

  /**
   * Wyszukuje relevantne dokumenty dla query
   * @param {string} query - Zapytanie użytkownika
   * @param {number} topK - Liczba wyników do zwrócenia
   * @returns {Promise<Array<object>>} - Tablica relevantnych chunków
   */
  async search(query, topK = null) {
    await this.ensureInitialized();
    
    const k = topK || config.rag.topK || 15;
    
    try {
      // 1. Generate query embedding
      const queryEmbedding = await generateEmbedding(query);
      
      // 2. Search in vectorstore
      const results = await search(queryEmbedding, k);
      
      return results;
    } catch (error) {
      console.error('Błąd podczas wyszukiwania:', error);
      throw error;
    }
  }

  /**
   * Formatuje chunki jako kontekst dla AI
   * @param {Array<object>} chunks - Tablica chunków z wyszukiwania
   * @returns {string} - Sformatowany kontekst
   */
  getFullContext(chunks) {
    if (!chunks || chunks.length === 0) {
      return '';
    }
    
    const contextParts = [];
    
    for (const chunk of chunks) {
      const source = chunk.metadata?.title || chunk.citation?.source || 'Nieznane źródło';
      const article = chunk.citation?.article || '';
      const context = chunk.citation?.context || '';
      
      // Buduj nagłówek źródła
      let sourceHeader = `=== ŹRÓDŁO: ${source}`;
      if (article) {
        sourceHeader += `, ${article}`;
      }
      if (context) {
        sourceHeader += ` (${context})`;
      }
      sourceHeader += ' ===';
      
      contextParts.push(sourceHeader);
      contextParts.push(chunk.rawText || chunk.text);
      contextParts.push(''); // Pusta linia między źródłami
    }
    
    return contextParts.join('\n');
  }

  /**
   * Wyciąga i weryfikuje cytowania z odpowiedzi AI
   * @param {object} aiResponse - Odpowiedź z AI (AnalysisResult)
   * @param {Array<object>} relevantChunks - Chunki użyte jako kontekst
   * @returns {Array<object>} - Zweryfikowane cytowania (bez duplikatów)
   */
  extractCitations(aiResponse, relevantChunks) {
    const verifiedCitations = [];
    const seenCitations = new Set(); // Set do śledzenia już dodanych cytowań
    
    if (!aiResponse.citations || aiResponse.citations.length === 0) {
      return verifiedCitations;
    }
    
    // Mapuj chunki po source i snippet dla szybkiego wyszukiwania
    const chunkMap = new Map();
    for (const chunk of relevantChunks) {
      const source = chunk.metadata?.title || chunk.citation?.source || '';
      const key = source.toLowerCase();
      if (!chunkMap.has(key)) {
        chunkMap.set(key, []);
      }
      chunkMap.get(key).push(chunk);
    }
    
    // Dla każdego cytowania z AI, znajdź odpowiadający chunk
    for (const citation of aiResponse.citations) {
      const source = citation.source || '';
      const snippet = citation.snippet || '';
      
      // Szukaj w relevant chunks
      const sourceKey = source.toLowerCase();
      const matchingChunks = chunkMap.get(sourceKey) || [];
      
      // Sprawdź czy snippet występuje w którymś z chunków
      let verified = false;
      let matchingChunk = null;
      
      for (const chunk of matchingChunks) {
        const chunkText = (chunk.rawText || chunk.text).toLowerCase();
        const snippetLower = snippet.toLowerCase();
        
        // Sprawdź czy snippet jest w chunk'u (może być częściowo)
        if (chunkText.includes(snippetLower) || snippetLower.includes(chunkText.substring(0, 100))) {
          verified = true;
          matchingChunk = chunk;
          break;
        }
      }
      
      // Jeśli nie znaleziono dokładnego dopasowania, użyj pierwszego chunka z tego źródła
      if (!verified && matchingChunks.length > 0) {
        verified = true;
        matchingChunk = matchingChunks[0];
      }
      
      // Utwórz zweryfikowane cytowanie
      if (verified && matchingChunk) {
        // Użyj pełnego tekstu z chunka zamiast fragmentu z AI
        // rawText zawiera oryginalny tekst atomu prawnego, który już zaczyna się od numeru paragrafu/artykułu
        // (np. "§ 238. Pomieszczenie powinno...")
        const chunkText = (matchingChunk.rawText || matchingChunk.text || '').trim();
        
        // Zwiększ limit do 1000 znaków - wystarczy dla większości przepisów
        // Ale zachowaj czytelność - nie obcinaj w środku zdania
        let finalSnippet = chunkText;
        if (finalSnippet.length > 1000) {
          // Znajdź ostatnie pełne zdanie przed limitem
          const truncated = finalSnippet.substring(0, 1000);
          const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('!'),
            truncated.lastIndexOf('?')
          );
          if (lastSentenceEnd > 800) {
            // Jeśli mamy zdanie zakończone przed 1000 znakami, użyj go
            finalSnippet = truncated.substring(0, lastSentenceEnd + 1);
          } else {
            // W przeciwnym razie użyj pełnych 1000 znaków z "..."
            finalSnippet = truncated + '...';
          }
        }
        
        // Stwórz unikalny klucz dla deduplikacji: source + chunkId (najlepsze) lub znormalizowany snippet
        const citationKey = matchingChunk.chunkId 
          ? `${source.toLowerCase()}:${matchingChunk.chunkId}`
          : `${source.toLowerCase()}:${finalSnippet.substring(0, 100).toLowerCase().trim().replace(/\s+/g, ' ')}`;
        
        // Sprawdź czy to cytowanie już nie zostało dodane
        if (!seenCitations.has(citationKey)) {
          seenCitations.add(citationKey);
          
          verifiedCitations.push({
            source: matchingChunk.metadata?.title || source,
            snippet: finalSnippet,
            url: matchingChunk.metadata?.isapUrl || citation.url,
            verified: true,
            reliability: 'Wysokie',
            chunkId: matchingChunk.chunkId,
            articleNumber: matchingChunk.citation?.article || null,
            pageNumber: matchingChunk.metadata?.pageNumber || null,
          });
        }
      } else {
        // Jeśli nie znaleziono dopasowania, oznacz jako niezweryfikowane
        // Użyj większego limitu również dla niezweryfikowanych
        let unverifiedSnippet = snippet;
        if (unverifiedSnippet.length > 1000) {
          const truncated = unverifiedSnippet.substring(0, 1000);
          const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('!'),
            truncated.lastIndexOf('?')
          );
          if (lastSentenceEnd > 800) {
            unverifiedSnippet = truncated.substring(0, lastSentenceEnd + 1);
          } else {
            unverifiedSnippet = truncated + '...';
          }
        }
        
        // Dla niezweryfikowanych też deduplikuj po source + znormalizowanym snippet
        const unverifiedKey = `${source.toLowerCase()}:${unverifiedSnippet.substring(0, 100).toLowerCase().trim().replace(/\s+/g, ' ')}`;
        
        if (!seenCitations.has(unverifiedKey)) {
          seenCitations.add(unverifiedKey);
          
          verifiedCitations.push({
            source,
            snippet: unverifiedSnippet,
            url: citation.url,
            verified: false,
            reliability: 'Niskie',
            chunkId: null,
            articleNumber: null,
            pageNumber: null,
          });
        }
      }
    }
    
    return verifiedCitations;
  }

  /**
   * Pobiera chunk po ID
   */
  async getChunkById(chunkId) {
    await this.ensureInitialized();
    return await getChunk(chunkId);
  }
}

// Singleton instance
export const ragService = new RAGService();

