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
      email: form.email, password: form.password, options: { data: { name: form.name } }
    })
    if (authErr || !authData.user) { setError(authErr?.message || 'Signup failed'); setLoading(false); return }
    const { data: org, error: orgErr } = await supabase.from('orgs').insert({ name: form.orgName, type: form.orgType }).select().single()
    if (orgErr) { setError(orgErr.message); setLoading(false); return }
    await supabase.from('profiles').update({ org_id: org.id, name: form.name }).eq('id', authData.user.id)
    router.push('/dashboard/orgs'); router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(255,75,0,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#FF4B00,#cc3c00)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 24px rgba(255,75,0,0.35)' }}>
            <span style={{ color: 'white', fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 18 }}>TM</span>
          </div>
          <h1 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 32, letterSpacing: '-0.01em' }}>CREATE ACCOUNT</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Get started with TrackMate for free</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {error && (
            <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Your Name', key: 'name', type: 'text', placeholder: 'Coach Smith' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@school.edu' },
              { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'School / Club / Program', key: 'orgName', type: 'text', placeholder: 'Jefferson High School' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e => update(f.key, e.target.value)} required className="input" placeholder={f.placeholder} />
              </div>
            ))}
            <div>
              <label className="label">Organization Type</label>
              <select value={form.orgType} onChange={e => update('orgType', e.target.value)} className="input" style={{ height: 42 }}>
                <option value="school">High School</option>
                <option value="college">College / University</option>
                <option value="club">Club / AAU</option>
                <option value="elite">Elite / Open</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 4, height: 44 }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          Already have an account?{' '}
          <Link href="/auth/signin" style={{ color: '#FF4B00', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
