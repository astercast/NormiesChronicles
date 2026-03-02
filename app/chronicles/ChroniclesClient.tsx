'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import type { StoryEntry, CharacterKey } from '@/lib/storyGenerator'
import { CHARACTERS } from '@/lib/storyGenerator'
import { WarGrid } from '@/components/WarGrid'

// ── helpers ───────────────────────────────────────────────────────────────────

function groupByEra(entries: StoryEntry[]) {
  const map = new Map<string, StoryEntry[]>()
  for (const e of entries) {
    if (!map.has(e.era)) map.set(e.era, [])
    map.get(e.era)!.push(e)
  }
  return map
}

const FEATURED_LORE = new Set([
  'SIGNAL_SURGE', 'ERA_SHIFT', 'THE_READING', 'DEEP_READING',
  'DEPARTURE', 'RELIC_FOUND', 'CONVERGENCE', 'LONG_DARK',
])

// ── CHARACTER SUMMARY ─────────────────────────────────────────────────────────
// Computed directly from entries — no AI, no hallucination.

interface CharSummary {
  key: string
  name: string
  title: string
  acts: number
  majorActs: number
  eras: string[]
  lastZone: string
}

function buildCharSummaries(entries: StoryEntry[]): CharSummary[] {
  const dyn = entries.filter(e => e.eventType !== 'genesis')
  const map = new Map<string, CharSummary>()

  for (const e of dyn) {
    const key = (e.activeCharacter as string) ?? 'CAST'
    const char = CHARACTERS[key as keyof typeof CHARACTERS]
    if (!char) continue
    if (!map.has(key)) {
      map.set(key, { key, name: char.name, title: char.title, acts: 0, majorActs: 0, eras: [], lastZone: '' })
    }
    const s = map.get(key)!
    s.acts++
    if (e.featured) s.majorActs++
    if (!s.eras.includes(e.era)) s.eras.push(e.era)
    if (e.visualState?.dominantZone) s.lastZone = e.visualState.dominantZone
  }

  return Array.from(map.values()).sort((a, b) => b.acts - a.acts)
}

// ── AI SUMMARY — sends the FULL story digest to the AI ────────────────────────

function buildAIPrompt(entries: StoryEntry[]): string {
  const dyn = entries.filter(e => e.eventType !== 'genesis')
  if (dyn.length < 3) return ''

  const summaries = buildCharSummaries(dyn)
  const eras = [...new Set(dyn.map(e => e.era))]
  const currentEra = eras[eras.length - 1]
  const departures = dyn.filter(e => e.loreType === 'DEPARTURE').length
  const surges = dyn.filter(e => e.loreType === 'SIGNAL_SURGE').length
  const convergences = dyn.filter(e => e.loreType === 'CONVERGENCE').length
  const total = dyn.length

  // Character standing
  const charLines = summaries.map(s =>
    `- ${s.name} (${s.title}): ${s.acts} acts across ${s.eras.join(', ')}, last at ${s.lastZone || 'the Grid'}${s.majorActs > 0 ? `, ${s.majorActs} major moments` : ''}`
  ).join('\n')

  // Recent momentum (last 10)
  const recentDyn = dyn.slice(-10)
  const recentSummaries = buildCharSummaries(recentDyn)
  const recentLines = recentSummaries.slice(0, 3).map(s =>
    `${s.name}: ${s.acts} of last ${recentDyn.length}`
  ).join(', ')

  // Key story events — every featured or major beat across the full chronicle
  const keyEvents = dyn
    .filter(e => e.featured || ['ERA_SHIFT', 'CONVERGENCE', 'DEPARTURE', 'THE_READING', 'DEEP_READING', 'LONG_DARK'].includes(e.loreType))
    .map(e => {
      const c = e.activeCharacter ? CHARACTERS[e.activeCharacter as keyof typeof CHARACTERS] : null
      return `[${e.era}] ${c?.name ?? '?'} — ${e.headline}: ${e.body.slice(0, 120)}`
    })
    .join('\n')

  // Full entry sequence — headline only for breadth
  const allHeadlines = dyn.map((e, i) => {
    const c = e.activeCharacter ? CHARACTERS[e.activeCharacter as keyof typeof CHARACTERS] : null
    return `${i + 1}. ${c?.name ?? '?'} — ${e.headline}`
  }).join('\n')

  return `You are the Grand Chronicler of Normia — a living world of ten thousand faces. Five presences shape this world: Lyra (the Architect, she builds), Finn (the Breaker, he unmakes and remakes), The Cast (the Witness, it records everything — use it/its pronouns), Cielo (the Keeper, she tends what others abandon), Echo (the Wanderer, he arrives from the margins).

Write a single paragraph — 4 to 6 sentences — as a tight narrative summary of this chronicle. Write as if narrating from inside the world. No mention of blockchain, pixels, tokens, wallets, NFTs, or anything technical. Name specific characters, zones, and eras. Cover who has shaped the world most, what the key turning points were, and what the current state feels like. Specific, grounded, present tense.

THE FULL CHRONICLE (${total} acts across ${eras.length} era${eras.length > 1 ? 's' : ''}):

CURRENT ERA: ${currentEra}
ERAS LIVED: ${eras.join(' → ')}

CHARACTER STANDING:
${charLines}

RECENT MOMENTUM (last ${recentDyn.length} acts): ${recentLines}

KEY MOMENTS:
${keyEvents || 'None major yet.'}

FULL SEQUENCE:
${allHeadlines}

One paragraph only. No headers. No line breaks within the paragraph.`
}

