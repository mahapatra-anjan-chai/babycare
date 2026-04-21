import { NextRequest, NextResponse } from 'next/server'
import { generateChatReply, ChatMessage } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  try {
    const { messages, babyName, gender, ageMonths } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const reply = await generateChatReply(
      messages as ChatMessage[],
      { name: babyName ?? 'your baby', gender: gender ?? 'unknown', ageMonths: ageMonths ?? 0 }
    )

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[/api/chat]', err)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
