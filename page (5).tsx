import { NextResponse } from 'next/server'
import { fetchCanvasStatus } from '@/lib/normiesApi'

export const revalidate = 60

export async function GET() {
  try {
    const status = await fetchCanvasStatus()
    return NextResponse.json(status)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch canvas status' }, { status: 500 })
  }
}
