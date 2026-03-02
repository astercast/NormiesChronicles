import type { IndexedEvent } from './eventIndexer'

// ─────────────────────────────────────────────────────────────────────────────
// THE FIVE — fixed characters whose actions build Normia's history
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTERS = {
  LYRA: {
    name: 'Lyra',
    title: 'the Architect',
    pronoun: 'she',
    possessive: 'her',
    goal: 'to build something in Normia that outlasts every attempt to erase it',
    nature: 'methodical, visionary, haunted by incompleteness',
    activatedBy: 'construction, persistence, accumulation',
    shortDesc: 'She has been building the same structure across Normia for as long as the record goes back — sector by sector, piece by piece. Nobody knows the full shape of it yet except her.',
  },
  VOSS: {
    name: 'Finn',
    title: 'the Breaker',
    pronoun: 'he',
    possessive: 'his',
    goal: 'to unmake what calcifies — Normia must stay alive, even if that means tearing it open',
    nature: 'fierce, principled, misread as destructive',
    activatedBy: 'large reshapings, burns, collisions',
    shortDesc: 'Finn removes structures that have stopped earning their place in the system. He is not a vandal — he is principled. He just has a higher tolerance for the mess that comes with change.',
  },
  CAST: {
    name: 'The Cast',
    title: 'the Witness',
    pronoun: 'it',
    possessive: 'its',
    goal: 'to see everything and forget nothing — Normia deserves a true record',
    nature: 'omnipresent, ancient, neither cruel nor kind — simply there',
    activatedBy: 'returns, long-watching, veteran presence',
    shortDesc: 'It has been keeping the record since before most current players arrived. It does not act. It watches, logs, and remembers everything — and its record is the only complete account of Normia that exists.',
  },
  SABLE: {
    name: 'Cielo',
    title: 'the Keeper',
    pronoun: 'she',
    possessive: 'her',
    goal: 'to tend what others abandon — nothing built in Normia should die unmourned',
    nature: 'quiet, relentless, fiercely loyal to what remains',
    activatedBy: 'quiet work, maintenance, holding',
    shortDesc: 'After Lyra builds and Finn breaks, Cielo maintains the edges — repairing what is fraying, holding zones that have been abandoned, keeping structures alive past their moment of attention.',
  },
  ECHO: {
    name: 'Echo',
    title: 'the Wanderer',
    pronoun: 'he',
    possessive: 'his',
    goal: 'to find what Normia is hiding — every edge conceals something the center cannot see',
    nature: 'unpredictable, magnetic, arrives exactly when it matters',
    activatedBy: 'edge events, unexpected patterns, far signals',
    shortDesc: 'He works the outer zones — the sectors the main factions do not bother tracking. What he finds there keeps turning out to matter more than anyone expected.',
  },
} as const

export type CharacterKey = keyof typeof CHARACTERS

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER ASSIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

