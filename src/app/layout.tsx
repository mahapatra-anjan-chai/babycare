import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { BabyProvider } from '@/contexts/BabyContext'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'babycare · every little moment',
  description: 'Track feeding, sleep, diapers, milestones and more — with AI-powered care tips personalised for your baby.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'babycare',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#9B8EC4',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body className="min-h-full antialiased" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <BabyProvider>
          {children}
        </BabyProvider>
      </body>
    </html>
  )
}
