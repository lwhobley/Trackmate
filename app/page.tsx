import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF4B00] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">TM</span>
          </div>
          <span className="font-black text-xl tracking-tight">TrackMate</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard/orgs" className="bg-[#FF4B00] hover:bg-[#e04200] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="text-zinc-400 hover:text-white text-sm transition-colors">Sign In</Link>
              <Link href="/auth/signup" className="bg-[#FF4B00] hover:bg-[#e04200] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4B00]/10 border border-[#FF4B00]/20 text-[#FF4B00] text-xs font-semibold mb-8 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B00] live-dot" />
          HS · NCAA · Club · Elite
        </div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-none mb-6">
          Track &amp; Field<br />
          <span className="gradient-text">Meet Management</span><br />
          Done Right.
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mb-10">
          From entry registration to live results — TrackMate handles HS/NFHS, NCAA/TFRRS, club/AAU, and elite meets with FinishLynx integration, real-time scoreboards, and automated exports.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/auth/signup" className="bg-[#FF4B00] hover:bg-[#e04200] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-orange-500/20">
            Start Free →
          </Link>
          <Link href="/meets/44444444-4444-4444-4444-444444444444/live" className="border border-[#2A2A2A] hover:border-[#FF4B00]/50 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            View Live Demo
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 w-full text-left">
          {[
            { icon: '⚡', title: 'FAT Bridge', desc: 'Watches your FinishLynx Results folder and syncs times instantly via LIF/CSV parsing.' },
            { icon: '📡', title: 'Live Results', desc: 'Supabase Realtime pushes results to scoreboards and coaches the moment they come in.' },
            { icon: '🏫', title: 'Multi-Ruleset', desc: 'NFHS wind rules, NCAA FAT requirements, AAU scoring — all auto-applied per meet type.' },
            { icon: '🎟️', title: 'Stripe Payments', desc: 'Per-athlete and per-team entry fees collected at registration checkout.' },
            { icon: '📄', title: 'Hy-Tek & TFRRS', desc: 'One-click export to Hy-Tek CSV, TFRRS XML, and state HS submission formats.' },
            { icon: '📱', title: 'PWA + Mobile', desc: 'Install on any device. Coaches check in athletes, officials update results on the track.' },
          ].map(f => (
            <div key={f.title} className="p-6 rounded-xl border border-[#1a1a1a] bg-[#0D0D0D] hover:border-[#2A2A2A] transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#1a1a1a] py-8 text-center text-zinc-600 text-sm">
        © {new Date().getFullYear()} TrackMate · Built for the sport
      </footer>
    </div>
  )
}
