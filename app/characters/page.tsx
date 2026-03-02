'use client'
import { useState } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/NavBar'

const MAX = '44rem'
const S: React.CSSProperties = { maxWidth: MAX, margin: '0 auto', padding: '0 1.5rem' }

const CHARACTERS = [
  {
    key: 'LYRA',
    name: 'Lyra',
    title: 'the Architect',
    pronoun: 'she / her',
    bio: `Lyra grew up in the Cradle district, back when the Cradle was still open — before the Cartel put its checkpoints in and started deciding who could paint their own walls. She became a grid architect because she found the work satisfying. She still does, in a different way than she expected.

What she does now: designs grid patterns that give ordinary people structural control over their own territory. She releases everything open-source, freely, with no strings. The Cartel has made her two job offers. Both times she declined and published the design they were trying to hire her to withhold.

She doesn't think of herself as a resistance fighter. She thinks of herself as someone doing her job well, in a city that has made doing her job well into something dangerous. The distinction matters to her.`,
    nature: 'methodical, precise, stubbornly optimistic about what good design can do',
    activatedBy: 'building, designing, working on the problem',
    scenes: ['designing late at night', 'coffee in a still-open market', 'adjusting a pattern after a Cartel move'],
  },
  {
    key: 'FINN',
    name: 'Finn',
    title: 'the Reclaimer',
    pronoun: 'he / him',
    bio: `Finn worked for the Cartel for four years. He was good at it — he understood grid systems, he knew how to move through a district without being noticed, he knew which locks were cosmetic and which ones held. He got paid well. He told himself the work was neutral.

Then the Cartel moved into the district where his sister lived and he watched the grid flatten over everything she'd built there, and the neutrality stopped making sense. He left. He gave back the money — all of it, which was not a small thing — and started doing the same work in reverse.

He talks about what he does in logistics terms: access, recovery, restoration. He does not talk about the years before. He is aware that the skills he uses to recover Cartel-held territory are the same skills he used to take it. He keeps working anyway, because stopping would be worse.`,
    nature: 'practical, quiet, carries more than he shows',
    activatedBy: 'recovery operations, things that need to be fixed',
    scenes: ['moving through a dark corridor', 'eating eggs at 6am after a night job', 'not answering a question directly'],
  },
  {
    key: 'CAST',
    name: 'The Cast',
    title: 'the Record',
    pronoun: 'it / its',
    bio: `The Cast is the grid's autonomous witness-system. It predates the Cartel's expansion, predates most of the five, predates the current structure of Normia itself. Nobody built it for this purpose — it was built to log grid activity, and it has been doing that continuously since it was switched on.

It has no faction. It does not editorialize. It records Cartel advances and resistance acts with the same precision, in the same format, without privileging one over the other. Some people find this disturbing. The Cast has logged that reaction and continued.

Its relationship to the five is the closest thing it has to a perspective: it has been watching them long enough to know their patterns. It knows that Lyra eats the same breakfast for weeks at a time when she's deep in a design problem. It knows that Finn goes quiet before he acts. It knows how long Cielo's silences mean she's worried versus thinking. It doesn't say these things. It records what they do. The pattern is in the record for anyone who reads it carefully.`,
    nature: 'omnipresent, precise, more attentive than it lets on',
    activatedBy: 'observation, the full picture, things others miss',
    scenes: ['logging a quiet moment', 'watching from the edge of something', 'reading the whole grid at once'],
  },
  {
    key: 'SABLE',
    name: 'Cielo',
    title: 'the Keeper',
    pronoun: 'she / her',
    bio: `Cielo has been running some version of the safehouse network since before anyone called it a resistance. She started by helping a few neighbors who'd been pushed out of Cartel-claimed districts. Then more people found out. Then it was a network.

She manages a constant logistics problem: food, medicine, power cells, grid-access tokens, forged credentials, safe routes, people who need to move, places that need to be maintained, shortages that appear without warning. She is relentlessly practical about all of it. She does not have the luxury of idealism and she is not sure she had it before, either.

What she knows: more people are still in Normia and still functional because of her work than because of any single act of grid reclamation. She doesn't say this competitively. She says it when people ask why she doesn't do something more visible. The answer is that the visible things only work because the invisible ones are running.`,
    nature: 'direct, unsentimental in the useful ways, deeply committed to the people around her',
    activatedBy: 'keeping things running, the people in her network, problems she can actually solve',
    scenes: ['counting inventory', 'cooking for a full safehouse', 'taking the long way home to check a route'],
  },
  {
    key: 'ECHO',
    name: 'Echo',
    title: 'the Scout',
    pronoun: 'he / him',
    bio: `Echo doesn't explain himself well and has mostly stopped trying. He shows up with information — coordinates, notes, a sketched map on a takeout bag — and then goes back out. He has been doing this for two years. People have learned to trust the information even when they don't understand how he got it.

He moves through the parts of Normia that don't appear in the Cartel's coverage maps: service corridors, maintenance tunnels, the zones they've written off and stopped watching. He has found things there that changed how the resistance operates. He has also found things that were just interesting — a family that's been living in a supposedly cleared district for months, an old shortwave broadcasting music from before the Cartel era, a dead Cartel relay that nobody turned off.

He doesn't think of himself as brave. He thinks of himself as someone who looks in the places other people don't bother to look. The places have been worth looking at.`,
    nature: 'observant, sparse with words, brings back things other people couldn\'t find',
    activatedBy: 'the unmapped places, things that don\'t fit, corridors nobody knows about',
    scenes: ['moving through a gap in the coverage', 'sending a terse coordinates message at 3am', 'looking at something nobody expected to be there'],
  },
]

