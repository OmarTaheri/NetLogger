import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-hud-bg flex items-center justify-center p-8">
          <div className="hud-corners bg-hud-surface/50 border border-hud-red/40 p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-2 border-hud-red/40 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-hud-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-lg font-mono uppercase tracking-widest text-hud-red mb-2">System Error</h1>
            <p className="text-sm font-mono text-hud-text-muted mb-1">An unexpected error occurred</p>
            <p className="text-xs font-mono text-hud-text-muted/60 mb-6 break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-6 py-2 border border-hud-accent text-hud-accent font-mono text-sm uppercase tracking-widest hover:bg-hud-accent/10 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
