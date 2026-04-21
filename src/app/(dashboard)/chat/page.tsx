'use client'

import { useState, useRef, useEffect } from 'react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { Send } from 'lucide-react'

interface Message {
  role: 'user' | 'model'
  content: string
}

const MAX_MESSAGES = 15

export default function ChatPage() {
  const { baby, ageMonths } = useBaby()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const babyName = baby?.name ?? 'your baby'
  const gender = baby?.gender ?? 'unknown'

  const SUGGESTED = [
    `How much should ${babyName} eat at ${ageMonths} months?`,
    `${babyName} has a fever of 100°F — what should I do?`,
    `How often should a ${ageMonths}-month-old have wet diapers?`,
    `When can I start ${babyName} on solids?`,
  ]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    if (!text.trim() || loading || messages.length >= MAX_MESSAGES) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          babyName,
          gender,
          ageMonths,
        }),
      })
      const json = await res.json()
      if (json.reply) {
        setMessages(prev => [...prev, { role: 'model', content: json.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'model', content: "Sorry, I couldn't get a response. Please try again." }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: 'Network error — please check your connection and try again.' }])
    }
    setLoading(false)
  }

  const sessionFull = messages.length >= MAX_MESSAGES

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <AppBar title="Ask BabyCare AI 💜" showBack />

      {/* Disclaimer */}
      <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '10px 16px', flexShrink: 0 }}>
        <p style={{ fontSize: 12, color: '#92400E', fontWeight: 600, textAlign: 'center' }}>
          ⚕️ General guidance only — always consult your paediatrician
        </p>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>

        {/* Empty state — suggested prompts */}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>💜</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#2D2D3A', marginBottom: 4 }}>
              Ask me anything about {babyName}
            </p>
            <p style={{ fontSize: 13, color: '#6B6B7B', marginBottom: 24 }}>
              Feeding · Sleep · Diapers · Common health questions
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SUGGESTED.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  style={{
                    background: '#F5F2FC', border: '1.5px solid #D8D0F0',
                    borderRadius: 14, padding: '12px 16px',
                    fontSize: 14, color: '#2D2D3A', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left', lineHeight: 1.4,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat bubbles */}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}
          >
            {msg.role === 'model' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#EDE9F8', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, marginRight: 8, marginTop: 2,
              }}>
                💜
              </div>
            )}
            <div
              style={{
                maxWidth: '78%',
                background: msg.role === 'user' ? '#9B8EC4' : 'white',
                color: msg.role === 'user' ? 'white' : '#2D2D3A',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '11px 14px',
                fontSize: 14, lineHeight: 1.55, fontWeight: 500,
                border: msg.role === 'model' ? '1.5px solid #EBEBF0' : 'none',
                boxShadow: msg.role === 'model' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#EDE9F8', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, flexShrink: 0,
            }}>
              💜
            </div>
            <div style={{
              background: 'white', border: '1.5px solid #EBEBF0',
              borderRadius: '18px 18px 18px 4px', padding: '12px 16px',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#9B8EC4',
                    animation: 'bounce 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Session cap notice */}
        {sessionFull && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: '#6B6B7B', fontSize: 13 }}>
            Session limit reached.{' '}
            <button
              onClick={() => setMessages([])}
              style={{ color: '#9B8EC4', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
            >
              Start new session
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        flexShrink: 0, padding: '10px 16px 12px',
        background: 'white', borderTop: '1px solid #EBEBF0',
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          placeholder={sessionFull ? 'Session limit reached' : `Ask about ${babyName}…`}
          disabled={loading || sessionFull}
          rows={1}
          style={{
            flex: 1, resize: 'none', border: '1.5px solid #EBEBF0',
            borderRadius: 16, padding: '11px 14px', fontSize: 15,
            fontFamily: 'inherit', color: '#2D2D3A', background: sessionFull ? '#F5F5F7' : '#FAFAF8',
            outline: 'none', lineHeight: 1.4,
            maxHeight: 100, overflow: 'auto',
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading || sessionFull}
          style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: !input.trim() || loading || sessionFull ? '#EBEBF0' : '#9B8EC4',
            border: 'none', cursor: !input.trim() || loading || sessionFull ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          <Send size={18} color={!input.trim() || loading || sessionFull ? '#9B8EC4' : 'white'} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
