import { useState, useRef, useCallback, useEffect } from 'react';
import { AnalysisResult, AnalysisMode } from '../types';
import { analyzeSafetyQuery, AnalysisError, ErrorType, checkBackendHealth } from '../services/geminiService';

type ProcessingStage = 
  | 'idle' 
  | 'validating' 
  | 'analyzing' 
  | 'generating-experts' 
  | 'verifying-sources' 
  | 'complete';

/**
 * Sprawdza czy tekst wygląda na losowy/nonsensowny ciąg znaków
 * Wykrywa przypadki typu "asdasfasgaewsgfsegaegg"
 * Nie używa AI - to szybka walidacja po stronie klienta
 */
const isLikelyRandomText = (text: string): boolean => {
  const trimmed = text.trim();
  
  // 1. Sprawdź czy zawiera spacje (sensowne zdania mają spacje między słowami)
  // Jeśli brak spacji i długość > 15 znaków, prawdopodobnie losowy ciąg
  if (!trimmed.includes(' ') && trimmed.length > 15) {
    // Wyjątek: może być jedno długie słowo (sprawdzamy czy ma sensowne wzorce)
    const hasRepeatingPattern = /(.{2,})\1{2,}/.test(trimmed); // Powtarzające się wzorce
    if (hasRepeatingPattern) {
      return true;
    }
    
    // Sprawdź różnorodność znaków (entropia)
    const uniqueChars = new Set(trimmed.toLowerCase()).size;
    const entropyRatio = uniqueChars / trimmed.length;
    
    // Dla ciągów 16-20 znaków: jeśli entropia < 0.5 (za mało różnorodności), blokuj
    if (trimmed.length <= 20 && entropyRatio < 0.5) {
      return true;
    }
    
    // Dla dłuższych ciągów (> 20): bardziej restrykcyjne sprawdzenie
    if (trimmed.length > 20 && entropyRatio < 0.4) {
      return true;
    }
  }
  
  // 2. Sprawdź proporcję liter do nie-liter
  const letterMatch = trimmed.match(/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g);
  const letterCount = letterMatch ? letterMatch.length : 0;
  const letterRatio = letterCount / trimmed.length;
  
  // Jeśli mniej niż 60% liter (dużo losowych znaków), prawdopodobnie losowy
  if (letterRatio < 0.6 && trimmed.length > 15) {
    return true;
  }
  
  // 3. Sprawdź czy składa się głównie z powtarzających się znaków
  const charCounts: Record<string, number> = {};
  for (const char of trimmed.toLowerCase()) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }
  const maxCharCount = Math.max(...Object.values(charCounts));
  const maxCharRatio = maxCharCount / trimmed.length;
  
  // Jeśli jeden znak stanowi więcej niż 40% tekstu, prawdopodobnie losowy
  if (maxCharRatio > 0.4 && trimmed.length > 20) {
    return true;
  }
  
  // 4. Sprawdź czy zawiera sensowne słowa (ciągi liter oddzielone spacjami/punktacją)
  // Policz słowa (ciągi liter/cyfr)
  const words = trimmed.split(/[\s\p{P}]+/u).filter(w => w.length > 1);
  if (words.length === 0 && trimmed.length > 15) {
    return true; // Brak słów w długim tekście
  }
  
  // Jeśli jest tylko jedno "słowo" ale jest bardzo długie i nie ma sensu
  if (words.length === 1 && words[0].length > 30) {
    const word = words[0];
    // Sprawdź czy to nie jest ciąg losowy (wysoka entropia + brak wzorców)
    const uniqueInWord = new Set(word.toLowerCase()).size;
    if (uniqueInWord / word.length < 0.5) {
      return true; // Za mało różnorodności
    }
  }
  
  // 5. Sprawdź czy nie składa się głównie z samych spacji i znaków specjalnych
  const meaningfulChars = trimmed.match(/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9]/g);
  if (meaningfulChars && meaningfulChars.length < trimmed.length * 0.5) {
    return true;
  }
  
  return false;
};

interface UseAnalysisReturn {
  query: string;
  setQuery: (query: string) => void;
  isLoading: boolean;
  result: AnalysisResult | null;
  error: string | null;
  errorType: ErrorType | null;
  validationError: string | null;
  processingStage: ProcessingStage;
  backendHealth: boolean | null;
  responseTime: number | null; // Czas odpowiedzi w ms
  performanceLabel: 'Fast' | 'Slow' | null; // Etykieta wydajności
  queuePosition: number | null; // Pozycja w kolejce (rate limit)
  handleAnalyze: (mode: AnalysisMode) => Promise<void>;
  handleCancel: () => void;
  handleQueryChange: (value: string) => void;
  handleRetry: (mode: AnalysisMode) => Promise<void>;
  setResult: (result: AnalysisResult | null) => void;
  getStageLabel: (stage: ProcessingStage) => string;
  getStageProgress: (stage: ProcessingStage) => number;
}

/**
 * Hook do zarządzania analizą zapytań PPOŻ
 * Separuje logikę biznesową od komponentów UI
 */
