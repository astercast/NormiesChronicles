'use client'
import { useState } from 'react'
import type { StoryEntry } from '@/lib/storyGenerator'

function Modal({ entry, onClose }: { entry: StoryEntry; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full bg-grid-surface border border-grid-border pixel-border max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-grid-border">
          <div>
            <p className="font-mono text-xs text-grid-primary mb-1 tracking-widest">{entry.loreType.replace(/_/g,' ')}</p>
            <h2 className="font-pixel text-xl text-grid-secondary leading-tight">{entry.headline}</h2>
          </div>
          <button onClick={onClose} className="font-mono text-grid-primary hover:text-grid-accent ml-4 text-lg leading-none">✕</button>
        </div>

        {/* Rule */}
        <div className="p-4 border-b border-grid-border bg-black/30">
          <p className="font-mono text-xs text-grid-accent mb-1 tracking-widest">{entry.sourceEvent.ruleApplied}</p>
          <p className="font-mono text-xs text-grid-primary leading-relaxed">{entry.sourceEvent.ruleExplanation}</p>
        </div>

        {/* Chain data */}
        {entry.sourceEvent.type !== 'genesis' && (
          <div className="p-4 border-b border-grid-border">
            <p className="font-mono text-xs text-grid-accent mb-3 tracking-widest">ON-CHAIN DATA</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Event Type', entry.sourceEvent.type],
                ['Token', entry.sourceEvent.tokenId],
                ['Block', entry.sourceEvent.blockNumber],
                ['Count', entry.sourceEvent.count],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="font-mono text-xs text-grid-primary">{label}</p>
                  <p className="font-mono text-xs text-grid-secondary">{val}</p>
                </div>
              ))}
            </div>
            {entry.sourceEvent.txHash !== 'N/A' && (
              <a
                href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 font-mono text-xs text-grid-accent hover:underline"
              >
                VIEW ON ETHERSCAN →
              </a>
            )}
          </div>
        )}

        {/* Era */}
        <div className="p-4">
          <p className="font-mono text-xs text-grid-primary mb-1 tracking-widest">HISTORICAL ERA</p>
          <p className="font-pixel text-lg text-grid-secondary">{entry.era}</p>
        </div>
      </div>
    </div>
  )
}

export function StoryCard({ entry, index }: { entry: StoryEntry; index: number }) {
  const [open, setOpen] = useState(false)

  const borderClass = entry.featured
    ? 'border border-grid-accent/40 animate-pulse-glow'
    : 'pixel-border'

  return (
    <>
      <article
        className={`group relative bg-grid-surface ${borderClass} cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-grid-accent/60`}
        style={{ animationDelay: `${index * 50}ms` }}
        onClick={() => setOpen(true)}
      >
        {entry.featured && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-grid-accent to-transparent opacity-60" />
        )}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-xl flex-shrink-0 mt-0.5">{entry.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-grid-primary tracking-widest">
                  {entry.loreType.replace(/_/g, ' ')}
                </span>
                {entry.featured && (
                  <span className="font-mono text-xs text-grid-accent glow-accent">★</span>
                )}
              </div>
              <h3 className="font-pixel text-lg text-grid-secondary leading-tight group-hover:text-white transition-colors">
                {entry.headline}
              </h3>
            </div>
          </div>
          <p className="font-mono text-xs text-grid-primary leading-relaxed line-clamp-3">
            {entry.body}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-pixel text-sm text-grid-primary">{entry.era}</span>
            <span className="font-mono text-xs text-grid-accent opacity-0 group-hover:opacity-100 transition-opacity">
              READ MORE →
            </span>
          </div>
        </div>
      </article>

      {open && <Modal entry={entry} onClose={() => setOpen(false)} />}
    </>
  )
}