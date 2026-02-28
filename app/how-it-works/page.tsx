'use client'
import { useState } from 'react'
import { NavBar } from '@/components/NavBar'

const ERAS = [
  ['0',   'The Quiet Before',  'The factions have not yet committed. The Grid waits.'],
  ['10',  'First Blood',       'The first marks have been made. There is no going back.'],
  ['30',  'The Gathering',     'Sides are forming. Allegiances are being tested.'],
  ['75',  'Age of Advance',    'The war is fully joined. Territory changes daily.'],
  ['150', 'The Deepening',     'The cost becomes clear. The war will not end soon.'],
  ['300', 'Age of Siege',      'Positions harden. Each gain is fought for twice.'],
  ['500', 'The Long Campaign', 'The war has a history now. Veterans outnumber recruits.'],
  ['800', 'The Reckoning',     'Something has to break. The Grid cannot hold all of this.'],
]

// The 19 core rules — the spine of the war
const CORE_RULES = [
  { trigger: '200+ pixels changed',          story: 'Great Battle — a full territorial assault, the largest kind of strike.' },
  { trigger: '50–199 pixels changed',        story: 'Skirmish — a significant clash. Real gains, real losses.' },
  { trigger: 'Under 50 pixels',              story: 'Border Raid — precise, deliberate, a needle mark on the margin.' },
  { trigger: 'Pixel count divisible by 50',  story: 'Formal Declaration — measured precision signals political intent, not just battle.' },
  { trigger: 'Burn 10+ AP',                  story: 'Great Sacrifice — a warrior gives everything so another may fight on.' },
  { trigger: 'Burn 1–9 AP',                  story: 'Offering — a smaller sacrifice. The war\'s ongoing tithe.' },
  { trigger: 'Veteran wallet burns again',   story: 'Blood Oath — a sworn warrior renews their vow a second time.' },
  { trigger: 'Known address returns',        story: 'Veteran Returns — a fighter who has been here before comes back.' },
  { trigger: 'First-time address',           story: 'New Blood — a stranger joins the conflict. The war grows.' },
  { trigger: 'Prime-numbered token ID',      story: 'The Oracle — a mathematically irreducible presence moves only when the moment is exact.' },
  { trigger: 'Token ID under 1,000',         story: 'Ancient Wakes — one of the oldest forces stirs. They pre-date the current war.' },
  { trigger: 'Token ID over 8,000',          story: 'Far Reach — the distant edge enters the center. The margins become the front.' },
  { trigger: 'Token ID 5,000–6,000',         story: 'Hollow Ground — the most contested middle. Always disputed, never settled.' },
  { trigger: 'Every 25th event',             story: 'Turning Point — the war\'s accumulated pattern is read aloud. Fate speaks through mathematics.' },
  { trigger: 'Same address 3+ times',        story: 'Dominion Grows — a faction accumulates presence, building toward something.' },
  { trigger: 'Block gap over 10,000',        story: 'The Silence — the front goes quiet. The war breathes.' },
  { trigger: 'Era threshold crossed',        story: 'New Age — a structural shift. The war enters a chapter it has not been in before.' },
  { trigger: 'Same block, two events',       story: 'Convergence — two forces move at the exact same moment. An unplanned collision.' },
  { trigger: 'Rare transaction hash pattern',story: 'Relic Found — something ancient surfaces from the deep patterns of the Grid.' },
]

