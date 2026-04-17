import { NextRequest, NextResponse } from 'next/server'
import { generateProductRecommendations } from '@/lib/gemini'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { babyId, babyName, gender, ageMonths, category } = await req.json()

    // Check cache (by baby, month, category)
    try {
      const supabase = await createServerSupabaseClient()
      const { data } = await supabase
        .from('product_cache')
        .select('products, created_at')
        .eq('baby_id', babyId)
        .eq('age_month', ageMonths)
        .eq('category', category)
        .single()

      if (data?.products) {
        const ageMs = Date.now() - new Date(data.created_at).getTime()
        if (ageMs < 30 * 86400000) { // cache valid 30 days (products don't change monthly)
          return NextResponse.json({ products: data.products, cached: true })
        }
      }
    } catch { /* cache miss, continue */ }

    const products = await generateProductRecommendations(babyName, gender, ageMonths, category)

    // Cache result
    try {
      const supabase = await createServerSupabaseClient()
      await supabase.from('product_cache').upsert({
        baby_id: babyId,
        age_month: ageMonths,
        category,
        products,
        created_at: new Date().toISOString(),
      }, { onConflict: 'baby_id,age_month,category' })
    } catch { /* non-fatal */ }

    return NextResponse.json({ products })
  } catch (err) {
    console.error('Products API error:', err)
    return NextResponse.json({ error: 'Failed to generate products' }, { status: 500 })
  }
}
