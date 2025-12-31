import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prosty in-memory vectorstore
let chunks = []; // [{ chunkId, text, metadata, embedding, citation }]
const STORAGE_FILE = path.resolve(__dirname, '../../vectorstore/chunks.json');

/**
 * Oblicza cosine similarity między dwoma wektorami
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Wektory muszą mieć tę samą długość');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Inicjalizuje vectorstore - ładuje dane z pliku jeśli istnieje
 */
export async function initialize() {
  try {
    // Utwórz folder vectorstore jeśli nie istnieje
    const vectorstoreDir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(vectorstoreDir)) {
      fs.mkdirSync(vectorstoreDir, { recursive: true });
    }
    
    // Załaduj istniejące chunki z pliku
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      chunks = JSON.parse(data);
      console.log(`Załadowano ${chunks.length} chunków z pliku`);
    } else {
      chunks = [];
      console.log('Utworzono nowy vectorstore');
    }
    
    return true;
  } catch (error) {
    console.error('Błąd podczas inicjalizacji vectorstore:', error);
    throw new Error(`Nie udało się zainicjalizować vectorstore: ${error.message}`);
  }
}

/**
 * Zapisuje chunki do pliku
 */
function saveToFile() {
  try {
    const vectorstoreDir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(vectorstoreDir)) {
      fs.mkdirSync(vectorstoreDir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(chunks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Błąd podczas zapisywania do pliku:', error);
  }
}

/**
 * Dodaje chunki z embeddings do vectorstore
 */
export async function addChunks(newChunks, embeddings) {
  if (newChunks.length !== embeddings.length) {
    throw new Error('Liczba chunków musi być równa liczbie embeddings');
  }
  
  try {
    // Dodaj chunki z embeddings
    for (let i = 0; i < newChunks.length; i++) {
      const chunk = {
        chunkId: newChunks[i].chunkId,
        text: newChunks[i].text,
        rawText: newChunks[i].rawText || newChunks[i].text,
        metadata: newChunks[i].metadata,
        embedding: embeddings[i],
        citation: newChunks[i].citation || {},
      };
      
      chunks.push(chunk);
    }
    
    // Zapisz do pliku
    saveToFile();
    
    console.log(`Dodano ${newChunks.length} chunków do vectorstore`);
    return newChunks.map(c => c.chunkId);
  } catch (error) {
    console.error('Błąd podczas dodawania chunków:', error);
    throw new Error(`Nie udało się dodać chunków: ${error.message}`);
  }
}

/**
 * Wyszukuje podobne chunki na podstawie query embedding
 */
export async function search(queryEmbedding, topK = 15) {
  if (chunks.length === 0) {
    return [];
  }
  
  try {
    // Oblicz similarity dla każdego chunka
    const results = chunks.map(chunk => {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        chunkId: chunk.chunkId,
        text: chunk.text,
        rawText: chunk.rawText,
        metadata: chunk.metadata,
        similarity,
        distance: 1 - similarity, // Dla kompatybilności z ChromaDB format
        citation: chunk.citation,
      };
    });
    
    // Sortuj po similarity (malejąco)
    results.sort((a, b) => b.similarity - a.similarity);
    
    // Zwróć top K wyników
    return results.slice(0, topK);
  } catch (error) {
    console.error('Błąd podczas wyszukiwania:', error);
    throw new Error(`Nie udało się wyszukać chunków: ${error.message}`);
  }
}

/**
 * Pobiera konkretny chunk po ID
 */
export async function getChunk(chunkId) {
  const chunk = chunks.find(c => c.chunkId === chunkId);
  
  if (!chunk) {
    return null;
  }
  
  return {
    chunkId: chunk.chunkId,
    text: chunk.text,
    rawText: chunk.rawText,
    metadata: chunk.metadata,
    citation: chunk.citation,
  };
}

/**
 * Usuwa wszystkie chunki (dla re-indexowania)
 */
export async function deleteCollection() {
  chunks = [];
  if (fs.existsSync(STORAGE_FILE)) {
    fs.unlinkSync(STORAGE_FILE);
  }
  console.log('Usunięto wszystkie chunki z vectorstore');
}

/**
 * Sprawdza czy collection istnieje
 */
export async function collectionExists() {
  return chunks.length > 0 || fs.existsSync(STORAGE_FILE);
}

/**
 * Zwraca statystyki collection
 */
export async function getStats() {
  return {
    collectionName: 'legal_documents',
    chunkCount: chunks.length,
    exists: chunks.length > 0 || fs.existsSync(STORAGE_FILE),
    storageFile: STORAGE_FILE,
  };
}
