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
    
    if (trimmed.length > 2000) {
      return 'Zapytanie jest zbyt długie. Maksymalnie 2000 znaków';
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
      const data = await analyzeSafetyQuery(query, mode, abortControllerRef.current.signal);
      clearInterval(stageInterval);
      setProcessingStage('complete');
      setResult(data);
      setError(null);
      setErrorType(null);
      // Aktualizuj health check po udanym zapytaniu
      setBackendHealth(true);
    } catch (err) {
      clearInterval(stageInterval);
      if (err instanceof AnalysisError) {
        if (err.type === ErrorType.ABORTED) {
          setError(null);
          setErrorType(null);
          setProcessingStage('idle');
        } else {
          setError(err.message);
          setErrorType(err.type);
          setProcessingStage('idle');
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
        return 'Generowanie opinii ekspertów...';
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
    handleAnalyze,
    handleCancel,
    handleQueryChange,
    handleRetry,
    setResult,
    getStageLabel,
    getStageProgress,
  };
};