function getCharacter(event: IndexedEvent, allEvents: IndexedEvent[], index: number): CharacterKey {
  const tokenId = Number(event.tokenId)
  const count = Number(event.count)
  const isBurn = event.type === 'BurnRevealed'
  const isMassive = count >= 200

  if (isBurn || isMassive) return 'VOSS'
  const isEdge = tokenId < 500 || tokenId > 8500
  if (isEdge && (index % 3 === 0)) return 'ECHO'
  const h = ((tokenId * 2654435761 + index * 40503) >>> 0) % 5
  const keys: CharacterKey[] = ['LYRA', 'VOSS', 'CAST', 'SABLE', 'ECHO']
  return keys[h]
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD STATE — the chronicle's living memory
// Every prose template reads from this. Update it after every entry.
// ─────────────────────────────────────────────────────────────────────────────

interface GridWorld {
  lyraLastBuilt: string | null
  lyraBuiltCount: number
  lyraSignature: string | null

  finnLastBroke: string | null
  finnLastTarget: string | null
  finnBreakCount: number
  finnContestedLyra: boolean

  castLastWitnessed: string | null

  cieloLastTended: string | null
  cieloHolding: string | null
  cieloRepairCount: number

  echoLastFound: string | null
  echoLastZone: string | null
  echoFindCount: number

  lyraFinnConflict: number
  finnContested: boolean
  lyraReclaimed: boolean

  totalActs: number
  majorMoments: string[]
  lastMajorChar: CharacterKey | null
  lastMajorAct: string | null
  lastMajorZone: string | null

  zoneOwner: Record<string, CharacterKey>
  zonePrevOwner: Record<string, CharacterKey>

  era: string
  eraIndex: number
  eraActCount: number

  currentScene: SceneType
  sceneIntensity: number
}

export type SceneType =
  | 'construction' | 'destruction' | 'sacrifice' | 'vigil'
  | 'tending' | 'arrival' | 'convergence' | 'reckoning'
  | 'quiet' | 'dawn'

function freshGridWorld(): GridWorld {
  return {
    lyraLastBuilt: null, lyraBuiltCount: 0, lyraSignature: null,
    finnLastBroke: null, finnLastTarget: null, finnBreakCount: 0, finnContestedLyra: false,
    castLastWitnessed: null,
    cieloLastTended: null, cieloHolding: null, cieloRepairCount: 0,
    echoLastFound: null, echoLastZone: null, echoFindCount: 0,
    lyraFinnConflict: 5, finnContested: false, lyraReclaimed: false,
    totalActs: 0, majorMoments: [], lastMajorChar: null, lastMajorAct: null, lastMajorZone: null,
    zoneOwner: {}, zonePrevOwner: {},
    era: 'The First Days', eraIndex: 0, eraActCount: 0,
    currentScene: 'dawn', sceneIntensity: 20,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONES
// ─────────────────────────────────────────────────────────────────────────────

export const ZONES = [
  'the Null District',   'the White Corridors',  'the Hollow',
  'the Far Sectors',     'the Dark Margin',       'the Cradle',
  'the Dust Protocol',   'the Outer Ring',        'the Deep Well',
  'the Fault Line',      'the High Pass',         'the Old Crossing',
  'the Narrow Gate',     'the Salt Plane',        'the Grey Basin',
  'the High Ground',     'the Burn Fields',       'the Still Water',
  'the Last Ridge',      'the Open Grid',
]

// What each zone actually is — used inline in prose for worldbuilding texture
const ZONE_DETAIL: Record<string, string> = {
  'the Null District':   'a stretch of unclaimed sectors where old builds sit between ownership cycles',
  'the White Corridors': 'the zone where the data scribes maintain Normia\'s long-running indexes',
  'the Hollow':          'a low-throughput sector where activity tends to pool and stall',
  'the Far Sectors':     'the outermost fringe, barely tracked by the central system',
  'the Dark Margin':     'unmapped territory at Normia\'s edge — no faction holds a claim here',
  'the Cradle':          'where new presences typically register their first marks in the system',
  'the Dust Protocol':   'a decommissioned zone running on old rules nobody ever updated',
  'the Outer Ring':      'the buffer between central Normia and the marginal zones',
  'the Deep Well':       'a high-throughput sector where heavy data loads run through old infrastructure',
  'the Fault Line':      'where two zone boundaries overlap — the ownership dispute has been unresolved for three eras',
  'the High Pass':       'the routing sector that most cross-zone traffic moves through',
  'the Old Crossing':    'the oldest active junction in Normia — still in use because nothing better ever replaced it',
  'the Narrow Gate':     'a chokepoint sector — whoever holds it sees most of what moves between zones',
  'the Salt Plane':      'flat, exposed, and harder to hold than it looks — no natural defensive position',
  'the Grey Basin':      'a mid-sector zone with no dominant owner across multiple eras',
  'the High Ground':     'the elevated control zone — better visibility into adjacent sectors from here',
  'the Burn Fields':     'a sector marked by several large departures in earlier eras — still carrying those signatures',
  'the Still Water':     'a low-churn zone where new activity stands out against the background',
  'the Last Ridge':      'the outermost edge zone — barely populated, but Echo keeps returning here',
  'the Open Grid':       'the central sector — any major act here is visible across the system',
}

// ─────────────────────────────────────────────────────────────────────────────
// ERAS
// ─────────────────────────────────────────────────────────────────────────────

export const ERAS = [
  { threshold: 0,    name: 'The First Days',    eraIndex: 0 },
  { threshold: 100,  name: 'The Waking',        eraIndex: 1 },
  { threshold: 300,  name: 'The Gathering',     eraIndex: 2 },
  { threshold: 700,  name: 'The Age of Claim',  eraIndex: 3 },
  { threshold: 1500, name: 'The Long Work',     eraIndex: 4 },
  { threshold: 3000, name: 'What Holds',        eraIndex: 5 },
  { threshold: 5000, name: 'The Old Country',   eraIndex: 6 },
  { threshold: 8000, name: 'The Long Memory',   eraIndex: 7 },
]

function getEraData(count: number) {
  let era = ERAS[0]
  for (const e of ERAS) { if (count >= e.threshold) era = e }
  return era
}

function getEra(count: number): string { return getEraData(count).name }

// ─────────────────────────────────────────────────────────────────────────────
// SEEDING
// ─────────────────────────────────────────────────────────────────────────────

function seedN(tokenId: bigint, blockNumber: bigint, salt = 0): number {
  return Number((tokenId * 31n + blockNumber * 17n + BigInt(salt)) % 100000n)
}

function pick<T>(arr: T[], s: number): T { return arr[Math.abs(s) % arr.length] }

function zoneFor(tokenId: bigint): string {
  const h = Number((tokenId * 2654435761n) & 0xFFFFFFFFn)
  return ZONES[h % ZONES.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD TEXTURE — things happening in Normia that aren't the five
// ─────────────────────────────────────────────────────────────────────────────

const SECTOR_GROUPS = [
  'the data scribes in the White Corridors',
  'the route operators at the High Pass',
  'the archive keepers of the Null District',
  'the boundary monitors at the Fault Line',
  'the relay handlers running through the Outer Ring',
  'the sector operators in the Deep Well',
  'the faction reps watching from the High Ground',
  'the cartographers tracking the Far Sectors',
  'the traders working the Old Crossing route',
  'the index workers in the Grey Basin',
  'the edge scouts stationed at the Last Ridge',
  'the access handlers at the Narrow Gate',
]

const SYSTEM_NOTES = [
  'Traffic through the High Pass is up this cycle — three new cross-zone routes registered in the last block.',
  'The scribes in the White Corridors flagged an indexing anomaly two cycles back. Still unresolved.',
  'The Grey Basin ownership dispute has been live in the council records for eleven acts now.',
  'Three structures in the Outer Ring have sat unregistered since the last major break.',
  'Relay traffic at the Narrow Gate slowed to near-zero for six blocks, then resumed without explanation.',
  'Someone has been running cross-zone queries on the Null District. The scribes noticed.',
  'The Deep Well throughput data is under review after an unusually high-volume session.',
  'The Fault Line boundary dispute surfaced again — two factions claiming the same sector tag.',
]

function sectorGroup(seed: number): string { return SECTOR_GROUPS[Math.abs(seed) % SECTOR_GROUPS.length] }
function systemNote(seed: number): string { return SYSTEM_NOTES[Math.abs(seed) % SYSTEM_NOTES.length] }

// ─────────────────────────────────────────────────────────────────────────────
// CONFLICT STATUS — plain-language description of the Lyra/Finn dynamic
// ─────────────────────────────────────────────────────────────────────────────

function conflictState(world: GridWorld): string {
  const lv = world.lyraFinnConflict
  if (lv < 15) return 'Lyra and Finn have not yet crossed paths directly in the sector map'
  if (lv < 35) return 'their builds and breaks have started landing in overlapping zones'
  if (lv < 55) return 'they are operating in contested territory — every move one makes creates a condition the other has to respond to'
  if (lv < 75) return 'the overlap is now direct: she builds, he challenges it; he breaks, she rebuilds'
  return 'Normia\'s current shape is being decided by the back-and-forth between what Lyra builds and what Finn removes'
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY BEAT CONTEXT — passed to every prose template
// ─────────────────────────────────────────────────────────────────────────────

interface StoryBeat {
  charKey: CharacterKey
  zone: string
  zoneDetail: string
  world: GridWorld
  count: number
  isBurn: boolean
  isVeteran: boolean
  seed: number
}

// ─────────────────────────────────────────────────────────────────────────────
// PROSE POOLS
//
// DESIGN RULES:
//   1. Ground everything in specifics. Name prior zones. Name what happened there.
//   2. Every entry must reference at least one prior world state fact.
//   3. Show consequences. What does this act change for the others?
//   4. Keep the grid/cyberspace texture: sectors, protocols, data, routing, signals.
//   5. Short, declarative sentences. Present tense. No purple prose.
//   6. Each entry sets up something for the next — cause and effect, not description.
// ─────────────────────────────────────────────────────────────────────────────

// ── LYRA SMALL ────────────────────────────────────────────────────────────────

// ── LYRA SMALL ────────────────────────────────────────────────────────────────
const LYRA_SMALL = [
  (b: StoryBeat) => {
    const prior = b.world.finnLastBroke
      ? `Finn broke something open in ${b.world.finnLastBroke} not long ago. Lyra registered it, adjusted her line of approach, and kept going. That is what she does — she bends around resistance without stopping.`
      : b.world.lyraBuiltCount > 2
        ? `She has now placed marks in ${b.world.lyraBuiltCount} separate sectors. To anyone watching the map with care, the shape she is drawing is starting to come clear.`
        : `${sectorGroup(b.seed)} have noticed the new registration. What she places in ${b.zone} will touch their routing paths.`
    return `Lyra laid another piece into ${b.zone} — ${b.zoneDetail}. ${prior} This is not a standalone move. Each placement she makes is load-bearing for something further along. Alone it looks minor. In sequence it is necessary.`
  },
  (b: StoryBeat) => {
    const thread = b.world.lyraFinnConflict > 40
      ? `Finn has been working the same territory. This placement answers the space his last break left behind — she found the gap and filled it.`
      : `${systemNote(b.seed)}`
    return `She moved into ${b.zone} and added to the registered structure there. Lyra works in increments: one placement, then another, each one opening the next. ${thread} The Cast's log now shows her active across ${Math.max(1, b.world.lyraBuiltCount)} sectors of the map.`
  },
  (b: StoryBeat) => {
    const cieloNote = b.world.cieloLastTended
      ? `Cielo has been keeping the edges stable in ${b.world.cieloLastTended} — the maintenance work that lets Lyra extend into new ground without losing what she already placed.`
      : `The surrounding sectors have no one tending them yet. That will matter eventually.`
    return `${b.zone}: another mark from Lyra. The zone is ${b.zoneDetail}. ${cieloNote} Every piece she registers here draws the larger structure a little closer to visible.`
  },
  (b: StoryBeat) => {
    const echoNote = b.world.echoLastFound
      ? `Echo turned something up in ${b.world.echoLastFound} recently. His find and Lyra's placement sit in adjacent sectors — whether the connection is deliberate or coincidental, neither of them has said.`
      : `The outer zones are still quiet. Lyra is working the mid-sectors for now, building inward from the edges she has already touched.`
    return `Lyra placed another layer in ${b.zone}. ${b.zoneDetail}. ${echoNote} What she is assembling here will only read as a whole once she has placed a few more pieces. Right now it looks like groundwork. It is.`
  },
]

// ── LYRA LARGE ────────────────────────────────────────────────────────────────
const LYRA_LARGE = [
  (b: StoryBeat) => {
    const conflict = b.world.finnLastBroke
      ? `Finn had cleared something in ${b.world.finnLastBroke} before this. What Lyra just placed in ${b.zone} is larger than what he removed — she built around the opening his break created and came out bigger on the other side.`
      : `No one has challenged her work this cycle. This placement is entirely on her terms.`
    return `Lyra put her largest build of the current era into ${b.zone} — ${b.zoneDetail}. ${conflict} This is where the smaller placements were always heading. The shape is visible now — not just a series of separate additions, but a structure that reads as one thing. The Cast flagged it as significant. It earned that.`
  },
  (b: StoryBeat) => {
    return `A full-sector claim from Lyra in ${b.zone}. The volume she committed here crosses from incremental into structural — this is no longer just another layer, it is a statement of presence. ${conflictState(b.world)}. ${sectorGroup(b.seed)} logged the activity spike. Finn will see it in the record the next time he sweeps the sector map.`
  },
  (b: StoryBeat) => {
    const recap = [
      b.world.finnLastBroke ? `Finn's break in ${b.world.finnLastBroke}` : null,
      b.world.echoLastFound ? `Echo's find in ${b.world.echoLastFound}` : null,
      b.world.cieloLastTended ? `Cielo's maintenance work in ${b.world.cieloLastTended}` : null,
    ].filter(Boolean).join(', ')
    return `Lyra's major build in ${b.zone} is the convergence of work she has been staging across ${b.world.lyraBuiltCount} sectors. ${recap ? `It follows ${recap}.` : ''} Everything she placed before this was weight-bearing for what just went up. The record marks this as the moment her architecture stopped being invisible.`
  },
]

// ── FINN SMALL ────────────────────────────────────────────────────────────────
const VOSS_SMALL = [
  (b: StoryBeat) => {
    const lyraNote = b.world.lyraLastBuilt
      ? `Lyra has a build sitting in ${b.world.lyraLastBuilt}. Finn knows it is there. He has not moved on it yet — he is reading the territory first.`
      : `There is no active Lyra build in the area. Finn is working his own logic, not responding to anyone else's.`
    return `Finn cleared part of ${b.zone} — ${b.zoneDetail}. What he removed had been sitting unchallenged long enough that people had started treating it as permanent. That is exactly what he looks for. ${lyraNote} The opening is in the record now.`
  },
  (b: StoryBeat) => {
    const cieloNote = b.world.cieloHolding
      ? `Cielo has been working ${b.world.cieloHolding}. She will likely come through ${b.zone} after this — Finn opens the space, she tends what the opening leaves behind.`
      : `The surrounding sectors have no active maintenance. Whatever Finn cleared will drift at the edges without someone coming through.`
    return `Finn moved through ${b.zone} and took apart a section of it. His method has not changed: find what is no longer earning its claim in the sector map, remove it, and leave the space open for something better. ${cieloNote} ${systemNote(b.seed)}`
  },
  (b: StoryBeat) => {
    return `${b.zone}: Finn ran a targeted break. The sector is ${b.zoneDetail}. He has been working a sequence of smaller corrections across this part of the map over ${b.world.finnBreakCount > 1 ? `${b.world.finnBreakCount} recorded acts` : 'the last few cycles'} — each one clearing routing that was blocked by structures past their time. ${conflictState(b.world)}.`
  },
  (b: StoryBeat) => {
    const prior = b.world.finnLastBroke
      ? `His last registered break was in ${b.world.finnLastBroke}. Same logic applies here: find what is overdue, take it apart.`
      : `First break in the record. He has been watching the map for a while before this.`
    return `A section of ${b.zone} was cleared by Finn. ${prior} ${sectorGroup(b.seed)} filed a query with the sector council. Finn was already somewhere else by the time it came through.`
  },
]

// ── FINN LARGE ────────────────────────────────────────────────────────────────
const VOSS_LARGE = [
  (b: StoryBeat) => {
    const lyraConflict = b.world.lyraLastBuilt
      ? `Lyra's build in ${b.world.lyraLastBuilt} sits in the routing path adjacent to this zone. Finn did not target it directly — but she will have to account for what he just did here.`
      : `There are no active Lyra builds in the immediate area. Finn is operating in open ground, on his own terms.`
    return `Finn ran a full restructure of ${b.zone} — ${b.zoneDetail}. Not a targeted removal. Zone-wide. ${lyraConflict} This is the largest single break in the current era's record. The activity registered across three adjacent sectors. The Cast logged it the moment it happened.`
  },
  (b: StoryBeat) => {
    return `The full force of what Finn does came down in ${b.zone}. He cleared everything — every registered structure, every claim that had sat unchallenged, everything that had built up without being tested. ${conflictState(b.world)}. Adjacent operators logged the shift. Cielo will come through here. Echo appeared at the zone margin shortly after, which no one had predicted. The Cast has both entries in the record.`
  },
  (b: StoryBeat) => {
    return `Finn restructured ${b.zone} at scale. He had been running smaller breaks in surrounding sectors over the past ${b.world.finnBreakCount} acts — each one pointing toward this zone, opening the routing paths that led here. ${b.world.lyraLastBuilt ? `Lyra's last build was in ${b.world.lyraLastBuilt}. Some of what she placed connects through this zone's routing. After today, that connection runs through open space.` : `The zone is clear now. What fills it next sets the terms for everything that follows.`}`
  },
]

// ── FINN BURN ─────────────────────────────────────────────────────────────────
const VOSS_BURN = [
  (b: StoryBeat) => {
    const lyraNote = b.world.lyraLastBuilt
      ? `Lyra has been building in ${b.world.lyraLastBuilt}. Released volume flows toward whatever is most active in the system — toward her work, most likely. What Finn let go becomes her material.`
      : `The system will route the released volume toward whatever is most active. Finn does not control where it lands. That is the point.`
    return `Finn dissolved part of his presence near ${b.zone} — not a break against someone else's work, but a deliberate reduction of his own. He put volume back into the system's distribution layer. ${lyraNote} The Cast logged the exact amount. It changes Finn's footprint in the sector map from this point forward.`
  },
  (b: StoryBeat) => {
    return `A partial dissolution from Finn near ${b.zone} — ${b.zoneDetail}. He has done this before, at moments when clearing his own weight is the move rather than clearing someone else's. What he released is in the system now. ${conflictState(b.world)}. The downstream effects will appear in the next few acts.`
  },
  (b: StoryBeat) => {
    return `Finn let go of a portion of what he held near ${b.zone}. The volume he released will find its way to Lyra's sectors, Cielo's maintained zones, Echo's outer searches — the system does not ask intent, it follows activity. ${b.world.lyraLastBuilt ? `Right now Lyra's build in ${b.world.lyraLastBuilt} is the most active registered structure. She receives the bulk of it.` : `With no dominant zone active, it distributes across the map.`}`
  },
]

// ── THE CAST SMALL ────────────────────────────────────────────────────────────
const CAST_SMALL = [
  (b: StoryBeat) => {
    const recentNote = b.world.lastMajorAct && b.world.lastMajorZone
      ? `The last major entry in the record was ${b.world.lastMajorAct} in ${b.world.lastMajorZone}. The Cast was present for that too.`
      : `The record is still in its early shape. The Cast is building the baseline.`
    return `The Cast moved through ${b.zone} and logged what it found there — ${b.zoneDetail}. ${recentNote} It does not intervene in what it records. Its purpose is completeness. Another entry in the sequence.`
  },
  (b: StoryBeat) => {
    const bothNote = b.world.lyraLastBuilt && b.world.finnLastBroke
      ? `Lyra built in ${b.world.lyraLastBuilt}. Finn broke something open in ${b.world.finnLastBroke}. The Cast recorded both without adding its own reading of what they mean.`
      : b.world.lyraLastBuilt
        ? `Lyra's build in ${b.world.lyraLastBuilt} is in the record. The Cast is working toward the moment when the full shape of her effort becomes visible across the sequence.`
        : `The sector has been quieter than the rest of the system. The Cast records quiet as carefully as it records action.`
    return `${b.zone}: the Cast closed another entry. ${bothNote} The scribes in the White Corridors hold a partial version of this record — accurate in parts, incomplete in the rest. The Cast's version has no gaps.`
  },
  (b: StoryBeat) => {
    return `The Cast registered activity in ${b.zone} — ${b.zoneDetail}. ${conflictState(b.world)}. Its log now covers ${b.world.totalActs} recorded acts, each one tagged by zone and linked to the one before it. No other account of Normia is this complete or this honest.`
  },
  (b: StoryBeat) => {
    return `The Cast came through ${b.zone} and witnessed. ${systemNote(b.seed)} It does not report to the faction councils. It never has. Its record is more complete than anything the councils maintain, and it owes them nothing.`
  },
]

// ── THE CAST RETURN ───────────────────────────────────────────────────────────
const CAST_RETURN = [
  (b: StoryBeat) => {
    const gapNote = b.world.lastMajorAct && b.world.lastMajorZone
      ? `While it was away, ${b.world.lastMajorChar ? CHARACTERS[b.world.lastMajorChar].name : 'someone'} ${b.world.lastMajorAct} in ${b.world.lastMajorZone}. The Cast is adding that to the record now, working back through the gap.`
      : `The record has a visible absence from when it was gone. The Cast is filling it in.`
    return `The Cast came back to ${b.zone} after an absence from the log. ${gapNote} The sector has shifted in the time between entries — new builds registered, zones cleared, things it did not see directly. From here the record continues forward.`
  },
  (b: StoryBeat) => {
    return `Back in ${b.zone}. The Cast was away long enough for the sector map to change shape — ${conflictState(b.world)}. It treats the gap as information: what happened while no one was recording is its own kind of evidence. The log now shows both the absence and the return.`
  },
]

// ── CIELO SMALL ───────────────────────────────────────────────────────────────
const SABLE_SMALL = [
  (b: StoryBeat) => {
    const finnNote = b.world.finnLastBroke
      ? `Finn's last break was in ${b.world.finnLastBroke}. Cielo came through that sector afterward — this is her pattern. He opens things up; she tends what the opening leaves behind.`
      : `No major break in the surrounding sectors recently. She is doing preventive work — maintaining before damage shows up rather than after.`
    return `Cielo ran a maintenance pass through ${b.zone} — ${b.zoneDetail}. ${finnNote} She found a fraying edge in the sector's structure and repaired it before it could drift further. The work is in the record now. No one specifically asked for it. That is how she operates.`
  },
  (b: StoryBeat) => {
    const lyraNote = b.world.lyraLastBuilt
      ? `Lyra's build in ${b.world.lyraLastBuilt} is the active structure running through this part of the map. What Cielo maintained here is what keeps that build stable as more activity moves through the zone.`
      : `Without Lyra actively building right now, the existing structures carry more maintenance weight. Cielo is absorbing that.`
    return `Cielo worked through ${b.zone}. ${lyraNote} The detail work — patching structures, reinforcing flagged edges, clearing claims that have lapsed — does not produce large entries in the record. It prevents the entries that would appear if it did not get done.`
  },
  (b: StoryBeat) => {
    return `Cielo tended ${b.zone} — ${b.zoneDetail}. She found two structures that had slipped out of registered status: not cleared, just quietly unregistered, the slow kind of decay that happens when attention moves elsewhere. She brought them back. ${systemNote(b.seed)} The Cast logged it. Cielo moved on.`
  },
  (b: StoryBeat) => {
    const holdNote = b.world.cieloHolding
      ? `She is also holding ${b.world.cieloHolding}. The two zones feed into the same routing layer — keeping one stable helps the other.`
      : `First recorded maintenance pass through this sector.`
    return `Cielo came back to ${b.zone} and found it had slipped again. ${holdNote} She keeps a working list of which sectors are drifting toward instability. ${b.zone} has been on it for a while. Now it is not.`
  },
]

// ── CIELO QUIET ───────────────────────────────────────────────────────────────
const SABLE_QUIET = [
  (b: StoryBeat) => {
    return `The sector quieted down and Cielo used the window. She does her best work when attention is elsewhere — slower passes, deeper checks on the underlying layer. ${conflictState(b.world)}. Whatever comes next in ${b.zone} will run on steadier ground because of what she did while no one was watching.`
  },
  (b: StoryBeat) => {
    return `Cielo worked ${b.zone} through the quiet interval. The zone is ${b.zoneDetail}. Without Lyra's build spikes or Finn's breaks pulling focus, she could reach the smaller problems — the kind that do not show up as incidents until they suddenly do. She reached them. They will not become incidents now.`
  },
]

// ── ECHO ARRIVAL ──────────────────────────────────────────────────────────────
const ECHO_ARRIVAL = [
  (b: StoryBeat) => {
    const trigger = b.world.lastMajorChar
      ? `${CHARACTERS[b.world.lastMajorChar].name} just registered a major act in the system. Echo's arrival in ${b.zone} may be following the outer-zone signal that act sent out — that is how he navigates, reading the edges of what happens at the center.`
      : `Nobody predicted this movement. Echo rarely announces.`
    return `Echo registered in ${b.zone} — ${b.zoneDetail}. ${trigger} He works inward from the margins, which runs opposite to how most activity in Normia flows. What he pulls in from the edges ends up in the record.`
  },
  (b: StoryBeat) => {
    const priorFind = b.world.echoLastFound
      ? `His last registered find was in ${b.world.echoLastFound}. This move to ${b.zone} is either following that thread or beginning a new one — with Echo, the two are hard to tell apart.`
      : `First registered arrival in the outer sectors. He has been moving before this, just not through zones the central log was tracking.`
    return `Echo surfaced in ${b.zone}. ${priorFind} He moved through the sector, left his mark, and flagged something in the system log. ${conflictState(b.world)}. Whatever he found is in the record. The sector councils will not act on it until it becomes impossible to ignore.`
  },
  (b: StoryBeat) => {
    return `${b.zone}: Echo was here. ${b.zoneDetail}. He has been tracing a path through the outer sectors — ${b.world.echoFindCount > 1 ? `this is his ${b.world.echoFindCount}th stop on what looks like a deliberate route` : 'this looks like the start of something longer'}. Nobody has mapped what connects these stops yet except him.`
  },
  (b: StoryBeat) => {
    const centralNote = b.world.lyraLastBuilt || b.world.finnLastBroke
      ? `While ${b.world.lyraLastBuilt ? `Lyra builds in ${b.world.lyraLastBuilt}` : ''}${b.world.lyraLastBuilt && b.world.finnLastBroke ? ' and ' : ''}${b.world.finnLastBroke ? `Finn clears in ${b.world.finnLastBroke}` : ''}, Echo is working the parts of the map that the central activity does not reach.`
      : `The central sectors are quieter than usual. Echo operates in the outer zones regardless of what is happening in the middle.`
    return `Echo crossed into ${b.zone} from the margins. ${centralNote} What sits at the edges of the map is different from what the central routing shows. Echo has been building a record of those differences, one sector at a time.`
  },
]

// ── ECHO DISCOVERY ────────────────────────────────────────────────────────────
const ECHO_DISCOVERY = [
  (b: StoryBeat) => {
    const lyraNote = b.world.lyraLastBuilt
      ? `Lyra's current build sequence is running through ${b.world.lyraLastBuilt}. What Echo found in ${b.zone} sits on the same routing path. She may be building on a foundation she does not know exists.`
      : `No one has been building in this part of the map. What Echo found was sitting undisturbed.`
    return `Echo pulled something out of ${b.zone} that was not in any public record — ${b.zoneDetail}. An old structure, a buried registration, something that predates the current era's claims by more than one cycle. He flagged it in the system log without filing a formal report. ${lyraNote} The Cast has it now.`
  },
  (b: StoryBeat) => {
    return `In ${b.zone}, Echo found what he has been tracing across the outer sectors: a gap between what the sector map shows and what is actually registered in the base layer. He documented it. Did not file a query. The Cast has the entry. ${conflictState(b.world)}. What anyone does with that information is their own call.`
  },
]

// ── CONVERGENCE ───────────────────────────────────────────────────────────────
const CONVERGENCE_BEATS = [
  (b: StoryBeat, other: CharacterKey) => {
    const c1 = CHARACTERS[b.charKey], c2 = CHARACTERS[other]
    const act1 = b.charKey === 'LYRA' ? 'placing a build' : b.charKey === 'VOSS' ? 'running a break' : b.charKey === 'CAST' ? 'logging' : b.charKey === 'SABLE' ? 'running maintenance' : 'marking a find'
    const act2 = other === 'LYRA' ? 'placing a build' : other === 'VOSS' ? 'running a break' : other === 'CAST' ? 'logging' : other === 'SABLE' ? 'running maintenance' : 'marking a find'
    return `${c1.name} and ${c2.name} landed in the record at the same moment — ${c1.name} was ${act1} in ${b.zone}, ${c2.name} was ${act2} in a separate sector. Neither knew. The system logged both as simultaneous. These moments are rare enough to mean something. ${conflictState(b.world)}. The Cast has both entries side by side.`
  },
  (b: StoryBeat, other: CharacterKey) => {
    const c1 = CHARACTERS[b.charKey], c2 = CHARACTERS[other]
    return `Two registrations in the same block: ${c1.name} in ${b.zone}, ${c2.name} in a separate sector. The same instant. No coordination. The system called it a convergence event. ${conflictState(b.world)}. The Cast flagged it. When two of the five land in the record simultaneously, it tends to matter.`
  },
]

// ── ERA SHIFT ─────────────────────────────────────────────────────────────────
const ERA_SHIFT_BEATS = [
  (b: StoryBeat) => {
    const recap = [
      b.world.lyraLastBuilt ? `Lyra's last build was in ${b.world.lyraLastBuilt}` : null,
      b.world.finnLastBroke ? `Finn's last break was in ${b.world.finnLastBroke}` : null,
      b.world.cieloLastTended ? `Cielo has been holding ${b.world.cieloLastTended}` : null,
      b.world.echoLastFound ? `Echo's last find was in ${b.world.echoLastFound}` : null,
    ].filter(Boolean).join('. ')
    return `Normia crossed into ${b.world.era}. The act count hit the threshold and the era designation shifted across the whole system. ${recap ? recap + '.' : ''} Everything the five have done carries forward in the record. The new era opens with that full history already written into it. ${conflictState(b.world)}.`
  },
  (b: StoryBeat) => {
    return `${b.world.era}. The counter turned over. This is not symbolic — the designation changes how the sector councils weight old claims against new ones. Structures registered before the shift are now prior-era records and sit in a different legal layer. ${b.world.lyraBuiltCount > 0 ? `Lyra has ${b.world.lyraBuiltCount} registered builds that just became prior-era entries. That changes how contestable they are.` : ''} ${conflictState(b.world)}. The Cast logged the transition. The five keep moving.`
  },
]

// ── READING (25th) ────────────────────────────────────────────────────────────
const READING_BEATS = [
  (b: StoryBeat) => {
    const status = [
      b.world.lyraLastBuilt ? `Lyra last built in ${b.world.lyraLastBuilt}` : 'Lyra has not built yet',
      b.world.finnLastBroke ? `Finn last broke in ${b.world.finnLastBroke}` : 'Finn has not broken yet',
      b.world.cieloLastTended ? `Cielo is maintaining ${b.world.cieloLastTended}` : null,
      b.world.echoLastFound ? `Echo last found something in ${b.world.echoLastFound}` : null,
    ].filter(Boolean).join('. ')
    return `Twenty-five acts in. The Cast takes stock. Current state of the map: ${status}. ${conflictState(b.world)}. The shape of the next twenty-five will depend on which of those threads gets pulled on first.`
  },
  (b: StoryBeat) => {
    return `A twenty-five-act checkpoint. The system has logged ${b.world.totalActs} events since the record opened: ${b.world.lyraBuiltCount} Lyra builds, ${b.world.finnBreakCount} Finn breaks, ${b.world.echoFindCount} Echo finds, and Cielo's maintenance threading through all of it. ${conflictState(b.world)}. What Normia looks like right now is the sum of those moves.`
  },
]

// ── DEEP READING (40th) ───────────────────────────────────────────────────────
const DEEP_READING_BEATS = [
  (b: StoryBeat) => {
    return `The Cast reads back through forty acts. The count: ${b.world.lyraBuiltCount} Lyra builds, ${b.world.finnBreakCount} Finn breaks, ${b.world.echoFindCount} Echo finds, and Cielo working the margins throughout. ${conflictState(b.world)}. Every contested zone, every stable structure, every open space in the current map traces back through that sequence. The record is the proof.`
  },
  (b: StoryBeat) => {
    return `Forty acts. The Cast lays the full sequence out. No single actor has shaped Normia alone: what Lyra builds creates conditions Finn responds to, which opens space Cielo maintains, which Echo uses to route his outer-zone work, which the Cast records as the connective tissue holding it all together. Take any one out and the sequence stops making sense. ${conflictState(b.world)}.`
  },
]

// ── QUIET ─────────────────────────────────────────────────────────────────────
const QUIET_BEATS = [
  (b: StoryBeat) => {
    return `Activity in ${b.zone} dropped to near-nothing. The five are elsewhere, or between registered acts. ${conflictState(b.world)}. ${sectorGroup(b.seed)} kept working regardless. The sector operators do not stop because the major presences have gone quiet. The system runs whether they are registering or not.`
  },
  (b: StoryBeat) => {
    return `${b.zone} went quiet — ${b.zoneDetail}. ${b.world.lyraLastBuilt ? `Lyra's last build is sitting in ${b.world.lyraLastBuilt}.` : ''} ${b.world.finnLastBroke ? `Finn's cleared zone in ${b.world.finnLastBroke} stays open.` : ''} A gap between acts is its own kind of data. ${systemNote(b.seed)} Whatever registers next will break the quiet and carry the weight of the interval.`
  },
]

// ── PASSING ───────────────────────────────────────────────────────────────────
const PASSING_BEATS = [
  (b: StoryBeat) => {
    return `A small transfer registered near ${b.zone} — not a full dissolution, just a portion moved through the distribution layer. Minor volume. The record shows it because the record shows everything. ${conflictState(b.world)}. Transfers like this run in the background of Normia constantly.`
  },
  (b: StoryBeat) => {
    return `Near ${b.zone}: a transfer. A fraction of registered presence moved through the system quietly. ${sectorGroup(b.seed)} process these without flagging them. The Cast logged it. It sits in the record between larger acts, doing what small entries do — holding the sequence together.`
  },
]

// ── LONG DARK ─────────────────────────────────────────────────────────────────
const LONG_DARK_BEATS = [
  (b: StoryBeat) => {
    const standing = [
      b.world.lyraLastBuilt ? `Lyra's last build in ${b.world.lyraLastBuilt} sat unchanged` : null,
      b.world.finnLastBroke ? `Finn's cleared zone in ${b.world.finnLastBroke} stayed open` : null,
    ].filter(Boolean).join('. ')
    return `A long gap opened in the record. The system kept running — the sectors held their state, the routing continued, the background work went on — but none of the five left a new mark. ${standing ? standing + '.' : ''} The Cast documented the silence as its own entry. An absence recorded is still presence in the record. The sequence picks up now.`
  },
  (b: StoryBeat) => {
    return `The gap between acts stretched out longer than usual. In the silence, the sector map shifted on its own — structures drifting, old claims quietly absorbing into the base layer, things moving without any of the five involved. ${conflictState(b.world)}. The act that ends a long dark carries everything the interval held. This is that act.`
  },
]

// ── FIRST LIGHT ───────────────────────────────────────────────────────────────
const FIRST_LIGHT_BEATS = [
  (b: StoryBeat) => {
    return `A new account left its first mark near ${b.zone} — no prior entries, no sector history to speak of. The Cast logged it the same way it logs everything: without interpretation, just the fact. Someone is here who was not here before. ${conflictState(b.world)}. Lyra's first entry looked exactly like this. So did Finn's.`
  },
  (b: StoryBeat) => {
    return `First registered activity near ${b.zone} from an account with no history in the system. The zone is ${b.zoneDetail}. A new presence in Normia. Whether it amounts to anything depends entirely on what comes next. The Cast is watching.`
  },
]

// ── RELIC ─────────────────────────────────────────────────────────────────────
const RELIC_BEATS = [
  (b: StoryBeat) => {
    return `Echo pulled an old registration out of ${b.zone} — a structure that predates the current era, buried in the base layer of the sector data, absent from every active map. He flagged it in the system log without filing a formal report. ${b.world.lyraLastBuilt ? `Lyra's build sequence in ${b.world.lyraLastBuilt} runs through the same routing path. She may be building on a foundation she does not know is there.` : `The structure's original purpose is unclear. Its presence is not.`} The Cast is indexing it now.`
  },
  (b: StoryBeat) => {
    return `Something old came up in ${b.zone}. A prior-era registration, technically still live in the base protocol, dropped from the active index some time back and forgotten. ${conflictState(b.world)}. Lyra will want to look at it. Finn will want to decide whether it needs to go. Echo, who found it, has already moved on to the next thing.`
  },
]

// ── PULSE (10th) ──────────────────────────────────────────────────────────────
const PULSE_BEATS = [
  (b: StoryBeat) => {
    const status = [
      b.world.lyraLastBuilt ? `Lyra: last built in ${b.world.lyraLastBuilt}` : 'Lyra: no build yet',
      b.world.finnLastBroke ? `Finn: last broke in ${b.world.finnLastBroke}` : 'Finn: no break yet',
      b.world.cieloLastTended ? `Cielo: tending ${b.world.cieloLastTended}` : null,
      b.world.echoLastFound ? `Echo: last find in ${b.world.echoLastFound}` : null,
    ].filter(Boolean).join('. ')
    return `Ten acts. A checkpoint. Current state of the map: ${status}. ${conflictState(b.world)}. ${sectorGroup(b.seed)} have their own reading of what this stretch meant for their sector. Their version and the record's version share the facts but not the interpretation. Both are in the system.`
  },
  (b: StoryBeat) => {
    return `A ten-act checkpoint. ${conflictState(b.world)}. The system has processed ${b.world.totalActs} registered events since the record opened. Each one changed something in the sector map. What Normia looks like right now is the cumulative result.`
  },
]

// ── VIGIL ─────────────────────────────────────────────────────────────────────
const VIGIL_BEATS = [
  (b: StoryBeat) => {
    return `Normia is a few acts from the next era threshold. The count is close to the marker. ${b.world.lyraLastBuilt ? `Lyra's build in ${b.world.lyraLastBuilt}` : 'The current registered structures'} will cross into the next era as prior-era records. ${conflictState(b.world)}. What the five do in these final acts is what the new era inherits as its starting condition.`
  },
  (b: StoryBeat) => {
    return `Close to the boundary between ${b.world.era} and what follows it. ${b.world.lyraLastBuilt ? `Lyra built in ${b.world.lyraLastBuilt}.` : ''} ${b.world.finnLastBroke ? ` Finn cleared in ${b.world.finnLastBroke}.` : ''} These are the last acts logged under the current designation. The Cast is watching the count.`
  },
]

// HEADLINE GENERATION
// ─────────────────────────────────────────────────────────────────────────────

function makeHeadline(charKey: CharacterKey, ruleType: string, zone: string, world: GridWorld, entryIndex: number): string {
  const char = CHARACTERS[charKey]
  const headlines: Record<string, string[]> = {
    LYRA_SMALL: [
      `Lyra Extends Her Build into ${zone}`,
      `Another Sector Added — Lyra at ${zone}`,
      `Lyra Places a New Layer in ${zone}`,
      `The Build Continues: ${zone}`,
    ],
    LYRA_LARGE: [
      `Lyra's Major Build Lands in ${zone}`,
      `Full Sector Commitment — Lyra in ${zone}`,
      `The Architecture Converges at ${zone}`,
    ],
    VOSS_SMALL: [
      `Finn Clears a Section of ${zone}`,
      `${zone} Restructured — Finn`,
      `Finn Runs a Break in ${zone}`,
      `A Structure Removed in ${zone}`,
    ],
    VOSS_LARGE: [
      `Finn Runs a Full Restructure of ${zone}`,
      `Major Break in ${zone} — Finn`,
      `${zone} Cleared Completely`,
    ],
    VOSS_BURN: [
      `Finn Releases Volume Near ${zone}`,
      `Partial Dissolution — Finn at ${zone}`,
      `Finn Feeds the System at ${zone}`,
    ],
    CAST_SMALL: [
      `The Cast Logs ${zone}`,
      `Record Entry: ${zone}`,
      `The Cast in ${zone}`,
      `${zone} Added to the Record`,
    ],
    CAST_RETURN: [
      `The Cast Returns to ${zone}`,
      `Record Resumed at ${zone}`,
      `The Witness Is Back`,
    ],
    SABLE_SMALL: [
      `Cielo Runs Maintenance in ${zone}`,
      `${zone} Tended — Cielo`,
      `Cielo Stabilizes ${zone}`,
      `Edge Repair in ${zone}`,
    ],
    SABLE_QUIET: [
      `Cielo Works ${zone} During Low Activity`,
      `Quiet Maintenance in ${zone}`,
    ],
    ECHO_ARRIVAL: [
      `Echo Registers in ${zone}`,
      `Outer Zone Activity — Echo at ${zone}`,
      `Echo Arrives from the Margins`,
      `${zone} Flagged by Echo`,
    ],
    ECHO_DISCOVERY: [
      `Echo Surfaces an Old Registration in ${zone}`,
      `Prior-Era Structure Found in ${zone}`,
      `Echo's Discovery in ${zone}`,
    ],
    CONVERGENCE: [
      `Two Registrations in the Same Block`,
      `Concurrent Activity Logged`,
      `Convergence Event`,
    ],
    ERA_SHIFT: [`Normia Enters ${world.era}`, `Era Transition: ${world.era}`, `The Counter Crosses: ${world.era}`],
    THE_READING: [`Twenty-Five Act Checkpoint`, `The Cast Reviews at 25`, `Checkpoint: 25 Acts`],
    DEEP_READING: [`Forty-Act System Review`, `The Cast Reads the Full Arc`, `Long Review: 40 Acts`],
    DEPARTURE: [`${char.name} Releases at ${zone}`, `${char.name} Dissolves Near ${zone}`, `System Release — ${char.name}`],
    THE_QUIET: [`Low Activity in ${zone}`, `Quiet Period`, `Gap in Activity: ${zone}`],
    LONG_DARK: [`Extended Silence in the Record`, `Long Gap Between Acts`, `The Record Goes Dark`],
    FIRST_LIGHT: [`New Account Near ${zone}`, `First Activity Near ${zone}`, `A New Presence in Normia`],
    RELIC_FOUND: [`Old Registration Surfaced in ${zone}`, `Prior-Era Structure Found in ${zone}`, `Echo's Find in ${zone}`],
    PULSE: [`10-Act Checkpoint`, `Ten Acts Logged`, `System Pulse`],
    VIGIL: [`Near the Era Threshold`, `Last Acts of ${world.era}`, `Approaching the Transition`],
    GHOST_TOUCH: [`Minimal Activity in ${zone}`, `One Registration in ${zone}`, `Single Mark — ${zone}`],
    PASSING: [`Small Transfer Near ${zone}`, `Minor Volume Movement`, `Transfer Logged Near ${zone}`],
  }
  const pool = headlines[ruleType] ?? [`${char.name} at ${zone}`]
  const s = Math.abs((entryIndex * 1327 + zone.length * 491)) % pool.length
  return pool[s]
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE TYPE
// ─────────────────────────────────────────────────────────────────────────────

function sceneFromBeat(charKey: CharacterKey, ruleType: string, _world: GridWorld): SceneType {
  if (ruleType === 'ERA_SHIFT') return 'reckoning'
  if (ruleType === 'CONVERGENCE') return 'convergence'
  if (ruleType === 'LONG_DARK' || ruleType === 'THE_QUIET') return 'quiet'
  if (ruleType === 'FIRST_LIGHT') return 'dawn'
  if (ruleType === 'DEPARTURE' || ruleType === 'VOSS_BURN') return 'sacrifice'
  if (charKey === 'LYRA') return 'construction'
  if (charKey === 'VOSS') return 'destruction'
  if (charKey === 'CAST') return 'vigil'
  if (charKey === 'SABLE') return 'tending'
  if (charKey === 'ECHO') return 'arrival'
  return 'quiet'
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT SELECTION
// ─────────────────────────────────────────────────────────────────────────────

function selectBeatType(
  event: IndexedEvent, charKey: CharacterKey, index: number,
  allEvents: IndexedEvent[], cumCount: number, prev: IndexedEvent | null, world: GridWorld,
): string {
  const count = Number(event.count)
  const isBurn = event.type === 'BurnRevealed'
  const isVeteran = allEvents.slice(0, index).some(e => e.owner === event.owner)
  const tokenId = Number(event.tokenId)

  if (cumCount > 0 && cumCount % 40 === 0) return 'DEEP_READING'
  if (cumCount > 0 && cumCount % 25 === 0) return 'THE_READING'
  if (cumCount > 0 && cumCount % 10 === 0) return 'PULSE'

  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'ERA_SHIFT'
  const nextEra = ERAS.find(e => e.threshold > cumCount)
  if (nextEra && nextEra.threshold - cumCount <= 3) return 'VIGIL'

  if (isRareTxHash(event.transactionHash)) return 'RELIC_FOUND'
  if (prev && prev.blockNumber === event.blockNumber) return 'CONVERGENCE'

  if (prev) {
    const gap = event.blockNumber - prev.blockNumber
    if (gap > 50000n) return 'LONG_DARK'
    if (gap > 10000n) return 'THE_QUIET'
  }

  if (isBurn) {
    if (count >= 5) return 'DEPARTURE'
    return 'PASSING'
  }

  if (!isVeteran && cumCount <= 20) return 'FIRST_LIGHT'

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
  charKey: CharacterKey, beatType: string, zone: string,
  world: GridWorld, seed: number, prevCharKey: CharacterKey | null,
): string {
  const b: StoryBeat = {
    charKey, zone,
    zoneDetail: ZONE_DETAIL[zone] ?? 'a sector in Normia',
    world, count: 0, isBurn: false, isVeteran: true, seed,
  }

  const pools: Record<string, Array<(b: StoryBeat, other?: CharacterKey) => string>> = {
    LYRA_SMALL, LYRA_LARGE,
    VOSS_SMALL, VOSS_BURN, VOSS_LARGE,
    CAST_SMALL, CAST_RETURN,
    SABLE_SMALL, SABLE_QUIET,
    ECHO_ARRIVAL, ECHO_DISCOVERY,
    THE_READING: READING_BEATS,
    DEEP_READING: DEEP_READING_BEATS,
    ERA_SHIFT: ERA_SHIFT_BEATS,
    DEPARTURE: VOSS_BURN,
    THE_QUIET: QUIET_BEATS,
    LONG_DARK: LONG_DARK_BEATS,
    FIRST_LIGHT: FIRST_LIGHT_BEATS,
    RELIC_FOUND: RELIC_BEATS,
    PULSE: PULSE_BEATS,
    VIGIL: VIGIL_BEATS,
    PASSING: PASSING_BEATS,
    GHOST_TOUCH: [
      (bb) => `A single registration in ${bb.zone} — ${bb.zoneDetail}. Minimal volume. One point in the record. ${conflictState(bb.world)}.`,
      (bb) => `One registration in ${bb.zone}. Low volume, no attached claim. The Cast recorded it because the Cast records everything.`,
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
// WORLD UPDATE — runs after every generated entry
// ─────────────────────────────────────────────────────────────────────────────

function updateWorld(world: GridWorld, charKey: CharacterKey, beatType: string, zone: string, count: number): void {
  world.totalActs++
  world.eraActCount++

  if (world.zoneOwner[zone]) world.zonePrevOwner[zone] = world.zoneOwner[zone]
  world.zoneOwner[zone] = charKey

  if (charKey === 'LYRA') {
    world.lyraLastBuilt = zone
    world.lyraBuiltCount++
    if (beatType === 'LYRA_LARGE') {
      world.lyraFinnConflict = Math.min(100, world.lyraFinnConflict + 18)
      if (world.finnLastBroke === zone) world.lyraReclaimed = true
    } else {
      world.lyraFinnConflict = Math.min(100, world.lyraFinnConflict + 4)
    }
    world.lyraSignature = count >= 150 ? 'keystone build' : count >= 50 ? 'major structure' : 'layer'
  }

  if (charKey === 'VOSS') {
    world.finnLastBroke = zone
    world.finnLastTarget = zone
    world.finnBreakCount++
    world.finnContestedLyra = world.lyraLastBuilt === zone
    world.finnContested = world.finnContestedLyra
    if (beatType === 'VOSS_LARGE') world.lyraFinnConflict = Math.min(100, world.lyraFinnConflict + 22)
    else if (beatType === 'VOSS_BURN') world.lyraFinnConflict = Math.min(100, world.lyraFinnConflict + 8)
    else world.lyraFinnConflict = Math.min(100, world.lyraFinnConflict + 6)
  }

  if (charKey === 'CAST') world.castLastWitnessed = zone
  if (charKey === 'SABLE') {
    world.cieloLastTended = zone
    world.cieloHolding = zone
    world.cieloRepairCount++
  }
  if (charKey === 'ECHO') {
    world.echoLastFound = zone
    world.echoLastZone = zone
    world.echoFindCount++
  }

  if (world.totalActs % 7 === 0) world.lyraFinnConflict = Math.max(5, world.lyraFinnConflict - 4)

  if (['LYRA_LARGE', 'VOSS_LARGE', 'DEPARTURE', 'ERA_SHIFT', 'CONVERGENCE', 'RELIC_FOUND'].includes(beatType)) {
    const moment = `${CHARACTERS[charKey].name} — ${beatType.replace(/_/g, ' ').toLowerCase()} in ${zone}`
    world.majorMoments = [moment, ...world.majorMoments].slice(0, 5)
    world.lastMajorChar = charKey
    world.lastMajorAct = beatType === 'LYRA_LARGE' ? 'placed a major build' :
      beatType === 'VOSS_LARGE' ? 'ran a full restructure' : beatType === 'DEPARTURE' ? 'dissolved' :
      beatType === 'CONVERGENCE' ? 'registered simultaneously with another' : 'surfaced an old structure'
    world.lastMajorZone = zone
  }

  world.currentScene = sceneFromBeat(charKey, beatType, world)
  world.sceneIntensity = beatType.includes('LARGE') || beatType === 'DEPARTURE' ? 90 :
    beatType.includes('SMALL') || beatType === 'SABLE_QUIET' ? 35 : 60
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS + LORE MAP
// ─────────────────────────────────────────────────────────────────────────────

const BEAT_ICONS: Record<string, string> = {
  LYRA_LARGE: '◈', LYRA_SMALL: '▪', VOSS_LARGE: '◆', VOSS_SMALL: '◇',
  VOSS_BURN: '▽', CAST_SMALL: '○', CAST_RETURN: '◉', SABLE_SMALL: '―',
  SABLE_QUIET: '◦', ECHO_ARRIVAL: '▿', ECHO_DISCOVERY: '◈', CONVERGENCE: '⊕',
  ERA_SHIFT: '║', THE_READING: '▣', DEEP_READING: '▣', DEPARTURE: '▽',
  THE_QUIET: '·', LONG_DARK: '◌', FIRST_LIGHT: '→', RELIC_FOUND: '◈',
  PULSE: '◦', VIGIL: '◦', PASSING: '△', GHOST_TOUCH: '·',
}

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
// TYPES
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

function moodFromScene(scene: SceneType): NonNullable<StoryEntry['visualState']>['mood'] {
  const m: Record<SceneType, NonNullable<StoryEntry['visualState']>['mood']> = {
    construction: 'surge', destruction: 'chaos', sacrifice: 'departure',
    vigil: 'quiet', tending: 'quiet', arrival: 'wonder', convergence: 'wonder',
    reckoning: 'chaos', quiet: 'quiet', dawn: 'normal',
  }
  return m[scene] ?? 'normal'
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATE
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
    if (eraData.name !== world.era) world.eraActCount = 0
    world.era = eraData.name
    world.eraIndex = eraData.eraIndex

    const charKey = getCharacter(event, events, index)
    const zone = zoneFor(event.tokenId)
    const beatType = selectBeatType(event, charKey, index, events, cumCount, prev, world)
    const seed = Number(seedN(event.tokenId, event.blockNumber))
    const headline = makeHeadline(charKey, beatType, zone, world, index)
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
        ruleExplanation: `Token #${event.tokenId} → ${CHARACTERS[charKey].name} (${CHARACTERS[charKey].title}). Beat: ${beatType}. Zone: ${zone}.`,
      },
    })

    updateWorld(world, charKey, beatType, zone, Number(event.count))
    prevCharKey = charKey
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMER
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMER_ENTRIES: StoryEntry[] = [
  {
    id: 'primer-genesis',
    eventType: 'genesis',
    loreType: 'GENESIS',
    era: 'The First Days',
    icon: '◈',
    featured: true,
    headline: 'The Record Opens',
    body: `Normia is a live system — ten thousand registered presences spread across twenty sectors, each one capable of being shaped, transferred, or dissolved. Its territory has character: some zones are ancient and disputed, some newly claimed, some so quiet they have almost stopped appearing on active maps. The system runs on what people do with what they hold.

Five presences have become the main actors in this record. They did not appoint themselves. They became significant through what they actually did, over time, in full view of the log.

Lyra builds. She has been laying structures across Normia's sectors since before this record opened, working toward a pattern whose full shape has not yet come clear. Finn breaks what calcifies — he removes structures that have stopped earning their place, believing a live system has to stay open to change or it stops being a system at all. The Cast watches and documents everything; its record is the most complete account of Normia that exists, and it answers to no one. Cielo tends what the others leave behind — repairing the edges, holding zones that would drift without attention, keeping things alive past their moment of notice. Echo works the outer margins, the sectors the major factions do not bother tracking, and what he finds there keeps turning out to matter more than anyone expected.

What follows is their record, and the record of the world their actions are building.`,
    activeCharacter: 'CAST',
    visualState: { mood: 'normal', intensity: 20, dominantZone: 'the Open Grid', signalName: 'The Cast', scene: 'dawn', charKey: 'CAST' },
    sourceEvent: { type: 'genesis', tokenId: '--', blockNumber: '--', txHash: '--', count: '--', ruleApplied: 'World Primer', ruleExplanation: 'The opening entry.' },
  },
]
