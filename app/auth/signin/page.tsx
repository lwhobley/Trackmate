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
    <div className="min-h-screen mesh-hero flex items-center justify-center px-4">
      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="blob absolute w-96 h-96 -top-20 -right-20 bg-[#6C63FF] opacity-[0.08]" />
        <div className="blob absolute w-80 h-80 bottom-0 -left-20 bg-[#FF4B00] opacity-[0.07]" style={{animationDelay:'4s'}} />
      </div>

      <div className="relative z-10 w-full max-w-sm fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{background:'linear-gradient(135deg,#FF4B00,#FF7A3D)'}}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17L10 3l7 14M6 11h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{fontFamily:'var(--font-body)',fontWeight:700,fontSize:'18px',color:'var(--text)'}}>TrackMate</span>
          </Link>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',color:'var(--text)',letterSpacing:'-0.01em'}}>Welcome back</h1>
          <p className="text-sm mt-1" style={{color:'var(--text-muted)'}}>Sign in to your account</p>
        </div>

        <div className="glass rounded-3xl p-7">
          {error && (
            <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-100 rounded-2xl p-3">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Email address', type: 'email', value: email, setter: setEmail, placeholder: 'you@school.edu' },
              { label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: '••••••••' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-medium mb-1.5" style={{color:'var(--text)'}}>{f.label}</label>
                <input
                  type={f.type} value={f.value}
                  onChange={e => f.setter(e.target.value)} required
                  placeholder={f.placeholder}
                  className="w-full h-11 rounded-xl px-4 text-sm border transition-all"
                  style={{background:'rgba(255,255,255,0.8)',border:'1px solid rgba(108,99,255,0.15)',color:'var(--text)'}}
                />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center mt-2 disabled:opacity-50">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm mt-5" style={{color:'var(--text-muted)'}}>
          No account?{' '}
          <Link href="/auth/signup" className="font-semibold" style={{color:'var(--accent)'}}>Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
