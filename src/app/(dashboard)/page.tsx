'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Baby, Moon, Droplets, Syringe, Plus, ChevronRight, X, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react'
import { useBaby } from '@/contexts/BabyContext'
import { BabycareLogo } from '@/components/layout/AppBar'
import { createClient } from '@/lib/supabase'
import { getGreeting, formatTime, timeSince, getAgeDisplay } from '@/lib/utils'
import { computeVaccineSchedule } from '@/lib/vaccines'

interface ActivityEntry {
  id: string
  type: 'feed' | 'sleep' | 'diaper'
  label: string
  time: string
  icon: string
  color: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { baby, loading, ageWeeks, ageMonths, avgFeedsPerDay, avgSleepHoursPerDay } = useBaby()
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [stats, setStats] = useState({ feeds: 0, sleep: 0, diapers: 0, lastFeed: '', lastSleep: '', lastDiaper: '' })
  const [vaccineAlert, setVaccineAlert] = useState<string | null>(null)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [showQuickLog, setShowQuickLog] = useState(false)

  useEffect(() => {
    if (baby) loadDashboardData()
  }, [baby])

  async function loadDashboardData() {
    if (!baby || baby.status === 'expecting') return
    const supabase = createClient()
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()

    const [feedRes, sleepRes, diaperRes] = await Promise.all([
      supabase.from('feedings').select('*').eq('baby_id', baby.id).gte('logged_at', startOfDay).order('logged_at', { ascending: false }),
      supabase.from('sleeps').select('*').eq('baby_id', baby.id).gte('started_at', startOfDay).order('started_at', { ascending: false }),
      supabase.from('diapers').select('*').eq('baby_id', baby.id).gte('logged_at', startOfDay).order('logged_at', { ascending: false }),
    ])

    const feeds = feedRes.data ?? []
    const sleeps = sleepRes.data ?? []
    const diapers = diaperRes.data ?? []

    const totalSleepMs = sleeps.reduce((sum: number, s: { started_at: string; ended_at: string | null }) => {
      if (!s.ended_at) return sum
      return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime())
    }, 0)

    setStats({
      feeds: feeds.length,
      sleep: Math.round(totalSleepMs / 3600000 * 10) / 10,
      diapers: diapers.length,
      lastFeed: feeds[0]?.logged_at ? timeSince(feeds[0].logged_at) : '—',
      lastSleep: sleeps[0]?.ended_at ? timeSince(sleeps[0].ended_at) : '—',
      lastDiaper: diapers[0]?.logged_at ? timeSince(diapers[0].logged_at) : '—',
    })

