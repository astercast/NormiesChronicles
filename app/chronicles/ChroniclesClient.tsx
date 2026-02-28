'use client'
import { useState, useMemo } from 'react'
import { StoryCard } from '@/components/StoryCard'
import type { StoryEntry } from '@/lib/storyGenerator'

const LORE_TYPES = [
  'ALL',
  'GRAND_MIGRATION', 'TERRITORIAL_CLAIM', 'SUBTLE_INSCRIPTION',
  'FACTION_DECLARATION', 'SCHOLARS_WORK', 'WANDERERS_PASSAGE',
  'POWER_INFUSION', 'ETHEREAL_INFUSION', 'RITE_OF_RECOGNITION',
  'ORACLES_OBSERVATION', 'FOUNDATION_STONE', 'RECORD_OF_THE_DEEP',
  'THE_UNMAPPED', 'PROPHECY_SPOKEN', 'FACTION_RISE',
  'NEW_ERA_DAWN', 'CONVERGENCE_POINT', 'ARTIFACT_DISCOVERY',
]

const PAGE_SIZE = 12

interface Props {
  initialData: {
    entries: StoryEntry[]
    meta: { totalEvents: number; dynamicEntries: number; lastUpdated: string }
  }
}

export function ChroniclesClient({ initialData }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [page, setPage] = useState(0)

  const entries: StoryEntry[] = initialData?.entries ?? []
  const meta = initialData?.meta

  const filtered = useMemo(() => {
    let e = entries
    if (filter !== 'ALL') e = e.filter(x => x.loreType === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      e = e.filter(x =>
        x.headline.toLowerCase().includes(q) ||
        x.body.toLowerCase().includes(q) ||
        x.era.toLowerCase().includes(q)
      )
    }
    return e
  }, [entries, filter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleFilter(f: string) {
    setFilter(f)
    setPage(0)
  }

  function handleSearch(s: string) {
    setSearch(s)
    setPage(0)
  }

  const currentEra = entries.find(e => e.eventType !== 'genesis')?.era ?? 'The Void Before'

  return (
    <main className="min-h-screen pt-12">
      {/* Hero */}
      <div className="border-b border-grid-border bg-grid-surface/50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-2">
            <span className="font-mono text-xs text-grid-accent tracking-widest">// CURRENT ERA</span>
          </div>
          <h1 className="font-pixel text-5xl md:text-7xl text-grid-secondary glow-accent mb-2">
            THE NORMIE CHRONICLES
          </h1>
          <p className="font-pixel text-2xl text-grid-accent mb-6">{currentEra}</p>
          <p className="font-mono text-sm text-grid-primary max-w-2xl mb-8 leading-relaxed">
            A living record of the Grid. Every on-chain event shapes the world. Every transformation
            writes history. {entries.length} entries. One eternal story.
          </p>
          {meta && (
            <div className="flex flex-wrap gap-6">
              {[
                ['TOTAL ENTRIES', entries.length.toString()],
                ['ON-CHAIN EVENTS', meta.totalEvents.toString()],
                ['LORE ENTRIES', meta.dynamicEntries.toString()],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="font-mono text-xs text-grid-primary tracking-widest">{label}</p>
                  <p className="font-pixel text-2xl text-grid-accent">{val}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="sticky top-12 z-40 border-b border-grid-border bg-grid-bg/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="SEARCH THE ARCHIVE..."
            className="flex-1 bg-grid-surface border border-grid-border font-mono text-xs text-grid-secondary placeholder-grid-primary px-3 py-2 focus:outline-none focus:border-grid-accent transition-colors"
          />
          <select
            value={filter}
            onChange={e => handleFilter(e.target.value)}
            className="bg-grid-surface border border-grid-border font-mono text-xs text-grid-secondary px-3 py-2 focus:outline-none focus:border-grid-accent transition-colors cursor-pointer"
          >
            {LORE_TYPES.map(t => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'ALL ENTRY TYPES' : t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {pageEntries.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-pixel text-3xl text-grid-primary mb-2">THE ARCHIVE IS EMPTY</p>
            <p className="font-mono text-xs text-grid-primary">No records match your query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageEntries.map((entry, i) => (
              <StoryCard key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="font-mono text-xs px-4 py-2 border border-grid-border text-grid-primary hover:border-grid-accent hover:text-grid-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← PREV
            </button>
            <span className="font-mono text-xs text-grid-primary px-4">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="font-mono text-xs px-4 py-2 border border-grid-border text-grid-primary hover:border-grid-accent hover:text-grid-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              NEXT →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-grid-border mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-mono text-xs text-grid-primary">
            NORMIE CHRONICLES · BUILT ON ETHEREUM · CC0
          </p>
          <p className="font-mono text-xs text-grid-primary">
            BY{' '}
            <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer" className="text-grid-accent hover:underline">
              @ASTER0X
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}
