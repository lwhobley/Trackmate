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
      const eid = r.entries?.events?.id; if (!eid) continue
      if (!byEvent[eid]) byEvent[eid] = []; byEvent[eid].push(r)
    }
    const scores: Record<string,number> = {}
    for (const evR of Object.values(byEvent)) {
      evR.filter((r:any) => !r.dq && !r.dns && r.place)
        .sort((a:any,b:any) => (a.place||99)-(b.place||99)).slice(0,8)
        .forEach((r:any,i:number) => { const t = r.entries?.teams?.name||'Unknown'; scores[t]=(scores[t]||0)+(POINTS[i]||0) })
    }
    setTeamScores(Object.entries(scores).map(([name,points])=>({name,points})).sort((a,b)=>b.points-a.points))
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const q = `id, place, fat_time, wind, dq, dns, created_at, entries!inner(athlete_id, meet_id, athletes(name), teams(name), events(id, name, gender))`
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
      }).subscribe(s => setConnected(s==='SUBSCRIBED'))
    return () => { supabase.removeChannel(ch) }
  }, [meetId, calcScores])

  const filtered = selectedEvent==='all' ? results : results.filter(r=>r.entries?.events?.id===selectedEvent)
  const grouped: Record<string,any[]> = {}
  for (const r of filtered) { const k=r.entries?.events?.name||'Unknown'; if(!grouped[k]) grouped[k]=[]; grouped[k].push(r) }

  return (
    <div className="min-h-screen" style={{background:'var(--bg-2)'}}>
      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="blob absolute w-96 h-96 -top-20 -right-20 bg-[#6C63FF] opacity-[0.06]" />
        <div className="blob absolute w-80 h-80 bottom-20 -left-20 bg-[#FF4B00] opacity-[0.05]" style={{animationDelay:'5s'}} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b sticky top-0" style={{background:'rgba(255,255,255,0.85)',backdropFilter:'blur(20px)',borderColor:'rgba(108,99,255,0.1)'}}>
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#FF4B00,#FF7A3D)'}}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M3 17L10 3l7 14M6 11h8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="font-semibold text-sm hidden sm:block" style={{color:'var(--text)'}}>TrackMate</span>
            </Link>
            <span style={{color:'rgba(108,99,255,0.2)'}}>·</span>
            <span className="font-semibold text-sm truncate max-w-[180px] sm:max-w-xs" style={{color:'var(--text)'}}>{meet?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {connected ? (
              <div className="live-pill">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot" />
                LIVE
              </div>
            ) : (
              <div className="tag tag-accent" style={{color:'var(--text-subtle)'}}>Connecting…</div>
            )}
            {lastUpdate && <span className="text-xs hidden sm:block" style={{color:'var(--text-subtle)'}}>↑ {lastUpdate.toLocaleTimeString()}</span>}
            <Link href={`/meets/${meetId}/scoreboard`} className="btn-secondary text-xs py-1.5 px-3">Scoreboard →</Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Team Scores */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl overflow-hidden sticky top-16">
              <div className="px-4 py-3 border-b" style={{borderColor:'rgba(108,99,255,0.08)'}}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--text-subtle)'}}>Team Scores</p>
              </div>
              {teamScores.length===0 ? (
                <div className="p-6 text-center text-sm" style={{color:'var(--text-subtle)'}}>Awaiting results</div>
              ) : (
                <div className="divide-y" style={{borderColor:'rgba(108,99,255,0.06)'}}>
                  {teamScores.map((t,i)=>(
                    <div key={t.name} className={`flex items-center justify-between px-4 py-3 ${i===0?'':''}` }>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-sm font-bold w-5 text-center ${i===0?'text-[#FF4B00]':i===1?'text-[#6B6880]':i===2?'text-amber-500':'text-[--text-subtle]'}`}>{i+1}</span>
                        <span className="text-sm font-medium truncate max-w-[110px]" style={{color:'var(--text)'}}>{t.name}</span>
                      </div>
                      <span className={`font-bold text-lg ${i===0?'text-[#FF4B00]':''}`} style={i!==0?{color:'var(--text)'}:{}}>{t.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {/* Event filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={()=>setSelectedEvent('all')}
                className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedEvent==='all'?'text-white shadow-md':'btn-secondary text-xs py-1.5'}`}
                style={selectedEvent==='all'?{background:'linear-gradient(135deg,#6C63FF,#9B8FFF)'}:{}}>
                All Events
              </button>
              {events.map(ev=>(
                <button key={ev.id} onClick={()=>setSelectedEvent(ev.id)}
                  className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedEvent===ev.id?'text-white shadow-md':'btn-secondary text-xs py-1.5'}`}
                  style={selectedEvent===ev.id?{background:'linear-gradient(135deg,#6C63FF,#9B8FFF)'}:{}}>
                  {ev.name}
                </button>
              ))}
            </div>

            {Object.keys(grouped).length===0 ? (
              <div className="glass rounded-3xl p-16 text-center">
                <div className="text-5xl mb-4">📡</div>
                <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',color:'var(--text)'}}>Awaiting Results</h3>
                <p className="text-sm mt-2" style={{color:'var(--text-muted)'}}>Results appear here in real time</p>
              </div>
            ) : (
              Object.entries(grouped).map(([eventName, evResults])=>(
                <div key={eventName} className="glass-card rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b" style={{borderColor:'rgba(108,99,255,0.08)'}}>
                    <h3 className="font-semibold text-[15px]" style={{color:'var(--text)'}}>{eventName}</h3>
                    <span className="text-xs" style={{color:'var(--text-subtle)'}}>{evResults.length} results</span>
                  </div>
                  <table className="data-table">
                    <thead><tr>{['Pl','Athlete','Team','Time','Wind'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {evResults.sort((a:any,b:any)=>(a.place||99)-(b.place||99)).map((r:any)=>{
                        const windOver = r.wind!=null && r.wind>(meet?.rulesets?.wind_limit||2.0)
                        return (
                          <tr key={r.id} className={r.dq?'opacity-40':''}>
                            <td>
                              <span className={`font-bold text-sm ${r.place===1?'text-[#FF4B00]':r.place===2?'text-[#6B6880]':r.place===3?'text-amber-500':''}`} style={r.place>3?{color:'var(--text-subtle)'}:{}}>
                                {r.dq?'DQ':r.dns?'DNS':r.place||'—'}
                              </span>
                            </td>
                            <td className="font-medium">{r.entries?.athletes?.name}</td>
                            <td style={{color:'var(--text-muted)'}}>{r.entries?.teams?.name}</td>
                            <td><span className="font-mono font-semibold">{r.fat_time?formatTime(r.fat_time):'—'}</span></td>
                            <td>{r.wind!=null?<span className={`text-xs font-mono ${windOver?'text-amber-500':''}`} style={!windOver?{color:'var(--text-subtle)'}:{}}>{r.wind>0?'+':''}{r.wind?.toFixed(1)}{windOver?' ⚠':''}</span>:<span style={{color:'var(--border)'}}>—</span>}</td>
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
