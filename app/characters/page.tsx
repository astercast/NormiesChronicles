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
    bio: `Lyra has been building the same thing across Normia for longer than anyone can say — sector by sector, piece by piece, working toward a shape only she can see. She arrived during a season of collapse and started without being asked. Nobody hired her. She simply began, and what she built held, so nobody stopped her.

She works incrementally and without explanation. The pieces look unconnected until suddenly they do not. By the time anyone recognises the pattern, she is already several sectors ahead.`,
    nature: 'methodical, visionary, haunted by incompleteness',
    activatedBy: 'construction, persistence, accumulation',
  },
  {
    key: 'VOSS',
    name: 'Finn',
    title: 'the Breaker',
    pronoun: 'he / him',
    bio: `Finn is the most misread presence in Normia. The councils call him a destroyer. The people who live in the spaces he has cleared tend to see it differently — what he leaves behind is not rubble, it is room. He only breaks what has stopped earning its position and started becoming a wall.

He does not apologise for it. He has sat in enough council hearings to know that apology is what they want, not because it changes anything, but because it establishes who has authority. He refuses to establish that.`,
    nature: 'fierce, principled, misread as destructive',
    activatedBy: 'large reshapings, burns, collisions',
  },
  {
    key: 'CAST',
    name: 'The Cast',
    title: 'the Witness',
    pronoun: 'it / its',
    bio: `The Cast does not arrive. It is there — has always been there. The people of Normia who think about it at all experience it as a kind of weather: ubiquitous, impossible to ignore once you notice it, easy to forget until something happens that you realise it has been recording all along.

It has no faction, no property, no agenda anyone has been able to name. It watches. It records. The oldest surviving accounts of Normia mention it in passing — not as a newcomer, but as something already present.`,
    nature: 'omnipresent, ancient, neither cruel nor kind — simply there',
    activatedBy: 'returns, long-watching, veteran presence',
  },
  {
    key: 'SABLE',
    name: 'Cielo',
    title: 'the Keeper',
    pronoun: 'she / her',
    bio: `Cielo tends what the others leave behind. After Lyra builds and Finn clears, Cielo comes through the edges — repairing what is fraying, holding zones that have drifted out of anyone's attention, keeping structures alive past their moment of notice.

The council reports do not mention her much. The ordinary people of Normia — the ones who live in the sections she has kept — think about her constantly. They know what her work feels like from the inside in a way the councils never will.`,
    nature: 'quiet, relentless, fiercely loyal to what remains',
    activatedBy: 'quiet work, maintenance, holding',
  },
  {
    key: 'ECHO',
    name: 'Echo',
    title: 'the Wanderer',
    pronoun: 'he / him',
    bio: `Echo appears. That is the primary fact about him. He is absent for long stretches, then surfaces — from exactly the direction no one was watching, with exactly the knowledge or action that changes what was about to happen. The people who have tried to predict him have given up. In retrospect, every arrival makes sense.

He has spent more time in the outer zones and margin sectors than any other presence in the system. He brings what he finds at the edges back to the centre — not through reports, but through acts.`,
    nature: 'unpredictable, magnetic, arrives exactly when it matters',
    activatedBy: 'edge events, unexpected patterns, far signals',
  },
]

type Char = typeof CHARACTERS[0]

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

          {/* portrait placeholder */}
          <div style={{
            border: '1px solid var(--border)', marginBottom: '2.5rem',
            padding: '4rem 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--muted)', opacity: 0.35, textAlign: 'center' }}>
              portrait — coming soon
            </div>
          </div>

          {/* bio */}
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

          {/* attributes */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {[
              ['pronouns', char.pronoun],
              ['nature', char.nature],
              ['drawn to', char.activatedBy],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--muted)', minWidth: '5rem', flexShrink: 0, opacity: 0.55 }}>
                  {label}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.7 }}>{val}</span>
              </div>
            ))}
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
            Five presences shape the world. They did not choose their roles — the roles found them. Every act in Normia flows toward a question only the record can answer.
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
