import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: demoMeet } = await supabase.from('meets').select('id').eq('public', true).order('created_at', { ascending: true }).limit(1).single()
  const demoHref = demoMeet ? `/meets/${demoMeet.id}/live` : '/dashboard/meets'

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden">
      {/* Diagonal orange accent bar */}
      <div className="absolute top-0 right-0 w-1 h-full bg-[#FF4B00] opacity-60 z-10" />
      <div className="absolute top-0 right-4 w-px h-full bg-[#FF4B00] opacity-20 z-10" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-[#181818]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF4B00] rounded flex items-center justify-center rotate-3">
            <span className="text-white font-black text-sm -rotate-3" style={{fontFamily:'Barlow Condensed,sans-serif'}}>TM</span>
          </div>
          <span className="text-white font-black text-2xl tracking-tight" style={{fontFamily:'Barlow Condensed,sans-serif', letterSpacing:'0.04em'}}>TRACKMATE</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard/orgs" className="bg-[#FF4B00] hover:bg-[#cc3c00] text-white font-bold px-5 py-2 rounded text-sm transition-colors uppercase tracking-wider" style={{fontFamily:'Barlow Condensed,sans-serif'}}>
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="text-[#888] hover:text-white text-sm transition-colors font-medium">Sign In</Link>
              <Link href="/auth/signup" className="bg-[#FF4B00] hover:bg-[#cc3c00] text-white font-bold px-5 py-2 rounded text-sm transition-colors uppercase tracking-wider" style={{fontFamily:'Barlow Condensed,sans-serif'}}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF4B00]/30 bg-[#FF4B00]/8 text-[#FF4B00] text-xs font-bold mb-8 uppercase tracking-[0.15em]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B00] live-dot" />
          HS · NCAA · Club · Elite
        </div>

        <h1 className="font-black text-[clamp(3.5rem,10vw,8rem)] leading-[0.9] mb-6 uppercase tracking-tight" style={{fontFamily:'Barlow Condensed,sans-serif'}}>
          Track &amp; Field<br/>
          <span className="gradient-text">Meet Management</span><br/>
          <span className="text-[#333]">Done Right.</span>
        </h1>

        <p className="text-[#888] text-lg max-w-xl mb-10 font-normal leading-relaxed">
          From entry registration to live results. FinishLynx integration, real-time scoreboards, Stripe payments, and automated TFRRS/Hy-Tek exports.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/auth/signup"
            className="bg-[#FF4B00] hover:bg-[#cc3c00] text-white font-black px-10 py-4 rounded text-lg uppercase tracking-wider transition-all hover:scale-105 shadow-lg shadow-orange-500/25"
            style={{fontFamily:'Barlow Condensed,sans-serif'}}>
            Start Free →
          </Link>
          <Link href={demoHref}
            className="border border-[#333] hover:border-[#FF4B00] text-[#888] hover:text-white font-bold px-10 py-4 rounded text-lg uppercase tracking-wider transition-all"
            style={{fontFamily:'Barlow Condensed,sans-serif'}}>
            Live Demo
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px mt-24 w-full max-w-5xl border border-[#181818] rounded-xl overflow-hidden">
          {[
            { icon: '⚡', title: 'FAT Bridge', desc: 'Watches FinishLynx Results folder, parses LIF/CSV, syncs instantly.' },
            { icon: '📡', title: 'Live Realtime', desc: 'Supabase Realtime pushes results to scoreboards as they come in.' },
            { icon: '🏫', title: 'Multi-Ruleset', desc: 'NFHS, NCAA FAT requirements, AAU scoring — auto-applied per meet type.' },
            { icon: '💳', title: 'Stripe Payments', desc: 'Per-athlete and per-team entry fees at registration checkout.' },
            { icon: '📄', title: 'Hy-Tek & TFRRS', desc: 'One-click export to Hy-Tek CSV, TFRRS XML, state HS formats.' },
            { icon: '📱', title: 'PWA Ready', desc: 'Install on any device. Coaches and officials work from the track.' },
          ].map((f, i) => (
            <div key={f.title} className="bg-[#0A0A0A] hover:bg-[#111] transition-colors p-6 group">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-black text-white text-lg mb-1 uppercase tracking-wide group-hover:text-[#FF4B00] transition-colors" style={{fontFamily:'Barlow Condensed,sans-serif'}}>{f.title}</h3>
              <p className="text-sm text-[#555] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-[#181818] py-6 text-center text-[#333] text-xs tracking-widest uppercase">
        © {new Date().getFullYear()} TrackMate · Built for the sport
      </footer>
    </div>
  )
}