export const useAnalysis = (): UseAnalysisReturn => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [backendHealth, setBackendHealth] = useState<boolean | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [performanceLabel, setPerformanceLabel] = useState<'Fast' | 'Slow' | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Health check przy starcie i okresowo
  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkBackendHealth();
      setBackendHealth(isHealthy);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Sprawdzaj co 30 sekund

    return () => clearInterval(interval);
  }, []);

  /**
   * Waliduje zapytanie użytkownika
   */
  const validateQuery = useCallback((text: string): string | null => {
    const trimmed = text.trim();
    
    if (!trimmed) {
      return 'Zapytanie nie może być puste';
    }
    
    if (trimmed.length < 10) {
      return 'Zapytanie jest zbyt krótkie. Opisz problem bardziej szczegółowo (minimum 10 znaków)';
    }
    
    if (trimmed.length > 1000) {
      return 'Zapytanie jest zbyt długie. Maksymalnie 1000 znaków';
    }
    
    // Sprawdź czy tekst wygląda na losowy/nonsensowny
    if (isLikelyRandomText(trimmed)) {
      return 'Zapytanie wygląda na losowy ciąg znaków. Wprowadź sensowne pytanie dotyczące PPOŻ/BHP.';
    }
    
    return null;
  }, []);

  /**
   * Obsługuje zmianę zapytania
   */
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setValidationError(null);
    setError(null);
  }, []);

  /**
   * Rozpoczyna analizę zapytania
   */
  const handleAnalyze = useCallback(async (mode: AnalysisMode) => {
    const validation = validateQuery(query);
    if (validation) {
      setValidationError(validation);
      return;
    }

    // Anuluj poprzednie zapytanie jeśli istnieje
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Utwórz nowy AbortController
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setValidationError(null);
    setResult(null);
    setProcessingStage('validating');

    // Symulacja etapów przetwarzania (w rzeczywistości backend robi to wszystko naraz)
    const stages: ProcessingStage[] = ['analyzing', 'generating-experts', 'verifying-sources'];
    let stageIndex = 0;

    const stageInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        setProcessingStage(stages[stageIndex]);
        stageIndex++;
      }
    }, 2000);

    try {
      const startTime = performance.now();
      const data = await analyzeSafetyQuery(query, mode, abortControllerRef.current.signal);
      const endTime = performance.now();
      const responseTimeMs = Math.round(endTime - startTime);
      
      clearInterval(stageInterval);
      setProcessingStage('complete');
      setResult(data);
      setError(null);
      setErrorType(null);
      
      // Update performance metrics
      setResponseTime(responseTimeMs);
      setPerformanceLabel(responseTimeMs < 3000 ? 'Fast' : 'Slow');
      setQueuePosition(null);
      
      // Aktualizuj health check po udanym zapytaniu
      setBackendHealth(true);
    } catch (err) {
      clearInterval(stageInterval);
      if (err instanceof AnalysisError) {
        if (err.type === ErrorType.ABORTED) {
          setError(null);
          setErrorType(null);
          setProcessingStage('idle');
          setResponseTime(null);
          setPerformanceLabel(null);
          setQueuePosition(null);
        } else {
          setError(err.message);
          setErrorType(err.type);
          setProcessingStage('idle');
          
          // Handle rate limit with queue position
          if (err.type === ErrorType.RATE_LIMIT) {
            const queuePos = (err as any).queuePosition;
            if (queuePos !== undefined && queuePos !== null) {
              setQueuePosition(queuePos);
            }
            setResponseTime(null);
            setPerformanceLabel(null);
          } else {
            setResponseTime(null);
            setPerformanceLabel(null);
            setQueuePosition(null);
          }
          
          // Aktualizuj health check przy błędzie sieci
          if (err.type === ErrorType.NETWORK || err.type === ErrorType.TIMEOUT) {
            setBackendHealth(false);
          }
        }
      } else if (err instanceof Error && err.message === "Zapytanie zostało anulowane") {
        setError(null);
        setErrorType(null);
        setProcessingStage('idle');
      } else {
        setError(err instanceof Error ? err.message : "Wystąpił błąd podczas analizy. Sprawdź połączenie lub spróbuj ponownie.");
        setErrorType(ErrorType.UNKNOWN);
        setProcessingStage('idle');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [query, validateQuery]);

  /**
   * Anuluje bieżące zapytanie
   */
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setProcessingStage('idle');
    setError(null);
    setErrorType(null);
  }, []);

  /**
   * Ponawia ostatnie zapytanie
   * Wymaga przekazania trybu z komponentu nadrzędnego
   */
  const handleRetry = useCallback(async (mode: AnalysisMode) => {
    if (!query.trim()) return;
    await handleAnalyze(mode);
  }, [query, handleAnalyze]);

  /**
   * Zwraca etykietę dla etapu przetwarzania
   */
  const getStageLabel = useCallback((stage: ProcessingStage): string => {
    switch (stage) {
      case 'validating':
        return 'Walidacja zapytania...';
      case 'analyzing':
        return 'Analizowanie problemu...';
      case 'generating-experts':
        return 'Generowanie opinii agentów...';
      case 'verifying-sources':
        return 'Weryfikacja źródeł prawnych...';
      case 'complete':
        return 'Analiza zakończona';
      default:
        return '';
    }
  }, []);

  /**
   * Zwraca postęp dla etapu przetwarzania (0-100)
   */
  const getStageProgress = useCallback((stage: ProcessingStage): number => {
    switch (stage) {
      case 'validating':
        return 10;
      case 'analyzing':
        return 30;
      case 'generating-experts':
        return 60;
      case 'verifying-sources':
        return 90;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  }, []);

  return {
    query,
    setQuery,
    isLoading,
    result,
    error,
    errorType,
    validationError,
    processingStage,
    backendHealth,
    responseTime,
    performanceLabel,
    queuePosition,
    handleAnalyze,
    handleCancel,
    handleQueryChange,
    handleRetry,
    setResult,
    getStageLabel,
    getStageProgress,
  };
};
