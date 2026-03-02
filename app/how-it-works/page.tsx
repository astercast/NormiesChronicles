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
            The Chronicles of Normia translates real on-chain events into a living story. No writers, no editors — the narrative emerges from what people actually do with their Normies, run through a rule system that gives each event its place in the world.
          </p>
        </div>

        {/* THE WORLD */}
        <Accordion title="The World">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Normia is a city that runs in two layers: the physical streets and the pixel-grid mapped onto them. The grid decides who holds what territory — who can open a stall, who can draw on a wall, who gets flagged by the checkpoint system. It is the city's memory, and whoever controls it controls what the city is allowed to be.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The Glyph Cartel has been expanding into the grid for two years. They want it all — not to live in, but to standardize. Cartel-held territory looks the same everywhere: flat, locked, nothing personal. Five people are the reason it doesn't all look like that yet.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The story has memory. Every entry is written against a running world-state: which zones Lyra's designs protect, where the Cartel last pushed, what Cielo's network is short on, what Echo found most recently, how long Finn has been running. That state threads through every entry. The chronicle is continuous. It never resets.
            </p>
          </div>
        </Accordion>

        {/* THE FIVE */}
        <Accordion title="The Five">
          <div style={{ paddingTop: '0.5rem' }}>
            {([
              ['Lyra', 'the Architect', 'She designs open-source grid patterns that let ordinary people hold their own territory — freely, no strings. The Cartel has tried to hire her twice. Each time she declined and published the design they wanted her to withhold.'],
              ['Finn', 'the Reclaimer', 'He used to work for the Cartel. He left, gave back everything they paid him, and has been undoing his own work ever since — recovering Cartel-held zones one district at a time, using the same skills he used to take them.'],
              ['The Cast', 'the Record', 'The grid\'s autonomous witness-system. It logs everything without faction — Cartel advances and resistance acts alike, with the same precision, in the same format. It has been running since before any of this started.'],
              ['Cielo', 'the Keeper', 'She runs the safehouse network: food, medicine, shelter, credentials, safe routes, people who need to move. The infrastructure that keeps people alive when the Cartel is trying to cut them off. More people are fighting because of her than because of anything else.'],
              ['Echo', 'the Scout', 'He maps what the Cartel doesn\'t want mapped — the gaps in their coverage, corridors they don\'t know about, zones they think they\'ve locked but haven\'t. He finds things and brings them back. He doesn\'t explain how.'],
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
                When a Normie's pixels are changed on-chain, someone is acting in the grid. This is the heartbeat of Normia — people shaping their territory, Lyra designing new patterns, Finn recovering districts, Cielo keeping her network running, Echo moving through the outer zones. Life continuing in a city under pressure.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>BurnRevealed</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', lineHeight: '2.0' }}>
                When energy is transferred on-chain, the Cartel moves. A zone goes grey. Territory is taken, overwritten with the flat Cartel template. If the zone carried Lyra's design, that's a direct hit — and the story carries it forward until someone responds. Burns are permanent in the chain. The record doesn't forget them.
              </p>
            </div>
          </div>
        </Accordion>

        <Divider />

        {/* THE RULES */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHead label="The Story Rules" />
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05', marginBottom: '0.85rem' }}>
            Every on-chain event is evaluated by a rule engine that reads the event type, the character rotation, and the current world-state. The rule selected determines what kind of story moment gets written. Rules check in priority order — the first matching rule fires and the rest are skipped.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05', marginBottom: '2rem' }}>
            Characters rotate evenly — one in five events goes to each of the five. This means everyone gets the same number of story entries regardless of which event type lands on their slot. When a Cartel push lands on Lyra's slot, she's the one responding to it. When it lands on Echo's slot, he's the one who watches it happen from the outer edge.
          </p>

          <RuleGroup label="Chain Rhythm — check first" rules={[
            ['Opening', 'first 5 entries', 'Normia before the Cartel\'s expansion became undeniable. The record catches the city as it was at the beginning — the free grid, the open-source culture, the sense that the pixel-war was somebody else\'s problem.'],
            ['Era Turn', 'at entry thresholds', 'The city crosses into a new phase. The Cartel\'s tactics have shifted, the five have adapted, and everything from before this moment is prior-era record. The names change: First Pushback, Contested Season, The Long Fight.'],
            ['Long Quiet', '50,000+ blocks between events', 'A real gap in the record — weeks where the chain went quiet. The five were still living. The city was still running. Cielo cooked for the safehouse. Finn slept past sunrise. None of it got logged. Then the chain resumed.'],
            ['Simultaneous', 'two events in the same block', 'Two things happened at the exact same moment. The Cast logged both. In Normia, coincidences are usually not coincidences. Sometimes they are.'],
          ]} />

          <RuleGroup label="Lyra — the Architect" rules={[
            ['Lyra Responds', 'Cartel just hit her work + no response yet', 'The most immediate Lyra state. The Cartel pushed into her zone, her design is gone, and she\'s already at her workstation designing the version that goes back in — harder to exploit, built around what they found last time.'],
            ['Lyra Daily', 'every third Lyra entry', 'A day in Lyra\'s life that has nothing to do with the grid war. The market without Cartel tokens. Coffee. An old colleague. A wall that\'s been painted over. The city as it still mostly is, and what it costs to watch it change.'],
            ['Lyra Designs', 'standard Lyra entry', 'She\'s working. The current project, the version she threw away, the edges she\'s testing. The work she does freely and the people who benefit from it without knowing her name.'],
          ]} />

          <RuleGroup label="Finn — the Reclaimer" rules={[
            ['Finn Streak', '3+ Cartel moves without a pause', 'The Cartel\'s been pushing and Finn hasn\'t stopped responding. Third zone this stretch. He\'s not sleeping enough. Cielo has said so directly, twice. He nodded and kept going.'],
            ['Finn Daily', 'every fourth Finn entry', 'Finn not operating. Carrying boxes with Cielo. Sitting in a café watching the grid. A message from someone he used to work with that says something he isn\'t ready to talk about. The space between jobs.'],
            ['Finn Reclaims', 'standard Finn entry', 'Last night\'s job. The service corridor Echo flagged. Four hours, in and out, back before the grid-lights came on. Three hours of sleep. Eggs. Then the coordinates to Lyra.'],
          ]} />

          <RuleGroup label="The Cast — the Record" rules={[
            ['Cast Reads', 'Cartel pressure above 65%', 'The Cast steps back and reads the full shape of things — how much the Cartel holds, what the five have recovered, what Cielo is short on, what Echo found. The whole picture, held at once, without verdict.'],
            ['Cast Logs', 'standard Cast entry', 'Another entry. Another day in a city still mostly itself. The Cast records it the way it records everything: precisely, without favor, as part of a record that will still be here when all of this is over.'],
          ]} />

          <RuleGroup label="Cielo — the Keeper" rules={[
            ['Cielo Crisis', 'pressure above 70% or active shortage', 'Something is short, or the safehouse almost got found, or the numbers don\'t work. Cielo running the problem with the same directness she uses on everything. She knows which shortages she can solve and which ones are structural. She makes calls.'],
            ['Cielo Daily', 'every third Cielo entry', 'The slow morning. The big pot of food. The argument she had and the decision she changed because the other person was right. The school she passes on the long route. The reason she does all of this, which she mostly doesn\'t say out loud.'],
            ['Cielo Runs', 'standard Cielo entry', 'Supply day. Intake for new arrivals. The handoff with a hard drive and Lyra\'s designs on it. The system that works because she never skips the boring steps. The network that has kept more people functional than any single act of reclamation.'],
          ]} />

          <RuleGroup label="Echo — the Scout" rules={[
            ['Echo Finds', 'every third Echo entry', 'Something that changes the shape of things slightly. The unmarked corridor. The dead Cartel relay. The family still living in a zone that was marked cleared months ago. He tells Lyra first. She goes quiet. Then: send me the coordinates.'],
            ['Echo Scouts', 'standard Echo entry', 'Two days in the outer edge. The gap in Cartel coverage that\'s just large enough for a transit point. The terse message with coordinates and one line of notes. The route that saves Cielo forty minutes twice a week.'],
          ]} />

          <RuleGroup label="The Cartel" rules={[
            ['Cartel Push', 'BurnRevealed + zone carries Lyra\'s design', 'The Cartel hits something Lyra built. Her design is gone — overwritten with the flat Cartel template. This entry is featured and carries forward in the world-state until someone responds. The record holds the hit. It waits to log the response.'],
            ['Cartel Advance', 'any other BurnRevealed', 'Open territory, or what was. Now it\'s grey. The people who were living in the grid\'s open layer there have been pushed out or moved on. The Cast logs what it\'s called. What the people who used to paint those walls call it is not something the Cast records.'],
          ]} />
        </div>

        <Divider />

        <Accordion title="Narrative Memory">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The world-state updates after every entry. Every body of text reads from it before writing. This means each entry knows: which zones Lyra's designs protect, where the Cartel last pushed, whether Finn has responded to it, what Cielo is short on, what Echo found most recently, how hard the Cartel has been pressing.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The thread between Lyra and the Cartel — whether they've hit her work and whether she's responded — runs as a live flag through the whole chain. Every entry in the aftermath references it naturally: the zone is still grey, or Finn went back in, or Lyra's already redesigning. The reader doesn't need a summary to follow it.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Cielo's shortages, Echo's finds, Finn's streak count — all of these thread forward through subsequent entries until they're resolved or replaced. The story carries its own context because the world-state carries it.
            </p>
          </div>
        </Accordion>

        <Accordion title="Determinism">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The chronicle is deterministic. Given the same sequence of on-chain events, it always produces the same story. No writer made choices after the system was built. Token ID determines zone. Event index determines character. Event type and world-state together determine the beat. Block number selects the prose variant.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The one exception is world-state accumulation — that's order-dependent. What entry 300 says depends on what entries 1 through 299 did to the world. The chain is the story. The order is part of the meaning.
            </p>
          </div>
        </Accordion>

        <Accordion title="The Pixel Art">
          <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              The 80×80 canvas is a live visual of the story's current state — a monochrome pixel portrait of the moment the chronicle is in. Each of the five has its own animated scenes, and each Cartel move has its own visual register.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05' }}>
              Lyra's scenes show grid structures being built — lattice patterns, expanding designs, the architecture coming together. Finn's show movement through dark corridors, recovery, light returning. The Cast's show a single still presence, watching. Cielo's show the safehouse at night: warm against dark, people around a table. Echo's show the outer edge — sparse signal, wide space, something being found in the dark. Cartel scenes show encroachment: grey spreading, the flat template overwriting.
            </p>
          </div>
        </Accordion>

        <Accordion title="The Eras of Normia">
          <div style={{ paddingTop: '0.5rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '2.05', marginBottom: '1.5rem' }}>
              The chronicle divides into eras based on accumulated entries. Each era names the phase Normia is in. The five keep going through all of them. The record keeps running regardless.
            </p>
            {([
              ['Before the Cartel Moved', '0+', 'The free grid. Open territory. The city before everything.'],
              ['The First Pushback', '100+', 'The Cartel has moved. The five have started responding. Nobody has figured out the full shape of it yet.'],
              ['Living Under Pressure', '300+', 'This is the life now. The work continues. People adjust to a city that is slowly being taken.'],
              ['The Contested Season', '700+', 'Territory actively disputed. Every zone means something. The five know each other better than they planned to.'],
              ['What the Resistance Costs', '1,500+', 'The long run. What it takes out of people. What keeps them going anyway.'],
              ['The Long Fight', '3,000+', 'Years in. The five have changed. The city has changed. The Cartel has too. The work continues.'],
              ['Old Normia, Still Standing', '5,000+', 'Something has survived that wasn\'t supposed to. The record runs deep. The city still has places that are itself.'],
              ['After Everything', '8,000+', 'The record is very old now. Everything in it is in dialogue with everything else. The five have been at this for a very long time.'],
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
