'use client'
import { useState } from 'react'
import type { StoryEntry } from '@/lib/storyGenerator'

function Modal({ entry, onClose }: { entry: StoryEntry; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full max-h-[80vh] overflow-y-auto"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="pr-4">
            <p className="font-mono text-xs mb-1" style={{ color: 'var(--muted)' }}>{entry.era}</p>
            <h2 className="font-mono text-base font-bold leading-snug" style={{ color: 'var(--text)' }}>
              {entry.headline}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-lg leading-none shrink-0 transition-opacity hover:opacity-60"
            style={{ color: 'var(--muted)' }}
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
            {entry.body}
          </p>
        </div>

        {/* rule */}
        <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-mono text-2xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
            rule applied
          </p>
          <p className="font-mono text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>
            {entry.sourceEvent.ruleApplied}
          </p>
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            {entry.sourceEvent.ruleExplanation}
          </p>
        </div>

        {/* chain data */}
        {entry.sourceEvent.type !== 'genesis' && (
          <div className="p-5">
            <p className="font-mono text-2xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
              on-chain data
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['event', entry.sourceEvent.type],
                ['token', `#${entry.sourceEvent.tokenId}`],
                ['block', entry.sourceEvent.blockNumber],
                ['count', entry.sourceEvent.count],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{k}</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text)' }}>{v}</p>
                </div>
              ))}
            </div>
            {entry.sourceEvent.txHash && entry.sourceEvent.txHash !== 'N/A' && (
              <a
                href={`https://etherscan.io/tx/${entry.sourceEvent.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 font-mono text-xs underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: 'var(--text)' }}
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

export function StoryCard({ entry, index }: { entry: StoryEntry; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left p-4 transition-colors group fade-up"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          animationDelay: `${Math.min(index * 30, 300)}ms`,
          opacity: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--muted)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <p className="font-mono text-2xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
          {entry.era} · {entry.loreType.replace(/_/g, ' ').toLowerCase()}
        </p>
        <h3 className="font-mono text-sm font-bold leading-snug mb-2" style={{ color: 'var(--text)' }}>
          {entry.headline}
        </h3>
        <p className="font-mono text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--muted)' }}>
          {entry.body}
        </p>
        <p className="font-mono text-2xs mt-3 transition-opacity opacity-0 group-hover:opacity-100" style={{ color: 'var(--muted)' }}>
          click to expand →
        </p>
      </button>
      {open && <Modal entry={entry} onClose={() => setOpen(false)} />}
    </>
  )
}
