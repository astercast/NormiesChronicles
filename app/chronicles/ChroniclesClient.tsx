'use client'
import { useState, useMemo, useEffect } from 'react'
import { StoryCard } from '@/components/StoryCard'
import type { StoryEntry } from '@/lib/storyGenerator'

const PAGE_SIZE = 15

export function ChroniclesClient() {
  const [entries, setEntries] = useState<StoryEntry[]>([])
  const [meta, setMeta] = useState<{ totalEvents: number; dynamicEntries: number; lastUpdated: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetch('/api/story')
      .then(r => {
        if (!r.ok) throw new Error('failed')
        return r.json()
      })
      .then(data => {
        setEntries(data.entries ?? [])
        setMeta(data.meta ?? null)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const currentEra = entries.find(e => e.eventType !== 'genesis')?.era ?? 'The Void Before'

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(x =>
      x.headline.toLowerCase().includes(q) ||
      x.body.toLowerCase().includes(q) ||
      x.era.toLowerCase().includes(q)
    )
  }, [entries, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <main className="min-h-screen pt-11">
      {/* hero */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono text-xs text-muted mb-3">current era</p>
          <h1 className="font-pixel text-6xl md:text-8xl text-bright mb-1">normies chronicles</h1>
          <p className="font-pixel text-3xl text-accent mb-6">
            {loading ? '...' : currentEra}
          </p>
          <p className="font-mono text-xs text-muted max-w-xl leading-relaxed mb-8">
            a living record of the grid. every on-chain event shapes the world.
            every transformation writes history.
          </p>
          <div className="flex flex-wrap gap-8">
            {[
              ['entries', loading ? '—' : entries.length.toString()],
              ['on-chain events', loading ? '—' : (meta?.totalEvents ?? 0).toString()],
              ['lore records', loading ? '—' : (meta?.dynamicEntries ?? 0).toString()],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="font-mono text-xs text-muted">{label}</p>
                <p className="font-pixel text-3xl text-bright">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* search */}
      <div className="sticky top-11 z-40 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="search the archive..."
            className="w-full bg-transparent border-0 font-mono text-xs text-primary placeholder-muted py-2 focus:outline-none"
          />
        </div>
      </div>

      {/* content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading && (
          <div className="py-24 text-center">
            <p className="font-pixel text-3xl text-dim mb-2">indexing the grid</p>
            <p className="font-mono text-xs text-muted">reading on-chain events — this may take a moment on first load...</p>
          </div>
        )}

        {error && (
          <div className="py-24 text-center">
            <p className="font-pixel text-3xl text-dim mb-2">the grid is silent</p>
            <p className="font-mono text-xs text-muted">could not load entries — try refreshing</p>
          </div>
        )}

        {!loading && !error && pageEntries.length === 0 && (
          <div className="py-24 text-center">
            <p className="font-pixel text-3xl text-dim mb-2">the archive is silent</p>
            <p className="font-mono text-xs text-muted">no records match your query</p>
          </div>
        )}

        {!loading && !error && pageEntries.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pageEntries.map(entry => (
                <StoryCard key={entry.id} entry={entry} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="font-mono text-xs text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← prev
                </button>
                <span className="font-mono text-xs text-dim">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="font-mono text-xs text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-border mt-12">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <p className="font-mono text-xs text-dim">normies chronicles · ethereum · cc0</p>
          <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-muted hover:text-primary transition-colors">
            @aster0x
          </a>
        </div>
      </footer>
    </main>
  )
}
