import React, { useState } from 'react';
import { analyzeSafetyQuery } from './services/geminiService';
import { AnalysisResult } from './types';
import Dashboard from './components/Dashboard';
import { Flame, Search, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeSafetyQuery(query);
      setResult(data);
    } catch (err) {
      setError("Wystąpił błąd podczas analizy. Sprawdź połączenie lub spróbuj ponownie.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg shadow-orange-500/20 shadow-lg">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Doradca PPOŻ</h1>
              <p className="text-xs text-slate-400">System Wsparcia Decyzji AI</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-300">
            <span>v1.0.0 (Mockup)</span>
            <div className="w-px h-4 bg-slate-700"></div>
            <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                System gotowy
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        
        {/* Search Section */}
        <div className="mb-8 max-w-3xl mx-auto text-center">
            {!result && (
                 <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">Opisz problem PPOŻ/BHP</h2>
                    <p className="text-slate-500">
                        Otrzymaj analizę od Prawnika, Praktyka i Audytora w 10 sekund.
                    </p>
                 </div>
            )}
            
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-orange-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative flex flex-col md:flex-row gap-2 bg-white p-2 rounded-xl shadow-xl">
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Np. Czy w małym magazynie 50m2 muszę montować hydrant wewnętrzny jeśli obok jest gaśnica?"
                        className="flex-1 w-full min-h-[60px] max-h-[120px] p-3 text-slate-700 placeholder-slate-400 outline-none resize-none rounded-lg focus:bg-slate-50"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !query.trim()}
                        className={`px-8 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all
                            ${isLoading || !query.trim() 
                                ? 'bg-slate-300 cursor-not-allowed' 
                                : 'bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl active:scale-95'
                            }`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                Analizuj
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {!result && !isLoading && (
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
                    <span className="text-slate-400">Spróbuj zapytać o:</span>
                    <button onClick={() => setQuery("Jaka jest wymagana szerokość drogi ewakuacyjnej w biurze dla 20 osób?")} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                        Szerokość ewakuacji
                    </button>
                    <button onClick={() => setQuery("Czy gaśnice muszą wisieć na ścianie czy mogą stać na podłodze?")} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                        Rozmieszczenie gaśnic
                    </button>
                </div>
            )}
        </div>

        {/* Error State */}
        {error && (
          <div className="max-w-3xl mx-auto p-4 mb-8 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
             <div className="p-2 bg-white rounded-full">!</div>
             {error}
          </div>
        )}

        {/* Results */}
        {result && <Dashboard data={result} />}
        
        {/* Loading Skeleton */}
        {isLoading && !result && (
            <div className="max-w-4xl mx-auto mt-12 space-y-8 animate-pulse">
                <div className="h-40 bg-slate-200 rounded-xl w-full"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Doradca PPOŻ AI. Aplikacja w wersji demonstracyjnej.</p>
          <p className="mt-1">Pamiętaj: Sztuczna inteligencja może popełniać błędy. Zawsze konsultuj decyzje z uprawnionym rzeczoznawcą.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;