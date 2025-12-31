import React, { lazy, Suspense, useEffect, useState, useRef, useMemo } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Tooltip from './components/Tooltip';
import Sidebar from './components/Sidebar';
import ProgressIndicator from './components/ProgressIndicator';
import ConfirmModal from './components/ConfirmModal';
import { ToastContainer } from './components/Toast';
import { useAnalysis, useTheme, useHistory, useToast } from './hooks';
import { ErrorType } from './services/geminiService';
import { getSharedAnalysis } from './services/shareService';
import { Flame, Search, X, AlertCircle, RefreshCw, Wifi, WifiOff, Moon, Sun, Settings, Info } from 'lucide-react';
import { AnalysisResult, AnalysisMode } from './types';

// Lazy loading dla Dashboard - ładuje się tylko gdy jest potrzebny
const Dashboard = lazy(() => import('./components/Dashboard'));

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const {
    query,
    setQuery,
    isLoading,
    result,
    error,
    errorType,
    validationError,
    processingStage,
    backendHealth,
    queuePosition,
    handleAnalyze,
    handleCancel,
    handleQueryChange,
    handleRetry,
    getStageProgress,
    setResult: setAnalysisResult,
  } = useAnalysis();
  
  const { addEntry, history, removeGibberishEntries } = useHistory();

  // Automatycznie wyczyść bezużyteczne wpisy z historii przy pierwszym załadowaniu
  useEffect(() => {
    const hasCleanedBefore = sessionStorage.getItem('history_cleaned_v2');
    if (!hasCleanedBefore && history.length > 0) {
      removeGibberishEntries();
      sessionStorage.setItem('history_cleaned_v2', 'true');
    }
  }, [history.length, removeGibberishEntries]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showNewAnalysisConfirm, setShowNewAnalysisConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('problem');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isQueryFocused, setIsQueryFocused] = useState(false);
  const currentAnalysisIdRef = useRef<string | null>(null);
  const analysisSourceRef = useRef<'new' | 'history' | 'shared' | null>(null); // Źródło analizy
  const savedAnalysisKeyRef = useRef<string | null>(null); // Klucz zapisanej analizy (query + summary)
  const queryInputRef = useRef<HTMLDivElement | null>(null); // Ref do kontenera pola zapytania
  const resultsSectionRef = useRef<HTMLDivElement | null>(null); // Ref do sekcji wyników
  const progressSectionRef = useRef<HTMLDivElement | null>(null); // Ref do sekcji progress
  
  // Rotating placeholders
  const placeholders = useMemo(() => {
    if (analysisMode === 'information') {
      return [
        'Czy w małym magazynie 50m² muszę montować hydrant wewnętrzny jeśli obok jest gaśnica?',
        'Jaki jest wymagany odstęp między gaśnicami w biurze?',
        'Czy muszę mieć system sygnalizacji pożarowej w sklepie?',
        'Jaka jest wymagana szerokość drogi ewakuacyjnej?',
      ];
    } else {
      return [
        'Czy w małym magazynie 50m² muszę montować hydrant wewnętrzny jeśli obok jest gaśnica?',
        'Mam biuro na 3 piętrze, czy muszę mieć system sygnalizacji pożarowej?',
        'Jakie są wymagania PPOŻ dla magazynu z materiałami łatwopalnymi?',
        'Czy mogę użyć gaśnic proszkowych w kuchni restauracyjnej?',
      ];
    }
  }, [analysisMode]);
  
  // Rotate placeholders
  useEffect(() => {
    if (!query && !isLoading) {
      const interval = setInterval(() => {
        setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [query, isLoading, placeholders.length]);
  
  // Suggestions based on query
  const suggestions = useMemo(() => {
    if (!query || query.length < 3) return [];
    const queryLower = query.toLowerCase();
    const allSuggestions = [
      'Czy w małym magazynie 50m² muszę montować hydrant wewnętrzny jeśli obok jest gaśnica?',
      'Jaki jest wymagany odstęp między gaśnicami w biurze?',
      'Czy muszę mieć system sygnalizacji pożarowej w sklepie?',
      'Jaka jest wymagana szerokość drogi ewakuacyjnej?',
      'Jakie są wymagania PPOŻ dla magazynu z materiałami łatwopalnymi?',
      'Czy mogę użyć gaśnic proszkowych w kuchni restauracyjnej?',
    ];
    return allSuggestions
      .filter(s => s.toLowerCase().includes(queryLower))
      .slice(0, 3);
  }, [query]);

  // Obsługa odczytu udostępnionej analizy z URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    
    if (shareId && !result && !isLoading) {
      analysisSourceRef.current = 'shared'; // Oznacz jako udostępniona
      getSharedAnalysis(shareId)
        .then((sharedResult) => {
          if (sharedResult) {
            setAnalysisResult(sharedResult);
            // Ustaw tryb na podstawie wyniku
            if (sharedResult.mode) {
              setAnalysisMode(sharedResult.mode);
            }
            // Opcjonalnie: wyczyść parametr z URL (bez przeładowania)
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            // Analiza nie została znaleziona lub wygasła
            console.warn('Shared analysis not found or expired');
            analysisSourceRef.current = null;
          }
        })
        .catch((err) => {
          console.error('Error loading shared analysis:', err);
          analysisSourceRef.current = null;
        });
    }
  }, []); // Uruchom tylko raz przy mount

  // Ustaw tryb na podstawie wyniku (jeśli wynik już istnieje)
  useEffect(() => {
    if (result && result.mode) {
      setAnalysisMode(result.mode);
    }
  }, [result]);

  // Automatyczne przewijanie gdy rozpoczyna się analiza (ukrywa tryby analizy)
  useEffect(() => {
    if (isLoading && processingStage !== 'idle') {
      // Poczekaj chwilę aby progress bar się pojawił w DOM
      const timer = setTimeout(() => {
        scrollToResults();
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, processingStage]);

  // Automatyczne przewijanie gdy analiza się kończy - ustaw górną krawędź query input na górze
  useEffect(() => {
    if (!isLoading && result && queryInputRef.current) {
      // Poczekaj chwilę aby progress bar zniknął i DOM się zaktualizował
      const timer = setTimeout(() => {
        if (queryInputRef.current) {
          const headerHeight = 80;
          const rect = queryInputRef.current.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + scrollTop;
          // Przewiń tak, aby górna krawędź query input była na górze (z uwzględnieniem headera)
          const targetPosition = elementTop - headerHeight;
          
          window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth'
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, result]);

  // Zapisz analizę do historii po zakończeniu
  useEffect(() => {
    if (!result || !query.trim() || isLoading) {
      return;
    }

    // NIE ZAPISUJ do historii tylko zapytań wykrytych jako bełkot
    const trimmedQuery = query.trim();
    
    // Nie zapisuj zapytań wykrytych jako bełkot (losowe ciągi znaków)
    const isGibberish = 
      result.summary.toLowerCase().includes('bełkot') ||
      result.summary.toLowerCase().includes('losowy ciąg') ||
      result.summary.toLowerCase().includes('nie jest sensownym pytaniem') ||
      (result.agents.legislator?.keyPoints?.some(kp => 
        kp.toLowerCase().includes('bełkot') || 
        kp.toLowerCase().includes('nie można analizować')
      )) ||
      (result.agents.legislator?.recommendationScore === 0 && result.citations.length === 0);
    
    if (isGibberish) {
      // Nie zapisuj zapytań wykrytych jako bełkot
      return;
    }
    

    // Stwórz unikalny klucz dla tej analizy
    const analysisKey = `${trimmedQuery}|${result.summary}`;
    
    // Sprawdź źródło analizy
    const source = analysisSourceRef.current;
    
    // Nie zapisuj analiz z historii lub udostępnionych
    if (source === 'history' || source === 'shared') {
      analysisSourceRef.current = null; // Reset flagi
      savedAnalysisKeyRef.current = analysisKey; // Zapamiętaj jako już załadowaną
      // Znajdź ID w historii jeśli to analiza z historii
      if (source === 'history') {
        const existingEntry = history.find(h => 
          h.query.trim() === trimmedQuery && 
          h.summary === result.summary
        );
        if (existingEntry) {
          currentAnalysisIdRef.current = existingEntry.id;
        }
      }
      return;
    }

    // Sprawdź czy to nie jest ta sama analiza co ostatnio zapisana
    if (savedAnalysisKeyRef.current === analysisKey) {
      return; // Już zapisana
    }

    // Sprawdź czy analiza już istnieje w historii (po query + summary)
    const existingEntry = history.find(h => 
      h.query.trim() === trimmedQuery && 
      h.summary === result.summary
    );

    // Jeśli już istnieje, nie zapisuj ponownie, tylko użyj jej ID
    if (existingEntry) {
      currentAnalysisIdRef.current = existingEntry.id;
      savedAnalysisKeyRef.current = analysisKey;
      return;
    }

    // To nowa analiza - zapisz ją
    try {
      addEntry(result, query);
      savedAnalysisKeyRef.current = analysisKey;
    } catch (error) {
      console.error('Błąd podczas zapisywania do historii:', error);
    }
    
    analysisSourceRef.current = null; // Reset flagi
  }, [result, query, isLoading, addEntry, history]);

  // Znajdź ID nowo zapisanej analizy po aktualizacji historii
  useEffect(() => {
    if (result && query.trim() && savedAnalysisKeyRef.current) {
      const analysisKey = `${query.trim()}|${result.summary}`;
      if (savedAnalysisKeyRef.current === analysisKey) {
        const entry = history.find(h => 
          h.query.trim() === query.trim() && 
          h.summary === result.summary
        );
        if (entry) {
          currentAnalysisIdRef.current = entry.id;
        }
      }
    }
  }, [history, result, query]);

  // Obsługa przywrócenia analizy z historii
  const handleSelectFromHistory = (analysisResult: AnalysisResult, originalQuery: string) => {
    analysisSourceRef.current = 'history'; // Oznacz jako z historii
    setAnalysisResult(analysisResult);
    setQuery(originalQuery);
    setSidebarOpen(false);
    // Znajdź ID tej analizy w historii
    const entry = history.find(h => 
      h.query.trim() === originalQuery.trim() && 
      h.summary === analysisResult.summary
    );
    if (entry) {
      currentAnalysisIdRef.current = entry.id;
      savedAnalysisKeyRef.current = `${originalQuery.trim()}|${analysisResult.summary}`;
    }
    // Przewiń do góry
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Znajdź ID bieżącej analizy w historii
  const currentAnalysisId = currentAnalysisIdRef.current || 
    (result && query && history.find(h => 
      h.query.trim() === query.trim() && 
      h.summary === result.summary &&
      Math.abs(h.timestamp - Date.now()) < 60000 // Z ostatniej minuty
    )?.id) || 
    null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleAnalyze(analysisMode);
    }
  };

  // Funkcja przewijania do pola zapytania
  const scrollToQueryInput = () => {
    if (queryInputRef.current) {
      // Użyj requestAnimationFrame aby upewnić się, że DOM jest gotowy
      requestAnimationFrame(() => {
        if (queryInputRef.current) {
          const headerHeight = 80; // Wysokość headera
          const rect = queryInputRef.current.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + scrollTop;
          const offsetPosition = elementTop - headerHeight;
          
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        }
      });
    }
  };

  // Funkcja przewijania do sekcji wyników/progress (ukrywa tryby analizy)
  const scrollToResults = () => {
    // Użyj requestAnimationFrame + setTimeout aby upewnić się, że DOM jest zaktualizowany
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Najpierw spróbuj znaleźć progress bar przez querySelector (bardziej niezawodne)
        const progressElement = document.querySelector('[data-progress-section]') as HTMLElement;
        const resultsElement = resultsSectionRef.current || document.querySelector('[data-tour="results-section"]') as HTMLElement;
        
        const headerHeight = 80;
        let targetPosition = 0;
        
        // Jeśli jest progress bar, przewiń do niego
        if (progressElement) {
          const rect = progressElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + scrollTop;
          // Większy offset aby ukryć tryby analizy (około 500px powyżej)
          targetPosition = elementTop - headerHeight - 150;
        }
        // Jeśli nie ma progress bara, ale jest sekcja wyników
        else if (resultsElement) {
          const rect = resultsElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + scrollTop;
          // Większy offset aby ukryć tryby analizy
          targetPosition = elementTop - headerHeight - 150;
        }
        // Fallback: przewiń do query input, ale z większym offsetem aby ukryć tryby
        else if (queryInputRef.current) {
          const rect = queryInputRef.current.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + scrollTop;
          // Przewiń tak, aby ukryć tryby analizy (około 500px powyżej)
          targetPosition = elementTop - headerHeight - 500;
        }
        
        if (targetPosition > 0) {
          window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth'
          });
        }
      }, 100);
    });
  };

  // Funkcja obsługująca kliknięcie przycisku "Rozpocznij analizę" / "Nowa analiza"
  const handleStartAnalysis = async () => {
    // Jeśli jest wynik, pokaż monit zamiast od razu czyścić
    if (result) {
      setShowNewAnalysisConfirm(true);
      return;
    }
    
    if (!query.trim() || isLoading) return;
    
    // Rozpocznij analizę - useEffect automatycznie przewinie gdy isLoading się zmieni
    handleAnalyze(analysisMode);
  };

  // Funkcja potwierdzająca rozpoczęcie nowej analizy
  const handleConfirmNewAnalysis = () => {
    setShowNewAnalysisConfirm(false);
    setAnalysisResult(null);
    setIsQueryFocused(true);
    // Przewiń do pola zapytania i ustaw fokus
    scrollToQueryInput();
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };

  // Funkcja anulująca rozpoczęcie nowej analizy
  const handleCancelNewAnalysis = () => {
    setShowNewAnalysisConfirm(false);
  };

  const getThemeIcon = () => {
    return theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />;
  };

  const handleLogoClick = () => {
    if (result || isLoading) {
      // Jeśli jest wynik lub trwa ładowanie, pokaż monit
      setShowExitConfirm(true);
    } else {
      // Jeśli nie ma wyniku, po prostu przewiń na górę
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfirmExit = () => {
    setAnalysisResult(null);
    setQuery('');
    // Błędy są czyszczone automatycznie przez useAnalysis przy zmianie query
    setShowExitConfirm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-slate-800 dark:via-slate-900 dark:to-black flex flex-col transition-colors duration-300">
        {/* Header */}
        <header className="bg-slate-900 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-950 dark:to-black text-white shadow-lg dark:shadow-orange sticky top-0 z-50 border-b border-slate-800 dark:border-slate-800 no-print">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer text-left"
              aria-label="Powrót do ekranu startowego"
            >
              <div className="bg-orange-600 dark:bg-orange-500 p-2 rounded-lg shadow-orange-500/20 shadow-lg dark:glow-orange flex-shrink-0">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight leading-tight dark:text-white dark:text-glow-white">Doradca PPOŻ</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">System Wsparcia Decyzji AI</p>
              </div>
            </button>
            <div className="hidden md:flex items-center gap-4 text-sm text-slate-300 dark:text-slate-400">
              <span>v3.0 (Mockup)</span>
              <div className="w-px h-4 bg-slate-700 dark:bg-slate-600"></div>
              {backendHealth !== null && (
                <span className="flex items-center gap-2">
                  {backendHealth ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500 dark:text-green-400" />
                      <span>Backend online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-500 dark:text-red-400" />
                      <span>Backend offline</span>
                    </>
                  )}
                </span>
              )}
              
              {queuePosition !== null && (
                <>
                  <div className="w-px h-4 bg-slate-700 dark:bg-slate-600"></div>
                  <span className="flex items-center gap-1 text-xs text-yellow-400">
                    <span>Kolejka:</span>
                    <span className="font-semibold">#{queuePosition}</span>
                  </span>
                </>
              )}
              <div className="w-px h-4 bg-slate-700 dark:bg-slate-600"></div>
              <button
                data-tour="history-button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 group relative ${
                  sidebarOpen 
                    ? 'bg-slate-800 dark:bg-slate-800' 
                    : 'hover:bg-slate-800 dark:hover:bg-slate-800'
                }`}
                aria-label={sidebarOpen ? "Zamknij ustawienia" : "Otwórz ustawienia"}
                title={sidebarOpen ? "Zamknij ustawienia" : "Ustawienia"}
              >
                <Settings className="w-4 h-4" />
                <span className="text-xs opacity-70 group-hover:opacity-100">
                  Ustawienia
                </span>
              </button>
              <div className="w-px h-4 bg-slate-700 dark:bg-slate-600"></div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 group"
                aria-label={`Przełącz na tryb ${theme === 'dark' ? 'jasny' : 'ciemny'}`}
                title={theme === 'dark' ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
              >
                {getThemeIcon()}
                <span className="text-xs opacity-70 group-hover:opacity-100">
                  {theme === 'dark' ? 'Jasny' : 'Ciemny'}
                </span>
              </button>
            </div>
            {/* Mobile: przycisk ustawień */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors relative ${
                sidebarOpen 
                  ? 'bg-slate-800 dark:bg-slate-800' 
                  : 'hover:bg-slate-800 dark:hover:bg-slate-800'
              }`}
              aria-label={sidebarOpen ? "Zamknij ustawienia" : "Otwórz ustawienia"}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          
          {/* Search Section */}
          <div className="mb-8 max-w-3xl mx-auto text-center no-print">
              {!result && (
                   <div className="mb-10">
                      {/* Hero Title */}
                      <div className="mb-6">
                        <h1 className="text-h1 font-semibold text-slate-900 dark:text-white mb-4 text-center">
                          {analysisMode === 'information' ? (
                            <>
                              Zapytaj o przepisy{' '}
                              <span className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                                PPOŻ/BHP
                              </span>
                            </>
                          ) : (
                            <>
                              Opisz problem{' '}
                              <span className="bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-400 dark:to-orange-300 bg-clip-text text-transparent">
                                PPOŻ/BHP
                              </span>
                            </>
                          )}
                        </h1>
                        
                        {/* Subtitle with icon and badge */}
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center gap-3 flex-wrap justify-center">
                            {analysisMode === 'information' ? (
                              <>
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                    Otrzymaj szczegółową odpowiedź opartą na przepisach prawnych
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                  <p className="text-sm font-medium text-orange-900 dark:text-orange-300">
                                    Otrzymaj analizę z 3 perspektyw wspieranych przez AI
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                   </div>
              )}
              
              {/* Mode Selector Info */}
              {!result && (
                <div className="mb-6 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-gray-300 dark:to-slate-600"></div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 px-4">
                      Wybierz tryb analizy
                    </p>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-300 dark:via-slate-600 to-gray-300 dark:to-slate-600"></div>
                  </div>
                </div>
              )}
              
              {/* Mode Selector - Cards */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <button
                  type="button"
                  onClick={() => !isLoading && setAnalysisMode('information')}
                    disabled={isLoading}
                  className={`relative p-6 rounded-xl border-2 transition-all text-left group ${
                    analysisMode === 'information'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 shadow-lg shadow-blue-500/10'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Icon Circle */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${
                    analysisMode === 'information'
                      ? 'bg-blue-500 dark:bg-blue-400'
                      : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                  }`}>
                    <Info className={`w-6 h-6 ${
                      analysisMode === 'information'
                        ? 'text-white'
                        : 'text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-h4 font-semibold mb-2 ${
                      analysisMode === 'information'
                        ? 'text-blue-900 dark:text-blue-200'
                        : 'text-gray-900 dark:text-slate-200'
                    }`}>
                      Informacja
                    </h3>
                    <p className={`text-sm mb-3 leading-[1.6] ${
                      analysisMode === 'information'
                        ? 'text-blue-800 dark:text-blue-300'
                        : 'text-gray-600 dark:text-slate-400'
                    }`}>
                      Tryb Wyszukiwania Prawnego. <br />
                      Znajduje przepisy i regulacje, oferując odpowiedź opartą ściśle na aktach prawnych.
                    </p>
                    <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-current/10">
                      <span className={`text-xs font-medium ${
                        analysisMode === 'information'
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-gray-500 dark:text-slate-500'
                      }`}>
                        Idealny dla:
                  </span>
                      <span className={`text-xs italic ${
                        analysisMode === 'information'
                          ? 'text-blue-600 dark:text-blue-500'
                          : 'text-gray-400 dark:text-slate-500'
                      }`}>
                        "Czy mogę...?", "Jaki jest wymóg...?"
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => !isLoading && setAnalysisMode('problem')}
                    disabled={isLoading}
                  className={`relative p-6 rounded-xl border-2 transition-all text-left group ${
                    analysisMode === 'problem'
                      ? 'border-orange-500 dark:border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/30 dark:to-orange-800/20 shadow-lg shadow-orange-500/10'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Icon Circle */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${
                    analysisMode === 'problem'
                      ? 'bg-orange-500 dark:bg-orange-400'
                      : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30'
                  }`}>
                    <AlertCircle className={`w-6 h-6 ${
                      analysisMode === 'problem'
                        ? 'text-white'
                        : 'text-gray-400 dark:text-slate-500 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-h4 font-semibold mb-2 ${
                      analysisMode === 'problem'
                        ? 'text-orange-900 dark:text-orange-200'
                        : 'text-gray-900 dark:text-slate-200'
                    }`}>
                      Problem
                    </h3>
                    <p className={`text-sm mb-3 leading-[1.6] ${
                      analysisMode === 'problem'
                        ? 'text-orange-800 dark:text-orange-300'
                        : 'text-gray-600 dark:text-slate-400'
                    }`}>
                      Tryb Kompleksowej Analizy Problemu. <br />
                      System przedstawi trzy perspektywy:
                      Prawnika, Praktyka Biznesowego oraz Audytora.
                    </p>
                    <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-current/10">
                      <span className={`text-xs font-medium ${
                        analysisMode === 'problem'
                          ? 'text-orange-700 dark:text-orange-400'
                          : 'text-gray-500 dark:text-slate-500'
                      }`}>
                        Idealny dla:
                  </span>
                      <span className={`text-xs italic ${
                        analysisMode === 'problem'
                          ? 'text-orange-600 dark:text-orange-500'
                          : 'text-gray-400 dark:text-slate-500'
                      }`}>
                        złożonych sytuacji biznesowych
                      </span>
                    </div>
                  </div>
                </button>
              </div>
              
                  <div className="relative group" data-tour="query-input" ref={queryInputRef}>
                  <div className="absolute -inset-0.5 bg-orange-600 dark:bg-orange-500 rounded-xl blur opacity-30 dark:opacity-20 group-hover:opacity-50 dark:group-hover:opacity-30 transition duration-1000 dark:glow-orange"></div>
                  <div className="relative flex flex-col md:flex-row gap-2 bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 p-2 rounded-xl shadow-xl dark:shadow-orange border border-slate-200 dark:border-slate-700">
                      <div className="flex-1 relative">
                          <textarea
                              value={query}
                              onChange={(e) => handleQueryChange(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onFocus={() => setIsQueryFocused(true)}
                              onBlur={() => setIsQueryFocused(false)}
                              placeholder="Np. Czy w małym magazynie 50m2 muszę montować hydrant wewnętrzny jeśli obok jest gaśnica?"
                              maxLength={1000}
                              className={`w-full min-h-[60px] max-h-[120px] p-3 outline-none resize-none rounded-lg focus:bg-slate-50 dark:focus:bg-slate-700/50 border-2 transition-colors bg-transparent ${
                                result && !isQueryFocused
                                  ? 'text-slate-400 dark:text-slate-500 placeholder-slate-400 dark:placeholder-slate-500'
                                  : 'text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500'
                              } ${
                                validationError 
                                  ? 'border-red-300 dark:border-red-600 focus:border-red-400 dark:focus:border-red-500' 
                                  : 'border-transparent focus:border-blue-300 dark:focus:border-blue-500'
                              }`}
                              disabled={isLoading}
                              aria-invalid={!!validationError}
                              aria-describedby={validationError ? "query-error" : undefined}
                          />
                          <div className="absolute bottom-2 right-2 flex items-center gap-2">
                              <span className={`text-xs ${query.length > 1000 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                  {query.length}/1000
                              </span>
                              <Tooltip 
                                  content="Opisz problemjak najszczegółowiej. Minimum 10 znaków, maksimum 1000 znaków."
                                  icon
                              />
                          </div>
                      </div>
                      <div className="flex gap-2">
                          {isLoading && (
                              <button
                                  onClick={() => setShowCancelConfirm(true)}
                                  className="px-4 py-3 rounded-lg font-medium text-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                  aria-label="Anuluj zapytanie"
                              >
                                  <X className="w-4 h-4" />
                                  Anuluj
                              </button>
                          )}
                          <button
                              onClick={handleStartAnalysis}
                              disabled={isLoading || (!result && !query.trim())}
                              className={`px-10 py-4 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-3 transition-all shadow-lg
                                  ${isLoading || (!result && !query.trim())
                                      ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed opacity-60' 
                                      : 'bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-500 dark:to-orange-600 hover:from-orange-700 hover:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 shadow-orange-500/20 dark:shadow-orange-400/20 hover:shadow-orange-500/30 dark:hover:shadow-orange-400/30 hover:scale-105 active:scale-95 transform'
                                  }`}
                          >
                              {isLoading ? (
                                  <>
                                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Analizowanie...</span>
                                  </>
                              ) : result ? (
                                  <>
                                      <Search className="w-6 h-6" />
                                      <span>Nowa analiza</span>
                                  </>
                              ) : (
                                  <>
                                      <Search className="w-6 h-6" />
                                      <span>Rozpocznij analizę</span>
                                  </>
                              )}
                          </button>
                      </div>
                  </div>
                  {validationError && (
                      <div 
                          id="query-error"
                          className="mt-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                          role="alert"
                      >
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>{validationError}</span>
                      </div>
                  )}
              </div>
              
              {/* Enhanced Progress Indicator */}
              <div ref={progressSectionRef} data-progress-section>
              {isLoading && processingStage !== 'idle' && (
                    <ProgressIndicator 
                        stage={processingStage}
                        progress={getStageProgress(processingStage)}
                    />
                )}
              </div>
              
              {/* Queue Position during loading */}
              {isLoading && queuePosition !== null && (
                  <div className="mt-4 max-w-3xl mx-auto text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <span className="text-sm text-yellow-700 dark:text-yellow-400">
                              Pozycja w kolejce: <span className="font-semibold">#{queuePosition}</span>
                          </span>
                      </div>
                      </div>
              )}
              
              {!result && !isLoading && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
                      <span className="text-slate-400 dark:text-slate-500">Spróbuj zapytać o:</span>
                      <button onClick={() => setQuery("Jaka jest wymagana szerokość drogi ewakuacyjnej w biurze dla 200 osób?")} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
                          Szerokość ewakuacji
                      </button>
                      <button onClick={() => setQuery("Czy gaśnice muszą wisieć na ścianie czy mogą stać na podłodze?")} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
                          Rozmieszczenie gaśnic
                      </button>
                  </div>
              )}
          </div>

          {/* Error State */}
          {error && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                errorType === ErrorType.NETWORK || errorType === ErrorType.TIMEOUT
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300'
                  : errorType === ErrorType.RATE_LIMIT
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300'
                  : errorType === ErrorType.SERVER_ERROR
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">{error}</p>
                  {errorType === ErrorType.NETWORK && (
                    <p className="text-sm opacity-80">Sprawdź połączenie internetowe i spróbuj ponownie.</p>
                  )}
                  {errorType === ErrorType.TIMEOUT && (
                    <p className="text-sm opacity-80">Zapytanie trwało zbyt długo. Spróbuj ponownie lub uprość pytanie.</p>
                  )}
                  {errorType === ErrorType.SERVER_ERROR && (
                    <p className="text-sm opacity-80">Serwer tymczasowo niedostępny. Spróbuj ponownie za chwilę.</p>
                  )}
                  {errorType === ErrorType.RATE_LIMIT && (
                    <p className="text-sm opacity-80">Przekroczono limit zapytań na minutę. Poczekaj chwilę przed następnym zapytaniem.</p>
                  )}
                </div>
                <button
                  onClick={() => handleRetry(analysisMode)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-current rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-4 h-4" />
                  Spróbuj ponownie
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          <div ref={resultsSectionRef} data-tour="results-section">
            <ErrorBoundary>
              <Suspense fallback={
                <div className="max-w-4xl mx-auto mt-12 space-y-8 animate-pulse">
                  <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                  </div>
                </div>
              }>
                {result && <Dashboard data={result} isLoading={false} onShowToast={showSuccess} onShowError={showError} />}
                {isLoading && !result && <Dashboard isLoading={true} />}
              </Suspense>
            </ErrorBoundary>
          </div>

        </main>

        {/* Dialog potwierdzający wyjście */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-slate-700 animate-fade-in">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-200 mb-2">
                      Opuścić raport?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Powrót do ekranu startowego spowoduje utratę bieżącego raportu. 
                      {result && ' Upewnij się, że zapisałeś raport (PDF/DOCX) jeśli jest potrzebny.'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCancelExit}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleConfirmExit}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 rounded-lg transition-colors"
                  >
                    Opuść raport
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dialog potwierdzający rozpoczęcie nowej analizy */}
        {showNewAnalysisConfirm && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-slate-700 animate-fade-in">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-200 mb-2">
                      Rozpocząć nową analizę?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Rozpoczęcie nowej analizy spowoduje utratę bieżącego raportu. 
                      Upewnij się, że zapisałeś raport (PDF/DOCX) jeśli jest potrzebny.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCancelNewAnalysis}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleConfirmNewAnalysis}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 rounded-lg transition-colors"
                  >
                    Tak, rozpocznij nową
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white dark:bg-gradient-to-t dark:from-slate-900 dark:to-black border-t border-slate-200 dark:border-slate-800 mt-auto no-print">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Doradca PPOŻ AI. Aplikacja w wersji demonstracyjnej.</p>
            <p className="mt-1">Pamiętaj: Sztuczna inteligencja może popełniać błędy. Zawsze konsultuj decyzje z uprawnionym rzeczoznawcą.</p>
          </div>
        </footer>

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectAnalysis={handleSelectFromHistory}
          currentAnalysisId={currentAnalysisId}
          onQueryClick={(query) => {
            setQuery(query);
            setSidebarOpen(false);
            // Przewiń do pola zapytania
            setTimeout(() => {
              const input = document.querySelector('[data-tour="query-input"] textarea') as HTMLElement;
              if (input) {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                input.focus();
              }
            }, 100);
          }}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Cancel Confirmation Modal */}
        <ConfirmModal
          isOpen={showCancelConfirm}
          title="Anulować analizę?"
          message="Czy na pewno chcesz anulować bieżącą analizę? Postęp zostanie utracony."
          confirmText="Tak, anuluj"
          cancelText="Nie, kontynuuj"
          confirmVariant="destructive"
          onConfirm={() => {
            handleCancel();
            setShowCancelConfirm(false);
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;