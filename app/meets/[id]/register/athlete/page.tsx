'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterAthletePage() {
  const { id: meetId } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', grade: '', gender: 'm', bib: '' })
  const [prs, setPrs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('events').select('*').eq('meet_id', meetId).order('sort_order'),
    ]).then(async ([{ data: { user } }, ev]) => {
      setEvents(ev.data || [])
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(p)
      }
    })
  }, [meetId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.org_id) { setError('You must be part of an organization to add athletes'); return }
    setLoading(true)
    const supabase = createClient()
    const parsedPrs: Record<string, number> = {}
    for (const [k, v] of Object.entries(prs)) {
      if (v) parsedPrs[k] = parseFloat(v)
    }
    const { error: insertErr } = await supabase.from('athletes').insert({
      org_id: profile.org_id,
      name: form.name,
      grade: form.grade || null,
      gender: form.gender,
      bib: form.bib || null,
      prs: parsedPrs,
    })
    if (insertErr) { setError(insertErr.message); setLoading(false); return }
    router.push(`/meets/${meetId}/register/team`)
  }

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="border-b border-[#1a1a1a] bg-[#0D0D0D] px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-black text-white">Add Athlete</h1>
          <p className="text-xs text-zinc-500">Add athlete to your organization roster</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && <div className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-6 space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Athlete Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-zinc-300 block mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => update('name', e.target.value)} required
                  className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF4B00]"
                  placeholder="Marcus Johnson" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1.5">Gender</label>
                <select value={form.gender} onChange={e => update('gender', e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4B00]">
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1.5">Grade</label>
                <select value={form.grade} onChange={e => update('grade', e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4B00]">
                  <option value="">N/A</option>
                  {['9','10','11','12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
                  {['FR','SO','JR','SR'].map(g => <option key={g} value={g}>{g} (College)</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1.5">Bib #</label>
                <input value={form.bib} onChange={e => update('bib', e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4B00]"
                  placeholder="101" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-6 space-y-3">
            <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Personal Records (optional)</h2>
            <p className="text-xs text-zinc-500">Enter times in seconds (e.g. 10.45 for 100m) or as M:SS.ss</p>
            <div className="grid grid-cols-2 gap-3">
              {events.filter(ev => !ev.is_relay && !ev.is_field).map(ev => (
                <div key={ev.id}>
                  <label className="text-xs font-medium text-zinc-400 block mb-1">{ev.name}</label>
                  <input value={prs[ev.name] || ''} onChange={e => setPrs(p => ({ ...p, [ev.name]: e.target.value }))}
                    className="w-full h-8 rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FF4B00]"
                    placeholder="e.g. 10.45" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="flex-1 h-10 border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-[2] h-10 bg-[#FF4B00] hover:bg-[#e04200] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">
              {loading ? 'Adding...' : 'Add Athlete & Continue →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
