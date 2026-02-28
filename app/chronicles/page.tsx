import { NavBar } from '@/components/NavBar'
import { ChroniclesClient } from './ChroniclesClient'

export const revalidate = 300

async function getStoryData() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/story`, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error('fetch failed')
    return res.json()
  } catch {
    return { entries: [], meta: { totalEvents: 0, dynamicEntries: 0, lastUpdated: new Date().toISOString() } }
  }
}

export default async function ChroniclesPage() {
  const data = await getStoryData()
  return (
    <>
      <NavBar />
      <ChroniclesClient initialData={data} />
    </>
  )
}
