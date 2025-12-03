import React, { useState, useMemo, useRef } from 'react';
import { HistoryEntry, AnalysisResult } from '../types';
import { useHistory } from '../hooks/useHistory';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../hooks/useToast';
import { 
  History as HistoryIcon, 
  X, 
  Search, 
  Trash2, 
  Calendar,
  FileText,
  ChevronRight,
  Settings,
  User,
  Info,
  AlertCircle,
  Sparkles,
  BookOpen,
  Shield,
  Zap
} from 'lucide-react';

// Example queries for empty state
const EXAMPLE_QUERIES = [
  {
    query: "Jaka jest wymagana szerokość drogi ewakuacyjnej w biurze dla 200 osób?",
    icon: <Zap className="w-4 h-4" />,
    category: "Ewakuacja"
  },
  {
    query: "Czy gaśnice muszą wisieć na ścianie czy mogą stać na podłodze?",
    icon: <Shield className="w-4 h-4" />,
    category: "Sprzęt PPOŻ"
  },
  {
    query: "Jakie są wymagania dotyczące hydrantów wewnętrznych w magazynie?",
    icon: <BookOpen className="w-4 h-4" />,
    category: "Przepisy"
  },
];

// Empty History State Component
const EmptyHistoryState: React.FC<{ onQueryClick?: (query: string) => void }> = ({ onQueryClick }) => {
  return (
    <div className="py-8 px-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-200 mb-2">
          Jak zacząć?
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Wprowadź swoje pierwsze zapytanie dotyczące PPOŻ/BHP, a otrzymasz szczegółową analizę prawną.
        </p>
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Przykładowe zapytania:
        </p>
        {EXAMPLE_QUERIES.map((example, idx) => (
          <button
            key={idx}
            onClick={() => onQueryClick?.(example.query)}
            className="w-full text-left p-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                {example.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                    {example.category}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2 group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">
                  {example.query}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Wskazówka:</p>
            <p>Opisz problem jak najszczegółowiej. System przeanalizuje go pod kątem przepisów prawnych i przedstawi rekomendacje.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (result: AnalysisResult, query: string) => void;
  currentAnalysisId?: string | null;
  onQueryClick?: (query: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis,
  currentAnalysisId,
  onQueryClick,
}) => {
  const { history, isLoading, removeEntry, clearHistory, searchHistory, addEntry } = useHistory();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['history']));
  const deletedEntryRef = useRef<HistoryEntry | null>(null);

  // Filtruj historię na podstawie wyszukiwania
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) {
      return history;
    }
    return searchHistory(searchTerm);
  }, [history, searchTerm, searchHistory]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSelectEntry = (entry: HistoryEntry) => {
    onSelectAnalysis(entry.fullResult, entry.query);
    onClose(); // Zamknij sidebar po wyborze
  };

  const handleRemoveEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Zapobiegaj wywołaniu handleSelectEntry
    
    const entry = history.find(h => h.id === id);
    if (entry) {
      // Optimistic update - usuń od razu z UI
      deletedEntryRef.current = entry;
      removeEntry(id);
      
      // Pokaż toast z możliwością cofnięcia
      showToast(
        `Analiza "${entry.query.substring(0, 40)}${entry.query.length > 40 ? '...' : ''}" usunięta`,
        'success',
        5000,
        undefined,
        {
          label: 'Cofnij',
          onClick: () => {
            if (deletedEntryRef.current) {
              addEntry(deletedEntryRef.current.fullResult, deletedEntryRef.current.query);
              deletedEntryRef.current = null;
            }
          }
        }
      );
    }
  };

  const handleClearAll = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;
    
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <>
      {/* Overlay - tło przy otwartym sidebarze z glassmorphism */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - overlay na wszystkich rozdzielczościach z glassmorphism */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl dark:shadow-blue z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col border-l border-white/20 dark:border-slate-700/50`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white dark:text-glow-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Ustawienia
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Zamknij sidebar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Sekcja: Jak zacząć */}
          <div className="border-b border-gray-200 dark:border-slate-700">
            <button
              onClick={() => toggleSection('getting-started')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-gray-900 dark:text-white dark:text-glow-white">
                  Jak zacząć?
                </span>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-gray-400 dark:text-slate-500 transition-transform ${
                  expandedSections.has('getting-started') ? 'rotate-90' : ''
                }`}
              />
            </button>

            {expandedSections.has('getting-started') && (
              <div>
                <EmptyHistoryState onQueryClick={onQueryClick} />
              </div>
            )}
          </div>

          {/* Sekcja: Historia */}
          <div className="border-b border-gray-200 dark:border-slate-700">
            <button
              onClick={() => toggleSection('history')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HistoryIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-900 dark:text-white dark:text-glow-white">
                  Historia Analiz
                </span>
                {history.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {searchTerm.trim() ? filteredHistory.length : history.length}
                  </span>
                )}
              </div>
              <ChevronRight
                className={`w-5 h-5 text-gray-400 dark:text-slate-500 transition-transform ${
                  expandedSections.has('history') ? 'rotate-90' : ''
                }`}
              />
            </button>

            {expandedSections.has('history') && (
              <div className="p-4 space-y-4">
                {/* Wyszukiwanie */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Szukaj w historii..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:shadow-blue"
                  />
                </div>

                {/* Lista historii */}
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400 text-sm">
                    Ładowanie historii...
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400 text-sm">
                    {searchTerm ? 'Nie znaleziono analiz pasujących do wyszukiwania' : 'Brak historii analiz'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredHistory.map((entry) => {
                      const isCurrent = entry.id === currentAnalysisId;
                      return (
                        <div
                          key={entry.id}
                          onClick={() => handleSelectEntry(entry)}
                          className={`group relative p-3 rounded-lg border cursor-pointer transition-all ${
                            isCurrent
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                              : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500'
                          }`}
                        >
                          {/* Przycisk usuwania - nachodzi tylko na tytuł */}
                          <button
                            onClick={(e) => handleRemoveEntry(e, entry.id)}
                            className="absolute top-2 right-2 p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            aria-label="Usuń z historii"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>

                          {/* Treść wpisu */}
                          <div>
                            {/* Tytuł - z padding-right dla ikony kosza */}
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-200 line-clamp-2 mb-2 pr-10">
                              {entry.query}
                            </p>
                            {/* Podtytuł - bez padding-right, pełna szerokość */}
                            <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-1 mb-2">
                              {entry.summary}
                            </p>

                            {/* Metadane - wszystko w jednej linii */}
                            <div className="flex items-center gap-1.5 flex-nowrap mt-2 overflow-hidden">
                              <span className="text-xs text-gray-500 dark:text-slate-500 flex items-center gap-1 flex-shrink-0">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="whitespace-nowrap">{formatDate(entry.timestamp)}</span>
                              </span>
                              <span className="text-gray-400 dark:text-slate-600 flex-shrink-0">•</span>
                              <span className="text-xs text-gray-500 dark:text-slate-500 flex items-center gap-1 flex-shrink-0">
                                {entry.fullResult.mode === 'information' ? (
                                  <>
                                    <Info className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                    <span className="text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">Info</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3 h-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                    <span className="text-orange-600 dark:text-orange-400 font-medium whitespace-nowrap">Problem</span>
                                  </>
                                )}
                              </span>
                              <span className="text-gray-400 dark:text-slate-600 flex-shrink-0">•</span>
                              <span className="text-xs text-gray-500 dark:text-slate-500 flex items-center gap-1 flex-shrink-0">
                                <FileText className="w-3 h-3 flex-shrink-0" />
                                <span className="whitespace-nowrap">{entry.citationsCount} cyt.</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Przycisk wyczyść wszystko */}
                {history.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                    {!showClearConfirm ? (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Wyczyść całą historię
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600 dark:text-slate-400 text-center">
                          Na pewno usunąć całą historię?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowClearConfirm(false)}
                            className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                          >
                            Anuluj
                          </button>
                          <button
                            onClick={handleClearAll}
                            className="flex-1 px-3 py-2 text-sm text-white bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 rounded-lg transition-colors"
                          >
                            Usuń
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sekcja: Ustawienia (placeholder dla przyszłości) */}
          <div className="border-b border-gray-200 dark:border-slate-700">
            <button
              onClick={() => toggleSection('settings')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              disabled
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                <span className="font-semibold text-gray-400 dark:text-slate-500">
                  Ustawienia
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-500 italic">
                Wkrótce
              </span>
            </button>
          </div>

          {/* Sekcja: Konto (placeholder dla przyszłości) */}
          <div>
            <button
              onClick={() => toggleSection('account')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              disabled
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                <span className="font-semibold text-gray-400 dark:text-slate-500">
                  Logowanie
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-500 italic">
                Wkrótce
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Clear History Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Usunąć całą historię?"
        message={`Czy na pewno chcesz usunąć całą historię (${history.length} ${history.length === 1 ? 'analiza' : 'analiz'})? Ta operacja jest nieodwracalna.`}
        confirmText="Tak, usuń wszystko"
        cancelText="Anuluj"
        confirmVariant="destructive"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
};

export default React.memo(Sidebar);
