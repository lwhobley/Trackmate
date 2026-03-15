import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MEET_TYPE_LABELS } from '@/lib/types'

const TYPE_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  hs:    { dot: 'bg-blue-400',   badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20',   label: 'HS' },
  ncaa:  { dot: 'bg-violet-400', badge: 'bg-violet-400/10 text-violet-400 border-violet-400/20', label: 'NCAA' },
  club:  { dot: 'bg-orange-400', badge: 'bg-orange-400/10 text-orange-400 border-orange-400/20', label: 'Club' },
  elite: { dot: 'bg-yellow-400', badge: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20', label: 'Elite' },
}

export default async function OrgsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('profiles').select('*, orgs(*)').eq('id', user.id).single()
  const org = (profile?.orgs as any)
  const { data: meets } = await supabase.from('meets').select('*, rulesets(*)')
    .eq('org_id', org?.id || '').order('date', { ascending: false }).limit(20)

  const upcoming = meets?.filter(m => new Date(m.date) >= new Date()) || []
  const past = meets?.filter(m => new Date(m.date) < new Date()) || []

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[#8888A0] text-xs uppercase tracking-widest font-semibold mb-1">Organization</p>
          <h1 className="font-display font-black italic text-white text-4xl tracking-tight">
            {org?.name || 'Your Org'}
          </h1>
        </div>
        {org && (
          <Link href={`/dashboard/orgs/${org.id}/meets/new`}
            className="flex items-center gap-2 bg-[#FF3B00] hover:bg-[#e03500] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40 hover:-translate-y-0.5">
            <span className="text-lg leading-none">+</span> New Meet
          </Link>
        )}
      </div>

      {!org ? (
        <div className="rounded-2xl border border-[#252535] bg-[#0A0A12] p-16 text-center">
          <div className="text-5xl mb-4">🏟️</div>
          <h3 className="font-display font-black italic text-white text-2xl mb-2">No Organization Yet</h3>
          <p className="text-[#8888A0] text-sm">Sign up to create an organization and host meets</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Total Meets', value: meets?.length || 0, icon: '📋' },
              { label: 'Upcoming', value: upcoming.length, icon: '📅', accent: upcoming.length > 0 },
              { label: 'Org Type', value: org.type?.toUpperCase(), icon: '🏫' },
            ].map(stat => (
              <div key={stat.label} className={`rounded-xl border p-5 ${stat.accent ? 'border-[#FF3B00]/30 bg-[#FF3B00]/5' : 'border-[#252535] bg-[#0A0A12]'}`}>
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className={`font-display font-black italic text-3xl ${stat.accent ? 'text-[#FF3B00]' : 'text-white'}`}>{stat.value}</div>
                <div className="text-[#8888A0] text-xs uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Meets list */}
          {!meets?.length ? (
            <div className="rounded-2xl border border-dashed border-[#252535] p-16 text-center">
              <div className="text-4xl mb-3">🏁</div>
              <p className="font-display font-black italic text-white text-2xl mb-1">No Meets Yet</p>
              <p className="text-[#8888A0] text-sm mb-6">Create your first meet to get started</p>
              <Link href={`/dashboard/orgs/${org.id}/meets/new`}
                className="inline-flex items-center gap-2 bg-[#FF3B00] text-white font-bold px-6 py-3 rounded-xl text-sm transition-all hover:-translate-y-0.5">
                Create First Meet →
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#252535] bg-[#0A0A12] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#252535] flex items-center justify-between">
                <h2 className="font-display font-black italic text-white text-xl">Meets</h2>
                <span className="text-[#8888A0] text-sm">{meets.length} total</span>
              </div>
              <div className="divide-y divide-[#16161F]">
                {meets.map(meet => {
                  const t = TYPE_STYLES[meet.meet_type] || TYPE_STYLES.hs
                  const isPast = new Date(meet.date) < new Date()
                  return (
                    <div key={meet.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#0F0F1A] transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-[#444458]' : t.dot}`} />
                        <div>
                          <p className="font-semibold text-white group-hover:text-[#FF3B00] transition-colors">{meet.name}</p>
                          <p className="text-sm text-[#8888A0] mt-0.5">
                            {new Date(meet.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            {meet.venue && ` · ${meet.venue}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${t.badge}`}>
                          {t.label}
                        </span>
                        <div className="flex gap-1.5">
                          <Link href={`/meets/${meet.id}`} className="px-3 py-1.5 text-xs border border-[#252535] text-[#8888A0] hover:text-white hover:border-[#353548] rounded-lg transition-colors">View</Link>
                          <Link href={`/meets/${meet.id}/manage`} className="px-3 py-1.5 text-xs bg-[#16161F] hover:bg-[#1E1E2A] text-[#8888A0] hover:text-white rounded-lg transition-colors">Manage</Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
