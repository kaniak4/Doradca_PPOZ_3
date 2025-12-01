import React, { useState, useMemo } from 'react';
import { HistoryEntry, AnalysisResult } from '../types';
import { useHistory } from '../hooks/useHistory';
import { 
  History as HistoryIcon, 
  X, 
  Search, 
  Trash2, 
  Calendar,
  AlertTriangle,
  FileText,
  ChevronRight,
  Settings,
  User,
  Info,
  AlertCircle
} from 'lucide-react';
import Tooltip from './Tooltip';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (result: AnalysisResult, query: string) => void;
  currentAnalysisId?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis,
  currentAnalysisId,
}) => {
  const { history, isLoading, removeEntry, clearHistory, searchHistory } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['history']));

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
    removeEntry(id);
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

  const getRiskBadgeColor = (risk: 'Niskie' | 'Średnie' | 'Wysokie') => {
    switch (risk) {
      case 'Wysokie':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'Średnie':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'Niskie':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    }
  };

  return (
    <>
      {/* Overlay - tło przy otwartym sidebarze (wszystkie rozdzielczości) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - overlay na wszystkich rozdzielczościach */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col border-l border-gray-200 dark:border-slate-700`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-200 flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Historia i Ustawienia
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
          {/* Sekcja: Historia */}
          <div className="border-b border-gray-200 dark:border-slate-700">
            <button
              onClick={() => toggleSection('history')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HistoryIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-900 dark:text-slate-200">
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
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>

                {/* Lista historii */}
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400 text-sm">
                    Ładowanie historii...
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400 text-sm">
                    {searchTerm ? (
                      <>Nie znaleziono analiz pasujących do wyszukiwania</>
                    ) : (
                      <>Brak historii analiz. Twoje analizy będą tu zapisane.</>
                    )}
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
    </>
  );
};

export default React.memo(Sidebar);
