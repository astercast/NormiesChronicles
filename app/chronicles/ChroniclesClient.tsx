'use client'
import { useState, useMemo, useEffect } from 'react'
import { StoryCard } from '@/components/StoryCard'
import type { StoryEntry } from '@/lib/storyGenerator'

const PAGE_SIZE = 15

function LoadingState() {
  return (
    <div className="py-32 flex flex-col items-center gap-6">
      {/* scanning bar */}
      <div className="w-48 h-px overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="scan-bar h-full w-12"
          style={{ background: 'var(--text)' }}
        />
      </div>

      <div className="text-center">
        <p className="font-mono text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
          indexing the grid
          <span className="dot-1 inline-block ml-0.5">.</span>
          <span className="dot-2 inline-block">.</span>
          <span className="dot-3 inline-block">.</span>
        </p>
        <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
          reading on-chain events — first load may take up to 60s
        </p>
      </div>

      {/* skeleton cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-4 h-36"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          >
            <div className="h-2 w-24 mb-3 rounded-sm" style={{ background: 'var(--border)' }} />
            <div className="h-3 w-full mb-1.5 rounded-sm" style={{ background: 'var(--border)' }} />
            <div className="h-3 w-4/5 mb-4 rounded-sm" style={{ background: 'var(--border)' }} />
            <div className="h-2 w-full mb-1 rounded-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
            <div className="h-2 w-3/4 rounded-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChroniclesClient() {
  const [entries, setEntries] = useState<StoryEntry[]>([])
  const [meta, setMeta] = useState<{ totalEvents: number; dynamicEntries: number; lastUpdated: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetch('/api/story')
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json() })
      .then(data => {
        setEntries(data.entries ?? [])
        setMeta(data.meta ?? null)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
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
      {/* hero — matches archive layout */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
            10,000 normies · ethereum mainnet · all history on-chain
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-8">
        {/* big stacked title like archive */}
        <h1
          className="font-mono font-bold leading-none mb-6"
          style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', color: 'var(--text)' }}
        >
          normies<br />chronicles
        </h1>

        <p className="font-mono text-xs mb-8" style={{ color: 'var(--muted)', maxWidth: '40rem' }}>
          a living record of the grid. every on-chain event shapes the world. every transformation writes history.
          fiction influenced by real decisions.
        </p>

        {/* stats */}
        {!loading && meta && (
          <div className="flex flex-wrap gap-6 mb-2 fade-up">
            {[
              ['total entries', entries.length.toString()],
              ['on-chain events', meta.totalEvents.toString()],
              ['current era', currentEra],
            ].map(([label, val]) => (
              <div key={label} className="font-mono">
                <p className="text-2xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* search bar */}
      <div
        className="sticky top-11 z-40 border-b border-t"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="search the archive..."
            className="w-full bg-transparent font-mono text-xs py-3 focus:outline-none"
            style={{ color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading && <LoadingState />}

        {error && (
          <div className="py-24 text-center">
            <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
              the grid is silent
            </p>
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
              could not load entries — try refreshing
            </p>
          </div>
        )}

        {!loading && !error && pageEntries.length === 0 && (
          <div className="py-24 text-center">
            <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
              the archive is silent
            </p>
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
              no records match your query
            </p>
          </div>
        )}

        {!loading && !error && pageEntries.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pageEntries.map((entry, i) => (
                <StoryCard key={entry.id} entry={entry} index={i} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="font-mono text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text)' }}
                >
                  ← prev
                </button>
                <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="font-mono text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text)' }}
                >
                  next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <footer
        className="border-t mt-12"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
            normies chronicles · ethereum · cc0
          </p>
          <a
            href="https://x.com/aster0x"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs transition-opacity hover:opacity-60"
            style={{ color: 'var(--muted)' }}
          >
            @aster0x
          </a>
        </div>
      </footer>
    </main>
  )
}
