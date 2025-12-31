import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { config } from "../config.js";

let geminiClient = null;
let openaiClient = null;

/**
 * Inicjalizuje klientów embeddings
 */
function initializeClients() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (geminiApiKey) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    } catch (error) {
      console.warn('Nie udało się zainicjalizować Gemini client:', error.message);
    }
  }
  
  if (openaiApiKey) {
    try {
      openaiClient = new OpenAI({ apiKey: openaiApiKey });
    } catch (error) {
      console.warn('Nie udało się zainicjalizować OpenAI client:', error.message);
    }
  }
}

// Inicjalizuj przy pierwszym użyciu
initializeClients();

/**
 * Ponownie inicjalizuje klientów embeddings (użyteczne po załadowaniu zmiennych środowiskowych)
 */
export function reinitializeClients() {
  initializeClients();
}

/**
 * Generuje embedding dla pojedynczego tekstu
 * @param {string} text - Tekst do embedowania
 * @returns {Promise<number[]>} - Wektor embeddingu
 */
export async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Tekst nie może być pusty');
  }
  
  // Spróbuj najpierw Gemini (jeśli dostępne)
  if (geminiClient && config.rag.embeddingModel === 'gemini') {
    try {
      return await generateGeminiEmbedding(text);
    } catch (error) {
      console.warn('Gemini embedding failed, falling back to OpenAI:', error.message);
      // Fallback na OpenAI
    }
  }
  
  // Użyj OpenAI jako głównego lub fallback
  if (openaiClient) {
    return await generateOpenAIEmbedding(text);
  }
  
  throw new Error('Brak dostępnego API embeddings. Ustaw GEMINI_API_KEY lub OPENAI_API_KEY.');
}

/**
 * Generuje embeddings dla wielu tekstów (batch processing)
 * @param {string[]} texts - Tablica tekstów do embedowania
 * @returns {Promise<number[][]>} - Tablica wektorów embeddingów
 */
export async function generateEmbeddingsBatch(texts) {
  if (!texts || texts.length === 0) {
    return [];
  }
  
  // OpenAI obsługuje batch embeddings natywnie
  if (openaiClient && (config.rag.embeddingModel === 'openai' || !geminiClient)) {
    return await generateOpenAIEmbeddingsBatch(texts);
  }
  
  // Dla Gemini, przetwarzamy sekwencyjnie (lub w małych batchach)
  const embeddings = [];
  const batchSize = config.rag.geminiEmbeddingBatchSize;
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);
  }
  
  return embeddings;
}

/**
 * Generuje embedding używając Gemini API
 * UWAGA: Gemini może nie mieć dedykowanego embeddings API
 * W takim przypadku użyjemy OpenAI jako fallback
 */
async function generateGeminiEmbedding(text) {
  // Sprawdź czy Gemini ma embeddings API
  // Jeśli nie, rzuć błąd aby przełączyć na OpenAI
  throw new Error('Gemini embeddings API nie jest dostępne. Użyj OpenAI.');
  
  // TODO: Jeśli Gemini doda embeddings API, zaimplementuj tutaj:
  // const model = geminiClient.models.embedContent({
  //   model: 'text-embedding-004', // lub inny model embeddings
  //   content: { parts: [{ text }] }
  // });
  // return model.embedding.values;
}

/**
 * Generuje embedding używając OpenAI API
 */
async function generateOpenAIEmbedding(text) {
  if (!openaiClient) {
    throw new Error('OpenAI client nie jest zainicjalizowany. Ustaw OPENAI_API_KEY.');
  }
  
  try {
    const response = await openaiClient.embeddings.create({
      model: config.rag.openaiEmbeddingModel,
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    throw new Error(`Błąd podczas generowania OpenAI embedding: ${error.message}`);
  }
}

/**
 * Generuje embeddings dla batch tekstów używając OpenAI
 */
async function generateOpenAIEmbeddingsBatch(texts) {
  if (!openaiClient) {
    throw new Error('OpenAI client nie jest zainicjalizowany. Ustaw OPENAI_API_KEY.');
  }
  
  // Filtruj puste teksty i obetnij zbyt długie (max ~8000 tokenów ≈ 6000 znaków)
  // ⚠️ UWAGA: Chunki dłuższe niż maxEmbeddingTextLength są automatycznie obcinane.
  // Oryginalny tekst jest zachowany w polu 'rawText' w vectorstore.
  // Powód: OpenAI embeddings API ma limit długości tekstu (~8000 tokenów).
  // Lokalizacja dokumentacji: README.md, sekcja "System RAG"
  const MAX_TEXT_LENGTH = config.rag.maxEmbeddingTextLength;
  const processedTexts = texts
    .map(text => {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return null;
      }
      // Obetnij zbyt długie teksty
      if (text.length > MAX_TEXT_LENGTH) {
        console.warn(`Tekst obcięty z ${text.length} do ${MAX_TEXT_LENGTH} znaków`);
        return text.substring(0, MAX_TEXT_LENGTH);
      }
      return text;
    })
    .filter(text => text !== null);
  
  if (processedTexts.length === 0) {
    throw new Error('Wszystkie teksty są puste lub nieprawidłowe');
  }
  
  // OpenAI ma limit batch size (max 2048 tekstów), więc dzielimy na mniejsze partie
  const BATCH_SIZE = config.rag.embeddingBatchSize;
  const allEmbeddings = [];
  
  try {
    for (let i = 0; i < processedTexts.length; i += BATCH_SIZE) {
      const batch = processedTexts.slice(i, i + BATCH_SIZE);
      const response = await openaiClient.embeddings.create({
        model: config.rag.openaiEmbeddingModel,
        input: batch,
      });
      
      allEmbeddings.push(...response.data.map(item => item.embedding));
    }
    
    // Jeśli były puste teksty, dodaj puste embeddings dla zachowania kolejności
    const result = [];
    let processedIndex = 0;
    for (let i = 0; i < texts.length; i++) {
      if (texts[i] && typeof texts[i] === 'string' && texts[i].trim().length > 0) {
        result.push(allEmbeddings[processedIndex]);
        processedIndex++;
      } else {
        // Dla pustych tekstów, zwróć pusty embedding (1536 wymiarów dla text-embedding-3-small)
        result.push(new Array(1536).fill(0));
      }
    }
    
    return result;
  } catch (error) {
    throw new Error(`Błąd podczas generowania OpenAI embeddings batch: ${error.message}`);
  }
}

/**
 * Sprawdza czy embeddings są dostępne
 */
export function isEmbeddingsAvailable() {
  return !!(geminiClient || openaiClient);
}

/**
 * Zwraca informację o używanym modelu embeddings
 */
export function getEmbeddingModelInfo() {
  if (config.rag.embeddingModel === 'gemini' && geminiClient) {
    return { provider: 'gemini', available: true };
  }
  if (openaiClient) {
    return { provider: 'openai', available: true, model: config.rag.openaiEmbeddingModel };
  }
  return { provider: 'none', available: false };
}

