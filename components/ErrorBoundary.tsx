import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from '../constants';

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
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log to analytics or error tracking service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[var(--card-bg)] border border-theme rounded-[2.5rem] p-8 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <Icons.Close className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Something went wrong
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                We're sorry, but something unexpected happened. Please try again.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-[var(--text-muted)] text-xs mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs bg-[var(--bg-secondary)] p-3 rounded-lg overflow-auto max-h-40 text-red-400">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-[var(--gold)] text-black py-3 rounded-xl font-bold hover:bg-[#c0a030] transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-[var(--card-bg)] border border-theme text-[var(--text-primary)] py-3 rounded-xl font-bold hover:bg-[var(--bg-secondary)] transition-all"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

