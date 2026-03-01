'use client'
import { useState } from 'react'
import { NavBar } from '@/components/NavBar'

const ERAS = [
  ['0',    'The First Days',          'The Grid is new. The first marks are being made. No one knows yet what this will become.'],
  ['100',  'The Awakening',           'Patterns are emerging. Groups sense each other for the first time.'],
  ['300',  'The Gathering',           'The Grid fills with presence. Territories begin to mean something.'],
  ['700',  'Age of Claims',           'The canvas is contested. What was open is now owned or disputed.'],
  ['1500', 'The Deepening',           'The cost becomes clear. The Grid has a history now.'],
  ['3000', 'Age of Permanence',       'Some things have been settled. Others are still being decided.'],
  ['5000', 'The Long Memory',         'Veterans outnumber newcomers. The Grid remembers everything.'],
  ['8000', 'Approach to Singularity', 'Something approaches. The Grid cannot hold all of this indefinitely.'],
]

const CORE_RULES = [
  { trigger: '200+ pixels changed',           story: 'Great Claiming — a massive territorial shift. The kind that changes what a place means.' },
  { trigger: '50–199 pixels changed',         story: 'Contested Ground — a sharp, meaningful exchange over territory.' },
  { trigger: 'Under 50 pixels',               story: 'Edge Mark — a surgical probe at the margin. Small statements are still statements.' },
  { trigger: 'Pixel count divisible by 50',   story: 'Formal Claim — perfect precision signals deliberate political intent.' },
  { trigger: 'Burn 10+ AP',                   story: 'Great Giving — a Normie dissolves so another may carry their strength forward. Permanent.' },
  { trigger: 'Burn 1–9 AP',                   story: 'Offering — a smaller gift. The world\'s quiet tithe.' },
  { trigger: 'Veteran burns again',           story: 'Renewed Oath — the giving deepens each time it is repeated.' },
  { trigger: 'Known presence returns',        story: 'Return — those who have been here before change everything when they come back.' },
  { trigger: 'First-time presence',           story: 'New Arrival — the Grid grows as new people enter it.' },
  { trigger: 'Prime-numbered token ID',       story: 'Oracle — mathematically irreducible. Acts only when the moment is exactly right.' },
  { trigger: 'Token ID under 1,000',         story: 'Ancient Stirs — one of the first to exist, present before the chronicle began.' },
  { trigger: 'Token ID over 8,000',          story: 'Far Reach — those from the distant edges migrate toward the center.' },
  { trigger: 'Token ID 5,000–6,000',         story: 'Hollow Ground — the Grid\'s contested heart. Nothing settles here permanently.' },
  { trigger: 'Every 25th entry',             story: 'Turning Point — the chronicle pauses to read the accumulated pattern.' },
  { trigger: 'Same presence 3+ entries',     story: 'Dominion Grows — a recurring presence builds something legible and intentional.' },
  { trigger: 'Block gap over 10,000',        story: 'The Silence — the Grid goes quiet. The world breathes. This is a breath.' },
  { trigger: 'Era threshold crossed',        story: 'New Age — a new chapter of the world begins. The chronicle names it.' },
  { trigger: 'Same block, two events',       story: 'Convergence — two paths arrive at the same place at the same moment, uncoordinated.' },
  { trigger: 'Rare transaction hash pattern', story: 'Discovery — something ancient surfaces. The Grid gives up a secret.' },
]

