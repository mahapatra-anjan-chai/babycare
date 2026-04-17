import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { getAgeDisplay } from '@/lib/utils'

interface ShareToken {
  baby_id: string
  show_feeding: boolean
  show_sleep: boolean
  show_diapers: boolean
  show_milestones: boolean
  show_growth: boolean
  is_active: boolean
  babies: {
    name: string
    date_of_birth: string | null
    gender: string
    parent1_name: string
    parent2_name: string | null
  }
}

export default async function GrandparentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServerSupabaseClient()

  const { data: share } = await supabase
    .from('share_tokens')
    .select('*, babies(*)')
    .eq('token', token)
    .eq('is_active', true)
    .single() as { data: ShareToken | null }

  if (!share) notFound()

  const baby = share.babies
  const babyAge = baby.date_of_birth ? getAgeDisplay(baby.date_of_birth) : ''

  // Load today's data
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()

  const [feedRes, sleepRes, diaperRes, milestoneRes, growthRes] = await Promise.all([
    share.show_feeding ? supabase.from('feedings').select('*').eq('baby_id', share.baby_id).gte('logged_at', startOfDay) : { data: [] },
    share.show_sleep ? supabase.from('sleeps').select('*').eq('baby_id', share.baby_id).gte('started_at', startOfDay) : { data: [] },
    share.show_diapers ? supabase.from('diapers').select('*').eq('baby_id', share.baby_id).gte('logged_at', startOfDay) : { data: [] },
    share.show_milestones ? supabase.from('milestones').select('title, achieved_at').eq('baby_id', share.baby_id).order('achieved_at', { ascending: false }).limit(3) : { data: [] },
    share.show_growth ? supabase.from('growth_records').select('weight_kg, height_cm, measured_at').eq('baby_id', share.baby_id).order('measured_at', { ascending: false }).limit(1) : { data: [] },
  ])

  const feeds = feedRes.data ?? []
  const sleeps = (sleepRes.data ?? []) as Array<{ started_at: string; ended_at: string | null }>
  const diapers = diaperRes.data ?? []
  const milestones = (milestoneRes.data ?? []) as Array<{ title: string }>
  const growth = (growthRes.data ?? []) as Array<{ weight_kg: number; height_cm: number }>

  const totalSleepHrs = sleeps.reduce((sum: number, s) => {
    if (!s.ended_at) return sum
    return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 3600000
  }, 0)

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100dvh',
      background: 'linear-gradient(160deg, #EDE9F8 0%, #FAFAF8 100%)',
      padding: '40px 24px',
      fontFamily: "'Nunito', sans-serif",
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>{baby.gender === 'girl' ? '👧' : baby.gender === 'boy' ? '👦' : '👶'}</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#2D2D3A' }}>{baby.name}</h1>
        <p style={{ fontSize: 15, color: '#6B6B7B', marginTop: 6 }}>{babyAge}</p>
      </div>

      {/* Last 24h */}
      <div style={{ background: 'white', borderRadius: 24, padding: 24, marginBottom: 16, border: '1.5px solid #EBEBF0' }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#9B8EC4', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last 24 hours</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {share.show_feeding && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 4 }}>🍼</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#2D2D3A' }}>{feeds.length}</p>
              <p style={{ fontSize: 11, color: '#6B6B7B', fontWeight: 700 }}>feeds</p>
            </div>
          )}
          {share.show_sleep && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 4 }}>😴</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#2D2D3A' }}>{totalSleepHrs.toFixed(1)}h</p>
              <p style={{ fontSize: 11, color: '#6B6B7B', fontWeight: 700 }}>sleep</p>
            </div>
          )}
          {share.show_diapers && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 4 }}>💧</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#2D2D3A' }}>{diapers.length}</p>
              <p style={{ fontSize: 11, color: '#6B6B7B', fontWeight: 700 }}>diapers</p>
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      {share.show_milestones && milestones.length > 0 && (
        <div style={{ background: 'white', borderRadius: 24, padding: 24, marginBottom: 16, border: '1.5px solid #EBEBF0' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#9B8EC4', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Milestones</h2>
          {milestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < milestones.length - 1 ? '1px solid #F5F5F7' : 'none' }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2D2D3A' }}>{m.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Growth */}
      {share.show_growth && growth.length > 0 && (
        <div style={{ background: 'white', borderRadius: 24, padding: 24, marginBottom: 16, border: '1.5px solid #EBEBF0' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#9B8EC4', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Growth</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#2D2D3A' }}>{growth[0].weight_kg}kg</p>
              <p style={{ fontSize: 12, color: '#6B6B7B', fontWeight: 700 }}>Weight</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#2D2D3A' }}>{growth[0].height_cm}cm</p>
              <p style={{ fontSize: 12, color: '#6B6B7B', fontWeight: 700 }}>Height</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#9B8EC4', marginTop: 24, fontStyle: 'italic' }}>
        Shared by {baby.parent1_name}{baby.parent2_name ? ` & ${baby.parent2_name}` : ''} 💜<br />
        <span style={{ fontSize: 11, color: '#EBEBF0' }}>babycare · every little moment</span>
      </p>
    </div>
  )
}
