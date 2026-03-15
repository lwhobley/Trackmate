import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MEET_TYPE_LABELS } from '@/lib/types'

const TYPE_PILL: Record<string, string> = {
  hs:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ncaa:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  club:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  elite: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
}

export default async function OrgsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('profiles').select('*, orgs(*)').eq('id', user.id).single()
  const org = (profile?.orgs as any)

  const { data: meets } = await supabase.from('meets')
    .select('*, rulesets(*)')
    .eq('org_id', org?.id || '')
    .order('date', { ascending: false })
    .limit(20)

  const upcoming = meets?.filter(m => new Date(m.date) >= new Date()) || []
  const past     = meets?.filter(m => new Date(m.date) <  new Date()) || []

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[#555] text-xs font-bold uppercase tracking-[0.15em] mb-1">Dashboard</p>
          <h1 className="text-4xl font-black text-white uppercase tracking-wide" style={{fontFamily:'Barlow Condensed,sans-serif'}}>
            {org?.name || 'Your Meets'}
          </h1>
        </div>
        {org && (
          <Link href={`/dashboard/orgs/${org.id}/meets/new`}
            className="bg-[#FF4B00] hover:bg-[#cc3c00] text-white font-black px-6 py-3 rounded text-sm uppercase tracking-widest transition-all hover:scale-105"
            style={{fontFamily:'Barlow Condensed,sans-serif'}}>
            + New Meet
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Meets',  value: meets?.length || 0 },
          { label: 'Upcoming',     value: upcoming.length },
          { label: 'Org Type',     value: org?.type?.toUpperCase() || '—' },
        ].map(s => (
          <div key={s.label} className="bg-[#0A0A0A] border border-[#181818] rounded-xl p-5 group hover:border-[#FF4B00]/30 transition-colors">
            <div className="stat-num text-white mb-1">{s.value}</div>
            <div className="text-[#444] text-xs font-bold uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {!meets?.length ? (
        <div className="bg-[#0A0A0A] border border-[#181818] rounded-xl p-16 text-center">
          <p className="text-6xl mb-4">🏁</p>
          <h3 className="text-2xl font-black text-white uppercase mb-2" style={{fontFamily:'Barlow Condensed,sans-serif'}}>No meets yet</h3>
          <p className="text-[#444] text-sm mb-6">Create your first meet to get started</p>
          {org && (
            <Link href={`/dashboard/orgs/${org.id}/meets/new`}
              className="inline-block bg-[#FF4B00] hover:bg-[#cc3c00] text-white font-black px-8 py-3 rounded text-sm uppercase tracking-widest transition-colors"
              style={{fontFamily:'Barlow Condensed,sans-serif'}}>
              Create Meet →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-[#FF4B00] uppercase tracking-[0.2em] mb-3">Upcoming</h2>
              <div className="divide-y divide-[#111] bg-[#0A0A0A] border border-[#181818] rounded-xl overflow-hidden">
                {upcoming.map(meet => <MeetRow key={meet.id} meet={meet} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-[#333] uppercase tracking-[0.2em] mb-3">Past</h2>
              <div className="divide-y divide-[#0D0D0D] bg-[#080808] border border-[#141414] rounded-xl overflow-hidden opacity-70">
                {past.map(meet => <MeetRow key={meet.id} meet={meet} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function MeetRow({ meet }: { meet: any }) {
  const TYPE_PILL: Record<string, string> = {
    hs:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ncaa:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
    club:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
    elite: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  }
  const TYPE_LABELS: Record<string, string> = { hs: 'HS', ncaa: 'NCAA', club: 'Club', elite: 'Elite' }
  const d = new Date(meet.date)
  const isUpcoming = d >= new Date()

  return (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-[#0F0F0F] transition-colors group">
      <div className="flex items-center gap-4">
        {/* Date block */}
        <div className="text-center w-10 flex-shrink-0">
          <div className="text-[10px] text-[#444] uppercase font-bold tracking-wider">{d.toLocaleDateString('en-US',{month:'short'})}</div>
          <div className="text-xl font-black text-white leading-none" style={{fontFamily:'Barlow Condensed,sans-serif'}}>{d.getDate()}</div>
        </div>
        <div>
          <p className="font-semibold text-white group-hover:text-[#FF4B00] transition-colors">{meet.name}</p>
          <p className="text-xs text-[#444] mt-0.5">{meet.venue || 'Venue TBD'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${TYPE_PILL[meet.meet_type] || ''}`}>
          {TYPE_LABELS[meet.meet_type] || meet.meet_type}
        </span>
        <Link href={`/meets/${meet.id}`} className="text-xs px-3 py-1.5 border border-[#222] text-[#555] hover:text-white hover:border-[#333] rounded transition-colors">
          View
        </Link>
        <Link href={`/meets/${meet.id}/manage`} className="text-xs px-3 py-1.5 bg-[#151515] text-[#666] hover:text-white rounded transition-colors">
          Manage →
        </Link>
      </div>
    </div>
  )
}
