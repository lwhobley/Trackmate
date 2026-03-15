'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/types'
import Link from 'next/link'

const SCORING_POINTS = [10, 8, 6, 5, 4, 3, 2, 1]

export default function LivePage() {
  const { id: meetId } = useParams<{ id: string }>()
  const [meet, setMeet] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [teamScores, setTeamScores] = useState<{ name: string; points: number }[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connected, setConnected] = useState(false)

  const calcTeamScores = useCallback((res: any[]) => {
    const byEvent: Record<string, any[]> = {}
    for (const r of res) {
      const eid = r.entries?.events?.id
      if (!eid) continue
      if (!byEvent[eid]) byEvent[eid] = []
      byEvent[eid].push(r)
    }
    const scores: Record<string, number> = {}
    for (const evResults of Object.values(byEvent)) {
      evResults.filter(r => !r.dq && !r.dns && r.place)
        .sort((a, b) => (a.place||99) - (b.place||99)).slice(0, 8)
        .forEach((r, i) => {
          const t = r.entries?.teams?.name || 'Unknown'
          scores[t] = (scores[t] || 0) + (SCORING_POINTS[i] || 0)
        })
    }
    setTeamScores(Object.entries(scores).map(([name, points]) => ({ name, points })).sort((a,b) => b.points - a.points))
  }, [])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('meets').select('*, rulesets(*)').eq('id', meetId).single(),
      supabase.from('events').select('*').eq('meet_id', meetId).order('sort_order'),
      supabase.from('results').select(`id,place,fat_time,wind,dq,dns,created_at,entries!inner(athlete_id,meet_id,athletes(name),teams(name),events(id,name,gender))`).eq('entries.meet_id', meetId),
    ]).then(([m, ev, res]) => {
      setMeet(m.data); setEvents(ev.data || [])
      setResults(res.data || []); calcTeamScores(res.data || [])
      setLastUpdate(new Date())
    })
    const channel = supabase.channel(`live-${meetId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, async () => {
        const { data } = await supabase.from('results').select(`id,place,fat_time,wind,dq,dns,created_at,entries!inner(athlete_id,meet_id,athletes(name),teams(name),events(id,name,gender))`).eq('entries.meet_id', meetId)
        setResults(data || []); calcTeamScores(data || []); setLastUpdate(new Date())
      })
      .subscribe(s => setConnected(s === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(channel) }
  }, [meetId, calcTeamScores])

  const filtered = selectedEvent === 'all' ? results : results.filter(r => r.entries?.events?.id === selectedEvent)
  const grouped: Record<string, any[]> = {}
  for (const r of filtered) {
    const k = r.entries?.events?.name || 'Unknown'
    if (!grouped[k]) grouped[k] = []
    grouped[k].push(r)
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-[#181818]">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#FF4B00] rounded flex items-center justify-center rotate-2">
                <span className="text-white font-black text-[10px] -rotate-2" style={{fontFamily:'Barlow Condensed,sans-serif'}}>TM</span>
              </div>
            </Link>
            <div>
              <p className="text-[10px] text-[#444] uppercase tracking-widest font-bold">Live Results</p>
              <p className="text-white font-black text-sm leading-none" style={{fontFamily:'Barlow Condensed,sans-serif'}}>{meet?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${connected ? 'text-[#00C853]' : 'text-[#444]'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#00C853] live-dot' : 'bg-[#333]'}`} />
              {connected ? 'Live' : 'Connecting'}
            </div>
            {lastUpdate && <span className="text-[10px] text-[#333] hidden sm:block">Updated {lastUpdate.toLocaleTimeString()}</span>}
            <Link href={`/meets/${meetId}/scoreboard`}
              className="text-xs px-3 py-1.5 border border-[#222] text-[#555] hover:text-white hover:border-[#333] rounded transition-colors font-medium">
              Scoreboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Team Scores */}
          <div className="lg:col-span-1">
            <div className="bg-[#080808] border border-[#181818] rounded-xl overflow-hidden sticky top-20">
              <div className="px-4 py-3 border-b border-[#111]">
                <h2 className="text-xs font-black text-[#555] uppercase tracking-[0.2em]">Team Scores</h2>
              </div>
              {teamScores.length === 0 ? (
                <div className="p-6 text-center text-[#333] text-xs">No results yet</div>
              ) : (
                <div>
                  {teamScores.map((t, i) => (
                    <div key={t.name} className={`flex items-center justify-between px-4 py-3 border-b border-[#0D0D0D] ${i === 0 ? 'bg-[#FF4B00]/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-black w-4 ${i===0?'text-[#FF4B00]':i===1?'medal-silver':i===2?'medal-bronze':'text-[#333]'}`}>{i+1}</span>
                        <span className="text-sm text-white font-medium truncate max-w-[100px]">{t.name}</span>
                      </div>
                      <span className={`font-black text-lg ${i===0?'text-[#FF4B00]':'text-white'}`} style={{fontFamily:'Barlow Condensed,sans-serif'}}>{t.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {/* Event filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {['all', ...events.map(e => e.id)].map((id) => {
                const label = id === 'all' ? 'All Events' : events.find(e => e.id === id)?.name || id
                return (
                  <button key={id} onClick={() => setSelectedEvent(id)}
                    className={`flex-none px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${selectedEvent === id ? 'bg-[#FF4B00] text-white' : 'bg-[#0A0A0A] border border-[#1A1A1A] text-[#555] hover:text-white hover:border-[#333]'}`}
                    style={{fontFamily:'Barlow Condensed,sans-serif'}}>
                    {label}
                  </button>
                )
              })}
            </div>

            {Object.keys(grouped).length === 0 ? (
              <div className="bg-[#080808] border border-[#181818] rounded-xl p-20 text-center">
                <div className="text-5xl mb-4">📡</div>
                <h3 className="text-2xl font-black text-white uppercase mb-2" style={{fontFamily:'Barlow Condensed,sans-serif'}}>Waiting for results</h3>
                <p className="text-[#333] text-sm">Results appear here in real time</p>
              </div>
            ) : (
              Object.entries(grouped).map(([eventName, evResults]) => (
                <div key={eventName} className="bg-[#080808] border border-[#181818] rounded-xl overflow-hidden animate-in">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#111] bg-[#0A0A0A]">
                    <h3 className="font-black text-white text-lg uppercase tracking-wide" style={{fontFamily:'Barlow Condensed,sans-serif'}}>{eventName}</h3>
                    <span className="text-[10px] text-[#333] font-bold uppercase tracking-widest">{evResults.length} results</span>
                  </div>
                  <div>
                    {evResults.sort((a,b) => (a.place||99)-(b.place||99)).map((r, idx) => {
                      const windOver = r.wind !== null && r.wind !== undefined && r.wind > (meet?.rulesets?.wind_limit || 2.0)
                      return (
                        <div key={r.id} className={`lane-row flex items-center px-5 py-3 border-b border-[#0A0A0A] ${r.dq?'opacity-40':''}`}>
                          <div className={`w-8 font-black text-xl mr-4 ${r.place===1?'text-[#FF4B00]':r.place===2?'medal-silver':r.place===3?'medal-bronze':'text-[#333]'}`}
                            style={{fontFamily:'Barlow Condensed,sans-serif'}}>
                            {r.dq?'DQ':r.dns?'DNS':r.place||'—'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white text-sm">{r.entries?.athletes?.name}</p>
                            <p className="text-[10px] text-[#444] uppercase tracking-wider">{r.entries?.teams?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-white text-lg font-mono" style={{fontFamily:'Barlow Condensed,sans-serif'}}>
                              {r.fat_time ? formatTime(r.fat_time) : '—'}
                            </p>
                            {r.wind !== null && r.wind !== undefined && (
                              <p className={`text-[10px] font-mono ${windOver?'text-yellow-400':'text-[#333]'}`}>
                                {r.wind > 0 ? '+' : ''}{r.wind?.toFixed(1)}m/s{windOver ? ' ⚠' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
