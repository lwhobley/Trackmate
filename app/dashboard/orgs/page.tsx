import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function OrgsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('profiles').select('*, orgs(*)').eq('id', user.id).single()
  const org = (profile?.orgs as any)

  // Get meets for this org
  const { data: meets } = await supabase.from('meets')
    .select('*, rulesets(*)')
    .eq('org_id', org?.id || '')
    .order('date', { ascending: false })
    .limit(10)

  const typeColors: Record<string, string> = {
    hs: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    ncaa: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
    club: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
    elite: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30',
  }
  const typeLabels: Record<string, string> = { hs: 'HS/NFHS', ncaa: 'NCAA', club: 'Club/AAU', elite: 'Elite' }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">{org?.name || 'Your Organization'}</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your meets and athletes</p>
        </div>
        {org && (
          <Link href={`/dashboard/orgs/${org.id}/meets/new`}
            className="bg-[#FF4B00] hover:bg-[#e04200] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            + New Meet
          </Link>
        )}
      </div>

      {!org ? (
        <div className="rounded-2xl border border-[#2A2A2A] bg-[#111111] p-12 text-center">
          <div className="text-5xl mb-4">🏟️</div>
          <h3 className="text-lg font-semibold text-white mb-2">No organization yet</h3>
          <p className="text-zinc-500 text-sm">Complete your profile to create meets</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Meets', value: meets?.length || 0, icon: '📋' },
              { label: 'Upcoming', value: meets?.filter(m => new Date(m.date) >= new Date()).length || 0, icon: '📅' },
              { label: 'Org Type', value: org.type?.toUpperCase(), icon: '🏫' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
              <h2 className="font-bold text-white">Recent Meets</h2>
              <Link href={`/dashboard/orgs/${org.id}/meets/new`}
                className="text-xs text-[#FF4B00] hover:underline">+ Create meet</Link>
            </div>
            {!meets?.length ? (
              <div className="p-12 text-center text-zinc-500">
                <p className="text-4xl mb-3">🏁</p>
                <p className="font-medium">No meets yet</p>
                <p className="text-sm mt-1">Create your first meet to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1a1a1a]">
                {meets.map(meet => (
                  <div key={meet.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#0D0D0D] transition-colors">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-white">{meet.name}</p>
                        <p className="text-sm text-zinc-500">{new Date(meet.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {meet.venue || 'TBD'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${typeColors[meet.meet_type] || ''}`}>
                        {typeLabels[meet.meet_type] || meet.meet_type}
                      </span>
                      <div className="flex gap-2">
                        <Link href={`/meets/${meet.id}`} className="text-xs px-3 py-1.5 rounded-lg border border-[#2A2A2A] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">View</Link>
                        <Link href={`/meets/${meet.id}/manage`} className="text-xs px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-zinc-400 hover:text-white transition-colors">Manage</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
