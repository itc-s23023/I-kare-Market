import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'アイカレマーケット',
  description: '学生同士で安心・安全に取引できる学内マーケットプレイス',
  icons: {
    icon: [
      {
        url: '/college-logo.png2',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/college-logo.png2',
        sizes: '16x16',
        type: 'image/png',
      }
    ],
    apple: {
      url: '/college-logo.png2',
      sizes: '180x180',
      type: 'image/png',
    },
    shortcut: '/college-logo.png2',
  },
  manifest: '/manifest.json',
  themeColor: '#ea580c',
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'アイカレマーケット',
    description: '学生同士で安心・安全に取引できる学内マーケットプレイス',
    siteName: 'アイカレマーケット',
    images: [
      {
        url: '/college-logo.png2',
        width: 1200,
        height: 630,
        alt: 'アイカレマーケット',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'アイカレマーケット',
    description: '学生同士で安心・安全に取引できる学内マーケットプレイス',
    images: ['/college-logo.png2'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
