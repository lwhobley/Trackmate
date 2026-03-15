import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MEET_TYPE_LABELS } from '@/lib/types'

export default async function OrgsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('profiles').select('*, orgs(*)').eq('id', user.id).single()
  const org = profile?.orgs as any
  const { data: meets } = org ? await supabase.from('meets').select('*, rulesets(*)').eq('org_id', org.id).order('date', { ascending: false }).limit(10) : { data: [] }

  const tagClass: Record<string, string> = {
    hs: 'tag-hs', ncaa: 'tag-ncaa', club: 'tag-club', elite: 'tag-elite'
  }

  const stats = [
    { label: 'Total Meets', value: meets?.length || 0, color: '#6C63FF', bg: '#F0EFFF' },
    { label: 'Upcoming', value: meets?.filter((m: any) => new Date(m.date) >= new Date()).length || 0, color: '#FF4B00', bg: '#FFF0EB' },
    { label: 'Org Type', value: (org?.type || '—').toUpperCase(), color: '#00C2B8', bg: '#E6FAFA' },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 fade-up">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:'var(--text-subtle)'}}>Organization</p>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2.2rem',color:'var(--text)',letterSpacing:'-0.02em',lineHeight:1.1}}>
            {org?.name || 'Your Organization'}
          </h1>
        </div>
        {org && (
          <Link href={`/dashboard/orgs/${org.id}/meets/new`} className="btn-primary">
            + New Meet
          </Link>
        )}
      </div>

      {!org ? (
        <div className="glass rounded-3xl p-16 text-center fade-up">
          <p className="text-5xl mb-4">🏟️</p>
          <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',color:'var(--text)'}}>No Organization Yet</h3>
          <p className="text-sm mt-2" style={{color:'var(--text-muted)'}}>Complete your profile to create meets</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8 fade-up-1">
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:s.bg}}>
                  <div className="w-3 h-3 rounded-full" style={{background:s.color}} />
                </div>
                <div style={{fontFamily:'var(--font-display)',fontSize:'2rem',color:'var(--text)',letterSpacing:'-0.02em'}}>{s.value}</div>
                <div className="text-xs font-medium mt-0.5" style={{color:'var(--text-muted)'}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Meets list */}
          <div className="glass-card rounded-3xl overflow-hidden fade-up-2">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{borderColor:'rgba(108,99,255,0.08)'}}>
              <h2 className="font-semibold text-[15px]" style={{color:'var(--text)'}}>Recent Meets</h2>
              <Link href={`/dashboard/orgs/${org.id}/meets/new`} className="text-sm font-medium" style={{color:'var(--accent)'}}>
                + Create
              </Link>
            </div>
            {!meets?.length ? (
              <div className="p-16 text-center">
                <p className="text-4xl mb-3">🏁</p>
                <p className="font-semibold" style={{color:'var(--text)'}}>No meets yet</p>
                <p className="text-sm mt-1" style={{color:'var(--text-muted)'}}>Create your first meet to get started</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Meet</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Venue</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {meets.map((meet: any) => (
                    <tr key={meet.id}>
                      <td className="font-medium">{meet.name}</td>
                      <td>
                        <span className={`tag ${tagClass[meet.meet_type]}`}>
                          {MEET_TYPE_LABELS[meet.meet_type as keyof typeof MEET_TYPE_LABELS]}
                        </span>
                      </td>
                      <td style={{color:'var(--text-muted)'}}>
                        {new Date(meet.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{color:'var(--text-muted)'}}>{meet.venue || '—'}</td>
                      <td>
                        <div className="flex gap-2 justify-end">
                          <Link href={`/meets/${meet.id}`} className="btn-secondary text-xs py-1.5 px-3">View</Link>
                          <Link href={`/meets/${meet.id}/manage`} className="btn-accent text-xs py-1.5 px-3">Manage</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
