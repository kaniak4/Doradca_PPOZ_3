import { ragService } from './ragService.js';
import { config } from '../config.js';

/**
 * Serwis integrujący RAG z geminiService
 * Wrapper dla wyszukiwania dokumentów i weryfikacji cytowań
 */
export class LegalDatabaseService {
  /**
   * Wyszukuje relevantne dokumenty dla query
   * @param {string} query - Zapytanie użytkownika
   * @returns {Promise<object>} - Obiekt z chunkami, źródłami i kontekstem
   */
  async searchRelevantDocuments(query) {
    try {
      // Wyszukaj relevantne chunki
      const chunks = await ragService.search(query, config.rag.topK || 15);
      
      if (chunks.length === 0) {
        console.warn('Nie znaleziono relevantnych dokumentów dla query:', query);
        return {
          chunks: [],
          sources: [],
          context: '',
        };
      }
      
      // Wyciągnij unikalne źródła
      const sources = this.extractUniqueSources(chunks);
      
      // Formatuj kontekst dla AI
      const context = ragService.getFullContext(chunks);
      
      return {
        chunks,
        sources,
        context,
      };
    } catch (error) {
      console.error('Błąd podczas wyszukiwania dokumentów:', error);
      throw error;
    }
  }

  /**
   * Wyciąga unikalne źródła z chunków
   */
  extractUniqueSources(chunks) {
    const sourcesMap = new Map();
    
    for (const chunk of chunks) {
      const source = chunk.metadata?.title || chunk.citation?.source || 'Nieznane źródło';
      const isapUrl = chunk.metadata?.isapUrl;
      
      if (!sourcesMap.has(source)) {
        sourcesMap.set(source, {
          title: source,
          isapUrl: isapUrl,
          chunkCount: 0,
        });
      }
      
      sourcesMap.get(source).chunkCount++;
    }
    
    return Array.from(sourcesMap.values());
  }

  /**
   * Weryfikuje cytowania z odpowiedzi AI
   * @param {Array<object>} citations - Cytowania z AI
   * @param {Array<object>} relevantChunks - Chunki użyte jako kontekst
   * @returns {Array<object>} - Zweryfikowane cytowania
   */
  verifyCitations(citations, relevantChunks) {
    return ragService.extractCitations(
      { citations },
      relevantChunks
    );
  }

  /**
   * Sprawdza czy baza danych jest zainicjalizowana
   */
  async isDatabaseInitialized() {
    try {
      const { getStats } = await import('./vectorStore.js');
      const stats = await getStats();
      return stats.exists && stats.chunkCount > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Inicjalizuje bazę danych (sprawdza czy już istnieje)
   */
  async initializeDatabase() {
    try {
      const isInitialized = await this.isDatabaseInitialized();
      
      if (isInitialized) {
        const { getStats } = await import('./vectorStore.js');
        const stats = await getStats();
        console.log(`Baza danych już istnieje. Liczba chunków: ${stats.chunkCount}`);
        return {
          initialized: true,
          existing: true,
          chunkCount: stats.chunkCount,
        };
      }
      
      // Inicjalizuj vectorstore
      const { initialize } = await import('./vectorStore.js');
      await initialize();
      
      return {
        initialized: true,
        existing: false,
        chunkCount: 0,
      };
    } catch (error) {
      console.error('Błąd podczas inicjalizacji bazy danych:', error);
      throw error;
    }
  }
}

// Singleton instance
export const legalDatabaseService = new LegalDatabaseService();

