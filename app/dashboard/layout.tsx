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

  const { data: profile } = await supabase.from('profiles').select('*, orgs(*)').eq('id', user.id).single<ProfileWithOrg>()

  const navItems = [
    { href: '/dashboard/orgs', label: 'My Meets', icon: '🏟️' },
    { href: '/dashboard/meets', label: 'Browse Meets', icon: '📋' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, borderRight: '1px solid var(--border-dim)', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100%', zIndex: 40 }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-dim)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#FF4B00,#cc3c00)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(255,75,0,0.35)', flexShrink: 0 }}>
              <span style={{ color: 'white', fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 12 }}>TM</span>
            </div>
            <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 18, letterSpacing: '0.01em', color: 'white' }}>TRACKMATE</span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, textDecoration: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, marginBottom: 2, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-dim)' }}>
          <div style={{ padding: '10px 12px', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,75,0,0.15)', border: '1px solid rgba(255,75,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 12, color: '#FF4B00' }}>
                  {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name || 'User'}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.orgs?.name || 'No org'}</p>
              </div>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, fontFamily: 'Barlow', fontWeight: 600 }}>
              Sign out →
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
