'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { createClient } from '@/lib/supabase'
import { LogOut, Share2, Copy, Check } from 'lucide-react'

export default function SettingsPage() {
  const { baby, refreshBaby } = useBaby()
  const router = useRouter()
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copied, setCopied] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function generateShareLink() {
    if (!baby) return
    setGeneratingLink(true)
    const supabase = createClient()
    const token = crypto.randomUUID()
    await supabase.from('share_tokens').insert({
      baby_id: baby.id,
      token,
      label: 'Family share link',
      show_feeding: true,
      show_sleep: true,
      show_diapers: true,
      show_milestones: true,
      show_growth: true,
      is_active: true,
    })
    setShareToken(token)
    setGeneratingLink(false)
  }

  function copyLink() {
    if (!shareToken) return
    const url = `${window.location.origin}/baby/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareViaWhatsApp() {
    if (!shareToken) return
    const url = `${window.location.origin}/baby/${shareToken}`
    const text = `Watch ${baby?.name ?? 'our baby'}'s updates on babycare 💜 ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div>
      <AppBar title="Settings" showBack />

      <div style={{ padding: '16px 16px' }}>
        {/* Baby Profile */}
        {baby && (
          <section style={{ marginBottom: 24 }}>
            <SectionHeader title="Baby Profile" />
            <Card>
              <InfoRow label="Name" value={baby.name} />
              <InfoRow label="Status" value={baby.status === 'born' ? '👶 Born' : '🤰 Expecting'} />
              {baby.date_of_birth && <InfoRow label="Birth date" value={new Date(baby.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />}
              {baby.due_date && <InfoRow label="Due date" value={new Date(baby.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />}
              <InfoRow label="Parent 1" value={baby.parent1_name} />
              {baby.parent2_name && <InfoRow label="Parent 2" value={baby.parent2_name} />}
            </Card>
          </section>
        )}

        {/* Share */}
        <section style={{ marginBottom: 24 }}>
          <SectionHeader title="Family Sharing" />
          <Card>
            <p style={{ fontSize: 13, color: '#6B6B7B', lineHeight: 1.5, marginBottom: 16 }}>
              Share a read-only link with grandparents — no login needed. Perfect for WhatsApp!
            </p>

            {!shareToken ? (
              <button
                onClick={generateShareLink}
                disabled={generatingLink}
                style={{
                  width: '100%', background: '#9B8EC4', color: 'white', border: 'none',
                  borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Share2 size={18} />
                {generatingLink ? 'Generating…' : 'Generate Share Link'}
              </button>
            ) : (
              <div>
                <div style={{ background: '#F5F5F7', borderRadius: 12, padding: '12px 14px', marginBottom: 10, fontFamily: 'monospace', fontSize: 12, color: '#6B6B7B', wordBreak: 'break-all' }}>
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}/baby/${shareToken}`}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={copyLink} style={{ flex: 1, background: copied ? '#22C55E' : '#EDE9F8', color: copied ? 'white' : '#9B8EC4', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={shareViaWhatsApp} style={{ flex: 1, background: '#25D366', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    📱 WhatsApp
                  </button>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* Account */}
        <section style={{ marginBottom: 24 }}>
          <SectionHeader title="Account" />
          <Card>
            <button
              onClick={signOut}
              style={{
                width: '100%', background: 'transparent', color: '#EF4444', border: '1.5px solid #FCA5A5',
                borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </Card>
        </section>

        <p style={{ fontSize: 12, color: '#9B8EC4', textAlign: 'center', marginTop: 8 }}>
          babycare · every little moment 💜<br />
          <span style={{ color: '#EBEBF0' }}>Built with love · All data on Supabase</span>
        </p>
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <p style={{ fontSize: 12, fontWeight: 800, color: '#9B8EC4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 4 }}>{title}</p>
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '16px 18px', border: '1.5px solid #EBEBF0' }}>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F5F5F7' }}>
      <span style={{ fontSize: 13, color: '#6B6B7B', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#2D2D3A' }}>{value}</span>
    </div>
  )
}
