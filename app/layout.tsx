import type { Metadata, Viewport } from 'next'
import { Inter, Bebas_Neue, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kemiscrm-production.up.railway.app'),
  title: {
    default: 'KRM — Kemis Relationship Management',
    template: '%s | KRM',
  },
  description:
    'A sovereign business operating system built in the Bahamas for Bahamian companies that want structure without foreign complexity.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'KRM — Kemis Relationship Management',
    description:
      'A sovereign business operating system built in the Bahamas for Bahamian companies that want structure without foreign complexity.',
    url: '/',
    siteName: 'KRM',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KRM dashboard showing contacts, pipeline, value, and tasks.',
      },
    ],
    locale: 'en_BS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KRM — Kemis Relationship Management',
    description:
      'A sovereign business operating system built in the Bahamas for Bahamian companies that want structure without foreign complexity.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0E1C2F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
