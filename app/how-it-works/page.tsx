import { NavBar } from '@/components/NavBar'
import { RULES } from '@/lib/storyGenerator'

const RULE_DISPLAY = [
  { key: 'GRAND_MIGRATION', trigger: 'PixelsTransformed ≥ 200 pixels', eventType: 'Emerge' },
  { key: 'TERRITORIAL_CLAIM', trigger: 'PixelsTransformed 50–199 pixels', eventType: 'Emerge' },
  { key: 'SUBTLE_INSCRIPTION', trigger: 'PixelsTransformed < 50 pixels', eventType: 'Emerge' },
  { key: 'FACTION_DECLARATION', trigger: 'PixelsTransformed, count divisible by 50', eventType: 'Emerge' },
  { key: 'SCHOLARS_WORK', trigger: 'Known address (veteran), PixelsTransformed', eventType: 'Emerge' },
  { key: 'WANDERERS_PASSAGE', trigger: 'New address (first appearance), PixelsTransformed', eventType: 'Emerge' },
  { key: 'FOUNDATION_STONE', trigger: 'TokenId < 1,000 (founding presence)', eventType: 'Either' },
  { key: 'RECORD_OF_THE_DEEP', trigger: 'TokenId > 8,000 (outer margins)', eventType: 'Either' },
  { key: 'THE_UNMAPPED', trigger: 'TokenId 5,000–6,000 (interior)', eventType: 'Either' },
  { key: 'ORACLES_OBSERVATION', trigger: 'Prime-numbered tokenId', eventType: 'Either' },
  { key: 'POWER_INFUSION', trigger: 'BurnRevealed ≥ 10 action points', eventType: 'Ascend' },
  { key: 'ETHEREAL_INFUSION', trigger: 'BurnRevealed < 10 action points', eventType: 'Ascend' },
  { key: 'RITE_OF_RECOGNITION', trigger: 'BurnRevealed, veteran address', eventType: 'Ascend' },
  { key: 'FACTION_RISE', trigger: 'Same address appears multiple times', eventType: 'Either' },
  { key: 'PROPHECY_SPOKEN', trigger: 'Every 25th event in the Chronicle', eventType: 'System' },
  { key: 'NEW_ERA_DAWN', trigger: 'Cumulative event count crosses era threshold', eventType: 'System' },
  { key: 'CONVERGENCE_POINT', trigger: 'Multiple events in the same block', eventType: 'System' },
  { key: 'LULL_BETWEEN_AGES', trigger: 'Block gap > 10,000 between events', eventType: 'System' },
  { key: 'ARTIFACT_DISCOVERY', trigger: 'Rare transaction hash pattern', eventType: 'System' },
]

const ERAS = [
  { threshold: '0', name: 'The Void Before' },
  { threshold: '5', name: 'The First Stirring' },
  { threshold: '15', name: 'Age of Awakening' },
  { threshold: '40', name: 'Age of Wanderers' },
  { threshold: '80', name: 'The Settling' },
  { threshold: '150', name: 'Age of Guilds' },
  { threshold: '280', name: 'The Meridian' },
  { threshold: '500', name: 'Age of Monuments' },
  { threshold: '900', name: 'The Long Watch' },
  { threshold: '1,500', name: 'Age of Lore' },
  { threshold: '2,500', name: 'The Great Convergence' },
]

const EVENT_COLORS: Record<string, string> = {
  Emerge: 'border-blue-500/30 text-blue-400',
  Ascend: 'border-purple-500/30 text-purple-400',
  System: 'border-grid-accent/30 text-grid-accent',
  Either: 'border-grid-border text-grid-primary',
}

