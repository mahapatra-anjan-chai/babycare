export interface VaccineEntry {
  ageDays: number
  ageLabel: string
  vaccines: string[]
}

export const IAP_VACCINE_SCHEDULE: VaccineEntry[] = [
  { ageDays: 0,    ageLabel: 'At Birth',    vaccines: ['BCG', 'Hepatitis B (dose 1)', 'OPV 0'] },
  { ageDays: 42,   ageLabel: '6 weeks',     vaccines: ['DTwP 1', 'IPV 1', 'Hib 1', 'Hepatitis B 2', 'PCV 1', 'Rotavirus 1'] },
  { ageDays: 70,   ageLabel: '10 weeks',    vaccines: ['DTwP 2', 'IPV 2', 'Hib 2', 'Rotavirus 2'] },
  { ageDays: 98,   ageLabel: '14 weeks',    vaccines: ['DTwP 3', 'IPV 3', 'Hib 3', 'PCV 2', 'Rotavirus 3'] },
  { ageDays: 180,  ageLabel: '6 months',    vaccines: ['OPV 2', 'Hepatitis B 3'] },
  { ageDays: 274,  ageLabel: '9 months',    vaccines: ['MMR 1', 'OPV 3', 'Typhoid conjugate', 'JE (endemic areas)'] },
  { ageDays: 365,  ageLabel: '12 months',   vaccines: ['PCV Booster', 'Hepatitis A 1'] },
  { ageDays: 456,  ageLabel: '15 months',   vaccines: ['MMR 2', 'Varicella 1'] },
  { ageDays: 547,  ageLabel: '18 months',   vaccines: ['DTwP Booster 1', 'IPV Booster', 'Hib Booster'] },
  { ageDays: 730,  ageLabel: '2 years',     vaccines: ['Hepatitis A 2', 'Typhoid Booster'] },
  { ageDays: 1460, ageLabel: '4–6 years',   vaccines: ['DTwP Booster 2', 'OPV Booster', 'MMR 3', 'Varicella 2'] },
]

export interface ScheduledVaccine {
  ageDays: number
  ageLabel: string
  vaccineName: string
  scheduledDate: string
  daysUntilDue: number
  status: 'upcoming' | 'due_soon' | 'overdue' | 'done' | 'snoozed'
}

export function computeVaccineSchedule(birthDate: string): ScheduledVaccine[] {
  const birth = new Date(birthDate)
  const now = new Date()
  const result: ScheduledVaccine[] = []

  for (const entry of IAP_VACCINE_SCHEDULE) {
    const scheduledDate = new Date(birth.getTime() + entry.ageDays * 86400000)
    const daysUntilDue = Math.ceil((scheduledDate.getTime() - now.getTime()) / 86400000)

    let status: ScheduledVaccine['status']
    if (daysUntilDue < 0) status = 'overdue'
    else if (daysUntilDue <= 7) status = 'due_soon'
    else status = 'upcoming'

    for (const vaccineName of entry.vaccines) {
      result.push({
        ageDays: entry.ageDays,
        ageLabel: entry.ageLabel,
        vaccineName,
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        daysUntilDue,
        status,
      })
    }
  }

  return result
}
