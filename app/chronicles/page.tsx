import { Suspense } from 'react'
import { NavBar } from '@/components/NavBar'
import { ChroniclesClient } from './ChroniclesClient'

export default function ChroniclesPage() {
  return (
    <>
      <NavBar />
      <Suspense fallback={null}>
        <ChroniclesClient />
      </Suspense>
    </>
  )
}
