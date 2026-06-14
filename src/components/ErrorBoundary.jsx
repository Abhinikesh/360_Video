import { Component } from 'react'
import { Globe, RefreshCw, LayoutDashboard } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Globe size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-gray-900">
              360<span className="text-blue-600">Tales</span>
            </span>
          </div>

          <div className="max-w-sm w-full">
            {/* Error illustration */}
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              We hit an unexpected error on this page.<br />
              Try reloading or return to the dashboard.
            </p>

            <div className="flex gap-3 justify-center mb-8">
              <a
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <LayoutDashboard size={15} />
                Go to Dashboard
              </a>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={15} />
                Reload Page
              </button>
            </div>

            {/* Dev-mode error detail */}
            {this.state.error && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <p className="text-[11px] font-mono text-gray-400 break-all leading-relaxed">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
