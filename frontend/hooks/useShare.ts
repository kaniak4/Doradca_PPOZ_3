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
 * @param onShowToast - Opcjonalna funkcja do wyświetlania toast sukcesu
 * @param onShowError - Opcjonalna funkcja do wyświetlania toast błędu
 */
export const useShare = (
  onShowToast?: (message: string) => void,
  onShowError?: (message: string) => void
): UseShareReturn => {
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
      onShowError?.(errorMessage);
      console.error('Share creation error:', error);
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [onShowError]);

  /**
   * Kopiuje link udostępnienia do schowka
   */
  const copyShareLink = useCallback(async (url: string): Promise<boolean> => {
    try {
      const success = await copyToClipboard(url);
      if (success) {
        onShowToast?.('Link został skopiowany do schowka');
      } else {
        onShowError?.('Nie udało się skopiować linku do schowka');
      }
      return success;
    } catch (error) {
      const errorMessage = 'Nie udało się skopiować linku do schowka';
      onShowError?.(errorMessage);
      console.error('Copy to clipboard error:', error);
      return false;
    }
  }, [onShowToast, onShowError]);

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

