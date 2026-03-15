import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('profiles').select('*, orgs(*)').eq('id', user.id).single()

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-[#1a1a1a] bg-[#0D0D0D] flex flex-col fixed h-full">
        <div className="p-4 border-b border-[#1a1a1a]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF4B00] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">TM</span>
            </div>
            <span className="font-black text-lg tracking-tight">TrackMate</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: '/dashboard/orgs', label: 'Organizations', icon: '🏫' },
            { href: '/dashboard/meets', label: 'All Meets', icon: '📋' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition-colors">
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-[#FF4B00]/20 border border-[#FF4B00]/30 flex items-center justify-center text-xs text-[#FF4B00] font-bold">
              {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{(profile?.orgs as any)?.name || 'No org'}</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-[#1a1a1a]">
              Sign out →
            </button>
          </form>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}
