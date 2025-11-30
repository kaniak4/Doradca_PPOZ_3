import { useState, useEffect, useCallback } from 'react';
import { HistoryEntry, AnalysisResult } from '../types';

const STORAGE_KEY = 'ppoz_history';
const MAX_HISTORY_ENTRIES = 50; // Maksymalna liczba zapisanych analiz

/**
 * Hook do zarządzania historią zapytań
 * Przechowuje historię w localStorage
 */
export const useHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Załaduj historię z localStorage przy starcie
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Waliduj strukturę - usuń nieprawidłowe wpisy
        const validEntries = parsed.filter((entry: any) => 
          entry && entry.id && entry.query && entry.timestamp && entry.fullResult
        );
        setHistory(validEntries);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania historii:', error);
      // W razie błędu wyczyść nieprawidłowe dane
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Zapisz historię do localStorage
  const saveHistory = useCallback((entries: HistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      setHistory(entries);
    } catch (error) {
      console.error('Błąd podczas zapisywania historii:', error);
      // Jeśli localStorage jest pełne, usuń najstarsze wpisy
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        const trimmed = entries.slice(-MAX_HISTORY_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        setHistory(trimmed);
      }
    }
  }, []);

  /**
   * Dodaj nową analizę do historii
   */
  const addEntry = useCallback((result: AnalysisResult, query: string) => {
    const trimmedQuery = query.trim();
    
    // Sprawdź czy nie ma już identycznego wpisu w ostatnich 5 minutach (aby uniknąć duplikatów przy szybkich odświeżeniach)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentDuplicate = history.find(entry => 
      entry.query === trimmedQuery &&
      entry.timestamp > fiveMinutesAgo &&
      entry.summary === result.summary
    );
    
    if (recentDuplicate) {
      // Nie dodawaj duplikatu
      return;
    }

    const newEntry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query: trimmedQuery,
      timestamp: Date.now(),
      summary: result.summary,
      finalRecommendation: result.finalRecommendation,
      riskAssessment: result.riskAssessment,
      citationsCount: result.citations.length,
      fullResult: result,
    };

    // Dodaj na początku listy (najnowsze na górze)
    // Usuń tylko dokładne duplikaty (query + summary) - pozwól na różne odpowiedzi na to samo pytanie
    const withoutDuplicates = history.filter(entry => 
      !(entry.query === trimmedQuery && entry.summary === result.summary)
    );
    const updated = [newEntry, ...withoutDuplicates];
    
    // Ogranicz do MAX_HISTORY_ENTRIES
    const trimmed = updated.slice(0, MAX_HISTORY_ENTRIES);
    
    saveHistory(trimmed);
  }, [history, saveHistory]);

  /**
   * Usuń wpis z historii
   */
  const removeEntry = useCallback((id: string) => {
    const updated = history.filter(entry => entry.id !== id);
    saveHistory(updated);
  }, [history, saveHistory]);

  /**
   * Wyczyść całą historię
   */
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  /**
   * Pobierz wpis z historii po ID
   */
  const getEntry = useCallback((id: string): HistoryEntry | undefined => {
    return history.find(entry => entry.id === id);
  }, [history]);

  /**
   * Wyszukaj w historii
   */
  const searchHistory = useCallback((searchTerm: string): HistoryEntry[] => {
    if (!searchTerm.trim()) {
      return history;
    }
    
    const term = searchTerm.toLowerCase();
    return history.filter(entry => 
      entry.query.toLowerCase().includes(term) ||
      entry.summary.toLowerCase().includes(term) ||
      entry.finalRecommendation.toLowerCase().includes(term)
    );
  }, [history]);

  /**
   * Filtruj historię według ryzyka
   */
  const filterByRisk = useCallback((
    riskType: 'legalRisk' | 'financialRisk' | 'safetyRisk',
    level: 'Niskie' | 'Średnie' | 'Wysokie'
  ): HistoryEntry[] => {
    return history.filter(entry => 
      entry.riskAssessment[riskType] === level
    );
  }, [history]);

  return {
    history,
    isLoading,
    addEntry,
    removeEntry,
    clearHistory,
    getEntry,
    searchHistory,
    filterByRisk,
  };
};
