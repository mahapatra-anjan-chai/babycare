'use client'

import { useState, useEffect, useRef } from 'react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { createClient } from '@/lib/supabase'
import { formatTime, formatDate, durationDisplay } from '@/lib/utils'

interface SleepEntry {
  id: string
  started_at: string
  ended_at: string | null
  type: 'nap' | 'night'
}

interface SleepRecommendation {
  label: string
  total: string
  naps: string
  night: string
}

function getSleepRecommendation(ageMonths: number): SleepRecommendation {
  if (ageMonths < 1) return { label: 'Newborn (0–1 month)', total: '14–17 hours', naps: '3–5 short naps', night: 'wakes every 2–3 hours' }
  if (ageMonths < 3) return { label: '1–3 months', total: '14–17 hours', naps: '3–4 naps daily', night: '4–6 hour stretches' }
  if (ageMonths < 6) return { label: '3–6 months', total: '12–15 hours', naps: '3 naps (morning, midday, late afternoon)', night: 'longest stretch 5–8 hours' }
  if (ageMonths < 9) return { label: '6–9 months', total: '12–15 hours', naps: '2–3 naps daily', night: '6–10 hour stretches' }
  if (ageMonths < 12) return { label: '9–12 months', total: '12–14 hours', naps: '2 naps (morning + afternoon)', night: 'up to 10–12 hours' }
  if (ageMonths < 18) return { label: '12–18 months', total: '11–14 hours', naps: '1–2 naps daily', night: '10–12 hours' }
  if (ageMonths < 36) return { label: '18 months – 3 years', total: '11–14 hours', naps: '1 nap (1–2 hours)', night: '10–12 hours' }
  return { label: '3+ years', total: '10–13 hours', naps: 'optional 1 nap', night: '10–12 hours' }
}

export default function SleepPage() {
  const { baby, ageMonths } = useBaby()
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [activeSleep, setActiveSleep] = useState<SleepEntry | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [sleepType, setSleepType] = useState<'nap' | 'night'>('nap')
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { if (baby) loadEntries() }, [baby])

  useEffect(() => {
    if (activeSleep) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - new Date(activeSleep.started_at).getTime())
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [activeSleep])

  async function loadEntries() {
    if (!baby) return
    const supabase = createClient()
    const { data } = await supabase
      .from('sleeps')
      .select('*')
      .eq('baby_id', baby.id)
      .order('started_at', { ascending: false })
      .limit(20)
    const all = data ?? []
    // Check for active (no ended_at)
    const active = all.find(e => !e.ended_at)
    setActiveSleep(active ?? null)
    if (active) setElapsed(Date.now() - new Date(active.started_at).getTime())
    setEntries(all.filter(e => e.ended_at))
  }

  async function startSleep() {
    if (!baby) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('sleeps')
      .insert({ baby_id: baby.id, type: sleepType, started_at: new Date().toISOString() })
      .select()
      .single()
    setActiveSleep(data)
    setSaving(false)
  }

  async function stopSleep() {
    if (!baby || !activeSleep) return
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('sleeps')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', activeSleep.id)
    setActiveSleep(null)
    setSaving(false)
    loadEntries()
  }

  const formatElapsed = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}h ${m % 60}m`
    return `${m}m ${s % 60}s`
  }

  const todayTotal = entries
    .filter(e => {
      const d = new Date(e.started_at)
      const today = new Date()
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth()
    })
    .reduce((sum, e) => {
      if (!e.ended_at) return sum
      return sum + (new Date(e.ended_at).getTime() - new Date(e.started_at).getTime())
    }, 0)

  return (
    <div>
      <AppBar title="Sleep" showBack />

      <div style={{ padding: '20px 16px' }}>
        {/* Sleep recommendation card */}
        {(() => {
          const rec = getSleepRecommendation(ageMonths)
          return (
            <div style={{ background: '#EDE9F8', borderRadius: 16, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🌙</span>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#9B8EC4' }}>Recommended sleep · {rec.label}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ background: 'white', borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 90 }}>
                  <p style={{ fontSize: 11, color: '#6B6B7B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Total / day</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#2D2D3A' }}>{rec.total}</p>
                </div>
                <div style={{ background: 'white', borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 90 }}>
                  <p style={{ fontSize: 11, color: '#6B6B7B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Naps</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2D2D3A' }}>{rec.naps}</p>
                </div>
                <div style={{ background: 'white', borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 90 }}>
                  <p style={{ fontSize: 11, color: '#6B6B7B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Night</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2D2D3A' }}>{rec.night}</p>
                </div>
              </div>
              <p style={{ fontSize: 11, color: '#9B8EC4', marginTop: 8, fontStyle: 'italic' }}>Source: WHO · AAP · IAP — always consult your paediatrician</p>
            </div>
          )
        })()}

        {/* Active sleep timer */}
        {activeSleep ? (
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
            borderRadius: 24, padding: 28, textAlign: 'center', marginBottom: 20,
          }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>😴</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#3B82F6', marginBottom: 8 }}>
              {activeSleep.type === 'night' ? 'Night sleep' : 'Napping'}…
            </p>
            <p style={{ fontSize: 52, fontWeight: 800, color: '#1E40AF', letterSpacing: '-0.02em' }}>
              {formatElapsed(elapsed)}
            </p>
            <p style={{ fontSize: 13, color: '#6B6B7B', marginTop: 8 }}>
              Started at {formatTime(activeSleep.started_at)}
            </p>
            <button
              onClick={stopSleep}
              disabled={saving}
              style={{
                background: '#3B82F6', color: 'white', border: 'none', borderRadius: 14,
                padding: '14px 32px', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', marginTop: 20, fontFamily: 'inherit',
              }}
            >
              Wake Up ☀️
            </button>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 24, padding: 24, textAlign: 'center',
            border: '1.5px solid #EBEBF0', marginBottom: 20,
          }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>☀️</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#2D2D3A', marginBottom: 16 }}>
              {baby?.name ?? 'Baby'} is awake
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {(['nap', 'night'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setSleepType(t)}
                  className={`pill-tab ${sleepType === t ? 'active' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {t === 'nap' ? '🌤️ Nap' : '🌙 Night'}
                </button>
              ))}
            </div>
            <button
              onClick={startSleep}
              disabled={saving}
              style={{
                background: '#9B8EC4', color: 'white', border: 'none', borderRadius: 14,
                padding: '14px 32px', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', width: '100%',
              }}
            >
              Start Sleep Timer 😴
            </button>
          </div>
        )}

        {/* Today summary */}
        {todayTotal > 0 && (
          <div style={{ background: '#EDE9F8', borderRadius: 14, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#9B8EC4' }}>Today&apos;s sleep</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#2D2D3A' }}>{durationDisplay(new Date(Date.now() - todayTotal).toISOString(), new Date().toISOString())}</span>
          </div>
        )}

        {/* History */}
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#2D2D3A', marginBottom: 12 }}>Recent Sleep</h2>
        {entries.length === 0 ? (
          <p style={{ color: '#6B6B7B', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No sleep logged yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {entries.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F5F7' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#93C5FD33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {entry.type === 'night' ? '🌙' : '😴'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2D2D3A' }}>
                    {entry.type === 'night' ? 'Night sleep' : 'Nap'} · {entry.ended_at ? durationDisplay(entry.started_at, entry.ended_at) : '—'}
                  </p>
                  <p style={{ fontSize: 12, color: '#6B6B7B', marginTop: 1 }}>
                    {formatDate(entry.started_at)} · {formatTime(entry.started_at)}
                    {entry.ended_at ? ` → ${formatTime(entry.ended_at)}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
