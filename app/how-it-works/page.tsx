import { NavBar } from '@/components/NavBar'

const RULES = [
  { name: 'Grand Migration', trigger: 'PixelsTransformed ≥ 200 pixels', desc: 'Mass movement recorded through the Grid.' },
  { name: 'Territorial Claim', trigger: 'PixelsTransformed 50–199 pixels', desc: 'A faction marks its presence across a region.' },
  { name: 'Subtle Inscription', trigger: 'PixelsTransformed < 50 pixels', desc: 'A scholar leaves a precise mark in the lattice.' },
  { name: 'Faction Declaration', trigger: 'Pixel count divisible by 50', desc: 'A formal institutional statement is recorded.' },
  { name: "Scholar's Work", trigger: 'Veteran address (seen before)', desc: 'Accumulated expertise produces refined lore.' },
  { name: "Wanderer's Passage", trigger: 'New address (first appearance)', desc: 'An unknown entity arrives at the threshold.' },
  { name: 'Foundation Stone', trigger: 'Token ID < 1,000', desc: 'One of the oldest presences stirs and acts.' },
  { name: 'Record of the Deep', trigger: 'Token ID > 8,000', desc: 'A voice from the outer reaches is heard.' },
  { name: 'The Unmapped', trigger: 'Token ID 5,000–6,000', desc: 'The interior of the Grid reveals itself.' },
  { name: "Oracle's Observation", trigger: 'Prime-numbered token ID', desc: 'An irreducible presence takes action.' },
  { name: 'Power Infusion', trigger: 'BurnRevealed ≥ 10 action points', desc: 'A heavy offering is made to the Grid.' },
  { name: 'Ethereal Infusion', trigger: 'BurnRevealed < 10 action points', desc: 'A quiet offering ripples through the Lattice.' },
  { name: 'Rite of Recognition', trigger: 'BurnRevealed, veteran address', desc: 'Two entities are permanently bound.' },
  { name: 'Faction Rise', trigger: 'Same address appears multiple times', desc: 'A sustained presence consolidates power.' },
  { name: 'Prophecy Spoken', trigger: 'Every 25th event', desc: 'The world pauses to observe itself.' },
  { name: 'New Era Dawn', trigger: 'Event count crosses era threshold', desc: 'A structural shift in the Chronicle begins.' },
  { name: 'Convergence Point', trigger: 'Multiple events in the same block', desc: 'Unplanned harmony occurs across the Grid.' },
  { name: 'Lull Between Ages', trigger: 'Block gap > 10,000 between events', desc: 'A long quiet — the Grid holds its breath.' },
  { name: 'Artifact Discovery', trigger: 'Rare transaction hash pattern', desc: 'A hidden relic is revealed by the Grid.' },
]

const ERAS = [
  ['0', 'The Void Before'],
  ['5', 'The First Stirring'],
  ['15', 'Age of Awakening'],
  ['40', 'Age of Wanderers'],
  ['80', 'The Settling'],
  ['150', 'Age of Guilds'],
  ['280', 'The Meridian'],
  ['500', 'Age of Monuments'],
  ['900', 'The Long Watch'],
  ['1,500', 'Age of Lore'],
  ['2,500', 'The Great Convergence'],
]

function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>normies chronicles · ethereum · cc0</p>
        <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
          className="font-mono text-xs transition-opacity hover:opacity-60" style={{ color: 'var(--muted)' }}>
          @aster0x
        </a>
      </div>
    </footer>
  )
}

export default function HowItWorksPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen pt-11">
        <div className="max-w-2xl mx-auto px-6 pt-10 pb-16">

          <h1 className="font-mono font-bold leading-none mb-10"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: 'var(--text)' }}>
            how it<br />works
          </h1>

          <p className="font-mono text-xs leading-relaxed mb-10" style={{ color: 'var(--text)' }}>
            Normies Chronicles reads two on-chain events from the NormiesCanvas contract on Ethereum.
            Each event passes through a rule engine that maps its properties to a lore template.
            The result is deterministic — the same event always produces the same Chronicle entry.
          </p>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>on-chain events</p>
            <div className="space-y-3">
              {[
                {
                  name: 'PixelsTransformed',
                  desc: 'Emitted when a holder edits their Normie pixel by pixel. The pixel count, token ID, and wallet address all influence the lore produced.',
                },
                {
                  name: 'BurnRevealed',
                  desc: 'Emitted when a holder burns a Normie to gain action points for another. The action point count and veteran status shape the resulting entry.',
                },
              ].map(e => (
                <div key={e.name} className="p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <p className="font-mono text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>{e.name}</p>
                  <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{e.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
              lore rules ({RULES.length})
            </p>
            <div className="space-y-px">
              {RULES.map(rule => (
                <div
                  key={rule.name}
                  className="py-3 grid grid-cols-5 gap-4 border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="col-span-2">
                    <p className="font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>{rule.name}</p>
                    <p className="font-mono text-2xs mt-0.5" style={{ color: 'var(--muted)' }}>{rule.trigger}</p>
                  </div>
                  <p className="col-span-3 font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {rule.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>eras</p>
            <div className="space-y-px">
              {ERAS.map(([threshold, name]) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-2.5 border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <p className="font-mono text-xs" style={{ color: 'var(--text)' }}>{name}</p>
                  <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{threshold}+ events</p>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          <section>
            <p className="font-mono text-2xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>the world</p>
            <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
              Lore entries draw from 20 regions, 12 factions, 10 prophetic figures, and 12 legendary artifacts.
              All selections are seeded by token ID and block number — the same event always resolves
              to the same world elements.
            </p>
            <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
              Regions: the Glyph Wastes, Obsidian Moors, Cipher Peaks, Null Basin, and 16 others.
              Factions: the Cartographers, the Quiet Order, the Archive Monks, the Unnamed, and 8 others.
              Every entry is a window into the same persistent world.
            </p>
          </section>

        </div>
        <Footer />
      </main>
    </>
  )
}
