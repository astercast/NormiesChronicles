'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavBar() {
  const pathname = usePathname()
  const links = [
    { href: '/chronicles', label: 'CHRONICLES' },
    { href: '/how-it-works', label: 'HOW IT WORKS' },
    { href: '/about', label: 'ABOUT' },
  ]
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-grid-border bg-grid-bg/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/chronicles" className="font-pixel text-xl text-grid-accent glow-accent tracking-wider hover:opacity-80 transition-opacity">
          NORMIE CHRONICLES
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1 font-mono text-xs tracking-widest transition-colors ${
                pathname === href
                  ? 'text-grid-accent border-b border-grid-accent'
                  : 'text-grid-primary hover:text-grid-secondary'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
