'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'

interface AppBarProps {
  title?: string
  showBack?: boolean
  showSettings?: boolean
  showLogo?: boolean
  rightElement?: React.ReactNode
}

export default function AppBar({ title, showBack, showSettings, showLogo, rightElement }: AppBarProps) {
  const router = useRouter()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px 12px',
      background: 'white',
      borderBottom: '1px solid #EBEBF0',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      {/* Left */}
      <div style={{ width: 36 }}>
        {showBack && (
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <ArrowLeft size={22} color="#2D2D3A" />
          </button>
        )}
        {showLogo && <BabycareLogo size={28} />}
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: showLogo ? 18 : 17,
        fontWeight: 800,
        color: '#2D2D3A',
        letterSpacing: showLogo ? '0.02em' : 0,
        flex: 1,
        textAlign: showLogo ? 'left' : 'center',
        marginLeft: showLogo ? 8 : 0,
      }}>
        {showLogo ? 'babycare' : title}
      </h1>

      {/* Right */}
      <div style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>
        {showSettings && (
          <button
            onClick={() => router.push('/settings')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Settings size={20} color="#6B6B7B" />
          </button>
        )}
        {rightElement}
      </div>
    </div>
  )
}

export function BabycareLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Crescent moon */}
      <path
        d="M44 32C44 40.837 36.837 48 28 48C24.21 48 20.74 46.63 18.06 44.34C20.34 44.77 22.69 44.5 24.88 43.5C31.89 40.28 35.16 32.04 31.93 25.03C30.49 21.86 27.98 19.42 24.97 17.94C26.59 17.33 28.33 17 30 17C38.837 17 44 23.163 44 32Z"
        fill="#9B8EC4"
        opacity="0.85"
      />
      {/* Stars */}
      <circle cx="48" cy="18" r="2" fill="#9B8EC4" opacity="0.5" />
      <circle cx="52" cy="26" r="1.5" fill="#9B8EC4" opacity="0.35" />
      <circle cx="44" cy="13" r="1" fill="#9B8EC4" opacity="0.4" />
      {/* Sleeping baby face */}
      <ellipse cx="28" cy="30" rx="9" ry="9" fill="#FFD6B3" />
      {/* Closed eyes */}
      <path d="M24 29 Q25.5 27.5 27 29" stroke="#8B6F5E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M29 29 Q30.5 27.5 32 29" stroke="#8B6F5E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Little smile */}
      <path d="M26 32 Q28 34 30 32" stroke="#C09080" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Zzz */}
      <text x="37" y="25" fontSize="7" fill="#9B8EC4" fontFamily="sans-serif" fontWeight="bold" opacity="0.7">z</text>
      <text x="40" y="21" fontSize="5" fill="#9B8EC4" fontFamily="sans-serif" fontWeight="bold" opacity="0.5">z</text>
    </svg>
  )
}
