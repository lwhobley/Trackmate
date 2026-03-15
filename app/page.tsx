import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: demoMeet } = await supabase.from('meets').select('id').eq('public', true).order('created_at', { ascending: true }).limit(1).single()
  const demoHref = demoMeet ? `/meets/${demoMeet.id}/live` : '/dashboard/meets'

  return (
    <div className="min-h-screen mesh-hero overflow-hidden">

      {/* Blob decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="blob absolute w-[500px] h-[500px] -top-32 -left-32 bg-[#6C63FF] opacity-[0.07]" style={{animationDelay:'0s'}} />
        <div className="blob absolute w-[400px] h-[400px] top-20 right-0 bg-[#FF4B00] opacity-[0.06]" style={{animationDelay:'3s'}} />
        <div className="blob absolute w-[350px] h-[350px] bottom-0 left-1/3 bg-[#00C2B8] opacity-[0.07]" style={{animationDelay:'6s'}} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md" style={{background:'linear-gradient(135deg,#FF4B00,#FF7A3D)'}}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 17L10 3l7 14M6 11h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{fontFamily:'var(--font-body)',fontWeight:700,fontSize:'17px',color:'var(--text)',letterSpacing:'-0.01em'}}>TrackMate</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{color:'var(--text-muted)'}}>
          {['Features','Meets','Pricing'].map(l => <a key={l} href="#" className="hover:text-[--text] transition-colors">{l}</a>)}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard/orgs" className="btn-primary text-sm py-2.5 px-5">Dashboard →</Link>
          ) : (
            <>
              <Link href="/auth/signin" className="text-sm font-medium transition-colors" style={{color:'var(--text-muted)'}}>Sign in</Link>
              <Link href="/auth/signup" className="btn-primary text-sm py-2.5 px-5">Get started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24">
        {/* Pill badge */}
        <div className="fade-up flex justify-center mb-8">
          <div className="tag tag-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] live-dot inline-block" />
            HS · NCAA · Club · Elite meet management
          </div>
        </div>

        {/* Headline */}
        <div className="fade-up-1 text-center mb-6">
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2.8rem,7vw,5.5rem)',lineHeight:1.05,color:'var(--text)',letterSpacing:'-0.02em'}}>
            Track &amp; Field meets,<br />
            <em className="gradient-text not-italic">run beautifully.</em>
          </h1>
        </div>

        <p className="fade-up-2 text-center mx-auto mb-10 text-[17px] leading-relaxed max-w-xl" style={{color:'var(--text-muted)'}}>
          From athlete registration to live scoreboards and FinishLynx FAT integration — TrackMate handles the entire meet lifecycle.
        </p>

        {/* CTAs */}
        <div className="fade-up-3 flex flex-wrap items-center justify-center gap-3 mb-20">
          <Link href="/auth/signup" className="btn-primary">
            Start for free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link href={demoHref} className="btn-secondary">
            <span className="w-2 h-2 rounded-full bg-green-500 live-dot" />
            View live demo
          </Link>
        </div>

        {/* Feature cards - glass style */}
        <div className="fade-up-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: '⚡',
              color: '#FF4B00',
              pale: '#FFF0EB',
              title: 'FAT Bridge',
              desc: 'Watches your FinishLynx Results folder. Parses LIF/CSV files and pushes times to Supabase Realtime instantly.',
            },
            {
              icon: '📡',
              color: '#6C63FF',
              pale: '#F0EFFF',
              title: 'Live Scoring',
              desc: 'Realtime results and team scores. Scoreboards update the moment a result is entered — no refresh needed.',
            },
            {
              icon: '🏫',
              color: '#00C2B8',
              pale: '#E6FAFA',
              title: 'Multi-Ruleset',
              desc: 'NFHS wind rules, NCAA FAT requirements, AAU scoring — all auto-applied based on your meet type.',
            },
            {
              icon: '✅',
              color: '#6C63FF',
              pale: '#F0EFFF',
              title: 'Entry Management',
              desc: 'Athletes and events in one place. Track confirmed entries, scratches, and heat assignments.',
            },
            {
              icon: '📄',
              color: '#FF4B00',
              pale: '#FFF0EB',
              title: 'Exports',
              desc: 'Hy-Tek CSV, TFRRS XML, LIF start lists, and state HS formats. One click, every format.',
            },
            {
              icon: '📱',
              color: '#00C2B8',
              pale: '#E6FAFA',
              title: 'PWA Ready',
              desc: 'Install on any device. Coaches and officials work from the track, not a laptop.',
            },
          ].map(f => (
            <div key={f.title} className="glass-card rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-xl" style={{background:f.pale}}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-[15px] mb-1.5" style={{color:'var(--text)'}}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{color:'var(--text-muted)'}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t py-6 text-center text-sm" style={{borderColor:'var(--border)',color:'var(--text-subtle)'}}>
        © {new Date().getFullYear()} TrackMate · Built for the sport
      </footer>
    </div>
  )
}
