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
 */
export const useExport = (): UseExportReturn => {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Eksportuje raport do formatu DOCX
   */
  const handleExportDocx = useCallback(async (data: AnalysisResult) => {
    setIsExporting(true);
    try {
      await exportToDocx(data);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Nieznany błąd';
      alert(`Błąd podczas eksportu DOCX: ${errorMessage}`);
      console.error('Export DOCX error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Eksportuje raport do formatu PDF
   */
  const handleExportPdf = useCallback(async (data: AnalysisResult) => {
    setIsExporting(true);
    try {
      await exportToPdf(data);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Nieznany błąd';
      alert(`Błąd podczas eksportu PDF: ${errorMessage}`);
      console.error('Export PDF error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    exportToDocx: handleExportDocx,
    exportToPdf: handleExportPdf,
  };
};

