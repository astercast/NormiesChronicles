import { NextResponse } from 'next/server'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'no prompt' }, { status: 400 })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[summary] anthropic error:', err)
      return NextResponse.json({ error: 'upstream error' }, { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''
    return NextResponse.json({ text })
  } catch (err) {
    console.error('[summary] error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
