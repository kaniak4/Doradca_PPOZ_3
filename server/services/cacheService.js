/**
 * Prosty cache w pamięci dla wyników analizy
 * W produkcji można zastąpić Redis lub innym rozwiązaniem
 */

import { config } from '../config.js';

class CacheService {
  constructor() {
    this.cache = new Map();
    this.maxSize = config.cache.maxSize;
    this.defaultTTL = config.cache.defaultTTL;
  }

  /**
   * Generuje klucz cache na podstawie zapytania
   */
  generateKey(query) {
    // Normalizuj zapytanie (trim, lowercase dla porównań)
    const normalized = query.trim().toLowerCase();
    // Można użyć hash, ale dla prostoty używamy normalizowanego tekstu
    return `query:${normalized}`;
  }

  /**
   * Pobiera wartość z cache
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Sprawdź czy wpis nie wygasł
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Zapisuje wartość w cache
   */
  set(key, value, ttl = this.defaultTTL) {
    // Jeśli cache jest pełny, usuń najstarszy wpis
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Usuwa wpis z cache
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Czyści cały cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Zwraca statystyki cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
const cacheService = new CacheService();

export default cacheService;

