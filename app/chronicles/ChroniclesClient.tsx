'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type { StoryEntry } from '@/lib/storyGenerator'

function groupByEra(entries: StoryEntry[]) {
  const map = new Map<string, StoryEntry[]>()
  for (const e of entries) {
    if (!map.has(e.era)) map.set(e.era, [])
    map.get(e.era)!.push(e)
  }
  return map
}

function EntryModal({ entry, onClose }: { entry: StoryEntry; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="relative w-full max-w-lg p-6 overflow-y-auto"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{entry.era}</span>
            <span className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>·</span>
            <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              {entry.loreType.replace(/_/g, ' ').toLowerCase()}
            </span>
          </div>
          <button onClick={onClose} className="font-mono text-xs transition-opacity hover:opacity-50" style={{ color: 'var(--muted)' }}>
            esc ×
          </button>
        </div>
        <h2 className="font-mono text-sm font-bold leading-snug mb-4" style={{ color: 'var(--text)' }}>{entry.headline}</h2>
        <p className="font-mono text-xs leading-relaxed mb-6" style={{ color: 'var(--text)', lineHeight: '1.8' }}>{entry.body}</p>
        {entry.eventType !== 'genesis' && (
          <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>on-chain source</p>
            <div className="space-y-1.5">
              {[['event', entry.sourceEvent.type], ['token', entry.sourceEvent.tokenId],
                ['block', entry.sourceEvent.blockNumber], ['count', entry.sourceEvent.count],
                ['rule', entry.sourceEvent.ruleApplied]].map(([k, v]) => (
                <div key={k} className="flex gap-4">
                  <span className="font-mono text-2xs w-12 shrink-0" style={{ color: 'var(--muted)' }}>{k}</span>
                  <span className="font-mono text-2xs" style={{ color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
              <div className="flex gap-4">
                <span className="font-mono text-2xs w-12 shrink-0" style={{ color: 'var(--muted)' }}>tx</span>
                <a href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-2xs break-all underline underline-offset-4 transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text)' }}>
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

// ── NOW VIEW ──────────────────────────────────────────────────────────────────
function NowView({ entries, meta, onSelect, onReadAll }: {
  entries: StoryEntry[]
  meta: { totalEvents: number; dynamicEntries: number; lastUpdated: string } | null
  onSelect: (e: StoryEntry) => void
  onReadAll: () => void
}) {
  const dynamic = entries.filter(e => e.eventType !== 'genesis')
  const featured = dynamic.filter(e => e.featured)
  const latest = dynamic[dynamic.length - 1]
  const currentEra = latest?.era ?? '—'
  const byEra = groupByEra(dynamic)
  const eras = Array.from(byEra.keys())
  const maxCount = Math.max(...eras.map(era => byEra.get(era)!.length), 1)

  return (
    <div className="space-y-10">

      {/* Current era banner */}
      <div className="py-5 px-5 -mx-0" style={{ border: '1px solid var(--border)' }}>
        <p className="font-mono text-2xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>current era</p>
        <p className="font-mono text-xl font-bold leading-tight mb-4" style={{ color: 'var(--text)' }}>{currentEra}</p>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            ['on-chain events', meta?.totalEvents.toLocaleString() ?? '—'],
            ['chronicle entries', dynamic.length.toString()],
            ['eras recorded', eras.length.toString()],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{k}</p>
              <p className="font-mono text-sm font-bold" style={{ color: 'var(--text)' }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Era timeline */}
      <div>
        <p className="font-mono text-2xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>story so far</p>
        <div className="space-y-0">
          {eras.map((era, i) => {
            const isLatest = i === eras.length - 1
            const count = byEra.get(era)!.length
            const barWidth = Math.max(3, Math.round((count / maxCount) * 100))
            return (
              <div key={era} className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                  background: isLatest ? 'var(--text)' : 'var(--muted)',
                  opacity: isLatest ? 1 : 0.4,
                }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <p className="font-mono text-xs truncate" style={{
                      color: isLatest ? 'var(--text)' : 'var(--muted)',
                      fontWeight: isLatest ? 700 : 400
                    }}>
                      {era}
                      {isLatest && <span className="ml-2 font-mono text-2xs font-normal" style={{ color: 'var(--muted)' }}>← now</span>}
                    </p>
                    <p className="font-mono text-2xs shrink-0" style={{ color: 'var(--muted)' }}>
                      {count} {count === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  <div className="h-px" style={{ background: 'var(--border)' }}>
                    <div className="h-full" style={{
                      width: `${barWidth}%`,
                      background: isLatest ? 'var(--text)' : 'var(--muted)',
                      opacity: isLatest ? 1 : 0.35
                    }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Latest entry */}
      {latest && (
        <div>
          <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>latest entry</p>
          <div className="p-5 cursor-pointer transition-opacity hover:opacity-70"
            style={{ border: '1px solid var(--text)' }}
            onClick={() => onSelect(latest)}>
            <p className="font-mono text-2xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
              {latest.era} · {latest.loreType.replace(/_/g, ' ').toLowerCase()}
            </p>
            <p className="font-mono text-sm font-bold mb-2 leading-snug" style={{ color: 'var(--text)' }}>{latest.headline}</p>
            <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)', lineHeight: '1.75' }}>
              {latest.body.slice(0, 200)}{latest.body.length > 200 ? '...' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Significant events */}
      {featured.length > 0 && (
        <div>
          <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>significant events</p>
          <div>
            {featured.slice(-6).reverse().map(entry => (
              <button key={entry.id} className="w-full text-left py-3 flex items-baseline gap-3 transition-opacity hover:opacity-60"
                style={{ borderBottom: '1px solid var(--border)' }}
                onClick={() => onSelect(entry)}>
                <span className="font-mono text-xs shrink-0" style={{ color: 'var(--muted)' }}>{entry.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold leading-snug" style={{ color: 'var(--text)' }}>{entry.headline}</p>
                  <p className="font-mono text-2xs mt-0.5" style={{ color: 'var(--muted)' }}>{entry.era}</p>
                </div>
                <span className="font-mono text-2xs shrink-0" style={{ color: 'var(--muted)' }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={onReadAll}
        className="font-mono text-xs transition-opacity hover:opacity-60 flex items-center gap-2 pt-2"
        style={{ color: 'var(--text)' }}>
        <span>read the full chronicle</span><span>→</span>
      </button>
    </div>
  )
}

// ── CHRONICLE VIEW ────────────────────────────────────────────────────────────
function ChronicleEntry({ entry, onSelect }: { entry: StoryEntry; onSelect: (e: StoryEntry) => void }) {
  const isGenesis = entry.eventType === 'genesis'
  const isFeatured = entry.featured

  if (isGenesis) {
    return (
      <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="font-mono text-2xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
          {entry.era} · world primer
        </p>
        <h2 className="font-mono text-base font-bold mb-2 leading-snug cursor-pointer transition-opacity hover:opacity-60"
          style={{ color: 'var(--text)' }} onClick={() => onSelect(entry)}>
          {entry.headline}
        </h2>
        <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)', lineHeight: '1.8' }}>{entry.body}</p>
      </div>
    )
  }

  if (isFeatured) {
    return (
      <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{entry.era}</span>
          <span style={{ color: 'var(--muted)' }} className="font-mono text-2xs">·</span>
          <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--text)' }}>
            {entry.loreType.replace(/_/g, ' ').toLowerCase()}
          </span>
        </div>
        <h2 className="font-mono font-bold mb-3 leading-snug cursor-pointer transition-opacity hover:opacity-60"
          style={{ color: 'var(--text)', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}
          onClick={() => onSelect(entry)}>
          {entry.headline}
        </h2>
        <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text)', lineHeight: '1.85' }}>
          {entry.body.slice(0, 220)}
          {entry.body.length > 220 && (
            <>{' '}<button onClick={() => onSelect(entry)}
              className="underline underline-offset-4 transition-opacity hover:opacity-60"
              style={{ color: 'var(--muted)' }}>continue reading</button></>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="mb-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <span className="font-mono text-2xs uppercase tracking-widest shrink-0" style={{ color: 'var(--muted)' }}>
          {entry.loreType.replace(/_/g, ' ').toLowerCase()}
        </span>
        <span className="font-mono text-2xs shrink-0" style={{ color: 'var(--border)' }}>·</span>
        <span className="font-mono text-2xs shrink-0" style={{ color: 'var(--muted)' }}>{entry.era}</span>
      </div>
      <button className="text-left w-full group" onClick={() => onSelect(entry)}>
        <p className="font-mono text-xs leading-relaxed transition-opacity group-hover:opacity-60"
          style={{ color: 'var(--text)', lineHeight: '1.75' }}>
          <span className="font-bold">{entry.headline}.</span>{' '}
          <span style={{ color: 'var(--muted)' }}>{entry.body.slice(0, 120)}{entry.body.length > 120 ? '...' : ''}</span>
        </p>
      </button>
    </div>
  )
}

function EraSection({ era, entries, onSelect }: { era: string; entries: StoryEntry[]; onSelect: (e: StoryEntry) => void }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="mb-10">
      <button className="flex items-center gap-3 w-full text-left mb-5 group py-2"
        style={{ borderBottom: '1px solid var(--border)' }}
        onClick={() => setCollapsed(c => !c)}>
        <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>era</span>
        <span className="font-mono text-xs font-bold flex-1" style={{ color: 'var(--text)' }}>{era}</span>
        <span className="font-mono text-2xs transition-opacity group-hover:opacity-60" style={{ color: 'var(--muted)' }}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} {collapsed ? '↓' : '↑'}
        </span>
      </button>
      {!collapsed && entries.map(entry => (
        <ChronicleEntry key={entry.id} entry={entry} onSelect={onSelect} />
      ))}
    </div>
  )
}

function LoadingState({ status }: { status: string }) {
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
        <p className="font-mono text-xs mb-1" style={{ color: 'var(--muted)' }}>{status}</p>
        <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
          scanning ethereum mainnet — this takes a moment on first load
        </p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ChroniclesClient() {
  const [entries, setEntries] = useState<StoryEntry[]>([])
  const [meta, setMeta] = useState<{ totalEvents: number; dynamicEntries: number; lastUpdated: string } | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'indexing' | 'done' | 'error'>('loading')
  const [indexStatus, setIndexStatus] = useState('scanning ethereum mainnet...')
  const [view, setView] = useState<'now' | 'chronicle'>('now')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedEntry, setSelectedEntry] = useState<StoryEntry | null>(null)

  const indexingRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const PAGE_SIZE = 40

  const triggerIndex = useCallback(async () => {
    if (indexingRef.current) return
    indexingRef.current = true
    try {
      const res = await fetch('/api/index', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (mountedRef.current) setIndexStatus(`indexed ${(data.events ?? 0).toLocaleString()} events`)
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
      if ((data.meta?.totalEvents ?? 0) > 0) {
        setEntries(data.entries ?? [])
        setMeta(data.meta)
        setLoadStatus('done')
        return true
      }
      setLoadStatus('indexing')
      triggerIndex()
      return false
    } catch {
      if (mountedRef.current) setLoadStatus('error')
      return true
    }
  }, [triggerIndex])

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false
    const poll = async () => {
      if (cancelled) return
      const done = await fetchStory()
      if (!done && !cancelled) pollRef.current = setTimeout(poll, 8000)
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

  const dynamic = useMemo(() => entries.filter(e => e.eventType !== 'genesis'), [entries])
  const genesisEntries = useMemo(() => filtered.filter(e => e.eventType === 'genesis'), [filtered])
  const byEra = useMemo(() => groupByEra(filtered.filter(e => e.eventType !== 'genesis')), [filtered])
  const eras = Array.from(byEra.keys())

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const currentEra = dynamic[dynamic.length - 1]?.era ?? null
  const isLoading = loadStatus === 'loading' || (loadStatus === 'indexing' && entries.length === 0)

  return (
    <>
      {selectedEntry && <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
      <main className="min-h-screen pt-11">

        <div className="border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-2xl mx-auto px-6 py-3">
            <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
              10,000 normies · ethereum mainnet · all history on-chain · cc0
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 pt-10 pb-6">
          <h1 className="font-mono font-bold leading-[0.9] mb-6"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 6rem)', color: 'var(--text)' }}>
            normies<br />chronicles
          </h1>
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '32rem' }}>
            a living record of the grid — every on-chain event shapes the world,
            every transformation writes history. fiction influenced by real decisions.
          </p>
        </div>

        {/* sticky nav: view toggle + search */}
        <div className="sticky top-11 z-40 border-b border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          <div className="max-w-2xl mx-auto px-6 flex items-center gap-0">
            <div className="flex items-center shrink-0" style={{ borderRight: '1px solid var(--border)' }}>
              <button onClick={() => setView('now')}
                className="font-mono text-xs py-3 pr-4 transition-colors"
                style={{ color: view === 'now' ? 'var(--text)' : 'var(--muted)', fontWeight: view === 'now' ? 700 : 400 }}>
                now
              </button>
              <span className="font-mono text-xs px-2" style={{ color: 'var(--border)' }}>/</span>
              <button onClick={() => setView('chronicle')}
                className="font-mono text-xs py-3 pl-2 pr-4 transition-colors"
                style={{ color: view === 'chronicle' ? 'var(--text)' : 'var(--muted)', fontWeight: view === 'chronicle' ? 700 : 400 }}>
                full chronicle
              </button>
            </div>
            {view === 'chronicle' ? (
              <input type="text" value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                placeholder={isLoading ? 'loading...' : 'search entries...'}
                disabled={isLoading}
                className="flex-1 bg-transparent font-mono text-xs py-3 pl-4 focus:outline-none disabled:cursor-not-allowed"
                style={{ color: 'var(--text)' }} />
            ) : currentEra ? (
              <p className="font-mono text-2xs flex-1 text-right pl-4" style={{ color: 'var(--muted)' }}>
                era: <span style={{ color: 'var(--text)' }}>{currentEra}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-10">
          {isLoading && <LoadingState status={indexStatus} />}

          {loadStatus === 'error' && (
            <div className="py-20 text-center">
              <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>the grid is silent</p>
              <p className="font-mono text-xs mb-4" style={{ color: 'var(--muted)' }}>could not load entries — try refreshing</p>
              <button onClick={() => { setLoadStatus('loading'); fetchStory() }}
                className="font-mono text-xs underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: 'var(--text)' }}>retry →</button>
            </div>
          )}

          {!isLoading && loadStatus !== 'error' && (
            <>
              {view === 'now' && (
                <NowView entries={entries} meta={meta} onSelect={setSelectedEntry} onReadAll={() => setView('chronicle')} />
              )}

              {view === 'chronicle' && (
                <>
                  {!search && genesisEntries.map(e => (
                    <ChronicleEntry key={e.id} entry={e} onSelect={setSelectedEntry} />
                  ))}

                  {search ? (
                    <>
                      {pageEntries.map(e => <ChronicleEntry key={e.id} entry={e} onSelect={setSelectedEntry} />)}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                          <button onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0) }}
                            disabled={page === 0} className="font-mono text-xs disabled:opacity-20 transition-opacity hover:opacity-60"
                            style={{ color: 'var(--text)' }}>← earlier</button>
                          <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{page + 1} / {totalPages}</span>
                          <button onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0) }}
                            disabled={page === totalPages - 1} className="font-mono text-xs disabled:opacity-20 transition-opacity hover:opacity-60"
                            style={{ color: 'var(--text)' }}>later →</button>
                        </div>
                      )}
                      {pageEntries.length === 0 && (
                        <div className="py-20 text-center">
                          <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>no records match</p>
                          <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>nothing found for &quot;{search}&quot;</p>
                        </div>
                      )}
                    </>
                  ) : (
                    eras.map(era => (
                      <EraSection key={era} era={era} entries={byEra.get(era)!} onSelect={setSelectedEntry} />
                    ))
                  )}
                </>
              )}
            </>
          )}
        </div>

        <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>normies chronicles · ethereum · cc0</p>
            <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs transition-opacity hover:opacity-60" style={{ color: 'var(--muted)' }}>@aster0x</a>
          </div>
        </footer>
      </main>
    </>
  )
}
