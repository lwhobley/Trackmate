'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '', orgType: 'school' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { name: form.name } }
    })
    if (authErr || !authData.user) { setError(authErr?.message || 'Signup failed'); setLoading(false); return }
    const { data: org, error: orgErr } = await supabase.from('orgs').insert({ name: form.orgName, type: form.orgType }).select().single()
    if (orgErr) { setError(orgErr.message); setLoading(false); return }
    await supabase.from('profiles').update({ org_id: org.id, name: form.name }).eq('id', authData.user.id)
    router.push('/dashboard/orgs'); router.refresh()
  }

  return (
    <div className="min-h-screen mesh-hero flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="blob absolute w-96 h-96 -top-20 -left-20 bg-[#6C63FF] opacity-[0.08]" />
        <div className="blob absolute w-80 h-80 bottom-0 -right-20 bg-[#00C2B8] opacity-[0.07]" style={{animationDelay:'4s'}} />
      </div>

      <div className="relative z-10 w-full max-w-sm fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{background:'linear-gradient(135deg,#FF4B00,#FF7A3D)'}}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17L10 3l7 14M6 11h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{fontFamily:'var(--font-body)',fontWeight:700,fontSize:'18px',color:'var(--text)'}}>TrackMate</span>
          </Link>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',color:'var(--text)',letterSpacing:'-0.01em'}}>Create account</h1>
          <p className="text-sm mt-1" style={{color:'var(--text-muted)'}}>Get started for free</p>
        </div>

        <div className="glass rounded-3xl p-7">
          {error && <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-100 rounded-2xl p-3">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Your name', key: 'name', type: 'text', placeholder: 'Coach Smith' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@school.edu' },
              { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'School / Club name', key: 'orgName', type: 'text', placeholder: 'Jefferson High School' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1.5" style={{color:'var(--text)'}}>{f.label}</label>
                <input type={f.type} value={form[f.key as keyof typeof form]}
                  onChange={e => update(f.key, e.target.value)} required placeholder={f.placeholder}
                  className="w-full h-11 rounded-xl px-4 text-sm border transition-all"
                  style={{background:'rgba(255,255,255,0.8)',border:'1px solid rgba(108,99,255,0.15)',color:'var(--text)'}} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{color:'var(--text)'}}>Organization type</label>
              <select value={form.orgType} onChange={e => update('orgType', e.target.value)}
                className="w-full h-11 rounded-xl px-4 text-sm border transition-all"
                style={{background:'rgba(255,255,255,0.8)',border:'1px solid rgba(108,99,255,0.15)',color:'var(--text)'}}>
                <option value="school">High School</option>
                <option value="college">College / University</option>
                <option value="club">Club / AAU</option>
                <option value="elite">Elite / Open</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-1 disabled:opacity-50">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm mt-5" style={{color:'var(--text-muted)'}}>
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-semibold" style={{color:'var(--accent)'}}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
