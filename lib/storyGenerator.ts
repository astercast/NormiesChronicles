import type { IndexedEvent } from './eventIndexer'

// ─────────────────────────────────────────────────────────────────────────────
// THE FIVE
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTERS = {
  LYRA: {
    name: 'Lyra', title: 'the Architect',
    pronoun: 'she', possessive: 'her',
    goal: 'to build something in Normia that outlasts every attempt to erase it',
    nature: 'methodical, visionary, haunted by incompleteness',
    activatedBy: 'construction, accumulation, patience',
    shortDesc: 'She builds. Sector by sector, piece by piece, toward a shape only she can see.',
  },
  VOSS: {
    name: 'Finn', title: 'the Breaker',
    pronoun: 'he', possessive: 'his',
    goal: 'to unmake what calcifies — Normia must stay alive, even if that means burning it open',
    nature: 'fierce, principled, misread as destructive',
    activatedBy: 'burns, sacrifice, dissolution',
    shortDesc: 'He burns. Not out of malice — out of conviction that nothing built should be permanent.',
  },
  CAST: {
    name: 'The Cast', title: 'the Witness',
    pronoun: 'it', possessive: 'its',
    goal: 'to see everything and forget nothing — the record is the only truth Normia has',
    nature: 'ancient, omnipresent, neither cruel nor kind — simply watching',
    activatedBy: 'veteran returns, long silences, accumulated history',
    shortDesc: 'It has been watching since before most of the others arrived. The record is its only act.',
  },
  SABLE: {
    name: 'Cielo', title: 'the Keeper',
    pronoun: 'she', possessive: 'her',
    goal: 'to tend what others abandon — nothing built in Normia should go dark unattended',
    nature: 'quiet, relentless, loyal to what remains when the attention moves on',
    activatedBy: 'patience, repetition, care without recognition',
    shortDesc: 'She maintains. After Lyra builds and Finn burns, Cielo is the one still there.',
  },
  ECHO: {
    name: 'Echo', title: 'the Wanderer',
    pronoun: 'he', possessive: 'his',
    goal: 'to find what Normia is hiding at its edges — the center never sees the full picture',
    nature: 'unpredictable, magnetic, arrives exactly when it matters',
    activatedBy: 'the outer zones, unexpected signals, things the center cannot see',
    shortDesc: 'He works the margins. What he finds there keeps mattering more than anyone expected.',
  },
} as const

export type CharacterKey = keyof typeof CHARACTERS

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER ASSIGNMENT
// Each event type maps to a character based on real onchain data patterns.
// FINN appears only on actual BurnRevealed events — keeping him rare and meaningful.
// ─────────────────────────────────────────────────────────────────────────────

