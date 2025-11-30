/**
 * Konfiguracja serwera
 * Wartości mogą być nadpisane przez zmienne środowiskowe
 */

export const config = {
  // Konfiguracja modelu AI
  gemini: {
    // Model Gemini do użycia
    // Dostępne opcje: "gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    
    // Temperatura modelu (0.0 - 2.0)
    // Niższe wartości = bardziej deterministyczne odpowiedzi
    // Wyższe wartości = bardziej kreatywne odpowiedzi
    // Dla RAG używamy niższej temperatury (0.3) aby AI odpowiadało tylko na podstawie dokumentów
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.3,
  },
  
  // Konfiguracja serwera
  server: {
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // Konfiguracja RAG (Retrieval-Augmented Generation)
  rag: {
    // Ścieżka do vectorstore (ChromaDB)
    vectorStorePath: process.env.VECTOR_STORE_PATH || 'vectorstore',
    
    // Model embeddings: 'gemini' lub 'openai'
    // Gemini może nie mieć embeddings API, więc domyślnie używamy OpenAI
    embeddingModel: process.env.EMBEDDING_MODEL || 'openai',
    
    // Maksymalny rozmiar chunka (znaki)
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE) || 1500,
    
    // Liczba chunków do zwrócenia w wyszukiwaniu
    topK: parseInt(process.env.RAG_TOP_K) || 15,
  },
};

