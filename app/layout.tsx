import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'TrackMate', template: '%s | TrackMate' },
  description: 'The complete track & field meet management platform.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#FF4B00',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body">{children}</body>
    </html>
  )
}
