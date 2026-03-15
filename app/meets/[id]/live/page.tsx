'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/types'
import Link from 'next/link'

interface LiveResult {
  id: string
  place?: number
  fat_time?: number
  wind?: number
  dq: boolean
  dns: boolean
  entries: {
    athlete_id: string
    athletes: { name: string }
    teams: { name: string; color?: string }
    events: { id: string; name: string; gender: string }
  }
}

const SCORING_POINTS = [10, 8, 6, 5, 4, 3, 2, 1]

export default function LivePage() {
  const { id: meetId } = useParams<{ id: string }>()
  const [meet, setMeet] = useState<any>(null)
  const [results, setResults] = useState<LiveResult[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [teamScores, setTeamScores] = useState<{ name: string; points: number }[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connected, setConnected] = useState(false)

  const calcTeamScores = useCallback((res: LiveResult[]) => {
    const byEvent: Record<string, LiveResult[]> = {}
    for (const r of res) {
      const eid = r.entries?.events?.id
      if (!eid) continue
      if (!byEvent[eid]) byEvent[eid] = []
      byEvent[eid].push(r)
    }
    const scores: Record<string, number> = {}
    for (const evResults of Object.values(byEvent)) {
      evResults
        .filter(r => !r.dq && !r.dns && r.place)
        .sort((a, b) => (a.place || 99) - (b.place || 99))
        .slice(0, 8)
        .forEach((r, i) => {
          const team = r.entries?.teams?.name || 'Unknown'
          scores[team] = (scores[team] || 0) + (SCORING_POINTS[i] || 0)
        })
    }
    setTeamScores(
      Object.entries(scores)
        .map(([name, points]) => ({ name, points }))
        .sort((a, b) => b.points - a.points)
    )
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    Promise.all([
      supabase.from('meets').select('*, rulesets(*)').eq('id', meetId).single(),
      supabase.from('events').select('*').eq('meet_id', meetId).order('sort_order'),
      supabase.from('results').select(`
        id, place, fat_time, wind, dq, dns,
        entries!inner(
          athlete_id, meet_id,
          athletes(name),
          teams(name, color),
          events(id, name, gender)
        )
      `).eq('entries.meet_id', meetId),
    ]).then(([m, ev, res]) => {
      setMeet(m.data)
      setEvents(ev.data || [])
      const r = (res.data || []) as unknown as LiveResult[]
      setResults(r)
      calcTeamScores(r)
      setLastUpdate(new Date())
    })

    // Realtime subscription
    const channel = supabase
      .channel(`live-meet-${meetId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'results',
      }, async () => {
        const { data } = await supabase.from('results').select(`
          id, place, fat_time, wind, dq, dns,
          entries!inner(
            athlete_id, meet_id,
            athletes(name),
            teams(name, color),
            events(id, name, gender)
          )
        `).eq('entries.meet_id', meetId)
        const r = (data || []) as unknown as LiveResult[]
        setResults(r)
        calcTeamScores(r)
        setLastUpdate(new Date())
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [meetId, calcTeamScores])

  const filteredResults = selectedEvent === 'all'
    ? results
    : results.filter(r => r.entries?.events?.id === selectedEvent)

  const groupedByEvent: Record<string, LiveResult[]> = {}
  for (const r of filteredResults) {
    const key = r.entries?.events?.name || 'Unknown'
    if (!groupedByEvent[key]) groupedByEvent[key] = []
    groupedByEvent[key].push(r)
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] bg-[#0D0D0D] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-[#FF4B00] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">TM</span>
              </div>
              <span className="font-black text-sm hidden sm:block">TrackMate</span>
            </Link>
            <span className="text-zinc-700">·</span>
            <span className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-none">
              {meet?.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-green-400' : 'text-zinc-500'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 live-dot' : 'bg-zinc-600'}`} />
              {connected ? 'LIVE' : 'Connecting...'}
            </div>
            {lastUpdate && (
              <span className="text-xs text-zinc-600 hidden sm:block">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <Link href={`/meets/${meetId}/scoreboard`}
              className="text-xs px-3 py-1.5 bg-[#1a1a1a] border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg transition-colors">
              Scoreboard →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Team Scores sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden sticky top-20">
              <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center gap-2">
                <span className="text-sm font-bold text-white">Team Scores</span>
              </div>
              {teamScores.length === 0 ? (
                <div className="p-4 text-center text-zinc-600 text-xs">No scored events yet</div>
              ) : (
                <div className="divide-y divide-[#0D0D0D]">
                  {teamScores.map((t, i) => (
                    <div key={t.name} className={`flex items-center justify-between px-4 py-2.5 ${i === 0 ? 'bg-[#FF4B00]/5' : ''}`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-[#FF4B00]' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-600' : 'text-zinc-600'}`}>
                          {i + 1}
                        </span>
                        <span className="text-sm text-white truncate max-w-[120px]">{t.name}</span>
                      </div>
                      <span className={`text-sm font-black ${i === 0 ? 'text-[#FF4B00]' : 'text-white'}`}>
                        {t.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results main */}
          <div className="lg:col-span-3 space-y-4">
            {/* Event filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setSelectedEvent('all')}
                className={`flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${selectedEvent === 'all' ? 'bg-[#FF4B00] text-white' : 'bg-[#1a1a1a] text-zinc-400 hover:text-white'}`}>
                All Events
              </button>
              {events.map(ev => (
                <button key={ev.id} onClick={() => setSelectedEvent(ev.id)}
                  className={`flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${selectedEvent === ev.id ? 'bg-[#FF4B00] text-white' : 'bg-[#1a1a1a] text-zinc-400 hover:text-white'}`}>
                  {ev.name}
                </button>
              ))}
            </div>

            {Object.keys(groupedByEvent).length === 0 ? (
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-16 text-center">
                <div className="text-5xl mb-4">📡</div>
                <h3 className="text-lg font-semibold text-white mb-1">Waiting for results</h3>
                <p className="text-sm text-zinc-500">Results will appear here in real time as they're entered</p>
              </div>
            ) : (
              Object.entries(groupedByEvent).map(([eventName, evResults]) => (
                <div key={eventName} className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-[#0D0D0D] border-b border-[#1a1a1a]">
                    <h3 className="font-bold text-white text-sm">{eventName}</h3>
                    <span className="text-xs text-zinc-500">{evResults.length} results</span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#0D0D0D]">
                        {['Pl','Athlete','Team','Time','Wind'].map(h => (
                          <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-zinc-600 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {evResults
                        .sort((a, b) => (a.place || 99) - (b.place || 99))
                        .map(r => {
                          const windOver = r.wind !== null && r.wind !== undefined && r.wind > (meet?.rulesets?.wind_limit || 2.0)
                          return (
                            <tr key={r.id} className={`border-b border-[#0A0A0A] transition-colors hover:bg-[#0D0D0D] ${r.dq ? 'opacity-40' : ''}`}>
                              <td className="px-4 py-2.5">
                                <span className={`text-sm font-black ${r.place === 1 ? 'text-[#FF4B00]' : r.place === 2 ? 'text-zinc-400' : r.place === 3 ? 'text-amber-600' : 'text-zinc-500'}`}>
                                  {r.dq ? 'DQ' : r.dns ? 'DNS' : r.place || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-sm font-medium text-white">
                                {r.entries?.athletes?.name}
                              </td>
                              <td className="px-4 py-2.5 text-sm text-zinc-400">
                                {r.entries?.teams?.name}
                              </td>
                              <td className="px-4 py-2.5 text-sm font-mono font-semibold text-white">
                                {r.fat_time ? formatTime(r.fat_time) : '—'}
                              </td>
                              <td className="px-4 py-2.5">
                                {r.wind !== null && r.wind !== undefined ? (
                                  <span className={`text-xs font-mono ${windOver ? 'text-yellow-400' : 'text-zinc-500'}`}>
                                    {r.wind > 0 ? '+' : ''}{r.wind?.toFixed(1)}
                                    {windOver && ' ⚠'}
                                  </span>
                                ) : <span className="text-zinc-700">—</span>}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