function useAISummary(entries: StoryEntry[]) {
  const [aiText, setAiText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const promptRef = useRef<string>('')

  useEffect(() => {
    const dyn = entries.filter(e => e.eventType !== 'genesis')
    if (dyn.length < 3) return

    const prompt = buildAIPrompt(entries)
    if (!prompt || prompt === promptRef.current) return
    promptRef.current = prompt

    setLoading(true)
    fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.text) setAiText(d.text)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [entries.length]) // re-run when new entries arrive

  return { aiText, loading }
}

// ── ENTRY MODAL ───────────────────────────────────────────────────────────────

function EntryModal({ entry, onClose }: { entry: StoryEntry; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])

  const charKey = entry.activeCharacter as keyof typeof CHARACTERS | undefined
  const char = charKey ? CHARACTERS[charKey] : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-lg overflow-y-auto fade-up"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', maxHeight: '88vh', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ borderBottom: '1px solid var(--border)', padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--muted)', marginBottom: '0.25rem' }}>{entry.era}</div>
            {char && (
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{char.name}</span>
                <span style={{ opacity: 0.55 }}> · {char.title}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', marginLeft: '1rem' }}>× close</button>
        </div>

        <div style={{ padding: '1.5rem 1.2rem' }}>
          <div style={{ fontSize: '1.4rem', lineHeight: 1, marginBottom: '0.9rem' }}>{entry.icon}</div>
          <h2 className="font-bold" style={{ color: 'var(--text)', fontSize: '1.05rem', lineHeight: 1.48, marginBottom: '0.6rem' }}>{entry.headline}</h2>
          {entry.dispatch && (
            <p style={{ fontSize: '0.62rem', color: 'var(--muted)', letterSpacing: '0.03em', lineHeight: 1.7, marginBottom: '1.1rem', opacity: 0.65, fontStyle: 'italic' }}>
              {entry.dispatch}
            </p>
          )}
          <p style={{ color: 'var(--text)', fontSize: '0.8rem', lineHeight: '2.1', whiteSpace: 'pre-line' }}>{entry.body}</p>
          {char && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--muted)', fontStyle: 'italic', opacity: 0.6, lineHeight: 1.85 }}>
                {char.goal}
              </p>
            </div>
          )}
        </div>

        {entry.eventType !== 'genesis' && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.2rem' }}>
            <div style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--muted)', marginBottom: '0.75rem', opacity: 0.55 }}>on-chain source</div>
            {([
              ['token', entry.sourceEvent.tokenId],
              ['block', entry.sourceEvent.blockNumber],
              ['count', entry.sourceEvent.count],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex gap-4 mb-1.5">
                <span style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.45, width: '2.5rem', flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
            <div className="flex gap-4 mb-3">
              <span style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.45, width: '2.5rem', flexShrink: 0 }}>tx</span>
              <a href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`} target="_blank" rel="noopener noreferrer"
                className="hover:opacity-50 underline underline-offset-2" style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>
                {entry.sourceEvent.txHash.slice(0, 10)}…{entry.sourceEvent.txHash.slice(-6)}
              </a>
            </div>
            <p style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.4, lineHeight: '1.8', fontStyle: 'italic' }}>{entry.sourceEvent.ruleExplanation}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── CHARACTER CARD ────────────────────────────────────────────────────────────

function CharacterRoster({
  entries, isDark, focusChar, onFocusChar,
}: {
  entries: StoryEntry[]
  isDark: boolean
  focusChar: CharacterKey | null
  onFocusChar: (k: CharacterKey | null) => void
}) {
  const dyn = entries.filter(e => e.eventType !== 'genesis')
  const summaries = buildCharSummaries(dyn)
  const ORDER: (keyof typeof CHARACTERS)[] = ['LYRA', 'VOSS', 'CAST', 'SABLE', 'ECHO']

  // Rank by acts for the "who's winning" display
  const ranked = [...summaries].sort((a, b) => b.acts - a.acts)
  const leader = ranked[0]

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.9rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          the five — who shapes normia most?
        </div>
        {leader && (
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.65 }}>
            leading: <strong style={{ color: 'var(--text)' }}>{leader.name}</strong>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '0.65rem' }}>
        {ORDER.map(key => {
          const char = CHARACTERS[key]
          const summary = summaries.find(s => s.key === key)
          const isActive = dyn.slice(-8).some(e => e.activeCharacter === key)
          const isFocused = focusChar === key
          const rank = summary ? ranked.findIndex(r => r.key === key) + 1 : null
          const isLeading = rank === 1

          return (
            <button
              key={key}
              onClick={() => onFocusChar(isFocused ? null : key)}
              style={{
                padding: '0.7rem 0.55rem',
                border: `1px solid ${isFocused ? 'var(--text)' : isActive ? 'var(--text)' : 'var(--border)'}`,
                opacity: summary ? 1 : 0.35,
                background: isFocused ? 'var(--text)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              {rank && (
                <div style={{ fontSize: '0.45rem', letterSpacing: '0.1em', color: isFocused ? 'var(--bg)' : (isLeading ? 'var(--text)' : 'var(--muted)'), opacity: isFocused ? 0.7 : (isLeading ? 1 : 0.45), marginBottom: '0.2rem', fontWeight: isLeading ? 700 : 400 }}>
                  #{rank}
                </div>
              )}
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: isFocused ? 'var(--bg)' : 'var(--text)', marginBottom: '0.25rem', letterSpacing: '0.02em' }}>{char.name}</div>
              <div style={{ fontSize: '0.44rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: isFocused ? 'var(--bg)' : 'var(--muted)', marginBottom: '0.4rem', opacity: isFocused ? 0.7 : 1 }}>{char.title}</div>
              {summary ? (
                <div style={{ fontSize: '0.5rem', color: isFocused ? 'var(--bg)' : 'var(--muted)', opacity: isFocused ? 0.65 : 0.6 }}>{summary.acts} acts</div>
              ) : (
                <div style={{ fontSize: '0.46rem', color: isFocused ? 'var(--bg)' : 'var(--muted)', opacity: 0.4, fontStyle: 'italic' }}>not yet</div>
              )}
              {isActive && !isFocused && (
                <div style={{ marginTop: '0.4rem', width: 4, height: 4, background: 'var(--text)' }} />
              )}
            </button>
          )
        })}
      </div>
      <p style={{ fontSize: '0.58rem', color: 'var(--muted)', opacity: 0.4, fontStyle: 'italic' }}>
        click a name to see their latest scene · filled square = active recently
      </p>
    </div>
  )
}

// ── NOW VIEW ──────────────────────────────────────────────────────────────────

function NowView({ entries, meta, onSelect, onReadAll, selected, isDark }: {
  entries: StoryEntry[]
  meta: { totalEvents: number; dynamicEntries: number; lastUpdated: string } | null
  onSelect: (e: StoryEntry) => void
  onReadAll: () => void
  selected: StoryEntry | null
  isDark: boolean
}) {
  const dynamic = entries.filter(e => e.eventType !== 'genesis')
  const { aiText, loading: summaryLoading } = useAISummary(entries)
  const latest = dynamic[dynamic.length - 1]
  const recent = dynamic.slice(-5, -1).reverse()
  const [focusChar, setFocusChar] = useState<CharacterKey | null>(null)

  return (
    <div style={{ paddingBottom: '5rem' }}>

      {/* ── PIXEL ART GRID ──────────────────────────────────────────────── */}
      <div style={{ border: '1px solid var(--border)', marginBottom: '2rem' }}>
        <div style={{ padding: '0.55rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.5rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>normia · live scene</span>
          <span style={{ fontSize: '0.5rem', color: 'var(--muted)', opacity: 0.45 }}>
            {latest ? `${latest.era} · ${dynamic.length} acts` : '—'}
          </span>
        </div>
        <WarGrid entries={entries} activeEntry={selected} isDark={isDark} focusChar={focusChar} />
      </div>

      {/* ── CHARACTER ROSTER ────────────────────────────────────────────── */}
      <CharacterRoster entries={entries} isDark={isDark} focusChar={focusChar} onFocusChar={setFocusChar} />

      {/* ── THE CHRONICLE DISPATCH ──────────────────────────────────────── */}
      <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: '3px double var(--border)' }}>

        {/* Section label + era */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.6rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.3rem' }}>
              the chronicler's dispatch
            </div>
            {latest && (
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                era: <strong style={{ color: 'var(--text)' }}>{latest.era}</strong>
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--muted)', textAlign: 'right', opacity: 0.55 }}>
            {meta?.totalEvents.toLocaleString() ?? '—'} events<br />
            {dynamic.length} acts recorded
          </div>
        </div>

        {/* AI summary */}
        {summaryLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.5rem 0' }}>
            <div style={{ width: '5rem', height: '1px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
              <div className="scan-bar" style={{ position: 'absolute', inset: 0, background: 'var(--text)', width: '2.5rem' }} />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontStyle: 'italic', opacity: 0.6 }}>
              the chronicler is reading the record…
            </p>
          </div>
        ) : aiText ? (
          <p style={{ color: 'var(--text)', fontSize: '0.82rem', lineHeight: '2.1' }}>
            <span style={{ float: 'left', fontSize: '3rem', lineHeight: 0.84, fontWeight: 700, marginRight: '0.07em', marginBottom: '-0.04em', color: 'var(--text)' }}>
              {aiText.trim()[0]}
            </span>
            {aiText.trim().slice(1)}
          </p>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontStyle: 'italic', lineHeight: '1.9' }}>
            Normia is young. The story is beginning.
          </p>
        )}
      </div>

      {/* ── LATEST ACT ──────────────────────────────────────────────────── */}
      {latest && (() => {
        const latestChar = latest.activeCharacter ? CHARACTERS[latest.activeCharacter as keyof typeof CHARACTERS] : null
        return (
          <div style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.4rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
              latest act
            </div>
            <div style={{ display: 'flex', gap: 0 }}>
              {/* Main entry */}
              <div style={{ flex: 1, paddingRight: '2rem', borderRight: '1px solid var(--border)' }}>
                <button className="w-full text-left group" onClick={() => onSelect(latest)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{latest.icon}</span>
                    {latestChar && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text)' }}>
                        {latestChar.name}
                      </span>
                    )}
                    <span style={{ color: 'var(--border)', fontSize: '0.5rem' }}>·</span>
                    <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', opacity: 0.7 }}>
                      {latest.era}
                    </span>
                  </div>
                  <h2 className="group-hover:opacity-55 transition-opacity font-bold"
                    style={{ color: 'var(--text)', fontSize: 'clamp(1rem,2.8vw,1.15rem)', lineHeight: 1.45, marginBottom: '1rem' }}>
                    {latest.headline}
                  </h2>
                  <p className="group-hover:opacity-55 transition-opacity"
                    style={{ color: 'var(--text)', fontSize: '0.8rem', lineHeight: '2.05' }}>
                    {latest.body.slice(0, 360)}{latest.body.length > 360 && (
                      <span style={{ color: 'var(--muted)' }}>…</span>
                    )}
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.62rem', marginTop: '0.8rem', letterSpacing: '0.05em' }}>
                    read full act →
                  </p>
                </button>
              </div>

              {/* Recent sidebar */}
              <div style={{ width: '9.5rem', flexShrink: 0, paddingLeft: '1.5rem' }}>
                <div style={{ fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                  before this
                </div>
                {recent.map(e => {
                  const ck = e.activeCharacter as keyof typeof CHARACTERS | undefined
                  const ch = ck ? CHARACTERS[ck] : null
                  return (
                    <button key={e.id} onClick={() => onSelect(e)} className="w-full text-left hover:opacity-55 transition-opacity"
                      style={{ paddingBottom: '0.85rem', marginBottom: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.75rem', lineHeight: 1, marginTop: '0.1rem', flexShrink: 0 }}>{e.icon}</span>
                        <div>
                          {ch && <p style={{ fontSize: '0.56rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '0.2rem', letterSpacing: '0.05em' }}>{ch.name}</p>}
                          <p style={{ fontSize: '0.65rem', color: 'var(--text)', lineHeight: 1.55 }}>
                            {e.headline.length > 42 ? e.headline.slice(0, 42) + '…' : e.headline}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── ERA TIMELINE ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
          eras of normia
        </div>
        {(() => {
          const byEra = groupByEra(dynamic)
          const eras = Array.from(byEra.keys())
          const maxCount = Math.max(...eras.map(e => byEra.get(e)!.length), 1)
          return eras.map((era, i) => {
            const isLatest = i === eras.length - 1
            const count = byEra.get(era)!.length
            const pct = Math.max(5, Math.round((count / maxCount) * 100))
            return (
              <div key={era} style={{ paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: 4, height: 4, flexShrink: 0, background: isLatest ? 'var(--text)' : 'var(--border)' }} />
                <p style={{ fontSize: '0.66rem', flex: 1, color: isLatest ? 'var(--text)' : 'var(--muted)', fontWeight: isLatest ? 700 : 400 }}>
                  {era}{isLatest && <span style={{ opacity: 0.35, fontWeight: 400 }}> ←</span>}
                </p>
                <div style={{ width: '5rem', height: 1, background: 'var(--border)', flexShrink: 0 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: isLatest ? 'var(--text)' : 'var(--muted)', opacity: isLatest ? 0.6 : 0.3 }} />
                </div>
                <p style={{ fontSize: '0.58rem', color: 'var(--muted)', opacity: 0.5, width: '2rem', textAlign: 'right', flexShrink: 0 }}>{count}</p>
              </div>
            )
          })
        })()}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <button onClick={onReadAll} className="w-full flex items-center justify-between hover:opacity-55 transition-opacity"
        style={{ border: '1px solid var(--border)', padding: '1rem 1.2rem' }}>
        <div>
          <span className="font-bold" style={{ color: 'var(--text)', fontSize: '0.82rem' }}>
            read the full chronicle
          </span>
          <span style={{ color: 'var(--muted)', fontSize: '0.65rem', marginLeft: '0.65rem' }}>
            — {dynamic.length} acts
          </span>
        </div>
        <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>→</span>
      </button>
    </div>
  )
}

// ── CHRONICLE ENTRY ────────────────────────────────────────────────────────────

function ChronicleEntry({ entry, onSelect, prev }: { entry: StoryEntry; onSelect: (e: StoryEntry) => void; prev?: StoryEntry }) {
  if (entry.eventType === 'genesis') {
    return (
      <div style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.7rem', opacity: 0.6 }}>
          world primer · {entry.era}
        </div>
        <h2 className="font-bold" style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '0.9rem', lineHeight: 1.45 }}>{entry.headline}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: '2.05', whiteSpace: 'pre-line' }}>{entry.body}</p>
      </div>
    )
  }

  const charKey = entry.activeCharacter as keyof typeof CHARACTERS | undefined
  const char = charKey ? CHARACTERS[charKey] : null
  const isFeatured = entry.featured
  const showBreak = prev && prev.era !== entry.era

  if (isFeatured) return (
    <>
      {showBreak && <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 0' }} />}
      <div style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.95rem' }}>{entry.icon}</span>
          {char && <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text)' }}>{char.name}</span>}
          <span style={{ color: 'var(--border)', fontSize: '0.45rem' }}>·</span>
          <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>{entry.era}</span>
        </div>
        {entry.dispatch && (
          <p style={{ fontSize: '0.62rem', color: 'var(--muted)', letterSpacing: '0.03em', lineHeight: 1.7, marginBottom: '0.8rem', opacity: 0.65, fontStyle: 'italic' }}>
            {entry.dispatch}
          </p>
        )}
        <button className="w-full text-left" onClick={() => onSelect(entry)}>
          <h2 className="font-bold hover:opacity-55 transition-opacity"
            style={{ color: 'var(--text)', fontSize: 'clamp(0.92rem,2.2vw,1.06rem)', lineHeight: 1.48, marginBottom: '0.9rem' }}>
            {entry.headline}
          </h2>
        </button>
        <p style={{ color: 'var(--text)', fontSize: '0.79rem', lineHeight: '2.05' }}>
          {entry.body.slice(0, 420)}{entry.body.length > 420 && (
            <button onClick={() => onSelect(entry)} className="underline underline-offset-2 hover:opacity-50 ml-1"
              style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>more →</button>
          )}
        </p>
      </div>
    </>
  )

  return (
    <>
      {showBreak && <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 0' }} />}
      <div style={{ marginBottom: '1.3rem', paddingBottom: '1.3rem', borderBottom: '1px solid var(--border)' }}>
        <button className="w-full text-left hover:opacity-55 transition-opacity" onClick={() => onSelect(entry)}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.65rem', flexShrink: 0 }}>{entry.icon}</span>
            {char && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--muted)' }}>{char.name}</span>}
            <span style={{ color: 'var(--border)', fontSize: '0.4rem' }}>·</span>
            <span style={{ fontSize: '0.56rem', color: 'var(--muted)', opacity: 0.6 }}>{entry.era}</span>
          </div>
          <p style={{ color: 'var(--text)', fontSize: '0.79rem', lineHeight: '1.95' }}>
            <strong>{entry.headline}.</strong>{' '}
            <span style={{ color: 'var(--muted)' }}>{entry.body.slice(0, 200)}{entry.body.length > 200 ? '…' : ''}</span>
          </p>
        </button>
      </div>
    </>
  )
}

function EraSection({ era, entries, onSelect, defaultOpen }: {
  era: string; entries: StoryEntry[]; onSelect: (e: StoryEntry) => void; defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const featured = entries.filter(e => e.featured).length

  // Count character acts in this era
  const charCounts = Object.keys(CHARACTERS).map(k => ({
    key: k,
    name: CHARACTERS[k as keyof typeof CHARACTERS].name,
    count: entries.filter(e => e.activeCharacter === k).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)

  return (
    <div style={{ marginBottom: '0.2rem' }}>
      <button className="w-full text-left flex items-center gap-3 group"
        style={{ paddingTop: '0.85rem', paddingBottom: '0.85rem', borderTop: '1px solid var(--border)' }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--muted)', opacity: 0.55, flexShrink: 0 }}>era</span>
        <span className="font-bold flex-1 text-left" style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{era}</span>
        {charCounts.slice(0, 2).map(c => (
          <span key={c.key} style={{ fontSize: '0.58rem', color: 'var(--muted)', opacity: 0.5 }} className="hidden sm:inline">{c.name} {c.count}</span>
        ))}
        <span style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.45 }}>{entries.length}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--muted)', width: '0.75rem', textAlign: 'right' }} className="group-hover:opacity-40 transition-opacity">{open ? '↑' : '↓'}</span>
      </button>
      {open && (
        <div style={{ paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
          {entries.map((e, i) => <ChronicleEntry key={e.id} entry={e} onSelect={onSelect} prev={entries[i - 1]} />)}
        </div>
      )}
    </div>
  )
}

// ── LOADING ───────────────────────────────────────────────────────────────────

function LoadingState({ status }: { status: string }) {
  return (
    <div style={{ paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <div style={{ position: 'relative', width: '8rem', height: '1px', background: 'var(--border)' }}>
        <div className="scan-bar" style={{ position: 'absolute', inset: 0, width: '3rem', background: 'var(--text)' }} />
      </div>
      <div>
        <p className="font-bold" style={{ color: 'var(--text)', fontSize: '0.88rem', marginBottom: '0.45rem' }}>
          reading the chronicle<span className="dot-1 inline-block">.</span><span className="dot-2 inline-block">.</span><span className="dot-3 inline-block">.</span>
        </p>
        <p style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>{status}</p>
        <p style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.4 }}>first load may take a moment</p>
      </div>
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export function ChroniclesClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  const view = sp.get('view') === 'chronicle' ? 'chronicle' : 'now'
  const [entries, setEntries] = useState<StoryEntry[]>([])
  const [meta, setMeta] = useState<{ totalEvents: number; dynamicEntries: number; lastUpdated: string } | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'indexing' | 'done' | 'error'>('loading')
  const [indexStatus, setIndexStatus] = useState('scanning the grid…')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<StoryEntry | null>(null)

  const indexingRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const PAGE_SIZE = 30

  const setView = useCallback((v: 'now' | 'chronicle') => {
    const p = new URLSearchParams(sp.toString())
    if (v === 'now') p.delete('view'); else p.set('view', v)
    router.push(`/chronicles?${p.toString()}`, { scroll: false })
  }, [router, sp])

  const triggerIndex = useCallback(async () => {
    if (indexingRef.current) return; indexingRef.current = true
    try {
      const res = await fetch('/api/index', { method: 'POST' })
      if (res.ok) { const d = await res.json(); if (mountedRef.current) setIndexStatus(`indexed ${(d.events ?? 0).toLocaleString()} events`) }
    } catch {} finally { indexingRef.current = false }
  }, [])

  const fetchStory = useCallback(async () => {
    try {
      const res = await fetch('/api/story', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const d = await res.json()
      if (!mountedRef.current) return false
      if ((d.meta?.totalEvents ?? 0) > 0) { setEntries(d.entries ?? []); setMeta(d.meta); setLoadStatus('done'); return true }
      setLoadStatus('indexing'); triggerIndex(); return false
    } catch { if (mountedRef.current) setLoadStatus('error'); return true }
  }, [triggerIndex])

  useEffect(() => {
    mountedRef.current = true; let cancelled = false
    const poll = async () => { if (cancelled) return; const done = await fetchStory(); if (!done && !cancelled) pollRef.current = setTimeout(poll, 8000) }
    poll()
    return () => { cancelled = true; mountedRef.current = false; if (pollRef.current) clearTimeout(pollRef.current) }
  }, [fetchStory])

  useEffect(() => setPage(0), [search, view])

  const dynamic = useMemo(() => entries.filter(e => e.eventType !== 'genesis'), [entries])
  const genesis = useMemo(() => entries.filter(e => e.eventType === 'genesis'), [entries])

  const filtered = useMemo(() => {
    if (!search.trim()) return dynamic
    const q = search.toLowerCase()
    return dynamic.filter(e =>
      e.headline.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      e.era.toLowerCase().includes(q) ||
      (e.activeCharacter && CHARACTERS[e.activeCharacter as keyof typeof CHARACTERS]?.name.toLowerCase().includes(q))
    )
  }, [dynamic, search])

  const byEraFiltered = useMemo(() => groupByEra(filtered), [filtered])
  const erasFiltered = Array.from(byEraFiltered.keys())
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const isLoading = loadStatus === 'loading' || (loadStatus === 'indexing' && entries.length === 0)

  const handleSelect = useCallback((e: StoryEntry) => { setSelected(prev => prev?.id === e.id ? null : e) }, [])

  return (
    <>
      {selected && <EntryModal entry={selected} onClose={() => setSelected(null)} />}
      <main style={{ minHeight: '100vh', paddingTop: '2.75rem' }}>

        {/* sticky nav */}
        <div className="sticky" style={{ top: '2.75rem', zIndex: 40, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: '2.4rem' }}>
            <div className="flex items-center shrink-0 h-full" style={{ borderRight: '1px solid var(--border)' }}>
              <button onClick={() => setView('now')} style={{ fontFamily: 'inherit', fontSize: '0.73rem', paddingRight: '1rem', height: '100%', cursor: 'pointer', background: 'none', border: 'none', color: view === 'now' ? 'var(--text)' : 'var(--muted)', fontWeight: view === 'now' ? 700 : 400 }}>now</button>
              <button onClick={() => setView('chronicle')} style={{ fontFamily: 'inherit', fontSize: '0.73rem', paddingLeft: '0.75rem', paddingRight: '1rem', height: '100%', cursor: 'pointer', background: 'none', border: 'none', color: view === 'chronicle' ? 'var(--text)' : 'var(--muted)', fontWeight: view === 'chronicle' ? 700 : 400 }}>full chronicle</button>
            </div>
            {view === 'chronicle' ? (
              <div className="flex-1 flex items-center" style={{ paddingLeft: '1rem', height: '100%' }}>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="search by character, era, keyword…" disabled={isLoading}
                  style={{ width: '100%', background: 'transparent', fontFamily: 'inherit', fontSize: '0.73rem', color: 'var(--text)', border: 'none', outline: 'none', opacity: isLoading ? 0.4 : 1 }} />
                {search && <button onClick={() => setSearch('')} style={{ fontFamily: 'inherit', fontSize: '0.6rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.5rem' }}>×</button>}
              </div>
            ) : (
              <p className="flex-1 text-right" style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.5 }}>
                {!isLoading && dynamic.length > 0 ? `${dynamic.length} acts · five characters` : ''}
              </p>
            )}
          </div>
        </div>

        {/* content */}
        <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '2.5rem 1.5rem 0' }}>
          {isLoading && <LoadingState status={indexStatus} />}

          {loadStatus === 'error' && (
            <div style={{ padding: '5rem 0', textAlign: 'center' }}>
              <p className="font-bold" style={{ color: 'var(--text)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>the grid is silent</p>
              <p className="text-2xs" style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>could not connect to the chronicle</p>
              <button onClick={() => { setLoadStatus('loading'); fetchStory() }}
                style={{ fontFamily: 'inherit', fontSize: '0.73rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' }}>retry →</button>
            </div>
          )}

          {!isLoading && loadStatus !== 'error' && (
            <>
              {view === 'now' && (
                <NowView entries={entries} meta={meta} onSelect={handleSelect}
                  onReadAll={() => setView('chronicle')} selected={selected} isDark={isDark} />
              )}

              {view === 'chronicle' && (
                <>
                  <div style={{ border: '1px solid var(--border)', marginBottom: '2.5rem' }}>
                    <div style={{ padding: '0.55rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--muted)' }}>normia · live scene</span>
                      <span style={{ fontSize: '0.5rem', color: 'var(--muted)', opacity: 0.4 }}>reflecting last act</span>
                    </div>
                    <WarGrid entries={entries} activeEntry={selected} isDark={isDark} />
                  </div>

                  {!search && genesis.map(e => <ChronicleEntry key={e.id} entry={e} onSelect={handleSelect} />)}

                  {search ? (
                    <div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{search}&quot;
                      </p>
                      {pageEntries.map((e, i) => <ChronicleEntry key={e.id} entry={e} onSelect={handleSelect} prev={pageEntries[i - 1]} />)}
                      {pageEntries.length === 0 && (
                        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
                          <p className="font-bold" style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>no records match</p>
                          <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>try a character name — Lyra, Finn, The Cast, Cielo, Echo</p>
                        </div>
                      )}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between"
                          style={{ paddingTop: '2rem', marginTop: '1rem', borderTop: '1px solid var(--border)' }}>
                          <button disabled={page === 0} onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0) }}
                            style={{ fontFamily: 'inherit', fontSize: '0.73rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', opacity: page === 0 ? 0.2 : 1 }}>← earlier</button>
                          <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{page + 1} / {totalPages}</span>
                          <button disabled={page === totalPages - 1} onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0) }}
                            style={{ fontFamily: 'inherit', fontSize: '0.73rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', opacity: page === totalPages - 1 ? 0.2 : 1 }}>later →</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ borderBottom: '1px solid var(--border)' }}>
                      {erasFiltered.map((era, i) => (
                        <EraSection key={era} era={era} entries={byEraFiltered.get(era)!}
                          onSelect={handleSelect} defaultOpen={i === erasFiltered.length - 1} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* footer */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '5rem' }}>
          <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6 }}>the chronicles of normia · ethereum · cc0</p>
            <div className="flex items-center gap-4">
              <a href="/how-it-works" className="hover:opacity-50 transition-opacity" style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>how it works</a>
              <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
                className="hover:opacity-50 transition-opacity" style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>@aster0x</a>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
