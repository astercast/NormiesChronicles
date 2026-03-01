import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How It Works — Normies Chronicles',
  description: 'How real on-chain decisions become the living story of the Grid.',
}

const MAX = '42rem'
const S: React.CSSProperties = { maxWidth: MAX, margin: '0 auto', padding: '0 1.5rem' }

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '2.5rem 0' }} />
}

function Rule({ name, trigger, body }: { name: string; trigger: string; body: string }) {
  return (
    <div style={{ display: 'flex', gap: '1.5rem', paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ minWidth: '9rem', flexShrink: 0 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.06em', lineHeight: 1.4, marginBottom: '0.2rem' }}>{name}</div>
        <div style={{ fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.06em', fontStyle: 'italic' }}>{trigger}</div>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.72rem', lineHeight: '1.85', flex: 1 }}>{body}</p>
    </div>
  )
}

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ paddingBottom: '0.65rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--text)' }}>
      <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text)' }}>{label}</span>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <main style={{ minHeight: '100vh', paddingTop: '2.75rem', paddingBottom: '6rem' }}>

      {/* back */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...S, height: '2.1rem', display: 'flex', alignItems: 'center' }}>
          <Link href="/chronicles" style={{ fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>← chronicles</Link>
        </div>
      </div>

      <div style={S}>

        {/* title */}
        <div style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem', borderBottom: '3px double var(--border)', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: 'clamp(2.2rem,7vw,3.8rem)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 0.9, marginBottom: '1.2rem' }}>
            how it<br />works
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', lineHeight: '2.05', maxWidth: '28rem' }}>
            The Normies Chronicles translates real on-chain events into a living story. No writers. No editors. The story emerges from real decisions made by real people — pixel edits, energy transfers — run through a rule system that gives each event its place in the Grid's history.
          </p>
        </div>

        {/* THE WORLD */}
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="The World" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            The Grid is the world. Not a map of something else — the world itself. Ten thousand faces live in it, each one capable of shaping the spaces it touches. The Grid has twenty named zones: the Breach, the Pale Shore, the Hollow, the Still Water, and sixteen others. It has twelve signals — named presences that move through its zones. Twelve aspects. Twelve artifacts. Ten rival forces.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            A signal's identity — which signal group it belongs to, which zone it occupies, which aspect it carries — is derived deterministically from its token ID. The same token always maps to the same identity. The same transaction always produces the same story entry.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05' }}>
            The story has memory. Signals that appear repeatedly accumulate history — becoming known, then storied, then legendary. The dominant presence is tracked. Key moments are stored and referenced in future entries. The chronicle is continuous, not episodic.
          </p>
        </div>

        <Divider />

        {/* THE EVENTS */}
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="Two Events" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '2rem' }}>
            Two things happen on-chain. Both become story.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>PixelsTransformed</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.0' }}>
              When a Normie's pixels are edited on-chain, a presence shapes its zone. The pixel count determines the weight of the moment. One pixel is the quietest possible mark — still permanent, still in the record. Fifty is a deliberate statement. Two hundred reshapes a zone entirely.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>BurnRevealed</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.0' }}>
              When a Normie's energy is transferred to another on-chain, a signal passes something forward. Not loss — passage. The chronicle treats these moments with particular weight: they are among the most significant things a signal can do. The energy doesn't disappear. It changes hands.
            </p>
          </div>
        </div>

        <Divider />

        {/* THE 40 RULES */}
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="40 Rules" />

          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '0.85rem' }}>
            Every on-chain event is evaluated by a rule engine that examines the event's properties, its position in the story's timeline, and the accumulated state of the world. The rule selected determines what kind of story moment gets written.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '2.5rem' }}>
            There are exactly 40 rules — one for each cell in a Normie's 40×40 pixel grid. Each Normie is a 40×40 field of cells; the chronicle is a 40-rule field of story possibilities. The symmetry is intentional: the world is built at the same resolution as the faces that inhabit it.
          </p>

          {/* Group 1: Structural */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Structural milestones — always fire first
            </div>
            <Rule name="Deep Reading" trigger="every 40th entry" body="The chronicle steps back after every fortieth entry and reads the shape of the full arc — what forty separate decisions describe as one sequence. Forty entries. Forty cells. The same count." />
            <Rule name="The Reading" trigger="every 25th entry" body="Twenty-five entries is enough to name a direction. The chronicle marks what it sees taking shape." />
            <Rule name="Pulse" trigger="every 10th entry" body="A breath, a tally. The rhythm of the chronicle's count." />
            <Rule name="Era Shift" trigger="at 100, 300, 700, 1500, 3000, 5000, 8000 entries" body="The world crosses into a new era. Each era has its own character and name. The chronicle marks the transition." />
            <Rule name="Vigil" trigger="3 entries before era threshold" body="The world holds its breath before a turn. The chronicle names the waiting." />
          </div>

          {/* Group 2: Rare */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Rare conditions — fire when matched
            </div>
            <Rule name="Relic Found" trigger="rare transaction hash pattern" body="A transaction hash ending in a repeating pattern surfaces an artifact — something old and significant found in the Grid." />
            <Rule name="Convergence" trigger="two events in the same block" body="Two signals acting at the exact same moment. The chronicle marks the rarity of two paths crossing at once." />
            <Rule name="The Elder" trigger="prime number token IDs" body="Prime-numbered signals are elders. They act at precise moments, always with weight. The chronicle pays attention when they move." />
            <Rule name="Ancient Stirs" trigger="token ID under 1,000" body="Signals from the Grid's earliest register. They were shaping the Grid before most current signals existed." />
            <Rule name="Far Signal" trigger="token ID over 8,000" body="Signals from the outer reaches of the register. The edges of the story that the main chronicle under-tracks." />
            <Rule name="Contested Zone" trigger="token ID 5,000–6,000" body="This middle section of the Grid never holds one shape. The chronicle acknowledges the cycle." />
          </div>

          {/* Group 3: Arc pacing */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Arc pacing — shapes emotional rhythm
            </div>
            <Rule name="Resonance" trigger="surge followed by another surge within 2,000 blocks" body="Two large moments close together. The chronicle marks the harmonic." />
            <Rule name="Acceleration" trigger="500+ pixels changed in recent window" body="The Grid is moving fast. Something is building." />
            <Rule name="Weight" trigger="cumulative energy transfer thresholds" body="The toll accumulates. At certain totals of passed energy, the chronicle marks the scale of what has been given." />
            <Rule name="Interval" trigger="between active events, arc-paced" body="A natural pause. The chronicle breathes." />
          </div>

          {/* Group 4: Block gaps */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Block gaps — time as a character
            </div>
            <Rule name="Long Dark" trigger="50,000+ block gap" body="The Grid was genuinely still for a long stretch. The chronicle names it as a long dark." />
            <Rule name="The Quiet" trigger="10,000+ block gap" body="A significant pause between events. Both presences held their positions without moving." />
          </div>

          {/* Group 5: Signal history */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Signal history — memory shapes the story
            </div>
            <Rule name="Return" trigger="signal reappears after absence" body="A signal comes back. The chronicle notes the gap and what it might mean." />
            <Rule name="Wanderer" trigger="20,000+ block absence" body="Gone long enough to be almost forgotten. The chronicle marks the return explicitly." />
            <Rule name="The Builder" trigger="rapid successive activity from same signal" body="The same signal acting in quick succession. Something is being made with urgency." />
            <Rule name="Dynasty" trigger="signal with sustained dominance streak" body="One signal consistently present over many entries. The Grid takes on their character." />
            <Rule name="Dominion" trigger="dominant signal across recent window" body="A presence that is currently everywhere. The chronicle names the weight of that." />
            <Rule name="First Light" trigger="signal's very first appearance" body="A new signal enters the record for the first time." />
          </div>

          {/* Group 6: Event scale */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Event scale — size of mark determines weight
            </div>
            <Rule name="Signal Surge" trigger="200+ pixels changed" body="A zone reshaped entirely. The largest kind of presence event. The Grid absorbed it and moved on — but the shape remains." />
            <Rule name="Declaration" trigger="50–199 pixels, round count" body="A precise, formal statement. The count's roundness reads as intent." />
            <Rule name="Mark Made" trigger="50–199 pixels" body="Deliberate, personal, visible. A signal expressing itself on the Grid." />
            <Rule name="Ghost Touch" trigger="1 pixel" body="The smallest possible presence. Still permanent. Still in the record." />
            <Rule name="Departure" trigger="10+ AP energy transferred" body="A signal choosing to dissolve. Everything it accumulated passes forward. Not destruction — passage." />
            <Rule name="Twice Given" trigger="veteran signal transfers energy again" body="A signal that gave before gives again. The second time carries more weight." />
            <Rule name="Passing" trigger="small energy transfer" body="A quiet gift between signals. Small in scale. The chronicle holds it briefly." />
          </div>

          {/* Group 7: Character texture */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Character texture — adds variety and depth
            </div>
            <Rule name="New Blood" trigger="recently active signal, early phase" body="A signal making its presence known in the Grid's formative period." />
            <Rule name="Old Ghost" trigger="token ID under 500, veteran" body="One of the very first signals. Ancient by the Grid's measure." />
            <Rule name="Story Told" trigger="legend-level signal, reflective phase" body="A signal with deep enough history that the chronicle steps back and acknowledges what it has become." />
            <Rule name="Gone" trigger="signal absent after sustained activity" body="A presence that has stopped. The Grid shows where they were." />
            <Rule name="Cartographer" trigger="token ID 2,000–3,000 range" body="Signals from the survey band — the zone where the Grid's middle character was established." />
            <Rule name="Pivot" trigger="signal changes behavior pattern" body="Something shifts in how a signal acts. The chronicle notes the change." />
            <Rule name="Unaligned" trigger="signal with no faction match" body="A presence that doesn't fit neatly into the Grid's named structures. The chronicle acknowledges the exception." />
            <Rule name="The Steady" trigger="consistent low-level activity" body="A signal that shows up without drama, over and over. The chronicle acknowledges reliability." />
            <Rule name="Nightwatch" trigger="activity in low-volume stretches" body="Marking the Grid when most others are absent. The chronicle notes the vigil." />
          </div>
        </div>

        <Divider />

        {/* NARRATIVE MEMORY */}
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="Narrative Memory" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            The chronicle remembers. Every signal that appears is tracked: how many times, how many marks, whether it has returned after absence, and its legend level — unknown, known (3+ entries), storied (8+), legend (20+).
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            Key moments are stored and referenced in future entries. When a major reshaping happens, the zone is noted. When a signal dissolves, the loss is remembered. Future entries can reference these moments — the story is continuous, not episodic.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05' }}>
            The dominant signal — the one most consistently present — is tracked. When one signal has dominated long enough, the chronicle marks a shift in the world's atmosphere. When something breaks the pattern, it registers as a turning point.
          </p>
        </div>

        <Divider />

        {/* THE VISUALIZATION */}
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="The Visualization" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            The 80×80 pixel canvas is not a map. It is a living portrait of the Grid's current story state — a visual representation of what the Grid feels like at this moment, animated in real time.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            Each story mood has a distinct visual language: a signal surge produces radial burst waves with geometric spokes; departure produces a spiral vortex of energy unwinding outward; discovery produces an expanding crystal lattice; wonder produces 12-fold mandala symmetry; chaos produces high-frequency interference static; quiet produces two gentle overlapping wave fields. The visualization updates with every new story entry.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05' }}>
            The intensity bar shows the arc's current charge. The mood history dots show what has happened recently. Selecting an entry triggers a brief visual response — the canvas reflects the moment you're reading.
          </p>
        </div>

        <Divider />

        {/* EIGHT ERAS */}
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="Eight Eras" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '2rem' }}>
            The chronicle divides itself into eight eras based on accumulated entries. Each era has its own character.
          </p>
          {([
            ['The First Days', '0+', 'The Grid is new. Every mark is the first of its kind.'],
            ['The Awakening', '100+', 'Signals sense each other. The quiet is ending.'],
            ['The Gathering', '300+', 'Territory begins to mean something. The Grid is building a history.'],
            ['Age of Claims', '700+', 'Every mark is a statement. The zones are contested.'],
            ['The Deepening', '1,500+', 'The cost of presence is becoming clear. So is its value.'],
            ['Age of Permanence', '3,000+', 'Some things have been decided. The record runs very deep.'],
            ['The Long Memory', '5,000+', 'Veterans outnumber newcomers. The Grid forgets nothing.'],
            ['The Reckoning', '8,000+', 'Something is ending. Something else is beginning.'],
          ] as [string,string,string][]).map(([name,threshold,desc])=>(
            <div key={name} style={{ display:'flex', gap:'1rem', paddingBottom:'0.9rem', marginBottom:'0.9rem', borderBottom:'1px solid var(--border)', alignItems:'baseline' }}>
              <span style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--text)', minWidth:'9rem', flexShrink:0 }}>{name}</span>
              <span style={{ fontSize:'0.55rem', color:'var(--muted)', opacity:0.5, minWidth:'3rem', flexShrink:0 }}>{threshold}</span>
              <span style={{ fontSize:'0.72rem', color:'var(--muted)', lineHeight:'1.8' }}>{desc}</span>
            </div>
          ))}
        </div>

        <Divider />

        {/* DETERMINISM */}
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="Determinism" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            The chronicle is deterministic. Given the same sequence of on-chain events, it always produces the same story. Nothing was chosen by a person after the system was built.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05' }}>
            The story emerges from the decisions of ten thousand people who don't know they're writing it. The chronicle is a function — it takes the Grid's history and produces the account. The world is real because the decisions that made it were.
          </p>
        </div>

        {/* footer nav */}
        <div style={{ paddingTop: '1rem' }}>
          <Link href="/chronicles" style={{ fontSize: '0.75rem', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
            read the chronicle →
          </Link>
        </div>
      </div>
    </main>
  )
}
