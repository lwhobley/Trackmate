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
    <div className="min-h-screen bg-[#05050A] flex track-bg">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#FF3B00]/5 border-r border-[#252535] flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF3B00]/15 rounded-full blur-[80px]" />
        </div>
        <div className="relative text-center">
          <div className="w-16 h-16 bg-[#FF3B00] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-600/40">
            <span className="font-display font-black italic text-white text-2xl">TM</span>
          </div>
          <h2 className="font-display font-black italic text-white text-5xl mb-4">TRACKMATE</h2>
          <p className="text-[#8888A0] text-lg max-w-xs">The complete meet management platform for track & field.</p>
          <div className="grid grid-cols-3 gap-6 mt-10">
            {['HS/NFHS', 'NCAA', 'Club/AAU'].map(t => (
              <div key={t} className="text-center">
                <div className="w-2 h-2 rounded-full bg-[#FF3B00] mx-auto mb-2" />
                <span className="text-xs text-[#8888A0] font-semibold uppercase tracking-wider">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-[#FF3B00] rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="font-display font-black italic text-white text-lg">TM</span>
            </div>
          </div>
          <h1 className="font-display font-black italic text-white text-4xl mb-1">SIGN IN</h1>
          <p className="text-[#8888A0] text-sm mb-8">Welcome back to TrackMate</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl p-3">{error}</div>
            )}
            {[
              { label: 'Email', key: 'email', type: 'email', value: email, set: setEmail, placeholder: 'you@school.edu' },
              { label: 'Password', key: 'pass', type: 'password', value: password, set: setPassword, placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8888A0] block mb-1.5">{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} required
                  className="w-full h-11 rounded-xl border border-[#252535] bg-[#0A0A12] px-4 text-sm text-white placeholder:text-[#444458] focus:outline-none focus:border-[#FF3B00] focus:ring-1 focus:ring-[#FF3B00]/50 transition-all"
                  placeholder={f.placeholder} />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-[#FF3B00] hover:bg-[#e03500] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-0.5 flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in...</>
              ) : 'Sign In →'}
            </button>
          </form>
          <p className="text-center text-sm text-[#8888A0] mt-6">
            No account?{' '}
            <Link href="/auth/signup" className="text-[#FF3B00] hover:text-[#FF8C00] font-semibold transition-colors">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
