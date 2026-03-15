import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MEET_TYPE_LABELS } from '@/lib/types'

export default async function OrgsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('profiles').select('*, orgs(*)').eq('id', user.id).single()
  const org = (profile?.orgs as any)

  const { data: meets } = await supabase.from('meets').select('*, rulesets(*)')
    .eq('org_id', org?.id || '').order('date', { ascending: false }).limit(20)

  const typeClass: Record<string, string> = { hs: 'badge-hs', ncaa: 'badge-ncaa', club: 'badge-club', elite: 'badge-elite' }
  const upcoming = meets?.filter(m => new Date(m.date) >= new Date()) || []
  const past = meets?.filter(m => new Date(m.date) < new Date()) || []

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            {org?.type?.toUpperCase() || 'ORGANIZATION'}
          </p>
          <h1 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 40, letterSpacing: '-0.01em', lineHeight: 1 }}>
            {org?.name || 'Welcome to TrackMate'}
          </h1>
        </div>
        {org && (
          <Link href={`/dashboard/orgs/${org.id}/meets/new`} className="btn btn-primary">
            + New Meet
          </Link>
        )}
      </div>

      {!org ? (
        <div className="card" style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏟️</div>
          <h3 style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 24, marginBottom: 8 }}>No organization linked</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Complete your profile setup to create and manage meets.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }}>
            {[
              { label: 'Total Meets', value: meets?.length || 0, sub: 'all time' },
              { label: 'Upcoming', value: upcoming.length, sub: 'scheduled' },
              { label: 'Past Meets', value: past.length, sub: 'completed' },
              { label: 'Org Type', value: org.type?.charAt(0).toUpperCase() + org.type?.slice(1), sub: 'classification' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '20px 24px' }}>
                <div className="stat-number" style={{ fontSize: 36, color: 'white', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FF4B00', marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Meets table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border-dim)' }}>
              <h2 style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 18, letterSpacing: '0.02em' }}>MEETS</h2>
              <Link href={`/dashboard/orgs/${org.id}/meets/new`} style={{ fontSize: 12, color: '#FF4B00', textDecoration: 'none', fontWeight: 700 }}>+ Create meet</Link>
            </div>
            {!meets?.length ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏁</div>
                <p style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>No meets yet</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Create your first meet to get started</p>
                <Link href={`/dashboard/orgs/${org.id}/meets/new`} className="btn btn-primary btn-sm">Create Meet</Link>
              </div>
            ) : (
              <div>
                {meets.map((meet, i) => (
                  <div key={meet.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: i < meets.length - 1 ? '1px solid var(--border-dim)' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 18 }}>{meet.meet_type === 'hs' ? '🏫' : meet.meet_type === 'ncaa' ? '🎓' : meet.meet_type === 'elite' ? '🏅' : '🏃'}</span>
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'white', fontSize: 14 }}>{meet.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(meet.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {meet.venue && ` · ${meet.venue}`}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`badge ${typeClass[meet.meet_type]}`}>
                        {MEET_TYPE_LABELS[meet.meet_type as keyof typeof MEET_TYPE_LABELS]}
                      </span>
                      <Link href={`/meets/${meet.id}`} className="btn btn-ghost btn-sm">View</Link>
                      <Link href={`/meets/${meet.id}/manage`} className="btn btn-secondary btn-sm">Manage</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