export default function HowItWorksPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen pt-12">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-2">
            <span className="font-mono text-xs text-grid-accent tracking-widest">// DOCUMENTATION</span>
          </div>
          <h1 className="font-pixel text-5xl text-grid-secondary mb-8">HOW IT WORKS</h1>

          {/* Overview */}
          <section className="mb-12 border border-grid-border bg-grid-surface p-6">
            <h2 className="font-pixel text-2xl text-grid-accent mb-4">THE PRINCIPLE</h2>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed mb-4">
              The Normie Chronicles reads the NormiesCanvas smart contract on Ethereum mainnet in real time.
              Every on-chain event becomes raw material for world-building lore — translated through a deterministic
              rule system into story entries that grow the Chronicle organically.
            </p>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed">
              No pixel counts or burn quantities appear in the story. Only the world-level consequence: migrations,
              inscriptions, faction rises, artifact discoveries. The chain data is always available in the event
              popup for full transparency, but the narrative speaks a different language.
            </p>
          </section>

          {/* Data sources */}
          <section className="mb-12">
            <h2 className="font-pixel text-2xl text-grid-accent mb-4">DATA SOURCES</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-grid-border bg-grid-surface p-4">
                <p className="font-mono text-xs text-grid-accent mb-2 tracking-widest">CONTRACT</p>
                <p className="font-mono text-xs text-grid-secondary break-all">NormiesCanvas</p>
                <p className="font-mono text-xs text-grid-primary break-all mt-1">0x64951d92...810E869c</p>
              </div>
              <div className="border border-grid-border bg-grid-surface p-4">
                <p className="font-mono text-xs text-grid-accent mb-2 tracking-widest">EVENTS INDEXED</p>
                <p className="font-mono text-xs text-grid-secondary">PixelsTransformed</p>
                <p className="font-mono text-xs text-grid-secondary">BurnRevealed</p>
              </div>
              <div className="border border-grid-border bg-grid-surface p-4">
                <p className="font-mono text-xs text-grid-accent mb-2 tracking-widest">INDEXING METHOD</p>
                <p className="font-mono text-xs text-grid-secondary">viem getLogs</p>
                <p className="font-mono text-xs text-grid-primary">2,000-block pagination</p>
              </div>
              <div className="border border-grid-border bg-grid-surface p-4">
                <p className="font-mono text-xs text-grid-accent mb-2 tracking-widest">DETERMINISM</p>
                <p className="font-mono text-xs text-grid-secondary">tokenId + blockNumber → seed</p>
                <p className="font-mono text-xs text-grid-primary">Same event always = same story</p>
              </div>
            </div>
          </section>

          {/* Rule system */}
          <section className="mb-12">
            <h2 className="font-pixel text-2xl text-grid-accent mb-2">THE RULE SYSTEM</h2>
            <p className="font-mono text-xs text-grid-primary mb-6 leading-relaxed">
              19 rules map on-chain triggers to lore categories. Rules are evaluated in priority order.
              Each rule has 4 headline templates and 4 body templates — selection is seeded from the event
              data for deterministic but varied output.
            </p>
            <div className="space-y-2">
              {RULE_DISPLAY.map(({ key, trigger, eventType }) => {
                const rule = (RULES as Record<string, { ruleApplied: string; icon: string }>)[key]
                return (
                  <div key={key} className="border border-grid-border bg-grid-surface p-3 flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{rule?.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-grid-secondary">{key.replace(/_/g, ' ')}</span>
                        <span className={`font-mono text-xs border px-1 py-0.5 ${EVENT_COLORS[eventType]}`}>
                          {eventType}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-grid-primary">Trigger: {trigger}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Eras */}
          <section className="mb-12">
            <h2 className="font-pixel text-2xl text-grid-accent mb-2">THE ERAS</h2>
            <p className="font-mono text-xs text-grid-primary mb-6">
              The world advances through 11 eras based on the cumulative count of events processed.
              Each entry is stamped with the era active at the time of its creation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ERAS.map(({ threshold, name }) => (
                <div key={name} className="border border-grid-border p-3 flex items-center gap-3">
                  <span className="font-pixel text-lg text-grid-accent w-16 flex-shrink-0">{threshold}+</span>
                  <span className="font-mono text-xs text-grid-secondary">{name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* World */}
          <section className="mb-12">
            <h2 className="font-pixel text-2xl text-grid-accent mb-4">THE WORLD</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-grid-border bg-grid-surface p-4">
                <p className="font-mono text-xs text-grid-accent mb-3 tracking-widest">20 REGIONS</p>
                <p className="font-mono text-xs text-grid-primary leading-relaxed">
                  Glyph Wastes, Monochrome Reaches, Lattice Plains, Obsidian Moors, Silver Threshold,
                  Hollow Deep, Cipher Peaks, Wandering Shore, Pale Expanse, Root Network, and more.
                  Selected deterministically from tokenId + blockNumber.
                </p>
              </div>
              <div className="border border-grid-border bg-grid-surface p-4">
                <p className="font-mono text-xs text-grid-accent mb-3 tracking-widest">12 FACTIONS</p>
                <p className="font-mono text-xs text-grid-primary leading-relaxed">
                  The Cartographers, Quiet Order, Lattice Keepers, Pale Wanderers, Archive Monks,
                  Threshold Watch, Deep Seekers, Signal Weavers, Monolith Circle, the Unnamed, Wayfarers, Root Scholars.
                </p>
              </div>
              <div className="border border-grid-border bg-grid-surface p-4">
                <p className="font-mono text-xs text-grid-accent mb-3 tracking-widest">12 ARTIFACTS</p>
                <p className="font-mono text-xs text-grid-primary leading-relaxed">
                  The Codex of Unmarked Days, Pale Crown of Thresholds, Mirror That Remembers Wrongly,
                  Bone Compass of the First Walk, Ink That Burns Cold, and 7 more hidden relics.
                </p>
              </div>
            </div>
          </section>

          {/* Transparency */}
          <section className="border border-grid-accent/20 bg-grid-surface p-6">
            <h2 className="font-pixel text-2xl text-grid-accent mb-4">FULL TRANSPARENCY</h2>
            <p className="font-mono text-xs text-grid-secondary leading-relaxed">
              Every story entry links back to its originating on-chain event. Click any entry in the Chronicle
              to see exactly which rule was applied, why it was applied, and a direct link to the transaction
              on Etherscan. The lore is fiction. The chain data is fact. Both are always available.
            </p>
          </section>
        </div>

        <footer className="border-t border-grid-border mt-12">
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-mono text-xs text-grid-primary">NORMIE CHRONICLES · BUILT ON ETHEREUM · CC0</p>
            <p className="font-mono text-xs text-grid-primary">
              BY <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer" className="text-grid-accent hover:underline">@ASTER0X</a>
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
