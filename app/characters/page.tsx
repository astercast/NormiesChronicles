'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/NavBar'

const MAX = '44rem'
const S: React.CSSProperties = { maxWidth: MAX, margin: '0 auto', padding: '0 1.5rem' }

const CHARACTERS = [
  {
    key: 'LYRA',
    name: 'Lyra',
    title: 'the Architect',
    pronoun: 'she',
    goal: 'to build something in Normia that outlasts every attempt to erase it',
    nature: 'methodical, visionary, haunted by incompleteness',
    activatedBy: 'construction, persistence, accumulation',
    staticBio: [
      `Lyra is the one who is always building. Not because she was told to, not for payment or recognition, but because she has seen what Normia could be — a complete, coherent thing — and she cannot stop working toward it. The people who pass through the zones she has been working in describe a presence that changes the quality of a place. Steadier. More intentional. Like someone has decided that this section of the world will hold.`,
      `She arrived in Normia from somewhere she doesn't speak of. The market-keepers in the Null District say she came during a season of heavy change, when three of the old factions collapsed within a single month and the zone boundaries were redrawn without consensus. She appeared in that confusion and immediately began building. Nobody hired her. She simply started, and what she built was better than what had been there before, so nobody stopped her.`,
      `Right now, Lyra is in the middle of the longest project she has ever attempted. The structure she has been assembling across multiple zones — each piece apparently independent, each one load-bearing for something only she can see — is beginning to show its shape. The people of the High Pass and the Old Crossing have started to notice that the recent constructions relate to each other. That they are not coincidences. That someone is building something very large, one careful decision at a time. Finn has noticed too. Whether he will contest it is the question that moves through every faction council in Normia.`,
      `Without Lyra, Normia would fragment. She is the force that gives the world's growth a direction. Not her direction specifically — she is not trying to impose herself on the world — but direction as opposed to drift. When she builds, she shows that the world can be made intentional. Every other builder in Normia, whether they know her or not, builds in relation to what she demonstrated: that it is possible to make something that holds.`,
    ],
  },
  {
    key: 'VOSS',
    name: 'Finn',
    title: 'the Breaker',
    pronoun: 'he',
    goal: 'to unmake what calcifies — Normia must stay alive, even if that means tearing it open',
    nature: 'fierce, principled, misread as destructive',
    activatedBy: 'large reshapings, burns, collisions',
    staticBio: [
      `Finn is the most misunderstood presence in Normia. The councils call him a destroyer. The faction leaders file grievances every time he passes through their zones. The ordinary people — the carters and toll-keepers and market-stall holders — are more ambivalent. They have seen what he leaves behind, and they know that what he leaves behind is not rubble. It is space. Space that fills with something better, every time, because he only breaks what has stopped being useful and started being a wall.`,
      `The stories about where Finn came from differ wildly. The one thing every version agrees on is that he was part of something that calcified — a structure, a faction, an arrangement — that became so rigid it started to crush the people inside it. He broke it. He has been breaking calcified things ever since. He does not apologize for it. He has been in front of enough councils to know that apology is what they want, not because it changes anything, but because it establishes who has authority. He refuses to establish that.`,
      `Finn is currently watching Lyra's construction with something between admiration and alarm. He has let it proceed longer than he has let anything proceed in recent memory. Part of this is genuine respect — what she builds holds in a way that most things don't. Part of this is strategy. He is waiting to see what the structure becomes before he decides whether it is load-bearing for the world or whether it is becoming a wall. If it becomes a wall, he will tear it open. He always does.`,
      `Without Finn, Normia would calcify. He is the force that prevents any single vision — even Lyra's — from becoming doctrine. He keeps the world alive by keeping it contested. The philosophers in the White Corridors have a word for what he does: they call it negative capability, the capacity to hold uncertainty open. The councils call it a menace. Both are right, and neither one alone is the full picture.`,
    ],
  },
  {
    key: 'CAST',
    name: 'The Cast',
    title: 'the Witness',
    pronoun: 'it',
    goal: 'to see everything and forget nothing — Normia deserves a true record',
    nature: 'omnipresent, ancient, neither cruel nor kind — simply there',
    activatedBy: 'returns, long-watching, veteran presence',
    staticBio: [
      `The Cast does not arrive. It is there — has been there, may always have been there. The people of Normia who think about it at all tend to experience it as a kind of weather: ubiquitous, impossible to ignore once you start looking for it, easy to forget about until something happens that you realize The Cast has been recording. It has no agenda that anyone has been able to identify, no faction affiliation, no property in any zone. It simply watches, and records, and keeps on recording.`,
      `The oldest surviving accounts of Normia mention The Cast in passing. Not as a newcomer — as something that was already present. The scribes in the White Corridors believe it predates the current era structure. Some believe it predates the political arrangement of the zones entirely. If this is true, The Cast has watched Normia through configurations none of the current factions remember. It has seen arrangements that seemed permanent dissolve, and arrangements that seemed temporary become the load-bearing structure of the world. It does not volunteer this information.`,
      `The Cast is currently maintaining the most comprehensive document in Normia: a continuous account of every significant act, from the largest construction to the smallest mark. It is reading the current period with particular attention. The conflict between Lyra and Finn — the question of whether the world should be built toward a coherent vision or kept permanently open and contested — is, The Cast seems to recognize, a question Normia has faced before. It records both sides without commentary. Whether it has a preference, no one knows. It has never said.`,
      `Without The Cast, Normia would lose its memory. Not gradually — abruptly. The things that happened before the current generation of faction leaders arrived would become legend, then rumor, then silence. The Cast is why the world has continuity. It is why any act in Normia, no matter how small, is permanent in some register that will be readable by whoever comes after. It is the reason the question of who will shape Normia most has an answer that accumulates, rather than resetting every season.`,
    ],
  },
  {
    key: 'SABLE',
    name: 'Cielo',
    title: 'the Keeper',
    pronoun: 'she',
    goal: 'to tend what others abandon — nothing built in Normia should die unmourned',
    nature: 'quiet, relentless, fiercely loyal to what remains',
    activatedBy: 'quiet work, maintenance, holding',
    staticBio: [
      `Cielo is the one nobody mentions in the council reports. Lyra builds great things and Finn breaks them or doesn't; the councils write extensively about both. Cielo tends what exists after the great acts, and the councils call this maintenance, which is their way of saying they don't think about it. The ordinary people of Normia think about it constantly. They are the ones who live in the sections she has kept. They know what her work feels like from the inside, and they bring her things — small tokens, preserved food, information — because they understand in a way the councils don't that Cielo is the reason their neighborhood still resembles the place they moved into.`,
      `She came to Normia as a keeper of something that was lost. The story varies in the telling, but the shape of it is consistent: there was something built by people who loved it and then left it when the political situation changed, and Cielo stayed. She kept it alive when everyone else had already moved on. By the time she left, it was something new — not the same as what had been built, but descended from it, carrying what had been preserved forward into a different form. This is what she does everywhere she goes.`,
      `Cielo is currently moving through the outer zones, doing the work that doesn't generate headlines. She is patching what Finn broke last season in the Outer Ring. She is maintaining three sections of what Lyra built in the Grey Basin that Lyra herself has moved on from. She is doing something in the Deep Well that nobody has properly characterized yet, but the miners who work there say the zone feels different — more stable — since she started coming through. She works faster when nobody is watching, which is most of the time.`,
      `Without Cielo, Normia would lose its texture. The great acts — Lyra's constructions, Finn's breaks, Echo's discoveries — would stand and fall without consequence, because nothing would hold the shape they left. She is the force that makes Normia's history cumulative rather than episodic. She ensures that what happened last season is still present in what is happening this season. Without her, Normia would have drama but no depth. It would be a world that kept starting over, never quite remembering what it had been.`,
    ],
  },
  {
    key: 'ECHO',
    name: 'Echo',
    title: 'the Wanderer',
    pronoun: 'he',
    goal: 'to find what Normia is hiding — every edge conceals something the center cannot see',
    nature: 'unpredictable, magnetic, arrives exactly when it matters',
    activatedBy: 'edge events, unexpected patterns, far signals',
    staticBio: [
      `Echo appears. That is the primary fact about him. He is not always present, is often absent for long stretches, and then appears — at exactly the moment that matters, from exactly the direction nobody was watching, with exactly the knowledge or action that changes what was about to happen. The people who have spent time trying to predict him have given up. The people who have spent time trying to understand him after the fact have more success: in retrospect, every arrival makes sense. The problem is that Normia lives in the present tense.`,
      `Echo comes from the edges. This is not metaphor: he has spent more time in the outer zones, the margins, the sections of Normia that the central factions consider peripheral, than any other significant presence in the world. He has been to zones that most of the faction councils cannot find on a map. He has spoken to people who have never been to the High Ground or the White Corridors and have no interest in going. He brings what he finds at the margins back to the center — not through reports or council testimony, but through acts. He does something, and the thing he does turns out to be load-bearing for events nobody had predicted.`,
      `Echo is currently working on something he has not named. He has been to the Far Sectors twice in the past season, which is unusual. He passed through the Fault Line and the Deep Well on the same trip, which the surveyors who track him say they have never seen before. Whatever he is looking for, he appears to be close to finding it. When he finds it — when Echo surfaces something from the margins — the center of Normia will have to reckon with it. It always does.`,
      `Without Echo, Normia would be complete but wrong. It would have the depth that Cielo gives it, the direction that Lyra builds toward, the challenge that Finn provides, the memory that The Cast keeps. What it would lack is surprise. It would know only what it had been told. Echo is the force that introduces into the world things the world did not know it contained. He finds what is hidden, not because he was hired to find it, but because he cannot stop looking. In a world that sometimes believes it knows its own shape, that inability is the most valuable thing Normia has.`,
    ],
  },
]

