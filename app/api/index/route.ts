import { NextResponse } from 'next/server'
import { runFullIndex } from '@/lib/getStory'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await runFullIndex()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/index]', err)
    return NextResponse.json({ error: 'index failed' }, { status: 500 })
  }
}
