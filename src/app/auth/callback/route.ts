import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const ALLOWED_EMAILS = [
  'mahapatra.anjan@gmail.com',
  'sonakshi.sahu@gmail.com',
]

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = await createServerSupabaseClient()
  await supabase.auth.exchangeCodeForSession(code)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Block anyone outside the allowlist
  if (!ALLOWED_EMAILS.includes(user.email ?? '')) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=unauthorized`)
  }

  // Link this user's Supabase user_id to their email row in baby_access
  // (on first sign-in user_id is null — this sets it so they can access shared baby data)
  await supabase
    .from('baby_access')
    .update({ user_id: user.id })
    .eq('email', user.email)

  // Check if a baby is already linked to their email
  const { data: access } = await supabase
    .from('baby_access')
    .select('baby_id')
    .eq('email', user.email)
    .single()

  if (!access?.baby_id) {
    // First person to sign in — needs to do onboarding
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  // Baby already exists (either they've been here before, or partner already onboarded)
  return NextResponse.redirect(`${origin}/`)
}
