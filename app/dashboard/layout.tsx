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

  const navItems = [
    { href: '/dashboard/orgs', label: 'My Organization', icon: '🏫' },
    { href: '/dashboard/meets', label: 'Browse Meets', icon: '🏁' },
  ]

  const initial = (profile?.name || user.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen flex" style={{background:'var(--bg-2)'}}>
      {/* Sidebar */}
      <aside className="w-60 flex flex-col fixed h-full z-20 border-r" style={{background:'rgba(255,255,255,0.85)',backdropFilter:'blur(20px)',borderColor:'rgba(108,99,255,0.1)'}}>
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{borderColor:'rgba(108,99,255,0.08)'}}>
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-shadow group-hover:shadow-md" style={{background:'linear-gradient(135deg,#FF4B00,#FF7A3D)'}}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 17L10 3l7 14M6 11h8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{fontFamily:'var(--font-body)',fontWeight:700,fontSize:'16px',color:'var(--text)'}}>TrackMate</span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{color:'var(--text-subtle)'}}>Menu</p>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="sidebar-link">
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Profile */}
        <div className="p-3 border-t" style={{borderColor:'rgba(108,99,255,0.08)'}}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-1" style={{background:'rgba(108,99,255,0.05)'}}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-white shadow-sm"
              style={{background:'linear-gradient(135deg,#6C63FF,#9B8FFF)'}}>
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{color:'var(--text)'}}>{profile?.name || 'User'}</p>
              <p className="text-xs truncate" style={{color:'var(--text-muted)'}}>{profile?.orgs?.name || 'No org'}</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="sidebar-link w-full text-sm" style={{color:'var(--text-muted)'}}>
              <span>↩</span> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen" style={{background:'var(--bg-2)'}}>
        {children}
      </main>
    </div>
  )
}
