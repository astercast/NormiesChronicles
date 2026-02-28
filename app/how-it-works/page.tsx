'use client'
import { useState } from 'react'
import { NavBar } from '@/components/NavBar'

const ERAS = [
  ['0',   'The First Days',   'We\'re here now. The story is just starting.'],
  ['10',  'The Waking',       'Enough has happened for patterns to emerge.'],
  ['30',  'Age of Arrivals',  'New wallets keep showing up. The Grid is growing.'],
  ['75',  'The Gathering',    'Activity is picking up. Factions are taking shape.'],
  ['150', 'Age of Marks',     'The record is thick. Territorial claims are everywhere.'],
  ['300', 'The Deepening',    'The long-term patterns become visible. History has weight.'],
  ['500', 'Age of Builders',  'The infrastructure of the world is being laid.'],
  ['800', 'The Long Road',    'We\'re deep into it. Everything that happens means something.'],
]

const RULES = [
  // Scale rules
  { trigger: '200+ pixels changed',        story: 'A huge edit — someone transformed their Normie almost completely.' },
  { trigger: '50–199 pixels changed',       story: 'A significant edit — someone made a real statement.' },
  { trigger: 'Under 50 pixels changed',     story: 'A careful, deliberate small change.' },
  { trigger: 'Pixel count divisible by 50', story: 'A round number means it was planned. A formal act.' },
  { trigger: 'Exactly 1 pixel',             story: 'The minimum possible mark. Still counts.' },
  // Burns
  { trigger: 'Burn transferring 10+ AP',    story: 'A major sacrifice — a Normie gone so another grows stronger.' },
  { trigger: 'Burn transferring 1–9 AP',    story: 'A smaller burn. Permanent, but quiet.' },
  { trigger: 'Veteran wallet burns',         story: 'Someone who\'s done this before, doing it again.' },
  { trigger: 'Veteran burns 2+ times',       story: 'A repeat sacrificer. They understand the trade.' },
  // Token identity
  { trigger: 'Prime-numbered token ID',     story: 'A mathematically irreducible Normie. Can\'t be divided.' },
  { trigger: 'Token ID under 500',          story: 'One of the very first — the oldest range, still active.' },
  { trigger: 'Token ID under 1,000',        story: 'A founding-era token. One of the originals.' },
  { trigger: 'Token ID 1,000–2,000',        story: 'Mid-early range, new wallet — a fresh face with an old token.' },
  { trigger: 'Token ID 2,000–3,000',        story: 'The steady middle range, consistently present.' },
  { trigger: 'Token ID 5,000–6,000',        story: 'The quiet center of the collection.' },
  { trigger: 'Token ID over 8,000',         story: 'The far end of the register. Still here, still acting.' },
  { trigger: 'Token ID over 8,500 + gap',   story: 'A high-number token returning after silence.' },
  // Milestones
  { trigger: 'Every 40th event',            story: 'Honoring the 40×40 grid — the architecture of every Normie.' },
  { trigger: 'Every 25th event',            story: 'A quarter-century mark. The Archive pauses to note it.' },
  { trigger: 'Every 10th event',            story: 'A regular count. The Archive takes stock.' },
  { trigger: 'Era threshold crossed',        story: 'A new chapter begins. The story\'s tone shifts.' },
  { trigger: 'Within 3 events of next era', story: 'The threshold is close. Every move feels heavier.' },
  { trigger: 'Rare tx hash pattern',         story: 'A statistical oddity in the blockchain data. Worth noting.' },
  { trigger: 'Same block, two events',       story: 'Two wallets acted at the exact same moment. Coincidence.' },
  // Time gaps
  { trigger: '50,000+ block gap',           story: 'Almost a week of silence. The Grid went very quiet.' },
  { trigger: '10,000+ block gap',           story: 'About a day of quiet. The record resumes.' },
  { trigger: '3,000–6,000 block gap',       story: 'A short breath after a busy stretch.' },
  // Address history
  { trigger: 'New address (first event)',    story: 'Someone showing up in the Chronicle for the first time.' },
  { trigger: 'New address, quiet entry',     story: 'A first-timer who didn\'t make a fuss about it.' },
  { trigger: 'New address, familiar pattern',story: 'A newcomer doing what others have done before.' },
  { trigger: 'Known address returns',        story: 'Someone who\'s been here before, doing it again.' },
  { trigger: 'Returns within 500 blocks',    story: 'Back within an hour — they weren\'t done.' },
  { trigger: 'Returns after 20,000+ blocks', story: 'Gone for almost 3 days, then back. A real return.' },
  { trigger: 'Address with 3+ entries',      story: 'A consistent presence. Not a one-time thing.' },
  { trigger: 'Veteran, breaks pattern',      story: 'A known wallet does something unexpected. Record updated.' },
  { trigger: 'Veteran, different range',     story: 'Moving across the collection. Not sticking to one spot.' },
  { trigger: 'Veteran, consistent',          story: 'Same wallet, another entry. Still showing up.' },
  { trigger: 'Veteran, closing pattern',     story: 'Looks like a deliberate ending. Maybe the last move.' },
  // Range bridges
  { trigger: 'Activity at range edges',     story: 'Events at the borders between token groups. A bridge.' },
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

function ExpandSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t" style={{ borderColor: 'var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="font-mono text-2xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</span>
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

          {/* ── Summary — visible immediately ── */}
          <div className="mb-10 space-y-4">
            <p className="font-mono text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              Every entry in the Normies Chronicles comes from something real that happened on Ethereum.
              A wallet edited pixels on their Normie. A wallet burned a Normie to pass action points to another.
              Those on-chain events get turned into story entries automatically.
            </p>
            <p className="font-mono text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              The rule engine looks at each event — how many pixels, which token, which wallet, when it happened —
              and picks the story that fits. Same event always produces the same entry. Nothing is random.
            </p>
            <p className="font-mono text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              The story is early. We&apos;re still in the first chapters. When Normies Arena (PVP) launches,
              a new era begins — combat, rivals, and a whole new set of story rules built around battle.
              Everything happening now is the foundation.
            </p>
          </div>

          {/* ── Expandable details ── */}
          <div className="border-t" style={{ borderColor: 'var(--border)' }}>

            <ExpandSection label="step by step">
              <div className="space-y-0">
                {[
                  ['index', 'The site reads every PixelsTransformed and BurnRevealed event from the Normies canvas contract on Ethereum mainnet. Every action ever taken, in order, from the start.'],
                  ['cache', 'The index is stored so it loads fast. Only new blocks get fetched each time. The cache updates automatically as new events happen on-chain.'],
                  ['match', 'Each event goes through 40 rules in priority order. The first rule that fits gets picked. Same event, same rule, every time. No randomness.'],
                  ['seed', 'The region, faction, and story elements are determined by the token ID and block number. They\'re fixed — the same Normie acting in the same block always gets the same world context.'],
                  ['render', 'The matched rule\'s text templates get filled with the seeded world elements and the on-chain data. The Chronicle entry is done. Click any entry to see exactly what triggered it.'],
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
                  { name: 'PixelsTransformed', desc: 'When a holder edits their Normie using action points. The pixel count, token ID, and wallet all shape the story.' },
                  { name: 'BurnRevealed', desc: 'When a holder burns a Normie to transfer its action points to another. Permanent and final — the burned Normie is gone.' },
                ].map(e => (
                  <div key={e.name} className="p-4" style={{ border: '1px solid var(--border)' }}>
                    <p className="font-mono text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>{e.name}</p>
                    <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{e.desc}</p>
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection label="story rules">
              <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: 'var(--muted)' }}>
                40 rules — one for each row and column of the Normies 40×40 grid. Each rule
                watches for a specific on-chain pattern and produces a matching story.
              </p>
              <div className="space-y-0">
                {RULES.map((r, i) => (
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
                The Chronicle moves through eras as events accumulate. Eras are calibrated to
                the actual pace of Normies activity — so we&apos;re early, because we are.
                The PVP era will start its own new chapter when Arena launches.
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
                    ··· Age of Conflict — begins when Arena PVP launches on-chain
                  </p>
                </div>
              </div>
            </ExpandSection>

            <ExpandSection label="the world">
              <p className="font-mono text-xs leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
                Story entries draw from 20 regions, 12 factions, 10 figures, and 12 artifacts.
                All picks are seeded by token ID and block number — fixed, not random.
                The same event always resolves to the same world context.
              </p>
              <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                Regions: the Glyph Wastes, the Obsidian Moors, the Cipher Peaks, the Null Basin,
                the Wandering Shore, and more.
                Factions: the Cartographers, the Quiet Order, the Archive Monks, the Unnamed, and others.
                One world. One Chronicle. Every entry is part of the same story.
              </p>
            </ExpandSection>

          </div>

        </div>
        <Footer />
      </main>
    </>
  )
}
