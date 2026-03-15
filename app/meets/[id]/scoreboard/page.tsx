'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/types'
import Link from 'next/link'

const POINTS = [10, 8, 6, 5, 4, 3, 2, 1]
const MEET_TYPE_COLORS: Record<string, string> = {
  hs: 'from-blue-900/30 via-[#080808] to-[#080808]',
  ncaa: 'from-purple-900/30 via-[#080808] to-[#080808]',
  club: 'from-orange-900/30 via-[#080808] to-[#080808]',
  elite: 'from-yellow-900/20 via-[#080808] to-[#080808]',
}

export default function ScoreboardPage() {
  const { id: meetId } = useParams<{ id: string }>()
  const [meet, setMeet] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [teamScores, setTeamScores] = useState<{ name: string; points: number; medals: { gold: number; silver: number; bronze: number } }[]>([])
  const [latestEvent, setLatestEvent] = useState<{ name: string; results: any[] } | null>(null)
  const [connected, setConnected] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const compute = useCallback((res: any[]) => {
    const byEvent: Record<string, any[]> = {}
    let lastEventTime = 0
    let lastEventKey = ''

    for (const r of res) {
      const eid = r.entries?.events?.id
      const ename = r.entries?.events?.name
      if (!eid) continue
      if (!byEvent[ename]) byEvent[ename] = []
      byEvent[ename].push(r)
      const t = new Date(r.created_at).getTime()
      if (t > lastEventTime) { lastEventTime = t; lastEventKey = ename }
    }

    const scores: Record<string, { points: number; gold: number; silver: number; bronze: number }> = {}
    for (const evResults of Object.values(byEvent)) {
      evResults
        .filter(r => !r.dq && !r.dns && r.place)
        .sort((a: any, b: any) => (a.place || 99) - (b.place || 99))
        .slice(0, 8)
        .forEach((r: any, i: number) => {
          const t = r.entries?.teams?.name || 'Unknown'
          if (!scores[t]) scores[t] = { points: 0, gold: 0, silver: 0, bronze: 0 }
          scores[t].points += POINTS[i] || 0
          if (i === 0) scores[t].gold++
          if (i === 1) scores[t].silver++
          if (i === 2) scores[t].bronze++
        })
    }

    setTeamScores(
      Object.entries(scores)
        .map(([name, s]) => ({ name, points: s.points, medals: { gold: s.gold, silver: s.silver, bronze: s.bronze } }))
        .sort((a, b) => b.points - a.points)
    )

    if (lastEventKey && byEvent[lastEventKey]) {
      setLatestEvent({
        name: lastEventKey,
        results: byEvent[lastEventKey].sort((a: any, b: any) => (a.place || 99) - (b.place || 99)).slice(0, 8)
      })
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('meets').select('*, rulesets(*)').eq('id', meetId).single(),
      supabase.from('events').select('*').eq('meet_id', meetId).order('sort_order'),
      supabase.from('results').select(`
        id, place, fat_time, wind, dq, dns, created_at,
        entries!inner(meet_id, athletes(name), teams(name), events(id, name, gender))
      `).eq('entries.meet_id', meetId),
    ]).then(([m, ev, res]) => {
      setMeet(m.data)
      setEvents(ev.data || [])
      setResults(res.data || [])
      compute(res.data || [])
    })

    const channel = supabase.channel(`scoreboard-${meetId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, async () => {
        const { data } = await supabase.from('results').select(`
          id, place, fat_time, wind, dq, dns, created_at,
          entries!inner(meet_id, athletes(name), teams(name), events(id, name, gender))
        `).eq('entries.meet_id', meetId)
        setResults(data || [])
        compute(data || [])
      })
      .subscribe(s => setConnected(s === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [meetId, compute])

  const gradient = MEET_TYPE_COLORS[meet?.meet_type] || MEET_TYPE_COLORS.hs

  return (
    <div className={`min-h-screen bg-gradient-to-b ${gradient} bg-[#080808]`}>
      {/* Scoreboard header */}
      <div className="text-center pt-8 pb-4 px-4">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-8 h-8 bg-[#FF4B00] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">TM</span>
          </div>
          <span className="text-zinc-500 text-sm font-medium">LIVE SCOREBOARD</span>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${connected ? 'text-green-400' : 'text-zinc-600'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 live-dot' : 'bg-zinc-600'}`} />
            {connected ? 'LIVE' : '...'}
          </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{meet?.name}</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {meet?.date && new Date(meet.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          {meet?.venue && ` · ${meet.venue}`}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Team standings */}
          <div className="lg:col-span-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Team Standings</h2>
            <div className="space-y-2">
              {teamScores.length === 0 ? (
                <div className="rounded-2xl border border-[#2A2A2A] bg-[#111111]/80 p-10 text-center text-zinc-600">
                  <div className="text-4xl mb-3">🏟️</div>
                  <p>Results will appear here</p>
                </div>
              ) : (
                teamScores.map((team, i) => (
                  <div key={team.name} className={`rounded-xl border flex items-center gap-4 px-5 py-4 transition-all ${
                    i === 0 ? 'border-[#FF4B00]/40 bg-[#FF4B00]/10 shadow-lg shadow-orange-500/10' :
                    i === 1 ? 'border-zinc-600/30 bg-zinc-800/20' :
                    i === 2 ? 'border-amber-700/30 bg-amber-900/10' :
                    'border-[#2A2A2A] bg-[#111111]/60'
                  }`}>
                    <span className={`text-2xl font-black w-8 text-center ${
                      i === 0 ? 'text-[#FF4B00]' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-600' : 'text-zinc-600'
                    }`}>{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-bold text-white text-lg leading-tight">{team.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {team.medals.gold > 0 && <span className="text-xs text-yellow-400">🥇 {team.medals.gold}</span>}
                        {team.medals.silver > 0 && <span className="text-xs text-zinc-400">🥈 {team.medals.silver}</span>}
                        {team.medals.bronze > 0 && <span className="text-xs text-amber-600">🥉 {team.medals.bronze}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-4xl font-black ${i === 0 ? 'text-[#FF4B00]' : 'text-white'}`}>{team.points}</span>
                      <p className="text-xs text-zinc-600">pts</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Latest event + events list */}
          <div className="lg:col-span-2 space-y-4">
            {latestEvent && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Latest Results</h2>
                <div className="rounded-xl border border-[#2A2A2A] bg-[#111111]/80 overflow-hidden">
                  <div className="px-4 py-3 bg-[#0D0D0D] border-b border-[#1a1a1a]">
                    <span className="font-bold text-white text-sm">{latestEvent.name}</span>
                  </div>
                  <div className="divide-y divide-[#0A0A0A]">
                    {latestEvent.results.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black w-5 text-center ${
                            r.place === 1 ? 'text-[#FF4B00]' : r.place === 2 ? 'text-zinc-400' : r.place === 3 ? 'text-amber-600' : 'text-zinc-600'
                          }`}>{r.place}</span>
                          <div>
                            <p className="text-sm font-medium text-white">{r.entries?.athletes?.name}</p>
                            <p className="text-xs text-zinc-500">{r.entries?.teams?.name}</p>
                          </div>
                        </div>
                        <span className="text-sm font-mono font-bold text-white">
                          {r.fat_time ? formatTime(r.fat_time) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Events ({events.length})</h2>
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111]/80 overflow-hidden max-h-72 overflow-y-auto">
                {events.map(ev => {
                  const done = results.some(r => r.entries?.events?.id === ev.id)
                  return (
                    <div key={ev.id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#0A0A0A] last:border-0">
                      <span className="text-sm text-white">{ev.name}</span>
                      <span className={`text-xs font-medium ${done ? 'text-green-400' : 'text-zinc-600'}`}>
                        {done ? '✓' : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/meets/${meetId}/live`}
                className="flex-1 text-center py-2 text-xs font-semibold border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg transition-colors">
                Full Results
              </Link>
              <Link href={`/meets/${meetId}`}
                className="flex-1 text-center py-2 text-xs font-semibold border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg transition-colors">
                Meet Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
