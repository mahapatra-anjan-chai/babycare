import { NextRequest, NextResponse } from 'next/server'
import { generateCareTips } from '@/lib/gemini'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { babyId, babyName, gender, ageWeeks, avgFeedsPerDay, avgSleepHoursPerDay, avgDiapersPerDay, lastFeedType, latestWeight } = await req.json()

    const tips = await generateCareTips(
      babyName, gender, ageWeeks,
      avgFeedsPerDay, avgSleepHoursPerDay, avgDiapersPerDay,
      lastFeedType, latestWeight
    )

    // Cache in Supabase
    try {
      const supabase = await createServerSupabaseClient()
      await supabase.from('tip_cache').upsert({
        baby_id: babyId,
        age_week: ageWeeks,
        tips,
        created_at: new Date().toISOString(),
      }, { onConflict: 'baby_id,age_week' })
    } catch { /* cache failure is non-fatal */ }

    return NextResponse.json({ tips })
  } catch (err) {
    console.error('Tips API error:', err)
    return NextResponse.json({ error: 'Failed to generate tips' }, { status: 500 })
  }
}
