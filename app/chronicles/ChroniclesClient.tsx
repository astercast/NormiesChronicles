'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { StoryEntry } from '@/lib/storyGenerator'

function groupByEra(entries: StoryEntry[]) {
  const map = new Map<string, StoryEntry[]>()
  for (const e of entries) {
    if (!map.has(e.era)) map.set(e.era, [])
    map.get(e.era)!.push(e)
  }
  return map
}

// ─────────────────────────────────────────────────────────────────────────────
// AI WAR SUMMARY — calls /api/summary (server route, no CORS issues)
// Regenerates every 5 new chronicle entries via cache bucket key
// ─────────────────────────────────────────────────────────────────────────────
function WarSummary({ entries }: { entries: StoryEntry[] }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const cacheRef = useRef<{ key: string; text: string } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const dynamic = useMemo(() => entries.filter(e => e.eventType !== 'genesis'), [entries])
  const cacheKey = useMemo(() => `war-summary-v1-bucket${Math.floor(dynamic.length / 5)}`, [dynamic.length])

  useEffect(() => {
    if (!dynamic.length) return
    if (cacheRef.current?.key === cacheKey) { setSummary(cacheRef.current.text); return }

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true); setSummary(null)

    const recent = dynamic.slice(-40)
    const digest = recent.map(e => `ERA: ${e.era} | ${e.loreType} | "${e.headline}" — ${e.body.slice(0, 160)}`).join('\n')
    const currentEra = dynamic[dynamic.length - 1]?.era ?? 'Unknown'

    const prompt = `You are the Grand Chronicler recording the Normies War — a great conflict fought over the Grid, a contested canvas of territory where factions battle for dominance. Warriors sacrifice themselves to strengthen others. Commanders rise and fall. The war is real and ongoing.

Here are the ${dynamic.length} most recent chronicle entries, current era "${currentEra}":

${digest}

Write exactly 2 short paragraphs (3-4 sentences each) describing the current state of the war as living history. Use specific factions, regions, commanders from above. Write with dramatic weight — this is a war chronicle.

RULES: Never mention blockchain, pixels, wallets, transactions, token IDs. Pure narrative voice only. Reference specific names from the entries. End with what hangs in the balance.`

    fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: ctrl.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (ctrl.signal.aborted) return
        const text = data.text ?? ''
        if (text) { cacheRef.current = { key: cacheKey, text }; setSummary(text) }
      })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })

    return () => ctrl.abort()
  }, [cacheKey, dynamic])

  if (!dynamic.length) return null

  return (
    <div className="mb-10">
      <div className="mb-5" style={{ borderTop: '2px solid var(--text)' }} />
      <div className="flex items-start justify-between mb-4">
        <p className="font-mono text-2xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>dispatches from the front</p>
        <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>{dynamic.length} entries recorded</p>
      </div>
      {loading && (
        <div className="space-y-2 py-1">
          {[85, 72, 91, 68, 80].map((w, i) => (
            <div key={i} className="h-2.5 rounded-sm" style={{ background: 'var(--border)', width: `${w}%`, opacity: 0.6 }} />
          ))}
          <p className="font-mono text-2xs mt-3" style={{ color: 'var(--muted)' }}>the chronicler writes…</p>
        </div>
      )}
      {summary && !loading && (
        <div className="space-y-4">
          {summary.split('\n\n').filter(p => p.trim()).map((para, i) => (
            <p key={i} className="font-mono leading-relaxed" style={{ color: 'var(--text)', fontSize: '0.8rem', lineHeight: '1.9' }}>
              {para.trim()}
            </p>
          ))}
        </div>
      )}
      <div className="mt-6" style={{ borderBottom: '1px solid var(--border)' }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EntryModal({ entry, onClose }: { entry: StoryEntry; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="relative w-full max-w-xl overflow-y-auto"
        style={{ background: 'var(--bg)', border: '1px solid var(--text)', maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-base shrink-0">{entry.icon}</span>
            <div className="min-w-0">
              <p className="font-mono text-2xs uppercase tracking-widest truncate" style={{ color: 'var(--muted)' }}>
                {entry.era}
              </p>
              <p className="font-mono text-2xs uppercase tracking-widest truncate" style={{ color: 'var(--muted)' }}>
                {entry.loreType.replace(/_/g, ' ').toLowerCase()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="font-mono text-xs ml-4 shrink-0 transition-opacity hover:opacity-50"
            style={{ color: 'var(--muted)' }}>esc ×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <h2 className="font-mono font-bold leading-snug mb-5"
            style={{ color: 'var(--text)', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
            {entry.headline}
          </h2>
          <p className="font-mono leading-relaxed" style={{ color: 'var(--text)', fontSize: '0.78rem', lineHeight: '1.9' }}>
            {entry.body}
          </p>
        </div>

        {/* Source */}
        {entry.eventType !== 'genesis' && (
          <div className="px-6 pb-6" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '-0.5rem' }}>
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>on-chain source</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {[
                ['type', entry.sourceEvent.type],
                ['token', entry.sourceEvent.tokenId],
                ['block', entry.sourceEvent.blockNumber],
                ['count', entry.sourceEvent.count],
                ['rule', entry.sourceEvent.ruleApplied],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-mono text-2xs w-10 shrink-0" style={{ color: 'var(--muted)' }}>{k}</span>
                  <span className="font-mono text-2xs truncate" style={{ color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-1.5">
              <span className="font-mono text-2xs w-10 shrink-0" style={{ color: 'var(--muted)' }}>tx</span>
              <a href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`} target="_blank" rel="noopener noreferrer"
                className="font-mono text-2xs underline underline-offset-4 transition-opacity hover:opacity-60 truncate"
                style={{ color: 'var(--muted)' }}>
                {entry.sourceEvent.txHash.slice(0, 14)}…{entry.sourceEvent.txHash.slice(-6)}
              </a>
            </div>
            <p className="font-mono text-2xs mt-3 leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.7 }}>
              {entry.sourceEvent.ruleExplanation}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NOW VIEW — the front page of the war
// Layout: summary / stats bar / era timeline / latest dispatch / major battles
// ─────────────────────────────────────────────────────────────────────────────
function NowView({
  entries, meta, onSelect, onReadAll,
}: {
  entries: StoryEntry[]
  meta: { totalEvents: number; dynamicEntries: number; lastUpdated: string } | null
  onSelect: (e: StoryEntry) => void
  onReadAll: () => void
}) {
  const dynamic = entries.filter(e => e.eventType !== 'genesis')
  const latest = dynamic[dynamic.length - 1]
  const currentEra = latest?.era ?? '—'
  const byEra = groupByEra(dynamic)
  const eras = Array.from(byEra.keys())
  const maxCount = Math.max(...eras.map(era => byEra.get(era)!.length), 1)
  const featured = dynamic.filter(e => e.featured).slice(-8).reverse()

  return (
    <div>
      {/* AI-generated war summary */}
      <WarSummary entries={entries} />

      {/* Stats bar */}
      <div className="grid grid-cols-3 mb-10" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        {[
          ['current era', currentEra],
          ['on-chain events', meta?.totalEvents.toLocaleString() ?? '—'],
          ['chronicle entries', dynamic.length.toLocaleString()],
        ].map(([label, val], i) => (
          <div key={label} className="py-4 px-4"
            style={{ borderRight: i < 2 ? '1px solid var(--border)' : undefined }}>
            <p className="font-mono text-2xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
            <p className="font-mono text-xs font-bold leading-tight" style={{ color: 'var(--text)' }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Latest dispatch — the most recent entry, prominent */}
      {latest && (
        <div className="mb-10">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--muted)' }}>latest dispatch</p>
          <div
            className="p-5 cursor-pointer group transition-opacity hover:opacity-75"
            style={{ border: '1px solid var(--text)' }}
            onClick={() => onSelect(latest)}>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-lg">{latest.icon}</span>
              <div>
                <p className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                  {latest.era} · {latest.loreType.replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
            </div>
            <p className="font-mono font-bold leading-snug mb-3"
              style={{ color: 'var(--text)', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
              {latest.headline}
            </p>
            <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)', lineHeight: '1.75', fontSize: '0.75rem' }}>
              {latest.body.slice(0, 220)}{latest.body.length > 220 ? '…' : ''}
            </p>
            <p className="font-mono text-2xs mt-3 transition-opacity" style={{ color: 'var(--muted)' }}>
              read full entry →
            </p>
          </div>
        </div>
      )}

      {/* Era timeline */}
      <div className="mb-10">
        <p className="font-mono text-2xs uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--muted)' }}>war timeline</p>
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {eras.map((era, i) => {
            const isLatest = i === eras.length - 1
            const count = byEra.get(era)!.length
            const pct = Math.max(4, Math.round((count / maxCount) * 100))
            return (
              <div key={era} className="flex items-center gap-4 py-3"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: isLatest ? 'var(--text)' : 'var(--muted)', opacity: isLatest ? 1 : 0.3 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <p className="font-mono text-xs truncate"
                      style={{ color: isLatest ? 'var(--text)' : 'var(--muted)', fontWeight: isLatest ? 700 : 400 }}>
                      {era}
                      {isLatest && <span className="ml-2 font-normal text-2xs" style={{ color: 'var(--muted)' }}>← now</span>}
                    </p>
                    <p className="font-mono text-2xs shrink-0" style={{ color: 'var(--muted)' }}>{count}</p>
                  </div>
                  <div className="h-px" style={{ background: 'var(--border)' }}>
                    <div className="h-full transition-all"
                      style={{ width: `${pct}%`, background: isLatest ? 'var(--text)' : 'var(--muted)', opacity: isLatest ? 0.8 : 0.25 }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Major engagements */}
      {featured.length > 0 && (
        <div className="mb-10">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--muted)' }}>major engagements</p>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {featured.map(entry => (
              <button key={entry.id} onClick={() => onSelect(entry)}
                className="w-full text-left flex items-start gap-3 py-3 group transition-opacity hover:opacity-60"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="font-mono text-sm shrink-0 mt-0.5" style={{ color: 'var(--muted)' }}>{entry.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-bold leading-snug truncate" style={{ color: 'var(--text)' }}>
                    {entry.headline}
                  </p>
                  <p className="font-mono text-2xs mt-0.5" style={{ color: 'var(--muted)' }}>{entry.era}</p>
                </div>
                <span className="font-mono text-2xs shrink-0 mt-1" style={{ color: 'var(--muted)' }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={onReadAll}
        className="font-mono text-xs flex items-center gap-2 py-3 transition-opacity hover:opacity-60"
        style={{ color: 'var(--text)', borderTop: '1px solid var(--border)', width: '100%' }}>
        <span className="flex-1">read the full chronicle</span><span>→</span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHRONICLE ENTRY COMPONENTS
// Three visual modes: genesis primer / featured battle / standard entry
// ─────────────────────────────────────────────────────────────────────────────
function ChronicleEntry({ entry, onSelect, index }: { entry: StoryEntry; onSelect: (e: StoryEntry) => void; index?: number }) {
  if (entry.eventType === 'genesis') {
    return (
      <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="font-mono text-2xs uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--muted)' }}>
          {entry.era} · world primer
        </p>
        <h2 className="font-mono text-sm font-bold mb-3 leading-snug cursor-pointer transition-opacity hover:opacity-60"
          style={{ color: 'var(--text)' }} onClick={() => onSelect(entry)}>
          {entry.headline}
        </h2>
        <p className="font-mono leading-relaxed" style={{ color: 'var(--muted)', fontSize: '0.78rem', lineHeight: '1.85' }}>
          {entry.body}
        </p>
      </div>
    )
  }

  if (entry.featured) {
    return (
      <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-base">{entry.icon}</span>
          <span className="font-mono text-2xs uppercase tracking-[0.15em]" style={{ color: 'var(--muted)' }}>{entry.era}</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span className="font-mono text-2xs uppercase tracking-[0.1em] font-bold" style={{ color: 'var(--text)' }}>
            {entry.loreType.replace(/_/g, ' ').toLowerCase()}
          </span>
        </div>
        <h2 className="font-mono font-bold leading-snug mb-4 cursor-pointer transition-opacity hover:opacity-60"
          style={{ color: 'var(--text)', fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)' }}
          onClick={() => onSelect(entry)}>
          {entry.headline}
        </h2>
        <p className="font-mono leading-relaxed mb-3" style={{ color: 'var(--text)', fontSize: '0.78rem', lineHeight: '1.9' }}>
          {entry.body.slice(0, 300)}
          {entry.body.length > 300 && (
            <> <button onClick={() => onSelect(entry)}
              className="underline underline-offset-4 transition-opacity hover:opacity-50"
              style={{ color: 'var(--muted)' }}>continue reading</button></>
          )}
        </p>
      </div>
    )
  }

  // Standard entry — compact, inline, prose-style
  return (
    <div className="mb-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <span className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>{entry.icon}</span>
        <span className="font-mono text-2xs uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
          {entry.loreType.replace(/_/g, ' ').toLowerCase()}
        </span>
        <span style={{ color: 'var(--border)' }} className="font-mono text-2xs">·</span>
        <span className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>{entry.era}</span>
      </div>
      <button className="text-left w-full" onClick={() => onSelect(entry)}>
        <p className="font-mono leading-relaxed transition-opacity hover:opacity-60"
          style={{ color: 'var(--text)', fontSize: '0.77rem', lineHeight: '1.8' }}>
          <span className="font-bold">{entry.headline}. </span>
          <span style={{ color: 'var(--muted)' }}>
            {entry.body.slice(0, 160)}{entry.body.length > 160 ? '…' : ''}
          </span>
        </p>
      </button>
    </div>
  )
}

function EraSection({ era, entries, onSelect, defaultOpen }: {
  era: string; entries: StoryEntry[]; onSelect: (e: StoryEntry) => void; defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const featuredCount = entries.filter(e => e.featured).length
  return (
    <div className="mb-8">
      <button
        className="flex items-center gap-4 w-full text-left py-3 group"
        style={{ borderTop: '1px solid var(--border)', borderBottom: open ? '1px solid var(--border)' : undefined }}
        onClick={() => setOpen(o => !o)}>
        <div className="flex-1 flex items-baseline gap-3">
          <span className="font-mono text-2xs uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>era</span>
          <span className="font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>{era}</span>
          {featuredCount > 0 && (
            <span className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
              {featuredCount} major engagement{featuredCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>{entries.length}</span>
          <span className="font-mono text-2xs transition-opacity group-hover:opacity-60"
            style={{ color: 'var(--muted)' }}>{open ? '↑' : '↓'}</span>
        </div>
      </button>
      {open && (
        <div className="pt-6">
          {entries.map((e, i) => <ChronicleEntry key={e.id} entry={e} onSelect={onSelect} index={i} />)}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING STATE
// ─────────────────────────────────────────────────────────────────────────────
function LoadingState({ status }: { status: string }) {
  return (
    <div className="py-24 flex flex-col items-center gap-6 text-center">
      <div className="w-48 h-px overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="scan-bar h-full w-16" style={{ background: 'var(--text)' }} />
      </div>
      <div>
        <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
          scanning the grid
          <span className="dot-1 inline-block ml-0.5">.</span>
          <span className="dot-2 inline-block">.</span>
          <span className="dot-3 inline-block">.</span>
        </p>
        <p className="font-mono text-xs mb-1" style={{ color: 'var(--muted)' }}>{status}</p>
        <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>reading ethereum mainnet — first load takes a moment</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function ChroniclesClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // View state lives in URL — browser back/forward works correctly
  const viewParam = searchParams.get('view') as 'now' | 'chronicle' | null
  const view = viewParam === 'chronicle' ? 'chronicle' : 'now'

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
  const PAGE_SIZE = 30

  const setView = useCallback((v: 'now' | 'chronicle') => {
    const params = new URLSearchParams(searchParams.toString())
    if (v === 'now') params.delete('view')
    else params.set('view', v)
    router.push(`/chronicles?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const triggerIndex = useCallback(async () => {
    if (indexingRef.current) return
    indexingRef.current = true
    try {
      const res = await fetch('/api/index', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (mountedRef.current) setIndexStatus(`indexed ${(data.events ?? 0).toLocaleString()} events`)
      }
    } catch { /* swallow */ } finally { indexingRef.current = false }
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
      cancelled = true; mountedRef.current = false
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [fetchStory])

  useEffect(() => { setPage(0) }, [search, view])

  const dynamic = useMemo(() => entries.filter(e => e.eventType !== 'genesis'), [entries])
  const genesis = useMemo(() => entries.filter(e => e.eventType === 'genesis'), [entries])

  const filtered = useMemo(() => {
    if (!search.trim()) return dynamic
    const q = search.toLowerCase()
    return dynamic.filter(e =>
      e.headline.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      e.era.toLowerCase().includes(q) ||
      e.loreType.toLowerCase().includes(q)
    )
  }, [dynamic, search])

  const byEra = useMemo(() => groupByEra(filtered), [filtered])
  const eras = Array.from(byEra.keys())
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const isLoading = loadStatus === 'loading' || (loadStatus === 'indexing' && entries.length === 0)

  return (
    <>
      {selectedEntry && <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
      <main className="min-h-screen pt-11">

        {/* Subheader bar */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto px-6 py-3">
            <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
              10,000 normies · ethereum mainnet · fully on-chain · cc0
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="max-w-2xl mx-auto px-6 pt-10 pb-6">
          <h1 className="font-mono font-bold leading-[0.88] mb-6"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 6rem)', color: 'var(--text)' }}>
            normies<br />chronicles
          </h1>
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '30rem' }}>
            a war record written by the grid itself — every on-chain event shapes the conflict.
            fiction forged from real decisions.
          </p>
        </div>

        {/* Sticky nav: now / chronicle / search */}
        <div className="sticky top-11 z-40" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div className="max-w-2xl mx-auto px-6 flex items-center">
            <div className="flex items-center shrink-0" style={{ borderRight: '1px solid var(--border)' }}>
              {(['now', 'chronicle'] as const).map((v, i) => (
                <span key={v} className="flex items-center">
                  {i > 0 && <span className="font-mono text-xs px-2" style={{ color: 'var(--border)' }}>/</span>}
                  <button onClick={() => setView(v)}
                    className="font-mono text-xs py-3 transition-colors"
                    style={{
                      color: view === v ? 'var(--text)' : 'var(--muted)',
                      fontWeight: view === v ? 700 : 400,
                      paddingRight: i === 0 ? '0.5rem' : '1rem',
                      paddingLeft: i === 1 ? '0' : undefined,
                    }}>
                    {v === 'now' ? 'now' : 'full chronicle'}
                  </button>
                </span>
              ))}
            </div>

            {view === 'chronicle' ? (
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isLoading ? 'loading…' : 'search entries…'}
                disabled={isLoading}
                className="flex-1 bg-transparent font-mono text-xs py-3 pl-4 focus:outline-none disabled:cursor-not-allowed"
                style={{ color: 'var(--text)' }} />
            ) : (
              <p className="font-mono text-2xs flex-1 text-right pl-4" style={{ color: 'var(--muted)' }}>
                {dynamic.length > 0 ? `${dynamic.length} entries` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto px-6 py-10">
          {isLoading && <LoadingState status={indexStatus} />}

          {loadStatus === 'error' && (
            <div className="py-20 text-center">
              <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>the grid is silent</p>
              <p className="font-mono text-xs mb-4" style={{ color: 'var(--muted)' }}>could not load chronicle</p>
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
                  {/* Genesis primers — always shown, not searchable */}
                  {!search && genesis.map(e => (
                    <ChronicleEntry key={e.id} entry={e} onSelect={setSelectedEntry} />
                  ))}

                  {search ? (
                    /* Flat paginated search results */
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
                          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{search}&quot;
                        </p>
                        <button onClick={() => setSearch('')} className="font-mono text-2xs transition-opacity hover:opacity-60"
                          style={{ color: 'var(--muted)' }}>clear ×</button>
                      </div>
                      {pageEntries.map(e => <ChronicleEntry key={e.id} entry={e} onSelect={setSelectedEntry} />)}
                      {pageEntries.length === 0 && (
                        <div className="py-16 text-center">
                          <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>no records match</p>
                          <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>nothing found for &quot;{search}&quot;</p>
                        </div>
                      )}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-10 pt-6"
                          style={{ borderTop: '1px solid var(--border)' }}>
                          <button onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0) }}
                            disabled={page === 0}
                            className="font-mono text-xs disabled:opacity-20 transition-opacity hover:opacity-60"
                            style={{ color: 'var(--text)' }}>← earlier</button>
                          <span className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>{page + 1} / {totalPages}</span>
                          <button onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0) }}
                            disabled={page === totalPages - 1}
                            className="font-mono text-xs disabled:opacity-20 transition-opacity hover:opacity-60"
                            style={{ color: 'var(--text)' }}>later →</button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Era-grouped chronicle — latest era open, rest collapsed */
                    eras.map((era, i) => (
                      <EraSection
                        key={era} era={era}
                        entries={byEra.get(era)!}
                        onSelect={setSelectedEntry}
                        defaultOpen={i === eras.length - 1}
                      />
                    ))
                  )}
                </>
              )}
            </>
          )}
        </div>

        <footer style={{ borderTop: '1px solid var(--border)' }}>
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
