'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Home, Baby, Moon, Droplets, MoreHorizontal, Star, TrendingUp, Lightbulb, ShoppingBag, Settings, Syringe, HeartPulse, MessageCircle } from 'lucide-react'
import { useBaby } from '@/contexts/BabyContext'

const NAV_TABS = [
  { href: '/',         icon: Home,          label: 'Home' },
  { href: '/feeding',  icon: Baby,           label: 'Feed' },
  { href: '/diapers',  icon: Droplets,       label: 'Diaper' },
  { href: '/sleep',    icon: Moon,           label: 'Sleep' },
]

const MORE_ITEMS_BORN = [
  { href: '/milestones', icon: Star,           label: 'Milestones',    color: '#F9A8D4' },
  { href: '/milestones', icon: TrendingUp,     label: 'Growth Charts', color: '#86EFAC' },
  { href: '/vaccines',   icon: Syringe,        label: 'Vaccines',      color: '#FCA5A5' },
  { href: '/chat',       icon: MessageCircle,  label: 'Ask AI',        color: '#9B8EC4' },
  { href: '/tips',       icon: Lightbulb,      label: 'Care Tips (AI)',color: '#FCD34D' },
  { href: '/products',   icon: ShoppingBag,    label: 'Products (AI)', color: '#7C3AED' },
]

const MORE_ITEMS_EXPECTING = [
  { href: '/pregnancy',  icon: HeartPulse,  label: 'Pregnancy Tracker', color: '#F9A8D4' },
  { href: '/tips',       icon: Lightbulb,   label: 'Pregnancy Tips (AI)',color: '#FCD34D' },
  { href: '/products',   icon: ShoppingBag, label: 'What to Buy',       color: '#9B8EC4' },
]

const MORE_SETTINGS = [
  { href: '/settings', icon: Settings, label: 'Settings & Profile', color: '#6B6B7B' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { baby } = useBaby()
  const [sheetOpen, setSheetOpen] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close sheet on route change
  useEffect(() => { setSheetOpen(false) }, [pathname])

  function navigate(href: string) {
    setSheetOpen(false)
    router.push(href)
  }

  const isExpecting = baby?.status === 'expecting'
  const moreItems = isExpecting ? MORE_ITEMS_EXPECTING : MORE_ITEMS_BORN

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={`sheet-backdrop ${sheetOpen ? 'open' : ''}`}
        onClick={() => setSheetOpen(false)}
      />

      {/* More Sheet */}
      <div
        ref={sheetRef}
        className={`more-sheet ${sheetOpen ? 'open' : ''}`}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: '#EBEBF0' }} />
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, color: '#6B6B7B', letterSpacing: '0.08em', padding: '4px 4px 12px', textTransform: 'uppercase' }}>
          All Sections
        </p>

        {/* Main items */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {moreItems.map(item => (
            <button
              key={item.href + item.label}
              onClick={() => navigate(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#F9F8FF', borderRadius: 16, padding: '14px 16px',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: item.color + '33',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <item.icon size={20} color={item.color} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2D2D3A', lineHeight: 1.3 }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#EBEBF0', marginBottom: 16 }} />

        {/* Settings */}
        {MORE_SETTINGS.map(item => (
          <button
            key={item.href}
            onClick={() => navigate(item.href)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'transparent', borderRadius: 12, padding: '10px 4px',
              border: 'none', cursor: 'pointer', width: '100%',
              fontFamily: 'inherit',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#F5F5F7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <item.icon size={18} color={item.color} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#6B6B7B' }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom Nav Bar */}
      <nav className="bottom-nav">
        {NAV_TABS.map(tab => (
          <button
            key={tab.href}
            onClick={() => navigate(tab.href)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              border: 'none', background: 'transparent', cursor: 'pointer',
              padding: '8px 0', fontFamily: 'inherit',
              color: isActive(tab.href) ? '#9B8EC4' : '#6B6B7B',
            }}
          >
            <tab.icon size={22} strokeWidth={isActive(tab.href) ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.01em' }}>
              {tab.label}
            </span>
            {isActive(tab.href) && (
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#9B8EC4', marginTop: -1 }} />
            )}
          </button>
        ))}

        {/* More button */}
        <button
          onClick={() => setSheetOpen(v => !v)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            border: 'none', background: 'transparent', cursor: 'pointer',
            padding: '8px 0', fontFamily: 'inherit',
            color: sheetOpen ? '#9B8EC4' : '#6B6B7B',
          }}
        >
          <MoreHorizontal size={22} strokeWidth={sheetOpen ? 2.5 : 1.8} />
          <span style={{ fontSize: 10, fontWeight: 700 }}>More</span>
        </button>
      </nav>
    </>
  )
}
