'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import type { StoryEntry } from '@/lib/storyGenerator'
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

  return `You are the Grand Chronicler of the Grid — a mythic, living digital world of ten thousand Normies. Five presences shape this world: Lyra (the Architect, she builds), Voss (the Breaker, he unmakes and remakes), Cast (the Witness, they record everything), Sable (the Keeper, she tends what others abandon), Echo (the Wanderer, he arrives from the margins).

Write a story summary — 3 short paragraphs — in an atmospheric, slightly mythic voice. Write as if narrating from inside the world. No mention of blockchain, pixels, tokens, wallets, NFTs, or anything technical. This is a living world with real history.

THE FULL CHRONICLE (${total} acts across ${eras.length} era${eras.length > 1 ? 's' : ''}):

CURRENT ERA: ${currentEra}
ERAS LIVED: ${eras.join(' → ')}

CHARACTER STANDING (full chronicle):
${charLines}

RECENT MOMENTUM (last ${recentDyn.length} acts): ${recentLines}

KEY MOMENTS ACROSS THE FULL CHRONICLE:
${keyEvents || 'None major yet.'}

WORLD EVENTS:
- Major reshapings: ${surges}
- Dissolutions into the Grid: ${departures}
- Simultaneous convergences: ${convergences}

FULL SEQUENCE OF ALL ${total} ACTS:
${allHeadlines}

Write 3 paragraphs. Paragraph 1: who has shaped this world and how, drawing on the full arc. Paragraph 2: what the key turning points were (the surges, departures, convergences). Paragraph 3: what's happening right now and what the current state of the Grid feels like. Make it read like myth — specific names, specific places, earned weight.`
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
            <div className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.2em', marginBottom: '0.2rem' }}>{entry.era}</div>
            {char && (
              <div className="text-2xs" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{char.name}</span>
                <span style={{ opacity: 0.55 }}> · {char.title}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', marginLeft: '1rem' }}>× close</button>
        </div>

        <div style={{ padding: '1.5rem 1.2rem' }}>
          <div style={{ fontSize: '1.4rem', lineHeight: 1, marginBottom: '0.9rem' }}>{entry.icon}</div>
          <h2 className="font-bold" style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>{entry.headline}</h2>
          <p style={{ color: 'var(--text)', fontSize: '0.78rem', lineHeight: '2.1', whiteSpace: 'pre-line' }}>{entry.body}</p>
          {char && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <p className="text-2xs" style={{ color: 'var(--muted)', fontStyle: 'italic', opacity: 0.6, lineHeight: 1.8 }}>
                {char.goal}
              </p>
            </div>
          )}
        </div>

        {entry.eventType !== 'genesis' && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.2rem' }}>
            <div className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.2em', marginBottom: '0.75rem', opacity: 0.55 }}>on-chain source</div>
            {([
              ['token', entry.sourceEvent.tokenId],
              ['block', entry.sourceEvent.blockNumber],
              ['count', entry.sourceEvent.count],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex gap-4 mb-1.5">
                <span className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.45, width: '2.5rem', flexShrink: 0 }}>{k}</span>
                <span className="text-2xs" style={{ color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
            <div className="flex gap-4 mb-3">
              <span className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.45, width: '2.5rem', flexShrink: 0 }}>tx</span>
              <a href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-2xs hover:opacity-50 underline underline-offset-2" style={{ color: 'var(--muted)' }}>
                {entry.sourceEvent.txHash.slice(0, 10)}…{entry.sourceEvent.txHash.slice(-6)}
              </a>
            </div>
            <p className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.4, lineHeight: '1.8', fontStyle: 'italic' }}>{entry.sourceEvent.ruleExplanation}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── CHARACTER CARD ────────────────────────────────────────────────────────────

function CharacterRoster({ entries, isDark }: { entries: StoryEntry[]; isDark: boolean }) {
  const dyn = entries.filter(e => e.eventType !== 'genesis')
  const summaries = buildCharSummaries(dyn)

  const ORDER: (keyof typeof CHARACTERS)[] = ['LYRA', 'VOSS', 'CAST', 'SABLE', 'ECHO']

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.22em', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
        the five
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
        {ORDER.map(key => {
          const char = CHARACTERS[key]
          const summary = summaries.find(s => s.key === key)
          const isActive = dyn.slice(-8).some(e => e.activeCharacter === key)
          return (
            <div key={key} style={{
              padding: '0.65rem 0.5rem',
              border: `1px solid ${isActive ? 'var(--text)' : 'var(--border)'}`,
              opacity: summary ? 1 : 0.35,
            }}>
              <div className="text-2xs font-bold" style={{ color: 'var(--text)', marginBottom: '0.2rem', letterSpacing: '0.05em' }}>{char.name}</div>
              <div style={{ fontSize: '0.38rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.4rem' }}>{char.title}</div>
              {summary && (
                <div style={{ fontSize: '0.38rem', color: 'var(--muted)', opacity: 0.6 }}>{summary.acts} acts</div>
              )}
              {isActive && (
                <div style={{ marginTop: '0.35rem', width: 4, height: 4, background: 'var(--text)' }} />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.45, marginTop: '0.6rem', fontStyle: 'italic' }}>
        filled square = active in last 8 acts
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

  return (
    <div style={{ paddingBottom: '5rem' }}>

      {/* ── PIXEL ART GRID ──────────────────────────────────────────────── */}
      <div style={{ border: '1px solid var(--border)', marginBottom: '2.5rem' }}>
        <div style={{ padding: '0.55rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.22em' }}>the grid</span>
          <span className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.45 }}>
            {latest ? `${latest.era} · ${dynamic.length} acts` : '—'}
          </span>
        </div>
        <WarGrid entries={entries} activeEntry={selected} isDark={isDark} />
      </div>

      {/* ── CHARACTER ROSTER ────────────────────────────────────────────── */}
      <CharacterRoster entries={entries} isDark={isDark} />

      {/* ── STORY DISPATCH ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: '3rem', paddingBottom: '3rem', borderBottom: '3px double var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.25em', marginBottom: '0.25rem' }}>the record</div>
            <div className="text-2xs" style={{ color: 'var(--muted)' }}>era: <strong style={{ color: 'var(--text)' }}>{latest?.era ?? '—'}</strong></div>
          </div>
          <div className="text-2xs" style={{ color: 'var(--muted)', textAlign: 'right', opacity: 0.6 }}>
            {meta?.totalEvents.toLocaleString() ?? '—'} events<br />
            {dynamic.length} acts
          </div>
        </div>

        {summaryLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
            <div style={{ width: '4rem', height: '1px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
              <div className="scan-bar" style={{ position: 'absolute', inset: 0, background: 'var(--text)', width: '2rem' }} />
            </div>
            <p className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.6, fontStyle: 'italic' }}>the chronicler is reading the record…</p>
          </div>
        ) : aiText ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {aiText.split('\n\n').filter(p => p.trim()).map((para, i) => (
              <p key={i} style={{ color: 'var(--text)', fontSize: '0.8rem', lineHeight: '2.1' }}>
                {i === 0 ? (
                  <><span style={{ float: 'left', fontSize: '3rem', lineHeight: 0.85, fontWeight: 700, marginRight: '0.07em', marginBottom: '-0.04em' }}>{para.trim()[0]}</span>{para.trim().slice(1)}</>
                ) : para.trim()}
              </p>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>The Grid is young. The story is beginning.</p>
        )}
      </div>

      {/* ── LATEST ENTRY ────────────────────────────────────────────────── */}
      {latest && (
        <div style={{ marginBottom: '3rem', paddingBottom: '3rem', borderBottom: '1px solid var(--border)' }}>
          <div className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.22em', marginBottom: '1.25rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
            latest act
          </div>
          <div className="flex gap-0">
            {/* Hero */}
            <div style={{ flex: 1, paddingRight: '2rem', borderRight: '1px solid var(--border)' }}>
              <button className="w-full text-left group" onClick={() => onSelect(latest)}>
                <div className="flex items-center gap-2" style={{ marginBottom: '0.7rem' }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>{latest.icon}</span>
                  {latest.activeCharacter && (
                    <span className="text-2xs font-bold uppercase" style={{ color: 'var(--text)', letterSpacing: '0.12em' }}>
                      {CHARACTERS[latest.activeCharacter as keyof typeof CHARACTERS]?.name}
                    </span>
                  )}
                  <span style={{ color: 'var(--border)', fontSize: '0.4rem' }}>·</span>
                  <span className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.1em', opacity: 0.7 }}>{latest.era}</span>
                </div>
                <h2 className="font-bold group-hover:opacity-55 transition-opacity"
                  style={{ color: 'var(--text)', fontSize: 'clamp(0.9rem,2.5vw,1.05rem)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                  {latest.headline}
                </h2>
                <p className="group-hover:opacity-55 transition-opacity"
                  style={{ color: 'var(--text)', fontSize: '0.77rem', lineHeight: '2.05' }}>
                  {latest.body.slice(0, 320)}{latest.body.length > 320 && <span style={{ color: 'var(--muted)' }}>…</span>}
                </p>
                <p className="text-2xs" style={{ color: 'var(--muted)', marginTop: '0.65rem' }}>read full act →</p>
              </button>
            </div>

            {/* Recent sidebar */}
            <div style={{ width: '10rem', flexShrink: 0, paddingLeft: '1.5rem' }}>
              <div className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.2em', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                before this
              </div>
              {recent.map(e => {
                const charKey = e.activeCharacter as keyof typeof CHARACTERS | undefined
                const char = charKey ? CHARACTERS[charKey] : null
                return (
                  <button key={e.id} onClick={() => onSelect(e)} className="w-full text-left hover:opacity-55 transition-opacity"
                    style={{ paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex gap-2 items-start">
                      <span style={{ fontSize: '0.7rem', lineHeight: 1, marginTop: '0.1rem', flexShrink: 0 }}>{e.icon}</span>
                      <div>
                        {char && <p className="text-2xs font-bold" style={{ color: 'var(--muted)', marginBottom: '0.1rem', letterSpacing: '0.05em' }}>{char.name}</p>}
                        <p className="text-2xs" style={{ color: 'var(--text)', lineHeight: 1.5 }}>
                          {e.headline.length > 45 ? e.headline.slice(0, 45) + '…' : e.headline}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ERA TIMELINE ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '3rem' }}>
        <div className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.22em', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
          eras
        </div>
        {(() => {
          const byEra = groupByEra(dynamic)
          const eras = Array.from(byEra.keys())
          const maxCount = Math.max(...eras.map(e => byEra.get(e)!.length), 1)
          return eras.map((era, i) => {
            const isLatest = i === eras.length - 1
            const count = byEra.get(era)!.length
            const pct = Math.max(6, Math.round((count / maxCount) * 100))
            return (
              <div key={era} style={{ paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: 4, height: 4, flexShrink: 0, background: isLatest ? 'var(--text)' : 'var(--border)' }} />
                <p className="text-2xs flex-1" style={{ color: isLatest ? 'var(--text)' : 'var(--muted)', fontWeight: isLatest ? 700 : 400 }}>
                  {era}{isLatest && <span style={{ opacity: 0.35, fontWeight: 400 }}> ←</span>}
                </p>
                <div style={{ width: '5rem', height: 1, background: 'var(--border)', flexShrink: 0 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: isLatest ? 'var(--text)' : 'var(--muted)', opacity: isLatest ? 0.6 : 0.3 }} />
                </div>
                <p className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.5, width: '2rem', textAlign: 'right', flexShrink: 0 }}>{count}</p>
              </div>
            )
          })
        })()}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <button onClick={onReadAll} className="w-full flex items-center justify-between hover:opacity-55 transition-opacity"
        style={{ border: '1px solid var(--border)', padding: '0.9rem 1.1rem' }}>
        <div>
          <span className="font-bold" style={{ color: 'var(--text)', fontSize: '0.78rem' }}>read the full chronicle</span>
          <span className="text-2xs" style={{ color: 'var(--muted)', marginLeft: '0.6rem' }}>— {dynamic.length} acts</span>
        </div>
        <span style={{ color: 'var(--text)' }}>→</span>
      </button>
    </div>
  )
}

// ── CHRONICLE ENTRY ────────────────────────────────────────────────────────────

function ChronicleEntry({ entry, onSelect, prev }: { entry: StoryEntry; onSelect: (e: StoryEntry) => void; prev?: StoryEntry }) {
  if (entry.eventType === 'genesis') {
    return (
      <div style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--border)' }}>
        <div className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.2em', marginBottom: '0.65rem', opacity: 0.6 }}>world primer · {entry.era}</div>
        <h2 className="font-bold" style={{ color: 'var(--text)', fontSize: '0.95rem', marginBottom: '0.85rem', lineHeight: 1.45 }}>{entry.headline}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.77rem', lineHeight: '2.0', whiteSpace: 'pre-line' }}>{entry.body}</p>
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
        <div className="flex items-center gap-2" style={{ marginBottom: '0.7rem' }}>
          <span style={{ fontSize: '0.9rem' }}>{entry.icon}</span>
          {char && <span className="font-bold text-2xs uppercase" style={{ color: 'var(--text)', letterSpacing: '0.12em' }}>{char.name}</span>}
          <span style={{ color: 'var(--border)', fontSize: '0.4rem' }}>·</span>
          <span className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>{entry.era}</span>
        </div>
        <button className="w-full text-left" onClick={() => onSelect(entry)}>
          <h2 className="font-bold hover:opacity-55 transition-opacity"
            style={{ color: 'var(--text)', fontSize: 'clamp(0.88rem,2vw,1.02rem)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
            {entry.headline}
          </h2>
        </button>
        <p style={{ color: 'var(--text)', fontSize: '0.77rem', lineHeight: '2.0' }}>
          {entry.body.slice(0, 400)}{entry.body.length > 400 && (
            <button onClick={() => onSelect(entry)} className="underline underline-offset-2 hover:opacity-50 ml-1"
              style={{ color: 'var(--muted)' }}>more →</button>
          )}
        </p>
      </div>
    </>
  )

  return (
    <>
      {showBreak && <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 0' }} />}
      <div style={{ marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px solid var(--border)' }}>
        <button className="w-full text-left hover:opacity-55 transition-opacity" onClick={() => onSelect(entry)}>
          <div className="flex items-baseline gap-2" style={{ marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.6rem', flexShrink: 0 }}>{entry.icon}</span>
            {char && <span className="text-2xs" style={{ color: 'var(--muted)', fontWeight: 700 }}>{char.name}</span>}
            <span style={{ color: 'var(--border)', fontSize: '0.35rem' }}>·</span>
            <span className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.6, fontSize: '0.55rem' }}>{entry.era}</span>
          </div>
          <p style={{ color: 'var(--text)', fontSize: '0.76rem', lineHeight: '1.9' }}>
            <strong>{entry.headline}.</strong>{' '}
            <span style={{ color: 'var(--muted)' }}>{entry.body.slice(0, 180)}{entry.body.length > 180 ? '…' : ''}</span>
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
        style={{ paddingTop: '0.8rem', paddingBottom: '0.8rem', borderTop: '1px solid var(--border)' }}
        onClick={() => setOpen(o => !o)}>
        <span className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.2em', opacity: 0.6, flexShrink: 0 }}>era</span>
        <span className="font-bold flex-1 text-left" style={{ color: 'var(--text)', fontSize: '0.78rem' }}>{era}</span>
        {charCounts.slice(0, 2).map(c => (
          <span key={c.key} className="text-2xs hidden sm:inline" style={{ color: 'var(--muted)', opacity: 0.5 }}>{c.name} {c.count}</span>
        ))}
        <span className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.45 }}>{entries.length}</span>
        <span className="text-2xs group-hover:opacity-40 transition-opacity" style={{ color: 'var(--muted)', width: '0.75rem', textAlign: 'right' }}>{open ? '↑' : '↓'}</span>
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
        <p className="font-bold" style={{ color: 'var(--text)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
          reading the grid<span className="dot-1 inline-block">.</span><span className="dot-2 inline-block">.</span><span className="dot-3 inline-block">.</span>
        </p>
        <p className="text-2xs" style={{ color: 'var(--muted)', marginBottom: '0.2rem' }}>{status}</p>
        <p className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.4 }}>first load may take a moment</p>
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

        {/* info strip */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '0 1.5rem', height: '2.1rem', display: 'flex', alignItems: 'center' }}>
            <p className="text-2xs" style={{ color: 'var(--muted)', letterSpacing: '0.1em', opacity: 0.7 }}>
              10,000 normies · ethereum mainnet · cc0
            </p>
          </div>
        </div>

        {/* masthead */}
        <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ paddingTop: '2rem', paddingBottom: '1.5rem' }}>
            <h1 className="font-bold" style={{ fontSize: 'clamp(2.8rem,8vw,5rem)', color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 0.9, marginBottom: '0.9rem' }}>
              normies<br />chronicles
            </h1>
            <p className="text-2xs" style={{ color: 'var(--muted)', maxWidth: '28rem', lineHeight: '1.85', letterSpacing: '0.04em' }}>
              a living record — five presences, ten thousand normies, one Grid. every on-chain act ripples.
            </p>
          </div>
        </div>

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
              <p className="flex-1 text-right text-2xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
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
                      <span className="text-2xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.22em' }}>the grid</span>
                      <span className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.4 }}>reflecting last act</span>
                    </div>
                    <WarGrid entries={entries} activeEntry={selected} isDark={isDark} />
                  </div>

                  {!search && genesis.map(e => <ChronicleEntry key={e.id} entry={e} onSelect={handleSelect} />)}

                  {search ? (
                    <div>
                      <p className="text-2xs" style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{search}&quot;
                      </p>
                      {pageEntries.map((e, i) => <ChronicleEntry key={e.id} entry={e} onSelect={handleSelect} prev={pageEntries[i - 1]} />)}
                      {pageEntries.length === 0 && (
                        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
                          <p className="font-bold" style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>no records match</p>
                          <p className="text-2xs" style={{ color: 'var(--muted)' }}>try a character name — Lyra, Voss, Cast, Sable, Echo</p>
                        </div>
                      )}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between"
                          style={{ paddingTop: '2rem', marginTop: '1rem', borderTop: '1px solid var(--border)' }}>
                          <button disabled={page === 0} onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0) }}
                            style={{ fontFamily: 'inherit', fontSize: '0.73rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', opacity: page === 0 ? 0.2 : 1 }}>← earlier</button>
                          <span className="text-2xs" style={{ color: 'var(--muted)' }}>{page + 1} / {totalPages}</span>
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
            <p className="text-2xs" style={{ color: 'var(--muted)', opacity: 0.6 }}>normies chronicles · ethereum · cc0</p>
            <div className="flex items-center gap-4">
              <a href="/how-it-works" className="text-2xs hover:opacity-50 transition-opacity" style={{ color: 'var(--muted)' }}>how it works</a>
              <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
                className="text-2xs hover:opacity-50 transition-opacity" style={{ color: 'var(--muted)' }}>@aster0x</a>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