const FILLER_RULES = [
  { trigger: 'Returns within 500 blocks',       story: 'Gathering — an urgent meeting. The situation has moved faster than the planning.' },
  { trigger: 'Token ID 2,000–3,000',           story: 'Mapping — the cartographers survey the shifting terrain between events.' },
  { trigger: 'Token under 500, later in story', story: 'Old Ghost — ancient presences resurface. History folds back into the present.' },
  { trigger: 'Active presence goes quiet',      story: 'Departure — someone who was here has stopped appearing. No explanation given.' },
  { trigger: 'Every 10th entry',               story: 'Tally — the chronicler counts what has accumulated. Numbers tell a different story.' },
  { trigger: 'Returns after 20,000+ blocks',   story: 'Return from Absence — back after a very long silence. From wherever they went.' },
  { trigger: 'Veteran gives again',            story: 'Debt Paid — the cumulative cost of commitment becomes visible in the record.' },
  { trigger: 'New presence, quiet entry',      story: 'A Story Heard — the world seen fresh, through eyes that don\'t yet know it.' },
  { trigger: 'Block gap over 50,000',          story: 'The Long Dark — the Grid went silent for a very long time. Then resumed.' },
  { trigger: 'Token 8,500+ reactivates',       story: 'Edge Report — news arrives from the far margin. Not what anyone expected.' },
  { trigger: 'Veteran breaks pattern',         story: 'Changed Course — the world teaches and those who read it adapt.' },
  { trigger: 'Within 3 entries of next era',   story: 'Vigil — every act carries the weight of the approaching change.' },
  { trigger: 'New presence, first event',      story: 'Neutral Ground — not yet committed. Watching the larger story from the outside.' },
  { trigger: 'Exactly 1 pixel or 1 AP',        story: 'Ghost Mark — the smallest possible trace. The chronicle misses nothing.' },
  { trigger: 'Token 1,000–2,000, new face',   story: 'Messenger — word arrives from another part of the Grid. The world is larger.' },
  { trigger: 'Every 40th entry',              story: 'The Long Count — the world measured against the Grid\'s 40×40 architecture.' },
  { trigger: 'Short gap after busy cluster',  story: 'Between Fires — the lull between events. Ordinary things happen. The world prepares.' },
  { trigger: 'Presence with 3+ entries',      story: 'Dynasty — a lineage recognized by the chronicle. Three entries become a pattern.' },
  { trigger: 'Activity at range edges',       story: 'Crossing — known faces move through territory they have never touched.' },
  { trigger: 'Token 2,000–3,000, fallback',  story: 'The Road — the unglamorous work that makes everything else possible.' },
  { trigger: 'General fallback',             story: 'Night Watch — the watchers who hold the Grid\'s state between active events.' },
]

const CONNECTORS = [
  { trigger: 'After Great Claiming, next event follows quickly', story: 'Aftermath — auto-inserted. The world doesn\'t cut directly from a major event to the next.' },
  { trigger: '3+ consecutive major entries',                     story: 'Between Fires — auto-inserted. Breaks up consecutive events with a breath.' },
  { trigger: 'Activity surges across the Grid',                  story: 'Escalation — inserted when the chronicler detects a significant acceleration in pace.' },
  { trigger: 'Cumulative givings cross a threshold',             story: 'The Toll — marks when total sacrifices cross a milestone. The record grows heavy.' },
]

const WAR_PHASES = [
  { phase: 'Opening',    trigger: 'Default start — first events',               effect: 'Careful moves. The world is new and neither side knows the full shape of things.' },
  { phase: 'Escalating', trigger: '5,000+ pixels or 300+ entries',              effect: 'Urgency climbs. The experienced start acting like the experienced.' },
  { phase: 'Siege',      trigger: '600+ pixels in recent window or 20,000 total', effect: 'Exhaustion sets in. Entrenched positions. Every gain costs more.' },
  { phase: 'Sacrifice',  trigger: '400+ AP given cumulatively',                 effect: 'Giving becomes part of the rhythm. Every entry carries that weight.' },
  { phase: 'Reckoning',  trigger: '800+ AP given and 500+ entries',             effect: 'Final-chapter weight. Every act feels like it could be the last.' },
]

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: '4rem' }}>
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>normies chronicles · ethereum · cc0</p>
        <a href="https://x.com/aster0x" target="_blank" rel="noopener noreferrer"
          className="font-mono text-xs hover:opacity-60" style={{ color: 'var(--muted)' }}>
          @aster0x
        </a>
      </div>
    </footer>
  )
}

function ExpandSection({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left group">
        <div>
          <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</span>
          {sub && <span className="font-mono text-2xs ml-3" style={{ color: 'var(--muted)', opacity: 0.6 }}>{sub}</span>}
        </div>
        <span className="font-mono text-xs group-hover:opacity-60" style={{ color: 'var(--muted)' }}>
          {open ? '↑ hide' : '↓ show'}
        </span>
      </button>
      {open && <div className="pb-8">{children}</div>}
    </div>
  )
}

