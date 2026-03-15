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
    entry_fee_per_athlete: '8', entry_fee_per_team: '0',
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
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: meet, error: meetErr } = await supabase.from('meets').insert({
      org_id: orgId,
      name: form.name,
      date: form.date,
      venue: form.venue,
      meet_type: form.meet_type,
      ruleset_id: rulesetId || null,
      entry_fee_per_athlete: parseFloat(form.entry_fee_per_athlete) || 0,
      entry_fee_per_team: parseFloat(form.entry_fee_per_team) || 0,
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
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Create New Meet</h1>
        <p className="text-zinc-500 text-sm mt-1">Standard events auto-load based on meet type</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">{error}</div>}
        <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-6 space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Meet Details</h2>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1.5">Meet Name *</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} required
              className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF4B00]"
              placeholder="Jefferson Invitational 2025" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={e => update('date', e.target.value)} required
                className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4B00]" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-1.5">Meet Type *</label>
              <select value={form.meet_type} onChange={e => update('meet_type', e.target.value)}
                className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4B00]">
                {Object.entries(MEET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1.5">Venue</label>
            <input value={form.venue} onChange={e => update('venue', e.target.value)}
              className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF4B00]"
              placeholder="Jefferson Stadium, New Orleans, LA" />
          </div>
          <div className="bg-[#0D0D0D] rounded-lg p-3 border border-[#1a1a1a]">
            <p className="text-xs text-zinc-500 mb-1">Auto-loaded for <span className="text-white font-medium">{MEET_TYPE_LABELS[form.meet_type]}</span>:</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{MEET_EVENTS[form.meet_type].join(' · ')}</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-6 space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Registration & Fees</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Fee/Athlete ($)', key: 'entry_fee_per_athlete' },
              { label: 'Fee/Team ($)', key: 'entry_fee_per_team' },
              { label: 'Max/Event', key: 'max_athletes_per_event' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium text-zinc-300 block mb-1.5">{f.label}</label>
                <input type="number" value={form[f.key as keyof typeof form]} onChange={e => update(f.key, e.target.value)} min="0"
                  className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4B00]" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1.5">Registration Deadline</label>
            <input type="datetime-local" value={form.registration_deadline} onChange={e => update('registration_deadline', e.target.value)}
              className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4B00]" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 h-10 border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg text-sm transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-[2] h-10 bg-[#FF4B00] hover:bg-[#e04200] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">
            {loading ? 'Creating...' : 'Create Meet & Load Events →'}
          </button>
        </div>
      </form>
    </div>
  )
}
