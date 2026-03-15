import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MEET_TYPE_LABELS } from '@/lib/types'

export default async function AllMeetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: meets } = await supabase.from('meets').select('*, orgs(*)')
    .eq('public', true).order('date', { ascending: false }).limit(50)

  const typeColors: Record<string, string> = {
    hs: 'text-blue-400', ncaa: 'text-purple-400', club: 'text-orange-400', elite: 'text-yellow-400',
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">All Public Meets</h1>
        <p className="text-zinc-500 text-sm mt-1">Browse and register for meets</p>
      </div>
      <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
        {!meets?.length ? (
          <div className="p-12 text-center text-zinc-500">
            <p className="text-4xl mb-3">🏁</p>
            <p>No public meets available</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {meets.map(meet => (
              <div key={meet.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#0D0D0D] transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${typeColors[meet.meet_type]}`}>
                      {MEET_TYPE_LABELS[meet.meet_type as keyof typeof MEET_TYPE_LABELS]}
                    </span>
                  </div>
                  <p className="font-semibold text-white mt-0.5">{meet.name}</p>
                  <p className="text-sm text-zinc-500">
                    {new Date(meet.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {meet.venue && ` · ${meet.venue}`}
                    {' · '}{(meet.orgs as any)?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/meets/${meet.id}`}
                    className="px-3 py-1.5 text-xs border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg transition-colors">
                    View
                  </Link>
                  {meet.registration_open && (
                    <Link href={`/meets/${meet.id}/register/team`}
                      className="px-3 py-1.5 text-xs bg-[#FF4B00] hover:bg-[#e04200] text-white font-semibold rounded-lg transition-colors">
                      Register
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
