"use client"

import { Component, type ReactNode, type ErrorInfo } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="rounded-full bg-danger-light p-4">
            <AlertTriangle size={32} className="text-danger" />
          </div>
          <h2 className="text-lg font-semibold text-content-primary">Something went wrong</h2>
          <p className="max-w-md text-center text-sm text-content-secondary">
            {this.state.error.message || "An unexpected error occurred. Please try again."}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
