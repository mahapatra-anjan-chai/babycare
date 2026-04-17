'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { BabycareLogo } from '@/components/layout/AppBar'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100dvh',
      background: 'linear-gradient(160deg, #EDE9F8 0%, #FCE7F3 40%, #FAFAF8 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px',
    }}>
      <BabycareLogo size={80} />

      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#2D2D3A', marginTop: 24, textAlign: 'center' }}>
        babycare
      </h1>
      <p style={{ fontSize: 15, color: '#6B6B7B', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
        every little moment
      </p>

      <div style={{ width: '100%', marginTop: 48 }}>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            width: '100%', background: 'white', border: '1.5px solid #EBEBF0',
            borderRadius: 16, padding: '16px 24px', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', color: '#2D2D3A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          {!loading && (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && (
          <p style={{ color: '#EF4444', fontSize: 13, textAlign: 'center', marginTop: 16 }}>{error}</p>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#9B8EC4', textAlign: 'center', marginTop: 32, lineHeight: 1.6 }}>
        Free forever · No credit card required<br />
        All data encrypted · Built with ❤️ for Indian parents
      </p>
    </div>
  )
}
