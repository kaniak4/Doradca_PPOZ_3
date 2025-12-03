import { useState, useCallback } from 'react';
import { Toast, ToastType, ToastAction } from '../components/Toast';

interface UseToastReturn {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number, title?: string, action?: ToastAction) => string;
  showSuccess: (message: string, duration?: number, title?: string, action?: ToastAction) => string;
  showError: (message: string, duration?: number, title?: string, action?: ToastAction) => string;
  showInfo: (message: string, duration?: number, title?: string, action?: ToastAction) => string;
  showWarning: (message: string, duration?: number, title?: string, action?: ToastAction) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

/**
 * Hook do zarządzania toast notifications
 * Umożliwia wyświetlanie krótkich komunikatów sukcesu/błędu/informacji
 */
export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Generuje unikalny ID dla toast
   */
  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Dodaje nowy toast
   */
  const showToast = useCallback((
    message: string, 
    type: ToastType = 'info', 
    duration: number = 4000,
    title?: string,
    action?: ToastAction
  ) => {
    const id = generateId();
    const newToast: Toast = { id, message, type, duration, title, action };
    
    setToasts((prev) => [...prev, newToast]);
    
    return id;
  }, [generateId]);

  /**
   * Pokazuje toast sukcesu
   */
  const showSuccess = useCallback((message: string, duration?: number, title?: string, action?: ToastAction) => {
    return showToast(message, 'success', duration, title, action);
  }, [showToast]);

  /**
   * Pokazuje toast błędu
   */
  const showError = useCallback((message: string, duration?: number, title?: string, action?: ToastAction) => {
    return showToast(message, 'error', duration || 5000, title, action); // Błędy pokazują się dłużej
  }, [showToast]);

  /**
   * Pokazuje toast informacyjny
   */
  const showInfo = useCallback((message: string, duration?: number, title?: string, action?: ToastAction) => {
    return showToast(message, 'info', duration, title, action);
  }, [showToast]);

  /**
   * Pokazuje toast ostrzeżenia
   */
  const showWarning = useCallback((message: string, duration?: number, title?: string, action?: ToastAction) => {
    return showToast(message, 'warning', duration || 4000, title, action);
  }, [showToast]);

  /**
   * Usuwa toast po ID
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Czyści wszystkie toasty
   */
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast,
    clearAll,
  };
};
