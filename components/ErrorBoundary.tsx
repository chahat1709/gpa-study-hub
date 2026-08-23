import React, { ErrorInfo, ReactNode, Component } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

/**
 * Professional Error Boundary with retry, copy error, and detailed view
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Report to analytics in production
    if (import.meta.env.PROD) {
      // Could integrate with error reporting service here
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    this.props.onRetry?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyError = async () => {
    const errorText = [
      `Error: ${this.state.error?.message}`,
      '',
      'Stack Trace:',
      this.state.error?.stack || 'N/A',
      '',
      'Component Stack:',
      this.state.errorInfo?.componentStack || 'N/A',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = errorText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="h-full w-full flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a1145 40%, #0d1b2a 100%)' }}
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full animate-fade-in">
            {/* Glass Card */}
            <div
              className="rounded-3xl p-8 text-center"
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              {/* Icon */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <AlertTriangle className="w-10 h-10 text-rose-400" />
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                Something went wrong
              </h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                An unexpected error occurred. Your data is safe. Try refreshing or copying the error
                details.
              </p>

              {/* Error Message Card */}
              <div
                className="rounded-xl p-3 mb-4 text-left"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <p className="text-xs font-mono text-rose-300 break-all leading-relaxed">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              {/* Toggle Details */}
              <button
                onClick={this.toggleDetails}
                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors py-2 mb-4"
                aria-expanded={this.state.showDetails}
              >
                {this.state.showDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
              </button>

              {/* Technical Details */}
              {this.state.showDetails && (
                <div
                  className="rounded-xl p-4 mb-4 text-left max-h-48 overflow-y-auto no-scrollbar"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Stack Trace
                  </p>
                  <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                    {this.state.error?.stack || 'N/A'}
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">
                        Component Stack
                      </p>
                      <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={this.handleCopyError}
                  className="flex-1 py-3 min-h-[44px] rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#e2e8f0',
                  }}
                  aria-label="Copy error details"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Error
                    </>
                  )}
                </button>
                <button
                  onClick={this.handleRetry}
                  className="flex-1 py-3 min-h-[44px] rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: '#818cf8',
                  }}
                  aria-label="Retry the failed operation"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>

              {/* Full Reload */}
              <button
                onClick={this.handleReload}
                className="w-full mt-3 py-3 min-h-[44px] rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
              >
                Reload Application
              </button>
            </div>

            {/* Help Text */}
            <p className="text-center text-[10px] text-slate-500 mt-4">
              If this persists, copy the error and contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children || null;
  }
}

export default ErrorBoundary;
