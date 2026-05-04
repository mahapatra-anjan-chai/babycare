'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { BabycareLogo } from '@/components/layout/AppBar'

type Step = 1 | 2 | 3 | 4
type Status = 'born' | 'expecting'
type Gender = 'boy' | 'girl' | 'unknown'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [status, setStatus] = useState<Status | null>(null)
  const [babyName, setBabyName] = useState('')
  const [gender, setGender] = useState<Gender>('unknown')
  const [birthDate, setBirthDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [parent1, setParent1] = useState('')
  const [parent2, setParent2] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function finish() {
    if (!parent1.trim()) { setError('Please enter your name'); return }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: newBaby, error: insertError } = await supabase.from('babies').insert({
      user_id: user.id,
      name: babyName || (status === 'expecting' ? 'Baby' : 'My Baby'),
      gender,
      status,
      date_of_birth: status === 'born' ? birthDate : null,
      due_date: status === 'expecting' ? dueDate : null,
      parent1_name: parent1.trim(),
      parent2_name: parent2.trim() || null,
    }).select('id').single()

    if (insertError || !newBaby) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
      return
    }

    // Link both allowed email addresses to this baby (security definer bypasses RLS)
    await supabase.rpc('link_baby_to_access', { p_baby_id: newBaby.id })

    router.push('/')
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: '#FAFAF8', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ height: 4, background: '#EBEBF0' }}>
        <div style={{ height: '100%', background: '#9B8EC4', width: `${(step / 4) * 100}%`, transition: 'width 0.3s ease', borderRadius: '0 999px 999px 0' }} />
      </div>

      <div style={{ flex: 1, padding: '32px 24px' }}>
        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <BabycareLogo size={64} />
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#2D2D3A', marginTop: 16 }}>Welcome to babycare 🌸</h1>
              <p style={{ color: '#6B6B7B', fontSize: 15, marginTop: 8 }}>Tell us about your journey</p>
            </div>

            <button
              onClick={() => { setStatus('expecting'); setStep(2) }}
              style={{
                width: '100%', padding: '20px 24px', marginBottom: 14,
                background: status === 'expecting' ? '#EDE9F8' : 'white',
                border: `2px solid ${status === 'expecting' ? '#9B8EC4' : '#EBEBF0'}`,
                borderRadius: 20, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
            >
              <span style={{ fontSize: 36 }}>🤰</span>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#2D2D3A' }}>We&apos;re expecting</p>
                <p style={{ fontSize: 13, color: '#6B6B7B', marginTop: 3 }}>Track your pregnancy journey</p>
              </div>
            </button>

            <button
              onClick={() => { setStatus('born'); setStep(2) }}
              style={{
                width: '100%', padding: '20px 24px',
                background: status === 'born' ? '#EDE9F8' : 'white',
                border: `2px solid ${status === 'born' ? '#9B8EC4' : '#EBEBF0'}`,
                borderRadius: 20, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
            >
              <span style={{ fontSize: 36 }}>👶</span>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#2D2D3A' }}>Baby has arrived</p>
                <p style={{ fontSize: 13, color: '#6B6B7B', marginTop: 3 }}>Start tracking feeds, sleep & more</p>
              </div>
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#2D2D3A', marginBottom: 8 }}>
              {status === 'expecting' ? 'About your baby 🌟' : 'About your baby 👶'}
            </h2>
            <p style={{ color: '#6B6B7B', fontSize: 14, marginBottom: 28 }}>You can always change this later</p>

            <label style={{ fontSize: 13, fontWeight: 700, color: '#2D2D3A', display: 'block', marginBottom: 6 }}>
              Baby&apos;s name {status === 'expecting' ? '(or nickname)' : ''}
            </label>
            <input
              value={babyName}
              onChange={e => setBabyName(e.target.value)}
              placeholder={status === 'expecting' ? 'e.g. Bump, Peanut...' : 'e.g. Sonakshi'}
              style={inputStyle}
            />

            <label style={{ fontSize: 13, fontWeight: 700, color: '#2D2D3A', display: 'block', margin: '20px 0 10px' }}>Gender</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['boy', 'girl', 'unknown'] as Gender[]).map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`pill-tab ${gender === g ? 'active' : ''}`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                >
                  {g === 'boy' ? '👦 Boy' : g === 'girl' ? '👧 Girl' : '🌈 TBD'}
                </button>
              ))}
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, color: '#2D2D3A', display: 'block', margin: '20px 0 6px' }}>
              {status === 'born' ? 'Birth date' : 'Due date'}
            </label>
            <input
              type="date"
              value={status === 'born' ? birthDate : dueDate}
              onChange={e => status === 'born' ? setBirthDate(e.target.value) : setDueDate(e.target.value)}
              max={status === 'born' ? new Date().toISOString().split('T')[0] : undefined}
              min={status === 'expecting' ? new Date().toISOString().split('T')[0] : undefined}
              style={inputStyle}
            />

            <button onClick={() => setStep(3)} style={primaryBtnStyle}>Continue</button>
            <button onClick={() => setStep(1)} style={backBtnStyle}>← Back</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#2D2D3A', marginBottom: 8 }}>Parents&apos; details 💜</h2>
            <p style={{ color: '#6B6B7B', fontSize: 14, marginBottom: 28 }}>Used to personalise your experience</p>

            <label style={{ fontSize: 13, fontWeight: 700, color: '#2D2D3A', display: 'block', marginBottom: 6 }}>Your name *</label>
            <input
              value={parent1}
              onChange={e => setParent1(e.target.value)}
              placeholder="e.g. Priya"
              style={inputStyle}
            />

            <label style={{ fontSize: 13, fontWeight: 700, color: '#2D2D3A', display: 'block', margin: '20px 0 6px' }}>
              Partner&apos;s name <span style={{ color: '#6B6B7B', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              value={parent2}
              onChange={e => setParent2(e.target.value)}
              placeholder="e.g. Rahul"
              style={inputStyle}
            />

            {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{error}</p>}

            <button onClick={() => { if (!parent1.trim()) { setError('Please enter your name'); return }; setError(''); setStep(4) }} style={primaryBtnStyle}>
              Almost there!
            </button>
            <button onClick={() => setStep(2)} style={backBtnStyle}>← Back</button>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', paddingTop: 32 }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>
              {status === 'born' ? '👶' : '🌸'}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#2D2D3A', marginBottom: 12, lineHeight: 1.2 }}>
              {status === 'born'
                ? `Hi ${parent1}${parent2 ? ` & ${parent2}` : ''}!`
                : `Exciting times, ${parent1}!`}
            </h2>
            <p style={{ fontSize: 16, color: '#6B6B7B', marginBottom: 8 }}>
              {babyName ? babyName : 'Your baby'}
              {status === 'born' && birthDate
                ? ` was born ${new Date(birthDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} 💜`
                : status === 'expecting' && dueDate
                ? ` is due ${new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} 🌟`
                : ' is on their way!'}
            </p>
            <p style={{ fontSize: 14, color: '#9B8EC4', fontStyle: 'italic', marginBottom: 40 }}>
              Every little moment, tracked with love.
            </p>

            {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}

            <button onClick={finish} disabled={saving} style={primaryBtnStyle}>
              {saving ? 'Setting up…' : 'Go to Dashboard 🚀'}
            </button>
            <button onClick={() => setStep(3)} style={backBtnStyle}>← Back</button>
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', border: '1.5px solid #EBEBF0',
  borderRadius: 14, fontSize: 16, fontFamily: 'inherit', color: '#2D2D3A',
  background: 'white', outline: 'none', boxSizing: 'border-box',
  marginBottom: 4,
}

const primaryBtnStyle: React.CSSProperties = {
  width: '100%', background: '#9B8EC4', color: 'white', border: 'none',
  borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 700,
  cursor: 'pointer', marginTop: 28, fontFamily: 'inherit',
}

const backBtnStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', color: '#6B6B7B', border: 'none',
  borderRadius: 16, padding: '12px', fontSize: 15, fontWeight: 600,
  cursor: 'pointer', marginTop: 10, fontFamily: 'inherit',
}
