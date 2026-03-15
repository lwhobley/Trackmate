import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MEET_TYPE_LABELS, formatTime } from '@/lib/types'

const TYPE_COLORS: Record<string, string> = {
  hs: 'text-blue-400',
  ncaa: 'text-purple-400',
  club: 'text-orange-400',
  elite: 'text-yellow-400',
}

export default async function MeetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: meet } = await supabase.from('meets').select('*, orgs(*), rulesets(*)').eq('id', id).single()
  if (!meet) notFound()

  const { data: events } = await supabase.from('events').select('*').eq('meet_id', id).order('sort_order')
  const { data: teams } = await supabase.from('teams').select('*, orgs(*)').eq('meet_id', id)
  const { data: entries } = await supabase.from('entries').select('*, athletes(*), events(*)').eq('meet_id', id)

  const athleteCount = new Set(entries?.map(e => e.athlete_id)).size
  const trackEvents = events?.filter(e => !e.is_field) || []
  const fieldEvents = events?.filter(e => e.is_field) || []

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${TYPE_COLORS[meet.meet_type]}`}>
                  {MEET_TYPE_LABELS[meet.meet_type as keyof typeof MEET_TYPE_LABELS]}
                </span>
              </div>
              <h1 className="text-3xl font-black text-white">{meet.name}</h1>
              <p className="text-zinc-400 mt-1">
                {new Date(meet.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {meet.venue && ` · ${meet.venue}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/meets/${id}/live`}
                className="flex items-center gap-2 bg-green-600/20 border border-green-600/30 text-green-400 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-green-600/30 transition-colors">
                <span className="w-2 h-2 rounded-full bg-green-400 live-dot" />
                Live Results
              </Link>
              <Link href={`/meets/${id}/register/team`}
                className="bg-[#FF4B00] hover:bg-[#e04200] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                Register →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Teams', value: teams?.length || 0 },
            { label: 'Athletes', value: athleteCount },
            { label: 'Events', value: events?.length || 0 },
            { label: 'Entry Fee', value: meet.entry_fee_per_athlete > 0 ? `$${meet.entry_fee_per_athlete}/athlete` : 'Free' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5 text-center">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1a1a1a]">
                <h2 className="font-bold text-white">Track Events ({trackEvents.length})</h2>
              </div>
              <div className="divide-y divide-[#0D0D0D]">
                {trackEvents.map(ev => {
                  const evEntries = entries?.filter(e => e.event_id === ev.id) || []
                  return (
                    <div key={ev.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#0D0D0D]">
                      <div>
                        <span className="font-medium text-white text-sm">{ev.name}</span>
                        {ev.gender !== 'mixed' && (
                          <span className="ml-2 text-xs text-zinc-500">{ev.gender === 'm' ? "Men's" : "Women's"}</span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">{evEntries.length} entered</span>
                    </div>
                  )
                })}
              </div>
            </div>
            {fieldEvents.length > 0 && (
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1a1a1a]">
                  <h2 className="font-bold text-white">Field Events ({fieldEvents.length})</h2>
                </div>
                <div className="divide-y divide-[#0D0D0D]">
                  {fieldEvents.map(ev => {
                    const evEntries = entries?.filter(e => e.event_id === ev.id) || []
                    return (
                      <div key={ev.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#0D0D0D]">
                        <span className="font-medium text-white text-sm">{ev.name}</span>
                        <span className="text-xs text-zinc-500">{evEntries.length} entered</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5">
              <h3 className="font-bold text-white mb-3">Registered Teams</h3>
              {!teams?.length ? (
                <p className="text-sm text-zinc-500">No teams registered yet</p>
              ) : (
                <div className="space-y-2">
                  {teams.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[#FF4B00]" />
                      <span className="text-white">{t.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5">
              <h3 className="font-bold text-white mb-3">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { href: `/meets/${id}/register/team`, label: '→ Register Team' },
                  { href: `/meets/${id}/live`, label: '→ Live Results' },
                  { href: `/meets/${id}/scoreboard`, label: '→ Scoreboard' },
                  { href: `/meets/${id}/manage`, label: '→ Manage Meet' },
                  { href: `/meets/${id}/timing`, label: '→ Timing Console' },
                ].map(l => (
                  <Link key={l.href} href={l.href} className="block text-sm text-zinc-400 hover:text-[#FF4B00] transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {meet.rulesets && (
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5">
                <h3 className="font-bold text-white mb-3">Ruleset</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Scoring</span><span className="text-white">Top {(meet.rulesets as any).scoring_top_n}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">FAT Required</span><span className="text-white">{(meet.rulesets as any).fat_required ? 'Yes' : 'No'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Wind Limit</span><span className="text-white">{(meet.rulesets as any).wind_limit}m/s</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
