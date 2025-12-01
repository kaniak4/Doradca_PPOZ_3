import { useState, useCallback } from 'react';
import { AnalysisResult } from '../types';
import { exportToDocx, exportToPdf } from '../services/exportService';

interface UseExportReturn {
  isExporting: boolean;
  exportToDocx: (data: AnalysisResult) => Promise<void>;
  exportToPdf: (data: AnalysisResult) => Promise<void>;
}

/**
 * Hook do zarządzania eksportem raportów
 * Separuje logikę eksportu od komponentów UI
 * @param onShowToast - Opcjonalna funkcja do wyświetlania toast sukcesu
 * @param onShowError - Opcjonalna funkcja do wyświetlania toast błędu
 */
export const useExport = (
  onShowToast?: (message: string) => void,
  onShowError?: (message: string) => void
): UseExportReturn => {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Eksportuje raport do formatu DOCX
   */
  const handleExportDocx = useCallback(async (data: AnalysisResult) => {
    setIsExporting(true);
    try {
      await exportToDocx(data);
      onShowToast?.('Raport DOCX został wyeksportowany pomyślnie');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Nieznany błąd';
      const fullMessage = `Błąd podczas eksportu DOCX: ${errorMessage}`;
      onShowError?.(fullMessage);
      console.error('Export DOCX error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [onShowToast, onShowError]);

  /**
   * Eksportuje raport do formatu PDF
   */
  const handleExportPdf = useCallback(async (data: AnalysisResult) => {
    setIsExporting(true);
    try {
      await exportToPdf(data);
      onShowToast?.('Raport PDF został wyeksportowany pomyślnie');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Nieznany błąd';
      const fullMessage = `Błąd podczas eksportu PDF: ${errorMessage}`;
      onShowError?.(fullMessage);
      console.error('Export PDF error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [onShowToast, onShowError]);

  return {
    isExporting,
    exportToDocx: handleExportDocx,
    exportToPdf: handleExportPdf,
  };
};

