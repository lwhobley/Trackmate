import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import { Profile, Org } from '@/lib/types'

type ProfileWithOrg = Profile & { orgs: Org | null }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles').select('*, orgs(*)').eq('id', user.id).single<ProfileWithOrg>()

  return (
    <div className="min-h-screen bg-[#05050A] flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-[#252535] bg-[#08080F] flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-5 border-b border-[#252535]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#FF3B00] rounded-lg flex items-center justify-center shadow-lg shadow-orange-600/30">
              <span className="font-display font-black italic text-white text-sm">TM</span>
            </div>
            <span className="font-display font-black italic text-white text-lg tracking-wide">TRACKMATE</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#444458]">Navigation</p>
          {[
            { href: '/dashboard/orgs', label: 'My Meets', icon: '🏟️' },
            { href: '/dashboard/meets', label: 'Browse Meets', icon: '🔍' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8888A0] hover:text-white hover:bg-[#16161F] transition-all group">
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-[#252535]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#0F0F1A] mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF3B00] to-[#FF8C00] flex items-center justify-center text-xs text-white font-black shadow">
              {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.name || 'User'}</p>
              <p className="text-[10px] text-[#8888A0] truncate">{profile?.orgs?.name || 'No org'}</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="w-full text-left px-3 py-1.5 text-xs text-[#444458] hover:text-[#8888A0] transition-colors rounded-lg hover:bg-[#0F0F1A]">
              Sign out →
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}
