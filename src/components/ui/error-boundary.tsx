'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── ErrorBoundary ──────────────────────────────────────────────────────────────
//
// React class component — the only mechanism that can catch render-phase
// exceptions (componentDidCatch). Function components cannot implement this.
//
// Usage:
//   <ErrorBoundary fallback={<p>Failed</p>}>
//     <RiskyComponent />
//   </ErrorBoundary>
//
// Reset: pass a changing `resetKey` prop to clear the error state from the
// parent without needing a full page reload. Changing `resetKey` causes React
// to remount this component, resetting `hasError` to false.

interface Props {
  children:  ReactNode
  /** Rendered instead of children when an error is caught. */
  fallback?: ReactNode
  /** Change this value from the parent to reset the boundary after recovery. */
  resetKey?: string | number
}

interface State {
  hasError: boolean
  error:    Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Drop-in point for error tracking (e.g. Sentry.captureException(error, { extra: info })).
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] caught:', error, info.componentStack)
    }
  }

  // Called when resetKey changes — resets error state so children re-render.
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    // If the parent supplied a new resetKey after an error, clear the boundary.
    return state.hasError ? null : null
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback !== undefined) return this.props.fallback

    return <DefaultFallback onRetry={this.handleRetry} />
  }
}

// ── Default fallback UI ────────────────────────────────────────────────────────
//
// Matches the visual language of DataTable's existing error state
// (AlertCircle card with a retry button) but is self-contained so it can
// appear in any context — table, sheet, card, or extension slot.

function DefaultFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive/70" />
      </div>
      <p className="text-[13px] font-semibold text-foreground">
        This section encountered an error
      </p>
      <p className="max-w-xs text-[12px] text-muted-foreground">
        The rest of the page is still functional. Try again or reload if the
        problem persists.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-1 gap-1.5">
        <RefreshCw className="h-3 w-3" />
        Try again
      </Button>
    </div>
  )
}
