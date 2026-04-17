'use client'

import { useState, useEffect } from 'react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { createClient } from '@/lib/supabase'
import { CareTip } from '@/lib/gemini'
import { RefreshCw } from 'lucide-react'

export default function TipsPage() {
  const { baby, ageWeeks, avgFeedsPerDay, avgSleepHoursPerDay, avgDiapersPerDay, lastFeedType, latestWeight } = useBaby()
  const [tips, setTips] = useState<CareTip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)

  useEffect(() => { if (baby) loadTips() }, [baby])

  async function loadTips(force = false) {
    if (!baby) return
    setLoading(true)
    setError('')

    // Check Supabase cache first
    if (!force) {
      const supabase = createClient()
      const { data } = await supabase
        .from('tip_cache')
        .select('tips, created_at')
        .eq('baby_id', baby.id)
        .eq('age_week', ageWeeks)
        .single()

      if (data?.tips) {
        // Cache valid for 24h
        const age = Date.now() - new Date(data.created_at).getTime()
        if (age < 86400000) {
          setTips(data.tips as CareTip[])
          setCached(true)
          setLoading(false)
          return
        }
      }
    }

    // Generate fresh via API route
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId: baby.id,
          babyName: baby.name,
          gender: baby.gender,
          ageWeeks,
          avgFeedsPerDay,
          avgSleepHoursPerDay,
          avgDiapersPerDay,
          lastFeedType,
          latestWeight,
        }),
      })
      const json = await res.json()
      if (json.tips) {
        setTips(json.tips)
        setCached(false)
      } else {
        setError('Could not generate tips. Please try again.')
      }
    } catch {
      setError('Network error. Check your connection.')
    }
    setLoading(false)
  }

  const sourceColors: Record<string, string> = {
    'WHO': '#3B82F6',
    'IAP': '#9B8EC4',
    'Mayo Clinic': '#059669',
    'NHS': '#0EA5E9',
    'AAP': '#F59E0B',
    'Cleveland Clinic': '#8B5CF6',
  }

  return (
    <div>
      <AppBar
        title={`Tips for ${ageWeeks}w`}
        showBack
        rightElement={
          <button
            onClick={() => loadTips(true)}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <RefreshCw size={18} color="#9B8EC4" style={{ opacity: loading ? 0.4 : 1, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        }
      />

      <div style={{ padding: '16px 16px' }}>
        {cached && (
          <div style={{ background: '#EDE9F8', borderRadius: 10, padding: '8px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#9B8EC4', fontWeight: 600 }}>Cached · refreshes daily</span>
            <button onClick={() => loadTips(true)} style={{ fontSize: 12, color: '#9B8EC4', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Refresh now</button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>✨</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#9B8EC4' }}>Generating personalised tips…</p>
            <p style={{ fontSize: 13, color: '#6B6B7B', marginTop: 6 }}>Powered by Gemini AI · Free tier</p>
          </div>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 14, padding: 16, textAlign: 'center' }}>
            <p style={{ color: '#DC2626', fontWeight: 600, fontSize: 14 }}>{error}</p>
            <button onClick={() => loadTips()} style={{ marginTop: 12, color: '#9B8EC4', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Try again</button>
          </div>
        )}

        {tips.map((tip, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 20, padding: 20, border: '1.5px solid #EBEBF0', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{tip.icon ?? '💡'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#9B8EC4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tip.category}</p>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: (sourceColors[tip.source] ?? '#6B6B7B') + '22',
                    color: sourceColors[tip.source] ?? '#6B6B7B',
                  }}>
                    {tip.source}
                  </span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#2D2D3A', marginBottom: 8, lineHeight: 1.3 }}>{tip.tip}</p>
                <p style={{ fontSize: 13, color: '#6B6B7B', lineHeight: 1.5 }}>{tip.detail}</p>
                <p style={{ fontSize: 11, color: '#9B8EC4', marginTop: 10, fontStyle: 'italic', lineHeight: 1.4 }}>{tip.disclaimer}</p>
              </div>
            </div>
          </div>
        ))}

        {!loading && tips.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 32 }}>💡</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#2D2D3A', marginTop: 12 }}>No tips yet</p>
            <button
              onClick={() => loadTips()}
              style={{ marginTop: 16, background: '#9B8EC4', color: 'white', border: 'none', borderRadius: 14, padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Generate Tips ✨
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