type Char = typeof CHARACTERS[0]

// Pixel art portrait — unique procedural art for each character
function CharPortrait({ charKey }: { charKey: string }) {
  const configs: Record<string, { primary: string; accent: string; scene: string }> = {
    LYRA: { primary: '#1a1a1a', accent: '#e8e4dc', scene: 'grid' },
    FINN: { primary: '#1a1a1a', accent: '#e8e4dc', scene: 'corridor' },
    CAST: { primary: '#1a1a1a', accent: '#e8e4dc', scene: 'watch' },
    SABLE: { primary: '#1a1a1a', accent: '#e8e4dc', scene: 'network' },
    ECHO: { primary: '#1a1a1a', accent: '#e8e4dc', scene: 'outer' },
  }

  const size = 320
  const cell = 10
  const cols = size / cell
  const rows = size / cell

  // Deterministic noise from character key
  function hash(x: number, y: number, key: string): number {
    let h = 0
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
    h = (h + x * 374761393 + y * 668265263) >>> 0
    h = ((h ^ (h >> 13)) * 1274126177) >>> 0
    return (h >>> 0) / 0xFFFFFFFF
  }

  function pixel(x: number, y: number): boolean {
    const v = hash(x, y, charKey)
    // Each character has a different density pattern
    const patterns: Record<string, (x: number, y: number, v: number) => boolean> = {
      LYRA: (x, y, v) => {
        // Grid architect — geometric, layered structure in center
        const cx = Math.abs(x - cols / 2) / (cols / 2)
        const cy = Math.abs(y - rows / 2) / (rows / 2)
        const structure = (x % 4 === 0 || y % 4 === 0) && v > 0.3
        const field = v > 0.55 + cx * 0.3 + cy * 0.2
        return structure || field
      },
      FINN: (x, y, v) => {
        // Reclaimer — moving through dark, directional lines
        const d = (x + y) / (cols + rows)
        const stripe = Math.sin(x * 0.8 - y * 0.4) > 0.3
        return stripe ? v > 0.4 + d * 0.3 : v > 0.75
      },
      CAST: (x, y, v) => {
        // The Record — static, even, watching. radial from corner
        const d = Math.sqrt(x * x + y * y) / Math.sqrt(cols * cols + rows * rows)
        return v > 0.45 + d * 0.25
      },
      SABLE: (x, y, v) => {
        // Keeper — networked nodes, connected
        const node = (x % 5 === 2 && y % 5 === 2)
        const link = (x % 5 === 2 || y % 5 === 2) && v > 0.55
        return node || link || v > 0.82
      },
      ECHO: (x, y, v) => {
        // Scout — sparse, appearing and disappearing at edges
        const edge = (x < 4 || x > cols - 5 || y > rows - 5)
        const scatter = v > 0.72
        const trail = y > rows * 0.6 && v > 0.5 && x % 3 !== 0
        return edge ? v > 0.45 : scatter || trail
      },
    }
    const fn = patterns[charKey] ?? ((_, __, v) => v > 0.6)
    return fn(x, y, v)
  }

  const pixels: { x: number; y: number }[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (pixel(x, y)) pixels.push({ x, y })
    }
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, maxWidth: '100%', marginBottom: '2.5rem' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      >
        <rect width={size} height={size} fill="var(--bg)" />
        {pixels.map(({ x, y }) => (
          <rect
            key={`${x}-${y}`}
            x={x * cell}
            y={y * cell}
            width={cell}
            height={cell}
            fill="var(--text)"
            opacity={0.85}
          />
        ))}
      </svg>
      {/* small label */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        fontSize: '0.48rem', letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--muted)', opacity: 0.4, padding: '0 2px 2px',
      }}>
        {charKey} / PORTRAIT
      </div>
    </div>
  )
}

