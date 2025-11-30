/**
 * Serwis do zarządzania udostępnianiem analiz
 * Używa cacheService do przechowywania udostępnionych analiz
 */

import cacheService from './cacheService.js';
import crypto from 'crypto';

class ShareService {
  constructor() {
    this.shareTTL = 7 * 24 * 60 * 60 * 1000; // 7 dni w milisekundach
  }

  /**
   * Zwraca TTL dla udostępnień
   */
  getShareTTL() {
    return this.shareTTL;
  }

  /**
   * Generuje unikalny ID dla udostępnienia
   * Używa crypto.randomUUID() jeśli dostępne, w przeciwnym razie hash
   */
  generateShareId() {
    // Użyj crypto.randomUUID() jeśli dostępne (Node.js 14.17.0+)
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback: generuj hash z timestamp + random bytes
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${randomBytes}`;
  }

  /**
   * Zapisuje analizę do udostępnienia
   * @param {Object} analysisResult - Wynik analizy do udostępnienia
   * @returns {string} - Unikalny ID udostępnienia
   */
  createShare(analysisResult) {
    const shareId = this.generateShareId();
    const shareKey = `share:${shareId}`;
    
    // Zapisz w cache z dłuższym TTL (7 dni)
    cacheService.set(shareKey, {
      ...analysisResult,
      sharedAt: new Date().toISOString(),
    }, this.shareTTL);
    
    return shareId;
  }

  /**
   * Pobiera udostępnioną analizę po ID
   * @param {string} shareId - ID udostępnienia
   * @returns {Object|null} - Analiza lub null jeśli nie znaleziono
   */
  getShare(shareId) {
    if (!shareId || typeof shareId !== 'string') {
      return null;
    }
    
    const shareKey = `share:${shareId}`;
    const shareData = cacheService.get(shareKey);
    
    if (!shareData) {
      return null;
    }
    
    return shareData;
  }

  /**
   * Usuwa udostępnienie (opcjonalne)
   * @param {string} shareId - ID udostępnienia
   * @returns {boolean} - Czy udało się usunąć
   */
  deleteShare(shareId) {
    const shareKey = `share:${shareId}`;
    return cacheService.delete(shareKey);
  }

  /**
   * Sprawdza czy udostępnienie istnieje
   * @param {string} shareId - ID udostępnienia
   * @returns {boolean}
   */
  shareExists(shareId) {
    const shareKey = `share:${shareId}`;
    return cacheService.get(shareKey) !== null;
  }
}

// Singleton instance
const shareService = new ShareService();

export default shareService;

