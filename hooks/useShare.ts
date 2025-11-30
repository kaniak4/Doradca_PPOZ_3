import { useState, useCallback } from 'react';
import { AnalysisResult } from '../types';
import { createShare, copyToClipboard, generateShareUrl } from '../services/shareService';

interface UseShareReturn {
  isSharing: boolean;
  shareUrl: string | null;
  shareError: string | null;
  createShareLink: (analysisResult: AnalysisResult) => Promise<string | null>;
  copyShareLink: (shareUrl: string) => Promise<boolean>;
  resetShare: () => void;
}

/**
 * Hook do zarządzania udostępnianiem analiz
 */
export const useShare = (): UseShareReturn => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  /**
   * Tworzy link udostępnienia dla analizy
   */
  const createShareLink = useCallback(async (analysisResult: AnalysisResult): Promise<string | null> => {
    setIsSharing(true);
    setShareError(null);
    setShareUrl(null);

    try {
      const response = await createShare(analysisResult);
      const url = generateShareUrl(response.shareId);
      setShareUrl(url);
      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas tworzenia udostępnienia.';
      setShareError(errorMessage);
      console.error('Share creation error:', error);
      return null;
    } finally {
      setIsSharing(false);
    }
  }, []);

  /**
   * Kopiuje link udostępnienia do schowka
   */
  const copyShareLink = useCallback(async (url: string): Promise<boolean> => {
    try {
      const success = await copyToClipboard(url);
      if (success) {
        // Opcjonalnie: pokaż toast notification
      }
      return success;
    } catch (error) {
      console.error('Copy to clipboard error:', error);
      return false;
    }
  }, []);

  /**
   * Resetuje stan udostępnienia
   */
  const resetShare = useCallback(() => {
    setShareUrl(null);
    setShareError(null);
    setIsSharing(false);
  }, []);

  return {
    isSharing,
    shareUrl,
    shareError,
    createShareLink,
    copyShareLink,
    resetShare,
  };
};

