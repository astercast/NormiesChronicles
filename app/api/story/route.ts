import { NextResponse } from 'next/server'
import { getStoryEntries } from '@/lib/getStory'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getStoryEntries()
  return NextResponse.json(data, {
    headers: {
      // CDN caches for 5 min, stale-while-revalidate for 10 min after
      // This means most visitors hit Vercel's edge, not your serverless function
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
