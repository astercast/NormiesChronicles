import { NavBar } from '@/components/NavBar'

const ORIGINAL_RULES = [
  { num: 1,  name: 'Grand Migration',      trigger: 'PixelsTransformed ≥ 200 pixels',              desc: 'A mass movement is recorded across the Grid.' },
  { num: 2,  name: 'Territorial Claim',    trigger: 'PixelsTransformed 50–199 pixels',              desc: 'A faction stakes claim to a region of the Grid.' },
  { num: 3,  name: 'Subtle Inscription',   trigger: 'PixelsTransformed < 50 pixels',               desc: 'A precise scholarly mark is left on the surface.' },
  { num: 4,  name: 'Faction Declaration',  trigger: 'Pixel count divisible by 50',                  desc: 'A formal institutional statement is filed.' },
  { num: 5,  name: "Scholar's Work",       trigger: 'Known address (veteran)',                       desc: 'Accumulated expertise produces deep lore.' },
  { num: 6,  name: "Wanderer's Passage",   trigger: 'New address (first appearance)',               desc: 'A newcomer arrives at the threshold for the first time.' },
  { num: 7,  name: 'Power Infusion',       trigger: 'BurnRevealed ≥ 10 action points',             desc: 'A major offering reshapes the Lattice.' },
  { num: 8,  name: 'Ethereal Infusion',    trigger: 'BurnRevealed < 10 action points',             desc: 'A quiet offering settles into the deep structure.' },
  { num: 9,  name: 'Rite of Recognition',  trigger: 'BurnRevealed, veteran address',               desc: 'Two entities are permanently bound in the record.' },
  { num: 10, name: "Oracle's Observation", trigger: 'Prime-numbered token ID',                      desc: 'An irreducible presence takes action.' },
  { num: 11, name: 'Foundation Stone',     trigger: 'Token ID < 1,000',                            desc: 'One of the oldest presences stirs and acts.' },
  { num: 12, name: 'Record of the Deep',   trigger: 'Token ID > 8,000',                            desc: 'A voice from the outer reaches is heard.' },
  { num: 13, name: 'The Unmapped',         trigger: 'Token ID 5,000–6,000',                        desc: 'The interior of the Grid reveals itself.' },
  { num: 14, name: 'Prophecy Spoken',      trigger: 'Every 25th event',                            desc: 'The world pauses to observe its own arc.' },
  { num: 15, name: 'Faction Rise',         trigger: 'Same address appears multiple times',          desc: 'A sustained presence consolidates power.' },
  { num: 16, name: 'Lull Between Ages',    trigger: 'Block gap > 10,000',                          desc: 'The Grid enters a period of preparation and rest.' },
  { num: 17, name: 'New Era Dawn',         trigger: 'Event count crosses era threshold',           desc: 'A structural shift — one age ends, another begins.' },
  { num: 18, name: 'Convergence Point',    trigger: 'Multiple events in the same block',           desc: 'Separate paths meet in an unplanned resonance.' },
  { num: 19, name: 'Artifact Discovery',   trigger: 'Rare transaction hash pattern',               desc: 'The Grid reveals a hidden relic from its deep history.' },
]

