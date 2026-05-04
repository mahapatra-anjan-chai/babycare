'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase'
import { getAgeInWeeks, getAgeInMonths, getWeeksUntilDue, getWeeksPregnant } from '@/lib/utils'

export interface Baby {
  id: string
  user_id: string
  name: string
  date_of_birth: string | null
  due_date: string | null
  gender: 'boy' | 'girl' | 'unknown'
  status: 'born' | 'expecting'
  parent1_name: string
  parent2_name: string | null
  photo_url: string | null
  created_at: string
}

export interface BabyContextValue {
  baby: Baby | null
  loading: boolean
  ageWeeks: number
  ageMonths: number
  weeksUntilDue: number
  weeksPregnant: number
  avgFeedsPerDay: number
  avgSleepHoursPerDay: number
  avgDiapersPerDay: number
  lastFeedType: 'breast' | 'bottle' | 'solid'
  lastMilestoneAchieved: string | null
  latestWeight: number | null
  latestHeight: number | null
  refreshBaby: () => Promise<void>
}

const BabyContext = createContext<BabyContextValue>({
  baby: null,
  loading: true,
  ageWeeks: 0,
  ageMonths: 0,
  weeksUntilDue: 0,
  weeksPregnant: 0,
  avgFeedsPerDay: 0,
  avgSleepHoursPerDay: 0,
  avgDiapersPerDay: 0,
  lastFeedType: 'bottle',
  lastMilestoneAchieved: null,
  latestWeight: null,
  latestHeight: null,
  refreshBaby: async () => {},
})

// Routes where BabyContext should never redirect (handled by middleware or the page itself)
const PUBLIC_PATHS = ['/login', '/onboarding', '/auth', '/baby']

export function BabyProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [baby, setBaby] = useState<Baby | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    avgFeedsPerDay: 0,
    avgSleepHoursPerDay: 0,
    avgDiapersPerDay: 0,
    lastFeedType: 'bottle' as 'breast' | 'bottle' | 'solid',
    lastMilestoneAchieved: null as string | null,
    latestWeight: null as number | null,
    latestHeight: null as number | null,
  })

  async function loadBaby() {
    setLoading(true)
    // Demo mode — no Supabase configured yet
    if (!isSupabaseConfigured) {
      setBaby({
        id: 'demo',
        user_id: 'demo',
        name: 'Sonakshi',
        date_of_birth: new Date(Date.now() - 98 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        due_date: null,
        gender: 'girl',
        status: 'born',
        parent1_name: 'Priya',
        parent2_name: 'Rahul',
        photo_url: null,
        created_at: new Date().toISOString(),
      })
      setStats({
        avgFeedsPerDay: 6.2,
        avgSleepHoursPerDay: 9.1,
        avgDiapersPerDay: 5.8,
        lastFeedType: 'bottle',
        lastMilestoneAchieved: 'Smiles responsively at faces',
        latestWeight: 5.4,
        latestHeight: 61,
      })
      setLoading(false)
      return
    }
    const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      if (!isPublicPath) router.push('/login')
      return
    }

    // Load baby via baby_access (supports shared baby between two users)
    const { data: access } = await supabase
      .from('baby_access')
      .select('baby_id')
      .eq('user_id', user.id)
      .single()

    if (!access?.baby_id) {
      setLoading(false)
      if (!isPublicPath) router.push('/onboarding')
      return
    }

    const { data: babyData } = await supabase
      .from('babies')
      .select('*')
      .eq('id', access.baby_id)
      .single()

    if (!babyData) {
      setLoading(false)
      if (!isPublicPath) router.push('/onboarding')
      return
    }
    setBaby(babyData)

    // Load 7-day averages in parallel
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const [feedRes, sleepRes, diaperRes, growthRes, milestoneRes] = await Promise.all([
      supabase.from('feedings').select('type, logged_at').eq('baby_id', babyData.id).gte('logged_at', sevenDaysAgo),
      supabase.from('sleeps').select('started_at, ended_at').eq('baby_id', babyData.id).gte('started_at', sevenDaysAgo),
      supabase.from('diapers').select('logged_at').eq('baby_id', babyData.id).gte('logged_at', sevenDaysAgo),
      supabase.from('growth_records').select('weight_kg, height_cm').eq('baby_id', babyData.id).order('measured_at', { ascending: false }).limit(1),
      supabase.from('milestones').select('title').eq('baby_id', babyData.id).order('achieved_at', { ascending: false }).limit(1),
    ])

    const avgFeedsPerDay = (feedRes.data?.length ?? 0) / 7
    const totalSleepMs = sleepRes.data?.reduce((sum, s) => {
      if (!s.ended_at) return sum
      return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime())
    }, 0) ?? 0
    const avgSleepHoursPerDay = (totalSleepMs / 1000 / 3600) / 7
    const avgDiapersPerDay = (diaperRes.data?.length ?? 0) / 7
    const lastFeed = feedRes.data?.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0]

    setStats({
      avgFeedsPerDay: Math.round(avgFeedsPerDay * 10) / 10,
      avgSleepHoursPerDay: Math.round(avgSleepHoursPerDay * 10) / 10,
      avgDiapersPerDay: Math.round(avgDiapersPerDay * 10) / 10,
      lastFeedType: (lastFeed?.type as 'breast' | 'bottle' | 'solid') ?? 'bottle',
      lastMilestoneAchieved: milestoneRes.data?.[0]?.title ?? null,
      latestWeight: growthRes.data?.[0]?.weight_kg ?? null,
      latestHeight: growthRes.data?.[0]?.height_cm ?? null,
    })
    setLoading(false)
  }

  useEffect(() => { loadBaby() }, [])

  const ageWeeks = baby?.date_of_birth ? getAgeInWeeks(baby.date_of_birth) : 0
  const ageMonths = baby?.date_of_birth ? getAgeInMonths(baby.date_of_birth) : 0
  const weeksUntilDue = baby?.due_date ? getWeeksUntilDue(baby.due_date) : 0
  const weeksPregnant = baby?.due_date ? getWeeksPregnant(baby.due_date) : 0

  return (
    <BabyContext.Provider value={{
      baby, loading, ageWeeks, ageMonths,
      weeksUntilDue, weeksPregnant,
      ...stats,
      refreshBaby: loadBaby,
    }}>
      {children}
    </BabyContext.Provider>
  )
}

export function useBaby() {
  return useContext(BabyContext)
}
