export interface Milestone {
  id: string
  title: string
  category: 'motor' | 'social' | 'language' | 'cognitive'
  ageGroupLabel: string
  ageGroupMin: number  // months
  ageGroupMax: number  // months
}

export const MILESTONE_DATA: Milestone[] = [
  // 0–3 months
  { id: 'm1',  title: 'Holds head up briefly when on tummy', category: 'motor',    ageGroupLabel: '0–3m', ageGroupMin: 0, ageGroupMax: 3 },
  { id: 'm2',  title: 'Tracks moving objects with eyes',     category: 'motor',    ageGroupLabel: '0–3m', ageGroupMin: 0, ageGroupMax: 3 },
  { id: 'm3',  title: 'Smiles responsively at faces',        category: 'social',   ageGroupLabel: '0–3m', ageGroupMin: 0, ageGroupMax: 3 },
  { id: 'm4',  title: 'Coos and makes gurgling sounds',      category: 'language', ageGroupLabel: '0–3m', ageGroupMin: 0, ageGroupMax: 3 },
  { id: 'm5',  title: 'Recognises parent voices',            category: 'cognitive',ageGroupLabel: '0–3m', ageGroupMin: 0, ageGroupMax: 3 },
  // 3–6 months
  { id: 'm6',  title: 'Rolls from front to back',            category: 'motor',    ageGroupLabel: '3–6m', ageGroupMin: 3, ageGroupMax: 6 },
  { id: 'm7',  title: 'Reaches for objects',                 category: 'motor',    ageGroupLabel: '3–6m', ageGroupMin: 3, ageGroupMax: 6 },
  { id: 'm8',  title: 'Laughs out loud',                     category: 'social',   ageGroupLabel: '3–6m', ageGroupMin: 3, ageGroupMax: 6 },
  { id: 'm9',  title: 'Babbles (ba-ba, da-da)',              category: 'language', ageGroupLabel: '3–6m', ageGroupMin: 3, ageGroupMax: 6 },
  { id: 'm10', title: 'Recognises familiar faces',           category: 'cognitive',ageGroupLabel: '3–6m', ageGroupMin: 3, ageGroupMax: 6 },
  // 6–9 months
  { id: 'm11', title: 'Sits without support',                category: 'motor',    ageGroupLabel: '6–9m', ageGroupMin: 6, ageGroupMax: 9 },
  { id: 'm12', title: 'Transfers objects hand to hand',      category: 'motor',    ageGroupLabel: '6–9m', ageGroupMin: 6, ageGroupMax: 9 },
  { id: 'm13', title: 'Responds to own name',                category: 'social',   ageGroupLabel: '6–9m', ageGroupMin: 6, ageGroupMax: 9 },
  { id: 'm14', title: 'Imitates sounds',                     category: 'language', ageGroupLabel: '6–9m', ageGroupMin: 6, ageGroupMax: 9 },
  { id: 'm15', title: 'Understands object permanence',       category: 'cognitive',ageGroupLabel: '6–9m', ageGroupMin: 6, ageGroupMax: 9 },
  // 9–12 months
  { id: 'm16', title: 'Crawls on hands and knees',           category: 'motor',    ageGroupLabel: '9–12m', ageGroupMin: 9, ageGroupMax: 12 },
  { id: 'm17', title: 'Pulls to stand',                      category: 'motor',    ageGroupLabel: '9–12m', ageGroupMin: 9, ageGroupMax: 12 },
  { id: 'm18', title: 'Waves bye-bye',                       category: 'social',   ageGroupLabel: '9–12m', ageGroupMin: 9, ageGroupMax: 12 },
  { id: 'm19', title: 'Says mama/dada with meaning',         category: 'language', ageGroupLabel: '9–12m', ageGroupMin: 9, ageGroupMax: 12 },
  { id: 'm20', title: 'Points to desired objects',           category: 'cognitive',ageGroupLabel: '9–12m', ageGroupMin: 9, ageGroupMax: 12 },
]

export const AGE_GROUPS = ['0–3m', '3–6m', '6–9m', '9–12m']

export function getMilestonesForAgeGroup(ageGroupLabel: string): Milestone[] {
  return MILESTONE_DATA.filter(m => m.ageGroupLabel === ageGroupLabel)
}

export function getCurrentAgeGroup(ageMonths: number): string {
  if (ageMonths < 3) return '0–3m'
  if (ageMonths < 6) return '3–6m'
  if (ageMonths < 9) return '6–9m'
  return '9–12m'
}
