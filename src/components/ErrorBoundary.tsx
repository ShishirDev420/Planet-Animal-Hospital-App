import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try again later.";
      
      try {
        // Try to parse Firestore error JSON
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = `System Error: ${parsed.error}`;
            if (parsed.error.includes('permission-denied') || parsed.error.includes('insufficient permissions')) {
              errorMessage = "You don't have permission to perform this action. Please check if you are signed in correctly.";
            }
          }
        }
      } catch (e) {
        // Not a JSON error, use the message directly if it's user-friendly
        if (this.state.error?.message && !this.state.error.message.includes('permission')) {
          errorMessage = this.state.error.message;
        } else if (this.state.error?.message?.includes('permission')) {
          errorMessage = "Permission denied. Please ensure you are logged in and have the necessary access.";
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#071912]">
          <div className="glass-card p-8 rounded-[2rem] max-w-md w-full text-center shadow-2xl border border-white/20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 dark:bg-red-900/30">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-4 dark:text-white">Oops!</h1>
            <p className="text-slate-600 mb-8 leading-relaxed dark:text-white/60">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors dark:bg-planet-yellow dark:text-black"
            >
              <RefreshCcw size={20} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
