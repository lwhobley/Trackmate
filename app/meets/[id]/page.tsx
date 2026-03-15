import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MEET_TYPE_LABELS, formatTime } from '@/lib/types'

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  hs:    { label: 'HS / NFHS',    cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  ncaa:  { label: 'NCAA',         cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  club:  { label: 'Club / AAU',   cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  elite: { label: 'Elite / Open', cls: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' },
}

export default async function MeetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: meet } = await supabase.from('meets').select('*, orgs(*), rulesets(*)').eq('id', id).single()
  if (!meet) notFound()

  const { data: events } = await supabase.from('events').select('*').eq('meet_id', id).order('sort_order')
  const { data: teams } = await supabase.from('teams').select('*').eq('meet_id', id)
  const { data: entries } = await supabase.from('entries').select('athlete_id, event_id').eq('meet_id', id)

  const badge = TYPE_BADGE[meet.meet_type] || TYPE_BADGE.hs
  const athleteCount = new Set(entries?.map(e => e.athlete_id)).size
  const trackEvents = events?.filter(e => !e.is_field) || []
  const fieldEvents = events?.filter(e => e.is_field) || []

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Hero header */}
      <div className="border-b border-[#181818] bg-[#080808]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded border ${badge.cls}`}>{badge.label}</span>
                {meet.registration_open && (
                  <span className="text-[10px] font-bold text-[#00C853] uppercase tracking-widest px-2 py-1 rounded bg-[#00C853]/10 border border-[#00C853]/20">
                    Registration Open
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-black text-white uppercase tracking-wide leading-none mb-2"
                style={{fontFamily:'Barlow Condensed,sans-serif'}}>{meet.name}</h1>
              <p className="text-[#555] text-sm">
                {new Date(meet.date).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
                {meet.venue && <span className="text-[#333]"> · {meet.venue}</span>}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href={`/meets/${id}/live`}
                className="flex items-center gap-2 bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] font-bold px-4 py-2 rounded text-sm hover:bg-[#00C853]/20 transition-colors uppercase tracking-wider"
                style={{fontFamily:'Barlow Condensed,sans-serif'}}>
                <span className="w-2 h-2 rounded-full bg-[#00C853] live-dot" />
                Live
              </Link>
              <Link href={`/meets/${id}/register/team`}
                className="bg-[#FF4B00] hover:bg-[#cc3c00] text-white font-black px-5 py-2 rounded text-sm transition-all hover:scale-105 uppercase tracking-wider"
                style={{fontFamily:'Barlow Condensed,sans-serif'}}>
                Register →
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#111]">
            {[
              { label: 'Teams',     value: teams?.length || 0 },
              { label: 'Athletes',  value: athleteCount },
              { label: 'Events',    value: events?.length || 0 },
              { label: 'Entry Fee', value: meet.entry_fee_per_athlete > 0 ? `$${meet.entry_fee_per_athlete}` : 'Free' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-black text-white" style={{fontFamily:'Barlow Condensed,sans-serif'}}>{s.value}</div>
                <div className="text-[10px] text-[#333] uppercase tracking-widest font-bold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Track events */}
            <div className="bg-[#080808] border border-[#181818] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#111] flex items-center justify-between">
                <h2 className="font-black text-white uppercase tracking-wide text-lg" style={{fontFamily:'Barlow Condensed,sans-serif'}}>Track Events</h2>
                <span className="text-xs text-[#333] font-bold">{trackEvents.length}</span>
              </div>
              <div className="divide-y divide-[#0A0A0A]">
                {trackEvents.map(ev => (
                  <div key={ev.id} className="lane-row flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white text-sm">{ev.name}</span>
                      {ev.gender !== 'mixed' && (
                        <span className="text-[10px] text-[#444] uppercase font-bold tracking-wider">{ev.gender === 'm' ? "Men's" : "Women's"}</span>
                      )}
                      {ev.is_relay && <span className="text-[10px] text-[#FF4B00] uppercase font-bold tracking-wider">Relay</span>}
                    </div>
                    <span className="text-xs text-[#333]">{entries?.filter(e => e.event_id === ev.id).length || 0} entered</span>
                  </div>
                ))}
              </div>
            </div>

            {fieldEvents.length > 0 && (
              <div className="bg-[#080808] border border-[#181818] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#111] flex items-center justify-between">
                  <h2 className="font-black text-white uppercase tracking-wide text-lg" style={{fontFamily:'Barlow Condensed,sans-serif'}}>Field Events</h2>
                  <span className="text-xs text-[#333] font-bold">{fieldEvents.length}</span>
                </div>
                <div className="divide-y divide-[#0A0A0A]">
                  {fieldEvents.map(ev => (
                    <div key={ev.id} className="lane-row flex items-center justify-between px-5 py-3">
                      <span className="font-semibold text-white text-sm">{ev.name}</span>
                      <span className="text-xs text-[#333]">{entries?.filter(e => e.event_id === ev.id).length || 0} entered</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-[#080808] border border-[#181818] rounded-xl p-5">
              <h3 className="font-black text-white uppercase tracking-wide text-sm mb-4" style={{fontFamily:'Barlow Condensed,sans-serif'}}>Quick Links</h3>
              <div className="space-y-1">
                {[
                  { href: `/meets/${id}/register/team`, label: 'Register Team', icon: '📝' },
                  { href: `/meets/${id}/live`,           label: 'Live Results',  icon: '📡' },
                  { href: `/meets/${id}/scoreboard`,     label: 'Scoreboard',    icon: '🏆' },
                  { href: `/meets/${id}/manage`,         label: 'Manage Meet',   icon: '⚙️' },
                  { href: `/meets/${id}/timing`,         label: 'Timing Console',icon: '⏱' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-[#111] text-[#555] hover:text-white transition-all group">
                    <span>{l.icon}</span>
                    <span className="text-sm font-medium group-hover:text-[#FF4B00] transition-colors">{l.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {teams && teams.length > 0 && (
              <div className="bg-[#080808] border border-[#181818] rounded-xl p-5">
                <h3 className="font-black text-white uppercase tracking-wide text-sm mb-3" style={{fontFamily:'Barlow Condensed,sans-serif'}}>Teams ({teams.length})</h3>
                <div className="space-y-2">
                  {teams.map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF4B00]" />
                      <span className="text-sm text-[#888]">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {meet.rulesets && (
              <div className="bg-[#080808] border border-[#181818] rounded-xl p-5">
                <h3 className="font-black text-white uppercase tracking-wide text-sm mb-3" style={{fontFamily:'Barlow Condensed,sans-serif'}}>Ruleset</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ['Scoring', `Top ${(meet.rulesets as any).scoring_top_n}`],
                    ['FAT Required', (meet.rulesets as any).fat_required ? 'Yes' : 'No'],
                    ['Wind Limit', `${(meet.rulesets as any).wind_limit}m/s`],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between">
                      <span className="text-[#444] text-xs uppercase tracking-wider font-bold">{k}</span>
                      <span className="text-white text-xs font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
