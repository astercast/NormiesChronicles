'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { StoryCard } from '@/components/StoryCard'
import type { StoryEntry } from '@/lib/storyGenerator'

const PAGE_SIZE = 15

function LoadingState({ status }: { status: 'loading' | 'indexing' }) {
  return (
    <div className="py-24 flex flex-col items-center gap-6">
      {/* scanning bar */}
      <div className="w-48 h-px overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="scan-bar h-full w-12" style={{ background: 'var(--text)' }} />
      </div>

      <div className="text-center">
        {status === 'indexing' ? (
          <>
            <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
              indexing the grid
              <span className="dot-1 inline-block ml-0.5">.</span>
              <span className="dot-2 inline-block">.</span>
              <span className="dot-3 inline-block">.</span>
            </p>
            <p className="font-mono text-xs mb-1" style={{ color: 'var(--muted)' }}>
              reading every on-chain event from Ethereum mainnet
            </p>
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
              first load takes up to 60s — the grid will appear shortly
            </p>
          </>
        ) : (
          <>
            <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
              reading the grid
              <span className="dot-1 inline-block ml-0.5">.</span>
              <span className="dot-2 inline-block">.</span>
              <span className="dot-3 inline-block">.</span>
            </p>
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
              fetching chronicle entries
            </p>
          </>
        )}
      </div>

      {/* skeleton cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 h-36"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="h-2 w-24 mb-3 rounded-sm" style={{ background: 'var(--border)' }} />
            <div className="h-3 w-full mb-1.5 rounded-sm" style={{ background: 'var(--border)' }} />
            <div className="h-3 w-4/5 mb-4 rounded-sm" style={{ background: 'var(--border)' }} />
            <div className="h-2 w-full mb-1 rounded-sm" style={{ background: 'var(--border)', opacity: 0.5 }} />
            <div className="h-2 w-3/4 rounded-sm" style={{ background: 'var(--border)', opacity: 0.5 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChroniclesClient() {
  const [entries, setEntries] = useState<StoryEntry[]>([])
  const [meta, setMeta] = useState<{ totalEvents: number; dynamicEntries: number; lastUpdated: string } | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'indexing' | 'done' | 'error'>('loading')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  // prevent multiple concurrent index calls
  const indexingRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchStory = async () => {
    try {
      const res = await fetch('/api/story', { cache: 'no-store' })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()

      const hasEntries = data.entries && data.entries.length > 0

      if (hasEntries) {
        setEntries(data.entries)
        setMeta(data.meta ?? null)
        setLoadStatus('done')
        if (pollRef.current) clearTimeout(pollRef.current)
        return true // done
      }

      // No entries yet — kick off indexing if not already running
      setLoadStatus('indexing')
      if (!indexingRef.current) {
        indexingRef.current = true
        fetch('/api/index', { method: 'POST' })
          .then(() => { indexingRef.current = false })
          .catch(() => { indexingRef.current = false })
      }

      return false // not done yet
    } catch (err) {
      console.error('[fetch story]', err)
      setLoadStatus('error')
      return true // stop polling
    }
  }

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      const done = await fetchStory()
      if (!done && !cancelled) {
        pollRef.current = setTimeout(poll, 4000)
      }
    }

    poll()

    return () => {
      cancelled = true
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [])

  const currentEra = entries.find(e => e.eventType !== 'genesis')?.era ?? null

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

  const isLoading = loadStatus === 'loading' || loadStatus === 'indexing'

  return (
    <main className="min-h-screen pt-11">
      {/* info bar */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
            10,000 normies · ethereum mainnet · all history on-chain
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-8">
        {/* big title */}
        <h1
          className="font-mono font-bold leading-none mb-6"
          style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', color: 'var(--text)' }}
        >
          normies<br />chronicles
        </h1>

        <p className="font-mono text-xs mb-1" style={{ color: 'var(--muted)', maxWidth: '40rem' }}>
          a living record of the grid. every on-chain event shapes the world. every transformation writes history.
        </p>
        <p className="font-mono text-xs mb-8" style={{ color: 'var(--muted)', maxWidth: '40rem' }}>
          fiction influenced by real decisions.
        </p>

        {/* stats — only show when loaded */}
        {loadStatus === 'done' && meta && (
          <div className="flex flex-wrap gap-6 mb-2 fade-up">
            {[
              ['total entries', entries.length.toString()],
              ['on-chain events', meta.totalEvents.toString()],
              ...(currentEra ? [['current era', currentEra]] : []),
            ].map(([label, val]) => (
              <div key={label} className="font-mono">
                <p className="text-2xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* search — always visible, disabled while loading */}
      <div
        className="sticky top-11 z-40 border-b border-t"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder={isLoading ? 'loading entries...' : 'search entries...'}
            disabled={isLoading}
            className="w-full bg-transparent font-mono text-xs py-3 focus:outline-none disabled:cursor-not-allowed"
            style={{ color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading && <LoadingState status={loadStatus as 'loading' | 'indexing'} />}

        {loadStatus === 'error' && (
          <div className="py-24 text-center">
            <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
              the grid is silent
            </p>
            <p className="font-mono text-xs mb-4" style={{ color: 'var(--muted)' }}>
              could not load entries — try refreshing
            </p>
            <button
              onClick={() => { setLoadStatus('loading'); fetchStory() }}
              className="font-mono text-xs underline underline-offset-4 transition-opacity hover:opacity-60"
              style={{ color: 'var(--text)' }}
            >
              retry →
            </button>
          </div>
        )}

        {loadStatus === 'done' && pageEntries.length === 0 && search && (
          <div className="py-24 text-center">
            <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
              no records match
            </p>
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
              the archive found nothing for "{search}"
            </p>
          </div>
        )}

        {loadStatus === 'done' && pageEntries.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pageEntries.map((entry, i) => (
                <StoryCard key={entry.id} entry={entry} index={i} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-12">
                <button
                  onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0) }}
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
                  onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0) }}
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

      <footer className="border-t mt-12" style={{ borderColor: 'var(--border)' }}>
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
