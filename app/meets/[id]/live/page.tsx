'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/types'
import Link from 'next/link'

const POINTS = [10, 8, 6, 5, 4, 3, 2, 1]

export default function LivePage() {
  const { id: meetId } = useParams<{ id: string }>()
  const [meet, setMeet] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [teamScores, setTeamScores] = useState<{name:string;points:number}[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date|null>(null)
  const [connected, setConnected] = useState(false)

  const calcScores = useCallback((res: any[]) => {
    const byEvent: Record<string,any[]> = {}
    for (const r of res) {
      const eid = r.entries?.events?.id
      if (!eid) continue
      if (!byEvent[eid]) byEvent[eid] = []
      byEvent[eid].push(r)
    }
    const scores: Record<string,number> = {}
    for (const evR of Object.values(byEvent)) {
      evR.filter((r:any) => !r.dq && !r.dns && r.place)
        .sort((a:any,b:any) => (a.place||99)-(b.place||99))
        .slice(0,8)
        .forEach((r:any,i:number) => {
          const t = r.entries?.teams?.name||'Unknown'
          scores[t] = (scores[t]||0)+(POINTS[i]||0)
        })
    }
    setTeamScores(Object.entries(scores).map(([name,points])=>({name,points})).sort((a,b)=>b.points-a.points))
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const q = `id, place, fat_time, wind, dq, dns, created_at,
      entries!inner(athlete_id, meet_id, athletes(name), teams(name), events(id, name, gender))`
    
    Promise.all([
      supabase.from('meets').select('*, rulesets(*)').eq('id', meetId).single(),
      supabase.from('events').select('*').eq('meet_id', meetId).order('sort_order'),
      supabase.from('results').select(q).eq('entries.meet_id', meetId),
    ]).then(([m, ev, res]) => {
      setMeet(m.data); setEvents(ev.data||[])
      setResults(res.data||[]); calcScores(res.data||[]); setLastUpdate(new Date())
    })

    const ch = supabase.channel(`live-${meetId}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'results' }, async () => {
        const { data } = await supabase.from('results').select(q).eq('entries.meet_id', meetId)
        setResults(data||[]); calcScores(data||[]); setLastUpdate(new Date())
      })
      .subscribe(s => setConnected(s==='SUBSCRIBED'))
    return () => { supabase.removeChannel(ch) }
  }, [meetId, calcScores])

  const filtered = selectedEvent==='all' ? results : results.filter(r=>r.entries?.events?.id===selectedEvent)
  const grouped: Record<string,any[]> = {}
  for (const r of filtered) {
    const k = r.entries?.events?.name||'Unknown'
    if (!grouped[k]) grouped[k]=[]
    grouped[k].push(r)
  }

  return (
    <div className="min-h-screen bg-[#060608]">
      {/* Header */}
      <div className="border-b border-[#111116] bg-[#0C0C10] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#FF4B00] rounded-lg flex items-center justify-center shadow-md shadow-orange-500/20">
                <span style={{fontFamily:'var(--font-display)',fontWeight:900}} className="text-white text-xs">TM</span>
              </div>
              <span style={{fontFamily:'var(--font-display)',fontWeight:800,letterSpacing:'0.05em'}} className="text-white text-sm uppercase hidden sm:block">TrackMate</span>
            </Link>
            <span className="text-[#222228]">·</span>
            <span style={{fontFamily:'var(--font-display)',fontWeight:700}} className="text-white uppercase text-sm tracking-wide truncate max-w-[180px] sm:max-w-none">
              {meet?.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-xs font-display font-600 uppercase tracking-wider ${connected?'text-green-400':'text-[#6B6B7A]'}`}
              style={{fontFamily:'var(--font-display)',fontWeight:600}}>
              <span className={`w-2 h-2 rounded-full ${connected?'bg-green-400 live-dot':'bg-[#333340]'}`}/>
              {connected?'Live':'—'}
            </div>
            {lastUpdate && <span className="text-[10px] text-[#6B6B7A] hidden sm:block">↑ {lastUpdate.toLocaleTimeString()}</span>}
            <Link href={`/meets/${meetId}/scoreboard`}
              className="text-xs px-3 py-1.5 border border-[#222228] hover:border-[#FF4B00]/40 text-[#6B6B7A] hover:text-white rounded-lg transition-colors">
              Scoreboard →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Team Scores */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-[#222228] bg-[#0C0C10] overflow-hidden sticky top-16">
              <div className="px-4 py-3 border-b border-[#111116]">
                <p style={{fontFamily:'var(--font-display)',fontWeight:700}} className="text-white uppercase text-xs tracking-widest">Team Scores</p>
              </div>
              {teamScores.length===0 ? (
                <div className="p-6 text-center text-[#333340] text-xs">Awaiting results</div>
              ) : (
                <div className="divide-y divide-[#0A0A0E]">
                  {teamScores.map((t,i)=>(
                    <div key={t.name} className={`flex items-center justify-between px-4 py-3 ${i===0?'bg-[#FF4B00]/5':''}`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`stat-num text-sm w-5 text-center ${i===0?'text-[#FF4B00]':i===1?'text-[#6B6B7A]':i===2?'text-amber-600':'text-[#333340]'}`}>
                          {i+1}
                        </span>
                        <span className="text-sm text-white truncate max-w-[110px]">{t.name}</span>
                      </div>
                      <span className={`stat-num text-lg ${i===0?'text-[#FF4B00]':'text-white'}`}>{t.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {/* Event filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button onClick={()=>setSelectedEvent('all')}
                className={`flex-none px-4 py-1.5 rounded-xl text-xs font-display font-700 uppercase tracking-wider transition-all ${selectedEvent==='all'?'bg-[#FF4B00] text-white shadow-md shadow-orange-500/20':'bg-[#0C0C10] border border-[#222228] text-[#6B6B7A] hover:text-white hover:border-[#333340]'}`}
                style={{fontFamily:'var(--font-display)',fontWeight:700}}>
                All Events
              </button>
              {events.map(ev=>(
                <button key={ev.id} onClick={()=>setSelectedEvent(ev.id)}
                  className={`flex-none px-4 py-1.5 rounded-xl text-xs font-display font-700 uppercase tracking-wider transition-all whitespace-nowrap ${selectedEvent===ev.id?'bg-[#FF4B00] text-white shadow-md shadow-orange-500/20':'bg-[#0C0C10] border border-[#222228] text-[#6B6B7A] hover:text-white hover:border-[#333340]'}`}
                  style={{fontFamily:'var(--font-display)',fontWeight:700}}>
                  {ev.name}
                </button>
              ))}
            </div>

            {Object.keys(grouped).length===0 ? (
              <div className="rounded-xl border border-[#222228] bg-[#0C0C10] p-16 text-center">
                <div className="text-5xl mb-4">📡</div>
                <h3 style={{fontFamily:'var(--font-display)',fontWeight:700}} className="text-lg text-white uppercase mb-1">Awaiting Results</h3>
                <p className="text-sm text-[#6B6B7A]">Results appear here in real time as they&apos;re entered</p>
              </div>
            ) : (
              Object.entries(grouped).map(([eventName, evResults])=>(
                <div key={eventName} className="rounded-xl border border-[#222228] bg-[#0C0C10] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-[#111116] border-b border-[#111116]">
                    <h3 style={{fontFamily:'var(--font-display)',fontWeight:700}} className="text-white uppercase tracking-wide text-sm">{eventName}</h3>
                    <span className="text-[10px] text-[#6B6B7A] font-display uppercase">{evResults.length} results</span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#0A0A0E]">
                        {['Pl','Athlete','Team','Time','Wind'].map(h=>(
                          <th key={h} style={{fontFamily:'var(--font-display)',fontWeight:700}} className="text-left px-4 py-2 text-[10px] text-[#333340] uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {evResults.sort((a:any,b:any)=>(a.place||99)-(b.place||99)).map((r:any)=>{
                        const windOver = r.wind!=null && r.wind>(meet?.rulesets?.wind_limit||2.0)
                        return (
                          <tr key={r.id} className={`border-b border-[#0A0A0E] row-hover ${r.dq?'opacity-30':''}`}>
                            <td className="px-4 py-3">
                              <span className={`stat-num text-sm ${r.place===1?'text-[#FF4B00]':r.place===2?'text-[#6B6B7A]':r.place===3?'text-amber-500':'text-[#333340]'}`}>
                                {r.dq?'DQ':r.dns?'DNS':r.place||'—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-white">{r.entries?.athletes?.name}</td>
                            <td className="px-4 py-3 text-sm text-[#6B6B7A]">{r.entries?.teams?.name}</td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-mono font-bold text-white">{r.fat_time?formatTime(r.fat_time):'—'}</span>
                            </td>
                            <td className="px-4 py-3">
                              {r.wind!=null?(
                                <span className={`text-xs font-mono ${windOver?'text-yellow-400':'text-[#6B6B7A]'}`}>
                                  {r.wind>0?'+':''}{r.wind?.toFixed(1)}{windOver?' ⚠':''}
                                </span>
                              ):<span className="text-[#222228]">—</span>}
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
