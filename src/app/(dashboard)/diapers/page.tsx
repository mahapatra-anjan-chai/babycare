'use client'

import { useState, useEffect } from 'react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { createClient } from '@/lib/supabase'
import { formatTime, formatDate } from '@/lib/utils'

interface DiaperEntry {
  id: string
  type: 'wet' | 'dirty' | 'both'
  logged_at: string
  notes: string | null
}

export default function DiapersPage() {
  const { baby } = useBaby()
  const [entries, setEntries] = useState<DiaperEntry[]>([])
  const [lastLogged, setLastLogged] = useState<string | null>(null)

  useEffect(() => { if (baby) loadEntries() }, [baby])

  async function loadEntries() {
    if (!baby) return
    const supabase = createClient()
    const { data } = await supabase
      .from('diapers')
      .select('*')
      .eq('baby_id', baby.id)
      .order('logged_at', { ascending: false })
      .limit(20)
    setEntries(data ?? [])
  }

  async function logDiaper(type: 'wet' | 'dirty' | 'both') {
    if (!baby) return
    const supabase = createClient()
    await supabase.from('diapers').insert({ baby_id: baby.id, type, logged_at: new Date().toISOString() })
    setLastLogged(type)
    setTimeout(() => setLastLogged(null), 2000)
    loadEntries()
  }

  const todayEntries = entries.filter(e => {
    const d = new Date(e.logged_at)
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth()
  })

  const wetCount = todayEntries.filter(e => e.type === 'wet' || e.type === 'both').length
  const dirtyCount = todayEntries.filter(e => e.type === 'dirty' || e.type === 'both').length

  return (
    <div>
      <AppBar title="Diaper Log" showBack />

      <div style={{ padding: '20px 16px' }}>
        {/* Big tap buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <TapButton
            emoji="💧"
            label="Wet"
            color="#93C5FD"
            active={lastLogged === 'wet'}
            onClick={() => logDiaper('wet')}
          />
          <TapButton
            emoji="💩"
            label="Dirty"
            color="#86EFAC"
            active={lastLogged === 'dirty'}
            onClick={() => logDiaper('dirty')}
          />
        </div>
        <TapButton
          emoji="💧💩"
          label="Both"
          color="#FCD34D"
          active={lastLogged === 'both'}
          onClick={() => logDiaper('both')}
          wide
        />

        {/* Today summary */}
        {todayEntries.length > 0 && (
          <div style={{ background: '#EDE9F8', borderRadius: 14, padding: '14px 16px', margin: '20px 0', display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#2D2D3A' }}>{wetCount}</p>
              <p style={{ fontSize: 12, color: '#6B6B7B', fontWeight: 700 }}>Wet 💧</p>
            </div>
            <div style={{ width: 1, background: '#EBEBF0' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#2D2D3A' }}>{dirtyCount}</p>
              <p style={{ fontSize: 12, color: '#6B6B7B', fontWeight: 700 }}>Dirty 💩</p>
            </div>
            <div style={{ width: 1, background: '#EBEBF0' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#2D2D3A' }}>{todayEntries.length}</p>
              <p style={{ fontSize: 12, color: '#6B6B7B', fontWeight: 700 }}>Total</p>
            </div>
          </div>
        )}

        {/* History */}
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#2D2D3A', marginBottom: 12 }}>Recent</h2>
        {entries.length === 0 ? (
          <p style={{ color: '#6B6B7B', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No diapers logged yet — tap above to log!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {entries.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F5F7' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: entry.type === 'wet' ? '#93C5FD33' : entry.type === 'dirty' ? '#86EFAC33' : '#FCD34D33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {entry.type === 'wet' ? '💧' : entry.type === 'dirty' ? '💩' : '💧💩'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2D2D3A', textTransform: 'capitalize' }}>{entry.type}</p>
                  <p style={{ fontSize: 12, color: '#6B6B7B', marginTop: 1 }}>
                    {formatDate(entry.logged_at)} · {formatTime(entry.logged_at)}
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

function TapButton({ emoji, label, color, active, onClick, wide }: {
  emoji: string; label: string; color: string; active: boolean; onClick: () => void; wide?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? color + 'CC' : color + '22',
        border: `2px solid ${color}${active ? 'FF' : '66'}`,
        borderRadius: 20, padding: '24px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor: 'pointer', fontFamily: 'inherit',
        transform: active ? 'scale(0.97)' : 'scale(1)',
        transition: 'all 0.15s',
        ...(wide ? { gridColumn: '1 / -1', flexDirection: 'row', justifyContent: 'center', padding: '18px 16px' } : {}),
      }}
    >
      <span style={{ fontSize: 36 }}>{emoji}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color: '#2D2D3A' }}>
        {active ? '✓ Logged!' : label}
      </span>
    </button>
  )
}
