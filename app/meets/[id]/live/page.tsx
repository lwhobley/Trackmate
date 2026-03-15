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
  const [teamScores, setTeamScores] = useState<{ name: string; points: number }[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connected, setConnected] = useState(false)

  const calcTeamScores = useCallback((res: any[]) => {
    const byEvent: Record<string, any[]> = {}
    for (const r of res) {
      const eid = r.entries?.events?.id; if (!eid) continue
      if (!byEvent[eid]) byEvent[eid] = []
      byEvent[eid].push(r)
    }
    const scores: Record<string, number> = {}
    for (const evResults of Object.values(byEvent)) {
      evResults.filter((r: any) => !r.dq && !r.dns && r.place).sort((a: any, b: any) => a.place - b.place).slice(0, 8)
        .forEach((r: any, i: number) => { const t = r.entries?.teams?.name || 'Unknown'; scores[t] = (scores[t] || 0) + (POINTS[i] || 0) })
    }
    setTeamScores(Object.entries(scores).map(([name, points]) => ({ name, points })).sort((a, b) => b.points - a.points))
  }, [])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('meets').select('*, rulesets(*)').eq('id', meetId).single(),
      supabase.from('events').select('*').eq('meet_id', meetId).order('sort_order'),
      supabase.from('results').select(`id,place,fat_time,wind,dq,dns,created_at,entries!inner(athlete_id,meet_id,athletes(name),teams(name),events(id,name,gender))`).eq('entries.meet_id', meetId),
    ]).then(([m, ev, res]) => {
      setMeet(m.data); setEvents(ev.data || [])
      setResults(res.data || []); calcTeamScores(res.data || []); setLastUpdate(new Date())
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#FF4B00,#cc3c00)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 11 }}>TM</span>
              </div>
            </Link>
            <span style={{ color: 'var(--border)', fontSize: 16 }}>·</span>
            <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 16, color: 'white' }}>{meet?.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#4ade80' : '#6b6b80', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: connected ? '#4ade80' : 'var(--text-muted)' }}>{connected ? 'LIVE' : 'CONNECTING'}</span>
            </div>
            {lastUpdate && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lastUpdate.toLocaleTimeString()}</span>}
            <Link href={`/meets/${meetId}/scoreboard`} className="btn btn-ghost btn-sm">Scoreboard →</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        {/* Team scores */}
        <div>
          <div className="card" style={{ overflow: 'hidden', position: 'sticky', top: 76 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-dim)' }}>
              <h3 style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Team Scores</h3>
            </div>
            {teamScores.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Waiting for results...</div>
            ) : (
              <div>
                {teamScores.map((t, i) => (
                  <div key={t.name} style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--border-dim)', background: i === 0 ? 'rgba(255,75,0,0.04)' : 'transparent' }}>
                    <span className="stat-number" style={{ fontSize: 18, width: 28, color: i === 0 ? '#FF4B00' : i === 1 ? '#a0a0b0' : i === 2 ? '#b87333' : 'var(--text-muted)' }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    <span className="stat-number" style={{ fontSize: 22, color: i === 0 ? '#FF4B00' : 'white' }}>{t.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          {/* Event filter */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
            <button onClick={() => setSelectedEvent('all')} className="btn btn-sm" style={{ background: selectedEvent === 'all' ? '#FF4B00' : 'var(--bg-3)', color: 'white', border: 'none', flexShrink: 0 }}>All</button>
            {events.map(ev => (
              <button key={ev.id} onClick={() => setSelectedEvent(ev.id)} className="btn btn-sm" style={{ background: selectedEvent === ev.id ? '#FF4B00' : 'var(--bg-3)', color: 'white', border: 'none', flexShrink: 0 }}>{ev.name}</button>
            ))}
          </div>

          {Object.keys(grouped).length === 0 ? (
            <div className="card" style={{ padding: '80px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
              <h3 style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Waiting for Results</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Results will appear here in real time</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(grouped).map(([eventName, evResults]) => (
                <div key={eventName} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 16, letterSpacing: '0.02em' }}>{eventName}</h3>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{evResults.length} results</span>
                  </div>
                  <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                        {['Pl', 'Athlete', 'Team', 'Time', 'Wind'].map(h => (
                          <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {evResults.sort((a: any, b: any) => (a.place || 99) - (b.place || 99)).map((r: any) => {
                        const windOver = r.wind !== null && r.wind !== undefined && r.wind > (meet?.rulesets?.wind_limit || 2.0)
                        return (
                          <tr key={r.id} style={{ borderBottom: '1px solid var(--border-dim)', opacity: r.dq ? 0.4 : 1 }}>
                            <td style={{ padding: '12px 16px', fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 18 }}>
                              {r.dq ? 'DQ' : r.dns ? 'DNS' : r.place || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: 'white' }}>{r.entries?.athletes?.name}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{r.entries?.teams?.name}</td>
                            <td style={{ padding: '12px 16px', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 16 }}>{r.fat_time ? formatTime(r.fat_time) : '—'}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {r.wind != null ? <span style={{ fontSize: 12, fontFamily: 'monospace', color: windOver ? '#fbbf24' : 'var(--text-muted)' }}>{r.wind > 0 ? '+' : ''}{r.wind?.toFixed(1)}{windOver ? ' ⚠' : ''}</span> : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
