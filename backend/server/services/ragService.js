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
    
    try {
      // 1. Parse PDF
      const { text, metadata: pdfMetadata } = await parsePDF(pdfPath);
      const fullMetadata = {
        ...metadata,
        ...pdfMetadata,
        filePath: pdfPath,
      };
      
      // 2. Chunk document (flat parsing)
      const chunks = chunkLegalDocumentFlat(text, fullMetadata);
      
      if (chunks.length === 0) {
        throw new Error('Nie znaleziono żadnych chunków w dokumencie');
      }
      
      // 3. Generate embeddings
      const texts = chunks.map(chunk => chunk.text);
      const embeddings = await generateEmbeddingsBatch(texts);
      
      // 4. Store in vectorstore
      const chunkIds = await addChunks(chunks, embeddings);
      
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
    
    const k = topK || config.rag.topK;
    
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
   * Ekstraktuje numer paragrafu/artykułu z tekstu chunka
   * Szuka pierwszego wystąpienia od góry, ignorując odwołania do innych artykułów
   * @param {object} chunk - Chunk z metadanymi
   * @returns {string|null} - Numer artykułu/paragrafu (np. "§ 32" lub "Art. 15") lub null
   */
  extractArticleNumber(chunk) {
    // Najpierw sprawdź, czy chunk ma już ustawiony numer w citation
    if (chunk.citation?.article) {
      return chunk.citation.article;
    }
    
    // Jeśli nie, spróbuj zbudować z metadata
    if (chunk.metadata?.number) {
      const type = chunk.metadata?.type === 'article' ? 'Art.' : '§';
      return `${type} ${chunk.metadata.number}`;
    }
    
    // W przeciwnym razie, spróbuj wyciągnąć z tekstu
    const text = (chunk.rawText || chunk.text || '').trim();
    if (!text) {
      return null;
    }
    
    // Wzorce do wykrywania numerów paragrafów/artykułów
    // Szukamy na początku tekstu (pierwsze 500 znaków) - to powinno wystarczyć
    const textStart = text.substring(0, 500);
    
    // Wzorce fraz wskazujących na odwołanie do innego artykułu/paragrafu
    const referencePatterns = [
      /o\s+których\s+mowa\s+w/i,
      /odpowiadać\s+wymaganiom/i,
      /zgodnie\s+z/i,
      /zgodnie\s+z\s+przepisami/i,
      /na\s+podstawie/i,
      /w\s+rozumieniu/i,
      /ust\.\s+\d+/i, // "ust. 1" przed "§" wskazuje na odwołanie
      /z\s+zastrzeżeniem/i,
      /określon\w+\s+w/i,
      /zawart\w+\s+w/i,
      /wymienion\w+\s+w/i,
      /z\s+uwzględnieniem/i,
      /przy\s+zachowaniu/i,
      /stosuje\s+się/i,
      /wynikając\w+\s+z/i,
      /wskazan\w+\s+w/i,
      /scharakteryzowan\w+\s+w/i
    ];
    
    // Wzorzec dla paragrafu: "§ 32" na początku linii
    const paragraphPattern = /(?:^|\n)\s*§\s*(\d+[a-z]?)[\.\)]?\s/g;
    const paragraphMatches = [...textStart.matchAll(paragraphPattern)];
    
    // Wzorzec dla artykułu: "Art. 15" na początku linii
    const articlePattern = /(?:^|\n)\s*Art\.\s*(\d+[a-z]?)[\.\)]?\s/gi;
    const articleMatches = [...textStart.matchAll(articlePattern)];
    
    // Priorytet: paragraf przed artykułem (jeśli oba występują)
    // Szukamy pierwszego wystąpienia, które NIE jest odwołaniem
    for (const match of paragraphMatches) {
      const matchIndex = match.index;
      const beforeMatch = textStart.substring(0, matchIndex);
      
      // Sprawdź, czy przed "§" jest dużo tekstu (więcej niż 100 znaków) - prawdopodobnie odwołanie
      if (matchIndex > 100) {
        // Sprawdź, czy przed "§" są frazy wskazujące na odwołanie
        const isReference = referencePatterns.some(pattern => pattern.test(beforeMatch));
        if (isReference) {
          continue; // To jest odwołanie, pomiń
        }
      }
      
      // Jeśli "§" jest na początku tekstu lub po małej ilości białych znaków,
      // to prawdopodobnie to główny paragraf
      if (matchIndex < 100 || beforeMatch.trim().length === 0 || beforeMatch.match(/^[\s\n]*$/)) {
        return `§ ${match[1]}`;
      }
    }
    
    // Podobnie dla artykułu
    for (const match of articleMatches) {
      const matchIndex = match.index;
      const beforeMatch = textStart.substring(0, matchIndex);
      
      if (matchIndex > 100) {
        const isReference = referencePatterns.some(pattern => pattern.test(beforeMatch));
        if (isReference) {
          continue;
        }
      }
      
      if (matchIndex < 100 || beforeMatch.trim().length === 0 || beforeMatch.match(/^[\s\n]*$/)) {
        return `Art. ${match[1]}`;
      }
    }
    
    return null;
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
        const maxSnippetLength = config.rag.maxCitationSnippetLength;
        const sentenceThreshold = config.rag.citationSentenceThreshold;
        const keyLength = config.rag.citationKeyLength;
        
        let finalSnippet = chunkText;
        if (finalSnippet.length > maxSnippetLength) {
          // Znajdź ostatnie pełne zdanie przed limitem
          const truncated = finalSnippet.substring(0, maxSnippetLength);
          const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('!'),
            truncated.lastIndexOf('?')
          );
          if (lastSentenceEnd > sentenceThreshold) {
            // Jeśli mamy zdanie zakończone przed limitem, użyj go
            finalSnippet = truncated.substring(0, lastSentenceEnd + 1);
          } else {
            // W przeciwnym razie użyj pełnego limitu z "..."
            finalSnippet = truncated + '...';
          }
        }
        
        // Stwórz unikalny klucz dla deduplikacji: source + chunkId (najlepsze) lub znormalizowany snippet
        const citationKey = matchingChunk.chunkId 
          ? `${source.toLowerCase()}:${matchingChunk.chunkId}`
          : `${source.toLowerCase()}:${finalSnippet.substring(0, keyLength).toLowerCase().trim().replace(/\s+/g, ' ')}`;
        
        // Sprawdź czy to cytowanie już nie zostało dodane
        if (!seenCitations.has(citationKey)) {
          seenCitations.add(citationKey);
          
          // Ekstraktuj numer artykułu/paragrafu - użyj citation.article lub spróbuj wyciągnąć z tekstu
          let articleNumber = matchingChunk.citation?.article || null;
          if (!articleNumber) {
            articleNumber = this.extractArticleNumber(matchingChunk);
          }
          
          verifiedCitations.push({
            source: matchingChunk.metadata?.title || source,
            snippet: finalSnippet,
            url: matchingChunk.metadata?.isapUrl || citation.url,
            verified: true,
            reliability: 'Wysokie',
            chunkId: matchingChunk.chunkId,
            articleNumber: articleNumber,
            pageNumber: matchingChunk.metadata?.pageNumber || null,
          });
        }
      } else {
        // Jeśli nie znaleziono dopasowania, oznacz jako niezweryfikowane
        // Użyj większego limitu również dla niezweryfikowanych
        const maxSnippetLength = config.rag.maxCitationSnippetLength;
        const sentenceThreshold = config.rag.citationSentenceThreshold;
        const keyLength = config.rag.citationKeyLength;
        
        let unverifiedSnippet = snippet;
        if (unverifiedSnippet.length > maxSnippetLength) {
          const truncated = unverifiedSnippet.substring(0, maxSnippetLength);
          const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('!'),
            truncated.lastIndexOf('?')
          );
          if (lastSentenceEnd > sentenceThreshold) {
            unverifiedSnippet = truncated.substring(0, lastSentenceEnd + 1);
          } else {
            unverifiedSnippet = truncated + '...';
          }
        }
        
        // Dla niezweryfikowanych też deduplikuj po source + znormalizowanym snippet
        const unverifiedKey = `${source.toLowerCase()}:${unverifiedSnippet.substring(0, keyLength).toLowerCase().trim().replace(/\s+/g, ' ')}`;
        
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

