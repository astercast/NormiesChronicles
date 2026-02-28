import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Normies Chronicles — The Eternal Story of the Grid',
  description: 'A living world-chronicle shaped by on-chain events. 10,000 faces. One eternal story.',
  openGraph: {
    title: 'Normies Chronicles',
    description: '10,000 faces. One eternal story. Every on-chain event writes history.',
  },
  twitter: { card: 'summary_large_image', creator: '@aster0x' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
