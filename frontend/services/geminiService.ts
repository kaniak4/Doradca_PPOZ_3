import { AnalysisResult, AnalysisMode } from "../types";

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'http://localhost:3003');
const REQUEST_TIMEOUT = 60000; // 60 sekund

/**
 * Typy błędów dla lepszej obsługi
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  ABORTED = 'ABORTED',
  UNKNOWN = 'UNKNOWN'
}

export class AnalysisError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

/**
 * Sprawdza czy backend jest dostępny
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sekund dla health check
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Wywołuje backend API do analizy zapytania PPOŻ/BHP
 * API Key jest teraz bezpiecznie przechowywany tylko w backendzie
 * @param query - Zapytanie do analizy
 * @param mode - Tryb analizy ('information' lub 'problem')
 * @param signal - AbortSignal do anulowania zapytania
 */
export const analyzeSafetyQuery = async (
  query: string,
  mode: AnalysisMode = 'problem',
  signal?: AbortSignal
): Promise<AnalysisResult> => {
  if (!query || !query.trim()) {
    throw new AnalysisError("Zapytanie nie może być puste", ErrorType.CLIENT_ERROR);
  }

  // Utwórz timeout controller
  const timeoutController = new AbortController();
  let isTimeout = false;
  const timeoutId = setTimeout(() => {
    isTimeout = true;
    timeoutController.abort();
  }, REQUEST_TIMEOUT);

  // Połącz oba sygnały (użytkownik i timeout)
  const combinedSignal = signal 
    ? (() => {
        const combined = new AbortController();
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          combined.abort();
        });
        timeoutController.signal.addEventListener('abort', () => combined.abort());
        return combined.signal;
      })()
    : timeoutController.signal;

  try {
    // Start measuring response time
    const startTime = performance.now();
    
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, mode }),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);
    
    // Calculate response time
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      
      // Różnicuj błędy na podstawie status code
      if (response.status === 429) {
        // Rate limit exceeded - extract retry info
        const retryAfter = errorData.retryAfter || null;
        const queuePositionHeader = response.headers.get('X-RateLimit-QueuePosition');
        const queuePosition = queuePositionHeader ? parseInt(queuePositionHeader, 10) : (errorData.queuePosition || null);
        
        const error = new AnalysisError(
          errorData.message || errorData.error || 'Przekroczono limit zapytań. Spróbuj ponownie za chwilę.',
          ErrorType.RATE_LIMIT,
          response.status
        );
        
        // Add queue position and retry info to error
        if (queuePosition !== null && queuePosition >= 0) {
          (error as any).queuePosition = queuePosition;
        }
        if (retryAfter !== null) {
          (error as any).retryAfter = retryAfter;
        }
        
        throw error;
      } else if (response.status >= 500) {
        throw new AnalysisError(
          errorData.error || 'Błąd serwera. Spróbuj ponownie za chwilę.',
          ErrorType.SERVER_ERROR,
          response.status
        );
      } else if (response.status === 401 || response.status === 403) {
        throw new AnalysisError(
          'Brak autoryzacji. Skontaktuj się z administratorem.',
          ErrorType.CLIENT_ERROR,
          response.status
        );
      } else if (response.status === 400) {
        throw new AnalysisError(
          errorData.error || 'Nieprawidłowe zapytanie. Sprawdź wprowadzone dane.',
          ErrorType.CLIENT_ERROR,
          response.status
        );
      } else {
        throw new AnalysisError(
          errorData.error || `Błąd HTTP: ${response.status}`,
          ErrorType.CLIENT_ERROR,
          response.status
        );
      }
    }

    const result = await response.json() as AnalysisResult;
    
    // Attach response time to result (as a non-enumerable property)
    return Object.assign(result, { 
      _responseTime: responseTimeMs,
      _performanceLabel: responseTimeMs < 3000 ? 'Fast' : 'Slow'
    });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error("API Error:", error);
    
    // Sprawdź typ błędu
    if (error instanceof AnalysisError) {
      throw error;
    }
    
    // Sprawdź czy błąd jest spowodowany anulowaniem
    if (error instanceof Error && error.name === 'AbortError') {
      // Sprawdź czy to timeout czy użytkownik anulował
      if (isTimeout) {
        throw new AnalysisError(
          'Przekroczono limit czasu oczekiwania (60 sekund). Spróbuj ponownie.',
          ErrorType.TIMEOUT
        );
      }
      throw new AnalysisError("Zapytanie zostało anulowane", ErrorType.ABORTED);
    }
    
    // Błąd sieci (brak połączenia)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new AnalysisError(
        'Brak połączenia z serwerem. Sprawdź połączenie internetowe.',
        ErrorType.NETWORK
      );
    }
    
    // Nieznany błąd
    if (error instanceof Error) {
      throw new AnalysisError(
        error.message || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
        ErrorType.UNKNOWN
      );
    }
    
    throw new AnalysisError(
      'Wystąpił błąd podczas komunikacji z serwerem',
      ErrorType.UNKNOWN
    );
  }
};