'use client'

import { useState, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { createClient } from '@/lib/supabase'
import { formatTime, formatDate } from '@/lib/utils'

type FeedType = 'breast' | 'bottle' | 'solid'
type BreastSide = 'left' | 'right' | 'both'

interface FeedEntry {
  id: string
  type: FeedType
  amount_ml: number | null
  duration_mins: number | null
  side: BreastSide | null
  food_note: string | null
  logged_at: string
}

interface FeedRecommendation {
  label: string
  feeds: string
  bottle: string
  breast: string
  solids: string | null
}

function getFeedRecommendation(ageMonths: number): FeedRecommendation {
  if (ageMonths < 1)  return { label: 'Newborn (0–1m)',   feeds: '8–12 times/day',  bottle: '60–90ml per feed',    breast: '10–20 min each side',       solids: null }
  if (ageMonths < 2)  return { label: '1–2 months',       feeds: '7–9 times/day',   bottle: '90–120ml per feed',   breast: '10–20 min each side',       solids: null }
  if (ageMonths < 4)  return { label: '2–4 months',       feeds: '6–8 times/day',   bottle: '120–150ml per feed',  breast: '15–20 min each side',       solids: null }
  if (ageMonths < 6)  return { label: '4–6 months',       feeds: '5–7 times/day',   bottle: '150–210ml per feed',  breast: '15–20 min per session',     solids: null }
  if (ageMonths < 8)  return { label: '6–8 months',       feeds: '4–5 times/day',   bottle: '180–240ml per feed',  breast: '10–15 min per session',     solids: '2–3 small meals, start purees' }
  if (ageMonths < 10) return { label: '8–10 months',      feeds: '3–4 times/day',   bottle: '180–240ml per feed',  breast: '10–15 min per session',     solids: '3 meals + 1–2 snacks, soft lumps ok' }
  if (ageMonths < 12) return { label: '10–12 months',     feeds: '3–4 times/day',   bottle: '180–240ml per feed',  breast: '10–15 min per session',     solids: '3 meals + 2 snacks, finger foods' }
  if (ageMonths < 18) return { label: '12–18 months',     feeds: '3–4 times/day',   bottle: '150–180ml (cow\'s milk ok)', breast: 'On demand',           solids: '3 meals + 2–3 snacks' }
  return               { label: '18 months+',             feeds: '3 meals + snacks', bottle: '150–180ml max',      breast: 'On demand if continuing',   solids: '3 meals + 2 snacks, family foods' }
}

export default function FeedingPage() {
  const { baby, ageMonths } = useBaby()
  const [tab, setTab] = useState<FeedType>('bottle')
  const [amount, setAmount] = useState(90)
  const [duration, setDuration] = useState(15)
  const [side, setSide] = useState<BreastSide>('left')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [entries, setEntries] = useState<FeedEntry[]>([])

  useEffect(() => { if (baby) loadEntries() }, [baby])

  async function loadEntries() {
    if (!baby) return
    const supabase = createClient()
    const { data } = await supabase
      .from('feedings')
      .select('*')
      .eq('baby_id', baby.id)
      .order('logged_at', { ascending: false })
      .limit(20)
    setEntries(data ?? [])
  }

  async function saveFeed() {
    if (!baby) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('feedings').insert({
      baby_id: baby.id,
      type: tab,
      amount_ml: tab === 'bottle' ? amount : null,
      duration_mins: tab === 'breast' ? duration : null,
      side: tab === 'breast' ? side : null,
      food_note: tab === 'solid' ? note : null,
      logged_at: new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setNote('')
    setTimeout(() => setSaved(false), 2000)
    loadEntries()
  }

  const todayEntries = entries.filter(e => {
    const today = new Date()
    const d = new Date(e.logged_at)
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth()
  })
  const todayMl = todayEntries.filter(e => e.type === 'bottle').reduce((sum, e) => sum + (e.amount_ml ?? 0), 0)

  return (
    <div>
      <AppBar title="Feeding Log" showBack />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0', overflowX: 'auto' }}>
        {(['bottle', 'breast', 'solid'] as FeedType[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`pill-tab ${tab === t ? 'active' : ''}`}>
            {t === 'bottle' ? '🍼 Bottle' : t === 'breast' ? '🤱 Breast' : '🥣 Solids'}
          </button>
        ))}
      </div>

      {/* Feed recommendation card */}
      {(() => {
        const rec = getFeedRecommendation(ageMonths)
        const tooYoungForSolids = tab === 'solid' && ageMonths < 6
        const tipText = tab === 'bottle' ? rec.bottle : tab === 'breast' ? rec.breast : rec.solids
        const cardBg   = tooYoungForSolids ? '#FEF2F2' : '#FFF7ED'
        const cardBdr  = tooYoungForSolids ? '#FCA5A5' : '#FED7AA'
        const titleClr = tooYoungForSolids ? '#B91C1C' : '#C2410C'
        return (
          <div style={{ background: cardBg, borderRadius: 16, padding: '14px 16px', margin: '14px 16px 0', border: `1.5px solid ${cardBdr}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{tooYoungForSolids ? '⚠️' : '🍼'}</span>
              <p style={{ fontSize: 13, fontWeight: 800, color: titleClr }}>
                {tooYoungForSolids ? 'Not recommended yet' : `Recommended · ${rec.label}`}
              </p>
            </div>

            {tooYoungForSolids ? (
              <p style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.5 }}>
                WHO and IAP recommend exclusive breast or formula feeding until <strong>6 months</strong>. Introducing solids earlier can increase allergy and choking risk.
              </p>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ background: 'white', borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 80 }}>
                  <p style={{ fontSize: 11, color: '#6B6B7B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Frequency</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#2D2D3A' }}>{rec.feeds}</p>
                </div>
                <div style={{ background: 'white', borderRadius: 10, padding: '8px 12px', flex: 2, minWidth: 120 }}>
                  <p style={{ fontSize: 11, color: '#6B6B7B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                    {tab === 'bottle' ? 'Per Bottle' : tab === 'breast' ? 'Duration' : 'What to offer'}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#2D2D3A' }}>{tipText ?? '—'}</p>
                </div>
              </div>
            )}

            <p style={{ fontSize: 11, color: titleClr, marginTop: 8, fontStyle: 'italic' }}>Source: WHO · AAP · IAP — consult your paediatrician</p>
          </div>
        )
      })()}

      {/* Form */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1.5px solid #EBEBF0' }}>
          {tab === 'bottle' && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#6B6B7B', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 8 }}>
                <button
                  onClick={() => setAmount(a => Math.max(10, a - 10))}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: '#EDE9F8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={20} color="#9B8EC4" />
                </button>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: '#2D2D3A' }}>{amount}</span>
                  <span style={{ fontSize: 18, color: '#6B6B7B', marginLeft: 4 }}>ml</span>
                </div>
                <button
                  onClick={() => setAmount(a => Math.min(500, a + 10))}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: '#EDE9F8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={20} color="#9B8EC4" />
                </button>
              </div>
              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                {[60, 90, 120, 150, 180].map(v => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    style={{
                      padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                      background: amount === v ? '#9B8EC4' : '#EDE9F8',
                      color: amount === v ? 'white' : '#9B8EC4',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {v}ml
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'breast' && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#6B6B7B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Side</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['left', 'right', 'both'] as BreastSide[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`pill-tab ${side === s ? 'active' : ''}`}
                    style={{ flex: 1, textTransform: 'capitalize' }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 13, fontWeight: 700, color: '#6B6B7B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <button
                  onClick={() => setDuration(d => Math.max(1, d - 5))}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: '#EDE9F8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={20} color="#9B8EC4" />
                </button>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: '#2D2D3A' }}>{duration}</span>
                  <span style={{ fontSize: 18, color: '#6B6B7B', marginLeft: 4 }}>min</span>
                </div>
                <button
                  onClick={() => setDuration(d => Math.min(120, d + 5))}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: '#EDE9F8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={20} color="#9B8EC4" />
                </button>
              </div>
            </div>
          )}

          {tab === 'solid' && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#6B6B7B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Food Notes</p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Rice cereal, mashed banana..."
                rows={3}
                style={{
                  width: '100%', border: '1.5px solid #EBEBF0', borderRadius: 12,
                  padding: '12px 14px', fontSize: 15, fontFamily: 'inherit',
                  color: '#2D2D3A', background: '#FAFAF8', resize: 'none',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <p style={{ fontSize: 12, color: '#6B6B7B', textAlign: 'center', marginTop: 16 }}>
            🕐 Now · {new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </p>
        </div>

        <button
          onClick={saveFeed}
          disabled={saving}
          style={{
            width: '100%', background: saved ? '#22C55E' : '#9B8EC4', color: 'white',
            border: 'none', borderRadius: 16, padding: '16px', fontSize: 16,
            fontWeight: 700, cursor: 'pointer', marginTop: 16, fontFamily: 'inherit',
            transition: 'background 0.3s',
          }}
        >
          {saved ? '✓ Logged!' : saving ? 'Saving…' : 'Save Feed'}
        </button>
      </div>

      {/* Today summary */}
      {todayEntries.length > 0 && (
        <div style={{ padding: '0 16px 4px' }}>
          <div style={{ background: '#EDE9F8', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#9B8EC4' }}>Today</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#2D2D3A' }}>
              {todayEntries.length} feed{todayEntries.length !== 1 ? 's' : ''}
              {todayMl > 0 ? ` · ${todayMl}ml` : ''}
            </span>
          </div>
        </div>
      )}

      {/* History */}
      <div style={{ padding: '16px 16px 8px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#2D2D3A', marginBottom: 12 }}>Recent</h2>
        {entries.length === 0 ? (
          <p style={{ color: '#6B6B7B', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No feeds logged yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {entries.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F5F7' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#FBBF9133',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {entry.type === 'bottle' ? '🍼' : entry.type === 'breast' ? '🤱' : '🥣'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2D2D3A' }}>
                    {entry.type === 'bottle' ? `Bottle${entry.amount_ml ? ' · ' + entry.amount_ml + 'ml' : ''}`
                      : entry.type === 'breast' ? `Breast (${entry.side})${entry.duration_mins ? ' · ' + entry.duration_mins + 'min' : ''}`
                      : `Solids${entry.food_note ? ' · ' + entry.food_note : ''}`}
                  </p>
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
