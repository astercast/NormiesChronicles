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
// AI WAR SUMMARY HOOK
// Fires exactly once per 5-entry bucket. Stable ref prevents re-fires.
// The API route reads process.env.ANTHROPIC_API_KEY server-side.
// ─────────────────────────────────────────────────────────────────────────────
function buildStoryDigest(entries: StoryEntry[]): string {
  const total = entries.length
  if (total === 0) return ''

  // Sample evenly across the whole timeline for full story arc
  const step = Math.max(1, Math.floor(total / 50))
  const sampled = entries.filter((_, i) => i % step === 0)

  // Always include featured/major entries
  const featured = entries.filter(e => e.featured)

  // Always include the last 25 for recency
  const recent = entries.slice(-25)

  // Merge, deduplicate, preserve order
  const seen = new Set<string>()
  const merged: StoryEntry[] = []
  for (const e of [...featured, ...sampled, ...recent]) {
    if (!seen.has(e.id)) {
      seen.add(e.id)
      merged.push(e)
    }
  }
  merged.sort((a, b) => entries.indexOf(a) - entries.indexOf(b))

  return merged
    .map(e => `[${e.era}] ${e.headline} — ${e.body.slice(0, 130)}`)
    .join('\n')
}

function useWarSummary(dynamic: StoryEntry[]) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const lastFiredBucket = useRef<number>(-1)

  useEffect(() => {
    if (dynamic.length === 0) return
    const bucket = Math.floor(dynamic.length / 5)
    if (bucket === lastFiredBucket.current) return
    lastFiredBucket.current = bucket

    setLoading(true)
    setError(false)

    const digest = buildStoryDigest(dynamic)
    const currentEra = dynamic[dynamic.length - 1]?.era ?? 'Unknown'
    const totalEntries = dynamic.length

    const prompt = `You are the Grand Chronicler of the Normies — keeper of the living record of the Grid, a vast pixel world of ten thousand faces. The Grid is a real place with factions, territories, sacred relics, sacrifices, and a history still being written.

You have ${totalEntries} chronicle entries spanning the full story so far (current era: "${currentEra}"). Below is a digest of key moments sampled from across the ENTIRE chronicle — from earliest to most recent:

${digest}

Write 3 paragraphs summarizing the FULL story so far — where it began, what has unfolded across the whole arc, and where things stand now. Write as a chronicler from inside the world: present tense, atmospheric, specific. Use the faction names, region names, and events you see. Capture the sweep of the whole story, not just the recent. Never mention blockchain, pixels, wallets, transactions, or anything technical. End with what remains unresolved.`

    fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
      .then(async r => {
        const data = await r.json()
        if (data.text) setSummary(data.text)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [dynamic])

  return { summary, loading, error }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EntryModal({ entry, onClose }: { entry: StoryEntry; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', h)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div className="w-full max-w-lg overflow-y-auto"
        style={{ background: 'var(--bg)', border: '1px solid var(--text)', maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="font-mono text-2xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted)' }}>
              {entry.era}
            </p>
            <p className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              {entry.loreType.replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
          <button onClick={onClose} className="font-mono text-xs hover:opacity-50 ml-4 shrink-0"
            style={{ color: 'var(--muted)' }}>× close</button>
        </div>
        <div className="px-5 py-6">
          <div className="flex items-center gap-2 mb-4">
            <span style={{ fontSize: '1.5rem' }}>{entry.icon}</span>
          </div>
          <h2 className="font-mono font-bold leading-snug mb-5"
            style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
            {entry.headline}
          </h2>
          <p className="font-mono leading-relaxed"
            style={{ color: 'var(--text)', fontSize: '0.77rem', lineHeight: '1.95' }}>
            {entry.body}
          </p>
        </div>
        {entry.eventType !== 'genesis' && (
          <div className="px-5 pb-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="font-mono text-2xs uppercase tracking-widest mb-3"
              style={{ color: 'var(--muted)' }}>on-chain source</p>
            <div className="space-y-1.5 mb-3">
              {([
                ['event', entry.sourceEvent.type],
                ['token', entry.sourceEvent.tokenId],
                ['block', entry.sourceEvent.blockNumber],
                ['rule', entry.sourceEvent.ruleApplied],
              ] as [string,string][]).map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="font-mono text-2xs w-10 shrink-0" style={{ color: 'var(--muted)' }}>{k}</span>
                  <span className="font-mono text-2xs" style={{ color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
              <div className="flex gap-3">
                <span className="font-mono text-2xs w-10 shrink-0" style={{ color: 'var(--muted)' }}>tx</span>
                <a href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-mono text-2xs underline underline-offset-2 hover:opacity-60"
                  style={{ color: 'var(--muted)' }}>
                  {entry.sourceEvent.txHash.slice(0, 10)}…{entry.sourceEvent.txHash.slice(-6)}
                </a>
              </div>
            </div>
            <p className="font-mono text-2xs leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.65 }}>
              {entry.sourceEvent.ruleExplanation}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NOW VIEW
// Layout concept: newspaper front page
//   TOP      — masthead + AI dispatch (the story of where the war stands)
//   MIDDLE   — hero story left / sidebar right (latest + recent 4)
//   BOTTOM   — horizontal strip of major battles + era map
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
  const { summary, loading: summaryLoading, error: summaryError } = useWarSummary(dynamic)

  const latest = dynamic[dynamic.length - 1]
  const recent4 = dynamic.slice(-5, -1).reverse()
  const featured = dynamic.filter(e => e.featured).slice(-6).reverse()
  const byEra = groupByEra(dynamic)
  const eras = Array.from(byEra.keys())
  const currentEra = latest?.era ?? '—'
  const maxEraCount = Math.max(...eras.map(e => byEra.get(e)!.length), 1)

  return (
    <div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MASTHEAD — war dispatch header
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="mb-8 pb-7" style={{ borderBottom: '3px double var(--text)' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="font-mono text-2xs uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--muted)' }}>
              war dispatch
            </p>
            <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
              era: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{currentEra}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
              {meta?.totalEvents.toLocaleString() ?? '—'} events
            </p>
            <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
              {dynamic.length} entries · {eras.length} era{eras.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* AI summary — the centrepiece */}
        {summaryLoading && (
          <div className="space-y-2">
            {[88, 74, 91, 67, 83, 70].map((w, i) => (
              <div key={i} className="h-3 rounded-sm"
                style={{ background: 'var(--border)', width: `${w}%`,
                  animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
            ))}
            <p className="font-mono text-2xs mt-2" style={{ color: 'var(--muted)' }}>
              the chronicler writes…
            </p>
          </div>
        )}
        {!summaryLoading && summary && (
          <div className="space-y-4">
            {summary.split('\n\n').filter(p => p.trim()).slice(0, 2).map((para, i) => (
              <p key={i} className="font-mono leading-[1.95]"
                style={{ color: 'var(--text)', fontSize: '0.8rem' }}>
                {i === 0 ? (
                  <>
                    <span style={{
                      fontSize: '2.8rem', lineHeight: 1, float: 'left',
                      marginRight: '0.1em', marginBottom: '-0.1em',
                      fontWeight: 700, color: 'var(--text)'
                    }}>
                      {para.trim()[0]}
                    </span>
                    {para.trim().slice(1)}
                  </>
                ) : para.trim()}
              </p>
            ))}
          </div>
        )}
        {!summaryLoading && !summary && !summaryError && dynamic.length > 0 && (
          <p className="font-mono leading-relaxed"
            style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            The war is young. The chronicle is being written. Return as events accumulate.
          </p>
        )}
        {!summaryLoading && summaryError && (
          <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
            dispatch unavailable — set ANTHROPIC_API_KEY in Vercel env vars to enable
          </p>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO + SIDEBAR — two column
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {latest && (
        <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* On mobile: stack. On sm+: two columns */}
          <div className="flex flex-col sm:flex-row gap-0">

            {/* LEFT — hero latest entry */}
            <div className="flex-1 sm:pr-6"
              style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem',
                       marginBottom: '1.5rem' }}
              // on sm+: remove bottom border, add right border via style below
            >
              <div className="sm:hidden" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <HeroEntry entry={latest} onSelect={onSelect} />
              </div>
              <div className="hidden sm:block" style={{ borderRight: '1px solid var(--border)', paddingRight: '1.5rem' }}>
                <HeroEntry entry={latest} onSelect={onSelect} />
              </div>
            </div>

            {/* RIGHT — 4 recent entries as compact list */}
            <div className="sm:w-48 sm:pl-6 shrink-0">
              <p className="font-mono text-2xs uppercase tracking-[0.2em] mb-3"
                style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                recent
              </p>
              <div className="space-y-0">
                {recent4.map(entry => (
                  <button key={entry.id} onClick={() => onSelect(entry)}
                    className="w-full text-left py-2.5 group hover:opacity-60 transition-opacity"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex gap-2 items-start">
                      <span className="shrink-0 mt-0.5" style={{ fontSize: '0.85rem' }}>{entry.icon}</span>
                      <div className="min-w-0">
                        <p className="font-mono text-2xs font-bold leading-snug"
                          style={{ color: 'var(--text)' }}>
                          {entry.headline.length > 52
                            ? entry.headline.slice(0, 52) + '…'
                            : entry.headline}
                        </p>
                        <p className="font-mono text-2xs mt-0.5" style={{ color: 'var(--muted)' }}>
                          {entry.loreType.replace(/_/g, ' ').toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MAJOR ENGAGEMENTS + ERA MAP — bottom section
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col sm:flex-row gap-0">

        {/* Major engagements */}
        {featured.length > 0 && (
          <div className="flex-1 sm:pr-6"
            style={{ borderRight: featured.length > 0 ? '1px solid var(--border)' : undefined,
                     paddingRight: '1.5rem' }}>
            <p className="font-mono text-2xs uppercase tracking-[0.2em] mb-3 pb-2"
              style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
              major engagements
            </p>
            <div>
              {featured.slice(0, 5).map(entry => (
                <button key={entry.id} onClick={() => onSelect(entry)}
                  className="w-full text-left flex gap-3 py-3 hover:opacity-60 transition-opacity"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.9rem', lineHeight: 1.4, paddingTop: '0.1rem' }}>
                    {entry.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold leading-snug" style={{ color: 'var(--text)' }}>
                      {entry.headline}
                    </p>
                    <p className="font-mono text-2xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {entry.era} · {entry.loreType.replace(/_/g, ' ').toLowerCase()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Era map */}
        <div className="sm:w-44 sm:pl-6 shrink-0 mt-8 sm:mt-0">
          <p className="font-mono text-2xs uppercase tracking-[0.2em] mb-3 pb-2"
            style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
            eras of the war
          </p>
          <div>
            {eras.map((era, i) => {
              const isLatest = i === eras.length - 1
              const count = byEra.get(era)!.length
              const pct = Math.max(6, Math.round((count / maxEraCount) * 100))
              return (
                <div key={era} className="py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: isLatest ? 'var(--text)' : 'var(--border)' }} />
                    <p className="font-mono text-2xs flex-1 leading-tight"
                      style={{ color: isLatest ? 'var(--text)' : 'var(--muted)',
                               fontWeight: isLatest ? 700 : 400 }}>
                      {era}
                      {isLatest && <span className="ml-1 font-normal opacity-60"> ←</span>}
                    </p>
                    <p className="font-mono text-2xs shrink-0" style={{ color: 'var(--muted)' }}>{count}</p>
                  </div>
                  <div className="h-px ml-3.5" style={{ background: 'var(--border)' }}>
                    <div className="h-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: isLatest ? 'var(--text)' : 'var(--muted)',
                        opacity: isLatest ? 0.8 : 0.3
                      }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          READ FULL CHRONICLE CTA
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="mt-10">
        <button onClick={onReadAll}
          className="w-full font-mono text-xs py-4 px-5 flex items-center justify-between
                     hover:opacity-70 transition-opacity"
          style={{ border: '1px solid var(--text)' }}>
          <div>
            <span style={{ fontWeight: 700 }}>read the full chronicle</span>
            <span className="ml-2" style={{ color: 'var(--muted)' }}>
              — {dynamic.length} entries across {eras.length} era{eras.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}

// Hero entry — the big lead story
function HeroEntry({ entry, onSelect }: { entry: StoryEntry; onSelect: (e: StoryEntry) => void }) {
  return (
    <div>
      <p className="font-mono text-2xs uppercase tracking-[0.2em] mb-4 pb-2"
        style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
        latest from the front
      </p>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: '1.4rem' }}>{entry.icon}</span>
        <p className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          {entry.loreType.replace(/_/g, ' ').toLowerCase()}
        </p>
      </div>
      <button className="text-left w-full group" onClick={() => onSelect(entry)}>
        <h2 className="font-mono font-bold leading-snug mb-4 group-hover:opacity-60 transition-opacity"
          style={{ color: 'var(--text)', fontSize: 'clamp(0.92rem, 2.5vw, 1.1rem)' }}>
          {entry.headline}
        </h2>
        <p className="font-mono leading-relaxed group-hover:opacity-60 transition-opacity"
          style={{ color: 'var(--text)', fontSize: '0.77rem', lineHeight: '1.9' }}>
          {entry.body.slice(0, 280)}
          {entry.body.length > 280 && <span style={{ color: 'var(--muted)' }}>…</span>}
        </p>
        <p className="font-mono text-2xs mt-3" style={{ color: 'var(--muted)' }}>read full entry →</p>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHRONICLE VIEW — the full record
// Three visual registers: genesis primer / featured / standard
// ─────────────────────────────────────────────────────────────────────────────
function ChronicleEntry({ entry, onSelect }: { entry: StoryEntry; onSelect: (e: StoryEntry) => void }) {
  if (entry.eventType === 'genesis') {
    return (
      <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="font-mono text-2xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
          world primer · {entry.era}
        </p>
        <button className="w-full text-left" onClick={() => onSelect(entry)}>
          <h2 className="font-mono text-sm font-bold mb-3 leading-snug hover:opacity-60 transition-opacity"
            style={{ color: 'var(--text)' }}>
            {entry.headline}
          </h2>
        </button>
        <p className="font-mono leading-relaxed" style={{ color: 'var(--muted)', fontSize: '0.77rem', lineHeight: '1.9' }}>
          {entry.body}
        </p>
      </div>
    )
  }

  if (entry.featured) {
    return (
      <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: '1rem' }}>{entry.icon}</span>
          <span className="font-mono text-2xs uppercase tracking-widest font-bold" style={{ color: 'var(--text)' }}>
            {entry.loreType.replace(/_/g, ' ').toLowerCase()}
          </span>
          <span className="font-mono text-2xs" style={{ color: 'var(--border)' }}>·</span>
          <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            {entry.era}
          </span>
        </div>
        <button className="w-full text-left" onClick={() => onSelect(entry)}>
          <h2 className="font-mono font-bold leading-snug mb-4 hover:opacity-60 transition-opacity"
            style={{ color: 'var(--text)', fontSize: 'clamp(0.88rem, 2vw, 1rem)' }}>
            {entry.headline}
          </h2>
        </button>
        <p className="font-mono leading-relaxed" style={{ color: 'var(--text)', fontSize: '0.77rem', lineHeight: '1.92' }}>
          {entry.body.slice(0, 340)}
          {entry.body.length > 340 && (
            <button onClick={() => onSelect(entry)}
              className="underline underline-offset-2 hover:opacity-50 ml-1"
              style={{ color: 'var(--muted)' }}>more →</button>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <button className="w-full text-left" onClick={() => onSelect(entry)}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-mono text-2xs shrink-0" style={{ color: 'var(--muted)' }}>{entry.icon}</span>
          <span className="font-mono text-2xs uppercase tracking-widest shrink-0" style={{ color: 'var(--muted)' }}>
            {entry.loreType.replace(/_/g, ' ').toLowerCase()}
          </span>
        </div>
        <p className="font-mono leading-relaxed hover:opacity-60 transition-opacity"
          style={{ color: 'var(--text)', fontSize: '0.76rem', lineHeight: '1.85' }}>
          <span className="font-bold">{entry.headline}. </span>
          <span style={{ color: 'var(--muted)' }}>
            {entry.body.slice(0, 150)}{entry.body.length > 150 ? '…' : ''}
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
    <div className="mb-2">
      <button className="w-full text-left flex items-center gap-3 py-3 group"
        style={{ borderTop: '1px solid var(--border)' }}
        onClick={() => setOpen(o => !o)}>
        <span className="font-mono text-2xs uppercase tracking-widest shrink-0" style={{ color: 'var(--muted)' }}>
          era
        </span>
        <span className="font-mono text-xs font-bold flex-1 text-left" style={{ color: 'var(--text)' }}>
          {era}
        </span>
        {featuredCount > 0 && (
          <span className="font-mono text-2xs hidden sm:inline" style={{ color: 'var(--muted)' }}>
            {featuredCount} major ·
          </span>
        )}
        <span className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
          {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
        </span>
        <span className="font-mono text-2xs group-hover:opacity-50 transition-opacity w-3 text-right"
          style={{ color: 'var(--muted)' }}>
          {open ? '↑' : '↓'}
        </span>
      </button>
      {open && (
        <div className="pt-5 pb-3">
          {entries.map(e => <ChronicleEntry key={e.id} entry={e} onSelect={onSelect} />)}
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
    <div className="py-24 text-center flex flex-col items-center gap-5">
      <div className="relative w-32 h-px" style={{ background: 'var(--border)' }}>
        <div className="absolute inset-y-0 scan-bar w-10" style={{ background: 'var(--text)' }} />
      </div>
      <div>
        <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
          scanning the grid
          <span className="dot-1 inline-block">.</span>
          <span className="dot-2 inline-block">.</span>
          <span className="dot-3 inline-block">.</span>
        </p>
        <p className="font-mono text-xs mb-1" style={{ color: 'var(--muted)' }}>{status}</p>
        <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>reading ethereum — first load takes a moment</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function ChroniclesClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') === 'chronicle' ? 'chronicle' : 'now'

  const [entries, setEntries] = useState<StoryEntry[]>([])
  const [meta, setMeta] = useState<{ totalEvents: number; dynamicEntries: number; lastUpdated: string } | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'indexing' | 'done' | 'error'>('loading')
  const [indexStatus, setIndexStatus] = useState('scanning ethereum mainnet...')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<StoryEntry | null>(null)

  const indexingRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const PAGE_SIZE = 30

  const setView = useCallback((v: 'now' | 'chronicle') => {
    const p = new URLSearchParams(searchParams.toString())
    if (v === 'now') p.delete('view')
    else p.set('view', v)
    router.push(`/chronicles?${p.toString()}`, { scroll: false })
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
    } catch { /* swallow */ }
    finally { indexingRef.current = false }
  }, [])

  const fetchStory = useCallback(async () => {
    try {
      const res = await fetch('/api/story', { cache: 'no-store' })
      if (!res.ok) throw new Error()
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
  const eras = useMemo(() => Array.from(groupByEra(dynamic).keys()), [dynamic])

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

  const byEraFiltered = useMemo(() => groupByEra(filtered), [filtered])
  const erasFiltered = Array.from(byEraFiltered.keys())
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const isLoading = loadStatus === 'loading' || (loadStatus === 'indexing' && entries.length === 0)

  return (
    <>
      {selected && <EntryModal entry={selected} onClose={() => setSelected(null)} />}

      <main className="min-h-screen pt-11">
        {/* Subheader */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto px-6 py-2.5">
            <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
              10,000 normies · ethereum mainnet · fully on-chain · cc0
            </p>
          </div>
        </div>

        {/* Page title */}
        <div className="max-w-2xl mx-auto px-6 pt-8 pb-5">
          <h1 className="font-mono font-bold leading-[0.88] mb-4"
            style={{ fontSize: 'clamp(3.2rem, 9vw, 5.5rem)', color: 'var(--text)' }}>
            normies<br />chronicles
          </h1>
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '28rem' }}>
            a living war record — every on-chain event shapes the conflict invisibly.
            fiction forged from real decisions.
          </p>
        </div>

        {/* Sticky nav bar */}
        <div className="sticky top-11 z-40"
          style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div className="max-w-2xl mx-auto px-6 flex items-center h-10">
            {/* View tabs */}
            <div className="flex items-center shrink-0 h-full" style={{ borderRight: '1px solid var(--border)' }}>
              <button onClick={() => setView('now')}
                className="font-mono text-xs pr-4 h-full transition-colors"
                style={{ color: view === 'now' ? 'var(--text)' : 'var(--muted)', fontWeight: view === 'now' ? 700 : 400 }}>
                now
              </button>
              <button onClick={() => setView('chronicle')}
                className="font-mono text-xs pl-3 pr-4 h-full transition-colors"
                style={{ color: view === 'chronicle' ? 'var(--text)' : 'var(--muted)', fontWeight: view === 'chronicle' ? 700 : 400 }}>
                full chronicle
              </button>
            </div>

            {/* Right side: search or stats */}
            {view === 'chronicle' ? (
              <div className="flex-1 flex items-center pl-4 h-full">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="search the war record…"
                  disabled={isLoading}
                  className="w-full bg-transparent font-mono text-xs focus:outline-none disabled:opacity-40"
                  style={{ color: 'var(--text)' }}
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="font-mono text-2xs shrink-0 hover:opacity-60 ml-2"
                    style={{ color: 'var(--muted)' }}>×</button>
                )}
              </div>
            ) : (
              <p className="font-mono text-2xs flex-1 text-right"
                style={{ color: 'var(--muted)' }}>
                {!isLoading && dynamic.length > 0
                  ? `${dynamic.length} entries · ${eras.length} era${eras.length !== 1 ? 's' : ''}`
                  : ''}
              </p>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="max-w-2xl mx-auto px-6 py-10">

          {isLoading && <LoadingState status={indexStatus} />}

          {loadStatus === 'error' && (
            <div className="py-20 text-center">
              <p className="font-mono text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>the grid is silent</p>
              <p className="font-mono text-xs mb-5" style={{ color: 'var(--muted)' }}>could not connect to the chronicle</p>
              <button onClick={() => { setLoadStatus('loading'); fetchStory() }}
                className="font-mono text-xs underline underline-offset-4 hover:opacity-60"
                style={{ color: 'var(--text)' }}>retry →</button>
            </div>
          )}

          {!isLoading && loadStatus !== 'error' && (
            <>
              {view === 'now' && (
                <NowView
                  entries={entries}
                  meta={meta}
                  onSelect={setSelected}
                  onReadAll={() => setView('chronicle')}
                />
              )}

              {view === 'chronicle' && (
                <>
                  {/* Genesis primers — always at top, not searchable */}
                  {!search && genesis.map(e => (
                    <ChronicleEntry key={e.id} entry={e} onSelect={setSelected} />
                  ))}

                  {search ? (
                    /* Flat paginated search results */
                    <div>
                      <p className="font-mono text-2xs mb-5" style={{ color: 'var(--muted)' }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{search}&quot;
                      </p>
                      {pageEntries.map(e => <ChronicleEntry key={e.id} entry={e} onSelect={setSelected} />)}
                      {pageEntries.length === 0 && (
                        <div className="py-16 text-center">
                          <p className="font-mono font-bold mb-2" style={{ color: 'var(--text)' }}>no records match</p>
                          <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>try a different search</p>
                        </div>
                      )}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-8 mt-4"
                          style={{ borderTop: '1px solid var(--border)' }}>
                          <button disabled={page === 0}
                            onClick={() => { setPage(p => p - 1); window.scrollTo(0,0) }}
                            className="font-mono text-xs disabled:opacity-20 hover:opacity-60"
                            style={{ color: 'var(--text)' }}>← earlier</button>
                          <span className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>
                            {page + 1} / {totalPages}
                          </span>
                          <button disabled={page === totalPages - 1}
                            onClick={() => { setPage(p => p + 1); window.scrollTo(0,0) }}
                            className="font-mono text-xs disabled:opacity-20 hover:opacity-60"
                            style={{ color: 'var(--text)' }}>later →</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Era-grouped — latest open by default */
                    <div style={{ borderBottom: '1px solid var(--border)' }}>
                      {erasFiltered.map((era, i) => (
                        <EraSection
                          key={era}
                          era={era}
                          entries={byEraFiltered.get(era)!}
                          onSelect={setSelected}
                          defaultOpen={i === erasFiltered.length - 1}
                        />
                      ))}
                    </div>
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
              className="font-mono text-xs hover:opacity-60 transition-opacity"
              style={{ color: 'var(--muted)' }}>@aster0x</a>
          </div>
        </footer>
      </main>
    </>
  )
}
