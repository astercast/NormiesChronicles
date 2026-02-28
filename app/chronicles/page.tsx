import { NavBar } from '@/components/NavBar'
import { ChroniclesClient } from './ChroniclesClient'
import { getStoryEntries } from '@/lib/getStory'

export const dynamic = 'force-dynamic'

export default async function ChroniclesPage() {
  const data = await getStoryEntries()
  return (
    <>
      <NavBar />
      <ChroniclesClient initialData={data} />
    </>
  )
}
