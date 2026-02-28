import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Normie Chronicles — The Eternal Story of the Grid',
  description: 'A living world-chronicle shaped by on-chain events. 10,000 faces. One eternal story.',
  openGraph: {
    title: 'The Normie Chronicles',
    description: '10,000 faces. One eternal story. Every on-chain event writes history.',
    images: ['/og-image.png'],
  },
  twitter: { card: 'summary_large_image', creator: '@aster0x' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
