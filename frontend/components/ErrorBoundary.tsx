import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Wystąpił błąd</h1>
                <p className="text-gray-600 dark:text-slate-400 mt-1">Aplikacja napotkała nieoczekiwany problem</p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">Szczegóły błędu:</p>
              <p className="text-sm text-red-700 dark:text-red-400 font-mono">
                {this.state.error?.message || 'Nieznany błąd'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:text-red-800 dark:hover:text-red-300">
                    Stack trace (tryb deweloperski)
                  </summary>
                  <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto bg-red-100 dark:bg-red-900/30 p-3 rounded border border-red-200 dark:border-red-800">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Spróbuj ponownie
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 dark:bg-slate-700 hover:bg-gray-700 dark:hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Odśwież stronę
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-slate-400 mt-6 text-center">
              Jeśli problem się powtarza, skontaktuj się z administratorem systemu.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

