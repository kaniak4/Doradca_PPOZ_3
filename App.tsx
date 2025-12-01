import React, { lazy, Suspense, useEffect, useState, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Tooltip from './components/Tooltip';
import Sidebar from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import { useAnalysis, useTheme, useHistory, useToast } from './hooks';
import { ErrorType } from './services/geminiService';
import { getSharedAnalysis } from './services/shareService';
import { Flame, Search, X, AlertCircle, RefreshCw, Wifi, WifiOff, Moon, Sun, History, HelpCircle } from 'lucide-react';
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
    handleAnalyze,
    handleCancel,
    handleQueryChange,
    handleRetry,
    getStageLabel,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('problem');
  const currentAnalysisIdRef = useRef<string | null>(null);
  const analysisSourceRef = useRef<'new' | 'history' | 'shared' | null>(null); // Źródło analizy
  const savedAnalysisKeyRef = useRef<string | null>(null); // Klucz zapisanej analizy (query + summary)

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
        {/* Header */}
        <header className="bg-slate-900 dark:bg-slate-950 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800 dark:border-slate-800 no-print">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer text-left"
              aria-label="Powrót do ekranu startowego"
            >
              <div className="bg-orange-600 dark:bg-orange-500 p-2 rounded-lg shadow-orange-500/20 shadow-lg flex-shrink-0">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight leading-tight">Doradca PPOŻ</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">System Wsparcia Decyzji AI</p>
              </div>
            </button>
            <div className="hidden md:flex items-center gap-4 text-sm text-slate-300 dark:text-slate-400">
              <span>v2.0 (Mockup)</span>
              <div className="w-px h-4 bg-slate-700 dark:bg-slate-600"></div>
              {backendHealth !== null && (
                <span className="flex items-center gap-1">
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
              <div className="w-px h-4 bg-slate-700 dark:bg-slate-600"></div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 group relative ${
                  sidebarOpen 
                    ? 'bg-slate-800 dark:bg-slate-800' 
                    : 'hover:bg-slate-800 dark:hover:bg-slate-800'
                }`}
                aria-label={sidebarOpen ? "Zamknij historię analiz" : "Otwórz historię analiz"}
                title={sidebarOpen ? "Zamknij historię analiz" : "Historia analiz"}
              >
                <History className="w-4 h-4" />
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-orange-600 dark:bg-orange-500 text-white rounded-full min-w-[18px] flex items-center justify-center">
                    {history.length > 9 ? '9+' : history.length}
                  </span>
                )}
                <span className="text-xs opacity-70 group-hover:opacity-100">
                  Historia
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
            {/* Mobile: przycisk historii */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors relative ${
                sidebarOpen 
                  ? 'bg-slate-800 dark:bg-slate-800' 
                  : 'hover:bg-slate-800 dark:hover:bg-slate-800'
              }`}
              aria-label={sidebarOpen ? "Zamknij historię analiz" : "Otwórz historię analiz"}
            >
              <History className="w-5 h-5" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-orange-600 dark:bg-orange-500 text-white rounded-full min-w-[18px] flex items-center justify-center">
                  {history.length > 9 ? '9+' : history.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          
          {/* Search Section */}
          <div className="mb-8 max-w-3xl mx-auto text-center no-print">
              {!result && (
                   <div className="mb-8">
                      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                        {analysisMode === 'information' ? 'Zapytaj o przepisy PPOŻ/BHP' : 'Opisz problem PPOŻ/BHP'}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400">
                        {analysisMode === 'information' 
                          ? 'Otrzymaj szczegółową odpowiedź opartą na przepisach prawnych.'
                          : 'Otrzymaj analizę od Prawnika, Praktyka i Audytora w 10 sekund.'}
                      </p>
                   </div>
              )}
              
              {/* Mode Selector */}
              <div className="mb-4 flex items-center justify-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="analysisMode"
                    value="information"
                    checked={analysisMode === 'information'}
                    onChange={(e) => setAnalysisMode(e.target.value as AnalysisMode)}
                    disabled={isLoading}
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-slate-600 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1">
                    Informacja
                    <Tooltip
                      content="Tryb dla pytań o przepisy i regulacje. System znajdzie wszystkie odpowiednie przepisy prawne i przedstawi szczegółową odpowiedź opartą wyłącznie na źródłach prawnych. Idealny dla pytań typu 'Czy mogę...?' lub 'Jaki jest wymóg...?'"
                      icon
                    >
                      <HelpCircle className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    </Tooltip>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="analysisMode"
                    value="problem"
                    checked={analysisMode === 'problem'}
                    onChange={(e) => setAnalysisMode(e.target.value as AnalysisMode)}
                    disabled={isLoading}
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-slate-600 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1">
                    Problem
                    <Tooltip
                      content="Tryb dla kompleksowej analizy problemu. System przedstawi trzy perspektywy: Prawnika (zgodność z przepisami), Praktyka Biznesowego (koszty i praktyczność) oraz Audytora Ryzyka (synteza i rekomendacja). Idealny dla złożonych sytuacji wymagających decyzji."
                      icon
                    >
                      <HelpCircle className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    </Tooltip>
                  </span>
                </label>
              </div>
              
              <div className="relative group">
                  <div className="absolute -inset-0.5 bg-orange-600 dark:bg-orange-500 rounded-xl blur opacity-30 dark:opacity-20 group-hover:opacity-50 dark:group-hover:opacity-30 transition duration-1000"></div>
                  <div className="relative flex flex-col md:flex-row gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-700">
                      <div className="flex-1 relative">
                          <textarea
                              value={query}
                              onChange={(e) => handleQueryChange(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Np. Czy w małym magazynie 50m2 muszę montować hydrant wewnętrzny jeśli obok jest gaśnica?"
                              className={`w-full min-h-[60px] max-h-[120px] p-3 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none rounded-lg focus:bg-slate-50 dark:focus:bg-slate-700/50 border-2 transition-colors bg-transparent ${
                                validationError 
                                  ? 'border-red-300 dark:border-red-600 focus:border-red-400 dark:focus:border-red-500' 
                                  : 'border-transparent focus:border-blue-300 dark:focus:border-blue-500'
                              }`}
                              disabled={isLoading}
                              aria-invalid={!!validationError}
                              aria-describedby={validationError ? "query-error" : undefined}
                          />
                          <div className="absolute bottom-2 right-2 flex items-center gap-2">
                              <span className={`text-xs ${query.length > 2000 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                  {query.length}/2000
                              </span>
                              <Tooltip 
                                  content="Opisz problemjak najszczegółowiej. Minimum 10 znaków, maksimum 2000 znaków."
                                  icon
                              />
                          </div>
                      </div>
                      <div className="flex gap-2">
                          {isLoading && (
                              <button
                                  onClick={handleCancel}
                                  className="px-4 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                                  aria-label="Anuluj zapytanie"
                              >
                                  <X className="w-5 h-5" />
                                  Anuluj
                              </button>
                          )}
                          <button
                              onClick={() => handleAnalyze(analysisMode)}
                              disabled={isLoading || !query.trim()}
                              className={`px-8 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all
                                  ${isLoading || !query.trim() 
                                      ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed' 
                                      : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 shadow-lg hover:shadow-xl active:scale-95'
                                  }`}
                          >
                              {isLoading ? (
                                  'Analizowanie...'
                              ) : (
                                  <>
                                      <Search className="w-5 h-5" />
                                      Analizuj
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
              
              {/* Progress Bar */}
              {isLoading && processingStage !== 'idle' && (
                  <div className="mt-4 max-w-3xl mx-auto">
                      <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {getStageLabel(processingStage)}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                              {getStageProgress(processingStage)}%
                          </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                          <div 
                              className="bg-orange-600 dark:bg-orange-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${getStageProgress(processingStage)}%` }}
                          />
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
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 rounded-lg transition-colors"
                  >
                    Opuść raport
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto no-print">
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
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </ErrorBoundary>
  );
};

export default App;