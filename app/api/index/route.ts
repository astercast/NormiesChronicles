import { NextResponse } from 'next/server'
import { runFullIndex } from '@/lib/getStory'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await Promise.race([
      runFullIndex(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('index timeout after 55s')), 55_000)
      ),
    ])
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/index] error:', msg)
    return NextResponse.json({ error: msg, events: 0 }, { status: 500 })
  }
}
