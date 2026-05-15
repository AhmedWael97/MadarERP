import { Component, ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Hook into Sentry here when added.
    console.error('Unhandled error in tree', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-dvh place-items-center bg-app text-app">
          <div className="max-w-md rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-8 text-center shadow-[var(--shadow-card)]">
            <h1 className="mb-2 text-2xl font-bold text-[color:var(--color-rose-600)]">حدث خطأ</h1>
            <p className="mb-6 text-sm text-[color:var(--color-muted)]">
              {this.state.error.message}
            </p>
            <button
              className="rounded-[var(--radius-input)] bg-primary px-4 py-2 text-sm font-medium"
              onClick={() => location.reload()}
            >
              إعادة تحميل
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
