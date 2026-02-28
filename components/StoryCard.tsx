'use client'
import { useState } from 'react'
import type { StoryEntry } from '@/lib/storyGenerator'

function Modal({ entry, onClose }: { entry: StoryEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85" onClick={onClose}>
      <div
        className="max-w-md w-full bg-surface border border-border max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="pr-4">
            <p className="font-mono text-xs text-muted mb-1">{entry.era}</p>
            <h2 className="font-pixel text-2xl text-bright leading-tight">{entry.headline}</h2>
          </div>
          <button onClick={onClose} className="font-mono text-muted hover:text-bright text-lg leading-none shrink-0">✕</button>
        </div>

        {/* body */}
        <div className="p-5 border-b border-border">
          <p className="font-mono text-xs text-primary leading-relaxed">{entry.body}</p>
        </div>

        {/* rule */}
        <div className="p-5 border-b border-border">
          <p className="font-mono text-xs text-muted mb-1 uppercase tracking-widest">rule applied</p>
          <p className="font-mono text-xs text-accent mb-2">{entry.sourceEvent.ruleApplied}</p>
          <p className="font-mono text-xs text-muted leading-relaxed">{entry.sourceEvent.ruleExplanation}</p>
        </div>

        {/* chain data */}
        {entry.sourceEvent.type !== 'genesis' && (
          <div className="p-5">
            <p className="font-mono text-xs text-muted mb-3 uppercase tracking-widest">on-chain data</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['event', entry.sourceEvent.type],
                ['token', `#${entry.sourceEvent.tokenId}`],
                ['block', entry.sourceEvent.blockNumber],
                ['count', entry.sourceEvent.count],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-mono text-xs text-muted">{k}</p>
                  <p className="font-mono text-xs text-primary mt-0.5 break-all">{v}</p>
                </div>
              ))}
            </div>
            {entry.sourceEvent.txHash && entry.sourceEvent.txHash !== 'N/A' && (
              <a
                href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 font-mono text-xs text-accent hover:underline"
              >
                view on etherscan →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function StoryCard({ entry }: { entry: StoryEntry }) {
  const [open, setOpen] = useState(false)
  const isFeatured = entry.featured || entry.loreType === 'NEW_ERA_DAWN' || entry.loreType === 'PROPHECY_SPOKEN'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`w-full text-left border p-4 hover:border-dim transition-colors group ${
          isFeatured ? 'border-dim' : 'border-border'
        } bg-surface`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="font-mono text-xs text-muted">{entry.era}</span>
          <span className="font-mono text-xs text-dim shrink-0">{entry.icon}</span>
        </div>
        <h3 className="font-pixel text-xl text-bright leading-tight mb-2 group-hover:text-accent transition-colors">
          {entry.headline}
        </h3>
        <p className="font-mono text-xs text-muted leading-relaxed line-clamp-3">{entry.body}</p>
        <p className="font-mono text-xs text-dim mt-3">click to read →</p>
      </button>
      {open && <Modal entry={entry} onClose={() => setOpen(false)} />}
    </>
  )
}