// The 21 filler rules — the texture between battles
const FILLER_RULES = [
  { trigger: 'Returns within 500 blocks',    story: 'War Council — commanders reconvening urgently. The situation is moving fast.' },
  { trigger: 'Token ID 2,000–3,000',         story: 'Cartography — the mapmakers chart new ground. Knowledge as a weapon.' },
  { trigger: 'Token under 500, late in war', story: 'Old Ghost — an ancient name resurfaces. History folds back into the present.' },
  { trigger: 'Active address goes silent',   story: 'The Deserter — someone who was part of the war has left it.' },
  { trigger: 'Every 10th event',             story: 'Tally — the chronicler counts the war\'s accumulated cost and reads it aloud.' },
  { trigger: 'Returns after 20,000+ blocks', story: 'Returned Ghost — back after a very long absence. Changed by wherever they were.' },
  { trigger: 'Veteran burns 2+ times',       story: 'Debt Paid — the cumulative cost of giving more than once becomes visible.' },
  { trigger: 'New address, quiet entry',     story: 'Campfire Tale — a newcomer talks at the edge of camp. The war seen fresh.' },
  { trigger: 'Block gap over 50,000',        story: 'The Long Dark — the war went underground. The chronicle went blank.' },
  { trigger: 'Token 8,500+ re-emerges',      story: 'Edge Scouts — news from the far margin. The outer war comes inward.' },
  { trigger: 'Veteran breaks pattern',       story: 'Shifted Plan — a veteran changes their approach. The war teaches.' },
  { trigger: 'Within 3 events of next era',  story: 'Vigil — the world holds its breath. Every move carries extra weight.' },
  { trigger: 'New address, first move',      story: 'Neutral Ground — someone not yet at war. Watching. Waiting.' },
  { trigger: 'Exactly 1 pixel or 1 AP',      story: 'Ghost Mark — the smallest possible trace. The chronicle misses nothing.' },
  { trigger: 'Token 1,000–2,000, new wallet',story: 'Messenger — word from another part of the conflict arrives.' },
  { trigger: 'Every 40th event',             story: 'The Long Count — the war measures itself against the Grid\'s 40×40 architecture.' },
  { trigger: 'Short gap after busy cluster', story: 'Between Fires — the camp at rest. The ordinary life of a war.' },
  { trigger: 'Address with 3+ entries',      story: 'Dynasty — a lineage is recognized. A force that has been here keeps being here.' },
  { trigger: 'Activity across range edges',  story: 'Crossing — armies move into unfamiliar territory. The war expands.' },
  { trigger: 'Token 2,000–3,000, fallback',  story: 'Supply Road — the war\'s logistics. Whoever controls the roads controls the campaign.' },
  { trigger: 'General fallback',             story: 'Night Watch — the sentinels. Unglamorous, indispensable, always present.' },
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

function ExpandSection({ label, count, children }: { label: string; count?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left group">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</span>
          {count && <span className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>{count}</span>}
        </div>
        <span className="font-mono text-xs transition-opacity group-hover:opacity-60" style={{ color: 'var(--muted)' }}>
          {open ? '↑ hide' : '↓ show'}
        </span>
      </button>
      {open && <div className="pb-8">{children}</div>}
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

          {/* Core explanation */}
          <div className="mb-10 space-y-4">
            <p className="font-mono text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              Every entry in the Normies Chronicles is shaped by something real that happened on Ethereum —
              but the story never says so directly. Pixel edits become battles. Burns become sacrifices.
              Time gaps between events become ceasefires. The war tells itself through the on-chain record,
              translated invisibly into fiction.
            </p>
            <p className="font-mono text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              40 rules — one for each row and column of the Normies 40×40 grid — watch every event and
              decide what it means to the story. A large edit becomes a Great Battle. A prime token ID
              means an Oracle has moved. A long silence between events means the front has gone quiet.
              Same event always produces the same entry. Nothing is random.
            </p>
            <p className="font-mono text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              The story is early. We&apos;re still in the first chapters. When Normies Arena launches,
              a new era begins — combat, rivals, and a whole new set of rules built around actual PVP.
              Everything happening now is the foundation.
            </p>
          </div>

          {/* Expandable sections */}
          <div style={{ borderTop: '1px solid var(--border)' }}>

            <ExpandSection label="how it runs">
              <div>
                {[
                  ['index', 'The site reads every PixelsTransformed and BurnRevealed event from the Normies canvas contract on Ethereum mainnet, from the very beginning. Every action ever taken, in chronological order.'],
                  ['cache', 'The index is stored so subsequent loads are fast. Only new blocks are fetched on each update. The cache refreshes automatically as new on-chain events happen.'],
                  ['match', 'Each event goes through 40 rules in priority order. The first rule that fits is chosen. Same event, same rule, every time.'],
                  ['seed',  'The region, faction, commander, and story context are all determined by the token ID and block number — fixed, deterministic. The same Normie acting in the same block always gets the same world context.'],
                  ['write', 'The matched rule\'s story templates are filled with the seeded world elements. The Chronicle entry is complete. Click any entry to see what rule triggered it and why.'],
                ].map(([label, text]) => (
                  <div key={label} className="py-4 border-b grid grid-cols-12 gap-4" style={{ borderColor: 'var(--border)' }}>
                    <p className="col-span-2 font-mono text-2xs uppercase tracking-widest pt-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="col-span-10 font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{text}</p>
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection label="on-chain events">
              <div className="space-y-3">
                {[
                  { name: 'PixelsTransformed', desc: 'A holder edits their Normie using action points. The pixel count, token ID, timing, and wallet history all shape which story rule fires.' },
                  { name: 'BurnRevealed', desc: 'A holder burns a Normie to transfer its action points to another. Permanent and final. In the story, this becomes a sacrifice — a warrior given so another may fight on.' },
                ].map(e => (
                  <div key={e.name} className="p-4" style={{ border: '1px solid var(--border)' }}>
                    <p className="font-mono text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>{e.name}</p>
                    <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{e.desc}</p>
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection label="19 core rules — the spine of the war" count="battles, sacrifices, oracles, ages">
              <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                These 19 rules fire on the most significant on-chain patterns and produce the main beats
                of the war — the battles, sacrifices, turning points, and new eras that drive the story forward.
              </p>
              <div>
                {CORE_RULES.map((r, i) => (
                  <div key={i} className="py-3 grid grid-cols-12 gap-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="col-span-5">
                      <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>{r.trigger}</p>
                    </div>
                    <p className="col-span-7 font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{r.story}</p>
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection label="21 filler rules — the texture between battles" count="politics, rumors, lore, daily life">
              <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                These 21 rules fire on subtler patterns — the intervals between battles, the recurring
                wallets, the quiet moments. They make the war feel lived-in: campfire tales, supply roads,
                deserters, dynasties, night watches. Without them the story would be all climax and no world.
              </p>
              <div>
                {FILLER_RULES.map((r, i) => (
                  <div key={i} className="py-3 grid grid-cols-12 gap-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="col-span-5">
                      <p className="font-mono text-2xs" style={{ color: 'var(--muted)' }}>{r.trigger}</p>
                    </div>
                    <p className="col-span-7 font-mono text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{r.story}</p>
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection label="eras">
              <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                The chronicle moves through eras as events accumulate. Thresholds are calibrated to the
                real pace of Normies activity — so we&apos;re early, because we are. The PVP era will begin
                its own chapter when Arena launches on-chain.
              </p>
              <div>
                {ERAS.map(([threshold, name, note]) => (
                  <div key={name} className="py-3 border-b grid grid-cols-12 gap-4" style={{ borderColor: 'var(--border)' }}>
                    <p className="col-span-2 font-mono text-2xs" style={{ color: 'var(--muted)' }}>{threshold}+</p>
                    <div className="col-span-10">
                      <p className="font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>{name}</p>
                      <p className="font-mono text-2xs mt-0.5" style={{ color: 'var(--muted)' }}>{note}</p>
                    </div>
                  </div>
                ))}
                <div className="py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <p className="font-mono text-xs" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                    ··· Age of Conflict — begins when Normies Arena PVP launches on-chain
                  </p>
                </div>
              </div>
            </ExpandSection>

            <ExpandSection label="the world">
              <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
                Every story entry draws from a persistent world: 20 regions, 12 factions, 12 commanders,
                10 rival forces, and 12 relics. All picks are seeded deterministically by token ID and
                block number — the same event always resolves to the same world context.
              </p>
              <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>
                Regions include: the Ashen Flats, the Obsidian Line, the Deep Trenches, the Crossroads,
                the Unmapped Edge. Factions include: the Inkborn, the Pale Host, the Wandering Blades,
                the Unnamed, the Far Walkers. Commanders include: Commander Varun, Old Mira, the Silent
                General, Scholar-General Teld.
              </p>
              <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                Relics — legendary objects contested by both sides — include: the Shattered Standard,
                the Last True Map, the Pixel Throne, the Oath Stone, the War Bell. One world. One chronicle.
                Every entry is part of the same story.
              </p>
            </ExpandSection>

            <ExpandSection label="the ai summary">
              <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
                The &quot;dispatches from the front&quot; section at the top of the Now view is generated by
                Claude — the same AI that writes this site — reading the last 40 chronicle entries and
                producing a 2-paragraph summary of the current state of the war as living history.
              </p>
              <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                The summary regenerates every 5 new chronicle entries. It is instructed to write in pure
                narrative voice — no mention of blockchain, pixels, or anything technical. It reads
                the actual story entries and synthesizes them into a dramatic dispatch. Every time you
                come back as the war has grown, the summary will have changed.
              </p>
            </ExpandSection>

          </div>
        </div>
        <Footer />
      </main>
    </>
  )
}
