import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, AlertCircle, X, RotateCcw, Eye, ExternalLink } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // w milisekundach, domyślnie 4000
  title?: string; // Opcjonalny tytuł
  action?: ToastAction; // Opcjonalna akcja (np. Undo, View)
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const toastRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const duration = toast.duration || 4000;
  const progressStep = 100 / (duration / 16); // Update co ~16ms dla płynnej animacji

  // Progress bar animation
  useEffect(() => {
    if (isPaused || isDismissing) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - progressStep;
        if (newProgress <= 0) {
          handleDismiss();
          return 0;
        }
        return newProgress;
      });
    }, 16);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPaused, isDismissing, progressStep]);

  // Auto-dismiss timer
  useEffect(() => {
    if (isPaused || isDismissing) {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      return;
    }

    dismissTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [duration, isPaused, isDismissing]);

  const handleDismiss = useCallback(() => {
    setIsDismissing(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Czas na animację wyjścia
  }, [toast.id, onRemove]);

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
    setIsPaused(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Pozwól tylko na przesuwanie w prawo (dismiss)
    if (diff > 0) {
      setSwipeOffset(diff);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Jeśli przesunięto więcej niż 100px, zamknij toast
    if (swipeOffset > 100) {
      handleDismiss();
    } else {
      // Wróć do pozycji początkowej
      setSwipeOffset(0);
      setIsPaused(false);
    }
  }, [isDragging, swipeOffset, handleDismiss]);

  // Mouse drag handlers (dla desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
    setIsPaused(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const diff = e.clientX - startXRef.current;
    
    if (diff > 0) {
      setSwipeOffset(diff);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (swipeOffset > 100) {
      handleDismiss();
    } else {
      setSwipeOffset(0);
      setIsPaused(false);
    }
  }, [isDragging, swipeOffset, handleDismiss]);

  // Pause on hover
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setIsPaused(false);
    }
  }, [isDragging]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  };

  const textColors = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    info: 'text-blue-800 dark:text-blue-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
  };

  const opacity = isDismissing ? 0 : Math.max(0.3, 1 - swipeOffset / 300);
  const transform = `translateX(${swipeOffset}px)`;

  return (
    <div
      ref={toastRef}
      className={`
        ${bgColors[toast.type]} ${textColors[toast.type]}
        border rounded-lg shadow-lg dark:shadow-xl min-w-[320px] max-w-[420px]
        flex flex-col
        transition-all duration-300 ease-out
        cursor-grab active:cursor-grabbing
        relative overflow-hidden
      `}
      style={{
        opacity,
        transform,
        animation: isDismissing ? 'slideOut 0.3s ease-in' : 'slideIn 0.3s ease-out',
      }}
      role="alert"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeaveCapture={handleMouseLeave}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
        <div
          className={`h-full transition-all duration-75 ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            toast.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icons[toast.type]}
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="font-semibold text-sm mb-1">
              {toast.title}
            </div>
          )}
          <div className="text-sm font-medium">
            {toast.message}
          </div>
          
          {/* Action button */}
          {toast.action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.action?.onClick();
                handleDismiss();
              }}
              className="mt-3 px-3 py-1.5 text-xs font-medium rounded-md bg-white/50 dark:bg-black/20 hover:bg-white/70 dark:hover:bg-black/40 transition-colors flex items-center gap-1.5"
            >
              {toast.action.icon || <RotateCcw className="w-3 h-3" />}
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Zamknij"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      style={{ 
        maxHeight: 'calc(100vh - 2rem)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          className="pointer-events-auto"
          style={{
            zIndex: 9999 + toasts.length - index, // Stack toasts with proper z-index
          }}
        >
          <ToastComponent toast={toast} onRemove={onRemove} />
        </div>
      ))}
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
