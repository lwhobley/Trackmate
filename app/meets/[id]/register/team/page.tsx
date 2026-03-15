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
      supabase.from('meets').select('*, rulesets(*)').eq('id', meetId).single(),
      supabase.from('events').select('*').eq('meet_id', meetId).order('sort_order'),
      supabase.auth.getUser(),
    ]).then(async ([m, ev, { data: { user } }]) => {
      setMeet(m.data)
      setEvents(ev.data || [])
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*, orgs(*)').eq('id', user.id).single()
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
      const cur = prev[athleteId] || []
      const exists = cur.findIndex(s => s.eventId === eventId)
      if (exists >= 0) return { ...prev, [athleteId]: cur.filter((_, i) => i !== exists) }
      return { ...prev, [athleteId]: [...cur, { eventId, seedTime }] }
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
        status: 'confirmed' as const,
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
    <div className="min-h-screen bg-[#060608]">
      {/* Header */}
      <div className="border-b border-[#111116] bg-[#0C0C10] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#6B6B7A] uppercase tracking-widest mb-0.5" style={{fontFamily:'var(--font-display)',fontWeight:700}}>Registering for</p>
            <h1 className="text-xl text-white uppercase font-bold" style={{fontFamily:'var(--font-display)',fontWeight:800}}>{meet?.name}</h1>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs">
            {(['team','entries','done'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-[#FF4B00] text-white' :
                  ['team','entries','done'].indexOf(step) > i ? 'bg-green-600 text-white' :
                  'bg-[#222228] text-[#6B6B7A]'
                }`}>{i+1}</div>
                <span className={step === s ? 'text-white font-medium hidden sm:block' : 'text-[#6B6B7A] hidden sm:block'}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>
                {i < 2 && <span className="text-[#222228]">›</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && <div className="mb-4 text-red-400 text-sm bg-red-500/8 border border-red-500/20 rounded-xl p-3">{error}</div>}

        {/* STEP 1: Team name */}
        {step === 'team' && (
          <div className="max-w-md fade-up">
            <h2 className="text-2xl text-white uppercase mb-6" style={{fontFamily:'var(--font-display)',fontWeight:800}}>Team Information</h2>
            <div className="rounded-xl border border-[#222228] bg-[#0C0C10] p-6 space-y-4">
              <div>
                <label className="text-[10px] text-[#6B6B7A] uppercase tracking-widest block mb-1.5" style={{fontFamily:'var(--font-display)',fontWeight:700}}>Team Name *</label>
                <input value={teamName} onChange={e => setTeamName(e.target.value)}
                  className="w-full h-11 rounded-xl border border-[#222228] bg-[#060608] px-4 text-sm text-white placeholder:text-[#333340] transition-all"
                  placeholder="Jefferson High School Varsity" />
              </div>
              <button onClick={createTeam} disabled={loading || !teamName.trim()}
                className="w-full h-11 bg-[#FF4B00] hover:bg-[#cc3c00] disabled:opacity-40 text-white uppercase tracking-widest text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
                style={{fontFamily:'var(--font-display)',fontWeight:700}}>
                {loading ? 'Creating...' : 'Continue to Entries →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Select events */}
        {step === 'entries' && (
          <div className="fade-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-white uppercase" style={{fontFamily:'var(--font-display)',fontWeight:800}}>Select Events</h2>
              <div className="text-sm text-[#6B6B7A]">{totalEntries()} entries selected</div>
            </div>
            {athletes.length === 0 ? (
              <div className="rounded-xl border border-[#222228] bg-[#0C0C10] p-10 text-center">
                <p className="text-[#6B6B7A] text-sm mb-2">No athletes found in your organization.</p>
                <a href={`/meets/${meetId}/register/athlete`} className="text-[#FF8C42] hover:text-[#FF4B00] text-sm transition-colors">Add athletes first →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {athletes.map(athlete => (
                  <div key={athlete.id} className="rounded-xl border border-[#222228] bg-[#0C0C10] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-[#111116] border-b border-[#111116]">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white">{athlete.name}</span>
                        {athlete.grade && <span className="text-[10px] text-[#6B6B7A] border border-[#222228] rounded px-1.5 py-0.5 uppercase">Gr. {athlete.grade}</span>}
                      </div>
                      <span className="text-xs text-[#6B6B7A]">{(selections[athlete.id] || []).length} events</span>
                    </div>
                    <div className="p-3 flex flex-wrap gap-2">
                      {events.map(ev => {
                        const sel = isSelected(athlete.id, ev.id)
                        const pr = athlete.prs?.[ev.name]
                        return (
                          <button key={ev.id} onClick={() => toggleEntry(athlete.id, ev.id, pr?.toString() || '')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                              sel ? 'bg-[#FF4B00]/15 border-[#FF4B00]/40 text-[#FF8C42]' :
                              'bg-transparent border-[#222228] text-[#6B6B7A] hover:border-[#333340] hover:text-white'
                            }`} style={{fontFamily:'var(--font-display)',fontWeight:700}}>
                            {ev.name}
                            {pr && <span className="ml-1 opacity-50 font-mono normal-case">({formatTime(pr)})</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep('team')} className="flex-1 h-11 border border-[#222228] text-[#6B6B7A] hover:text-white rounded-xl text-sm transition-colors">← Back</button>
                  <button onClick={submitEntries} disabled={loading || totalEntries() === 0}
                    className="flex-[2] h-11 bg-[#FF4B00] hover:bg-[#cc3c00] disabled:opacity-40 text-white uppercase tracking-widest text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
                    style={{fontFamily:'var(--font-display)',fontWeight:700}}>
                    {loading ? 'Submitting...' : `Submit ${totalEntries()} Entries →`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Done */}
        {step === 'done' && (
          <div className="max-w-md mx-auto text-center fade-up">
            <div className="w-16 h-16 rounded-full bg-green-600/15 border border-green-600/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-green-400 text-2xl">✓</span>
            </div>
            <h2 className="text-3xl text-white uppercase mb-2" style={{fontFamily:'var(--font-display)',fontWeight:800}}>Registered!</h2>
            <p className="text-[#6B6B7A] text-sm mb-8">{totalEntries()} entries confirmed for <span className="text-white">{team?.name}</span></p>
            <div className="flex gap-3 justify-center">
              <a href={`/meets/${meetId}`} className="px-6 py-2.5 border border-[#222228] text-[#6B6B7A] hover:text-white rounded-xl text-sm transition-colors">View Meet</a>
              <a href={`/meets/${meetId}/live`} className="px-6 py-2.5 bg-[#FF4B00] hover:bg-[#cc3c00] text-white font-bold rounded-xl text-sm transition-all uppercase tracking-wider shadow-lg shadow-orange-500/20" style={{fontFamily:'var(--font-display)',fontWeight:700}}>Live Results →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
