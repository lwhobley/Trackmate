'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MeetType, MEET_TYPE_LABELS } from '@/lib/types'

const MEET_EVENTS: Record<MeetType, string[]> = {
  hs: ['100m','200m','400m','800m','1600m','3200m','110m Hurdles','100m Hurdles','4x100m Relay','4x400m Relay','High Jump','Long Jump','Shot Put','Discus'],
  ncaa: ['100m','200m','400m','800m','1500m','5000m','10000m','110m Hurdles','100m Hurdles','400m Hurdles','3000m Steeplechase','4x100m Relay','4x400m Relay','High Jump','Pole Vault','Long Jump','Triple Jump','Shot Put','Discus','Hammer','Javelin'],
  club: ['100m','200m','400m','800m','1500m','3000m','110m Hurdles','100m Hurdles','400m Hurdles','4x100m Relay','4x400m Relay','High Jump','Long Jump','Shot Put'],
  elite: ['100m','200m','400m','800m','1500m','5000m','10000m','110m Hurdles','100m Hurdles','400m Hurdles','3000m Steeplechase','4x100m Relay','4x400m Relay','High Jump','Pole Vault','Long Jump','Triple Jump','Shot Put','Discus','Hammer','Javelin'],
}

export default function NewMeetPage() {
  const router = useRouter()
  const { id: orgId } = useParams<{ id: string }>()
  const [form, setForm] = useState({
    name: '', date: '', venue: '', meet_type: 'hs' as MeetType,
    max_athletes_per_event: '3', registration_deadline: '', notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rulesetId, setRulesetId] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('rulesets').select('id').eq('meet_type', form.meet_type).single()
      .then(({ data }) => data && setRulesetId(data.id))
  }, [form.meet_type])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()

    const { data: meet, error: meetErr } = await supabase.from('meets').insert({
      org_id: orgId, name: form.name, date: form.date, venue: form.venue,
      meet_type: form.meet_type, ruleset_id: rulesetId || null,
      max_athletes_per_event: parseInt(form.max_athletes_per_event) || 3,
      registration_deadline: form.registration_deadline || null,
      notes: form.notes,
    }).select().single()

    if (meetErr || !meet) { setError(meetErr?.message || 'Failed to create meet'); setLoading(false); return }

    const events = MEET_EVENTS[form.meet_type].map((name, i) => ({
      meet_id: meet.id, name, sort_order: i,
      is_field: ['High Jump','Pole Vault','Long Jump','Triple Jump','Shot Put','Discus','Hammer','Javelin'].includes(name),
      is_relay: name.includes('Relay') || ['SMR','DMR'].includes(name),
      gender: name === '100m Hurdles' ? 'f' : name.includes('Hurdles') ? 'm' : 'mixed',
      max_lanes: 8,
    }))
    await supabase.from('events').insert(events)
    router.push(`/meets/${meet.id}/manage`)
  }

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8 fade-up">
        <p className="text-[10px] text-[#6B6B7A] uppercase tracking-widest mb-1" style={{fontFamily:'var(--font-display)',fontWeight:700}}>New Meet</p>
        <h1 className="text-3xl text-white uppercase" style={{fontFamily:'var(--font-display)',fontWeight:800}}>Create Meet</h1>
        <p className="text-[#6B6B7A] text-sm mt-1">Standard events auto-load based on meet type</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 fade-up-1">
        {error && <div className="text-red-400 text-sm bg-red-500/8 border border-red-500/20 rounded-xl p-3">{error}</div>}

        <div className="rounded-xl border border-[#222228] bg-[#0C0C10] p-6 space-y-4">
          <p className="text-[10px] text-[#6B6B7A] uppercase tracking-widest" style={{fontFamily:'var(--font-display)',fontWeight:700}}>Meet Details</p>

          <div>
            <label className="text-[10px] text-[#6B6B7A] uppercase tracking-widest block mb-1.5" style={{fontFamily:'var(--font-display)',fontWeight:700}}>Meet Name *</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} required
              className="w-full h-11 rounded-xl border border-[#222228] bg-[#060608] px-4 text-sm text-white placeholder:text-[#333340] transition-all"
              placeholder="Jefferson Invitational 2025" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#6B6B7A] uppercase tracking-widest block mb-1.5" style={{fontFamily:'var(--font-display)',fontWeight:700}}>Date *</label>
              <input type="date" value={form.date} onChange={e => update('date', e.target.value)} required
                className="w-full h-11 rounded-xl border border-[#222228] bg-[#060608] px-4 text-sm text-white transition-all" />
            </div>
            <div>
              <label className="text-[10px] text-[#6B6B7A] uppercase tracking-widest block mb-1.5" style={{fontFamily:'var(--font-display)',fontWeight:700}}>Meet Type *</label>
              <select value={form.meet_type} onChange={e => update('meet_type', e.target.value)}
                className="w-full h-11 rounded-xl border border-[#222228] bg-[#060608] px-4 text-sm text-white transition-all">
                {Object.entries(MEET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#6B6B7A] uppercase tracking-widest block mb-1.5" style={{fontFamily:'var(--font-display)',fontWeight:700}}>Venue</label>
            <input value={form.venue} onChange={e => update('venue', e.target.value)}
              className="w-full h-11 rounded-xl border border-[#222228] bg-[#060608] px-4 text-sm text-white placeholder:text-[#333340] transition-all"
              placeholder="Jefferson Stadium, New Orleans, LA" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#6B6B7A] uppercase tracking-widest block mb-1.5" style={{fontFamily:'var(--font-display)',fontWeight:700}}>Max Athletes/Event</label>
              <input type="number" value={form.max_athletes_per_event} onChange={e => update('max_athletes_per_event', e.target.value)} min="1"
                className="w-full h-11 rounded-xl border border-[#222228] bg-[#060608] px-4 text-sm text-white transition-all" />
            </div>
            <div>
              <label className="text-[10px] text-[#6B6B7A] uppercase tracking-widest block mb-1.5" style={{fontFamily:'var(--font-display)',fontWeight:700}}>Registration Deadline</label>
              <input type="datetime-local" value={form.registration_deadline} onChange={e => update('registration_deadline', e.target.value)}
                className="w-full h-11 rounded-xl border border-[#222228] bg-[#060608] px-4 text-sm text-white transition-all" />
            </div>
          </div>

          <div className="bg-[#060608] rounded-xl p-3 border border-[#111116]">
            <p className="text-[10px] text-[#6B6B7A] mb-1" style={{fontFamily:'var(--font-display)',fontWeight:700}}>
              AUTO-LOADED FOR <span className="text-white">{MEET_TYPE_LABELS[form.meet_type].toUpperCase()}</span>
            </p>
            <p className="text-xs text-[#6B6B7A] leading-relaxed">{MEET_EVENTS[form.meet_type].join(' · ')}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 h-11 border border-[#222228] text-[#6B6B7A] hover:text-white rounded-xl text-sm transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-[2] h-11 bg-[#FF4B00] hover:bg-[#cc3c00] disabled:opacity-40 text-white uppercase tracking-widest text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
            style={{fontFamily:'var(--font-display)',fontWeight:700}}>
            {loading ? 'Creating...' : 'Create Meet & Load Events →'}
          </button>
        </div>
      </form>
    </div>
  )
}