type CharKey = typeof CHARACTERS[0]

function CharacterCard({
  char,
  isOpen,
  onToggle,
}: {
  char: CharKey
  isOpen: boolean
  onToggle: () => void
}) {
  const [aiText, setAiText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!isOpen || fetched || loading) return
    setLoading(true)
    setFetched(true)
    fetch('/api/character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: char }),
    })
      .then(r => r.json())
      .then(d => {
        setLoading(false)
        if (d.text) setAiText(d.text)
        else setError(true)
      })
      .catch(() => { setLoading(false); setError(true) })
  }, [isOpen, fetched, loading, char])

  const paragraphs = aiText
    ? aiText.split('\n\n').filter(p => p.trim().length > 10)
    : char.staticBio

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

          {/* Goal */}
          <div style={{ paddingBottom: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              what {char.pronoun === 'it' ? 'it' : char.pronoun === 'he' ? 'he' : 'she'} wants
            </div>
            <p style={{ color: 'var(--text)', fontSize: '0.8rem', lineHeight: '1.9', fontStyle: 'italic' }}>
              {char.goal}
            </p>
          </div>

          {/* Portrait placeholder */}
          <div style={{
            border: '1px solid var(--border)', marginBottom: '2.5rem',
            padding: '4rem 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--muted)', opacity: 0.4 }}>
                portrait — image to be added
              </div>
            </div>
          </div>

          {/* Bio text */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.5rem 0 2rem' }}>
              <div style={{ width: '4rem', height: '1px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                <div className="scan-bar" style={{ position: 'absolute', inset: 0, background: 'var(--text)', width: '2rem' }} />
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontStyle: 'italic', opacity: 0.6 }}>
                the chronicler is writing…
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
              {paragraphs.map((para, i) => (
                <p key={i} style={{ color: 'var(--text)', fontSize: '0.8rem', lineHeight: '2.1' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.58rem', fontStyle: 'italic', opacity: 0.4 }}>
                  {aiText ? '— written by the chronicler' : '— from the standing record'}
                </p>
                {!loading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAiText(null); setFetched(false); setError(false) }}
                    style={{
                      fontSize: '0.54rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: 'var(--muted)', opacity: 0.4, background: 'none', border: 'none',
                      cursor: 'pointer', padding: 0,
                    }}
                  >
                    ask again →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Attributes */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {[
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
        {/* Title */}
        <div style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem', borderBottom: '3px double var(--border)', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.9rem' }}>
            the chronicles of normia
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem,8vw,4.2rem)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 0.88, marginBottom: '1.4rem' }}>
            the<br />five
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', lineHeight: '2.05', maxWidth: '30rem' }}>
            Five presences shape Normia's destiny. They didn't choose their roles — the roles chose them. Every act made by every person in this world flows toward the question only the record can answer: who will have the most influence over Normia?
          </p>
        </div>

        <div style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.72rem', lineHeight: '1.95' }}>
            The chronicles track every act. Each one shifts the balance. The lead changes. Choose your side.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.62rem', lineHeight: '1.8', marginTop: '0.5rem', opacity: 0.6, fontStyle: 'italic' }}>
            Each portrait is written fresh by the chronicler — click to read. Images will follow.
          </p>
        </div>

        {CHARACTERS.map(char => (
          <CharacterCard
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
