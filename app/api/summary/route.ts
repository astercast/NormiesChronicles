import { NextResponse } from 'next/server'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[summary] ANTHROPIC_API_KEY not set')
    return NextResponse.json({ error: 'api key not configured' }, { status: 503 })
  }

  try {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'no prompt' }, { status: 400 })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[summary] anthropic error:', response.status, err)
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
