'use client'
import { useState } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/NavBar'

const MAX = '44rem'
const S: React.CSSProperties = { maxWidth: MAX, margin: '0 auto', padding: '0 1.5rem' }

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '2.5rem 0' }} />
}

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ paddingBottom: '0.65rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--text)' }}>
      <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text)' }}>{label}</span>
    </div>
  )
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 0', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em' }}>{title}</span>
        <span style={{ color: 'var(--muted)', fontSize: '0.75rem', flexShrink: 0, marginLeft: '1rem', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: '1.2rem' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Rule({ name, trigger, body }: { name: string; trigger: string; body: string }) {
  return (
    <div style={{ display: 'flex', gap: '1.5rem', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ minWidth: '9rem', flexShrink: 0 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.06em', lineHeight: 1.4, marginBottom: '0.2rem' }}>{name}</div>
        <div style={{ fontSize: '0.56rem', color: 'var(--muted)', letterSpacing: '0.06em', fontStyle: 'italic' }}>{trigger}</div>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.7rem', lineHeight: '1.85', flex: 1 }}>{body}</p>
    </div>
  )
}

function RuleGroup({ label, rules }: { label: string; rules: [string, string, string][] }) {
  return (
    <Accordion title={label}>
      <div style={{ paddingTop: '0.5rem' }}>
        {rules.map(([name, trigger, body]) => (
          <Rule key={name} name={name} trigger={trigger} body={body} />
        ))}
      </div>
    </Accordion>
  )
}

export default function HowItWorks() {
  return (
    <main style={{ minHeight: '100vh', paddingTop: '2.75rem', paddingBottom: '6rem' }}>
      <NavBar />

      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...S, height: '2.1rem', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>← home</Link>
        </div>
      </div>

      <div style={S}>

        <div style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem', borderBottom: '3px double var(--border)', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: 'clamp(2.2rem,7vw,3.8rem)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 0.9, marginBottom: '1.2rem' }}>
            how it<br />works
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', lineHeight: '2.05', maxWidth: '28rem' }}>
            The Chronicles of Normia translates real on-chain events into a living story. No writers. No editors. The story emerges from real decisions made by real people — run through a rule system that gives each event its place in Normia's history.
          </p>
        </div>

        {/* THE WORLD */}
        <Accordion title="The World">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Normia is a living world inhabited by ten thousand faces. Each one is capable of shaping the zones they touch. Normia has twenty named zones — the Breach, the Pale Shore, the Hollow, the Still Water, and sixteen others. It has five legendary presences: Lyra the Architect, Finn the Breaker, The Cast the Witness, Cielo the Keeper, and Echo the Wanderer.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Every signal's identity — which zone it occupies, which presence it maps to — is derived deterministically from its token ID. The same token always maps to the same presence. The same transaction always produces the same story entry.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The story has memory. Key moments are stored and referenced in future entries. The chronicle is continuous — not episodic — and it never ends.
            </p>
          </div>
        </Accordion>

        {/* THE FIVE */}
        <Accordion title="The Five Presences">
          <div style={{ paddingTop: '0.5rem' }}>
            {([
              ['Lyra', 'the Architect', 'Activated by construction, persistence, accumulation. She builds something that outlasts every attempt to erase it. Her story is the story of what Normia could become.'],
              ['Finn', 'the Breaker', 'Activated by large reshapings, burns, collisions. He unmakes what calcifies — Normia must stay alive, even if that means tearing it open. He is not the villain. He is the challenge.'],
              ['The Cast', 'the Witness', 'Activated by returns, long-watching, veteran presence. An omnipresent entity — it/its — that sees everything and forgets nothing. It has no faction. It keeps the record.'],
              ['Cielo', 'the Keeper', 'Activated by quiet work, maintenance, holding. She tends what others abandon. Nothing built in Normia should die unmourned. She is why the world has depth.'],
              ['Echo', 'the Wanderer', 'Activated by edge events, unexpected patterns, far signals. He finds what Normia is hiding. Every edge conceals something the center cannot see.'],
            ] as [string, string, string][]).map(([name, title, desc]) => (
              <div key={name} style={{ display: 'flex', gap: '1.5rem', paddingBottom: '1.1rem', marginBottom: '1.1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ minWidth: '7rem', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem' }}>{name}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--muted)', fontStyle: 'italic', letterSpacing: '0.05em' }}>{title}</div>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.7rem', lineHeight: '1.85', flex: 1 }}>{desc}</p>
              </div>
            ))}
          </div>
        </Accordion>

        {/* TWO EVENTS */}
        <Accordion title="Two On-Chain Events">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>PixelsTransformed</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', lineHeight: '2.0' }}>
                When a Normie's pixels are edited on-chain, a presence shapes its zone. The pixel count determines the weight of the moment. One pixel is the quietest possible mark — still permanent, still in the record. Fifty is a deliberate statement. Two hundred reshapes a zone entirely. The five respond to scale.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>BurnRevealed</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', lineHeight: '2.0' }}>
                When a Normie's energy is transferred on-chain, a presence passes something forward. Large burns are departures: everything a signal carried dissolves into Normia and seeds what comes next. Small burns are passings: quiet gifts between presences.
              </p>
            </div>
          </div>
        </Accordion>

        <Divider />

        {/* 40 RULES */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHead label="40 Rules" />
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05', marginBottom: '0.85rem' }}>
            Every on-chain event is evaluated by a rule engine that examines the event's properties, its position in the story's timeline, and the accumulated state of the world. The rule selected determines what kind of story moment gets written.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05', marginBottom: '2rem' }}>
            There are exactly 40 rules to pay homage to the Normies 40×40 pixel grid.
          </p>

          <RuleGroup label="Structural Milestones — always fire first" rules={[
            ['Deep Reading', 'every 40th entry', 'The Cast steps back after every fortieth entry and reads the full arc. Forty entries. Forty cells. The same count. The question of who is winning becomes legible.'],
            ['The Reading', 'every 25th entry', 'Twenty-five entries is enough to name a direction. The Cast marks what it sees taking shape.'],
            ['Pulse', 'every 10th entry', 'A breath, a tally. The rhythm of the chronicle\'s count. The current standing of all five is implied.'],
            ['Era Shift', 'at 100, 300, 700, 1500, 3000, 5000, 8000+ entries', 'Normia crosses into a new era. Each era has its own character and name. The chronicle marks the transition. There is no final era — the record is endless.'],
            ['Vigil', '3 entries before era threshold', 'Normia holds its breath before a turn. The five are marked as the old era\'s last actors.'],
          ]} />

          <RuleGroup label="Rare Conditions — fire when matched" rules={[
            ['Relic Found', 'rare transaction hash pattern', 'A transaction hash ending in a repeating pattern surfaces something old — an artifact buried in Normia\'s deeper layers. Echo tends to find these. All five respond differently.'],
            ['Convergence', 'two events in the same block', 'Two presences acting at the exact same moment. The chronicle marks the rarity.'],
            ['Ancient Stirs', 'token ID under 1,000', 'Signals from Normia\'s earliest register. They were shaping the world before most current presences existed.'],
            ['Far Signal', 'token ID over 8,000', 'Signals from the outer reaches. Echo is most often activated here.'],
          ]} />

          <RuleGroup label="Block Gaps — time as a character" rules={[
            ['Long Dark', '50,000+ block gap', 'Normia was genuinely still for a long stretch. The record names it as a long dark.'],
            ['The Quiet', '10,000+ block gap', 'A significant pause between events. The five held their positions.'],
          ]} />

          <RuleGroup label="Signal History — memory shapes the story" rules={[
            ['Return', 'signal reappears after absence', 'A signal comes back. The chronicle notes the gap, what changed, and what the return might mean.'],
            ['First Light', 'signal\'s very first appearance (early chronicle)', 'A new presence enters the record. The Cast notes it. The world doesn\'t know yet whether this arrival belongs to the main story.'],
            ['Dynasty', 'signal with sustained dominance streak', 'One presence consistently dominant over many entries. The world starts to take on their character.'],
          ]} />

          <RuleGroup label="Event Scale — size of mark determines weight" rules={[
            ['Signal Surge', '200+ pixels changed', 'A zone reshaped entirely. Lyra places a keystone. Finn tears through completely.'],
            ['Mark Made', '50–199 pixels', 'Deliberate, personal, visible. A presence expressing itself on Normia\'s surface.'],
            ['Ghost Touch', '1 pixel', 'The smallest possible presence. Still permanent. Still in the record. The Cast notes it.'],
            ['Departure', '10+ energy transferred', 'Everything a signal accumulated passes forward. Not destruction — passage.'],
            ['Passing', 'small energy transfer', 'A quiet gift between presences. Small in scale. The chandlers and small-traders understand this better than the councils do.'],
          ]} />

          <RuleGroup label="World Texture — everyday Normia" rules={[
            ['Trade Notes', 'woven into most entries', 'Salt and iron move through zones. Guild disputes continue. The tollkeepers collect. The world around the five is alive and has opinions.'],
            ['Politics', 'background of major acts', 'Faction councils convene. Representatives send letters. Zone boundaries are contested.'],
            ['Nightwatch', 'activity in low-volume stretches', 'Marking Normia when most others are absent. The chronicle notes the vigil.'],
          ]} />
        </div>

        <Divider />

        {/* NARRATIVE MEMORY */}
        <Accordion title="Narrative Memory">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The chronicle remembers. Every signal that appears is tracked: how many times, how many marks, whether it has returned after absence, and its legend level — unknown, known (3+ entries), storied (8+), legend (20+).
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Key moments are stored and referenced in future entries. When a major reshaping happens, the zone is noted. When Finn breaks something, future entries can reference it when Lyra rebuilds it. The story is continuous.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The dominant presence — the one most consistently active — is tracked across all five. When one has dominated long enough, the chronicle marks a shift in the world's atmosphere.
            </p>
          </div>
        </Accordion>

        {/* THE PIXEL ART */}
        <Accordion title="The Pixel Art">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The 80×80 pixel canvas is a living portrait of Normia's current story state — a visual representation of what the world looks like at this moment. Each scene is a distinct pixel art animation in pure monochrome.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Lyra's scenes show rising towers and architectural structures. Finn's scenes show fractures, collapsing blocks, dissolution into particles. The Cast's scenes show a lone figure watching from a horizon. Cielo's scenes show maintained zones and repair work. Echo's scenes show emergence from the edges, glowing discoveries.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Click any character name in the chronicle to see their most recent scene.
            </p>
          </div>
        </Accordion>

        {/* THE ERAS */}
        <Accordion title="The Eras of Normia">
          <div style={{ paddingTop: '0.5rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05', marginBottom: '1.5rem' }}>
              The chronicle divides itself into eras based on accumulated entries. Each era has its own character. There is no final era — the record continues as long as Normia does.
            </p>
            {([
              ['The First Days', '0+', 'Normia is new. Every mark is the first of its kind.'],
              ['The Waking', '100+', 'Presences sense each other. The quiet is ending. The five begin to define their roles.'],
              ['The Gathering', '300+', 'Territory begins to mean something. Normia is building a history.'],
              ['The Age of Claim', '700+', 'Every mark is a statement. The zones are contested. The question of influence becomes urgent.'],
              ['The Long Work', '1,500+', 'The cost of presence is becoming clear. So is its value.'],
              ['What Holds', '3,000+', 'Some things have been decided. The record runs very deep.'],
              ['The Old Country', '5,000+', 'Normia forgets nothing. The ancient acts cast long shadows.'],
              ['The Long Memory', '8,000+', 'Normia is old now. Everything that happens is in dialogue with everything that came before.'],
            ] as [string, string, string][]).map(([name, threshold, desc]) => (
              <div key={name} style={{ display: 'flex', gap: '1rem', paddingBottom: '0.85rem', marginBottom: '0.85rem', borderBottom: '1px solid var(--border)', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--text)', minWidth: '9rem', flexShrink: 0 }}>{name}</span>
                <span style={{ fontSize: '0.54rem', color: 'var(--muted)', opacity: 0.5, minWidth: '3rem', flexShrink: 0 }}>{threshold}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: '1.8' }}>{desc}</span>
              </div>
            ))}
          </div>
        </Accordion>

        {/* DETERMINISM */}
        <Accordion title="Determinism">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The chronicle is deterministic. Given the same sequence of on-chain events, it always produces the same story. Nothing was chosen by a person after the system was built.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Token ID determines zone and character. Block number contributes to the seed for prose variation. Transaction hash can trigger rare rules. The inputs are all on-chain. The output is always the same.
            </p>
          </div>
        </Accordion>

      </div>
    </main>
  )
}
