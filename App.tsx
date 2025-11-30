import React, { lazy, Suspense, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Tooltip from './components/Tooltip';
import { useAnalysis, useTheme } from './hooks';
import { ErrorType } from './services/geminiService';
import { getSharedAnalysis } from './services/shareService';
import { Flame, Search, X, AlertCircle, RefreshCw, Wifi, WifiOff, Moon, Sun } from 'lucide-react';

// Lazy loading dla Dashboard - ładuje się tylko gdy jest potrzebny
const Dashboard = lazy(() => import('./components/Dashboard'));

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
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

  // Obsługa odczytu udostępnionej analizy z URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    
    if (shareId && !result && !isLoading) {
      getSharedAnalysis(shareId)
        .then((sharedResult) => {
          if (sharedResult) {
            setAnalysisResult(sharedResult);
            // Opcjonalnie: wyczyść parametr z URL (bez przeładowania)
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            // Analiza nie została znaleziona lub wygasła
            console.warn('Shared analysis not found or expired');
          }
        })
        .catch((err) => {
          console.error('Error loading shared analysis:', err);
        });
    }
  }, []); // Uruchom tylko raz przy mount

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const getThemeIcon = () => {
    return theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
        {/* Header */}
        <header className="bg-slate-900 dark:bg-slate-950 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800 dark:border-slate-800 no-print">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 dark:bg-orange-500 p-2 rounded-lg shadow-orange-500/20 shadow-lg">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Doradca PPOŻ</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500">System Wsparcia Decyzji AI</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm text-slate-300 dark:text-slate-400">
              <span>v1.0.0 (Mockup)</span>
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
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          
          {/* Search Section */}
          <div className="mb-8 max-w-3xl mx-auto text-center no-print">
              {!result && (
                   <div className="mb-8">
                      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">Opisz problem PPOŻ/BHP</h2>
                      <p className="text-slate-500 dark:text-slate-400">
                          Otrzymaj analizę od Prawnika, Praktyka i Audytora w 10 sekund.
                      </p>
                   </div>
              )}
              
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
                                  content="Opisz problem PPOŻ/BHP jak najszczegółowiej. Minimum 10 znaków, maksimum 2000 znaków."
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
                              onClick={handleAnalyze}
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
                      <button onClick={() => setQuery("Jaka jest wymagana szerokość drogi ewakuacyjnej w biurze dla 20 osób?")} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
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
                  onClick={handleRetry}
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
              {result && <Dashboard data={result} isLoading={false} />}
              {isLoading && !result && <Dashboard isLoading={true} />}
            </Suspense>
          </ErrorBoundary>

        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto no-print">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Doradca PPOŻ AI. Aplikacja w wersji demonstracyjnej.</p>
            <p className="mt-1">Pamiętaj: Sztuczna inteligencja może popełniać błędy. Zawsze konsultuj decyzje z uprawnionym rzeczoznawcą.</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;