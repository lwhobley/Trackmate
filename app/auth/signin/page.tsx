'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/dashboard/orgs'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#FF4B00] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-lg">TM</span>
          </div>
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to your TrackMate account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6">
          {error && <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">{error}</div>}
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF4B00]"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF4B00]"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full h-10 bg-[#FF4B00] hover:bg-[#e04200] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
            {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in...</> : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500 mt-4">
          No account? <Link href="/auth/signup" className="text-[#FF4B00] hover:underline">Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
