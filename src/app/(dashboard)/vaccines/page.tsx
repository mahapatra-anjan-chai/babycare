'use client'

import { useState, useEffect } from 'react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { createClient } from '@/lib/supabase'
import { computeVaccineSchedule, ScheduledVaccine } from '@/lib/vaccines'
import { Check, Clock, AlertCircle } from 'lucide-react'

type VaccineStatus = 'pending' | 'done' | 'snoozed'

export default function VaccinesPage() {
  const { baby } = useBaby()
  const [schedule, setSchedule] = useState<ScheduledVaccine[]>([])
  const [overrides, setOverrides] = useState<Record<string, VaccineStatus>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (baby?.date_of_birth) {
      setSchedule(computeVaccineSchedule(baby.date_of_birth))
      loadOverrides()
    }
  }, [baby])

  async function loadOverrides() {
    if (!baby) return
    const supabase = createClient()
    const { data } = await supabase
      .from('vaccine_records')
      .select('vaccine_name, status')
      .eq('baby_id', baby.id)
    const map: Record<string, VaccineStatus> = {}
    for (const r of (data ?? [])) map[r.vaccine_name] = r.status
    setOverrides(map)
  }

  async function markVaccine(vaccine: ScheduledVaccine, newStatus: VaccineStatus) {
    if (!baby) return
    setSaving(vaccine.vaccineName)
    const supabase = createClient()
    await supabase.from('vaccine_records').upsert({
      baby_id: baby.id,
      vaccine_name: vaccine.vaccineName,
      scheduled_age_days: vaccine.ageDays,
      scheduled_date: vaccine.scheduledDate,
      status: newStatus,
      given_date: newStatus === 'done' ? new Date().toISOString().split('T')[0] : null,
    }, { onConflict: 'baby_id,vaccine_name' })
    setOverrides(prev => ({ ...prev, [vaccine.vaccineName]: newStatus }))
    setSaving(null)
  }

  // Group by age label
  const grouped: Record<string, ScheduledVaccine[]> = {}
  for (const v of schedule) {
    if (!grouped[v.ageLabel]) grouped[v.ageLabel] = []
    grouped[v.ageLabel].push(v)
  }

  function getEffectiveStatus(v: ScheduledVaccine): VaccineStatus | 'overdue' | 'due_soon' | 'upcoming' {
    if (overrides[v.vaccineName]) return overrides[v.vaccineName]
    return v.status
  }

  function statusStyle(status: string): { bg: string; border: string; color: string; label: string } {
    switch (status) {
      case 'done':     return { bg: '#DCFCE7', border: '#22C55E', color: '#15803D', label: '✓ Done' }
      case 'snoozed':  return { bg: '#FEF9C3', border: '#F59E0B', color: '#92400E', label: '⏸ Snoozed' }
      case 'overdue':  return { bg: '#FEE2E2', border: '#EF4444', color: '#B91C1C', label: '⚠️ Overdue' }
      case 'due_soon': return { bg: '#FEF3C7', border: '#F59E0B', color: '#92400E', label: `Due soon` }
      default:         return { bg: '#F5F5F7', border: '#EBEBF0', color: '#6B6B7B', label: 'Upcoming' }
    }
  }

  return (
    <div>
      <AppBar title="Vaccines & Medicines" showBack />

      <div style={{ padding: '12px 16px' }}>
        <div style={{ background: '#EDE9F8', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 20 }}>💉</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#9B8EC4' }}>ICMR / IAP Schedule</p>
            <p style={{ fontSize: 12, color: '#6B6B7B', marginTop: 2 }}>All vaccines are hardcoded from the official IAP schedule. Always confirm with your paediatrician.</p>
          </div>
        </div>

        {Object.entries(grouped).map(([ageLabel, vaccines]) => {
          const allDone = vaccines.every(v => overrides[v.vaccineName] === 'done')
          const anyUrgent = vaccines.some(v => !overrides[v.vaccineName] && (v.status === 'due_soon' || v.status === 'overdue'))

          return (
            <div key={ageLabel} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: allDone ? '#22C55E' : '#2D2D3A' }}>
                  {ageLabel} {allDone ? '✓' : ''}
                </h3>
                {anyUrgent && !allDone && <AlertCircle size={16} color="#EF4444" />}
                <p style={{ fontSize: 12, color: '#6B6B7B', marginLeft: 'auto' }}>
                  {vaccines[0].scheduledDate}
                </p>
              </div>

              {vaccines.map(vaccine => {
                const status = getEffectiveStatus(vaccine)
                const style = statusStyle(status)
                const isSaving = saving === vaccine.vaccineName
                const isDone = status === 'done'

                return (
                  <div
                    key={vaccine.vaccineName}
                    style={{
                      background: style.bg, border: `1.5px solid ${style.border}`,
                      borderRadius: 14, padding: '12px 14px', marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#2D2D3A' }}>{vaccine.vaccineName}</p>
                        <p style={{ fontSize: 11, color: style.color, fontWeight: 700, marginTop: 3 }}>{style.label}</p>
                        {status === 'due_soon' && <p style={{ fontSize: 11, color: '#92400E' }}>in {vaccine.daysUntilDue} days</p>}
                        {status === 'overdue' && <p style={{ fontSize: 11, color: '#B91C1C' }}>{Math.abs(vaccine.daysUntilDue)} days overdue</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {!isDone && (
                          <button
                            onClick={() => markVaccine(vaccine, 'done')}
                            disabled={!!saving}
                            style={{
                              background: '#22C55E', color: 'white', border: 'none',
                              borderRadius: 10, padding: '6px 12px', fontSize: 12,
                              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: 4,
                              opacity: isSaving ? 0.5 : 1,
                            }}
                          >
                            <Check size={12} />Done
                          </button>
                        )}
                        {isDone && (
                          <button
                            onClick={() => markVaccine(vaccine, 'pending')}
                            disabled={!!saving}
                            style={{
                              background: '#EBEBF0', color: '#6B6B7B', border: 'none',
                              borderRadius: 10, padding: '6px 12px', fontSize: 12,
                              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        <p style={{ fontSize: 11, color: '#9B8EC4', textAlign: 'center', padding: '8px 0 16px', fontStyle: 'italic' }}>
          Source: ICMR · IAP · Always consult your paediatrician
        </p>
      </div>
    </div>
  )
}