function CharCard({ char, isOpen, onToggle }: { char: Char; isOpen: boolean; onToggle: () => void }) {
  const paras = char.bio.split('\n\n').filter(p => p.trim())

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '2rem 0', cursor: 'pointer',
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: 'clamp(1.9rem,6vw,3rem)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 0.92, marginBottom: '0.45rem' }}>
            {char.name}
          </h2>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--muted)' }}>
            {char.title}
          </div>
        </div>
        <div style={{ fontSize: '0.54rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', opacity: 0.5, flexShrink: 0 }}>
          {isOpen ? '— close' : '+ read'}
        </div>
      </button>

      {isOpen && (
        <div style={{ paddingBottom: '3.5rem' }}>
          <CharPortrait charKey={char.key} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
            {paras.map((para, i) => (
              <p key={i} style={{ color: 'var(--text)', fontSize: '0.8rem', lineHeight: '2.05' }}>
                {i === 0 ? (
                  <>
                    <span style={{
                      float: 'left', fontSize: '3rem', lineHeight: 0.82, fontWeight: 700,
                      marginRight: '0.07em', marginBottom: '-0.04em', color: 'var(--text)',
                    }}>
                      {para.trim()[0]}
                    </span>
                    {para.trim().slice(1)}
                  </>
                ) : para.trim()}
              </p>
            ))}
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {([
              ['pronouns', char.pronoun],
              ['nature', char.nature],
              ['you\'ll find her/him/it', char.activatedBy],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--muted)', minWidth: '6rem', flexShrink: 0, opacity: 0.55 }}>
                  {label}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.7 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* scene glimpses */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--muted)', opacity: 0.55, marginBottom: '0.8rem' }}>
              in the record
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {char.scenes.map((scene, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.5rem', color: 'var(--muted)', opacity: 0.4 }}>—</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.7, fontStyle: 'italic' }}>{scene}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CharactersPage() {
  const [openKey, setOpenKey] = useState<string | null>('LYRA')

  return (
    <main style={{ minHeight: '100vh', paddingTop: '2.75rem', paddingBottom: '6rem' }}>
      <NavBar />

      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...S, height: '2.1rem', display: 'flex', alignItems: 'center' }}>
          <Link href="/chronicles" style={{ fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>← chronicles</Link>
        </div>
      </div>

      <div style={S}>
        <div style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem', borderBottom: '3px double var(--border)', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.9rem' }}>
            the chronicles of normia
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem,8vw,4.2rem)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 0.88, marginBottom: '1.4rem' }}>
            the<br />five
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', lineHeight: '2.05', maxWidth: '30rem' }}>
            Five people living in Normia while the Glyph Cartel tries to take it. They didn't choose to be in a story. The record found them.
          </p>
        </div>

        {CHARACTERS.map(char => (
          <CharCard
            key={char.key}
            char={char}
            isOpen={openKey === char.key}
            onToggle={() => setOpenKey(openKey === char.key ? null : char.key)}
          />
        ))}

        <div style={{ paddingTop: '3rem', display: 'flex', gap: '2rem' }}>
          <Link href="/chronicles" style={{ fontSize: '0.75rem', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
            read the chronicle →
          </Link>
          <Link href="/how-it-works" style={{ fontSize: '0.75rem', color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
            how it works →
          </Link>
        </div>
      </div>
    </main>
  )
}