function getCharacter(
  event: IndexedEvent,
  index: number,
  ownerHistory: Map<string, number[]>,
): CharacterKey {
  const tokenId = Number(event.tokenId)

  // FINN — only actual burns. Rare, permanent, dramatic.
  if (event.type === 'BurnRevealed') return 'VOSS'

  const prior = ownerHistory.get(event.owner) ?? []
  const isNew = prior.length === 0
  const lastSeen = prior.length > 0 ? prior[prior.length - 1] : -1
  const gap = index - lastSeen

  // THE CAST — veteran wallets returning after a long absence (10+ acts since last).
  if (!isNew && gap > 12) return 'CAST'

  // CIELO — wallets that tend the same territory repeatedly (back within 5 acts).
  if (!isNew && gap <= 5) return 'SABLE'

  // ECHO — high token IDs live in Normia's outer margins.
  if (tokenId > 7500) return 'ECHO'

  // LYRA — new wallets or low token IDs (the Cradle, where things begin).
  if (isNew || tokenId < 2500) return 'LYRA'

  // Mid-range: distribute across Lyra, Cielo, Echo based on token + position.
  const slot = ((tokenId * 1327 + index * 491) >>> 0) % 3
  return (['LYRA', 'SABLE', 'ECHO'] as CharacterKey[])[slot]
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD STATE — the living memory that threads each body to the last
// ─────────────────────────────────────────────────────────────────────────────

interface GridWorld {
  lyraZones: string[]         // zones Lyra has marked with signal
  finnBurned: string[]        // zones Finn has permanently cleared
  cieloZones: string[]        // zones Cielo is actively tending
  echoZones: string[]         // zones Echo has visited from the margins

  finnBurnedLyraZone: string | null  // the last Lyra zone Finn burned
  lyraReclaimedZone: string | null   // the last zone Lyra rebuilt after a burn
  contestedZone: string | null       // current hotspot — the zone in active dispute

  lyraLastZone: string | null
  finnLastZone: string | null
  cieloLastZone: string | null
  echoLastZone: string | null

  lyraBuiltCount: number
  finnBurnCount: number
  cieloRepairCount: number
  echoFindCount: number
  totalActs: number

  lastMajor: { charName: string; act: string; zone: string } | null
  lastMajorChar: CharacterKey | null

  era: string
  eraIndex: number
  currentScene: SceneType
  sceneIntensity: number
}

export type SceneType =
  | 'construction' | 'destruction' | 'sacrifice' | 'vigil'
  | 'tending' | 'arrival' | 'convergence' | 'reckoning'
  | 'quiet' | 'dawn'

function freshWorld(): GridWorld {
  return {
    lyraZones: [], finnBurned: [], cieloZones: [], echoZones: [],
    finnBurnedLyraZone: null, lyraReclaimedZone: null, contestedZone: null,
    lyraLastZone: null, finnLastZone: null, cieloLastZone: null, echoLastZone: null,
    lyraBuiltCount: 0, finnBurnCount: 0, cieloRepairCount: 0, echoFindCount: 0,
    totalActs: 0, lastMajor: null, lastMajorChar: null,
    era: 'The First Days', eraIndex: 0,
    currentScene: 'dawn', sceneIntensity: 20,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONES
// ─────────────────────────────────────────────────────────────────────────────

export const ZONES = [
  'the Null District', 'the White Corridors', 'the Hollow',
  'the Far Sectors', 'the Dark Margin', 'the Cradle',
  'the Dust Protocol', 'the Outer Ring', 'the Deep Well',
  'the Fault Line', 'the High Pass', 'the Old Crossing',
  'the Narrow Gate', 'the Salt Plane', 'the Grey Basin',
  'the High Ground', 'the Burn Fields', 'the Still Water',
  'the Last Ridge', 'the Open Grid',
]

// Each zone has a feel — woven naturally into prose so every place reads differently
const ZONE_LORE: Record<string, string> = {
  'the Null District':   'a stretch of unclaimed signal-space where old data sits between ownership cycles',
  'the White Corridors': 'a long archive sector where the scribes keep Normia\'s indexes in careful order',
  'the Hollow':          'a low-throughput zone where transmissions pool and stall — slow to change, slow to clear',
  'the Far Sectors':     'the outermost fringe of the grid, barely tracked by the central relay system',
  'the Dark Margin':     'unmapped territory at the edge of Normia — no faction has ever held clean signal here',
  'the Cradle':          'where new presences first appear in the system, raw and still finding their signal range',
  'the Dust Protocol':   'a decommissioned zone running on old firmware nobody ever patched — its logic is strange',
  'the Outer Ring':      'the buffer layer between central Normia and the marginal zones — everything passes through eventually',
  'the Deep Well':       'a high-volume sector pushing heavy loads through infrastructure that was not built for it',
  'the Fault Line':      'where two zone boundaries overlap and the ownership signal has been disputed for three eras',
  'the High Pass':       'the primary routing corridor — most cross-zone traffic moves through here',
  'the Old Crossing':    'the oldest active junction in the grid, still in use because nothing better was ever built',
  'the Narrow Gate':     'a chokepoint zone — whoever holds the signal here sees most of what crosses the map',
  'the Salt Plane':      'flat, exposed, and harder to hold than it looks — every act here reads clearly from a distance',
  'the Grey Basin':      'a mid-grid zone with no dominant claim across multiple eras — always contested, never settled',
  'the High Ground':     'an elevated relay node with better coverage into every adjacent sector',
  'the Burn Fields':     'a zone carrying the signatures of major destructions from earlier eras — still scarred in places',
  'the Still Water':     'so quiet that anything placed here stands out immediately against the flat signal background',
  'the Last Ridge':      'the outermost edge sector, barely populated, barely mapped — Echo returns here regularly',
  'the Open Grid':       'the central sector of Normia — any major act here is visible across the whole system',
}

function zoneFor(tokenId: bigint): string {
  const h = Number((tokenId * 2654435761n) & 0xFFFFFFFFn)
  return ZONES[h % ZONES.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// ERAS
// ─────────────────────────────────────────────────────────────────────────────

export const ERAS = [
  { threshold: 0,    name: 'The First Days',   eraIndex: 0 },
  { threshold: 100,  name: 'The Waking',       eraIndex: 1 },
  { threshold: 300,  name: 'The Gathering',    eraIndex: 2 },
  { threshold: 700,  name: 'The Age of Claim', eraIndex: 3 },
  { threshold: 1500, name: 'The Long Work',    eraIndex: 4 },
  { threshold: 3000, name: 'What Holds',       eraIndex: 5 },
  { threshold: 5000, name: 'The Old Country',  eraIndex: 6 },
  { threshold: 8000, name: 'The Long Memory',  eraIndex: 7 },
]

function getEraData(count: number) {
  let era = ERAS[0]
  for (const e of ERAS) { if (count >= e.threshold) era = e }
  return era
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function seedN(tokenId: bigint, blockNumber: bigint, salt = 0): number {
  return Number((tokenId * 31n + blockNumber * 17n + BigInt(salt)) % 100000n)
}
function pick<T>(arr: T[], s: number): T { return arr[Math.abs(s) % arr.length] }

// One-sentence world state — threaded into every body to maintain continuity
function worldLine(w: GridWorld): string {
  if (w.finnBurnedLyraZone && !w.lyraReclaimedZone)
    return `${w.finnBurnedLyraZone} still carries the scar from Finn's burn — Lyra has not come back to it yet.`
  if (w.lyraReclaimedZone)
    return `Lyra rebuilt in ${w.lyraReclaimedZone} after Finn burned it. She came back. That says something.`
  if (w.finnBurnCount > w.lyraBuiltCount)
    return `Finn has burned more zones than Lyra has built — the grid is lighter than it was, and not everyone agrees that is a good thing.`
  if (w.lyraZones.length > 4)
    return `Lyra now holds signal across ${w.lyraZones.length} sectors. The shape of what she is building is starting to show itself.`
  if (w.cieloZones.length > 3)
    return `Cielo is the one holding the grid together right now — she is actively tending ${w.cieloZones.length} zones that would otherwise go dark.`
  if (w.lyraBuiltCount === 0)
    return `The grid is still open. Nothing has been claimed. The five have not yet begun to define the map.`
  return `Lyra has built in ${w.lyraBuiltCount} sector${w.lyraBuiltCount !== 1 ? 's' : ''}. Finn has burned ${w.finnBurnCount}. The distance between those two numbers is what Cielo is managing.`
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT TYPES
// ─────────────────────────────────────────────────────────────────────────────

type BeatType =
  | 'LYRA_BUILDS'      // Lyra extends her domain
  | 'LYRA_RETURNS'     // Lyra rebuilds in a zone Finn burned
  | 'LYRA_MAJOR'       // High-volume Lyra build — a structural moment
  | 'FINN_BURNS'       // Finn burns in open territory
  | 'FINN_BURNS_LYRA'  // Finn burns in Lyra's territory — the central conflict
  | 'CIELO_TENDS'      // Cielo maintains a zone
  | 'CIELO_AFTER_FINN' // Cielo tends a zone Finn burned
  | 'CAST_WITNESSES'   // Cast records what is happening
  | 'CAST_RETURNS'     // Cast comes back after a long absence
  | 'ECHO_ARRIVES'     // Echo appears from the outer zones
  | 'ECHO_FINDS'       // Echo discovers something at the far margin
  | 'CONVERGENCE'      // Two events in the same block
  | 'ERA_SHIFT'        // Era threshold crossed
  | 'VIGIL'            // Approaching an era threshold
  | 'LONG_DARK'        // Long block gap — silence in the chain
  | 'FIRST_LIGHT'      // The very first events in the record
  | 'CHECKPOINT'       // Every 25 acts — the Cast reads the map

// ─────────────────────────────────────────────────────────────────────────────
// BEAT SELECTION
// ─────────────────────────────────────────────────────────────────────────────

function selectBeat(
  event: IndexedEvent,
  charKey: CharacterKey,
  index: number,
  allEvents: IndexedEvent[],
  cumCount: number,
  prev: IndexedEvent | null,
  world: GridWorld,
  ownerHistory: Map<string, number[]>,
): BeatType {
  const zone = zoneFor(event.tokenId)
  const count = Number(event.count)

  // Rhythm and era beats — highest priority
  if (cumCount > 0 && cumCount % 25 === 0) return 'CHECKPOINT'
  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'ERA_SHIFT'
  const nextEra = ERAS.find(e => e.threshold > cumCount)
  if (nextEra && nextEra.threshold - cumCount <= 3) return 'VIGIL'

  // Long silence
  if (prev && (event.blockNumber - prev.blockNumber) > 40000n) return 'LONG_DARK'

  // Simultaneous block
  if (prev && prev.blockNumber === event.blockNumber) return 'CONVERGENCE'

  // Opening acts
  if (cumCount <= 5) return 'FIRST_LIGHT'

  // Character-specific beats driven by world state
  if (charKey === 'VOSS') {
    return world.lyraZones.includes(zone) ? 'FINN_BURNS_LYRA' : 'FINN_BURNS'
  }
  if (charKey === 'LYRA') {
    if (world.finnBurned.includes(zone)) return 'LYRA_RETURNS'
    if (count >= 100) return 'LYRA_MAJOR'
    return 'LYRA_BUILDS'
  }
  if (charKey === 'SABLE') {
    return world.finnBurned.includes(zone) ? 'CIELO_AFTER_FINN' : 'CIELO_TENDS'
  }
  if (charKey === 'CAST') {
    // CAST_RETURNS: Cast was away a long time — the gap logic in getCharacter already
    // identified this wallet as a veteran returning. Alternate so not every Cast is a "return."
    const prior = ownerHistory.get(event.owner) ?? []
    const castGap = prior.length > 0 ? index - prior[prior.length - 1] : 0
    return castGap > 20 ? 'CAST_RETURNS' : 'CAST_WITNESSES'
  }
  if (charKey === 'ECHO') {
    return world.echoFindCount > 0 && world.echoFindCount % 3 === 0 ? 'ECHO_FINDS' : 'ECHO_ARRIVES'
  }
  return 'LYRA_BUILDS'
}


// ─────────────────────────────────────────────────────────────────────────────
// PROSE BODIES
//
// Voice:   The Cast narrating Normia's grid — a living cyberspace of signal,
//          zones, burns, and territory. Future-fantasy tone: grounded but strange.
// Rules:   First sentence = what happened. Middle = why it matters.
//          End = what it sets up. Each body references world memory naturally.
// Memory:  Zone names, prior acts, and character relationships thread through
//          every template — readers can follow the story without a summary.
// ─────────────────────────────────────────────────────────────────────────────

interface BodyCtx {
  zone: string
  lore: string
  world: GridWorld
  count: number
  seed: number
  prevChar: CharacterKey | null
}

// ── LYRA BUILDS ──────────────────────────────────────────────────────────────
function bodyLyraBuilds(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => {
      const mem = w.finnBurnedLyraZone
        ? `Finn burned ${w.finnBurnedLyraZone} — Lyra registered it and kept moving. She bends around damage without stopping.`
        : w.lyraBuiltCount > 3
          ? `She has now laid signal in ${w.lyraBuiltCount} sectors of the grid. The shape she is drawing is getting harder to miss.`
          : w.cieloLastZone
            ? `Cielo has been holding the signal in ${w.cieloLastZone} steady. That stability is what lets Lyra keep pushing outward.`
            : `The grid around her is still open. She is building into it carefully, one node at a time.`
      return `Lyra pushed a new layer of signal into ${c.zone} — ${c.lore}. ${mem} This piece is not a standalone move. It is load-bearing for something further along — every node she places here connects backward through every earlier placement.`
    },
    () => {
      const thread = w.echoLastZone
        ? `Echo has been ranging through ${w.echoLastZone} out at the margins. His movements and her builds are slowly converging toward the same part of the map. Neither has acknowledged it yet.`
        : w.lyraBuiltCount > 5
          ? `She has been at this across ${w.lyraBuiltCount} sectors now. The accumulation looks deliberate. It is.`
          : `The zone was quiet before this. She chose it for reasons that will make sense once more pieces are down.`
      return `${c.zone} now carries Lyra's signal — ${c.lore}. ${thread} The architecture she is building only reads as one thing when you look at all of it together. That is intentional.`
    },
    () => {
      const conflict = w.finnBurnedLyraZone
        ? `Finn burned ${w.finnBurnedLyraZone}. Lyra is building around that scar, not into it — she routes past the damage rather than through it.`
        : `No one has touched her work this cycle. She is operating on her own terms.`
      return `Another signal layer from Lyra in ${c.zone}. The zone is ${c.lore}. ${conflict} ${worldLine(w)}`
    },
    () => {
      const edge = w.cieloLastZone
        ? `Cielo has been keeping the boundary signal stable in ${w.cieloLastZone} — without that tending work, the sectors Lyra moved through earlier would already be fraying at the edges.`
        : `The sectors she passed through before this one are holding so far, but they will need tending before long.`
      return `Lyra extended her build-chain into ${c.zone}. ${c.lore}. ${edge} Piece by piece. This is the only way she knows how to build something that lasts.`
    },
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── LYRA RETURNS ─────────────────────────────────────────────────────────────
function bodyLyraReturns(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => `${c.zone} was burned by Finn. Lyra came back and rebuilt it anyway. The zone is ${c.lore}. She did not announce the return — she placed the signal again as if the burn was a question and this is the answer. The grid holds her mark again. Finn will see it in the record.`,
    () => {
      const finn = w.finnLastZone
        ? `Finn's signal was last read near ${w.finnLastZone}. She is not waiting to see what he does next.`
        : `Finn has not moved since the burn. Lyra is not waiting.`
      return `The rebuild in ${c.zone} is complete. Lyra placed new signal over the ground Finn cleared. ${finn} The zone is ${c.lore}. ${worldLine(w)} She came back. That is not a small thing.`
    },
    () => `Lyra rebuilt in ${c.zone} after Finn burned it — ${c.lore}. This is the third time in the record that she has come back after a burn. Each time the structure returns slightly different. She does not simply repeat herself. She adjusts. ${worldLine(w)}`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── LYRA MAJOR ───────────────────────────────────────────────────────────────
function bodyLyraMajor(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => {
      const conflict = w.finnBurnedLyraZone
        ? `Finn burned ${w.finnBurnedLyraZone} before this. What Lyra just placed in ${c.zone} is larger than what he destroyed — she built around the scar and came out ahead of it.`
        : `No one has challenged her work this cycle. This build landed entirely on her terms.`
      return `Lyra placed the largest signal-structure of the current era into ${c.zone} — ${c.lore}. ${conflict} This is where the smaller placements were pointing. The architecture is visible now as a single thing, not a sequence of separate decisions. The Cast flagged this entry.`
    },
    () => `A major build from Lyra in ${c.zone}. The zone is ${c.lore}. The volume she committed here crosses from incremental into structural — this is no longer another layer, it is a claim. ${worldLine(w)} The Cast noted the activity spike across the grid. Finn will find it in the record.`,
    () => {
      const trail = [
        w.finnBurnedLyraZone ? `Finn burned ${w.finnBurnedLyraZone}` : null,
        w.echoLastZone ? `Echo surfaced something in ${w.echoLastZone}` : null,
        w.cieloLastZone ? `Cielo has been holding ${w.cieloLastZone}` : null,
      ].filter(Boolean).join(', ')
      return `Lyra's major build in ${c.zone} is the convergence of signal she has been staging across ${w.lyraBuiltCount} sectors. ${trail ? `It follows ${trail}.` : ``} Everything she placed before this was load-bearing for what just went up. The shape is legible now to anyone reading the full map.`
    },
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── FINN BURNS ───────────────────────────────────────────────────────────────
function bodyFinnBurns(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => {
      const after = w.cieloLastZone
        ? `Cielo has been tending ${w.cieloLastZone}. She will likely come through this zone next — she follows the burns the way she follows everything else Finn does.`
        : `There is no one tending this part of the grid right now. Whatever the burn leaves open will drift unless someone comes through.`
      return `Finn burned near ${c.zone}. The zone is ${c.lore}. A burn is not a restructure — it is a permanent removal from the grid. Whatever signal was held there does not come back. ${after} ${worldLine(w)}`
    },
    () => `A burn registered near ${c.zone} — ${c.lore}. This is what Finn does: he finds signal that has stopped earning its place in the grid and removes it forever. He has done this ${w.finnBurnCount} time${w.finnBurnCount !== 1 ? 's' : ''} in the record now. Each burn is final. Each one makes the grid lighter. Whether that is a good thing depends on what you believe Normia is for.`,
    () => {
      const lyra = w.lyraLastZone
        ? `Lyra's most recent build is in ${w.lyraLastZone}. Finn has not moved on it yet. He is either watching, or he does not see it as calcified enough yet.`
        : `There is no active Lyra signal nearby. Finn is working his own logic here, not responding to anyone else's.`
      return `Finn cleared signal near ${c.zone} — ${c.lore}. ${lyra} The grid records the absence now. Open space where something was. ${worldLine(w)}`
    },
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── FINN BURNS LYRA ──────────────────────────────────────────────────────────
function bodyFinnBurnsLyra(c: BodyCtx): string {
  const w = c.world
  const nth = w.finnBurnCount === 1 ? 'first' : w.finnBurnCount === 2 ? 'second' : w.finnBurnCount === 3 ? 'third' : `${w.finnBurnCount}th`
  const variants = [
    () => {
      const cielo = w.cieloLastZone
        ? `Cielo has been maintaining ${w.cieloLastZone}. She will likely come through the burned zone — she does not let these scars sit unattended for long.`
        : `No one is tending the edges here. The scar will widen if someone does not come through.`
      return `Finn burned in ${c.zone} — and ${c.zone} was Lyra's. She had built there. That signal is gone, reduced to open grid. This is the central tension of the record in its plainest form: she builds signal, he burns it. ${c.zone} is ${c.lore}. ${cielo} What Lyra does next is the question the Cast is watching for.`
    },
    () => `The burn landed in ${c.zone}, which Lyra had marked as hers. He does not target her specifically — he targets signal that has calcified past its useful life, and hers had been there long enough to qualify. The zone is ${c.lore}. ${worldLine(w)} Lyra's next move will tell you something about the direction of this whole record.`,
    () => `${c.zone} burned. It was Lyra's. This is Finn's ${nth} burn in territory she built. The zone is ${c.lore}. The scar is in the chain now — it will show up in every subsequent read of the grid. ${worldLine(w)} Whether she rebuilds here or redirects her signal elsewhere is the question that carries forward from this entry.`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── CIELO TENDS ──────────────────────────────────────────────────────────────
function bodyCieloTends(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => {
      const context = w.finnBurnedLyraZone
        ? `Finn burned ${w.finnBurnedLyraZone} recently. Cielo came through ${c.zone} after — she works the edges of what the big events leave behind, holding the signal that would otherwise collapse into whatever gap they opened.`
        : `No major event has hit this sector. She is doing preventive work — maintaining the signal before it frays, not after.`
      return `Cielo ran a maintenance pass through ${c.zone} — ${c.lore}. ${context} She found a signal layer starting to degrade and held it before it could fall off the grid. Nobody asked her to. That is how she operates.`
    },
    () => {
      const lyra = w.lyraLastZone
        ? `Lyra's most recent build is in ${w.lyraLastZone}. What Cielo maintains here is part of the same signal layer — without this work, Lyra's build would lose its connection to the rest of the grid eventually.`
        : `Lyra has not built recently. Cielo is maintaining the signal that already exists, keeping the map from quietly contracting.`
      return `Cielo worked through ${c.zone}. The zone is ${c.lore}. ${lyra} The detail work — patching signal layers, stabilizing edge connections, holding claims that are starting to lapse — does not generate large entries in the record. It prevents the entries that would appear if it were not done.`
    },
    () => `Cielo returned to ${c.zone} and found it needed work again. The zone is ${c.lore}. She has now tended ${w.cieloRepairCount} sectors across the record. None of them have gone dark on her watch. ${worldLine(w)}`,
    () => {
      const hold = w.cieloZones.length > 1
        ? `She is also holding signal in ${w.cieloZones[w.cieloZones.length - 2]}. The two zones share a boundary layer — what she does in one affects the stability of the other.`
        : `This is her first recorded pass through this sector.`
      return `Cielo tended ${c.zone}. ${hold} The zone is ${c.lore}. She keeps a running list of which sectors are drifting toward instability. ${c.zone} has been on it. Now it is not.`
    },
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── CIELO AFTER FINN ─────────────────────────────────────────────────────────
function bodyCieloAfterFinn(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => {
      const lyra = w.lyraLastZone
        ? `Lyra's signal in ${w.lyraLastZone} borders this zone. What Cielo is doing here protects that adjacent signal too, though Lyra may not know it yet.`
        : `There is no nearby Lyra signal to protect. Cielo is tending the burned zone for its own sake — because something that was there deserves to have someone hold its edges.`
      return `${c.zone} was burned by Finn. Cielo came through it afterward. The zone is ${c.lore}. She is not rebuilding what he destroyed — she is stabilizing the edges, holding the adjacent signal from collapsing into the gap he left. ${lyra}`
    },
    () => `Cielo is working the edges of ${c.zone} after Finn burned it — ${c.lore}. Finn opens things. Cielo holds the perimeter so the opening does not become a tear in the grid. ${worldLine(w)} This is how the three of them function in sequence: Lyra builds, Finn burns, Cielo holds what remains.`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── CAST WITNESSES ───────────────────────────────────────────────────────────
function bodyCastWitnesses(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => {
      const recent = w.lastMajor
        ? `The last major event in the record was ${w.lastMajor.charName} — ${w.lastMajor.act} in ${w.lastMajor.zone}. The Cast was there for that too.`
        : `The record is still forming its early shape. The Cast is building the baseline.`
      return `The Cast moved through ${c.zone} and logged what it found — ${c.lore}. ${recent} It does not shape what it witnesses. It records it accurately and moves on. Another entry added to the chain.`
    },
    () => {
      const both = w.lyraLastZone && w.finnLastZone
        ? `Lyra's signal is in ${w.lyraLastZone}. Finn burned near ${w.finnLastZone}. The Cast has recorded both without adding its own interpretation of what they mean together.`
        : w.lyraLastZone
          ? `Lyra built in ${w.lyraLastZone}. The Cast is watching the sequence of her placements — the pattern is becoming visible.`
          : `The grid has been quiet. The Cast records quiet with the same precision it records action.`
      return `${c.zone}: the Cast added another entry. ${both} Its log now spans ${w.totalActs} recorded acts, each one linked to the one before it. No other account of this grid is this complete.`
    },
    () => `The Cast witnessed activity in ${c.zone} — ${c.lore}. ${worldLine(w)} The Cast does not report to any faction. Its record is more complete than anything the sector councils maintain, and it answers to none of them.`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── CAST RETURNS ─────────────────────────────────────────────────────────────
function bodyCastReturns(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => {
      const gap = w.lastMajor
        ? `While it was away, ${w.lastMajor.charName} — ${w.lastMajor.act} in ${w.lastMajor.zone}. The Cast is working that into the record now, backfilling through the gap.`
        : `The record shows a visible gap. The Cast is filling it in from what it can read in the chain.`
      return `The Cast returned to ${c.zone} after an absence from the log. ${gap} The grid shifted in the time between entries. From here the record continues forward.`
    },
    () => `The Cast came back to ${c.zone}. It was gone long enough for the grid to change shape — ${worldLine(w)} It treats the gap as its own kind of data: what happened while nothing was being logged is evidence too, just harder to read. The record now shows both the absence and the return.`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── ECHO ARRIVES ─────────────────────────────────────────────────────────────
function bodyEchoArrives(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => {
      const trigger = w.lastMajor
        ? `${w.lastMajor.charName} just made a significant move in ${w.lastMajor.zone}. Echo's arrival in ${c.zone} may be reading the signal that sent out to the edges — that is how he navigates, tracking what the center disturbs at the margins.`
        : `Nobody predicted this arrival. Echo rarely announces.`
      return `Echo registered in ${c.zone} — ${c.lore}. ${trigger} He works inward from the grid's outer fringe, which is the opposite of how most signal flows. What he finds at the margins ends up in the record, usually at the moment it becomes relevant to what the others are doing.`
    },
    () => {
      const central = w.lyraLastZone || w.finnLastZone
        ? `While ${w.lyraLastZone ? `Lyra lays signal in ${w.lyraLastZone}` : ''}${w.lyraLastZone && w.finnLastZone ? ' and ' : ''}${w.finnLastZone ? `Finn burns near ${w.finnLastZone}` : ''}, Echo is ranging through the parts of the grid that central activity does not reach.`
        : `The central sectors are quieter than usual. Echo works the outer zones regardless.`
      return `Echo appeared in ${c.zone}. The zone is ${c.lore}. ${central} What sits at the edges of the map is different from what the central routing shows. Echo has been building a record of those differences, sector by sector.`
    },
    () => {
      const prior = w.echoLastZone
        ? `His last registered move was in ${w.echoLastZone}. This arrival in ${c.zone} is either following that thread or beginning a new one — with Echo, those two things are hard to separate.`
        : `This is his first registered appearance in the outer sectors. He has been moving before this — just not through zones the main log was tracking.`
      return `Echo crossed into ${c.zone} from the outer grid. ${prior} The zone is ${c.lore}. He logged his presence and flagged something in the chain. What he found will matter before long. It always does.`
    },
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── ECHO FINDS ───────────────────────────────────────────────────────────────
function bodyEchoFinds(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => {
      const lyra = w.lyraLastZone
        ? `Lyra's build sequence is running through ${w.lyraLastZone}. What Echo surfaced in ${c.zone} sits in the same signal layer — she may be building toward something she does not know is already there.`
        : `No active Lyra signal nearby. What Echo found has been sitting undisturbed in the outer grid, unread by any of the others.`
      return `Echo pulled something out of ${c.zone} that was not in any current map — ${c.lore}. An old signal-registration, buried in the base layer, predating the current era's claims. He logged it without filing a formal report. ${lyra} The Cast has it in the chain now.`
    },
    () => `In ${c.zone}, Echo found what he has been tracing through the outer sectors: a gap between what the grid map shows and what is actually registered in the base layer. The zone is ${c.lore}. He documented it and moved on. ${worldLine(w)} What anyone does with that information is their own choice.`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── CONVERGENCE ──────────────────────────────────────────────────────────────
function bodyConvergence(c: BodyCtx): string {
  const other = c.prevChar ? CHARACTERS[c.prevChar].name : 'another presence'
  const variants = [
    () => `Two events registered in the same block — ${c.zone} and a separate zone, simultaneously. ${other} was moving at the same moment. No coordination. The grid logged both as concurrent. These moments are rare in the chain. ${worldLine(c.world)}`,
    () => `The Cast logged two simultaneous registrations: one in ${c.zone}, one elsewhere, the same instant in the chain. Whether they are related is not recorded. That the grid logged them together is. ${worldLine(c.world)}`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── ERA SHIFT ────────────────────────────────────────────────────────────────
function bodyEraShift(c: BodyCtx): string {
  const w = c.world
  const trail = [
    w.lyraLastZone ? `Lyra last built in ${w.lyraLastZone}` : null,
    w.finnLastZone ? `Finn last burned near ${w.finnLastZone}` : null,
    w.cieloLastZone ? `Cielo has been holding ${w.cieloLastZone}` : null,
    w.echoLastZone ? `Echo last surfaced in ${w.echoLastZone}` : null,
  ].filter(Boolean).join('. ')
  const variants = [
    () => `The grid crossed into ${w.era}. The act count hit the threshold and the era designation updated across every zone log in the system. ${trail ? trail + '.' : ''} Everything the five have done in the prior era carries forward into this one. The new era opens with that full history already written into the base layer of the grid.`,
    () => `${w.era}. The counter turned. This is not ceremonial — the designation changes how the sector councils weight old signal-claims against new ones. Marks registered before the shift are now prior-era entries and sit in a different layer of the grid. ${w.lyraBuiltCount > 0 ? `Lyra has ${w.lyraBuiltCount} registered marks that just became prior-era data. That changes how contestable they are.` : ''} The Cast logged the transition. The five keep moving.`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── VIGIL ─────────────────────────────────────────────────────────────────────
function bodyVigil(c: BodyCtx): string {
  const w = c.world
  const variants = [
    () => `The grid is a few acts from the next era threshold. The count is close. ${w.lyraLastZone ? `Lyra's signal in ${w.lyraLastZone}` : 'The current marks on the map'} will cross into prior-era status when the counter turns. ${worldLine(w)} What the five do in these final acts is what the new era inherits as its starting condition.`,
    () => `Close to the boundary between ${w.era} and what follows it. ${w.lyraLastZone ? `Lyra built in ${w.lyraLastZone}.` : ''} ${w.finnLastZone ? ` Finn burned near ${w.finnLastZone}.` : ''} These are the last moves logged under the current designation. The Cast is watching the counter.`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── LONG DARK ────────────────────────────────────────────────────────────────
function bodyLongDark(c: BodyCtx): string {
  const w = c.world
  const standing = [
    w.lyraLastZone ? `Lyra's signal in ${w.lyraLastZone} held through the silence` : null,
    w.finnLastZone ? `the open ground near ${w.finnLastZone} stayed unbuilt` : null,
  ].filter(Boolean).join('. ')
  const variants = [
    () => `A long gap opened in the chain. The grid kept running — the zones held their signal, the routing continued — but none of the five left a new mark. ${standing ? standing + '.' : ''} The Cast documented the silence as its own entry. An absence in the chain is still information. The sequence resumes now.`,
    () => `The gap between events stretched further than usual. In the quiet, the grid shifted on its own — old signal drifting, claims quietly fading into the base layer, things decaying without any of the five involved. ${worldLine(w)} Whatever breaks a long dark carries the weight of everything that waited. This is that act.`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── FIRST LIGHT ──────────────────────────────────────────────────────────────
function bodyFirstLight(c: BodyCtx): string {
  const variants = [
    () => `A first signal registered near ${c.zone} — ${c.lore}. The Cast logged it without interpretation, just the fact: something is active in this part of the grid that was not active before. The record is still early. Any single act here could shape what the whole chain becomes.`,
    () => `The record is opening. The first marks are going into the grid — ${c.zone}, ${c.lore}. Right now it is still early enough that none of the patterns are set. The five are beginning. Lyra's first entry looked like this. So did Finn's.`,
    () => `${c.zone} received signal for the first time in the record — ${c.lore}. Normia's grid does not begin all at once. It begins with single marks, placed by presences that have decided to act. This is one of them.`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// ── CHECKPOINT ───────────────────────────────────────────────────────────────
function bodyCheckpoint(c: BodyCtx): string {
  const w = c.world
  const state = [
    w.lyraLastZone ? `Lyra: last built in ${w.lyraLastZone}` : 'Lyra: no build yet',
    w.finnLastZone ? `Finn: last burned near ${w.finnLastZone}` : 'Finn: no burn yet',
    w.cieloLastZone ? `Cielo: tending ${w.cieloLastZone}` : null,
    w.echoLastZone ? `Echo: last seen in ${w.echoLastZone}` : null,
  ].filter(Boolean).join('. ')
  const variants = [
    () => `${w.totalActs} acts in the record. The Cast reads the state of the grid. ${state}. ${worldLine(w)} The next stretch of the record will be shaped by whichever of those threads gets pulled on first.`,
    () => `A checkpoint in the chain. The record now holds ${w.totalActs} acts — ${w.lyraBuiltCount} Lyra builds, ${w.finnBurnCount} Finn burns, ${w.cieloRepairCount} Cielo maintenance passes, ${w.echoFindCount} Echo sightings. ${worldLine(w)} The cumulative effect of all of that is what Normia's grid looks like right now.`,
  ]
  return variants[Math.abs(c.seed) % variants.length]()
}

// Body dispatcher
function generateBody(beat: BeatType, ctx: BodyCtx): string {
  switch (beat) {
    case 'LYRA_BUILDS':      return bodyLyraBuilds(ctx)
    case 'LYRA_RETURNS':     return bodyLyraReturns(ctx)
    case 'LYRA_MAJOR':       return bodyLyraMajor(ctx)
    case 'FINN_BURNS':       return bodyFinnBurns(ctx)
    case 'FINN_BURNS_LYRA':  return bodyFinnBurnsLyra(ctx)
    case 'CIELO_TENDS':      return bodyCieloTends(ctx)
    case 'CIELO_AFTER_FINN': return bodyCieloAfterFinn(ctx)
    case 'CAST_WITNESSES':   return bodyCastWitnesses(ctx)
    case 'CAST_RETURNS':     return bodyCastReturns(ctx)
    case 'ECHO_ARRIVES':     return bodyEchoArrives(ctx)
    case 'ECHO_FINDS':       return bodyEchoFinds(ctx)
    case 'CONVERGENCE':      return bodyConvergence(ctx)
    case 'ERA_SHIFT':        return bodyEraShift(ctx)
    case 'VIGIL':            return bodyVigil(ctx)
    case 'LONG_DARK':        return bodyLongDark(ctx)
    case 'FIRST_LIGHT':      return bodyFirstLight(ctx)
    case 'CHECKPOINT':       return bodyCheckpoint(ctx)
    default:                 return bodyLyraBuilds(ctx)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADLINES
// ─────────────────────────────────────────────────────────────────────────────

function makeHeadline(beat: BeatType, zone: string, world: GridWorld, seed: number): string {
  const p = (arr: string[]) => pick(arr, seed)
  switch (beat) {
    case 'LYRA_BUILDS':      return p([`Lyra Extends into ${zone}`, `New Signal in ${zone} — Lyra`, `${zone}: Another Layer Down`, `The Build Continues at ${zone}`])
    case 'LYRA_RETURNS':     return p([`Lyra Comes Back to ${zone}`, `The Rebuild at ${zone}`, `She Returned — ${zone} Holds Again`])
    case 'LYRA_MAJOR':       return p([`Lyra's Major Build in ${zone}`, `The Architecture Shows Itself`, `A Full Signal-Claim in ${zone}`])
    case 'FINN_BURNS':       return p([`Finn Burns Near ${zone}`, `Signal Removed — ${zone}`, `A Burn at ${zone}`])
    case 'FINN_BURNS_LYRA':  return p([`Finn Burns ${zone} — It Was Lyra's`, `The Conflict Lands in ${zone}`, `${zone} Cleared — Lyra's Work Is Gone`])
    case 'CIELO_TENDS':      return p([`Cielo Tends ${zone}`, `${zone} Maintained`, `Quiet Work in ${zone}`])
    case 'CIELO_AFTER_FINN': return p([`Cielo Follows the Burn into ${zone}`, `After Finn: Cielo in ${zone}`, `Holding the Edge at ${zone}`])
    case 'CAST_WITNESSES':   return p([`The Cast Logs ${zone}`, `Record Entry: ${zone}`, `${zone} Added to the Chain`])
    case 'CAST_RETURNS':     return p([`The Cast Returns`, `Record Resumed`, `The Witness Is Back`])
    case 'ECHO_ARRIVES':     return p([`Echo Arrives in ${zone}`, `Outer-Grid Signal — Echo`, `${zone}: Echo Appears`])
    case 'ECHO_FINDS':       return p([`Echo Finds Something in ${zone}`, `Old Signal Surfaced in ${zone}`, `A Discovery at the Margin`])
    case 'CONVERGENCE':      return p([`Two Events, Same Block`, `Simultaneous Registration`, `Convergence in the Chain`])
    case 'ERA_SHIFT':        return `The Grid Enters ${world.era}`
    case 'VIGIL':            return `Near the Threshold — ${world.era} Ending`
    case 'LONG_DARK':        return p([`A Long Silence in the Chain`, `Extended Gap — Record Resumes`, `The Chain Goes Dark`])
    case 'FIRST_LIGHT':      return p([`First Signal Near ${zone}`, `The Record Opens`, `A New Mark in ${zone}`])
    case 'CHECKPOINT':       return `${world.totalActs}-Act Read — The Cast Reviews`
    default:                 return `${zone}`
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS + LORE TYPES
// ─────────────────────────────────────────────────────────────────────────────

const BEAT_ICONS: Record<BeatType, string> = {
  LYRA_BUILDS: '▪', LYRA_RETURNS: '◈', LYRA_MAJOR: '◈',
  FINN_BURNS: '◆', FINN_BURNS_LYRA: '◆',
  CIELO_TENDS: '―', CIELO_AFTER_FINN: '―',
  CAST_WITNESSES: '○', CAST_RETURNS: '◉',
  ECHO_ARRIVES: '▿', ECHO_FINDS: '◈',
  CONVERGENCE: '⊕', ERA_SHIFT: '║', VIGIL: '◦',
  LONG_DARK: '◌', FIRST_LIGHT: '→', CHECKPOINT: '▣',
}

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

const BEAT_LORE: Record<BeatType, LoreType> = {
  LYRA_BUILDS: 'MARK_MADE', LYRA_RETURNS: 'PIVOT', LYRA_MAJOR: 'SIGNAL_SURGE',
  FINN_BURNS: 'DEPARTURE', FINN_BURNS_LYRA: 'CONTESTED_ZONE',
  CIELO_TENDS: 'THE_STEADY', CIELO_AFTER_FINN: 'THE_STEADY',
  CAST_WITNESSES: 'NIGHTWATCH', CAST_RETURNS: 'RETURN',
  ECHO_ARRIVES: 'FAR_SIGNAL', ECHO_FINDS: 'RELIC_FOUND',
  CONVERGENCE: 'CONVERGENCE', ERA_SHIFT: 'ERA_SHIFT', VIGIL: 'VIGIL',
  LONG_DARK: 'LONG_DARK', FIRST_LIGHT: 'FIRST_LIGHT', CHECKPOINT: 'THE_READING',
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE TYPE
// ─────────────────────────────────────────────────────────────────────────────

function sceneFor(charKey: CharacterKey, beat: BeatType): SceneType {
  if (beat === 'ERA_SHIFT') return 'reckoning'
  if (beat === 'CONVERGENCE') return 'convergence'
  if (beat === 'LONG_DARK') return 'quiet'
  if (beat === 'FIRST_LIGHT') return 'dawn'
  if (beat === 'FINN_BURNS' || beat === 'FINN_BURNS_LYRA') return 'destruction'
  if (beat === 'LYRA_RETURNS' || beat === 'LYRA_MAJOR') return 'construction'
  if (charKey === 'LYRA') return 'construction'
  if (charKey === 'VOSS') return 'sacrifice'
  if (charKey === 'CAST') return 'vigil'
  if (charKey === 'SABLE') return 'tending'
  if (charKey === 'ECHO') return 'arrival'
  return 'quiet'
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD UPDATE
// ─────────────────────────────────────────────────────────────────────────────

function updateWorld(world: GridWorld, charKey: CharacterKey, beat: BeatType, zone: string): void {
  world.totalActs++

  if (charKey === 'LYRA') {
    if (!world.lyraZones.includes(zone)) world.lyraZones.push(zone)
    world.lyraLastZone = zone
    world.lyraBuiltCount++
    if (beat === 'LYRA_RETURNS') {
      world.lyraReclaimedZone = zone
      world.lastMajor = { charName: 'Lyra', act: 'rebuilt after a burn in', zone }
      world.lastMajorChar = 'LYRA'
    }
    if (beat === 'LYRA_MAJOR') {
      world.lastMajor = { charName: 'Lyra', act: 'placed a major build in', zone }
      world.lastMajorChar = 'LYRA'
    }
  }

  if (charKey === 'VOSS') {
    if (!world.finnBurned.includes(zone)) world.finnBurned.push(zone)
    world.lyraZones = world.lyraZones.filter(z => z !== zone)
    world.finnLastZone = zone
    world.finnBurnCount++
    if (beat === 'FINN_BURNS_LYRA') {
      world.finnBurnedLyraZone = zone
      world.contestedZone = zone
      world.lastMajor = { charName: 'Finn', act: 'burned Lyra\'s signal in', zone }
      world.lastMajorChar = 'VOSS'
    } else {
      world.lastMajor = { charName: 'Finn', act: 'burned near', zone }
      world.lastMajorChar = 'VOSS'
    }
  }

  if (charKey === 'SABLE') {
    if (!world.cieloZones.includes(zone)) world.cieloZones.push(zone)
    world.cieloLastZone = zone
    world.cieloRepairCount++
  }

  if (charKey === 'ECHO') {
    if (!world.echoZones.includes(zone)) world.echoZones.push(zone)
    world.echoLastZone = zone
    world.echoFindCount++
    if (beat === 'ECHO_FINDS') {
      world.lastMajor = { charName: 'Echo', act: 'surfaced old signal in', zone }
    }
  }

  world.currentScene = sceneFor(charKey, beat)
  world.sceneIntensity =
    ['LYRA_MAJOR', 'FINN_BURNS_LYRA', 'ERA_SHIFT', 'CONVERGENCE', 'LYRA_RETURNS'].includes(beat) ? 90 :
    ['FINN_BURNS', 'ECHO_FINDS', 'CAST_RETURNS', 'LONG_DARK'].includes(beat) ? 65 : 35
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCH LINE — one-line state shown above each entry in the UI
// ─────────────────────────────────────────────────────────────────────────────

function makeDispatch(world: GridWorld): string {
  if (world.finnBurnedLyraZone && !world.lyraReclaimedZone)
    return `${world.finnBurnedLyraZone} burned. Lyra has not come back for it yet.`
  if (world.lyraReclaimedZone)
    return `Lyra rebuilt in ${world.lyraReclaimedZone}. The comeback is in the record.`
  if (world.lyraBuiltCount === 0 && world.finnBurnCount === 0)
    return 'The grid is open. Nothing has been claimed.'
  const lz = world.lyraZones.length
  const fb = world.finnBurned.length
  if (fb > lz)
    return `Finn has burned ${fb} zone${fb !== 1 ? 's' : ''}. Lyra holds ${lz}. The grid is lighter than it was.`
  return `Lyra: ${lz} zone${lz !== 1 ? 's' : ''} built. Finn: ${fb} burned. Cielo tending ${world.cieloZones.length}.`
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface StoryEntry {
  id: string
  eventType: 'PixelsTransformed' | 'BurnRevealed' | 'genesis'
  loreType: LoreType
  era: string
  headline: string
  dispatch: string
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

function moodFor(scene: SceneType): NonNullable<StoryEntry['visualState']>['mood'] {
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
  const world = freshWorld()
  const ownerHistory = new Map<string, number[]>()
  let prevCharKey: CharacterKey | null = null


  for (let index = 0; index < events.length; index++) {
    const event = events[index]
    const cumCount = startCount + index + 1
    const prev = index > 0 ? events[index - 1] : null

    const eraData = getEraData(cumCount)
    world.era = eraData.name
    world.eraIndex = eraData.eraIndex

    const charKey = getCharacter(event, index, ownerHistory)
    const zone = zoneFor(event.tokenId)
    const lore = ZONE_LORE[zone] ?? 'a sector in the grid'
    const beat = selectBeat(event, charKey, index, events, cumCount, prev, world, ownerHistory)
    const seed = Number(seedN(event.tokenId, event.blockNumber))
    const bodySeed = Math.abs(seed ^ (index * 7919))

    const ctx: BodyCtx = { zone, lore, world, count: Number(event.count), seed: bodySeed, prevChar: prevCharKey }
    const headline = makeHeadline(beat, zone, world, seed)
    const body = generateBody(beat, ctx)

    const isFeatured = ['LYRA_MAJOR', 'FINN_BURNS_LYRA', 'LYRA_RETURNS', 'ERA_SHIFT',
      'CONVERGENCE', 'ECHO_FINDS', 'LONG_DARK', 'CHECKPOINT'].includes(beat)

    const scene = sceneFor(charKey, beat)
    const loreType = BEAT_LORE[beat]

    result.push({
      id: `${event.transactionHash}-${event.tokenId.toString()}`,
      eventType: event.type,
      loreType,
      era: eraData.name,
      headline,
      dispatch: makeDispatch(world),
      body,
      icon: BEAT_ICONS[beat] ?? '·',
      featured: isFeatured,
      activeCharacter: charKey,
      visualState: {
        mood: moodFor(scene),
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
        ruleApplied: `${CHARACTERS[charKey].name} — ${beat.toLowerCase().replace(/_/g, ' ')}`,
        ruleExplanation: `Token #${event.tokenId} → ${CHARACTERS[charKey].name} (${CHARACTERS[charKey].title}). Beat: ${beat}. Zone: ${zone}.`,
      },
    })

    // Update owner history after generating so this event counts for future ones
    const prior = ownerHistory.get(event.owner) ?? []
    ownerHistory.set(event.owner, [...prior, index])

    updateWorld(world, charKey, beat, zone)
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
    dispatch: 'The grid is open. Nothing has been claimed yet.',
    body: `Normia is a living grid — ten thousand presences distributed across twenty named signal-zones, each one capable of being built into, burned, tended, or abandoned. The zones have real character: some are ancient routing hubs carrying marks from eras nobody alive remembers, some are freshly opened territory, some sit at the far margins of the map where the central factions do not bother looking. The grid runs on what its inhabitants do with what they hold.\n\nFive presences have become the main actors in this record. They did not appoint themselves. They became significant through what they actually did, in full view of the chain.\n\nLyra builds. She has been laying signal-structure across Normia's sectors since before this record opened, working toward an architecture whose full shape has not yet come clear. Each placement she makes connects to the ones before it — this is not decoration, it is construction. Finn burns. He removes signal that has calcified past its useful life, believing that a grid which cannot be cleared cannot stay alive. The Cast witnesses and records everything; its log is the most complete account of Normia that exists, and it answers to no faction. Cielo tends what the others leave behind — repairing the edges, holding zones that would go dark without attention, keeping signal alive past its moment of notice. Echo works the outer margins, the sectors the central factions do not bother tracking, and what he finds there keeps turning out to matter more than anyone expected.\n\nWhat follows is the Cast's record of their actions, and the record of the grid those actions are building.`,
    activeCharacter: 'CAST',
    visualState: { mood: 'normal', intensity: 20, dominantZone: 'the Open Grid', signalName: 'The Cast', scene: 'dawn', charKey: 'CAST' },
    sourceEvent: { type: 'genesis', tokenId: '--', blockNumber: '--', txHash: '--', count: '--', ruleApplied: 'World Primer', ruleExplanation: 'The opening entry.' },
  },
]
