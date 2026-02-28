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

export default function HowItWorksPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen pt-11">
        <div className="max-w-2xl mx-auto px-4 py-12">

          <p className="font-mono text-xs text-muted mb-3">how it works</p>
          <h1 className="font-pixel text-6xl text-bright mb-8">the system</h1>

          <p className="font-mono text-xs text-primary leading-relaxed mb-10">
            Normies Chronicles reads two on-chain events from the NormiesCanvas contract on Ethereum.
            Each event is passed through a rule engine that maps its properties to a lore template.
            The result is a deterministic, transparent story — the same event always produces the same entry.
          </p>

          <div className="border-t border-border mb-10" />

          {/* events */}
          <section className="mb-10">
            <h2 className="font-mono text-xs text-muted uppercase tracking-widest mb-4">on-chain events</h2>
            <div className="space-y-3">
              <div className="border border-border p-4">
                <p className="font-mono text-xs text-bright mb-1">PixelsTransformed</p>
                <p className="font-mono text-xs text-muted leading-relaxed">
                  Emitted when a holder edits their Normie pixel by pixel using action points.
                  The pixel count, token ID, and wallet address all influence the lore produced.
                </p>
              </div>
              <div className="border border-border p-4">
                <p className="font-mono text-xs text-bright mb-1">BurnRevealed</p>
                <p className="font-mono text-xs text-muted leading-relaxed">
                  Emitted when a holder burns a Normie to gain action points for another.
                  The action point count and veteran status shape the resulting Chronicle entry.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-border mb-10" />

          {/* rules */}
          <section className="mb-10">
            <h2 className="font-mono text-xs text-muted uppercase tracking-widest mb-4">lore rules ({RULES.length})</h2>
            <p className="font-mono text-xs text-muted leading-relaxed mb-5">
              Each event is evaluated against these rules in priority order.
              Multiple rules can apply — the highest priority wins.
            </p>
            <div className="space-y-2">
              {RULES.map(rule => (
                <div key={rule.name} className="border border-border p-3">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <p className="font-mono text-xs text-bright">{rule.name}</p>
                    <p className="font-mono text-xs text-dim shrink-0">{rule.trigger}</p>
                  </div>
                  <p className="font-mono text-xs text-muted">{rule.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-border mb-10" />

          {/* eras */}
          <section className="mb-10">
            <h2 className="font-mono text-xs text-muted uppercase tracking-widest mb-4">eras</h2>
            <p className="font-mono text-xs text-muted leading-relaxed mb-5">
              The Chronicle advances through eras as events accumulate.
              Each era shifts the narrative tone and world context.
            </p>
            <div className="space-y-1">
              {ERAS.map(([threshold, name]) => (
                <div key={name} className="flex items-center justify-between py-1.5 border-b border-border">
                  <p className="font-mono text-xs text-bright">{name}</p>
                  <p className="font-mono text-xs text-dim">{threshold}+ events</p>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-border mb-10" />

          {/* world */}
          <section className="mb-10">
            <h2 className="font-mono text-xs text-muted uppercase tracking-widest mb-4">the world</h2>
            <p className="font-mono text-xs text-muted leading-relaxed mb-3">
              Lore entries draw from 20 regions, 12 factions, 10 prophetic figures, and 12 legendary
              artifacts. All selections are deterministic — seeded by token ID and block number —
              so the same event always resolves to the same world elements.
            </p>
            <p className="font-mono text-xs text-muted leading-relaxed">
              Regions include the Glyph Wastes, Obsidian Moors, Cipher Peaks, and the Null Basin.
              Factions include the Cartographers, the Quiet Order, the Archive Monks, and the Unnamed.
              Every entry is a window into the same persistent world.
            </p>
          </section>

        </div>

        <footer className="border-t border-border">
          <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
            <p className="font-mono text-xs text-dim">normies chronicles · ethereum · cc0</p>
            <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-muted hover:text-primary transition-colors">
              @aster0x
            </a>
          </div>
        </footer>
      </main>
    </>
  )
}
