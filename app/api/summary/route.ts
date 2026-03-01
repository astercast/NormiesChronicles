import { NextResponse } from 'next/server'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

// Uses Pollinations.ai — completely free, no API key required
// Backed by OpenAI-grade models, anonymous requests always work
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'no prompt' }, { status: 400 })

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        seed: 42,
        messages: [
          {
            role: 'system',
            content: 'You are the Grand Chronicler of the Normies — keeper of the living record of the Grid, a vast pixel world of ten thousand faces. You write about this world from the inside: its factions, its territories, its sacrifices, its discoveries, its quiet moments and its upheavals. Write with atmospheric weight — vivid, present tense, grounded in specific names and places. Never mention blockchain, pixels, wallets, transactions, or anything technical. This is a real world with real people in it. Not every dispatch is a war report.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      console.error('[summary] pollinations error:', response.status)
      return NextResponse.json({ error: 'upstream error' }, { status: 502 })
    }

    // Pollinations returns raw text, not JSON
    const text = await response.text()
    return NextResponse.json({ text: text.trim() })
  } catch (err) {
    console.error('[summary] error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
