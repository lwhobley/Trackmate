import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: demoMeet } = await supabase.from('meets').select('id').eq('public', true).limit(1).single()
  const demoHref = demoMeet ? `/meets/${demoMeet.id}/live` : '/dashboard/meets'

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col track-bg overflow-hidden">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 border-b border-[#252535]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF3B00] rounded-lg flex items-center justify-center shadow-lg shadow-orange-600/30">
            <span className="font-display font-900 text-white text-base italic font-black">TM</span>
          </div>
          <span className="font-display text-xl font-black italic text-white tracking-wide">TRACKMATE</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard/orgs" className="bg-[#FF3B00] hover:bg-[#e03500] text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="text-[#8888A0] hover:text-white text-sm transition-colors font-medium">Sign In</Link>
              <Link href="/auth/signup" className="bg-[#FF3B00] hover:bg-[#e03500] text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all shadow-lg shadow-orange-600/20">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 relative">
        {/* Background orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF3B00]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-20 pb-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF3B00]/10 border border-[#FF3B00]/20 mb-8 fade-up fade-up-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B00] live-dot" />
            <span className="text-[#FF3B00] text-xs font-bold uppercase tracking-widest">HS · NCAA · Club · Elite</span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-black italic text-white leading-none mb-6 fade-up fade-up-2"
            style={{ fontSize: 'clamp(56px, 10vw, 120px)' }}>
            MEET MANAGEMENT<br />
            <span className="gradient-text">BUILT FOR SPEED.</span>
          </h1>

          <p className="text-[#8888A0] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed fade-up fade-up-3">
            From entry registration to live FAT results — TrackMate runs HS, NCAA, club, and elite meets with FinishLynx integration, Stripe payments, and real-time scoreboards.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 fade-up fade-up-4">
            <Link href="/auth/signup"
              className="group relative bg-[#FF3B00] hover:bg-[#e03500] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-2xl shadow-orange-600/30 hover:shadow-orange-600/50 hover:-translate-y-0.5">
              Start Free
              <span className="ml-2 group-hover:translate-x-1 inline-block transition-transform">→</span>
            </Link>
            <Link href={demoHref}
              className="border border-[#252535] hover:border-[#FF3B00]/50 bg-[#0A0A12] text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:-translate-y-0.5">
              Live Demo
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-16 pt-10 border-t border-[#252535] fade-up fade-up-4">
            {[
              { n: '4', label: 'Meet Types' },
              { n: '21+', label: 'Events / Meet' },
              { n: '∞', label: 'Real-time' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display font-black italic text-[#FF3B00] text-4xl">{s.n}</div>
                <div className="text-[#8888A0] text-xs uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <div className="max-w-6xl mx-auto px-6 md:px-10 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                icon: '⚡',
                title: 'FAT Bridge',
                desc: 'Watches your FinishLynx Results folder. Parses LIF/CSV and upserts to Supabase in real time.',
                accent: true,
              },
              {
                icon: '📡',
                title: 'Live Results',
                desc: 'Supabase Realtime pushes FAT times to coaches and scoreboards the instant they arrive.',
              },
              {
                icon: '🏫',
                title: 'Multi-Ruleset',
                desc: 'NFHS wind rules, NCAA FAT requirements, AAU scoring — auto-applied by meet type.',
              },
              {
                icon: '🎟️',
                title: 'Stripe Payments',
                desc: 'Per-athlete and per-team entry fees with automatic confirmation on payment.',
              },
              {
                icon: '📄',
                title: 'Hy-Tek & TFRRS',
                desc: 'One-click export to Hy-Tek CSV, TFRRS XML, LIF start lists, and HS formats.',
              },
              {
                icon: '📱',
                title: 'PWA Ready',
                desc: 'Installable on any device. Coaches register athletes trackside with no app store needed.',
              },
            ].map(f => (
              <div key={f.title}
                className={`relative p-6 rounded-2xl border transition-all hover:-translate-y-0.5 ${
                  f.accent
                    ? 'bg-[#FF3B00]/10 border-[#FF3B00]/30 hover:border-[#FF3B00]/50'
                    : 'bg-[#0A0A12] border-[#252535] hover:border-[#353548]'
                }`}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-display font-black italic text-white text-xl mb-2">{f.title}</h3>
                <p className="text-[#8888A0] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#252535] py-6 text-center text-[#444458] text-sm">
        © {new Date().getFullYear()} TrackMate · Built for the sport
      </footer>
    </div>
  )
}