const NEW_RULES = [
  { num: 20, name: 'Council Convenes',     trigger: 'Same address returns within 500 blocks',      desc: 'A rapid return suggests deliberation — a council forming.' },
  { num: 21, name: 'The Cartography',      trigger: 'Token ID 2,000–3,000',                        desc: 'A systematic mapping of territory is filed with the Archive.' },
  { num: 22, name: 'Echo of the Ancient',  trigger: 'Founding-era token (< 500) after index 10',  desc: 'The ancient world responds to the new — history folds back.' },
  { num: 23, name: 'Border Crossing',      trigger: 'Veteran address, random roll (1-in-6)',       desc: 'A known presence moves between established territories.' },
  { num: 24, name: 'The Reckoning',        trigger: 'Every 10th event (not 25th or 40th)',         desc: 'The Archive counts what has accumulated and acknowledges its weight.' },
  { num: 25, name: 'Signal Lost',          trigger: 'Active address falls silent after notable act', desc: 'A vocal presence goes quiet — the absence is documented.' },
  { num: 26, name: 'Signal Found',         trigger: 'Address reappears after gap > 20,000 blocks', desc: 'A lost signal returns, carrying the weight of its silence.' },
  { num: 27, name: 'Debt Recorded',        trigger: 'Veteran BurnRevealed with 2+ prior burns',   desc: 'A prior act finds its formal consequence in the Lattice.' },
  { num: 28, name: 'The Translation',      trigger: 'Deep-margin and founding-era tokens near each other', desc: 'A bridge across the Grid\'s great inner geography.' },
  { num: 29, name: 'Silent Witness',       trigger: 'New address, random roll (1-in-5)',           desc: 'Two presences share a moment without knowing the other is there.' },
  { num: 30, name: 'Passage Sealed',       trigger: 'Distinctive final pattern from consistent address', desc: 'A deliberate conclusion — the minimum viable ending.' },
  { num: 31, name: 'The Forgetting',       trigger: 'Block gap > 50,000',                          desc: 'A stretch so long the record must reintroduce itself to its own history.' },
  { num: 32, name: 'Return from Margin',   trigger: 'Token ID > 8,500, echoes prior center event', desc: 'The far edge reflects the center\'s own history back at it.' },
  { num: 33, name: 'Archive Correction',   trigger: 'Event breaks pattern from same address',      desc: 'The world revises what the record thought it knew.' },
  { num: 34, name: 'The Interlude',        trigger: 'Gap of 3,000–6,000 blocks after cluster',    desc: 'A brief rest that gives surrounding events their shape.' },
  { num: 35, name: 'Lineage Noted',        trigger: 'Token from range that has appeared 3+ times', desc: 'A recurrent pattern that cannot be explained by coincidence.' },
  { num: 36, name: 'Threshold Watched',    trigger: 'Within 3 events of next era threshold',      desc: 'The world poised at the edge — every act now carries extra weight.' },
  { num: 37, name: 'The Accord',           trigger: 'New address, random roll (1-in-5)',           desc: 'Two independent presences find unexpected alignment.' },
  { num: 38, name: 'Dust Record',          trigger: 'Exactly 1 pixel or 1 action point',          desc: 'The minimum viable mark — the quietest possible statement of existence.' },
  { num: 39, name: 'Emissary Arrives',     trigger: 'New address with token ID 1,000–2,000',      desc: 'A new voice carrying an old mandate — a representative of the deep past.' },
  { num: 40, name: 'The Long Count',       trigger: 'Every 40th event',                           desc: 'The Grid counts itself — honoring the 40×40 architecture of all Normies.' },
]

