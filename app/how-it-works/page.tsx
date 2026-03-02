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
            The Chronicles of Normia translates real on-chain events into a living story. No writers. No editors. The narrative emerges from what people actually do with what they hold — run through a rule system that gives each event its place in the chain.
          </p>
        </div>

        {/* THE WORLD */}
        <Accordion title="The World">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Normia is a living grid — ten thousand presences distributed across twenty named signal-zones. The zones have real character: some are ancient routing hubs, some are freshly opened territory, some sit at the far margins where the central factions do not bother looking. The grid runs on what its inhabitants do with what they hold.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Five presences have become the main actors in the record. They did not appoint themselves. They became significant through what they actually did, in full view of the chain. Their identities are assigned from the real onchain data — wallet behavior, token range, event type, and how often a wallet returns.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The story has memory. Every entry reads from a running world-state — who holds which zones, where Finn last burned, where Lyra last built, what Cielo is tending. That state is threaded into every body of text. The chronicle is continuous, not episodic. It never resets.
            </p>
          </div>
        </Accordion>

        {/* THE FIVE */}
        <Accordion title="The Five Presences">
          <div style={{ paddingTop: '0.5rem' }}>
            {([
              ['Lyra', 'the Architect', 'She builds. Activated by new wallets arriving in the system and low-token-ID presences in the Cradle zones. Her story is the story of what Normia could become — a structure whose full shape is not yet clear, placed piece by piece across the grid.'],
              ['Finn', 'the Breaker', 'He burns. Activated only by actual BurnRevealed events — the rarest, most permanent action in the system. Finn appears when signal is genuinely destroyed. He is not the villain of the record. He is the challenge Lyra is answering.'],
              ['The Cast', 'the Witness', 'It records. Activated by veteran wallets returning after a long absence — presences that have been watching since before most of the others arrived. The Cast is omnipresent, neither cruel nor kind, and it answers to no faction.'],
              ['Cielo', 'the Keeper', 'She maintains. Activated by wallets that tend the same territory repeatedly — presences that come back quickly to the same ground. After Lyra builds and Finn burns, Cielo is the one still there.'],
              ['Echo', 'the Wanderer', 'He ranges. Activated by high token-ID presences in the outer zones of the grid, where the central factions do not bother looking. What he finds at the margins ends up mattering more than anyone expected.'],
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
                When a Normie's pixels are edited on-chain, a presence shapes its zone. The pixel count sets the weight of the moment — a single pixel is the quietest possible mark, still permanent, still in the chain. One hundred pixels or more crosses from incremental into structural: a major build that the Cast flags and Finn will notice.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>BurnRevealed</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', lineHeight: '2.0' }}>
                When a Normie's energy is transferred on-chain, Finn acts. This is the only event type that activates him — every BurnRevealed becomes Finn, without exception. A burn is permanent: the signal does not come back. If the burned zone was Lyra's, it becomes the central conflict of the record. If it was open territory, it becomes open ground.
              </p>
            </div>
          </div>
        </Accordion>

        <Divider />

        {/* THE RULES */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHead label="The Story Rules" />
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05', marginBottom: '0.85rem' }}>
            Every on-chain event is evaluated by a rule engine that reads the event's properties, the wallet's history, the current world-state, and where the event falls in the chain. The rule selected determines what kind of story moment gets written — and which prose body, from a pool of variants, gets used for that moment.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05', marginBottom: '2rem' }}>
            Rules check in priority order. The first matching rule fires. Only one rule fires per event.
          </p>

          <RuleGroup label="Rhythm Rules — check first, override everything" rules={[
            ['Checkpoint', 'every 25th entry', 'The Cast steps back and reads the full state of the grid. Current zone counts, who holds what, what the scoreline looks like. These entries anchor the reader in the ongoing situation every 25 acts.'],
            ['Era Shift', 'at 100, 300, 700, 1500, 3000, 5000, 8000+ entries', 'The grid crosses into a new era. Signal registered before the shift becomes prior-era data — weighted differently by the sector councils. The Cast logs the transition. The five keep moving.'],
            ['Vigil', '3 entries before era threshold', 'Normia approaches a turn. The five are marked as the old era\'s last actors. What they do in these final entries is what the new era inherits as its opening condition.'],
          ]} />

          <RuleGroup label="Chain Conditions — rare, check second" rules={[
            ['Long Dark', '40,000+ block gap between events', 'A genuine silence in the chain. The grid kept running — zones held their signal, routing continued — but none of the five left a new mark. The Cast documents the absence as its own entry. An absence in the chain is still information.'],
            ['Convergence', 'two events in the same block', 'Two presences acting at the exact same instant. No coordination possible. The grid logged both as concurrent. The Cast notes the coincidence and asks whether it was one.'],
            ['First Light', 'first 5 entries in the record', 'The record is still opening. Every act at this point could shape the entire direction of what follows. The Cast notes each early mark for exactly that reason.'],
          ]} />

          <RuleGroup label="Character Rules — driven by world state" rules={[
            ['Finn Burns Lyra', 'BurnRevealed + zone was Lyra\'s', 'The most dramatic beat in the system. Finn burned in territory Lyra had built. The zone is gone. This entry is featured and carries forward into every subsequent body until Lyra responds.'],
            ['Finn Burns', 'any BurnRevealed event', 'Finn removes signal from the grid permanently. Open territory, not Lyra\'s — but still final. The Cast logs the exact volume. The downstream effects show up in subsequent entries.'],
            ['Lyra Returns', 'Lyra builds in a zone Finn burned', 'The comeback. Lyra placed signal back into ground Finn cleared. This entry is featured. Whether she adjusts her structure or repeats it exactly is visible in the text.'],
            ['Lyra Major', 'PixelsTransformed + 100+ pixels + Lyra', 'A build large enough to read as structural, not incremental. The Cast flags it. The shape of Lyra\'s architecture becomes more legible after one of these.'],
            ['Lyra Builds', 'standard Lyra PixelsTransformed', 'The steady work. One more layer placed, one more zone marked. The body carries forward her current state — how many zones she holds, what Finn has done recently, what Cielo is maintaining.'],
            ['Cielo After Finn', 'Cielo enters a zone Finn burned', 'Cielo tends the burned zone — not rebuilding what Finn destroyed, but stabilizing the edges so the damage does not spread. The entry notes what adjacent signal she is protecting.'],
            ['Cielo Tends', 'standard Cielo PixelsTransformed', 'Quiet maintenance work. The body describes what would have happened to the zone if she had not come through, and how it connects to the work Lyra and Finn are doing elsewhere.'],
            ['Cast Returns', 'Cast triggered after long wallet gap', 'A veteran wallet comes back after a long absence from the chain. The Cast backfills the gap — what it missed, what changed while it was gone. The record shows both the absence and the return.'],
            ['Cast Witnesses', 'standard Cast PixelsTransformed', 'The Cast records. It reads the current state of the whole grid — who holds what, what the central conflict looks like — and places the event in that context without editorializing.'],
            ['Echo Finds', 'every 3rd Echo sighting', 'Echo surfaces something from the outer grid that was not on any current map. An old signal, a buried registration, a gap between what the system shows and what is actually registered. The Cast adds it to the chain.'],
            ['Echo Arrives', 'standard Echo PixelsTransformed', 'Echo appears from the margins. The body describes what the central characters are doing and why Echo\'s outer-zone movements are tracking something different — and why that tends to matter.'],
          ]} />
        </div>

        <Divider />

        {/* NARRATIVE MEMORY */}
        <Accordion title="Narrative Memory">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The world-state updates after every entry. Every body of text reads from it before generating. This means each entry knows: which zones Lyra holds, where Finn last burned, whether Cielo is tending a burned zone, what Echo found most recently, and what the Cast last witnessed.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The central conflict thread — whether Finn has burned Lyra's territory, and whether she has come back for it — runs as a live flag through the whole chain. Bodies reference it naturally: "the scar from Finn's burn in the Grey Basin is still in the record" or "Lyra rebuilt in the Fault Line after Finn cleared it." The reader can follow this thread without needing a summary.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The dispatch line above each entry shows the single-sentence state of the grid at that moment — a scoreline that updates as the story develops.
            </p>
          </div>
        </Accordion>

        {/* DETERMINISM */}
        <Accordion title="Determinism">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The chronicle is deterministic. Given the same sequence of on-chain events, it always produces the same story. Nothing was chosen by a person after the system was built.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Token ID determines zone. Wallet behavior determines character. Block position determines beat type. Block number contributes to which prose variant from the pool gets selected. The inputs are all on-chain. The output is always the same.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The only exception is the world-state accumulation — that is order-dependent. What gets written for entry 200 depends on everything that happened in entries 1 through 199. The chain is the story. The order is part of the meaning.
            </p>
          </div>
        </Accordion>

        {/* THE PIXEL ART */}
        <Accordion title="The Pixel Art">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The 80×80 pixel canvas is a live visual of Normia's current story state — a pure monochrome portrait of what the grid looks like at this moment. Each of the five presences has its own set of animated scenes, and the scene shown changes with each new entry.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Lyra's scenes show rising signal-structures and layered architecture. Finn's show fractures, collapse, dissolution. The Cast's show a lone presence watching from a fixed point at the edge of the grid. Cielo's show the slow work of repair — edges held, signal stabilized. Echo's show emergence from the margins, something surfacing that was not there before.
            </p>
          </div>
        </Accordion>

        {/* THE ERAS */}
        <Accordion title="The Eras of Normia">
          <div style={{ paddingTop: '0.5rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05', marginBottom: '1.5rem' }}>
              The chronicle divides into eras based on accumulated entries. Each era has its own designation. Signal registered before a threshold becomes prior-era data. There is no final era — the record continues as long as Normia does.
            </p>
            {([
              ['The First Days', '0+', 'The grid is new. Every mark is the first of its kind. The five have not yet defined their positions.'],
              ['The Waking', '100+', 'Presences are starting to read each other. The quiet is ending. Patterns are emerging that will define the next several eras.'],
              ['The Gathering', '300+', 'Territory begins to mean something. Normia is building a history. The zones have owners, or they have the memory of owners.'],
              ['The Age of Claim', '700+', 'Every mark is a statement. The zones are actively contested. The question of who holds what has become urgent.'],
              ['The Long Work', '1,500+', 'The cost of presence is clear. So is its value. The five have been doing this long enough to have patterns that cannot be easily broken.'],
              ['What Holds', '3,000+', 'Some things have been settled by now — not permanently, but settled. The record runs deep. New acts carry the weight of everything before them.'],
              ['The Old Country', '5,000+', 'Normia forgets nothing. The ancient signal-marks cast long shadows over everything placed after them.'],
              ['The Long Memory', '8,000+', 'The grid is old. Everything that happens is in dialogue with everything that came before. The five have been at this for a very long time.'],
            ] as [string, string, string][]).map(([name, threshold, desc]) => (
              <div key={name} style={{ display: 'flex', gap: '1rem', paddingBottom: '0.85rem', marginBottom: '0.85rem', borderBottom: '1px solid var(--border)', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--text)', minWidth: '9rem', flexShrink: 0 }}>{name}</span>
                <span style={{ fontSize: '0.54rem', color: 'var(--muted)', opacity: 0.5, minWidth: '3rem', flexShrink: 0 }}>{threshold}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: '1.8' }}>{desc}</span>
              </div>
            ))}
          </div>
        </Accordion>

      </div>
    </main>
  )
}
