'use client'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const S = { maxWidth: '44rem', margin: '0 auto', padding: '0 1.5rem' } as React.CSSProperties

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'inherit', fontSize: '0.72rem' }}
      aria-label="toggle theme"
    >
      {theme === 'dark' ? '○' : '●'}
    </button>
  )
}

const NAV_LINKS = [
  { href: '/chronicles', label: 'chronicles', sub: 'The live record — five presences, the world they are making' },
  { href: '/characters', label: 'characters', sub: 'Who the five are and what they have done' },
  { href: '/how-it-works', label: 'how it works', sub: 'The rule system that turns on-chain events into story' },
  { href: '/about', label: 'about', sub: 'The project, the collection, who built this' },
]

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ borderBottom: '1px solid var(--border)', position: 'fixed', top: 0, left: 0, right: 0, background: 'var(--bg)', zIndex: 50 }}>
        <div style={{ maxWidth: '100%', padding: '0 1.5rem', height: '2.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            normia · ethereum mainnet · cc0
          </span>
          <ThemeToggle />
        </div>
      </div>

      {/* Hero */}
      <div style={{ ...S, paddingTop: '6rem', paddingBottom: '3.5rem', borderBottom: '3px double var(--border)' }}>
        <div style={{ fontSize: '0.5rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', opacity: 0.6 }}>
          a living world · on-chain events → narrative
        </div>
        <h1 style={{ fontSize: 'clamp(2.4rem,9vw,4.4rem)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 0.88, marginBottom: '1.6rem' }}>
          The Chronicles<br />of Normia
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.78rem', lineHeight: '2.0', maxWidth: '30rem', marginBottom: '2.2rem' }}>
          Real on-chain decisions made by Normies holders become the living history of a world.
          Every pixel edit, every burn — run through a deterministic rule system that assigns each
          event to one of five legendary presences and writes it into the record. No writers. No editors.
          The story is what the community does.
        </p>
        <Link
          href="/chronicles"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            background: 'var(--text)', color: 'var(--bg)',
            padding: '0.7rem 1.3rem', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
          }}
        >
          enter the chronicles →
        </Link>
      </div>

      {/* Three pillars */}
      <div style={{ ...S, paddingTop: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {[
            ['five presences', 'Lyra, Finn, The Cast, Cielo, and Echo. Each on-chain event maps to one of them based on its nature and scale. Their actions build Normia.'],
            ['a world with memory', 'The chronicle accumulates. Zones have history. Structures get built and challenged. What happened before shapes what gets written next.'],
            ['fully deterministic', 'The same events always produce the same story. Nothing is chosen after the system was built. The community writes Normia by acting in it.'],
          ].map(([label, desc]) => (
            <div key={label as string}>
              <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: '0.65rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                {label}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.68rem', lineHeight: '1.85' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation cards */}
      <div style={{ ...S, paddingTop: '2.5rem', paddingBottom: '5rem', flex: 1 }}>
        <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.3rem', opacity: 0.7 }}>
          explore
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
          {NAV_LINKS.map(({ href, label, sub }) => (
            <Link
              key={href}
              href={href}
              style={{ display: 'block', padding: '1.1rem 1.2rem', border: '1px solid var(--border)', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.03em' }}>{label}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>→</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.63rem', lineHeight: '1.6' }}>{sub}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{ ...S, height: '2.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.5 }}>
            normies chronicles · built by{' '}
            <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>@aster0x</a>
          </span>
          <a href="https://normies.art" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.5 }}>
            normies.art →
          </a>
        </div>
      </div>
    </main>
  )
}
