'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Meet, Event, Team, Entry, Athlete } from '@/lib/types'
import { formatTime } from '@/lib/types'

export default function ManageMeetPage() {
  const { id } = useParams<{ id: string }>()
  const [meet, setMeet] = useState<Meet | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [activeTab, setTab] = useState<'events'|'seeding'|'schedule'|'export'>('events')
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('meets').select('*, orgs(*), rulesets(*)').eq('id', id).single(),
      supabase.from('events').select('*').eq('meet_id', id).order('sort_order'),
      supabase.from('teams').select('*').eq('meet_id', id),
      supabase.from('entries').select('*, athletes(*), events(*)').eq('meet_id', id),
    ]).then(([m, ev, t, en]) => {
      setMeet(m.data as Meet)
      setEvents((ev.data || []) as Event[])
      setTeams((t.data || []) as Team[])
      setEntries((en.data || []) as Entry[])
      setLoading(false)
    })
  }, [id])

  async function generateHeats(eventId: string) {
    setGenerating(true)
    const supabase = createClient()
    const evEntries = entries.filter(e => e.event_id === eventId && e.status !== 'scratched')
    const lanes = 8
    
    await supabase.from('heats').delete().eq('event_id', eventId)
    
    const sorted = [...evEntries].sort((a, b) => (a.seed_time || 999) - (b.seed_time || 999))
    const heatCount = Math.ceil(sorted.length / lanes)
    
    for (let h = 0; h < heatCount; h++) {
      const heatEntries = sorted.slice(h * lanes, (h + 1) * lanes)
      const startList = heatEntries.map((e, i) => ({
        lane: i + 1,
        entry_id: e.id,
        athlete_id: e.athlete_id,
        athlete_name: (e.athletes as any)?.name || 'Unknown',
        seed_time: e.seed_time,
      }))
      await supabase.from('heats').insert({
        event_id: eventId,
        heat_num: h + 1,
        lanes,
        start_list: startList,
      })
    }
    setGenerating(false)
    alert(`Generated ${heatCount} heat(s) for this event!`)
  }

  async function exportCSV(type: string) {
    const supabase = createClient()
    const { data: results } = await supabase.from('results').select('*, entries(*, athletes(*), teams(*), events(*))').eq('entries.meet_id', id)
    
    if (type === 'hytek') {
      const { generateHyTekCSV } = await import('@/lib/export')
      const csv = generateHyTekCSV((results || []) as any)
      download(csv, `${meet?.name || 'meet'}-results.csv`, 'text/csv')
    } else if (type === 'tfrrs') {
      const { generateTFRRSXML } = await import('@/lib/export')
      const xml = generateTFRRSXML(meet as any, (results || []) as any)
      download(xml, `${meet?.name || 'meet'}-tfrrs.xml`, 'text/xml')
    }
  }

  function download(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <svg className="animate-spin h-8 w-8 text-[#FF4B00]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  )

  const tabs = [
    { id: 'events', label: 'Events' },
    { id: 'seeding', label: 'Seeding & Heats' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'export', label: 'Export' },
  ] as const

  const eventEntries = selectedEvent ? entries.filter(e => e.event_id === selectedEvent) : []

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] bg-[#0D0D0D] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 mb-0.5">Managing</div>
            <h1 className="text-lg font-black text-white">{meet?.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/meets/${id}`} className="px-3 py-2 text-sm border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg transition-colors">View Public</Link>
            <Link href={`/meets/${id}/timing`} className="px-3 py-2 text-sm bg-[#1a1a1a] text-zinc-300 hover:text-white rounded-lg transition-colors">⏱ Timing</Link>
            <Link href={`/meets/${id}/live`} className="px-3 py-2 text-sm bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-colors">📡 Live</Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1a1a1a] bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-[#FF4B00] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
                <h2 className="font-bold text-white">Events ({events.length})</h2>
              </div>
              <div className="divide-y divide-[#0D0D0D] max-h-[500px] overflow-y-auto">
                {events.map(ev => {
                  const cnt = entries.filter(e => e.event_id === ev.id).length
                  return (
                    <div key={ev.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#0D0D0D]">
                      <div>
                        <p className="font-medium text-white text-sm">{ev.name}</p>
                        <p className="text-xs text-zinc-500">{ev.gender !== 'mixed' ? (ev.gender === 'm' ? "Men's" : "Women's") : 'Open'} · {cnt} entered</p>
                      </div>
                      <button onClick={() => { setSelectedEvent(ev.id); setTab('seeding') }}
                        className="text-xs px-3 py-1 bg-[#1a1a1a] rounded-lg text-zinc-400 hover:text-white transition-colors">
                        Seed →
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5">
                <h3 className="font-bold text-white mb-3">Teams ({teams.length})</h3>
                {teams.length === 0 ? (
                  <div className="text-sm text-zinc-500">
                    <p>No teams registered.</p>
                    <Link href={`/meets/${id}/register/team`} className="text-[#FF4B00] hover:underline mt-1 block">Register a team →</Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {teams.map(t => (
                      <div key={t.id} className="flex items-center justify-between py-1">
                        <span className="text-sm text-white">{t.name}</span>
                        <span className="text-xs text-zinc-500">{entries.filter(e => e.team_id === t.id).length} entries</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5">
                <h3 className="font-bold text-white mb-3">Meet Stats</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ['Total Entries', entries.length],
                    ['Confirmed', entries.filter(e => e.status === 'confirmed').length],
                    ['Pending', entries.filter(e => e.status === 'pending').length],
                    ['Scratched', entries.filter(e => e.status === 'scratched').length],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between">
                      <span className="text-zinc-500">{k}</span>
                      <span className="text-white font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEEDING TAB */}
        {activeTab === 'seeding' && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
                className="h-10 rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4B00] min-w-[200px]">
                <option value="">Select an event...</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
              {selectedEvent && (
                <button onClick={() => generateHeats(selectedEvent)} disabled={generating}
                  className="h-10 px-4 bg-[#FF4B00] hover:bg-[#e04200] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">
                  {generating ? 'Generating...' : '⚡ Auto-Generate Heats'}
                </button>
              )}
            </div>
            {selectedEvent && (
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1a1a1a]">
                  <h2 className="font-bold text-white">
                    {events.find(e => e.id === selectedEvent)?.name} — Entries ({eventEntries.length})
                  </h2>
                </div>
                {eventEntries.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">No entries for this event yet.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        {['Athlete','Team','Seed Time','Status'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {eventEntries.sort((a,b) => (a.seed_time||999) - (b.seed_time||999)).map(e => (
                        <tr key={e.id} className="border-b border-[#0D0D0D] hover:bg-[#0D0D0D]">
                          <td className="px-4 py-3 text-sm text-white">{(e.athletes as any)?.name}</td>
                          <td className="px-4 py-3 text-sm text-zinc-400">{(e as any).teams?.name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-white font-mono">{e.seed_time ? formatTime(e.seed_time) : 'NM'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
                              e.status === 'confirmed' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                              e.status === 'scratched' ? 'bg-red-600/20 text-red-400 border-red-600/30' :
                              'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                            }`}>{e.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1a1a]">
              <h2 className="font-bold text-white">Event Schedule</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  {['Order','Event','Gender','Type','Scheduled Time'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => (
                  <tr key={ev.id} className="border-b border-[#0D0D0D] hover:bg-[#0D0D0D]">
                    <td className="px-4 py-3 text-sm text-zinc-500">{i+1}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{ev.name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{ev.gender === 'm' ? "Men's" : ev.gender === 'f' ? "Women's" : 'Open'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-500">{ev.is_relay ? '🔄 Relay' : ev.is_field ? '📏 Field' : '🏃 Track'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{ev.scheduled_time ? new Date(ev.scheduled_time).toLocaleTimeString() : 'TBD'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EXPORT TAB */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '📄', title: 'Hy-Tek CSV', desc: 'Standard Hy-Tek compatible results format', action: () => exportCSV('hytek'), label: 'Download CSV' },
              { icon: '🎓', title: 'TFRRS XML', desc: 'NCAA TFRRS submission format (meet_type: ncaa)', action: () => exportCSV('tfrrs'), label: 'Download XML' },
              { icon: '🏁', title: 'LIF Start Lists', desc: 'FinishLynx LIF format for timing system', action: () => alert('Select an event first via the Seeding tab'), label: 'Export via Seeding' },
              { icon: '📧', title: 'Email Heat Sheets', desc: 'Send heat sheets to all registered coaches — coming soon', action: () => alert('Email feature coming soon'), label: 'Coming Soon' },
            ].map(item => (
              <div key={item.title} className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-white">{item.title}</h3>
                <p className="text-sm text-zinc-500 mt-1 mb-4">{item.desc}</p>
                <button onClick={item.action}
                  className="w-full h-9 bg-[#1a1a1a] hover:bg-[#252525] text-white text-sm font-medium rounded-lg transition-colors">
                  {item.label}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
