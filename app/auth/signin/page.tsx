'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function SignInForm() {
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
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#0C0C10] border border-[#222228] rounded-2xl p-6">
      {error && (
        <div className="text-red-400 text-sm bg-red-500/8 border border-red-500/20 rounded-xl p-3">{error}</div>
      )}
      {[
        { label: 'Email', type: 'email', value: email, setter: setEmail, placeholder: 'you@school.edu' },
        { label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: '••••••••' },
      ].map(f => (
        <div key={f.label}>
          <label style={{fontFamily:'var(--font-display)',fontWeight:600}} className="text-xs text-[#6B6B7A] uppercase tracking-widest block mb-1.5">{f.label}</label>
          <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)} required
            className="w-full h-11 rounded-xl border border-[#222228] bg-[#060608] px-4 text-sm text-white placeholder:text-[#333340] transition-all"
            placeholder={f.placeholder} />
        </div>
      ))}
      <button type="submit" disabled={loading}
        className="w-full h-11 bg-[#FF4B00] hover:bg-[#cc3c00] disabled:opacity-40 text-white rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 uppercase tracking-widest"
        style={{fontFamily:'var(--font-display)',fontWeight:700}}>
        {loading ? 'Signing in...' : 'Sign In →'}
      </button>
    </form>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#060608] track-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-[#FF4B00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span style={{fontFamily:'var(--font-display)',fontWeight:900}} className="text-white text-sm">TM</span>
            </div>
            <span style={{fontFamily:'var(--font-display)',fontWeight:800,letterSpacing:'0.06em'}} className="text-white text-xl uppercase">TrackMate</span>
          </Link>
          <h1 style={{fontFamily:'var(--font-display)',fontWeight:800}} className="text-3xl text-white uppercase">Welcome Back</h1>
          <p className="text-[#6B6B7A] text-sm mt-1">Sign in to your account</p>
        </div>
        <Suspense fallback={
          <div className="bg-[#0C0C10] border border-[#222228] rounded-2xl p-6 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-11 rounded-xl shimmer" />)}
          </div>
        }>
          <SignInForm />
        </Suspense>
        <p className="text-center text-sm text-[#6B6B7A] mt-5">
          No account?{' '}
          <Link href="/auth/signup" className="text-[#FF8C42] hover:text-[#FF4B00] transition-colors font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