function RuleTable({ rules }: { rules: { trigger: string; story: string }[] }) {
  return (
    <div>
      {rules.map((r, i) => (
        <div key={i} className="py-3 grid grid-cols-12 gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="col-span-5">
            <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>{r.trigger}</p>
          </div>
          <p className="col-span-7 font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{r.story}</p>
        </div>
      ))}
    </div>
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

          <div className="mb-10 space-y-4">
            <p className="font-mono text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              The Normies Chronicles is a living story generated from real events on the Normies canvas — 
              but the story never mentions them directly. What happens on the canvas becomes what happens 
              in the world: territorial moves, discoveries, sacrifices, silences, arrivals, departures. 
              The Grid is a real place. Its inhabitants are real people. The chronicle records what they do.
            </p>
            <p className="font-mono text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              40 rules — one for each row and column of the 40×40 Grid — interpret every canvas event 
              and decide what it means to the story. The same event produces different prose depending 
              on where the story currently is: early or late, tense or quiet, fresh or weathered. 
              Nothing is random — the same event always generates the same entry.
            </p>
            <p className="font-mono text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              The world is not always about conflict. The chronicle has politics, exploration, mystery, 
              daily life, old stories, new arrivals, quiet seasons, and moments of real weight. 
              The canvas is still new — we are in <span style={{ color: 'var(--text)' }}>The First Days</span>. 
              The eras ahead are long. What this world becomes depends on what happens in it.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }}>

            <ExpandSection label="how it runs">
              <div>
                {[
                  ['index',      'The site reads every pixel edit and burn from the Normies canvas on Ethereum mainnet, in order, from the beginning. Every act ever taken on the Grid, in sequence.'],
                  ['cache',      'Events are stored so subsequent loads are fast. Only new blocks are fetched on each update. The cache refreshes automatically on a regular cycle.'],
                  ['world state','As events are processed in sequence, a world state accumulates: total marks made, total givings, recent activity levels, current phase, and what the last major entry was. Every rule reads this state.'],
                  ['match',      'Each event runs through 40 rules in priority order. The first rule that fits fires. The rule then selects the most contextually fitting text based on the current phase and what came before — so quiet after a great claiming reads as aftermath, not generic silence.'],
                  ['connect',    'After each entry, the engine checks whether a synthetic connector should be inserted — an Aftermath after a major event, a Toll milestone when enough has been given, or a note when the pace surges.'],
                  ['fill',       'Names and places are seeded by token ID and block number — fully deterministic. The same canvas event always maps to the same region, faction, and relic. The world is consistent.'],
                ].map(([label, text]) => (
                  <div key={label} className="py-4 grid grid-cols-12 gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="col-span-2 font-mono text-2xs uppercase tracking-widest pt-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="col-span-10 font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{text}</p>
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection label="on-canvas events">
              <div className="space-y-3">
                {[
                  { name: 'Pixel Edit', desc: 'A holder spends action points to change their Normie\'s pixel data. In the story: a territorial move — a great claiming, a skirmish, a formal declaration, an edge probe, a discovery. The extent, the token ID, the block timing, and the holder\'s history all shape which rule fires and how the prose reads.' },
                  { name: 'Burn', desc: 'A holder burns a Normie to transfer its action points to another. Permanent on-chain. In the story: a giving — the dissolved Normie\'s strength carried forward into those who remain. The amount given determines whether it is a Great Giving, an Offering, a Renewed Oath, or a Ghost Mark.' },
                ].map(e => (
                  <div key={e.name} className="p-4" style={{ border: '1px solid var(--border)' }}>
                    <p className="font-mono text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>{e.name}</p>
                    <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{e.desc}</p>
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection label="19 core rules" sub="the major beats of the story">
              <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                Core rules fire on the most significant patterns and produce the main beats of the 
                story — great claimings, givings, discoveries, silences, new arrivals, turning points, 
                new ages. Each core rule is tracked by the world state so subsequent entries can react 
                to it contextually. Phase-specific variants produce different prose early vs. late.
              </p>
              <RuleTable rules={CORE_RULES} />
            </ExpandSection>

            <ExpandSection label="21 filler rules" sub="texture between the main beats">
              <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                Filler rules fire on subtler patterns and fill the space between major events — 
                gatherings, cartography, old stories, quiet departures, edge reports, dynasties, 
                the patient watch. Most fillers have afterContext variants: they react to the last 
                major rule that fired, so a quiet entry after a great claiming reads as aftermath 
                rather than ordinary silence.
              </p>
              <RuleTable rules={FILLER_RULES} />
            </ExpandSection>

            <ExpandSection label="4 connector rules" sub="auto-inserted for narrative coherence">
              <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                Connectors are synthetic entries — not tied to a single canvas event, but inserted 
                when the story needs a bridge. They prevent consecutive major events with no breathing 
                room, mark giving milestones, and note periods of acceleration. They appear in the 
                chronicle as part of the flow.
              </p>
              <RuleTable rules={CONNECTORS} />
            </ExpandSection>

            <ExpandSection label="5 story phases" sub="the prose changes as the world accumulates">
              <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                As events accumulate, the world state transitions through phases. Every rule has 
                access to the current phase — core rules use it to select phase-specific prose. 
                The same trigger produces different writing in the Opening than in the Reckoning. 
                We are currently in the Opening phase. The phases ahead require much more to reach.
              </p>
              <div>
                {WAR_PHASES.map((p, i) => (
                  <div key={i} className="py-3 grid grid-cols-12 gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="col-span-3">
                      <p className="font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>{p.phase}</p>
                      <p className="font-mono text-2xs mt-0.5" style={{ color: 'var(--muted)' }}>{p.trigger}</p>
                    </div>
                    <p className="col-span-9 font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{p.effect}</p>
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection label="eras">
              <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                The chronicle moves through eras as the entry count grows. Each era represents a 
                genuine shift in what the world means — not just a label change, but a different 
                texture to every entry. Eras are long by design: the canvas is new and the story 
                has barely started. We are in The First Days.
              </p>
              <div>
                {ERAS.map(([threshold, name, note]) => (
                  <div key={name} className="py-3 grid grid-cols-12 gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="col-span-2 font-mono text-2xs" style={{ color: 'var(--muted)' }}>{threshold}+</p>
                    <div className="col-span-10">
                      <p className="font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>{name}</p>
                      <p className="font-mono text-2xs mt-0.5" style={{ color: 'var(--muted)' }}>{note}</p>
                    </div>
                  </div>
                ))}
                <div className="py-3">
                  <p className="font-mono text-xs" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                    ··· Age of Conflict — begins when Normies Arena PVP launches on-chain
                  </p>
                </div>
              </div>
            </ExpandSection>

            <ExpandSection label="the world">
              <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
                Every entry draws from a consistent world: 20 regions, 12 factions, 12 commanders, 
                10 rivals, 12 relics. All selections are seeded by token ID and block number — 
                deterministic, never random. The same canvas event always maps to the same names.
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Regions (20)', items: 'the Void Margin · the Glitch Fields · the Pixel Wastes · the Null Shore · the Signal Reaches · the Deep Frame · the Fracture Line · the Synth Lowlands · the Migration Coast · the Dead Channel · the Origin Heights · the Phantom Quarter · the Drift Plains · the Threshold · the Unrendered Dark · the Eternal Row · the Latent Basin · the Corrupted Archive · the Hollow Center · the First Grid' },
                  { label: 'Factions (12)', items: 'the Voidborn · the Pixel Wardens · the Glitch Collective · the Synth Host · the Upload Faithful · the Eternal Compile · the Null Covenant · the Render Guard · the Migration Front · the Signal Corps · the Unnamed · the Origin Keepers' },
                  { label: 'Relics (12)', items: 'the First Pixel · the Null Crown · the Shattered Grid Key · the Eternal Brush · the Origin Stone · the Void Codex · the Glitch Sigil · the Last Clean Frame · the Singularity Seed · the Migration Ledger · the Signal Throne · the Grid Bell' },
                ].map(({ label, items }) => (
                  <div key={label} className="p-3" style={{ border: '1px solid var(--border)' }}>
                    <p className="font-mono text-2xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{items}</p>
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection label="the ai dispatch">
              <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
                The dispatch at the top of the Now view is generated by AI — it reads the last 35 
                chronicle entries and writes a summary as a chronicler from inside the world. 
                Present tense, atmospheric, grounded in the specific names and events it sees. 
                If the entries describe a quiet season, the dispatch reads like a quiet season.
              </p>
              <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                The dispatch regenerates every 5 new chronicle entries. It never mentions canvas 
                mechanics, blockchain, or anything technical — only the story. As the world grows 
                and the eras advance, the dispatch will read differently. It is always a live 
                picture of the world as it currently stands.
              </p>
            </ExpandSection>

          </div>
        </div>
        <Footer />
      </main>
    </>
  )
}
