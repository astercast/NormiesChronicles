'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavBar() {
  const path = usePathname()
  const links = [
    { href: '/chronicles', label: 'chronicles' },
    { href: '/how-it-works', label: 'how it works' },
    { href: '/about', label: 'about' },
  ]
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-11 flex items-center justify-between">
        <Link href="/chronicles" className="font-pixel text-xl text-bright tracking-wide hover:text-accent transition-colors">
          normies chronicles
        </Link>
        <div className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-mono text-xs transition-colors ${path === href ? 'text-bright' : 'text-muted hover:text-primary'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
