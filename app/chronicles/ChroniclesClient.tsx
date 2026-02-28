'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type { StoryEntry } from '@/lib/storyGenerator'

// ── Story detail modal ────────────────────────────────────────────────────────
function EntryModal({ entry, onClose }: { entry: StoryEntry; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg p-6 overflow-y-auto"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          maxHeight: '80vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* era + type */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              {entry.era}
            </span>
            <span className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>·</span>
            <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              {entry.loreType.replace(/_/g, ' ').toLowerCase()}
            </span>
          </div>
          <button onClick={onClose} className="font-mono text-xs transition-opacity hover:opacity-50"
            style={{ color: 'var(--muted)' }}>
            esc ×
          </button>
        </div>

        <h2 className="font-mono text-sm font-bold leading-snug mb-4" style={{ color: 'var(--text)' }}>
          {entry.headline}
        </h2>

        <p className="font-mono text-xs leading-relaxed mb-6" style={{ color: 'var(--text)', lineHeight: '1.8' }}>
          {entry.body}
        </p>

        {entry.eventType !== 'genesis' && (
          <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
              on-chain source
            </p>
            <div className="space-y-1.5">
              {[
                ['event', entry.sourceEvent.type],
                ['token', entry.sourceEvent.tokenId],
                ['block', entry.sourceEvent.blockNumber],
                ['count', entry.sourceEvent.count],
                ['rule', entry.sourceEvent.ruleApplied],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4">
                  <span className="font-mono text-2xs w-12 shrink-0" style={{ color: 'var(--muted)' }}>{k}</span>
                  <span className="font-mono text-2xs" style={{ color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
              <div className="flex gap-4">
                <span className="font-mono text-2xs w-12 shrink-0" style={{ color: 'var(--muted)' }}>tx</span>
                <a
                  href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-mono text-2xs break-all underline underline-offset-4 transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text)' }}
                >
                  {entry.sourceEvent.txHash.slice(0, 10)}...{entry.sourceEvent.txHash.slice(-6)}
                </a>
              </div>
            </div>
            <p className="font-mono text-2xs mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
              {entry.sourceEvent.ruleExplanation}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Chronicle feed rendered as flowing prose ──────────────────────────────────
function ChronicleEntry({
  entry,
  onSelect,
}: {
  entry: StoryEntry
  onSelect: (e: StoryEntry) => void
}) {
  const isGenesis = entry.eventType === 'genesis'
  const isFeatured = entry.featured

  if (isGenesis) {
    return (
      <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="font-mono text-2xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
          {entry.era} · world primer
        </p>
        <h2
          className="font-mono text-base font-bold mb-2 leading-snug cursor-pointer transition-opacity hover:opacity-60"
          style={{ color: 'var(--text)' }}
          onClick={() => onSelect(entry)}
        >
          {entry.headline}
        </h2>
        <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)', lineHeight: '1.8' }}>
          {entry.body}
        </p>
      </div>
    )
  }

  if (isFeatured) {
    return (
      <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            {entry.era}
          </span>
          <span style={{ color: 'var(--muted)' }} className="font-mono text-2xs">·</span>
          <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--text)', letterSpacing: '0.15em' }}>
            {entry.loreType.replace(/_/g, ' ').toLowerCase()}
          </span>
        </div>
        <h2
          className="font-mono font-bold mb-3 leading-snug cursor-pointer transition-opacity hover:opacity-60"
          style={{ color: 'var(--text)', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}
          onClick={() => onSelect(entry)}
        >
          {entry.headline}
        </h2>
        <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text)', lineHeight: '1.85' }}>
          {entry.body.slice(0, 220)}
          {entry.body.length > 220 && (
            <>
              {'... '}
              <button
                onClick={() => onSelect(entry)}
                className="underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: 'var(--muted)' }}
              >
                continue reading
              </button>
            </>
          )}
        </p>
      </div>
    )
  }

  // Standard entry — inline prose style
  return (
    <div className="mb-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <span className="font-mono text-2xs uppercase tracking-widest shrink-0" style={{ color: 'var(--muted)' }}>
          {entry.loreType.replace(/_/g, ' ').toLowerCase()}
        </span>
        <span className="font-mono text-2xs shrink-0" style={{ color: 'var(--border)' }}>·</span>
        <span className="font-mono text-2xs shrink-0" style={{ color: 'var(--muted)' }}>
          {entry.era}
        </span>
      </div>
      <button
        className="text-left w-full group"
        onClick={() => onSelect(entry)}
      >
        <p
          className="font-mono text-xs leading-relaxed transition-opacity group-hover:opacity-60"
          style={{ color: 'var(--text)', lineHeight: '1.75' }}
        >
          <span className="font-bold">{entry.headline}.</span>{' '}
          <span style={{ color: 'var(--muted)' }}>
            {entry.body.slice(0, 120)}{entry.body.length > 120 ? '...' : ''}
          </span>
        </p>
      </button>
    </div>
  )
}

// ── Loading state ─────────────────────────────────────────────────────────────
function LoadingState({ status, eventsSoFar }: { status: string; eventsSoFar: number }) {
  return (
    <div className="py-20 flex flex-col items-center gap-6">
      <div className="w-48 h-px overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="scan-bar h-full w-12" style={{ background: 'var(--text)' }} />
      </div>
      <div className="text-center">
        <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
          indexing the grid
          <span className="dot-1 inline-block ml-0.5">.</span>
          <span className="dot-2 inline-block">.</span>
          <span className="dot-3 inline-block">.</span>
        </p>
        {eventsSoFar > 0 && (
          <p className="font-mono text-xs mb-1" style={{ color: 'var(--text)' }}>
            {eventsSoFar.toLocaleString()} events found so far
          </p>
        )}
        <p className="font-mono text-xs mb-1" style={{ color: 'var(--muted)' }}>
          {status}
        </p>
        <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
          scanning ethereum from block 19,500,000 — this takes a few minutes on first load
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function ChroniclesClient() {
  const [entries, setEntries] = useState<StoryEntry[]>([])
  const [meta, setMeta] = useState<{ totalEvents: number; dynamicEntries: number; lastUpdated: string } | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'indexing' | 'done' | 'error'>('loading')
  const [indexStatus, setIndexStatus] = useState('scanning ethereum mainnet...')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedEntry, setSelectedEntry] = useState<StoryEntry | null>(null)

  const indexingRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const PAGE_SIZE = 40

  // Calls /api/index in a loop until needsMore === false
  const runIndexLoop = useCallback(async () => {
    if (indexingRef.current) return
    indexingRef.current = true
    try {
      let needsMore = true
      let iteration = 0
      while (needsMore && mountedRef.current && iteration < 20) {
        iteration++
        const res = await fetch('/api/index', { method: 'POST' })
        if (!res.ok) break
        const data = await res.json()
        if (!mountedRef.current) break
        const count = data.events ?? 0
        needsMore = !!data.needsMore
        setIndexStatus(
          needsMore
            ? `found ${count.toLocaleString()} events — scanning older blocks...`
            : `indexed ${count.toLocaleString()} events`
        )
      }
    } catch { /* swallow */ } finally {
      indexingRef.current = false
    }
  }, [])

  const fetchStory = useCallback(async () => {
    try {
      const res = await fetch('/api/story', { cache: 'no-store' })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      if (!mountedRef.current) return false

      const hasRealEntries = (data.meta?.totalEvents ?? 0) > 0

      if (hasRealEntries && !data.indexing) {
        setEntries(data.entries ?? [])
        setMeta(data.meta)
        setLoadStatus('done')
        return true // done polling
      }

      // Has some events but still backfilling older history — show what we have, keep indexing
      if (hasRealEntries) {
        setEntries(data.entries ?? [])
        setMeta(data.meta)
        setLoadStatus('indexing')
        runIndexLoop() // guarded by indexingRef — safe to call repeatedly
        return false
      }

      // Nothing yet — kick off full index loop (once, guarded by indexingRef)
      setLoadStatus('indexing')
      runIndexLoop()
      return false
    } catch {
      if (mountedRef.current) setLoadStatus('error')
      return true
    }
  }, [runIndexLoop])

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      const done = await fetchStory()
      if (!done && !cancelled) {
        pollRef.current = setTimeout(poll, 8000)
      }
    }

    poll()
    return () => {
      cancelled = true
      mountedRef.current = false
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [fetchStory])

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(e =>
      e.headline.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      e.era.toLowerCase().includes(q)
    )
  }, [entries, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const currentEra = entries.find(e => e.eventType !== 'genesis')?.era ?? null
  const isLoading = loadStatus === 'loading'

  return (
    <>
      {selectedEntry && (
        <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}

      <main className="min-h-screen pt-11">

        {/* info bar */}
        <div className="border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-2xl mx-auto px-6 py-3">
            <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
              10,000 normies · ethereum mainnet · all history on-chain · cc0
            </p>
          </div>
        </div>

        {/* hero */}
        <div className="max-w-2xl mx-auto px-6 pt-10 pb-6">
          <h1
            className="font-mono font-bold leading-[0.9] mb-6"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 6rem)', color: 'var(--text)' }}
          >
            normies<br />chronicles
          </h1>
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '32rem' }}>
            a living record of the grid — every on-chain event shapes the world,
            every transformation writes history. fiction influenced by real decisions.
          </p>

          {/* stats row */}
          {meta && (
            <div className="flex flex-wrap gap-8 mt-6">
              {[
                ['entries', entries.length.toString()],
                ['on-chain events', meta.totalEvents.toString()],
                ...(currentEra ? [['current era', currentEra]] : []),
                ...(loadStatus === 'indexing' ? [['status', 'backfilling history…']] : []),
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-mono text-2xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted)' }}>{k}</p>
                  <p className="font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>{v}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* search */}
        <div
          className="sticky top-11 z-40 border-b border-t"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <div className="max-w-2xl mx-auto px-6">
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

        {/* chronicle body */}
        <div className="max-w-2xl mx-auto px-6 py-10">

          {isLoading && <LoadingState status={indexStatus} eventsSoFar={0} />}

          {loadStatus === 'indexing' && entries.length === 0 && (
            <LoadingState status={indexStatus} eventsSoFar={meta?.totalEvents ?? 0} />
          )}

          {loadStatus === 'error' && (
            <div className="py-20 text-center">
              <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>the grid is silent</p>
              <p className="font-mono text-xs mb-4" style={{ color: 'var(--muted)' }}>could not load entries — try refreshing</p>
              <button
                onClick={() => { setLoadStatus('loading'); fetchStory() }}
                className="font-mono text-xs underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: 'var(--text)' }}>
                retry →
              </button>
            </div>
          )}

          {/* still indexing but have partial data — show it with a note */}
          {loadStatus === 'indexing' && entries.length > 0 && (
            <div className="mb-8 py-3 px-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
                ◎ scanning older blocks — {meta?.totalEvents.toLocaleString()} events loaded so far, more arriving shortly
              </p>
            </div>
          )}

          {pageEntries.length > 0 && (
            <>
              <div>
                {pageEntries.map((entry) => (
                  <ChronicleEntry
                    key={entry.id}
                    entry={entry}
                    onSelect={setSelectedEntry}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0) }}
                    disabled={page === 0}
                    className="font-mono text-xs disabled:opacity-20 transition-opacity hover:opacity-60"
                    style={{ color: 'var(--text)' }}
                  >
                    ← earlier
                  </button>
                  <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0) }}
                    disabled={page === totalPages - 1}
                    className="font-mono text-xs disabled:opacity-20 transition-opacity hover:opacity-60"
                    style={{ color: 'var(--text)' }}
                  >
                    later →
                  </button>
                </div>
              )}
            </>
          )}

          {loadStatus === 'done' && pageEntries.length === 0 && search && (
            <div className="py-20 text-center">
              <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>no records match</p>
              <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>nothing found for "{search}"</p>
            </div>
          )}
        </div>

        <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>normies chronicles · ethereum · cc0</p>
            <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs transition-opacity hover:opacity-60" style={{ color: 'var(--muted)' }}>
              @aster0x
            </a>
          </div>
        </footer>
      </main>
    </>
  )
}
