import { NextResponse } from 'next/server'
import { getStoryEntries } from '@/lib/getStory'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getStoryEntries()
  return NextResponse.json(data)
}
