import { NextResponse } from 'next/server'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'no prompt' }, { status: 400 })

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          {
            role: 'system',
            content: 'You are the Grand Chronicler of the Grid — a keeper of the living record of a vast world of ten thousand faces. Write from inside the world: atmospheric, present tense, grounded in specific names and places. Never mention blockchain, pixels, wallets, transactions, code, or anything technical. This is a living world with real history and real people.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      console.error('[summary] error:', response.status)
      return NextResponse.json({ error: 'upstream error' }, { status: 502 })
    }

    // Pollinations returns raw text
    const raw = await response.text()

    // Guard: if it somehow returns JSON (reasoning model leak), extract text
    let text = raw.trim()
    if (text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text)
        // Try common shapes
        text = parsed?.choices?.[0]?.message?.content
          || parsed?.content?.[0]?.text
          || parsed?.text
          || parsed?.message
          || ''
      } catch { text = '' }
    }

    if (!text) return NextResponse.json({ error: 'no text' }, { status: 502 })
    return NextResponse.json({ text })
  } catch (err) {
    console.error('[summary] error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
