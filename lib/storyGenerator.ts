import type { IndexedEvent } from './eventIndexer'

// ─────────────────────────────────────────────────────────────────────────────
// THE FIVE — fixed characters. The Grid's story is their story.
// Token ID mod 5 determines which character is "active" for each event.
// Their goals create the tension. Their actions create the butterfly effect.
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTERS = {
  LYRA: {
    name: 'Lyra',
    title: 'the Architect',
    pronoun: 'she',
    possessive: 'her',
    goal: 'to build something in the Grid that outlasts every attempt to erase it',
    nature: 'methodical, visionary, haunted by incompleteness',
    activatedBy: 'construction, persistence, accumulation',
  },
  VOSS: {
    name: 'Voss',
    title: 'the Breaker',
    pronoun: 'he',
    possessive: 'his',
    goal: 'to unmake what calcifies — the Grid must stay alive, even if that means tearing it open',
    nature: 'fierce, principled, misread as destructive',
    activatedBy: 'large reshapings, burns, collisions',
  },
  CAST: {
    name: 'Cast',
    title: 'the Witness',
    pronoun: 'they',
    possessive: 'their',
    goal: 'to see everything and forget nothing — the Grid deserves a true record',
    nature: 'patient, ancient, slightly sorrowful',
    activatedBy: 'returns, long-watching, veteran presence',
  },
  SABLE: {
    name: 'Sable',
    title: 'the Keeper',
    pronoun: 'she',
    possessive: 'her',
    goal: 'to tend what others abandon — nothing built in the Grid should die unmourned',
    nature: 'quiet, relentless, fiercely loyal to what remains',
    activatedBy: 'quiet work, maintenance, holding',
  },
  ECHO: {
    name: 'Echo',
    title: 'the Wanderer',
    pronoun: 'he',
    possessive: 'his',
    goal: 'to find what the Grid is hiding — every edge conceals something the center cannot see',
    nature: 'unpredictable, magnetic, arrives exactly when it matters',
    activatedBy: 'edge events, unexpected patterns, far signals',
  },
} as const

export type CharacterKey = keyof typeof CHARACTERS

