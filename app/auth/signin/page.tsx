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
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(redirect); router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Left accent */}
      <div className="hidden lg:flex w-1/2 bg-[#080808] border-r border-[#181818] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF4B00]/5 to-transparent" />
        <div className="relative text-center px-12">
          <div className="w-16 h-16 bg-[#FF4B00] rounded-lg flex items-center justify-center mx-auto mb-6 rotate-3">
            <span className="text-white font-black text-2xl -rotate-3" style={{fontFamily:'Barlow Condensed,sans-serif'}}>TM</span>
          </div>
          <h2 className="text-5xl font-black text-white uppercase tracking-wider mb-3" style={{fontFamily:'Barlow Condensed,sans-serif'}}>TrackMate</h2>
          <p className="text-[#444] text-sm leading-relaxed max-w-xs mx-auto">
            The complete platform for track & field meet management. HS, NCAA, Club, Elite.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 text-left">
            {['FinishLynx FAT Bridge','Live Realtime Scores','Stripe Payments','TFRRS / Hy-Tek Export'].map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-[#555]">
                <span className="text-[#FF4B00]">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white uppercase tracking-wide mb-1" style={{fontFamily:'Barlow Condensed,sans-serif'}}>Welcome Back</h1>
            <p className="text-[#444] text-sm">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@school.edu' },
              { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: '••••••••' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-bold text-[#555] uppercase tracking-widest block mb-2">{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} required placeholder={f.placeholder}
                  className="w-full h-11 bg-[#0A0A0A] border border-[#222] rounded px-4 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#FF4B00] transition-colors" />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-[#FF4B00] hover:bg-[#cc3c00] disabled:opacity-50 text-white font-black rounded text-sm uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{fontFamily:'Barlow Condensed,sans-serif'}}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-sm text-[#444] mt-6">
            No account?{' '}
            <Link href="/auth/signup" className="text-[#FF4B00] hover:underline font-medium">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
