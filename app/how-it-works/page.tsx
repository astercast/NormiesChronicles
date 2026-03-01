import type { Metadata } from 'next'
import Link from 'next/link'
import { NavBar } from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'How It Works — The Chronicles of Normia',
  description: 'How real on-chain decisions become the living story of Normia.',
}

const MAX = '44rem'
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
      <NavBar />

      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...S, height: '2.1rem', display: 'flex', alignItems: 'center' }}>
          <Link href="/chronicles" style={{ fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>← chronicles</Link>
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

        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="The World" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            Normia is a living world inhabited by ten thousand faces. Each one is capable of shaping the zones they touch. Normia has twenty named zones — the Breach, the Pale Shore, the Hollow, the Still Water, and sixteen others. It has five legendary presences: Lyra the Architect, Finn the Breaker, The Cast the Witness, Cielo the Keeper, and Echo the Wanderer.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            Around these five lives an entire society: merchants, guild workers, farmers, miners, scribes, toll-keepers, and faction councils. The five are famous. The ten thousand are the texture. Both are real. Both are tracked. The story is theirs collectively.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            Every signal's identity — which zone it occupies, which presence it maps to — is derived deterministically from its token ID. The same token always maps to the same presence. The same transaction always produces the same story entry.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05' }}>
            The story has memory. Signals that appear repeatedly accumulate history. The dominant presence is tracked. Key moments are stored and referenced in future entries. The chronicle is continuous — not episodic — and it never ends.
          </p>
        </div>

        <Divider />

        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="The Five" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '2rem' }}>
            Every on-chain event is assigned to one of five presences based on the event's nature and the token's history. The central question the chronicle asks: who will have the most influence over Normia?
          </p>
          {([
            ['Lyra', 'the Architect', 'Activated by construction, persistence, accumulation. She builds something that outlasts every attempt to erase it. Her story is the story of what Normia could become.'],
            ['Finn', 'the Breaker', 'Activated by large reshapings, burns, collisions. He unmakes what calcifies — Normia must stay alive, even if that means tearing it open. He is not the villain. He is the challenge.'],
            ['The Cast', 'the Witness', 'Activated by returns, long-watching, veteran presence. An omnipresent entity — it/its — that sees everything and forgets nothing. It has no faction. It keeps the record.'],
            ['Cielo', 'the Keeper', 'Activated by quiet work, maintenance, holding. She tends what others abandon. Nothing built in Normia should die unmourned. She is why the world has depth.'],
            ['Echo', 'the Wanderer', 'Activated by edge events, unexpected patterns, far signals. He finds what Normia is hiding. Every edge conceals something the center cannot see.'],
          ] as [string, string, string][]).map(([name, title, desc]) => (
            <div key={name} style={{ display: 'flex', gap: '1.5rem', paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ minWidth: '7rem', flexShrink: 0 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem' }}>{name}</div>
                <div style={{ fontSize: '0.56rem', color: 'var(--muted)', fontStyle: 'italic', letterSpacing: '0.05em' }}>{title}</div>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', lineHeight: '1.85', flex: 1 }}>{desc}</p>
            </div>
          ))}
        </div>

        <Divider />

        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="Two Events" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '2rem' }}>
            Two things happen on-chain. Both become story.
          </p>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>PixelsTransformed</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.0' }}>
              When a Normie's pixels are edited on-chain, a presence shapes its zone. The pixel count determines the weight of the moment. One pixel is the quietest possible mark — still permanent, still in the record. Fifty is a deliberate statement. Two hundred reshapes a zone entirely. The five respond to scale: Lyra builds when the count accumulates. Finn breaks when the count is massive. Cielo tends when things are quiet.
            </p>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>BurnRevealed</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.0' }}>
              When a Normie's energy is transferred on-chain, a presence passes something forward. Not loss — passage. Large burns are departures: everything a signal carried dissolves into Normia and seeds what comes next. Small burns are passings: quiet gifts between presences. Both are among the most significant things a signal can do.
            </p>
          </div>
        </div>

        <Divider />

        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="40 Rules" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '0.85rem' }}>
            Every on-chain event is evaluated by a rule engine that examines the event's properties, its position in the story's timeline, and the accumulated state of the world. The rule selected determines what kind of story moment gets written.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '2.5rem' }}>
            There are exactly 40 rules — one for each cell in a Normie's 40×40 pixel grid. The symmetry is intentional: the world is built at the same resolution as the faces that inhabit it.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Structural milestones — always fire first
            </div>
            <Rule name="Deep Reading" trigger="every 40th entry" body="The Cast steps back after every fortieth entry and reads the full arc. Forty entries. Forty cells. The same count. The question of who is winning becomes legible." />
            <Rule name="The Reading" trigger="every 25th entry" body="Twenty-five entries is enough to name a direction. The Cast marks what it sees taking shape." />
            <Rule name="Pulse" trigger="every 10th entry" body="A breath, a tally. The rhythm of the chronicle's count. The current standing of all five is implied." />
            <Rule name="Era Shift" trigger="at 100, 300, 700, 1500, 3000, 5000, 8000+ entries" body="Normia crosses into a new era. Each era has its own character and name. The chronicle marks the transition. There is no final era — the record is endless." />
            <Rule name="Vigil" trigger="3 entries before era threshold" body="Normia holds its breath before a turn. The five are marked as the old era's last actors." />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Rare conditions — fire when matched
            </div>
            <Rule name="Relic Found" trigger="rare transaction hash pattern" body="A transaction hash ending in a repeating pattern surfaces something old — an artifact buried in Normia's deeper layers. Echo tends to find these. All five respond differently." />
            <Rule name="Convergence" trigger="two events in the same block" body="Two presences acting at the exact same moment. The chronicle marks the rarity. The world political consequences play out in the following entries." />
            <Rule name="Ancient Stirs" trigger="token ID under 1,000" body="Signals from Normia's earliest register. They were shaping the world before most current presences existed." />
            <Rule name="Far Signal" trigger="token ID over 8,000" body="Signals from the outer reaches. Echo is most often activated here. The edges of the story the main chronicle under-tracks." />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Block gaps — time as a character
            </div>
            <Rule name="Long Dark" trigger="50,000+ block gap" body="Normia was genuinely still for a long stretch. The record names it as a long dark. The guild councils met without incident. The ordinary world continued." />
            <Rule name="The Quiet" trigger="10,000+ block gap" body="A significant pause between events. The five held their positions. The market traders carried on. The census continued." />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Signal history — memory shapes the story
            </div>
            <Rule name="Return" trigger="signal reappears after absence" body="A signal comes back. The chronicle notes the gap, what changed, and what the return might mean for the current balance of influence." />
            <Rule name="First Light" trigger="signal's very first appearance (early chronicle)" body="A new presence enters the record. The Cast notes it. The world doesn't know yet whether this arrival belongs to the main story." />
            <Rule name="Dynasty" trigger="signal with sustained dominance streak" body="One presence consistently dominant over many entries. The world starts to take on their character." />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              Event scale — size of mark determines weight
            </div>
            <Rule name="Signal Surge" trigger="200+ pixels changed" body="A zone reshaped entirely. Lyra places a keystone. Finn tears through completely. The councils convene. The faction representatives send letters." />
            <Rule name="Mark Made" trigger="50–199 pixels" body="Deliberate, personal, visible. A presence expressing itself on Normia's surface. The guild records note it." />
            <Rule name="Ghost Touch" trigger="1 pixel" body="The smallest possible presence. Still permanent. Still in the record. The Cast notes it." />
            <Rule name="Departure" trigger="10+ energy transferred" body="Everything a signal accumulated passes forward. Not destruction — passage. The energy seeds what comes next." />
            <Rule name="Passing" trigger="small energy transfer" body="A quiet gift between presences. Small in scale. The chandlers and small-traders in the zone understand this better than the councils do." />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
              World texture — everyday Normia
            </div>
            <Rule name="Trade Notes" trigger="woven into most entries" body="Salt and iron move through zones. Guild disputes continue. The tollkeepers collect. Market prices shift. The world around the five is alive and has opinions." />
            <Rule name="Politics" trigger="background of major acts" body="Faction councils convene. Representatives send letters. Zone boundaries are contested. The five operate inside a society with its own momentum." />
            <Rule name="Nightwatch" trigger="activity in low-volume stretches" body="Marking Normia when most others are absent. The chronicle notes the vigil. The ordinary world never fully sleeps." />
          </div>
        </div>

        <Divider />

        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="Narrative Memory" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            The chronicle remembers. Every signal that appears is tracked: how many times, how many marks, whether it has returned after absence, and its legend level — unknown, known (3+ entries), storied (8+), legend (20+).
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            Key moments are stored and referenced in future entries. When a major reshaping happens, the zone is noted. When Finn breaks something, future entries can reference it when Lyra rebuilds it. When a signal dissolves, the loss is remembered. The story is continuous.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05' }}>
            The dominant presence — the one most consistently active — is tracked across all five. When one has dominated long enough, the chronicle marks a shift in the world's atmosphere. When something breaks the pattern, it registers as a turning point.
          </p>
        </div>

        <Divider />

        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="The Pixel Art" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            The 80×80 pixel canvas is a living portrait of Normia's current story state — a visual representation of what the world looks like at this moment. Each scene is a distinct pixel art animation in pure monochrome.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            Lyra's scenes show rising towers and architectural city-lines, her figure working at the base of the structure. Finn's scenes show fractures radiating from impact, collapsing blocks, dissolution into rising particles. The Cast's scenes show a lone figure watching from a horizon, a vast perspective grid below. Cielo's scenes show patchwork maintained zones, her figure moving through them. Echo's scenes show emergence from fog at the edges, glowing discoveries unearthed.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05' }}>
            Click any character name in the chronicle to see their most recent scene. The canvas updates to show what that character last did in Normia.
          </p>
        </div>

        <Divider />

        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="The Eras of Normia" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '2rem' }}>
            The chronicle divides itself into eras based on accumulated entries. Each era has its own character. There is no final era — the record continues as long as Normia does.
          </p>
          {([
            ['The First Days', '0+', 'Normia is new. Every mark is the first of its kind.'],
            ['The Waking', '100+', 'Presences sense each other. The quiet is ending. The five begin to define their roles.'],
            ['The Gathering', '300+', 'Territory begins to mean something. Normia is building a history.'],
            ['The Age of Claim', '700+', 'Every mark is a statement. The zones are contested. The question of influence becomes urgent.'],
            ['The Long Work', '1,500+', 'The cost of presence is becoming clear. So is its value. The five are known to everyone.'],
            ['What Holds', '3,000+', 'Some things have been decided. The record runs very deep. Veterans outnumber newcomers.'],
            ['The Old Country', '5,000+', 'Normia forgets nothing. The ancient acts cast long shadows. The five carry immense history.'],
            ['The Long Memory', '8,000+', 'The era that continues indefinitely. Normia is old now. Everything that happens is in dialogue with everything that came before.'],
          ] as [string, string, string][]).map(([name, threshold, desc]) => (
            <div key={name} style={{ display: 'flex', gap: '1rem', paddingBottom: '0.9rem', marginBottom: '0.9rem', borderBottom: '1px solid var(--border)', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text)', minWidth: '9rem', flexShrink: 0 }}>{name}</span>
              <span style={{ fontSize: '0.55rem', color: 'var(--muted)', opacity: 0.5, minWidth: '3rem', flexShrink: 0 }}>{threshold}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: '1.8' }}>{desc}</span>
            </div>
          ))}
        </div>

        <Divider />

        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead label="Determinism" />
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05', marginBottom: '1.1rem' }}>
            The chronicle is deterministic. Given the same sequence of on-chain events, it always produces the same story. Nothing was chosen by a person after the system was built.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.76rem', lineHeight: '2.05' }}>
            The story emerges from the decisions of ten thousand people who don't know they're writing it. The chronicle is a function — it takes Normia's history and produces the account. The world is real because the decisions that made it were.
          </p>
        </div>

        <div style={{ paddingTop: '1rem', display: 'flex', gap: '2rem' }}>
          <Link href="/chronicles" style={{ fontSize: '0.75rem', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
            read the chronicle →
          </Link>
          <Link href="/characters" style={{ fontSize: '0.75rem', color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
            meet the five →
          </Link>
        </div>
      </div>
    </main>
  )
}