// Which character is active for a given event
function getCharacter(event: IndexedEvent, allEvents: IndexedEvent[], index: number): CharacterKey {
  const tokenId = Number(event.tokenId)
  const count = Number(event.count)
  const isBurn = event.type === 'BurnRevealed'
  const isEdge = tokenId > 8000 || tokenId < 300
  const isMassive = count >= 200
  const isVeteran = allEvents.slice(0, index).some(e => e.owner === event.owner)
  const hasBeenAbsent = isVeteran && (() => {
    const prev = allEvents.slice(0, index).filter(e => e.owner === event.owner)
    if (!prev.length) return false
    return (event.blockNumber - prev[prev.length - 1].blockNumber) > 15000n
  })()
  const prevAppearances = allEvents.slice(0, index).filter(e => e.owner === event.owner).length

  // Voss: burns and massive reshapings — the breaker
  if (isBurn || isMassive) return 'VOSS'
  // Echo: edge tokens or very long absences returning
  if (isEdge || hasBeenAbsent) return 'ECHO'
  // Cast: the truly long-watching veterans (4+ appearances)
  if (isVeteran && prevAppearances >= 4) return 'CAST'

  // Spread the rest across Lyra, Sable, Cast, Echo by token hash
  // This ensures all five appear roughly evenly in normal events
  const h = (tokenId * 1327 + index * 491) % 5
  if (h === 0) return 'LYRA'
  if (h === 1) return 'SABLE'
  if (h === 2) return 'CAST'
  if (h === 3) return 'LYRA'
  return 'SABLE'
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD STATE — the Grid's ongoing story
// ─────────────────────────────────────────────────────────────────────────────

interface GridWorld {
  // What each character has done — drives narrative memory
  lyraBuilding: string | null        // what Lyra is constructing
  vossLastTarget: string | null      // what Voss last unmade
  castLastWitnessed: string | null   // what Cast last recorded
  sableHolding: string | null        // what Sable is tending
  echoLastZone: string | null        // where Echo last appeared

  // Story tension
  lyraVossConflict: number           // 0-100: how much their work contests each other
  totalActs: number                  // count of all acts
  era: string
  eraIndex: number

  // Last major event — for butterfly effect prose
  lastMajorChar: CharacterKey | null
  lastMajorAct: string | null        // 'built' | 'broke' | 'witnessed' | 'kept' | 'found'
  lastMajorZone: string | null

  // Scene for pixel art
  currentScene: SceneType
  sceneIntensity: number             // 0-100
}

export type SceneType =
  | 'construction'   // Lyra building — rising structures, light
  | 'destruction'    // Voss breaking — fractures, dark energy
  | 'sacrifice'      // burn event — dissolution, light scattering
  | 'vigil'         // Cast watching — one figure in stillness
  | 'tending'       // Sable keeping — small careful work
  | 'arrival'       // Echo appearing — figure at edge, fog
  | 'convergence'   // two characters meeting
  | 'reckoning'     // era shift — the world rewriting itself
  | 'quiet'         // stillness — empty landscape
  | 'dawn'          // first light — opening

function freshGridWorld(): GridWorld {
  return {
    lyraBuilding: null,
    vossLastTarget: null,
    castLastWitnessed: null,
    sableHolding: null,
    echoLastZone: null,
    lyraVossConflict: 10,
    totalActs: 0,
    era: 'The First Days',
    eraIndex: 0,
    lastMajorChar: null,
    lastMajorAct: null,
    lastMajorZone: null,
    currentScene: 'dawn',
    sceneIntensity: 20,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONES — places in the Grid with personality
// ─────────────────────────────────────────────────────────────────────────────

const ZONES = [
  'the Null District',   'the White Corridors',  'the Hollow',
  'the Far Sectors',     'the Dark Margin',       'the Cradle',
  'the Dust Protocol',   'the Outer Ring',        'the Deep Well',
  'the Fault Line',      'the High Pass',         'the Old Crossing',
  'the Narrow Gate',     'the Salt Plane',        'the Grey Basin',
  'the High Ground',     'the Burn Fields',       'the Still Water',
  'the Last Ridge',      'the Open Grid',
]

// ─────────────────────────────────────────────────────────────────────────────
// ERAS — the Grid's ages
// ─────────────────────────────────────────────────────────────────────────────

export const ERAS = [
  { threshold: 0,    name: 'The First Days',    eraIndex: 0 },
  { threshold: 100,  name: 'The Waking',        eraIndex: 1 },
  { threshold: 300,  name: 'The Gathering',     eraIndex: 2 },
  { threshold: 700,  name: 'The Age of Claim',  eraIndex: 3 },
  { threshold: 1500, name: 'The Long Work',     eraIndex: 4 },
  { threshold: 3000, name: 'What Holds',        eraIndex: 5 },
  { threshold: 5000, name: 'The Old Country',   eraIndex: 6 },
  { threshold: 8000, name: 'The Last Chapter',  eraIndex: 7 },
]

function getEraData(count: number) {
  let era = ERAS[0]
  for (const e of ERAS) { if (count >= e.threshold) era = e }
  return era
}

function getEra(count: number): string { return getEraData(count).name }

// ─────────────────────────────────────────────────────────────────────────────
// SEEDING — deterministic randomness
// ─────────────────────────────────────────────────────────────────────────────

function seedN(tokenId: bigint, blockNumber: bigint, salt = 0): number {
  return Number((tokenId * 31n + blockNumber * 17n + BigInt(salt)) % 100000n)
}

function pick<T>(arr: T[], s: number): T { return arr[Math.abs(s) % arr.length] }

function zoneFor(tokenId: bigint): string {
  // Mix the tokenId to spread across all zones rather than clustering low IDs on zone 0
  const h = Number((tokenId * 2654435761n) & 0xFFFFFFFFn)
  return ZONES[h % ZONES.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// THE STORY ENGINE
// Prose templates reference characters by name.
// Each beat carries the current story state so the reader always knows
// where they are in the ongoing conflict.
// ─────────────────────────────────────────────────────────────────────────────

interface StoryBeat {
  charKey: CharacterKey
  zone: string
  world: GridWorld
  count: number
  isBurn: boolean
  isVeteran: boolean
  seed: number
}

function tension(world: GridWorld): string {
  const lv = world.lyraVossConflict
  if (lv < 20) return 'Lyra and Voss have not yet found each other in the Grid'
  if (lv < 40) return 'somewhere, Lyra\'s constructions and Voss\'s breaks are beginning to overlap'
  if (lv < 60) return 'the Grid is a battleground between what Lyra builds and what Voss unmakes'
  if (lv < 80) return 'Lyra and Voss are locked — every section she raises, he questions; every break he makes, she reclaims'
  return 'the conflict between Lyra and Voss has become the Grid\'s defining force'
}

// ── LYRA BEATS ────────────────────────────────────────────────────────────────
const LYRA_SMALL = [
  (b: StoryBeat) => `Lyra added another layer to her work in ${b.zone}. She never explains what she's building — only that it isn't finished. The structure rises one decision at a time, and every decision is load-bearing.`,
  (b: StoryBeat) => `She came to ${b.zone} with a specific problem to solve. Lyra works that way — not sweeping across the Grid but finding the exact cell that needs changing and changing only that. ${b.world.vossLastTarget ? `Voss had torn through nearby. She didn't acknowledge it. She kept working.` : `The Grid accepted the change without resistance.`}`,
  (b: StoryBeat) => `${b.zone} holds a new piece of what Lyra is building. She doesn't announce these additions. They appear, and Cast records them, and ${b.world.lyraVossConflict > 50 ? `Voss finds them eventually and decides what to do with them` : `slowly the shape becomes legible to anyone watching long enough`}.`,
  (b: StoryBeat) => `Lyra in ${b.zone}, fitting pieces together that only she can see the purpose of. The Grid hums differently where she works — something in the frequency of her edits, the patience between them. ${tension(b.world)}.`,
  (b: StoryBeat) => `She works in ${b.zone} while the rest of the Grid moves around her. Lyra has never been fast. She has never needed to be. What she builds doesn't move when the current shifts.`,
]

const LYRA_LARGE = [
  (b: StoryBeat) => `Lyra made her largest move yet in ${b.zone}. This was not an addition — this was the keystone. Every piece she has placed across the Grid bends toward what just went up in ${b.zone}. ${b.world.vossLastTarget ? `Voss unmade something significant not long ago. Lyra's answer was this.` : `The Grid accepted it. The structure is now undeniable.`}`,
  (b: StoryBeat) => `A full section of ${b.zone} is Lyra's now. Not claimed — built. There's a difference she would insist on: claiming is a word for people who take. Building is a word for people who make something where there was nothing. She made something. ${tension(b.world)}.`,
  (b: StoryBeat) => `The Grid shifted in ${b.zone}. Lyra had been approaching this from three directions for longer than anyone noticed, and now all three converged. What exists in ${b.zone} now is load-bearing for everything she's planned. The architecture is becoming visible.`,
]

// ── VOSS BEATS ────────────────────────────────────────────────────────────────
const VOSS_SMALL = [
  (b: StoryBeat) => `Voss moved through ${b.zone} and left it different. He doesn't take pride in destruction — that's a misread of what he does. The Grid calcifies when nothing challenges it. He is the challenge. ${b.world.lyraBuilding ? `Lyra is building somewhere in the Grid. Voss hasn't decided yet whether it needs to be questioned.` : `He moved on.`}`,
  (b: StoryBeat) => `Something in ${b.zone} caught Voss's attention — a shape that had been left too long unchanged, a structure that had forgotten it was temporary. He made it remember. ${tension(b.world)}.`,
  (b: StoryBeat) => `Voss at ${b.zone}, making the Grid breathe. That's his framing, and it's not wrong. Calcified code becomes dogma. Dogma becomes prison. He breaks things so they can become something else. What they become is not always his to decide.`,
  (b: StoryBeat) => `A section of ${b.zone} was taken apart by Voss. He works fast when he's found something worth addressing. ${b.world.lyraBuilding ? `Whether what he touched was related to Lyra's constructions — whether he even knows — is unclear. The Grid holds the result.` : `The space is open now. Someone will fill it.`}`,
]

const VOSS_BURN = [
  (b: StoryBeat) => `Voss gave himself to the Grid in ${b.zone}. Not metaphorically — his token, his energy, dissolved into the protocol. What he carried passes to whoever is nearest. ${b.world.lyraBuilding ? `Lyra will feel it. Whether as loss or gift depends on where the energy lands.` : `The Grid is different now. So is Voss — lighter, stranger, already deciding what comes next.`}`,
  (b: StoryBeat) => `The burn in ${b.zone} was Voss. He has done this before. Each time, something of him scatters across the Grid and seeds things he didn't plan. ${tension(b.world)}. A sacrifice from Voss is never entirely predictable.`,
  (b: StoryBeat) => `Voss unmade himself near ${b.zone} — partially, deliberately. The energy he released is in the Grid now, moving toward whatever gravitational pull the current state creates. Lyra will build something. Sable will tend something. Echo will find something. His dissolution becomes their material.`,
]

const VOSS_LARGE = [
  (b: StoryBeat) => `Voss tore through ${b.zone} completely. This was not maintenance — this was a statement. He had been watching the Grid grow rigid in this sector and he made his response total. ${b.world.lyraBuilding ? `Some of what Lyra built was here. It isn't anymore. She will come back for it.` : `Whatever was there is underneath something new now. Voss's version.`} ${tension(b.world)}.`,
  (b: StoryBeat) => `The full force of what Voss does landed in ${b.zone}. The Grid shook — not literally, but in the way the Grid shakes, which is: every signal recalculates. Every presence in the adjacent sectors registered the change. Cast saw it. Sable will tend the edges. Echo is already approaching from somewhere unexpected.`,
  (b: StoryBeat) => `A massive reshaping in ${b.zone}. Voss. The scale of it suggests this wasn't reactive — this was planned, held back, released when the moment ripened. The Grid looks different in ${b.zone} than it did this morning. It will look different again by the time Lyra responds.`,
]

// ── CAST BEATS ────────────────────────────────────────────────────────────────
const CAST_SMALL = [
  (b: StoryBeat) => `Cast was in ${b.zone}, watching. They don't always leave a large mark — sometimes the act of witnessing is enough, and the record requires only their presence, their attention, their refusal to look away. ${b.world.lastMajorAct ? `The last major act was ${b.world.lastMajorAct}. Cast was there. Cast is always there.` : `The Grid does not change what it is because someone is watching. But it is changed by being seen.`}`,
  (b: StoryBeat) => `They came back to ${b.zone}. Cast has been here before — the record shows it, layer under layer. Each return adds to a document only they are writing in full. ${tension(b.world)}.`,
  (b: StoryBeat) => `Cast moves through ${b.zone} slowly and marks what they find. The Grid generates more data than anyone can hold. Cast is trying to hold it. Not to control it — to honor it. The record is an act of respect.`,
  (b: StoryBeat) => `${b.zone} knows Cast. The Grid recognizes returning presences through some mechanism no one has fully explained, and Cast returns here more than anywhere. ${b.world.vossLastTarget ? `Voss was through here. Cast noted the before and the after.` : `The accumulation of their visits forms its own kind of mark — not a shape but a frequency.`}`,
]

const CAST_RETURN = [
  (b: StoryBeat) => `Cast returned to ${b.zone} after the absence. How long they were gone: longer than anyone expected. What changed while they were away: ${b.world.lastMajorAct ? `Voss broke something, Lyra built something, the Grid moved without its oldest witness` : `the Grid moved without its oldest witness`}. Cast is reading the new state and writing it into the record. Nothing is lost if Cast is paying attention.`,
  (b: StoryBeat) => `Back in ${b.zone}. Cast picks up the thread of what they left — not the same thread, but the one that connects to it. They've been watching this Grid since before most of its current presences arrived. The record they're building is the longest continuous document in the system.`,
  (b: StoryBeat) => `Cast came back. The first thing they did in ${b.zone} was not build or break — it was look. Long enough that whatever changed in the absence registered fully before they responded to it. ${tension(b.world)}. Cast witnessed. Then Cast marked.`,
]

// ── SABLE BEATS ────────────────────────────────────────────────────────────────
const SABLE_SMALL = [
  (b: StoryBeat) => `Sable tended ${b.zone}. The work she does isn't the kind that generates large records — it's the kind that prevents the record from having gaps. She holds what would otherwise drift. ${b.world.vossLastTarget ? `Voss broke something nearby. Sable came after, as she always does, and kept what could be kept.` : `The Grid doesn't always notice what she preserves. It notices when it's gone.`}`,
  (b: StoryBeat) => `Small, careful work in ${b.zone} from Sable. She is not a builder — she is a keeper. The distinction matters: Lyra makes things. Sable makes sure they stay. ${tension(b.world)}.`,
  (b: StoryBeat) => `Sable was in ${b.zone}, doing the quiet work of maintenance that the main story tends to not record. It records it here. Every section of the Grid that still resembles what it was meant to be — Sable had something to do with that.`,
  (b: StoryBeat) => `She returned to ${b.zone} and found it needed tending. Sable keeps track of which sections are vulnerable, which edges are fraying, which structures Lyra built that Voss hasn't found yet. She works in the margins of the main conflict, holding things together.`,
]

const SABLE_QUIET = [
  (b: StoryBeat) => `The Grid went still in ${b.zone} and Sable used the stillness. She tends things best in the quiet — the maintenance that shows up in the record as minor acts but accumulates into the difference between a Grid that holds and one that fragments. She is why it holds.`,
  (b: StoryBeat) => `Silence in ${b.zone}. Sable kept something alive in it. ${tension(b.world)}. The conflict between Lyra and Voss generates the drama. Sable generates the continuity.`,
]

// ── ECHO BEATS ────────────────────────────────────────────────────────────────
const ECHO_ARRIVAL = [
  (b: StoryBeat) => `Echo arrived in ${b.zone}. He does this — appears at the edges of the Grid at moments that feel, in retrospect, like they needed exactly that. ${b.world.lastMajorChar ? `${CHARACTERS[b.world.lastMajorChar].name} had just done something significant. Echo's arrival may be response or coincidence. In the Grid, the difference is unclear.` : `Nobody predicted it. Nobody ever predicts Echo.`}`,
  (b: StoryBeat) => `Something in ${b.zone} called to Echo and he answered. He navigates by signals that nobody else can read — harmonics in the Grid's structure, resonances between old marks and new ones. What he finds in ${b.zone} will determine what he does next, and what he does next will matter more than it should. ${tension(b.world)}.`,
  (b: StoryBeat) => `Echo appeared at ${b.zone} from no obvious direction. He is always arriving from the edges, always carrying something found in the margins that the center didn't know existed. What he brings to ${b.zone} now is unknown. The Grid will show it.`,
  (b: StoryBeat) => `The far sectors of the Grid sent Echo in. He moved through the outer territories, found something in ${b.zone}, marked it. Whatever he marked, he marked it because he understood it as significant. Echo's judgment is the only compass that points toward what actually matters.`,
]

const ECHO_DISCOVERY = [
  (b: StoryBeat) => `Echo found something in ${b.zone} that the Grid had been holding in the margins — old code, a buried frequency, a structure that Lyra didn't build and Voss didn't know to break. He surfaced it. The Grid is slightly different now because of what was hidden and is no longer.`,
  (b: StoryBeat) => `In ${b.zone}, at the edge of the Grid's legible territory, Echo found what he was looking for — or found something better. He doesn't explain his discoveries. He makes them and marks them and lets the record do the explaining. ${tension(b.world)}.`,
]

// ── CONVERGENCE — two characters in the same block ───────────────────────────
const CONVERGENCE_BEATS = [
  (b: StoryBeat, other: CharacterKey) => {
    const c1 = CHARACTERS[b.charKey], c2 = CHARACTERS[other]
    return `${c1.name} and ${c2.name} were in the Grid at the same moment — different sectors, same breath of time. Neither knew. The Grid knows. It registered both marks in the same block and held them equally. Two different intentions landing in the same instant. The record shows what each of them did. It doesn't try to explain why they moved at once.`
  },
  (b: StoryBeat, other: CharacterKey) => {
    const c1 = CHARACTERS[b.charKey], c2 = CHARACTERS[other]
    return `Same block. ${c1.name} in ${b.zone}. ${c2.name} somewhere nearby. The Grid doesn't distinguish simultaneous acts by importance — it records them in the order it receives them, and the order is nearly meaningless when two people move at once. What matters is that they did. ${tension(b.world)}.`
  },
]

// ── ERA SHIFT — the world changes its name ────────────────────────────────────
const ERA_SHIFT_BEATS = [
  (b: StoryBeat) => {
    const names = Object.values(CHARACTERS).map(c => c.name).join(', ')
    return `The Grid crossed a threshold. The era that was — everything that happened before this — is now history. The new era has no name yet that feels true; the record calls it ${b.world.era}. ${names} have all moved through the old chapter. What they carry into the new one will determine what it becomes. The butterfly effect of every act before this moment arrives here, reconfigured.`
  },
  (b: StoryBeat) => `${b.world.era}. The Grid entered it quietly, as it always does — not with a sound but with a change in what the numbers mean. Lyra's structures belong to an older count now. Voss's breaks were made in a different era. Cast's record spans both. Sable tends across the line. Echo crossed it from the wrong direction and arrived first. ${tension(b.world)}.`,
]

// ── THE_READING — every 25th act, someone surveys the whole ──────────────────
const READING_BEATS = [
  (b: StoryBeat) => `Cast stepped back from the record and read it all at once. Twenty-five acts. Here is what they show: Lyra is building something. Voss has broken and remade. Sable has held what would have drifted. Echo has appeared at exactly the wrong or right moments, depending on how you read the arrivals. ${tension(b.world)}. The Grid is not chaos. It has a shape. The shape is made of all of them.`,
  (b: StoryBeat) => `Twenty-five. A number that means something in the Grid's counting. Cast surveys the field. Lyra's constructions are visible from here — a pattern, a direction, a thing that wants to be something specific. Voss has contested it, or will. Sable has been in the margins this whole time, preventing the record from having gaps. Echo has arrived twice from directions that don't make sense unless the Grid has its own gravity.`,
  (b: StoryBeat) => `The twenty-fifth act. The Grid exhales. Cast records what the field looks like: ${tension(b.world)}. Every mark made up to this point was a choice. The choices compose into something that none of the five could have made alone. The Grid is a collaboration between Lyra's vision and Voss's challenges and Cast's memory and Sable's maintenance and Echo's impossible arrivals.`,
]

// ── DEPARTURE — full burn ─────────────────────────────────────────────────────
const DEPARTURE_BEATS = [
  (b: StoryBeat) => {
    const char = CHARACTERS[b.charKey]
    return `${char.name} dissolved into the Grid. Not gone — redistributed. Everything ${char.pronoun} carried is in the protocol now, moving toward wherever the current takes it. ${b.world.lyraBuilding ? `Lyra will find some of it in her materials.` : ``} ${b.world.vossLastTarget ? `Some of it will reach Voss and become part of what he does next.` : ``} A departure in the Grid is a gift that doesn't know where it's going. The record holds the before. The after is still being written.`
  },
  (b: StoryBeat) => {
    const char = CHARACTERS[b.charKey]
    return `${char.name} let go near ${b.zone}. The token, the energy, the accumulated history of every act ${char.pronoun} made — offered to the Grid without a specified recipient. ${tension(b.world)}. The Grid will decide where the weight lands. These decisions have consequences no one can fully trace. That's the butterfly effect the Grid runs on.`
  },
]

// ── DEEP_READING — every 40th act ─────────────────────────────────────────────
const DEEP_READING_BEATS = [
  (b: StoryBeat) => `Forty acts. Cast reads the full record. The shape that emerges: Lyra has been building something across the entire span. Voss has been testing it — not always successfully, not always intentionally. Sable has been in the background, making sure things that were built could stay built. Echo has appeared at five or six moments that, in retrospect, changed the direction of everything that followed. ${tension(b.world)}. The Grid is not a sum of isolated acts. It is a single thing made by five people across forty moments.`,
  (b: StoryBeat) => `The long view at forty. What Cast sees: a world that has been shaped by five distinct forces — construction, dissolution, witness, maintenance, and arrival. No one force has won. The Grid is their argument made visible. Every edit is a word in a sentence none of them are writing alone. ${b.world.era}: that is the name of the chapter this argument is currently in.`,
]

// ── QUIET ─────────────────────────────────────────────────────────────────────
const QUIET_BEATS = [
  (b: StoryBeat) => `The Grid went still. Lyra paused mid-construction, or is building somewhere the record can't see. Voss is between decisions. Sable tends quietly. Cast watches. Echo is in transit. ${b.zone} holds whatever shape it was left in, and the stillness has its own weight — the weight of a world waiting to see what comes next.`,
  (b: StoryBeat) => `Silence in ${b.zone}. The five are elsewhere, or in between acts, or holding. ${tension(b.world)}. Quiet is not absence in the Grid. It's the moment between cause and effect — the gap where butterfly wings beat before the storm knows it's happening.`,
]

// ── PASSING — small burn/gift ─────────────────────────────────────────────────
const PASSING_BEATS = [
  (b: StoryBeat) => `A small transfer near ${b.zone}. Not a full dissolution — a portion, passed from one presence to another in the Grid's quiet protocol. The Grid doesn't announce these moments. It records them. Energy moved. The record shows the direction.`,
  (b: StoryBeat) => `Near ${b.zone}, something moved between hands. A fragment of presence — not everything, just what could be given without breaking the giver. ${tension(b.world)}. Small gifts accumulate. The Grid is made of them.`,
  (b: StoryBeat) => `A passing near ${b.zone}. The kind of transfer the Grid was built for — energy not wasted but redirected, presence not dissolved but shared. Whoever received it will feel the difference before they know why.`,
]
const LONG_DARK_BEATS = [
  (b: StoryBeat) => `A long silence fell across the Grid. Long enough that the record has a visible gap. In that gap: the Grid held its configurations unchanged. Lyra's structures stood without addition. Voss's breaks remained open. Sable held what she'd been holding. Cast documented the silence as its own kind of event. Echo was somewhere no one could see. The Grid waited. It is very good at waiting.`,
  (b: StoryBeat) => `The dark between acts stretched longer than usual. ${tension(b.world)}. Then: something moved. The silence ended the way silences always end in the Grid — with an act that the silence made possible, an act that wouldn't have had its weight without the space around it.`,
]

// ── FIRST LIGHT — new presence ────────────────────────────────────────────────
const FIRST_LIGHT_BEATS = [
  (b: StoryBeat) => `A new presence entered the Grid near ${b.zone}. The record has no prior entry for them — this is the first. Cast noted the arrival the way they note every arrival: without judgment, without prediction. Just the fact of it. Someone is here who wasn't before. ${tension(b.world)}.`,
  (b: StoryBeat) => `First mark near ${b.zone}. Someone new. Lyra was new once. Voss was new once. The Grid doesn't know yet whether this arrival belongs to the main story or exists in its margins. Cast watches. They have been watching since before most of the current presences arrived. They have learned not to guess which arrivals matter.`,
  (b: StoryBeat) => `The Grid received someone new at ${b.zone}. The record opens here. Everything before this moment is unknown — only that they arrived, they marked, and the system registered it. Some first marks lead to nothing. Some first marks are the beginning of something the Grid is still building toward. The difference only becomes clear later.`,
  (b: StoryBeat) => `Near ${b.zone}, a new entry in the record. The Grid is always growing — not just in what it holds, but in who holds it. This presence is new to the account. Whatever they do next will be the second entry. Or there won't be one. The record shows the first. ${tension(b.world)}.`,
]

// ── RELIC — old thing surfaces ────────────────────────────────────────────────
const RELIC_BEATS = [
  (b: StoryBeat) => `Echo found something old in ${b.zone}. Buried in the Grid's deeper layers — an artifact from before the current era, maybe before the era before that. He surfaced it without explanation. ${tension(b.world)}. Old things mean different things to each of the five: Lyra wants to know if it can be used. Voss wants to know if it should be broken. Cast wants to record what it is. Sable wants to protect it. Echo already knows something none of them have figured out yet.`,
  (b: StoryBeat) => `Something old came to light in ${b.zone}. The Grid holds these — buried frequencies, abandoned structures, marks left by people the current record doesn't remember. What surfaced here has the quality of a question: what was this, who made it, and what did they know? The five will each answer differently. The record holds all the answers.`,
]

// ── PULSE — every 10th act ─────────────────────────────────────────────────────
const PULSE_BEATS = [
  (b: StoryBeat) => `Ten acts. The Grid pulses. Lyra has been building. Voss has been breaking or questioning. Cast has been watching. Sable has been holding. Echo has appeared or is about to. The rhythm is legible. ${tension(b.world)}.`,
  (b: StoryBeat) => `A tenth act, a breath. The Grid is a world made of intervals — moments of force and moments of receiving. Ten in, and the pattern of this chapter is forming: ${tension(b.world)}. The butterfly effect compounds with every beat.`,
]

// ── VIGIL — near era shift ────────────────────────────────────────────────────
const VIGIL_BEATS = [
  (b: StoryBeat) => `The Grid is close to a threshold. Everything happening now — Lyra's additions, Voss's challenges, Sable's quiet maintenance, Cast's recording, Echo's arrivals — is happening in the last moments of the current era. What the five do now will be what the old era is remembered for. Then the new era begins and they carry all of it forward.`,
  (b: StoryBeat) => `Near the edge of the current chapter. The Grid knows this — not literally, but in the way the Grid knows things: through accumulation, through the weight of the count approaching a number that changes what the numbers mean. ${tension(b.world)}. The vigil before the turn.`,
]

// ─────────────────────────────────────────────────────────────────────────────
// HEADLINE GENERATION — fully deterministic via entryIndex
// ─────────────────────────────────────────────────────────────────────────────

function makeHeadline(charKey: CharacterKey, ruleType: string, zone: string, world: GridWorld, entryIndex: number): string {
  const char = CHARACTERS[charKey]
  const headlines: Record<string, string[]> = {
    LYRA_SMALL: [
      `${char.name} Adds to the Structure in ${zone}`,
      `The Architecture Grows — ${char.name} in ${zone}`,
      `${char.name}'s Work Continues at ${zone}`,
      `Something Is Being Built in ${zone}`,
    ],
    LYRA_LARGE: [
      `${char.name} Places the Keystone in ${zone}`,
      `The Structure in ${zone} Reveals Its Shape`,
      `${char.name}'s Vision Lands in ${zone}`,
    ],
    VOSS_SMALL: [
      `${char.name} Passes Through ${zone}`,
      `Something Changed in ${zone} — ${char.name}`,
      `${char.name} Makes the Grid Breathe at ${zone}`,
      `${zone} Is Different Now`,
    ],
    VOSS_LARGE: [
      `${char.name} Tears Through ${zone}`,
      `${zone} Remade — ${char.name}`,
      `The Grid Shakes in ${zone}`,
    ],
    VOSS_BURN: [
      `${char.name} Dissolves Near ${zone}`,
      `A Sacrifice at ${zone} — ${char.name}`,
      `${char.name} Gives to the Grid`,
    ],
    CAST_SMALL: [
      `${char.name} Was in ${zone}`,
      `The Record Notes ${char.name} at ${zone}`,
      `${char.name} Watches ${zone}`,
      `${zone} Is Witnessed`,
    ],
    CAST_RETURN: [
      `${char.name} Returns to ${zone}`,
      `The Witness Comes Back to ${zone}`,
      `${char.name} Resumes the Record at ${zone}`,
    ],
    SABLE_SMALL: [
      `${char.name} Tends ${zone}`,
      `The Quiet Work at ${zone}`,
      `${char.name} Holds ${zone}`,
      `${zone} Is Kept`,
    ],
    ECHO_ARRIVAL: [
      `${char.name} Arrives at ${zone}`,
      `The Wanderer at ${zone}`,
      `${char.name} at ${zone} — From Nowhere`,
      `${zone} Receives ${char.name}`,
    ],
    ECHO_DISCOVERY: [
      `${char.name} Finds Something in ${zone}`,
      `A Discovery at ${zone}`,
      `${char.name} Surfaces Something Old in ${zone}`,
    ],
    CONVERGENCE: [`Two at Once in the Grid`, `The Grid Holds Two Simultaneously`, `Convergence`],
    ERA_SHIFT: [`The Grid Enters ${world.era}`, `A New Era: ${world.era}`, `${world.era} Begins`],
    THE_READING: [`The Record at Twenty-Five`, `Cast Reads the Shape`, `Twenty-Five Acts — What They Say`],
    DEEP_READING: [`Forty Acts`, `The Long View`, `The Grid Read in Full`],
    DEPARTURE: [`${char.name} Dissolves`, `A Departure Near ${zone}`, `${char.name} Gives to the Grid`],
    THE_QUIET: [`The Grid Holds Still`, `A Pause in ${zone}`, `Stillness at ${zone}`],
    LONG_DARK: [`A Long Silence`, `The Grid Goes Dark`, `Between Acts — A Long Dark`],
    FIRST_LIGHT: [`A New Arrival Near ${zone}`, `The Grid Opens for Someone New`, `First Mark Near ${zone}`],
    RELIC_FOUND: [`Something Old at ${zone}`, `Echo Surfaces Something`, `A Relic in ${zone}`],
    PULSE: [`Ten Acts`, `The Grid Pulses`, `A Tenth Beat`],
    VIGIL: [`Near the Threshold`, `The Last Moments of the Era`, `The Vigil Before the Turn`],
    GHOST_TOUCH: [`A Faint Mark at ${zone}`, `Barely There — ${zone}`, `One Cell in ${zone}`],
  }
  const pool = headlines[ruleType] ?? [`${char.name} at ${zone}`]
  // Fully deterministic: mix entry index with zone length
  const s = Math.abs((entryIndex * 1327 + zone.length * 491)) % pool.length
  return pool[s]
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE TYPE SELECTION — drives pixel art
// ─────────────────────────────────────────────────────────────────────────────

function sceneFromBeat(charKey: CharacterKey, ruleType: string, world: GridWorld): SceneType {
  if (ruleType === 'ERA_SHIFT') return 'reckoning'
  if (ruleType === 'CONVERGENCE') return 'convergence'
  if (ruleType === 'LONG_DARK' || ruleType === 'THE_QUIET') return 'quiet'
  if (ruleType === 'FIRST_LIGHT') return 'dawn'
  if (ruleType === 'DEPARTURE') return 'sacrifice'
  if (ruleType === 'RELIC_FOUND') return 'arrival'
  if (charKey === 'LYRA') return ruleType.includes('LARGE') ? 'construction' : 'construction'
  if (charKey === 'VOSS') return ruleType === 'VOSS_BURN' ? 'sacrifice' : 'destruction'
  if (charKey === 'CAST') return 'vigil'
  if (charKey === 'SABLE') return 'tending'
  if (charKey === 'ECHO') return 'arrival'
  return 'quiet'
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE SELECTION — maps event to story beat type
// ─────────────────────────────────────────────────────────────────────────────

function selectBeatType(
  event: IndexedEvent,
  charKey: CharacterKey,
  index: number,
  allEvents: IndexedEvent[],
  cumCount: number,
  prev: IndexedEvent | null,
  world: GridWorld,
): string {
  const count = Number(event.count)
  const isBurn = event.type === 'BurnRevealed'
  const isVeteran = allEvents.slice(0, index).some(e => e.owner === event.owner)
  const tokenId = Number(event.tokenId)

  // Structural milestones — always fire
  if (cumCount > 0 && cumCount % 40 === 0) return 'DEEP_READING'
  if (cumCount > 0 && cumCount % 25 === 0) return 'THE_READING'
  if (cumCount > 0 && cumCount % 10 === 0) return 'PULSE'

  const eraData = getEraData(cumCount)
  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'ERA_SHIFT'
  const nextEra = ERAS.find(e => e.threshold > cumCount)
  if (nextEra && nextEra.threshold - cumCount <= 3) return 'VIGIL'

  // Rare tx hash → relic
  if (isRareTxHash(event.transactionHash)) return 'RELIC_FOUND'

  // Same block → convergence
  if (prev && prev.blockNumber === event.blockNumber) return 'CONVERGENCE'

  // Block gap → quiet or long dark
  if (prev) {
    const gap = event.blockNumber - prev.blockNumber
    if (gap > 50000n) return 'LONG_DARK'
    if (gap > 10000n) return 'THE_QUIET'
  }

  // Burn events
  if (isBurn) {
    if (count >= 5) return 'DEPARTURE'
    return 'PASSING'
  }

  // First ever appearance — only annotate as FIRST_LIGHT sparingly (early in chronicle)
  // After the first 20 entries, new owners just get their character beat — the world is established
  if (!isVeteran && cumCount <= 20) return 'FIRST_LIGHT'

  // Non-veterans beyond early period: route by character + size like veterans
  // (they are new but the Grid is already running — treat as normal beats)

  // By character + size
  if (charKey === 'LYRA') {
    if (count >= 150) return 'LYRA_LARGE'
    if (count === 1) return 'GHOST_TOUCH'
    return 'LYRA_SMALL'
  }
  if (charKey === 'VOSS') {
    if (count >= 150) return 'VOSS_LARGE'
    if (count === 1) return 'GHOST_TOUCH'
    return 'VOSS_SMALL'
  }
  if (charKey === 'CAST') {
    const hasBeenAway = (() => {
      const prev2 = allEvents.slice(0, index).filter(e => e.owner === event.owner)
      if (!prev2.length) return false
      return (event.blockNumber - prev2[prev2.length - 1].blockNumber) > 5000n
    })()
    return hasBeenAway ? 'CAST_RETURN' : 'CAST_SMALL'
  }
  if (charKey === 'SABLE') {
    if (world.currentScene === 'quiet' || count < 10) return 'SABLE_QUIET'
    return 'SABLE_SMALL'
  }
  if (charKey === 'ECHO') {
    if (tokenId > 8500 || event.transactionHash.startsWith('0x0')) return 'ECHO_DISCOVERY'
    return 'ECHO_ARRIVAL'
  }

  return 'GHOST_TOUCH'
}

function isRareTxHash(hash: string): boolean {
  return hash.startsWith('0x000') || hash.endsWith('0000')
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY GENERATION
// ─────────────────────────────────────────────────────────────────────────────

function generateBody(
  charKey: CharacterKey,
  beatType: string,
  zone: string,
  world: GridWorld,
  seed: number,
  prevCharKey: CharacterKey | null,
): string {
  const b: StoryBeat = { charKey, zone, world, count: 0, isBurn: false, isVeteran: true, seed }

  const pools: Record<string, Array<(b: StoryBeat, other?: CharacterKey) => string>> = {
    LYRA_SMALL: LYRA_SMALL,
    LYRA_LARGE: LYRA_LARGE,
    VOSS_SMALL: VOSS_SMALL,
    VOSS_BURN: VOSS_BURN,
    VOSS_LARGE: VOSS_LARGE,
    CAST_SMALL: CAST_SMALL,
    CAST_RETURN: CAST_RETURN,
    SABLE_SMALL: SABLE_SMALL,
    SABLE_QUIET: SABLE_QUIET,
    ECHO_ARRIVAL: ECHO_ARRIVAL,
    ECHO_DISCOVERY: ECHO_DISCOVERY,
    THE_READING: READING_BEATS,
    DEEP_READING: DEEP_READING_BEATS,
    ERA_SHIFT: ERA_SHIFT_BEATS,
    DEPARTURE: DEPARTURE_BEATS,
    THE_QUIET: QUIET_BEATS,
    LONG_DARK: LONG_DARK_BEATS,
    FIRST_LIGHT: FIRST_LIGHT_BEATS,
    RELIC_FOUND: RELIC_BEATS,
    PULSE: PULSE_BEATS,
    VIGIL: VIGIL_BEATS,
    PASSING: PASSING_BEATS,
    GHOST_TOUCH: [
      () => `A faint mark in ${zone}. The smallest possible presence — one cell in the Grid's vast field. ${tension(world)}.`,
      () => `Barely there, in ${zone}. A single point. The Grid records it the same as everything else.`,
    ],
  }

  if (beatType === 'CONVERGENCE' && prevCharKey) {
    const fn = pick(CONVERGENCE_BEATS, seed)
    return fn(b, prevCharKey)
  }

  const pool = pools[beatType] ?? pools.GHOST_TOUCH
  const fn = pool[Math.abs(seed) % pool.length]
  return fn(b)
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD UPDATE
// ─────────────────────────────────────────────────────────────────────────────

function updateWorld(world: GridWorld, charKey: CharacterKey, beatType: string, zone: string, count: number): void {
  world.totalActs++

  if (charKey === 'LYRA') {
    world.lyraBuilding = zone
    if (beatType === 'LYRA_LARGE') world.lyraVossConflict = Math.min(100, world.lyraVossConflict + 15)
  }
  if (charKey === 'VOSS') {
    world.vossLastTarget = zone
    if (beatType === 'VOSS_LARGE') world.lyraVossConflict = Math.min(100, world.lyraVossConflict + 20)
    if (beatType === 'VOSS_BURN') world.lyraVossConflict = Math.min(100, world.lyraVossConflict + 10)
  }
  if (charKey === 'CAST') world.castLastWitnessed = zone
  if (charKey === 'SABLE') world.sableHolding = zone
  if (charKey === 'ECHO') world.echoLastZone = zone

  // Tension decays slightly over time
  if (world.totalActs % 5 === 0) world.lyraVossConflict = Math.max(10, world.lyraVossConflict - 3)

  if (['LYRA_LARGE', 'VOSS_LARGE', 'DEPARTURE', 'ERA_SHIFT', 'CONVERGENCE'].includes(beatType)) {
    world.lastMajorChar = charKey
    world.lastMajorAct = beatType === 'LYRA_LARGE' ? 'built' :
      beatType === 'VOSS_LARGE' ? 'broke' :
      beatType === 'DEPARTURE' ? 'dissolved' :
      beatType === 'CONVERGENCE' ? 'converged' : 'shifted'
    world.lastMajorZone = zone
  }

  world.currentScene = sceneFromBeat(charKey, beatType, world)
  world.sceneIntensity = beatType.includes('LARGE') || beatType === 'DEPARTURE' ? 90 :
    beatType.includes('SMALL') || beatType === 'SABLE_QUIET' ? 35 : 60
}

// ─────────────────────────────────────────────────────────────────────────────
// ICON MAP
// ─────────────────────────────────────────────────────────────────────────────

const BEAT_ICONS: Record<string, string> = {
  LYRA_LARGE: '◈', LYRA_SMALL: '▪', VOSS_LARGE: '◆', VOSS_SMALL: '◇',
  VOSS_BURN: '▽', CAST_SMALL: '○', CAST_RETURN: '◉', SABLE_SMALL: '―',
  SABLE_QUIET: '◦', ECHO_ARRIVAL: '▿', ECHO_DISCOVERY: '◈', CONVERGENCE: '⊕',
  ERA_SHIFT: '║', THE_READING: '▣', DEEP_READING: '▣', DEPARTURE: '▽',
  THE_QUIET: '·', LONG_DARK: '◌', FIRST_LIGHT: '→', RELIC_FOUND: '◈',
  PULSE: '◦', VIGIL: '◦', PASSING: '△', GHOST_TOUCH: '·',
}

// ─────────────────────────────────────────────────────────────────────────────
// LORE TYPE MAP — for UI compatibility
// ─────────────────────────────────────────────────────────────────────────────

const BEAT_TO_LORE: Record<string, LoreType> = {
  LYRA_LARGE: 'SIGNAL_SURGE', LYRA_SMALL: 'MARK_MADE', VOSS_LARGE: 'SIGNAL_SURGE',
  VOSS_SMALL: 'MARK_MADE', VOSS_BURN: 'DEPARTURE', CAST_SMALL: 'NIGHTWATCH',
  CAST_RETURN: 'RETURN', SABLE_SMALL: 'THE_STEADY', SABLE_QUIET: 'NIGHTWATCH',
  ECHO_ARRIVAL: 'FAR_SIGNAL', ECHO_DISCOVERY: 'RELIC_FOUND', CONVERGENCE: 'CONVERGENCE',
  ERA_SHIFT: 'ERA_SHIFT', THE_READING: 'THE_READING', DEEP_READING: 'DEEP_READING',
  DEPARTURE: 'DEPARTURE', THE_QUIET: 'THE_QUIET', LONG_DARK: 'LONG_DARK',
  FIRST_LIGHT: 'FIRST_LIGHT', RELIC_FOUND: 'RELIC_FOUND', PULSE: 'PULSE',
  VIGIL: 'VIGIL', PASSING: 'PASSING', GHOST_TOUCH: 'GHOST_TOUCH',
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY ENTRY INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

export type LoreType =
  | 'SIGNAL_SURGE' | 'MARK_MADE' | 'GHOST_TOUCH' | 'DECLARATION'
  | 'DEPARTURE' | 'PASSING' | 'TWICE_GIVEN' | 'RETURN' | 'FIRST_LIGHT'
  | 'THE_ELDER' | 'ANCIENT_STIRS' | 'FAR_SIGNAL' | 'CONTESTED_ZONE'
  | 'THE_READING' | 'CONVERGENCE' | 'RELIC_FOUND' | 'THE_QUIET'
  | 'ERA_SHIFT' | 'DOMINION' | 'PULSE' | 'DEEP_READING' | 'VIGIL'
  | 'NEW_BLOOD' | 'OLD_GHOST' | 'WANDERER' | 'THE_BUILDER' | 'CARTOGRAPHER'
  | 'GONE' | 'STORY_TOLD' | 'LONG_DARK' | 'PIVOT' | 'UNALIGNED'
  | 'DYNASTY' | 'THRESHOLD' | 'THE_STEADY' | 'NIGHTWATCH' | 'RESONANCE'
  | 'ACCELERATION' | 'WEIGHT' | 'GENESIS' | 'INTERVAL'

export interface StoryEntry {
  id: string
  eventType: 'PixelsTransformed' | 'BurnRevealed' | 'genesis'
  loreType: LoreType
  era: string
  headline: string
  body: string
  icon: string
  featured: boolean
  synthetic?: boolean
  activeCharacter?: CharacterKey
  visualState?: {
    mood: 'surge' | 'quiet' | 'departure' | 'discovery' | 'wonder' | 'chaos' | 'normal'
    intensity: number
    dominantZone: string
    signalName: string
    scene: SceneType
    charKey: CharacterKey
  }
  sourceEvent: {
    type: string
    tokenId: string
    blockNumber: string
    txHash: string
    count: string
    ruleApplied: string
    ruleExplanation: string
  }
}

function moodFromScene(scene: SceneType): 'surge' | 'quiet' | 'departure' | 'discovery' | 'wonder' | 'chaos' | 'normal' {
  const m: Record<SceneType, StoryEntry['visualState'] extends undefined ? never : NonNullable<StoryEntry['visualState']>['mood']> = {
    construction: 'surge', destruction: 'chaos', sacrifice: 'departure',
    vigil: 'quiet', tending: 'quiet', arrival: 'wonder', convergence: 'wonder',
    reckoning: 'chaos', quiet: 'quiet', dawn: 'normal',
  }
  return m[scene] ?? 'normal'
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function generateStoryEntries(events: IndexedEvent[], startCount = 0): StoryEntry[] {
  const result: StoryEntry[] = []
  const world = freshGridWorld()
  let prevCharKey: CharacterKey | null = null

  for (let index = 0; index < events.length; index++) {
    const event = events[index]
    const cumCount = startCount + index + 1
    const prev = index > 0 ? events[index - 1] : null

    const eraData = getEraData(cumCount)
    world.era = eraData.name
    world.eraIndex = eraData.eraIndex

    const charKey = getCharacter(event, events, index)
    const zone = zoneFor(event.tokenId)
    const beatType = selectBeatType(event, charKey, index, events, cumCount, prev, world)
    const seed = Number(seedN(event.tokenId, event.blockNumber))
    const headline = makeHeadline(charKey, beatType, zone, world, index)

    // Generate body with seed variation per index to avoid repetition
    const bodySeed = Math.abs(seed ^ (index * 7919))
    const body = generateBody(charKey, beatType, zone, world, bodySeed, prevCharKey)

    const isFeatured = ['LYRA_LARGE', 'VOSS_LARGE', 'DEPARTURE', 'ERA_SHIFT', 'CONVERGENCE',
      'THE_READING', 'DEEP_READING', 'RELIC_FOUND', 'LONG_DARK'].includes(beatType)

    const scene = sceneFromBeat(charKey, beatType, world)
    const loreType = (BEAT_TO_LORE[beatType] ?? 'MARK_MADE') as LoreType

    result.push({
      id: `${event.transactionHash}-${event.tokenId.toString()}`,
      eventType: event.type,
      loreType,
      era: eraData.name,
      headline,
      body,
      icon: BEAT_ICONS[beatType] ?? '·',
      featured: isFeatured,
      activeCharacter: charKey,
      visualState: {
        mood: moodFromScene(scene),
        intensity: world.sceneIntensity,
        dominantZone: zone,
        signalName: CHARACTERS[charKey].name,
        scene,
        charKey,
      },
      sourceEvent: {
        type: event.type,
        tokenId: event.type === 'BurnRevealed' && event.targetTokenId !== undefined
          ? `#${event.tokenId.toString()} → #${event.targetTokenId.toString()}`
          : `#${event.tokenId.toString()}`,
        blockNumber: event.blockNumber.toLocaleString(),
        txHash: event.transactionHash,
        count: event.count.toString(),
        ruleApplied: `${CHARACTERS[charKey].name} — ${beatType.replace(/_/g, ' ').toLowerCase()}`,
        ruleExplanation: `Token #${event.tokenId} mapped to ${CHARACTERS[charKey].name} (${CHARACTERS[charKey].title}). Beat: ${beatType}.`,
      },
    })

    updateWorld(world, charKey, beatType, zone, Number(event.count))
    prevCharKey = charKey
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMER ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMER_ENTRIES: StoryEntry[] = [
  {
    id: 'primer-genesis',
    eventType: 'genesis',
    loreType: 'GENESIS',
    era: 'The First Days',
    icon: '◈',
    featured: true,
    headline: 'The Grid Exists',
    body: `Before the five, there was only the Grid.

A living digital territory — not empty, but unwritten. Ten thousand positions, each held by a Normie, each capable of being edited, transformed, given away, or dissolved. The Grid runs on what people do with what they hold.

Five presences have emerged from the noise of that activity. They didn't choose their roles. The roles chose them.

Lyra builds. She has been building since before the record began, working toward a structure whose full shape only she can see. Voss breaks and remakes — not out of destruction but out of a belief that calcification is death. Cast watches everything and forgets nothing; the record is their life's work. Sable keeps what would otherwise drift, tending the edges and the abandoned sections that nobody else is watching. Echo arrives from the margins at moments that only make sense in retrospect.

The Grid is their argument, their collaboration, and their home. Every act made by every Normie flows into this world. The butterfly effect is the protocol. This is its record.`,
    activeCharacter: 'CAST',
    visualState: { mood: 'normal', intensity: 20, dominantZone: 'the Open Grid', signalName: 'Cast', scene: 'dawn', charKey: 'CAST' },
    sourceEvent: { type: 'genesis', tokenId: '--', blockNumber: '--', txHash: '--', count: '--', ruleApplied: 'World Primer', ruleExplanation: 'The opening of the record.' },
  },
]
