'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/types'

export default function RegisterTeamPage() {
  const { id: meetId } = useParams<{ id: string }>()
  const router = useRouter()
  const [meet, setMeet] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [athletes, setAthletes] = useState<any[]>([])
  const [team, setTeam] = useState<any>(null)
  const [selections, setSelections] = useState<Record<string, { eventId: string; seedTime: string }[]>>({})
  const [step, setStep] = useState<'team' | 'entries' | 'done'>('team')
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('meets').select('*').eq('id', meetId).single(),
      supabase.from('events').select('*').eq('meet_id', meetId).order('sort_order'),
      supabase.auth.getUser(),
    ]).then(async ([m, ev, { data: { user } }]) => {
      setMeet(m.data)
      setEvents(ev.data || [])
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(p)
        if (p?.org_id) {
          const { data: aths } = await supabase.from('athletes').select('*').eq('org_id', p.org_id)
          setAthletes(aths || [])
        }
      }
    })
  }, [meetId])

  async function createTeam() {
    if (!teamName.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: t, error: e } = await supabase.from('teams').insert({
      meet_id: meetId,
      org_id: profile?.org_id,
      name: teamName,
      coach_id: profile?.id,
    }).select().single()
    if (e) { setError(e.message); setLoading(false); return }
    setTeam(t)
    setStep('entries')
    setLoading(false)
  }

  function toggleEntry(athleteId: string, eventId: string, seedTime: string) {
    setSelections(prev => {
      const athleteSels = prev[athleteId] || []
      const existing = athleteSels.findIndex(s => s.eventId === eventId)
      if (existing >= 0) return { ...prev, [athleteId]: athleteSels.filter((_, i) => i !== existing) }
      return { ...prev, [athleteId]: [...athleteSels, { eventId, seedTime }] }
    })
  }

  function isSelected(athleteId: string, eventId: string) {
    return (selections[athleteId] || []).some(s => s.eventId === eventId)
  }

  function totalEntries() {
    return Object.values(selections).reduce((acc, s) => acc + s.length, 0)
  }

  async function submitEntries() {
    if (!team) return
    setLoading(true)
    const supabase = createClient()
    const entries = Object.entries(selections).flatMap(([athleteId, sels]) =>
      sels.map(s => ({
        meet_id: meetId,
        athlete_id: athleteId,
        team_id: team.id,
        event_id: s.eventId,
        seed_time: s.seedTime ? parseFloat(s.seedTime) : null,
        status: 'confirmed' as const, // auto-confirm since no payment
      }))
    )
    if (entries.length > 0) {
      const { error: e } = await supabase.from('entries').upsert(entries, {
        onConflict: 'meet_id,athlete_id,event_id'
      })
      if (e) { setError(e.message); setLoading(false); return }
    }
    setStep('done')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="border-b border-[#1a1a1a] bg-[#0D0D0D] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Registering for</p>
            <h1 className="text-lg font-black text-white">{meet?.name}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {['team','entries','done'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-[#FF4B00] text-white' :
                  ['team','entries','done'].indexOf(step) > i ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] text-zinc-500'
                }`}>{i + 1}</div>
                <span className={step === s ? 'text-white font-medium' : 'text-zinc-500 capitalize'}>{s}</span>
                {i < 2 && <span className="text-zinc-700">›</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && <div className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">{error}</div>}

        {step === 'team' && (
          <div className="max-w-md">
            <h2 className="text-xl font-black text-white mb-6">Team Information</h2>
            <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1.5">Team Name *</label>
                <input value={teamName} onChange={e => setTeamName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF4B00]"
                  placeholder="Jefferson High School Varsity" />
              </div>
              <button onClick={createTeam} disabled={loading || !teamName.trim()}
                className="w-full h-10 bg-[#FF4B00] hover:bg-[#e04200] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">
                {loading ? 'Creating...' : 'Continue to Entries →'}
              </button>
            </div>
          </div>
        )}

        {step === 'entries' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Select Events for Athletes</h2>
              <div className="text-sm text-zinc-400">{totalEntries()} entries selected</div>
            </div>
            {athletes.length === 0 ? (
              <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-8 text-center">
                <p className="text-zinc-500 mb-2">No athletes found in your organization.</p>
                <a href={`/meets/${meetId}/register/athlete`} className="text-[#FF4B00] hover:underline text-sm">Add athletes first →</a>
              </div>
            ) : (
              <div className="space-y-4">
                {athletes.map(athlete => (
                  <div key={athlete.id} className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-[#0D0D0D] border-b border-[#1a1a1a]">
                      <div>
                        <span className="font-semibold text-white">{athlete.name}</span>
                        {athlete.grade && <span className="ml-2 text-xs text-zinc-500">Grade {athlete.grade}</span>}
                      </div>
                      <span className="text-xs text-zinc-500">{(selections[athlete.id] || []).length} events</span>
                    </div>
                    <div className="p-3 flex flex-wrap gap-2">
                      {events.map(ev => {
                        const sel = isSelected(athlete.id, ev.id)
                        const pr = athlete.prs?.[ev.name]
                        return (
                          <button key={ev.id} onClick={() => toggleEntry(athlete.id, ev.id, pr?.toString() || '')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              sel ? 'bg-[#FF4B00]/20 border-[#FF4B00]/40 text-[#FF4B00]' : 'bg-transparent border-[#2A2A2A] text-zinc-400 hover:border-zinc-600 hover:text-white'
                            }`}>
                            {ev.name}
                            {pr && <span className="ml-1 opacity-60">({formatTime(pr)})</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep('team')} className="flex-1 h-10 border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg text-sm transition-colors">← Back</button>
                  <button onClick={submitEntries} disabled={loading || totalEntries() === 0}
                    className="flex-[2] h-10 bg-[#FF4B00] hover:bg-[#e04200] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">
                    {loading ? 'Submitting...' : `Submit ${totalEntries()} Entries →`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="max-w-md text-center mx-auto py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-black text-white mb-2">Registration Complete!</h2>
            <p className="text-zinc-400 text-sm mb-8">{team?.name} has been registered with {totalEntries()} entries.</p>
            <div className="flex gap-3 justify-center">
              <a href={`/meets/${meetId}`} className="px-6 py-2.5 border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg text-sm transition-colors">View Meet</a>
              <a href={`/meets/${meetId}/live`} className="px-6 py-2.5 bg-[#FF4B00] hover:bg-[#e04200] text-white font-semibold rounded-lg text-sm transition-colors">Live Results →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