const ERAS = [
  ['0',     'The Void Before'],
  ['5',     'The First Stirring'],
  ['15',    'Age of Awakening'],
  ['40',    'Age of Wanderers'],
  ['80',    'The Settling'],
  ['150',   'Age of Guilds'],
  ['280',   'The Meridian'],
  ['500',   'Age of Monuments'],
  ['900',   'The Long Watch'],
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

function RuleRow({ num, name, trigger, desc }: { num: number; name: string; trigger: string; desc: string }) {
  return (
    <div className="py-3 grid grid-cols-12 gap-4 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="col-span-1">
        <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>{String(num).padStart(2, '0')}</p>
      </div>
      <div className="col-span-4">
        <p className="font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>{name}</p>
        <p className="font-mono text-2xs mt-0.5" style={{ color: 'var(--muted)' }}>{trigger}</p>
      </div>
      <p className="col-span-7 font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen pt-11">
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-16">

          <h1 className="font-mono font-bold leading-none mb-10"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: 'var(--text)' }}>
            how it<br />works
          </h1>

          {/* intro */}
          <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
            Normies Chronicles is fiction influenced by real decisions. Every story entry is generated
            from an actual on-chain event — a real wallet, a real token, a real transaction on Ethereum.
            Nothing is invented. The raw data is translated into narrative through a deterministic rule
            engine: the same event will always produce the same Chronicle entry, forever.
          </p>

          <p className="font-mono text-2xs uppercase tracking-widest mt-8 mb-3" style={{ color: 'var(--muted)' }}>how it works, step by step</p>

          <div className="space-y-0 mb-8">
            {[
              ['1. index', 'The site reads every PixelsTransformed and BurnRevealed event ever emitted by the NormiesCanvas contract (0x64951d92e345C50381267380e2975f66810E869c) on Ethereum mainnet, starting from the deploy block. Events are fetched in 5,000-block chunks using viem\'s getLogs, with both event types fetched in parallel per chunk. The result is a chronologically sorted list of every on-chain action ever taken.'],
              ['2. cache', 'The full index is stored in Vercel Blob as a JSON cache with a last-known block pointer. On subsequent requests, only new blocks since that pointer are fetched — making every request after the first cold start near-instant. The cache refreshes every 5 minutes or when new blocks are detected.'],
              ['3. evaluate', 'Each event is passed through the rule engine with full context: its type, token ID, pixel/action count, wallet address, block number, transaction hash, its position in the sequence, and the history of every prior event. The engine evaluates 40 prioritized rules in order — structural milestones first, then rare patterns, then temporal signals, then token-range rules, then scale rules, then address history — and selects the first matching rule.'],
              ['4. seed', 'Once a rule is selected, the lore context is built deterministically. The region, faction, prophetic figure, and artifact assigned to the entry are all derived from a seed computed from the token ID and block number. The same token acting in the same block always gets the same world elements. Headline and body templates are selected the same way — there is no randomness.'],
              ['5. render', 'The selected rule\'s headline and body templates are filled with the seeded world elements — {region}, {faction}, {figure}, {artifact}, {era} — to produce the final Chronicle entry. The entry is tagged with its rule name, explanation, and the original on-chain data, all visible when you click any card.'],
            ].map(([label, text]) => (
              <div key={label} className="py-4 border-b grid grid-cols-12 gap-4" style={{ borderColor: 'var(--border)' }}>
                <p className="col-span-2 font-mono text-2xs uppercase tracking-widest pt-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
                <p className="col-span-10 font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{text}</p>
              </div>
            ))}
          </div>

          <p className="font-mono text-xs leading-relaxed mb-10" style={{ color: 'var(--text)' }}>
            The result is a story that no one wrote. It emerged from thousands of independent decisions
            made by Normies holders acting on-chain. The rule engine gave those decisions a voice —
            translated them from transaction data into narrative. Every entry is verifiable.
            Click any card to see the exact event that triggered it.
          </p>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          {/* on-chain events */}
          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>on-chain events</p>
            <div className="space-y-3">
              {[
                { name: 'PixelsTransformed', desc: 'Emitted when a holder edits their Normie pixel by pixel using action points. The pixel count, token ID, and wallet address all influence the lore produced.' },
                { name: 'BurnRevealed', desc: 'Emitted when a holder burns a Normie to transfer action points to another. The action point count, address history, and token ID shape the resulting entry.' },
              ].map(e => (
                <div key={e.name} className="p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <p className="font-mono text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>{e.name}</p>
                  <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{e.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          {/* the 40 rules */}
          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
              40 lore rules
            </p>
            <p className="font-mono text-xs leading-relaxed mb-6" style={{ color: 'var(--text)' }}>
              We chose exactly 40 rules — one for each row and column of the legendary Normies 40×40 Grid.
              The first 19 rules map the major events and structural moments of the Chronicle.
              The next 21 are connective tissue: they bridge the major events, add context between them,
              and ensure the story flows as a coherent world rather than isolated records.
              Together, they form a complete system — as complete as the Grid itself.
            </p>

            <p className="font-mono text-2xs uppercase tracking-widest mb-3 mt-6" style={{ color: 'var(--muted)' }}>
              core rules (1–19)
            </p>
            <div>
              {ORIGINAL_RULES.map(r => <RuleRow key={r.num} {...r} />)}
            </div>

            <p className="font-mono text-2xs uppercase tracking-widest mb-3 mt-8" style={{ color: 'var(--muted)' }}>
              connective rules (20–40)
            </p>
            <div>
              {NEW_RULES.map(r => <RuleRow key={r.num} {...r} />)}
            </div>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          {/* eras */}
          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>eras</p>
            <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--text)' }}>
              The Chronicle advances through eras as events accumulate. Each era shifts the narrative
              tone and world context. The current era is determined by the total number of
              on-chain events recorded so far.
            </p>
            <div>
              {ERAS.map(([threshold, name]) => (
                <div key={name} className="flex items-center justify-between py-2.5 border-b"
                  style={{ borderColor: 'var(--border)' }}>
                  <p className="font-mono text-xs" style={{ color: 'var(--text)' }}>{name}</p>
                  <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{threshold}+ events</p>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          {/* the world */}
          <section className="mb-10">
            <p className="font-mono text-2xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>the world</p>
            <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
              Lore entries draw from 20 regions, 12 factions, 10 prophetic figures, and 12 legendary artifacts.
              All selections are seeded by token ID and block number — the same event always resolves
              to the same world elements. The world is consistent, not random.
            </p>
            <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
              Regions include the Glyph Wastes, Obsidian Moors, Cipher Peaks, and the Null Basin.
              Factions include the Cartographers, the Quiet Order, the Archive Monks, and the Unnamed.
              Every entry is a window into the same persistent world — the Chronicle is one story,
              told across thousands of on-chain acts.
            </p>
          </section>

          <div className="border-t mb-10" style={{ borderColor: 'var(--border)' }} />

          {/* what comes next */}
          <section>
            <p className="font-mono text-2xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>what comes next</p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
              The Chronicle is built for what is coming. When Normies Arena — the official PVP battle
              system — launches on-chain, a new class of events will be tracked: combat records,
              victories, defeats, alliances, and the first time one Normie faces another in the Grid.
            </p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
              With Arena comes a new era — the Age of Conflict — and 40 new lore rules built specifically
              around combat, rivalry, and the political consequences of battle. The PVP era will be
              the largest single expansion to the Chronicle system, matching the scope of the original
              40 rules with 40 new ones built for war.
            </p>
            <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              For now, the Chronicle watches, records, and accumulates. The story being built
              today is the foundation that will make the Arena era legible — a world with
              deep history, established factions, and known territory. When the fighting starts,
              it will mean something because of everything that came before it.
            </p>
          </section>

        </div>
        <Footer />
      </main>
    </>
  )
}
