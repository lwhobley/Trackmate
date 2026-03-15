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
    <div className="min-h-screen bg-[#050505] flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-[#181818] bg-[#080808] flex flex-col fixed h-full z-30">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[#181818]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#FF4B00] rounded flex items-center justify-center rotate-2">
              <span className="text-white font-black text-xs -rotate-2" style={{fontFamily:'Barlow Condensed,sans-serif'}}>TM</span>
            </div>
            <span className="font-black text-lg text-white tracking-widest uppercase" style={{fontFamily:'Barlow Condensed,sans-serif'}}>TrackMate</span>
          </Link>
        </div>

        {/* Org badge */}
        {profile?.orgs && (
          <div className="mx-3 mt-3 px-3 py-2 rounded bg-[#FF4B00]/10 border border-[#FF4B00]/20">
            <p className="text-[10px] text-[#FF4B00] font-bold uppercase tracking-widest mb-0.5">Organization</p>
            <p className="text-white text-xs font-semibold truncate">{profile.orgs.name}</p>
            <p className="text-[#555] text-[10px] uppercase tracking-wider">{profile.orgs.type}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 mt-2">
          {[
            { href: '/dashboard/orgs', label: 'My Meets', icon: '🏟' },
            { href: '/dashboard/meets', label: 'Browse Meets', icon: '📋' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-[#666] hover:text-white hover:bg-[#151515] transition-all group">
              <span className="text-base">{item.icon}</span>
              <span className="font-medium tracking-wide">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-[#181818]">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded bg-[#FF4B00] flex items-center justify-center text-xs text-white font-black flex-shrink-0" style={{fontFamily:'Barlow Condensed,sans-serif'}}>
              {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.name || 'User'}</p>
              <p className="text-[10px] text-[#444] truncate">{user.email}</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="w-full text-left px-3 py-1.5 text-xs text-[#444] hover:text-[#FF4B00] transition-colors rounded hover:bg-[#111] font-medium tracking-wide">
              Sign out →
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen relative z-10">{children}</main>
    </div>
  )
}
