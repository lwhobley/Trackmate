'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/types'

export default function TimingPage() {
  const { id: meetId } = useParams<{ id: string }>()
  const [events, setEvents] = useState<any[]>([])
  const [heats, setHeats] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedHeat, setSelectedHeat] = useState('')
  const [currentHeat, setCurrentHeat] = useState<any>(null)
  const [results, setResults] = useState<Record<string, { time: string; wind: string; place: string; dq: boolean }>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [meet, setMeet] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('meets').select('*, rulesets(*)').eq('id', meetId).single(),
      supabase.from('events').select('*').eq('meet_id', meetId).order('sort_order'),
    ]).then(([m, ev]) => {
      setMeet(m.data)
      setEvents(ev.data || [])
    })
  }, [meetId])

  useEffect(() => {
    if (!selectedEvent) return
    const supabase = createClient()
    supabase.from('heats').select('*, events(*)').eq('event_id', selectedEvent).order('heat_num')
      .then(({ data }) => setHeats(data || []))
  }, [selectedEvent])

  useEffect(() => {
    if (!selectedHeat) return
    const heat = heats.find(h => h.id === selectedHeat)
    setCurrentHeat(heat)
    const init: Record<string, { time: string; wind: string; place: string; dq: boolean }> = {}
    if (heat?.start_list) {
      for (const lane of heat.start_list) {
        init[lane.entry_id] = { time: '', wind: '', place: '', dq: false }
      }
    }
    setResults(init)
  }, [selectedHeat, heats])

  async function saveResults() {
    if (!currentHeat) return
    setSaving(true)
    const supabase = createClient()
    const toInsert = Object.entries(results)
      .filter(([, r]) => r.time || r.dq)
      .map(([entryId, r], i) => ({
        entry_id: entryId,
        heat_id: currentHeat.id,
        fat_time: r.time ? parseFloat(r.time) : null,
        wind: r.wind ? parseFloat(r.wind) : null,
        place: r.place ? parseInt(r.place) : null,
        dq: r.dq,
      }))
    await supabase.from('results').upsert(toInsert, { onConflict: 'entry_id,heat_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function exportLIF() {
    if (!currentHeat || !selectedEvent) return
    const { generateLIF } = await import('@/lib/export')
    const event = events.find(e => e.id === selectedEvent)
    const lif = generateLIF(currentHeat, event)
    const blob = new Blob([lif], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${event?.name || 'event'}_heat${currentHeat.heat_num}.lif`; a.click()
    URL.revokeObjectURL(url)
  }

  const fatRequired = meet?.rulesets?.fat_required
  const windLimit = meet?.rulesets?.wind_limit || 2.0

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="border-b border-[#1a1a1a] bg-[#0D0D0D] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Timing Console</p>
            <h1 className="text-lg font-black text-white">{meet?.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {fatRequired && <span className="px-2 py-1 text-xs bg-purple-600/20 border border-purple-600/30 text-purple-400 rounded-lg">FAT Required</span>}
            <span className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded-lg">Wind Limit: {windLimit}m/s</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Event / Heat selector */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1.5">Event</label>
            <select value={selectedEvent} onChange={e => { setSelectedEvent(e.target.value); setSelectedHeat(''); setCurrentHeat(null) }}
              className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4B00]">
              <option value="">Select event...</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1.5">Heat</label>
            <select value={selectedHeat} onChange={e => setSelectedHeat(e.target.value)} disabled={!selectedEvent}
              className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4B00] disabled:opacity-50">
              <option value="">Select heat...</option>
              {heats.map(h => <option key={h.id} value={h.id}>Heat {h.heat_num}</option>)}
            </select>
          </div>
        </div>

        {currentHeat ? (
          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] bg-[#0D0D0D]">
              <div>
                <h2 className="font-bold text-white">{events.find(e => e.id === selectedEvent)?.name} — Heat {currentHeat.heat_num}</h2>
                <p className="text-xs text-zinc-500">{currentHeat.start_list?.length || 0} athletes</p>
              </div>
              <div className="flex gap-2">
                <button onClick={exportLIF} className="px-3 py-1.5 text-xs border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg transition-colors">
                  Export LIF
                </button>
                <button onClick={saveResults} disabled={saving}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-[#FF4B00] hover:bg-[#e04200] text-white'} disabled:opacity-50`}>
                  {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Results'}
                </button>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  {['Lane','Athlete','Seed','FAT Time','Wind','Place','DQ'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(currentHeat.start_list || []).sort((a: any, b: any) => a.lane - b.lane).map((lane: any) => {
                  const r = results[lane.entry_id] || { time: '', wind: '', place: '', dq: false }
                  const windOverLimit = r.wind && parseFloat(r.wind) > windLimit
                  return (
                    <tr key={lane.lane} className={`border-b border-[#0D0D0D] ${r.dq ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2 text-sm font-mono text-zinc-400">{lane.lane}</td>
                      <td className="px-4 py-2">
                        <p className="text-sm font-medium text-white">{lane.athlete_name}</p>
                        {lane.seed_time && <p className="text-xs text-zinc-500">Seed: {formatTime(lane.seed_time)}</p>}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono text-zinc-500">{lane.seed_time ? formatTime(lane.seed_time) : 'NM'}</td>
                      <td className="px-4 py-2">
                        <input
                          value={r.time}
                          onChange={e => setResults(prev => ({ ...prev, [lane.entry_id]: { ...r, time: e.target.value } }))}
                          className="w-24 h-8 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-2 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#FF4B00]"
                          placeholder="10.45" />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={r.wind}
                          onChange={e => setResults(prev => ({ ...prev, [lane.entry_id]: { ...r, wind: e.target.value } }))}
                          className={`w-16 h-8 rounded-lg border px-2 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#FF4B00] bg-[#0D0D0D] ${windOverLimit ? 'border-yellow-600' : 'border-[#2A2A2A]'}`}
                          placeholder="1.2" />
                        {windOverLimit && <span className="block text-xs text-yellow-400">↑ limit</span>}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={r.place}
                          onChange={e => setResults(prev => ({ ...prev, [lane.entry_id]: { ...r, place: e.target.value } }))}
                          className="w-12 h-8 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF4B00]"
                          placeholder="1" />
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => setResults(prev => ({ ...prev, [lane.entry_id]: { ...r, dq: !r.dq } }))}
                          className={`w-10 h-8 rounded-lg border text-xs font-bold transition-colors ${r.dq ? 'bg-red-600/30 border-red-600/50 text-red-400' : 'border-[#2A2A2A] text-zinc-600 hover:border-red-600/50 hover:text-red-400'}`}>
                          DQ
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-12 text-center text-zinc-500">
            <p className="text-4xl mb-3">⏱️</p>
            <p className="font-medium text-zinc-400">Select an event and heat to begin entering results</p>
            <p className="text-sm mt-1">Heats are generated in the Manage → Seeding tab</p>
          </div>
        )}
      </div>
    </div>
  )
}
