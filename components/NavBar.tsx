'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function NavBar() {
  const path = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const links = [
    { href: '/chronicles', label: 'chronicles' },
    { href: '/how-it-works', label: 'how it works' },
    { href: '/about', label: 'about' },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-5xl mx-auto px-6 h-11 flex items-center justify-between">
        <Link
          href="/chronicles"
          className="font-mono text-sm font-bold tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          normies chronicles
        </Link>

        <div className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-mono text-xs transition-colors"
              style={{
                color: path === href ? 'var(--text)' : 'var(--muted)',
                textDecoration: path === href ? 'underline' : 'none',
                textUnderlineOffset: '4px',
              }}
            >
              {label}
            </Link>
          ))}

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="font-mono text-xs transition-colors"
              style={{ color: 'var(--muted)' }}
              aria-label="toggle theme"
            >
              {theme === 'dark' ? '○' : '●'}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
