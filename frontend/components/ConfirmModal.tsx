import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  confirmVariant = 'default',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop z glassmorphism */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal z glassmorphism */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-md w-full p-6 pointer-events-auto animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {message}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                confirmVariant === 'destructive'
                  ? 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600'
                  : 'bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;

