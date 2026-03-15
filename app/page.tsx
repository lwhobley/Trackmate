import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: demoMeet } = await supabase.from('meets').select('id').eq('public', true).order('created_at', { ascending: true }).limit(1).single()
  const demoHref = demoMeet ? `/meets/${demoMeet.id}/live` : '/dashboard/meets'

  return (
    <div className="min-h-screen track-bg noise" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border-dim)', background: 'rgba(6,6,8,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#FF4B00,#cc3c00)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(255,75,0,0.4)' }}>
              <span style={{ color: 'white', fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 14, letterSpacing: '-0.02em' }}>TM</span>
            </div>
            <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 22, letterSpacing: '-0.01em', color: 'white' }}>TRACKMATE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user ? (
              <Link href="/dashboard/orgs" className="btn btn-primary btn-sm">Dashboard →</Link>
            ) : (
              <>
                <Link href="/auth/signin" style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, textDecoration: 'none', padding: '6px 12px' }}>Sign In</Link>
                <Link href="/auth/signup" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 99, background: 'rgba(255,75,0,0.08)', border: '1px solid rgba(255,75,0,0.2)', marginBottom: 32 }}>
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4B00', display: 'inline-block' }} />
          <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: '#FF4B00' }}>HS · NCAA · CLUB · ELITE</span>
        </div>

        <h1 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 'clamp(56px, 10vw, 96px)', lineHeight: 0.92, letterSpacing: '-0.02em', marginBottom: 28 }}>
          <span className="gradient-text-white">TRACK &amp; FIELD</span><br />
          <span className="gradient-text">MEET MANAGEMENT</span><br />
          <span className="gradient-text-white">DONE RIGHT.</span>
        </h1>

        <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
          From entry registration to live results. FinishLynx FAT bridge, real-time scoreboards, Stripe payments, and TFRRS/Hy-Tek exports.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" className="btn btn-primary btn-lg">
            Start Free →
          </Link>
          <Link href={demoHref} className="btn btn-ghost btn-lg">
            View Live Demo
          </Link>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, maxWidth: 720, margin: '72px auto 0', background: 'var(--border)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {[
            { value: '4', label: 'Meet Types' },
            { value: '30+', label: 'Track Events' },
            { value: 'FAT', label: 'Bridge Ready' },
            { value: 'Live', label: 'Realtime' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-2)', padding: '24px 16px', textAlign: 'center' }}>
              <div className="stat-number gradient-text" style={{ fontSize: 32 }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 42, letterSpacing: '-0.01em' }}>
            EVERYTHING YOUR MEET NEEDS
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {[
            { icon: '⚡', label: 'FAT BRIDGE', title: 'FinishLynx Integration', desc: 'Watches your Results folder, parses LIF/CSV files, and syncs times to the live scoreboard instantly.' },
            { icon: '📡', label: 'REALTIME', title: 'Live Results', desc: 'Supabase Realtime pushes every result to coaches and spectators the moment it\'s entered.' },
            { icon: '🏆', label: 'MULTI-RULESET', title: 'HS / NCAA / Club / Elite', desc: 'NFHS wind rules, NCAA FAT requirements, AAU scoring — auto-applied per meet type.' },
            { icon: '🎟️', label: 'PAYMENTS', title: 'Stripe Checkout', desc: 'Per-athlete and per-team entry fees with automatic entry confirmation on payment.' },
            { icon: '📄', label: 'EXPORTS', title: 'Hy-Tek & TFRRS', desc: 'One-click export to Hy-Tek CSV, TFRRS XML, LIF start lists, and state HS formats.' },
            { icon: '📱', label: 'PWA', title: 'Works on Any Device', desc: 'Install on iPad at the track. Coaches enter athletes, officials record results.' },
          ].map(f => (
            <div key={f.title} className="card card-hover" style={{ padding: '28px 28px 32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #FF4B00, transparent)' }} />
              <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
              <div className="badge badge-hs" style={{ marginBottom: 10, fontSize: 10 }}>{f.label}</div>
              <h3 style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid var(--border-dim)', padding: '80px 24px', textAlign: 'center', background: 'var(--bg-1)' }}>
        <h2 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 48, marginBottom: 16 }}>
          READY TO RUN?
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Set up your first meet in under 5 minutes.</p>
        <Link href="/auth/signup" className="btn btn-primary btn-lg">Create Free Account →</Link>
      </section>

      <footer style={{ borderTop: '1px solid var(--border-dim)', padding: '24px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
        © {new Date().getFullYear()} TrackMate · Built for the sport
      </footer>
    </div>
  )
}