    // Build timeline
    const entries: ActivityEntry[] = [
      ...feeds.map((f: { id: string; type: string; logged_at: string; amount_ml: number }) => ({
        id: f.id, type: 'feed' as const,
        label: f.type === 'bottle' ? `Bottle${f.amount_ml ? ' · ' + f.amount_ml + 'ml' : ''}` : f.type === 'breast' ? 'Breast feed' : 'Solids',
        time: f.logged_at,
        icon: '🍼', color: '#FBBF91',
      })),
      ...sleeps.filter((s: { ended_at: string | null }) => s.ended_at).map((s: { id: string; started_at: string; ended_at: string; type: string }) => ({
        id: s.id, type: 'sleep' as const,
        label: `${s.type === 'night' ? 'Night sleep' : 'Nap'}`,
        time: s.started_at,
        icon: '😴', color: '#93C5FD',
      })),
      ...diapers.map((d: { id: string; type: string; logged_at: string }) => ({
        id: d.id, type: 'diaper' as const,
        label: `Diaper · ${d.type}`,
        time: d.logged_at,
        icon: d.type === 'dirty' ? '💩' : '💧', color: '#86EFAC',
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8)
    setActivities(entries)

    // Vaccine alert
    if (baby.date_of_birth) {
      const schedule = computeVaccineSchedule(baby.date_of_birth)
      const urgent = schedule.find(v => v.status === 'due_soon' || v.status === 'overdue')
      if (urgent) {
        const msg = urgent.status === 'overdue'
          ? `💉 ${urgent.vaccineName} is overdue — tap to schedule`
          : `💉 ${urgent.vaccineName} due in ${urgent.daysUntilDue} day${urgent.daysUntilDue !== 1 ? 's' : ''} — tap to schedule`
        setVaccineAlert(msg)
      }
    }
  }

  async function quickLog(type: 'breast' | 'bottle' | 'nap' | 'wet') {
    if (!baby) return
    const supabase = createClient()
    setShowQuickLog(false)
    if (type === 'breast' || type === 'bottle') {
      await supabase.from('feedings').insert({ baby_id: baby.id, type, logged_at: new Date().toISOString() })
    } else if (type === 'nap') {
      await supabase.from('sleeps').insert({ baby_id: baby.id, type: 'nap', started_at: new Date().toISOString() })
    } else {
      await supabase.from('diapers').insert({ baby_id: baby.id, type: 'wet', logged_at: new Date().toISOString() })
    }
    loadDashboardData()
  }

  if (loading) return <LoadingScreen />

  if (!baby) {
    return (
      <div style={{ padding: 32, textAlign: 'center', paddingTop: 80 }}>
        <BabycareLogo size={64} />
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#2D2D3A', marginTop: 20, marginBottom: 8 }}>Welcome to babycare</h1>
        <p style={{ color: '#6B6B7B', fontSize: 15, marginBottom: 32 }}>Every little moment, tracked with love</p>
        <button
          onClick={() => router.push('/onboarding')}
          style={{
            background: '#9B8EC4', color: 'white', border: 'none', borderRadius: 16,
            padding: '16px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', width: '100%',
          }}
        >
          Get Started 💜
        </button>
      </div>
    )
  }

  if (baby.status === 'expecting') {
    return <ExpectingDashboard baby={baby} />
  }

  const babyAge = baby.date_of_birth ? getAgeDisplay(baby.date_of_birth) : ''

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #EDE9F8 0%, #FAFAF8 100%)',
        padding: '20px 20px 16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BabycareLogo size={36} />
            <div>
              <p style={{ fontSize: 12, color: '#9B8EC4', fontWeight: 700, letterSpacing: '0.05em' }}>BABYCARE</p>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2D2D3A', lineHeight: 1.1 }}>
                {getGreeting(baby.parent1_name)}
              </h1>
            </div>
          </div>
          <button onClick={() => router.push('/settings')} style={{ background: 'white', border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer' }}>
            <Settings size={20} color="#6B6B7B" />
          </button>
        </div>
        <p style={{ color: '#6B6B7B', fontSize: 14, marginTop: 8, fontWeight: 600 }}>
          {baby.name} is {babyAge} · {ageWeeks}w
        </p>
      </div>

      {/* Vaccine Alert */}
      {vaccineAlert && (
        <div
          onClick={() => router.push('/vaccines')}
          style={{
            margin: '12px 16px 0',
            background: '#FEF2F2', border: '1.5px solid #FCA5A5',
            borderRadius: 14, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          }}
        >
          <Syringe size={18} color="#EF4444" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', flex: 1 }}>{vaccineAlert}</span>
          <ChevronRight size={16} color="#EF4444" />
        </div>
      )}

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '14px 16px 0' }}>
        <StatCard icon="🍼" label="Last fed" value={stats.lastFeed} color="#FBBF91" onClick={() => router.push('/feeding')} />
        <StatCard icon="😴" label="Last sleep" value={stats.lastSleep} color="#93C5FD" onClick={() => router.push('/sleep')} />
        <StatCard icon="💧" label="Diapers" value={`${stats.diapers} today`} color="#86EFAC" onClick={() => router.push('/diapers')} />
      </div>

      {/* Quick Log Strip */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <QuickLogBtn emoji="🍼" label="Bottle" onClick={() => quickLog('bottle')} color="#FBBF91" />
          <QuickLogBtn emoji="🤱" label="Breast" onClick={() => quickLog('breast')} color="#F9A8D4" />
          <QuickLogBtn emoji="😴" label="Nap" onClick={() => quickLog('nap')} color="#93C5FD" />
          <QuickLogBtn emoji="💧" label="Wet" onClick={() => router.push('/diapers')} color="#86EFAC" />
          <QuickLogBtn emoji="+" label="More" onClick={() => router.push('/feeding')} color="#EDE9F8" />
        </div>
      </div>

      {/* Newborn Prep Checklist — shown for first 6 months */}
      {ageWeeks < 26 && <NewbornPrepChecklist babyId={baby.id} babyName={baby.name} />}

      {/* Smart Nudge */}
      {!nudgeDismissed && avgFeedsPerDay > 0 && (
        <div style={{ margin: '14px 16px 0', background: '#EDE9F8', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#9B8EC4' }}>💡 7-day pattern</p>
              <p style={{ fontSize: 13, color: '#2D2D3A', marginTop: 4, lineHeight: 1.4 }}>
                {baby.name} averages {avgFeedsPerDay.toFixed(1)} feeds & {avgSleepHoursPerDay.toFixed(1)}h sleep per day this week.
              </p>
            </div>
            <button onClick={() => setNudgeDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={16} color="#9B8EC4" />
            </button>
          </div>
        </div>
      )}

      {/* Today's Timeline */}
      <div style={{ padding: '18px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#2D2D3A' }}>Today&apos;s Timeline</h2>
          <span style={{ fontSize: 13, color: '#9B8EC4', fontWeight: 600 }}>
            {stats.feeds} feeds · {stats.diapers} diapers
          </span>
        </div>

        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#6B6B7B' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>☀️</p>
            <p style={{ fontSize: 14, fontWeight: 600 }}>Nothing logged yet today</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Tap a quick-log button above to start</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activities.map(entry => (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid #F5F5F7',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: entry.color + '33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {entry.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2D2D3A' }}>{entry.label}</p>
                  <p style={{ fontSize: 12, color: '#6B6B7B', marginTop: 1 }}>{formatTime(entry.time)}</p>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#9B8EC4',
                  background: '#EDE9F8', padding: '2px 8px', borderRadius: 999,
                }}>
                  {timeSince(entry.time)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => router.push('/feeding')}
        style={{
          position: 'fixed', bottom: 80, right: 20,
          width: 52, height: 52, borderRadius: '50%',
          background: '#9B8EC4', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(155,142,196,0.4)',
          zIndex: 35,
        }}
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </button>
    </div>
  )
}

function StatCard({ icon, label, value, color, onClick }: { icon: string; label: string; value: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'white', border: '1.5px solid #EBEBF0',
        borderRadius: 16, padding: '12px 10px',
        display: 'flex', flexDirection: 'column', gap: 4,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      <div style={{ fontSize: 22 }}>{icon}</div>
      <p style={{ fontSize: 10, color: '#6B6B7B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 800, color: '#2D2D3A', lineHeight: 1.2 }}>{value}</p>
      <div style={{ height: 3, borderRadius: 999, background: color, width: '50%', marginTop: 2 }} />
    </button>
  )
}

function QuickLogBtn({ emoji, label, onClick, color }: { emoji: string; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '10px 14px', borderRadius: 14,
        background: color + '40', border: `1.5px solid ${color}60`,
        cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
        minWidth: 60,
      }}
    >
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#2D2D3A' }}>{label}</span>
    </button>
  )
}

function ExpectingDashboard({ baby }: { baby: { name: string; due_date: string | null; parent1_name: string } }) {
  const router = useRouter()
  const daysLeft = baby.due_date ? Math.ceil((new Date(baby.due_date).getTime() - Date.now()) / 86400000) : 0
  const weeksLeft = Math.floor(daysLeft / 7)
  const weeksPregnant = Math.max(0, 40 - weeksLeft)

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FCE7F3 0%, #EDE9F8 100%)',
        padding: '20px 20px 20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 14, color: '#9B8EC4', fontWeight: 700 }}>Welcome, {baby.parent1_name}! 🌸</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2D2D3A', marginTop: 4 }}>
              {daysLeft > 0 ? `${daysLeft} days to go` : 'Due any day now!'}
            </h1>
            <p style={{ fontSize: 14, color: '#6B6B7B', marginTop: 4 }}>
              Week {weeksPregnant} of pregnancy · {weeksLeft}w left
            </p>
          </div>
          <button onClick={() => router.push('/settings')} style={{ background: 'white', border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer' }}>
            <Settings size={20} color="#6B6B7B" />
          </button>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.5)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            background: 'linear-gradient(90deg, #F9A8D4, #9B8EC4)',
            width: `${Math.min(100, (weeksPregnant / 40) * 100)}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Quick links */}
      <div style={{ padding: '16px 16px 0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#2D2D3A', marginBottom: 12 }}>Prepare for Baby</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { emoji: '🧳', label: 'Hospital Bag', href: '/pregnancy' },
            { emoji: '🛏️', label: 'Nursery Setup', href: '/pregnancy' },
            { emoji: '📅', label: 'Week Tracker', href: '/pregnancy' },
            { emoji: '🛍️', label: 'What to Buy', href: '/products' },
            { emoji: '💡', label: 'Pregnancy Tips', href: '/tips' },
            { emoji: '💉', label: 'Vaccine Plan', href: '/vaccines' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              style={{
                background: 'white', border: '1.5px solid #EBEBF0',
                borderRadius: 16, padding: '16px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 24 }}>{item.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2D2D3A' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const PREP_ITEMS = [
  { id: 'pediatrician',    emoji: '👨‍⚕️', label: 'Registered with a paediatrician',        category: 'Health' },
  { id: 'vitamin_d',       emoji: '☀️',  label: 'Vitamin D drops started (IAP: from day 1)', category: 'Health' },
  { id: 'vaccines',        emoji: '💉',  label: 'Vaccination schedule reviewed',             category: 'Health' },
  { id: 'safe_sleep',      emoji: '🛏️', label: 'Safe sleep environment ready',              category: 'Safety' },
  { id: 'car_seat',        emoji: '🚗',  label: 'Car seat installed correctly',              category: 'Safety' },
  { id: 'emergency',       emoji: '📞',  label: 'Emergency contacts saved (doctor, clinic)', category: 'Safety' },
  { id: 'feeding',         emoji: '🍼',  label: 'Feeding routine established',               category: 'Feeding' },
  { id: 'diaper_station',  emoji: '💧',  label: 'Diaper changing station stocked',           category: 'Home' },
  { id: 'nursery',         emoji: '🧸',  label: 'Nursery / sleep area set up',               category: 'Home' },
  { id: 'monitor',         emoji: '📡',  label: 'Baby monitor working',                       category: 'Home' },
  { id: 'birth_cert',      emoji: '📄',  label: 'Birth certificate applied for',             category: 'Admin' },
  { id: 'insurance',       emoji: '🏥',  label: 'Baby added to health insurance',            category: 'Admin' },
]

function NewbornPrepChecklist({ babyId, babyName }: { babyId: string; babyName: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(true)
  const storageKey = `babycare_prep_${babyId}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setChecked(JSON.parse(saved))
    } catch {}
  }, [storageKey])

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }, [storageKey])

  const done = PREP_ITEMS.filter(i => checked[i.id]).length
  const total = PREP_ITEMS.length
  const pct = Math.round((done / total) * 100)

  return (
    <div style={{ margin: '14px 16px 0', background: 'white', border: '1.5px solid #EBEBF0', borderRadius: 18, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 20 }}>🧾</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#2D2D3A' }}>Newborn Prep List</p>
          <p style={{ fontSize: 12, color: '#6B6B7B', marginTop: 2 }}>
            {done}/{total} done · {pct}% complete
          </p>
        </div>
        {open ? <ChevronUp size={18} color="#9B8EC4" /> : <ChevronDown size={18} color="#9B8EC4" />}
      </button>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#EBEBF0', margin: '0 16px' }}>
        <div style={{
          height: '100%', borderRadius: 999,
          background: pct === 100 ? '#22C55E' : '#9B8EC4',
          width: `${pct}%`, transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Items */}
      {open && (
        <div style={{ padding: '8px 0 12px' }}>
          {PREP_ITEMS.map(item => {
            const isDone = !!checked[item.id]
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                {isDone
                  ? <CheckCircle2 size={20} color="#22C55E" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  : <Circle size={20} color="#D1D5DB" strokeWidth={2} style={{ flexShrink: 0 }} />
                }
                <span style={{ fontSize: 14, color: isDone ? '#6B6B7B' : '#2D2D3A', fontWeight: 600, textDecoration: isDone ? 'line-through' : 'none', flex: 1, lineHeight: 1.4 }}>
                  {item.emoji} {item.label}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#9B8EC4', background: '#EDE9F8', padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                  {item.category}
                </span>
              </button>
            )
          })}

          {pct === 100 && (
            <div style={{ margin: '8px 16px 0', background: '#DCFCE7', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#22C55E" />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>
                All done! {babyName} is all set 💜
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60dvh', gap: 16 }}>
      <BabycareLogo size={56} />
      <div style={{
        width: 40, height: 4, borderRadius: 999,
        background: 'linear-gradient(90deg, #EDE9F8, #9B8EC4, #EDE9F8)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
      <p style={{ fontSize: 14, color: '#9B8EC4', fontWeight: 600 }}>Loading your baby&apos;s world…</p>
    </div>
  )
}
