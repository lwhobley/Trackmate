import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'TrackMate', template: '%s | TrackMate' },
  description: 'The complete track & field meet management platform for HS, NCAA, club, and elite meets.',
  manifest: '/manifest.json',
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  keywords: ['track and field', 'meet management', 'TFRRS', 'FinishLynx', 'athletics'],
}

export const viewport: Viewport = {
  themeColor: '#FF4B00',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#080808] text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
