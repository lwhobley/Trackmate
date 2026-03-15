'use client'
import React from 'react'
import Link from 'next/link'

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('TrackMate Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <div>
            <h3 className="font-bold text-white mb-1">Something went wrong</h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-white text-sm font-medium rounded-lg transition-colors">
              Try Again
            </button>
            <Link href="/dashboard/orgs"
              className="px-4 py-2 border border-[#2A2A2A] text-zinc-400 hover:text-white text-sm font-medium rounded-lg transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function PageError({ message, reset }: { message?: string; reset?: () => void }) {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-600/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-red-400 text-2xl">⚠</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
        <p className="text-zinc-500 text-sm mb-6">{message || 'An unexpected error occurred. Please try again.'}</p>
        <div className="flex gap-3 justify-center">
          {reset && (
            <button onClick={reset}
              className="px-4 py-2 bg-[#FF4B00] hover:bg-[#e04200] text-white text-sm font-semibold rounded-lg transition-colors">
              Try Again
            </button>
          )}
          <Link href="/dashboard/orgs"
            className="px-4 py-2 border border-[#2A2A2A] text-zinc-400 hover:text-white text-sm font-medium rounded-lg transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export function NotFound({ entity = 'page' }: { entity?: string }) {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-black text-[#FF4B00] mb-4">404</p>
        <h1 className="text-2xl font-black text-white mb-2">
          {entity.charAt(0).toUpperCase() + entity.slice(1)} not found
        </h1>
        <p className="text-zinc-500 text-sm mb-6">
          This {entity} doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link href="/dashboard/orgs"
          className="px-6 py-2.5 bg-[#FF4B00] hover:bg-[#e04200] text-white font-semibold rounded-lg text-sm transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
