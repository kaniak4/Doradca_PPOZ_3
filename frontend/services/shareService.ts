import { AnalysisResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';

export interface ShareResponse {
  shareId: string;
  shareUrl: string;
  expiresAt: string;
}

/**
 * Tworzy udostępnienie analizy i zwraca link
 * @param analysisResult - Wynik analizy do udostępnienia
 * @returns ShareResponse z shareId i shareUrl
 */
export const createShare = async (analysisResult: AnalysisResult): Promise<ShareResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analysisResult }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Jeśli nie można sparsować JSON, użyj domyślnego komunikatu
        if (response.status === 404) {
          errorMessage = 'Endpoint nie został znaleziony. Sprawdź czy serwer jest uruchomiony.';
        } else if (response.status === 500) {
          errorMessage = 'Błąd serwera podczas tworzenia udostępnienia.';
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json() as ShareResponse;
    return result;
  } catch (error) {
    console.error('Share creation error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Brak połączenia z serwerem. Sprawdź czy backend jest uruchomiony na porcie 3003.');
    }
    throw error;
  }
};

/**
 * Pobiera udostępnioną analizę po ID
 * @param shareId - ID udostępnienia
 * @returns AnalysisResult lub null jeśli nie znaleziono
 */
export const getSharedAnalysis = async (shareId: string): Promise<AnalysisResult | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/share/${shareId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as AnalysisResult;
    return result;
  } catch (error) {
    console.error('Get shared analysis error:', error);
    throw error;
  }
};

/**
 * Kopiuje tekst do schowka
 * @param text - Tekst do skopiowania
 * @returns Promise<boolean> - Czy udało się skopiować
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback dla starszych przeglądarek
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error('Copy to clipboard error:', error);
    return false;
  }
};

/**
 * Generuje pełny URL udostępnienia
 * @param shareId - ID udostępnienia
 * @returns Pełny URL
 */
export const generateShareUrl = (shareId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/?share=${shareId}`;
};

