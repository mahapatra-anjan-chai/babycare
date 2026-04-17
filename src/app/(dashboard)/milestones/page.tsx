'use client'

import { useState, useEffect } from 'react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { createClient } from '@/lib/supabase'
import { MILESTONE_DATA, AGE_GROUPS, getMilestonesForAgeGroup, getCurrentAgeGroup } from '@/lib/milestones'
import { Check } from 'lucide-react'

export default function MilestonesPage() {
  const { baby, ageMonths } = useBaby()
  const [activeGroup, setActiveGroup] = useState(getCurrentAgeGroup(ageMonths))
  const [achieved, setAchieved] = useState<string[]>([])
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { setActiveGroup(getCurrentAgeGroup(ageMonths)) }, [ageMonths])
  useEffect(() => { if (baby) loadAchieved() }, [baby])

  async function loadAchieved() {
    if (!baby) return
    const supabase = createClient()
    const { data } = await supabase
      .from('milestones')
      .select('title')
      .eq('baby_id', baby.id)
    setAchieved((data ?? []).map((m: { title: string }) => m.title))
  }

  async function toggleMilestone(milestoneTitle: string) {
    if (!baby) return
    setSaving(milestoneTitle)
    const supabase = createClient()

    if (achieved.includes(milestoneTitle)) {
      await supabase.from('milestones').delete().eq('baby_id', baby.id).eq('title', milestoneTitle)
      setAchieved(prev => prev.filter(t => t !== milestoneTitle))
    } else {
      await supabase.from('milestones').insert({
        baby_id: baby.id,
        title: milestoneTitle,
        category: MILESTONE_DATA.find(m => m.title === milestoneTitle)?.category ?? 'motor',
        achieved_at: new Date().toISOString(),
      })
      setAchieved(prev => [...prev, milestoneTitle])
    }
    setSaving(null)
  }

  const milestones = getMilestonesForAgeGroup(activeGroup)
  const categories = ['motor', 'social', 'language', 'cognitive'] as const
  const categoryLabels: Record<string, string> = {
    motor: '🏃 Motor', social: '😊 Social', language: '🗣️ Language', cognitive: '🧠 Cognitive',
  }

  return (
    <div>
      <AppBar title="Milestones" showBack />

      {/* Age group tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px', overflowX: 'auto' }}>
        {AGE_GROUPS.map(group => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`pill-tab ${activeGroup === group ? 'active' : ''}`}
          >
            {group}
            {group === getCurrentAgeGroup(ageMonths) && (
              <span style={{ marginLeft: 4, fontSize: 10 }}>●</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        {categories.map(cat => {
          const catMilestones = milestones.filter(m => m.category === cat)
          if (catMilestones.length === 0) return null
          const catAchieved = catMilestones.filter(m => achieved.includes(m.title)).length
          return (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#2D2D3A' }}>{categoryLabels[cat]}</h3>
                <span style={{ fontSize: 12, color: '#9B8EC4', fontWeight: 700 }}>{catAchieved}/{catMilestones.length}</span>
              </div>
              {catMilestones.map(milestone => {
                const isAchieved = achieved.includes(milestone.title)
                const isSaving = saving === milestone.title
                return (
                  <button
                    key={milestone.id}
                    onClick={() => toggleMilestone(milestone.title)}
                    disabled={!!saving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', padding: '12px 14px', marginBottom: 6,
                      background: isAchieved ? '#EDE9F8' : 'white',
                      border: `1.5px solid ${isAchieved ? '#9B8EC4' : '#EBEBF0'}`,
                      borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'left', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: isAchieved ? '#9B8EC4' : '#EBEBF0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {isAchieved ? <Check size={14} color="white" strokeWidth={3} /> : null}
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 600,
                      color: isAchieved ? '#9B8EC4' : '#2D2D3A',
                      textDecoration: isAchieved ? 'none' : 'none',
                      opacity: isSaving ? 0.5 : 1,
                    }}>
                      {milestone.title}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}

        <p style={{ fontSize: 12, color: '#9B8EC4', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
          Based on IAP developmental guidelines. Always consult your paediatrician.
        </p>
      </div>
    </div>
  )
}
