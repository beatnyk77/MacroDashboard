import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[SectionErrorBoundary] Error in ${this.props.title || 'Component'}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div 
          className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-200"
          style={{ backdropFilter: 'blur(10px)' }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2">
            Section Error: {this.props.title || 'General'}
          </h3>
          <p className="text-xs opacity-60 font-mono mb-4">
            {this.state.error?.message || 'An unexpected UI error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
          >
            Retry Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
