import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user has a baby profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: baby } = await supabase
        .from('babies')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!baby) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
