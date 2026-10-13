import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.componentName ?? 'Component'} crashed:`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-card border border-risk/30 bg-risk-light text-center gap-4 min-h-[200px]">
          <AlertTriangle className="w-8 h-8 text-risk" />
          <div>
            <p className="text-risk font-semibold text-sm font-sans">
              {this.props.componentName ?? 'Component'} failed to render
            </p>
            <p className="text-body-light text-xs mt-1 max-w-xs font-mono">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={this.handleReset}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Try Again</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
