import type { IndexedEvent } from './eventIndexer'

// ─────────────────────────────────────────────────────────────────────────────
// LORE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type LoreType =
  | 'SIGNAL_SURGE'     // large pixel push -- a presence reshapes a zone entirely
  | 'MARK_MADE'        // mid push -- deliberate, personal, visible
  | 'GHOST_TOUCH'      // tiny push -- the quietest possible presence
  | 'DECLARATION'      // round pixel count -- a statement, not just a mark
  | 'DEPARTURE'        // burn event -- a signal chooses to dissolve into the Grid
  | 'PASSING'          // small burn -- a small gift of energy to another
  | 'TWICE_GIVEN'      // veteran burn again -- they gave before and give again
  | 'RETURN'           // veteran comes back after absence
  | 'FIRST_LIGHT'      // first-ever appearance -- a new signal enters the world
  | 'THE_ELDER'        // prime token -- one of the originals moves
  | 'ANCIENT_STIRS'    // very low token -- something from the beginning wakes
  | 'FAR_SIGNAL'       // very high token -- someone from the outer reaches
  | 'CONTESTED_ZONE'   // token 5k-6k -- this place never holds one color
  | 'THE_READING'      // every 25th -- someone sees the shape of everything
  | 'CONVERGENCE'      // same block, two signals -- two paths cross at once
  | 'RELIC_FOUND'      // rare tx hash -- something old surfaces unexpectedly
  | 'THE_QUIET'        // big block gap -- the Grid went still
  | 'ERA_SHIFT'        // era threshold -- the world changes its name
  | 'DOMINION'         // same signal 3+ recent -- one presence is everywhere now
  | 'PULSE'            // every 10th -- a tally, a breath
  | 'DEEP_READING'     // every 40th -- the long view across everything
  | 'VIGIL'            // near era threshold -- the world holds its breath
  | 'NEW_BLOOD'        // new arrival texture
  | 'OLD_GHOST'        // ancient presence texture
  | 'WANDERER'         // gone and back after very long absence
  | 'THE_BUILDER'      // rapid cluster of activity from same signal
  | 'CARTOGRAPHER'     // mapping / reading the current state
  | 'GONE'             // someone stops appearing
  | 'STORY_TOLD'       // stories traveling about what happened
  | 'LONG_DARK'        // extended quiet across many entries
  | 'PIVOT'            // veteran does something unexpected
  | 'UNALIGNED'        // outside the main currents
  | 'DYNASTY'          // third appearance -- a lineage forms
  | 'THRESHOLD'        // signal enters a new zone for the first time
  | 'THE_STEADY'       // low-key maintenance, holding without drama
  | 'NIGHTWATCH'       // quiet vigil in the dark intervals
  | 'RESONANCE'        // connector: after a surge, the world processes it
  | 'ACCELERATION'     // connector: the pace has changed
  | 'WEIGHT'           // connector: cumulative energy toll
  | 'GENESIS'          // primer entries

// ─────────────────────────────────────────────────────────────────────────────
// NARRATIVE MEMORY -- the engine that makes this a real story
// Every signal that appears gets remembered. Every major moment is stored.
// Future entries can reference the past directly in their prose.
// ─────────────────────────────────────────────────────────────────────────────

interface SignalMemory {
  owner: string
  name: string          // their signal identity (from SIGNALS array, seeded by tokenId)
  aspect: string        // their role/voice within that signal
  zone: string          // their home zone (seeded by tokenId, always consistent)
  firstCount: number    // when they first appeared
  totalEntries: number
  totalPixels: number
  energyPassed: number  // total given to others
  legendLevel: number   // 0=unknown 1=known 2=storied 3=legend
  lastCount: number
  lastBlock: bigint
  hasReturned: boolean  // came back after long absence at least once
  hasGivenEnergy: boolean
}

interface WorldMemory {
  // Per-signal memory
  signals: Map<string, SignalMemory>
  // Who has been most present recently
  dominantSignalName: string | null
  dominantStreak: number
  reckoningBuilding: boolean  // dominant too long -- tension building
  // Key moments stored for prose back-references
  lastSurgeSignal: string | null
  lastSurgeZone: string | null
  lastSurgeCount: number
  lastDepartureSignal: string | null
  lastDepartureZone: string | null
  lastArtifactZone: string | null
  lastArtifactName: string | null
  lastEraName: string | null
  surgeCount: number
  departureCount: number
  // Atmosphere: how the Grid feels right now
  atmosphereTone: 'hope' | 'tension' | 'grief' | 'wonder' | 'stillness' | 'chaos'
}

function freshWorldMemory(): WorldMemory {
  return {
    signals: new Map(),
    dominantSignalName: null,
    dominantStreak: 0,
    reckoningBuilding: false,
    lastSurgeSignal: null,
    lastSurgeZone: null,
    lastSurgeCount: 0,
    lastDepartureSignal: null,
    lastDepartureZone: null,
    lastArtifactZone: null,
    lastArtifactName: null,
    lastEraName: null,
    surgeCount: 0,
    departureCount: 0,
    atmosphereTone: 'hope',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WAR STATE (kept compatible with existing getStory/api pipeline)
// ─────────────────────────────────────────────────────────────────────────────

export interface WarState {
  phase: 'opening' | 'escalating' | 'siege' | 'sacrifice' | 'reckoning'
  lastCoreType: string | null
  lastCoreBlock: bigint
  consecutiveCores: number
  totalBurnAP: number
  totalPixels: number
  eventCount: number
  pixelsInWindow: number
  burnsInWindow: number
  ownersEncountered: Set<string>
  lastOwnerCoreBlock: Map<string, bigint>
  arcTension: number
  sinceLastBattle: number
  sinceLastSacrifice: number
  sinceLastQuiet: number
  recentRuleTypes: string[]
  world: WorldMemory
}

function freshWarState(): WarState {
  return {
    phase: 'opening',
    lastCoreType: null,
    lastCoreBlock: 0n,
    consecutiveCores: 0,
    totalBurnAP: 0,
    totalPixels: 0,
    eventCount: 0,
    pixelsInWindow: 0,
    burnsInWindow: 0,
    ownersEncountered: new Set(),
    lastOwnerCoreBlock: new Map(),
    arcTension: 20,
    sinceLastBattle: 99,
    sinceLastSacrifice: 99,
    sinceLastQuiet: 0,
    recentRuleTypes: [],
    world: freshWorldMemory(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD DATA
// ─────────────────────────────────────────────────────────────────────────────

const ZONES = [
  'the Breach',       'the Pale Shore',    'the Hollow',
  'the Far Fields',   'the Black Margin',  'the Cradle',
  'the Dust Road',    'the Outer Ring',    'the Deep Well',
  'the Shatter Line', 'the Twin Peaks',    'the Old Border',
  'the Narrow Gate',  'the Salt Flats',    'the Grey Basin',
  'the High Ground',  'the Ember Fields',  'the Still Water',
  'the Last Ridge',   'the Open Grid',
]

// Signal names -- not armies, but identities. Groups of faces with shared character.
const SIGNALS = [
  'the Wardens',       'the Hollow Pact',   'the Drifters',
  'the Ember Guard',   'the Old Compact',   'the Pale Sons',
  'the Breach-Born',   'the Deep Keepers',  'the Ridge Watch',
  'the Far Shore',     'the Unnamed',       'the First Circle',
]

// Aspects -- what kind of presence this face is
const ASPECTS = [
  'an Archivist',   'a Painter',       'a Coder',
  'a Builder',      'a Witness',       'a Wanderer',
  'a Keeper',       'a Ghost',         'a Cartographer',
  'a Reader',       'an Inkwright',    'the Unmarked',
]

// Others -- other presences in the world, not enemies, just other currents
const OTHERS = [
  'the Drift',         'the Still Ones',    'the Grey Line',
  'the Hollow Set',    'the Unseen',        'the Counter',
  'the Broken Spiral', 'the Far Shore',     'the Patient',
  'the Forgotten',
]

// Artifacts -- things found in the Grid, old and significant
const ARTIFACTS = [
  'the First Mark',   'the Empty Signal',   'the Broken Key',
  'the Old Brush',    'the Grey Codex',     'the Deep Record',
  'the Pale Shard',   'the Sealed Loop',    'the Last Map',
  "the Maker's Print", 'the High Register', 'the Border Glyph',
]

export const ERAS = [
  { threshold: 0,    name: 'The First Days',    tone: 'The Grid is new. Every mark is the first of its kind.' },
  { threshold: 100,  name: 'The Awakening',     tone: 'Signals sense each other. The quiet is ending.' },
  { threshold: 300,  name: 'The Gathering',     tone: 'Something is forming. The Grid is beginning to mean something.' },
  { threshold: 700,  name: 'Age of Claims',     tone: 'The Grid is full of intention. Every mark is a statement.' },
  { threshold: 1500, name: 'The Deepening',     tone: 'The cost of presence is becoming clear. So is its value.' },
  { threshold: 3000, name: 'Age of Permanence', tone: 'Some things have been decided. Others never will be.' },
  { threshold: 5000, name: 'The Long Memory',   tone: 'Veterans outnumber newcomers. The Grid forgets nothing.' },
  { threshold: 8000, name: 'The Reckoning',     tone: 'Something is ending. Something else is beginning.' },
]

function getEra(count: number): string {
  let era = ERAS[0].name
  for (const e of ERAS) { if (count >= e.threshold) era = e.name }
  return era
}

// ─────────────────────────────────────────────────────────────────────────────
// SEEDING -- deterministic so same token always = same signal/zone
// ─────────────────────────────────────────────────────────────────────────────

function seedN(tokenId: bigint, blockNumber: bigint, salt = 0): number {
  return Number((tokenId * 31n + blockNumber * 17n + BigInt(salt)) % 100000n)
}

function pick<T>(arr: T[], s: number): T { return arr[Math.abs(s) % arr.length] }

// ─────────────────────────────────────────────────────────────────────────────
// WORLD CONTEXT -- built per entry, enriched with narrative memory
// ─────────────────────────────────────────────────────────────────────────────

interface WorldCtx {
  zone: string        // the zone this signal occupies
  signal: string      // this signal's identity name
  other: string       // another presence in the world (not an enemy, just other)
  aspect: string      // their role/voice
  artifact: string    // an artifact that might be found
  era: string
  // Narrative enrichment -- prose-ready back-references
  lastSurgeRef: string      // "after what happened at the Breach" -- or empty
  lastDepartureRef: string  // "since the signal went dark at the Hollow" -- or empty
  dominantRef: string       // the currently dominant signal name -- or empty
  atmosphereTone: string    // current emotional/atmospheric tone
  isLegend: boolean         // this specific signal has appeared 7+ times
  sinceLastSurge: number    // how many entries ago last surge was
}

function buildCtx(
  tokenId: bigint,
  _blockNumber: bigint,
  era: string,
  owner: string,
  world: WorldMemory,
  cumCount: number
): WorldCtx {
  const t = Number(tokenId)
  const zone     = pick(ZONES,    t)
  const signal   = pick(SIGNALS,  (t * 7 + 3)  % SIGNALS.length)
  const other    = pick(OTHERS,   (t * 11 + 5) % OTHERS.length)
  const aspect   = pick(ASPECTS,  (t * 13 + 7) % ASPECTS.length)
  const artifact = pick(ARTIFACTS,(t * 17 + 2) % ARTIFACTS.length)

  const mem = world.signals.get(owner)
  const isLegend = (mem?.legendLevel ?? 0) >= 2

  // Build prose-ready back-references -- only if the memory is recent enough
  let lastSurgeRef = ''
  if (world.lastSurgeZone && world.lastSurgeSignal && cumCount - world.lastSurgeCount < 50) {
    lastSurgeRef = `after ${world.lastSurgeSignal} reshaped ${world.lastSurgeZone}`
  }

  let lastDepartureRef = ''
  if (world.lastDepartureZone && world.lastDepartureSignal) {
    lastDepartureRef = `since the signal went dark at ${world.lastDepartureZone}`
  }

  let dominantRef = ''
  if (world.dominantSignalName && world.dominantStreak >= 5) {
    dominantRef = world.dominantSignalName
  }

  const toneMap: Record<string, string> = {
    hope: 'with something like hope in the signal',
    tension: 'with the Grid under pressure',
    grief: 'in the quiet that follows a loss',
    wonder: 'as something old surfaces',
    stillness: 'in an unusual stillness',
    chaos: 'while the Grid runs hot',
  }

  return {
    zone, signal, other, aspect, artifact, era,
    lastSurgeRef,
    lastDepartureRef,
    dominantRef,
    atmosphereTone: toneMap[world.atmosphereTone] ?? '',
    isLegend,
    sinceLastSurge: cumCount - world.lastSurgeCount,
  }
}

function fill(t: string, c: WorldCtx): string {
  return t
    .replace(/{zone}/g,           c.zone)
    .replace(/{signal}/g,         c.signal)
    .replace(/{other}/g,          c.other)
    .replace(/{aspect}/g,         c.aspect)
    .replace(/{artifact}/g,       c.artifact)
    .replace(/{era}/g,            c.era)
    .replace(/{lastSurge}/g,      c.lastSurgeRef   || 'in the last great shift')
    .replace(/{lastDeparture}/g,  c.lastDepartureRef || 'since the last signal faded')
    .replace(/{dominant}/g,       c.dominantRef    || c.signal)
    .replace(/{atmosphere}/g,     c.atmosphereTone)
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD MEMORY UPDATE
// ─────────────────────────────────────────────────────────────────────────────

function updateWorldMemory(
  world: WorldMemory,
  event: IndexedEvent,
  ruleKey: string,
  tokenId: number,
  cumCount: number
): void {
  const t = tokenId
  const signalName = pick(SIGNALS, (t * 7 + 3) % SIGNALS.length)
  const zone       = pick(ZONES, t)
  const artifact   = pick(ARTIFACTS, (t * 17 + 2) % ARTIFACTS.length)
  const owner      = event.owner

  // ── Update per-signal memory ──────────────────────────────────────────────
  let mem = world.signals.get(owner)
  if (!mem) {
    mem = {
      owner,
      name: signalName,
      aspect: pick(ASPECTS, (t * 13 + 7) % ASPECTS.length),
      zone,
      firstCount: cumCount,
      totalEntries: 0,
      totalPixels: 0,
      energyPassed: 0,
      legendLevel: 0,
      lastCount: cumCount,
      lastBlock: event.blockNumber,
      hasReturned: false,
      hasGivenEnergy: false,
    }
    world.signals.set(owner, mem)
  }
  mem.totalEntries++
  mem.lastCount = cumCount
  mem.lastBlock = event.blockNumber
  if (event.type === 'PixelsTransformed') mem.totalPixels += Number(event.count)
  if (event.type === 'BurnRevealed') { mem.energyPassed += Number(event.count); mem.hasGivenEnergy = true }

  // Legend progression
  if (mem.totalEntries >= 20) mem.legendLevel = 3
  else if (mem.totalEntries >= 8)  mem.legendLevel = 2
  else if (mem.totalEntries >= 3)  mem.legendLevel = 1

  // ── Dominant signal tracking ──────────────────────────────────────────────
  // Find the signal with most entries overall
  let topName = signalName
  let topCount = 0
  const nameCounts = new Map<string, number>()
  for (const s of world.signals.values()) {
    const c = (nameCounts.get(s.name) ?? 0) + s.totalEntries
    nameCounts.set(s.name, c)
    if (c > topCount) { topCount = c; topName = s.name }
  }
  if (topName === world.dominantSignalName) {
    world.dominantStreak++
    world.reckoningBuilding = world.dominantStreak >= 15
  } else {
    world.dominantSignalName = topName
    world.dominantStreak = 1
    world.reckoningBuilding = false
  }

  // ── Store key moments ─────────────────────────────────────────────────────
  if (ruleKey === 'SIGNAL_SURGE') {
    world.lastSurgeSignal = signalName
    world.lastSurgeZone   = zone
    world.lastSurgeCount  = cumCount
    world.surgeCount++
    world.atmosphereTone = 'chaos'
  }
  if (ruleKey === 'DEPARTURE' || ruleKey === 'TWICE_GIVEN') {
    world.lastDepartureSignal = signalName
    world.lastDepartureZone   = zone
    world.departureCount++
    world.atmosphereTone = 'grief'
  }
  if (ruleKey === 'RELIC_FOUND') {
    world.lastArtifactZone = zone
    world.lastArtifactName = artifact
    world.atmosphereTone = 'wonder'
  }
  if (ruleKey === 'ERA_SHIFT') {
    world.lastEraName = getEra(cumCount)
    world.atmosphereTone = 'hope'
  }
  if (ruleKey === 'THE_QUIET' || ruleKey === 'LONG_DARK') {
    world.atmosphereTone = 'stillness'
  }
  if (ruleKey === 'RETURN' || ruleKey === 'WANDERER') {
    mem.hasReturned = true
    world.atmosphereTone = 'hope'
  }
  if (ruleKey === 'THE_READING' || ruleKey === 'DEEP_READING') {
    world.atmosphereTone = 'tension'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WAR STATE UPDATE
// ─────────────────────────────────────────────────────────────────────────────

const CORE_TYPES = new Set([
  'SIGNAL_SURGE','MARK_MADE','GHOST_TOUCH','DECLARATION',
  'DEPARTURE','PASSING','TWICE_GIVEN','RETURN','FIRST_LIGHT',
  'THE_ELDER','ANCIENT_STIRS','FAR_SIGNAL','CONTESTED_ZONE',
  'THE_READING','CONVERGENCE','RELIC_FOUND','THE_QUIET',
  'ERA_SHIFT','DOMINION',
])

function isCoreType(t: string): boolean { return CORE_TYPES.has(t) }

function updateWarState(
  state: WarState,
  event: IndexedEvent,
  ruleKey: string,
  allEvents: IndexedEvent[],
  eventIndex: number,
  cumCount = 0
): void {
  state.eventCount++
  if (event.type === 'PixelsTransformed') {
    state.totalPixels += Number(event.count)
    const ws = event.blockNumber - 500n
    state.pixelsInWindow = allEvents.slice(0, eventIndex + 1)
      .filter(e => e.type === 'PixelsTransformed' && e.blockNumber >= ws)
      .reduce((s, e) => s + Number(e.count), 0)
  }
  if (event.type === 'BurnRevealed') {
    state.totalBurnAP += Number(event.count)
    const ws = event.blockNumber - 500n
    state.burnsInWindow = allEvents.slice(0, eventIndex + 1)
      .filter(e => e.type === 'BurnRevealed' && e.blockNumber >= ws)
      .reduce((s, e) => s + Number(e.count), 0)
  }
  state.ownersEncountered.add(event.owner)

  // Phase transitions -- rename internally but keep compatible values
  if (state.totalBurnAP >= 800 && state.eventCount > 500) state.phase = 'reckoning'
  else if (state.totalBurnAP >= 400)                       state.phase = 'sacrifice'
  else if (state.pixelsInWindow >= 600 || state.totalPixels >= 20000) state.phase = 'siege'
  else if (state.totalPixels >= 5000 || state.eventCount >= 300)      state.phase = 'escalating'

  if (isCoreType(ruleKey)) {
    state.consecutiveCores++
    state.lastCoreType = ruleKey
    state.lastCoreBlock = event.blockNumber
    state.lastOwnerCoreBlock.set(event.owner, event.blockNumber)
  } else { state.consecutiveCores = 0 }

  // Arc tension
  const INTENSE   = new Set(['SIGNAL_SURGE','MARK_MADE','DECLARATION','CONVERGENCE'])
  const HEAVY     = new Set(['DEPARTURE','TWICE_GIVEN','PASSING'])
  const RESTFUL   = new Set(['THE_QUIET','LONG_DARK','NIGHTWATCH','THE_STEADY'])

  if (INTENSE.has(ruleKey))  { state.arcTension = Math.min(100, state.arcTension + 15); state.sinceLastBattle = 0 }
  else                       { state.sinceLastBattle = Math.min(state.sinceLastBattle + 1, 99) }
  if (HEAVY.has(ruleKey))    { state.arcTension = Math.max(0, state.arcTension - 22); state.sinceLastSacrifice = 0 }
  else                       { state.sinceLastSacrifice = Math.min(state.sinceLastSacrifice + 1, 99) }
  if (RESTFUL.has(ruleKey))  { state.arcTension = Math.max(0, state.arcTension - 10); state.sinceLastQuiet = 0 }
  else                       { state.sinceLastQuiet = Math.min(state.sinceLastQuiet + 1, 99) }
  if (event.type === 'PixelsTransformed' && Number(event.count) > 50) {
    state.arcTension = Math.min(100, state.arcTension + 5)
  }

  state.recentRuleTypes.push(ruleKey)
  if (state.recentRuleTypes.length > 8) state.recentRuleTypes.shift()

  updateWorldMemory(state.world, event, ruleKey, Number(event.tokenId), cumCount)
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE DEFINITIONS
// Story language: no "sacrifice", no "burns", no "pixels", no "war"
// Instead: signals, presence, marks, energy, fading, the Grid, zones, shaping
// ─────────────────────────────────────────────────────────────────────────────

type WorldPhase = 'opening' | 'escalating' | 'siege' | 'sacrifice' | 'reckoning'

interface PhaseVariant { phase: WorldPhase; headline?: string; body: string }

interface LoreRule {
  loreType: LoreType
  icon: string
  ruleApplied: string
  ruleExplanation: string
  headlines: string[]
  bodies: string[]
  phaseVariants?: PhaseVariant[]
  afterContext?: Partial<Record<string, string>>
}

function avoidRepeat(candidate: string, state: WarState, fallback: string): string {
  const recent = state.recentRuleTypes
  if (recent.length > 0 && recent[recent.length - 1] === candidate) return fallback
  if (recent.slice(-3).includes(candidate)) return fallback
  return candidate
}

const RULES: Record<string, LoreRule> = {

  // ─── MAJOR EVENTS ────────────────────────────────────────────────────────

  SIGNAL_SURGE: {
    loreType: 'SIGNAL_SURGE', icon: '◈',
    ruleApplied: 'Signal Surge',
    ruleExplanation: 'A large presence event -- a signal reshapes a major zone of the Grid.',
    headlines: [
      '{signal} Rewrites {zone}',
      'The Face of {zone} Changes Overnight',
      '{signal} -- Everything at {zone} Shifts',
      'The Grid at {zone} Is Different Now',
      '{zone} Takes the Shape of {signal}',
      'A Complete Reshaping: {signal} at {zone}',
      'Something New Where {zone} Used to Be',
      'The Grid Remembers What {signal} Did at {zone}',
    ],
    bodies: [
      '{signal} moved through {zone} and left it different. Not the incremental shift of many hands -- a single sustained presence, rewriting what had been there until the zone carried a new shape. The Grid absorbed it and moved on. But the shape remains.',
      'What happened at {zone} was the kind of change that takes effort to explain. {signal} didn\'t arrive quietly. They came with intent -- the whole zone reshaped, corner by corner, until the thing they imagined was the thing the Grid showed. The others noticed.',
      '{zone} used to look different. Now it looks like {signal} -- their pattern, their language, the particular way they understand what a zone should say about who holds it. The Grid doesn\'t editorialize. It just shows what\'s there.',
      'In a world that rewrites itself constantly, some changes feel permanent. What {signal} did at {zone} was that kind. Not just a mark left -- a zone remade. The Grid logged it like any other change. The chronicle knows better.',
      'The Grid at {zone} went through a shift -- the kind that others feel as a pressure before they see it as a change. {signal} was the source. The work was total. What the zone says now is what {signal} decided it should say.',
      'Not gradual. Not incremental. {signal} reshaped {zone} the way you reshape something when you\'ve decided exactly what it should become. The Grid confirmed each change as it landed. By the end, {zone} was theirs in every way the Grid can record.',
    ],
    phaseVariants: [
      { phase: 'siege', headline: 'The Stillness Ends -- {signal} at {zone}', body: 'The pause at {zone} ended the way pauses end when one signal runs out of patience. {signal} moved -- not a test, the full thing -- and the Grid registered every change before the others could read what was happening.' },
      { phase: 'reckoning', headline: '{signal} Makes Their Move at {zone}', body: 'Everything {signal} has done in the Grid\'s history seems to point toward this moment at {zone}. Every previous mark. Every prior shape. This one is different in weight -- the kind of moment the chronicle marks twice.' },
    ],
    afterContext: {
      DEPARTURE: '{signal} reshaped {zone} after the silence {lastDeparture}. There\'s a theory that what was given made this possible -- that the energy didn\'t disappear but changed hands. The Grid doesn\'t confirm theories. It confirms shapes.',
      THE_QUIET: 'The still period ended with everything {signal} had. {zone} became something new while the others were still processing the silence. The quiet was the preparation. This was the result.',
      RELIC_FOUND: 'Finding {artifact} changed what {signal} thought was possible at {zone}. They moved sooner than anyone expected, before the implications had fully settled. The window was taken.',
    },
  },

  MARK_MADE: {
    loreType: 'MARK_MADE', icon: '▪',
    ruleApplied: 'Mark Made',
    ruleExplanation: 'A deliberate mid-size presence -- someone shaping their corner of the Grid.',
    headlines: [
      '{signal} Leaves Their Shape at {zone}',
      'A Deliberate Mark at {zone}',
      '{signal} Claims a Corner of {zone}',
      'Something Shifts at {zone}',
      '{signal} Writes Themselves into {zone}',
      'The Edge at {zone} Moves',
      '{zone} Gets {signal}\'s Attention',
      'Intent Visible at {zone}',
    ],
    bodies: [
      '{signal} came to {zone} with a specific idea of what they wanted to leave. The mark they made is precise -- not exploratory, not accidental. Something decided, executed, and confirmed by the Grid. It\'s there now.',
      'The kind of mark that takes skill to make isn\'t always the largest one. {signal} worked a corner of {zone} -- the cells that mattered, the edge that meant something -- and the Grid registered the new configuration before anything could shift back.',
      '{signal} has been expressing themselves on the Grid for a while now. What they did at {zone} fits the pattern -- deliberate, legible, carrying the specific quality their marks always carry. Anyone who knows their work would recognize it.',
      'Some marks on the Grid are just presence. What {signal} did at {zone} was more than that -- it was a statement. The Grid doesn\'t read statements. It records shapes. But the shape they left at {zone} says what they wanted it to say.',
      '{zone} took on some of {signal}\'s character today. Not the whole zone -- a section, a strip, a particular edge -- but enough that someone reading the Grid carefully would see the signature. {signal} was here. The shape proves it.',
      'A calculated change at {zone}. {signal} identified the part of the zone that mattered -- the cells that carry the most weight -- and rewrote them precisely. The Grid confirmed the new state. The change is small. The intention is clear.',
    ],
    afterContext: {
      SIGNAL_SURGE: '{signal} kept working after the big reshape. They pressed what they\'d remade at {zone} before anything could shift -- smaller now, but more precise. The surge was the statement. This is the signature.',
      THE_QUIET: 'The stillness lifted and the first thing {signal} did was add their shape to {zone}. Small. Exact. The kind of mark you make when you\'ve had time to decide exactly what you want to say.',
      DEPARTURE: '{signal} moved through {zone} with a kind of weight to it {lastDeparture}. Some presences make you want to leave something behind. The mark at {zone} reads that way.',
    },
  },

  GHOST_TOUCH: {
    loreType: 'GHOST_TOUCH', icon: '·',
    ruleApplied: 'Ghost Touch',
    ruleExplanation: 'The smallest possible presence -- one cell, one mark, one signal saying: I was here.',
    headlines: [
      'A Single Mark at {zone}',
      '{signal} -- Just a Touch at {zone}',
      'The Smallest Presence at {zone}',
      'One Mark at {zone}\'s Edge',
      '{signal} at {zone}: Almost Nothing, Permanently',
      'The Quietest Entry at {zone}',
    ],
    bodies: [
      'One mark at {zone}. {signal}\'s shape, placed at a single point in the Grid. The minimum possible presence -- but presence. The Grid registers it the same way it registers everything: permanently.',
      '{signal} was at {zone} for a moment. One cell, one mark, then gone. It\'s easy to overlook in the full picture of the Grid. But the chronicle looks at everything, including the things that almost didn\'t happen.',
      'The smallest statement {signal} could make at {zone}: a single point of themselves in the Grid. Not a claim. Not a declaration. Just: I existed here, at this moment, and the world confirmed it.',
      'Just a touch. {signal} placed one mark at {zone}\'s edge and moved on. The Grid logged it alongside everything else -- every major reshaping, every total transformation. One mark, same record.',
      'What does the smallest presence mean? {signal} left one mark at {zone}. Maybe it\'s the seed of something. Maybe it\'s just evidence of passing through. The Grid records it without interpretation. The chronicle notes it.',
    ],
    afterContext: {
      SIGNAL_SURGE: 'One mark at {zone} in the aftermath of everything that just happened. Easy to miss. Someone made sure their shape was there before the Grid settled into its new configuration.',
      THE_QUIET: 'Even in the stillness, {signal} touched {zone}. The quietest possible action in the quietest possible moment. The Grid noted it.',
    },
  },

  DECLARATION: {
    loreType: 'DECLARATION', icon: '▣',
    ruleApplied: 'Declaration',
    ruleExplanation: 'A precise, round-number act -- the kind of thing that reads as a statement.',
    headlines: [
      '{signal} States What Was Already True at {zone}',
      'The Declaration: {zone} Carries {signal}\'s Shape',
      '{signal} Makes It Official at {zone}',
      'What the Grid Showed, {signal} Now Says',
      '{signal} Declares {zone} -- The Chronicle Records',
      'Intent Named at {zone}',
    ],
    bodies: [
      '{signal} named what the Grid already showed. Their shape held every corner of {zone} -- {other} had withdrawn, the zone was settled -- and now it\'s formally in the record. The Grid knew first. The declaration was for everyone else.',
      'The statement came after the work. {signal} shaped {zone}, held it, and only then said so out loud. Not claiming something uncertain -- recording something already done. The Grid confirmed it. The chronicle adds the weight.',
      '{other} saw the declaration. Their own presence had already faded from {zone}\'s shape. {signal}\'s mark was visible in every part of the zone long before the announcement -- the Grid had been saying it for a while. The words just made it louder.',
      'You don\'t declare what you don\'t hold. {signal}\'s shape covered {zone} completely before they said anything. The declaration was the record catching up to the Grid -- giving language to what the Grid had already sealed.',
      'Precise, deliberate, total. {signal} brought exactly the right number of marks to {zone} -- not one more, not one less. The Grid processed it and confirmed the declaration. Something about that precision makes it feel different from a reshaping. This was a statement.',
    ],
  },

  DEPARTURE: {
    loreType: 'DEPARTURE', icon: '▽',
    ruleApplied: 'Departure',
    ruleExplanation: 'A signal chooses to dissolve -- their energy passes to others, their mark remains.',
    headlines: [
      'A Signal Fades Near {zone}',
      '{signal} Chooses to Dissolve Near {zone}',
      'Near {zone}: One Presence Passes Its Energy Forward',
      'Gone From the Active Grid -- Near {zone}',
      'The Shape {signal} Left Near {zone}',
      'What Remains After {signal} Near {zone}',
    ],
    bodies: [
      'Near {zone}, a signal chose to dissolve. Not lost -- given. Everything it had accumulated, all its capacity to shape the Grid, passed forward to those still active. The shape it left behind remains. The energy moved on.',
      '{signal} was near {zone} when it happened. One presence, choosing to stop being a presence -- giving everything it had accumulated to the Grid, to others, to the continuation of something it couldn\'t name but could feel. The Grid confirmed the passing. The chronicle holds the weight.',
      'Some signals fade gradually. This one near {zone} chose its moment. There\'s a difference -- the Grid shows it in how complete the transition was. Nothing left partial. Everything passed on. The shape they made on the Grid remains. The signal that made it doesn\'t.',
      'Near {zone}, the chronicle notes an absence. A signal that had been active -- marking, shaping, being present -- chose to let go. What they had goes forward now in other hands. The Grid logs the transfer. The story logs the loss.',
      'The signals that dissolve near {zone} are remembered differently from the ones that simply stop appearing. This was a choice. The energy moved. The Grid confirms the transfer. What was {signal}\'s is now something shared -- distributed across everyone still shaping the world.',
      'Something has changed near {zone}. A presence that was consistent -- regular, distinctive, carrying its own character -- is no longer in the active Grid. Where it went is not a mystery. The Grid is transparent about these things. What\'s harder to describe is what the Grid looks like without them.',
    ],
    phaseVariants: [
      { phase: 'reckoning', headline: 'A Final Passing Near {zone}', body: 'In the late days of the Grid\'s current chapter, this passing near {zone} carries extra weight. The signal chose to go now -- with full knowledge of where the story was heading. Not from despair. From a clear-eyed sense of what this moment needed.' },
    ],
    afterContext: {
      THE_QUIET: 'After the stillness near {zone}, the departure. Or maybe the departure is why the stillness happened. The Grid doesn\'t explain causality. The chronicle notes the order: quiet, then this.',
      SIGNAL_SURGE: 'A reshaping at {zone} and then a fading. Two very different kinds of intensity, one after the other. The chronicle holds both without suggesting they\'re connected. They might be.',
    },
  },

  PASSING: {
    loreType: 'PASSING', icon: '△',
    ruleApplied: 'Passing',
    ruleExplanation: 'A small gift of energy -- one signal giving a part of itself to another.',
    headlines: [
      'A Small Gift Near {zone}',
      'Energy Moves Quietly Near {zone}',
      'Near {zone}: Something Passes Between Signals',
      'Not a Mark -- A Transfer Near {zone}',
      '{signal} Gives a Part of Itself Near {zone}',
    ],
    bodies: [
      'Near {zone}, a portion of one signal\'s capacity moved quietly to another. Not a reshaping -- a transfer. Small on the Grid. Real in its effect. The receiving signal can reach further now because of what was given.',
      '{signal} gave something near {zone}. Not everything -- just what could be spared. A slice of capacity, passed forward. The Grid registered it without ceremony. The chronicle notes it, because small gifts accumulate into something the Grid eventually shows.',
      'Near {zone}: energy shared, not spent. {signal} gave a part of what it had to another presence -- the kind of quiet transaction that happens in the margins of bigger stories but shapes them just as much.',
      'The transfer near {zone} didn\'t make headlines. No zone reshaped, no new shape declared. One signal gave a portion of itself to another, and both moved on. The Grid recorded it the same way it records everything -- permanently, without judgment.',
    ],
    afterContext: {
      DEPARTURE: 'The great fading near {zone} was followed, quietly, by a smaller gift. As if in answer -- or in tribute. The record holds both. They are not the same thing. They belong together.',
      SIGNAL_SURGE: 'After the reshaping, the small sustaining acts. Near {zone}, {signal} passed something forward -- keeping the network whole while the shape of the last shift settles into permanence.',
    },
  },

  TWICE_GIVEN: {
    loreType: 'TWICE_GIVEN', icon: '◎',
    ruleApplied: 'Twice Given',
    ruleExplanation: 'A signal that gave before gives again -- the second time costs more.',
    headlines: [
      'The Second Passing Near {zone}',
      '{signal} Gives Again Near {zone}',
      'Near {zone}: Given Once, Then Given Again',
      'After Everything -- Another Gift Near {zone}',
      'The Signal That Gave Twice Near {zone}',
    ],
    bodies: [
      '{signal} had given before -- near {zone}, everyone knew the story. It had rebuilt what it gave away, slowly, and now it gives again. Once is a gift. Twice is a different kind of statement. The Grid recorded both. The second one means more.',
      'Near {zone}, the same signal gave twice. The first time the Grid noted it as a transfer -- capacity moving from one presence to others. The second time, the Grid noted the same thing. The chronicle notes the difference between the first time and this.',
      'The record near {zone} shows two separate givings from the same signal. Between them: return, rebuilding, the slow re-accumulation of what had been given away. And then the decision to give again. The Grid doesn\'t record decisions. It records what comes after them.',
      'Some presences in the Grid give once and stop. {signal} gave near {zone}, rebuilt, and gave again. There\'s no word in the Grid\'s log for this. There\'s just the sequence -- two transfers, same source, different moments. The chronicle holds both and doesn\'t pretend they\'re the same thing.',
    ],
  },

  RETURN: {
    loreType: 'RETURN', icon: '◉',
    ruleApplied: 'Return',
    ruleExplanation: 'A signal comes back after absence -- the Grid they return to has changed.',
    headlines: [
      '{signal} Returns to {zone}',
      'A Familiar Shape Back at {zone}',
      'After the Absence: {signal} at {zone}',
      'The Grid at {zone} -- Changed, But {signal} Is Back',
      'Back at {zone}: A Signal the Chronicle Knows',
      '{zone} Sees {signal} Again',
    ],
    bodies: [
      '{signal} came back to {zone}. The Grid here has been rewritten many times since they were last present -- the shape is different, the configuration changed -- but their own mark is still readable in the record. They\'re here again, adding to it.',
      'The chronicle noted when {signal} went quiet. Now it notes the return. Same signal, same zone, different Grid underneath. They\'re reading the new configuration and adjusting. What they build from here will show how much the absence changed them.',
      'A gap in the record at {zone}, then {signal} appears again. No explanation -- the Grid doesn\'t explain. Just the sequence: active, then dark, then active again. The second chapter of a presence is always different from the first.',
      '{signal} returned to {zone} and found it different. The Grid moves without waiting -- every moment they were gone, other signals were shaping the space. They\'re working with what they find now, not what they remember. The chronicle will track whether they adapt.',
      'Back at {zone}. {signal}\'s signal registers on the Grid again after the gap. The chronicle has this moment: the return, the first mark after absence, the proof that they didn\'t stay gone. What they do next is what matters.',
    ],
    afterContext: {
      THE_QUIET: 'The long stillness ended at {zone} with a return. {signal} came back through the quiet -- which means they came for the calm, or despite it, or without knowing how silent everything had gotten. The Grid doesn\'t say which.',
      SIGNAL_SURGE: 'After the reshaping, {signal} came back to {zone}. Drawn by what happened, or by the space it left behind, or by something the chronicle can\'t read. They\'re back. That\'s what the Grid shows.',
    },
  },

  FIRST_LIGHT: {
    loreType: 'FIRST_LIGHT', icon: '->',
    ruleApplied: 'First Light',
    ruleExplanation: 'A new signal appears for the first time -- the Grid gains a presence it\'s never had.',
    headlines: [
      'A New Signal at {zone}',
      '{signal} -- First Mark at {zone}',
      'The Grid Opens for {signal} at {zone}',
      'First Appearance Near {zone}',
      'Someone New at {zone}',
      'A Signal the Grid Hasn\'t Seen: Near {zone}',
    ],
    bodies: [
      'A first mark near {zone} from a signal the Grid hadn\'t seen before. New presence. The chronicle opens a fresh entry. Whatever shape this signal will eventually leave on the Grid, this cell is where it starts.',
      '{signal} is on the Grid now -- near {zone}, for the first time, leaving their first mark. No prior history in the record. Just this entry, which opens everything that might follow. Every lasting presence in the Grid started exactly like this.',
      'The Grid logged a first-time mark near {zone}. A presence that hadn\'t shaped a single cell before placed their shape. The record opens. The chronicle watches to see what the second entry looks like, and the third, and what comes after.',
      'New to the Grid, active near {zone}. No prior history -- only the entry being written now. The Grid doesn\'t know what to make of a new signal yet. It just confirms the mark. The rest is what they do with the confirmation.',
      'First entry: {signal} near {zone}. One mark, one presence confirmed. The Grid is full of signals that started exactly this way and became something the chronicle spent years tracking. Or ones that left one mark and were never seen again. This is entry one. Everything else is ahead.',
    ],
    phaseVariants: [
      { phase: 'escalating', body: 'Even as the Grid gets more complex, new signals keep arriving near {zone}. This one enters a world moving faster than the version they heard about. They\'ll learn the current Grid from the Grid itself -- there\'s no other way.' },
    ],
    afterContext: {
      SIGNAL_SURGE: 'Someone arrived at {zone} after the big reshaping -- drawn by what happened, or by the space it created. New signals come for different reasons. This one hasn\'t shown theirs yet.',
      THE_QUIET: 'The stillness brought a new face. {signal} arrived at {zone} during the quiet -- which means they came for the calm, or in spite of it, or didn\'t know it was happening. The Grid logged the arrival.',
    },
  },

  THE_ELDER: {
    loreType: 'THE_ELDER', icon: '◇',
    ruleApplied: 'The Elder',
    ruleExplanation: 'One of the prime-numbered signals moves -- they act at precise moments, always with weight.',
    headlines: [
      'An Elder Moves at {zone}',
      '{signal} -- One of the Originals at {zone}',
      'The Irreducible Near {zone}',
      'Old and Still Present: {signal} at {zone}',
      'The Chronicle Marks the Elder\'s Move at {zone}',
      'Near {zone}: The Kind of Presence You Don\'t Ignore',
    ],
    bodies: [
      'The elder signal moved near {zone}. These presences don\'t act randomly -- they appear when the Grid\'s pattern is about to shift, and the chronicle has learned to read the timing. Something is changing.',
      'One of the Grid\'s first-era signals is active near {zone}. Long history, deep record, a presence that has been shaping the Grid since before most current signals placed their first mark. The elder moved. The chronicle pays attention.',
      'The elder came to {zone}. The chronicle has noted this pattern before: a very old signal appears at a very specific moment, and something in the Grid shifts not long after. Not because the elder causes it -- because the elder knows when to show up.',
      'Near {zone}, a presence from the Grid\'s earliest days made their mark. It moves rarely. When it moves, the chronicle watches carefully. Not because the mark is large -- because the timing always means something no one can quite articulate until afterward.',
      'Old signals don\'t stay quiet forever. Near {zone}, one of the Grid\'s first presences added their shape to the current configuration. The chronicle has learned what this tends to precede. Watching.',
    ],
    afterContext: {
      SIGNAL_SURGE: 'The elder moved at {zone} after the reshaping. Coincidence, or the elder\'s definition of good timing. {signal} didn\'t say. The chronicle records the sequence.',
      THE_QUIET: 'The stillness ended with an elder. Not a reshaping, not a declaration -- just an appearance. Near {zone}, one of the original signals became present again. No one knows what to do with that.',
    },
  },

  ANCIENT_STIRS: {
    loreType: 'ANCIENT_STIRS', icon: '■',
    ruleApplied: 'Ancient Stirs',
    ruleExplanation: 'One of the very first signals in the Grid wakes -- they predate almost everything.',
    headlines: [
      'One of the First Stirs Near {zone}',
      'An Ancient Presence at {zone}',
      'Near {zone}: A Face from the Very Beginning',
      'The Grid\'s Oldest Signal -- Active at {zone}',
      'Before Most of This Existed: They\'re at {zone}',
      'Something Ancient and Still Moving -- Near {zone}',
    ],
    bodies: [
      'One of the Grid\'s first presences is active near {zone}. Low in the original register, deep in the log. They were shaping the Grid before most current signals existed -- and they\'re shaping it again now.',
      'Near {zone}, a signal from the Grid\'s earliest record made their mark. The configuration here has been rewritten completely since this presence first appeared. They\'ve watched every version of it. Now they\'re adding to this one.',
      'The chronicle marks an ancient signal near {zone}. This presence was there when the Grid was new. They\'ve outlasted configurations that seemed permanent, signals that seemed irreplaceable. They\'re still here. Still marking. Some presences in the Grid simply don\'t stop.',
      'Old and still. Near {zone}, a signal from the opening of the Grid\'s record placed their mark. Whatever brings them to {zone} now carries everything they\'ve seen -- every reshaping, every configuration that came and went. The shape they left carries all of that.',
    ],
    afterContext: {
      ERA_SHIFT: 'The new era began and something ancient stirred. Whether the ancient moved because of the shift or the shift happened because of the ancient -- the Grid doesn\'t answer that. The chronicle notes both arrived together.',
      LONG_DARK: 'After the long stillness, an ancient signal appeared at {zone}. As if the quiet was a condition they required before they\'d mark the Grid again. Some presences need the dark to move in.',
    },
  },

  FAR_SIGNAL: {
    loreType: 'FAR_SIGNAL', icon: '▿',
    ruleApplied: 'Far Signal',
    ruleExplanation: 'Someone from the outermost reaches of the Grid makes their presence known.',
    headlines: [
      'Activity at {zone} -- From the Far Reaches',
      'A Signal from the Margins: {zone}',
      'The Outer Reaches Send Someone to {zone}',
      'Beyond the Main Currents: Active at {zone}',
      'Far From Where the Story Concentrates: {zone}',
      'The Edges of the Grid Are Not Empty',
    ],
    bodies: [
      'Activity at {zone} -- out past where the Grid\'s story tends to concentrate. Something is shaping the margins. The chronicle has been watching the center. The edges have been doing their own thing.',
      'Out near {zone}, away from the zones where most of the Grid\'s attention collects: a signal active in the space the main chronicle under-tracks. Not dramatic. Steady. The margins of the Grid have their own story running in parallel.',
      '{signal} works far from the center -- near {zone}, at the outer reach of the Grid\'s active zone. Away from the major reshapings, away from where most presences concentrate. The Grid here changes slowly, but it changes.',
      'Near {zone}, at the edges: shapes being made in territory the main account of the Grid doesn\'t cover well. The margins are not empty. They\'re just quieter, and the chronicle has to look harder to read them.',
    ],
    afterContext: {
      THE_QUIET: 'The stillness at the center didn\'t reach the edges. Near {zone}, the far signals were active through the whole quiet -- shaping cells in ground the main chronicle had stopped tracking. The margins move differently.',
      SIGNAL_SURGE: 'The surge sent ripples to the margins. The edges answered in their own way -- a signal near {zone}, drawn by what happened, or by the space it created at the center.',
    },
  },

  CONTESTED_ZONE: {
    loreType: 'CONTESTED_ZONE', icon: '⊘',
    ruleApplied: 'Contested Zone',
    ruleExplanation: 'The most-overwritten place in the Grid -- it never stays one shape for long.',
    headlines: [
      '{signal} Shapes {zone} -- Again',
      '{zone} Takes Another Configuration',
      'The Most-Rewritten Zone: {zone} Changes Again',
      '{zone}: Never Settled, Always Shifting',
      'The Cycle Continues at {zone}',
      '{zone} Looks Like {signal} -- For Now',
    ],
    bodies: [
      '{zone} has held every shape. {signal}\'s marks cover it now -- but the Grid\'s full record shows {other}\'s shape there before, and {signal}\'s before that, and {other}\'s before that. The cycle doesn\'t stop here.',
      'The most-rewritten zone in the Grid may be {zone}. The record runs deep: shape, counter-shape, rewrite, counter-rewrite, back and forth since the earliest entries. {signal}\'s configuration is on top today. Tomorrow is a separate question.',
      '{signal} holds {zone}. The Grid confirms it -- their marks in every corner. The record also confirms they\'ve held it before, lost it, and come back. The zone gets a new layer. The cycle gets one entry thicker.',
      'Another configuration at {zone}. The Grid here is a compressed history of everyone who\'s ever cared about this place -- every signal that shaped it, every shape that held and then didn\'t. Today\'s layer is {signal}\'s. The next rewrite is already forming in the Grid\'s logic.',
    ],
  },

  THE_READING: {
    loreType: 'THE_READING', icon: '∆',
    ruleApplied: 'The Reading',
    ruleExplanation: 'Every 25th entry -- someone steps back and reads the shape of everything.',
    headlines: [
      'Twenty-Five Entries -- The Pattern Is Visible',
      'Step Back and Read: {signal} Has Been Everywhere',
      'Twenty-Five Moments, One Direction',
      'At Twenty-Five -- The Shape of What\'s Happening',
      'The Chronicle Steps Back: What the Last Twenty-Five Show',
      'A Direction Emerges',
    ],
    bodies: [
      'Twenty-five entries. Read the distribution across the whole window: {signal}\'s marks have been advancing across the Grid in one consistent direction. That\'s not noise -- that\'s pattern. The Grid has been telling this story for a while. This entry is the moment it becomes visible.',
      'At twenty-five, the shape of the Grid\'s recent movement becomes readable. Compare the configuration at entry one to the configuration now: {signal}\'s presence has grown. {other}\'s has contracted. Twenty-five data points make a direction.',
      'Twenty-five log entries as a sequence: {signal} marking, {other} adapting, the Grid\'s active configuration ending up more {signal}\'s character every time things settle. Twenty-five is enough to call it a pattern. The chronicle is calling it.',
      'Step back from the individual marks. Twenty-five of them, read as one sequence, describe a Grid that has been moving toward {signal}\'s shape. Entry by entry, mark by mark, consistently. The Grid doesn\'t make decisions. But the signals who shape it do -- and twenty-five entries of their decisions say something clear.',
    ],
    afterContext: {
      SIGNAL_SURGE: 'The big reshaping at {zone} reads differently when you look at the twenty-five entries before it. Every smaller mark was part of the buildup. The pattern was in the Grid\'s record the whole time. Most weren\'t reading it.',
      DEPARTURE: 'The fading makes more sense read across twenty-five entries. It was not sudden. It was the natural end of a line that had been building for a while. The chronicle sees it now that it\'s looking.',
    },
  },

  CONVERGENCE: {
    loreType: 'CONVERGENCE', icon: '⊕',
    ruleApplied: 'Convergence',
    ruleExplanation: 'Two signals at the same moment -- the Grid surprises itself.',
    headlines: [
      'Two Signals, One Moment -- Near {zone}',
      'They Arrived at {zone} at the Same Time',
      '{signal} and Another -- Simultaneously at {zone}',
      'The Same Ground, the Same Moment',
      'A Meeting No One Planned Near {zone}',
      'Two Paths Cross at {zone}',
    ],
    bodies: [
      'Two signals, same zone, same moment -- {signal} and something else both marking {zone} at the same time. The Grid logged both. The configuration absorbed both marks simultaneously. Neither knew the other was there.',
      'The Grid at {zone} processed two marks in one block -- {signal}\'s shape and another signal\'s shape, both placed in the same zone at the same moment. The record holds both. The overlap is real.',
      'Simultaneous activity at {zone}: {signal} making their mark and another signal making theirs -- in the same zone, in the same moment. The Grid confirmed both entries. Two signals, one place, one timestamp. It happens rarely.',
      '{signal} was not alone at {zone} this moment. Another signal marked the same space at the same time. The Grid logged both executions. Two presences, one zone, one instant in the record. The chronicle notes the rarity of this -- and the fact that neither planned it.',
    ],
    afterContext: {
      THE_ELDER: 'The elder and {signal} at {zone} -- same moment. Neither chose the other. The Grid chose for both of them.',
      THE_QUIET: 'The stillness ended with two signals arriving at the same place at the same time. The quiet broke into something neither was planning.',
    },
  },

  RELIC_FOUND: {
    loreType: 'RELIC_FOUND', icon: '★',
    ruleApplied: 'Discovery',
    ruleExplanation: 'Something old and significant surfaces -- the Grid reshuffles around it.',
    headlines: [
      '{artifact} Surfaces Near {zone}',
      'Something Ancient at {zone}: {artifact}',
      'The Chronicle Marks {artifact} -- Near {zone}',
      '{artifact} Is Active at {zone}',
      'An Old Record Stirs: {artifact} Near {zone}',
      'Found in the Grid Near {zone}: {artifact}',
    ],
    bodies: [
      '{artifact} surfaced near {zone}. These old records carry more weight than any single mark -- their presence changes what\'s possible around them. {signal} will have noticed. So will everyone else who\'s been watching this part of the Grid.',
      'Near {zone}, {artifact} came into the Grid\'s active record. Old, rare, significant in ways the chronicle is still mapping. What it means for the signals shaping the zone around it -- that\'s the question both {signal} and {other} are asking.',
      'The chronicle marks {artifact} near {zone}. These first-era objects appear rarely and rarely without consequence. The configuration around {zone} will shift because of this. The Grid is already registering the change in how signals are moving there.',
      'Something ancient registered near {zone}. {artifact} -- older than most active signals, carrying meaning that outlasts any single reshaping. The territory around it matters differently now. {signal} has noticed. So has {other}.',
    ],
    afterContext: {
      THE_QUIET: 'The stillness ended with a discovery. {artifact} at {zone} -- found in the quiet, when no one was making noise and everyone was looking at different things. The silence was what made finding it possible.',
      SIGNAL_SURGE: 'The reshaping of {zone} uncovered {artifact}. Not why {signal} came. It changes why the reshaping matters. What was a statement became a discovery.',
    },
  },

  THE_QUIET: {
    loreType: 'THE_QUIET', icon: '--',
    ruleApplied: 'The Quiet',
    ruleExplanation: 'A long gap between events -- the Grid holds its current shape and waits.',
    headlines: [
      'The Grid Goes Still Near {zone}',
      'Both Signals Hold -- The Shape Holds Too',
      'Stillness at {zone}',
      'The Pause Near {zone}',
      'Nothing Moves at {zone}',
      'The Grid at {zone} Waits',
    ],
    bodies: [
      'The Grid near {zone} went still. Both signals are present -- {signal}\'s marks on one side, {other}\'s on another -- but neither is moving. The current configuration holds. The stillness has its own weight.',
      'No new marks at {zone}. The shape is frozen at the last moment of activity -- {signal}\'s form and {other}\'s form exactly as they were when things last settled. The Grid holds the present configuration the way it holds everything: until something changes it.',
      'Still near {zone}. Both shapes in position, both signals registered but not active, neither adding to what\'s already there. The Grid holds the current state. Something will break the stillness. The chronicle waits.',
      'Neither {signal} nor {other} is marking cells near {zone} right now. The shape hasn\'t moved. The Grid holds the last configuration from when things were active -- and will hold it, with the same permanence, until someone decides to change it.',
      'The Grid at {zone} paused. Shapes in position, signals present but still, no new marks being made. The Grid holds the current state the way it holds anything: permanently, until it doesn\'t. The pause has its own kind of meaning.',
    ],
    phaseVariants: [
      { phase: 'siege', headline: 'The Grid Holds Its Breath', body: 'This stillness is different from the early ones. It\'s the stillness of something that has been going on too long -- {signal} and {other} reading each other\'s presence near {zone} without moving. The weight is immense. Something is about to give.' },
    ],
    afterContext: {
      SIGNAL_SURGE: 'The reshaping took everything both signals had. What followed was stillness -- not the stillness of settlement, but of a Grid absorbing what just happened. {signal} holds what they remade. {other} has pulled back. Near {zone}, the Grid is very quiet.',
      DEPARTURE: 'After the fading near {zone}, the Grid went still. That kind of stillness has its own weight if you know what came before it.',
    },
  },

  ERA_SHIFT: {
    loreType: 'ERA_SHIFT', icon: '◑',
    ruleApplied: 'Era Shift',
    ruleExplanation: 'The world crosses a threshold -- the old way of describing things stops working.',
    headlines: [
      '{era} -- The Grid Crosses a Threshold',
      'The Chronicle Opens: {era}',
      'A New Chapter: {era}',
      'The Grid Has Changed Enough to Change Its Name: {era}',
      'Threshold Crossed -- {era} Begins',
      '{era}: Everything Before This Was Prologue',
    ],
    bodies: [
      'The count reaches its mark. {era} begins. The Grid\'s current configuration -- every zone marked, every shape held or contested -- is the foundation the new chapter starts from. What was true in the last era is still true. But the era is different.',
      '{era}. The chronicle turns the marker. The Grid\'s record is deep enough now that the story it tells is different from the one it told at the last threshold. Not because the rules changed -- because the signals did. Because what accumulated is now impossible to ignore.',
      'A threshold in the Grid\'s record. {era} opens here -- at this count, with the active configuration in its current state. Every mark that brought the count to this point is in the permanent record. The new era doesn\'t erase them. It inherits them.',
      'New era. {era} starts with the Grid shaped by everything that happened in the chapter before -- every signal that came, every shape that held, every moment the chronicle recorded. The Grid doesn\'t pause for thresholds. The chronicle does. This is what this one looks like.',
    ],
    afterContext: {
      SIGNAL_SURGE: 'The reshaping pushed the count into a new era. {era} begins with {signal} having shaped more of the Grid than they held in any previous chapter. The baseline has changed.',
      DEPARTURE: 'The fading marked the turn. {era} begins in the aftermath of what was given -- shaped by it, weighted by it, moving forward from it.',
    },
  },

  DOMINION: {
    loreType: 'DOMINION', icon: '◐',
    ruleApplied: 'Dominion',
    ruleExplanation: 'The same presence appears again and again -- their intention is undeniable.',
    headlines: [
      '{signal} Is Everywhere in the Grid Right Now',
      '{signal}\'s Reach Across the Zones',
      'The Grid Belongs to {signal} -- More Every Day',
      'Count the Zones: {signal} Leads',
      '{signal} at the Center of Everything',
      'The Grid\'s Shape: {signal} Dominant',
    ],
    bodies: [
      '{signal}\'s shape is in more zones than anyone else\'s right now. The Grid\'s active configuration shows it -- their presence covering more contested territory than {other} or any other signal holds.',
      'The distribution across the Grid tilts toward {signal}. More zones carrying their character. More of what\'s contested written with their mark. The Grid reflects what the record describes: a presence that has been consistently, persistently everywhere.',
      '{signal} has been marking across multiple zones simultaneously. The result on the Grid\'s active configuration: a presence distribution that no longer looks contested -- it looks like theirs. {other} is still shaping the margins. The center belongs to {signal}.',
      'Count the zones: {signal}\'s marks tip the balance across the Grid\'s active territory. More of the Grid in their shape. More zones where their marks have held and other signals\' counter-marks came back empty. The Grid is the argument.',
    ],
  },

  // ─── TEXTURE / DEPTH EVENTS ────────────────────────────────────────────────

  PULSE: {
    loreType: 'PULSE', icon: '≡',
    ruleApplied: 'Pulse',
    ruleExplanation: 'Every 10th entry -- a breath, a tally, the rhythm of the chronicle.',
    headlines: [
      'Ten Entries -- The Shape of the Last Stretch',
      'A Count of Ten: {signal} Leads',
      'Ten Moments: What They Add Up To',
      'At Ten -- Reading the Pattern',
      'Ten Marks, One Direction',
      'A Tally of What\'s Happened',
    ],
    bodies: [
      'Ten entries. Read the distribution across the last ten: {signal} marking, {other} responding, the Grid\'s active configuration ending up more {signal}\'s character every time things settle. Ten data points. One direction.',
      'The tally at ten: {signal} ahead in every measure the chronicle tracks -- zones marked, shapes held, counter-marks answered. {other} is behind. The gap has been widening.',
      'Ten log entries, read as one sequence: {signal} shaping the Grid, {other} yielding ground, the configuration moving toward {signal}\'s character without reversing once across the window. Ten is enough to call a pattern.',
      'At ten, the chronicle adds it up. {signal} more present, more active, more legible across every one of the ten entries than {other}. Ten is the Grid\'s smallest pattern. This one is clear.',
    ],
  },

  DEEP_READING: {
    loreType: 'DEEP_READING', icon: '∞',
    ruleApplied: 'Deep Reading',
    ruleExplanation: 'Every 40th entry -- the long view across everything.',
    headlines: [
      'Forty Entries -- Read as One Story',
      'The Long View: Forty Moments',
      'At Forty -- The Shape of the Whole',
      'The Chronicle at Forty: {signal} and the Long Game',
      'Forty Entries of This Grid: What They Show',
      'The Full Arc at Forty',
    ],
    bodies: [
      'Forty entries. The chronicle reads back across all forty and finds a direction: {signal}\'s character spreading across the Grid, entry by entry, consistently. Not dramatic in any single moment. Undeniable in aggregate.',
      'At forty, the chronicle steps back from the individual mark to the sequence. What forty entries describe: a Grid in motion, a direction, and {signal} on the shaping side of it. Forty entries of choices made by real signals producing a shape that no single choice explains.',
      'The deep reading at forty. Forty separate entries, read as one sequence: {signal} present and active, {other} adapting, the active Grid moving in one direction across all forty. The Grid doesn\'t decide this. The signals do. Forty entries of their decisions.',
      'At forty, the pattern is undeniable. {signal}\'s presence across forty entries -- near {zone} and elsewhere -- describes a signal that understands what it\'s doing. The long game. The accumulated mark. The Grid shows it.',
    ],
  },

  VIGIL: {
    loreType: 'VIGIL', icon: '⊙',
    ruleApplied: 'Vigil',
    ruleExplanation: 'Near an era threshold -- the world holds its breath.',
    headlines: [
      'The Threshold Is Near -- The Grid Feels It',
      'Near the Turn: Final Entries of This Era',
      'The Chronicle Approaches a Mark',
      'The Vigil Before the Next Chapter',
      'Everything Now Is Part of How This Era Ends',
      'Final Moments of the Current Chapter',
    ],
    bodies: [
      'The chronicle is near a threshold. The Grid is in its final entries before the next era -- every mark made now is part of what the record holds as the close of this chapter. The Grid doesn\'t pause for thresholds. The chronicle notes them.',
      'Near the mark. The activity near {zone} continues toward a count that changes the era name. What {signal} and {other} do in these cells now is what the era ends on. The Grid will remember -- the Grid remembers everything.',
      'Something is about to change in the chronicle\'s account of the Grid. Not the Grid itself -- the name the chronicle gives to this period. The count is close. Every mark near {zone} right now is part of how this chapter closes.',
      'The vigil before the turn: the chronicle approaching the entry count that closes this era. The Grid continues. The count advances with every new mark. What\'s being built near {zone} right now will be part of the next era\'s foundation.',
    ],
  },

  NEW_BLOOD: {
    loreType: 'NEW_BLOOD', icon: '->',
    ruleApplied: 'New Blood',
    ruleExplanation: 'A newly arrived signal makes their first marks -- texture entry.',
    headlines: [
      'Someone New at {zone}',
      'A Signal the Grid Hasn\'t Seen -- Near {zone}',
      'First Marks: {signal} at {zone}',
      'The Record Opens for Another Signal Near {zone}',
      'Not Yet Known at {zone}',
    ],
    bodies: [
      'Another signal, new to the Grid, active near {zone}. No prior history in the record. The chronicle opens a fresh entry and watches. Some new signals leave one mark and disappear. Others become something the chronicle tracks for years. This is entry one.',
      '{signal} arrived near {zone} without history on the Grid -- no prior marks, no established pattern, no record to read against. Just the first mark, which is the most honest thing a signal ever makes: the one before they know what they\'re building.',
      'New to this. {signal} is making their first marks near {zone}, learning the Grid\'s logic from the Grid itself. The configuration they find here has been shaped by others for a long time. They\'re working with what they find -- and leaving the first evidence of what they\'ll eventually become.',
    ],
    afterContext: {
      STORY_TOLD: 'Another new arrival at {zone}. The stories circulating about what happened here brought them. Word travels through the Grid. The Grid grows.',
    },
  },

  OLD_GHOST: {
    loreType: 'OLD_GHOST', icon: '◁',
    ruleApplied: 'Old Signal',
    ruleExplanation: 'An ancient presence appears -- they\'ve seen every version of this.',
    headlines: [
      'An Ancient Signal Near {zone}',
      'One of the First -- Active Near {zone}',
      'Old and Still Present Near {zone}',
      'The Chronicle\'s Oldest Signals: Near {zone}',
      'Before Most of This Existed -- Now at {zone}',
    ],
    bodies: [
      'Something very old is active near {zone}. A first-era signal -- early in the register, deep in the log -- marking cells in a zone that has been rewritten many times since they first appeared. They\'ve watched every version of it. Now they\'re adding to this one.',
      'Near {zone}, one of the Grid\'s original presences moved. They were there before most current signals made their first mark. The configuration has changed completely since. They\'re reading the new one and working with it.',
      'The chronicle\'s oldest entries point to a signal now active near {zone}. They\'ve been on the Grid since the log was young. Their mark rate is slow. Their history is long. Some signals in the Grid simply don\'t stop.',
      'Near {zone}, something ancient moved. The Grid\'s record had to reach back to find this presence\'s first entry. Still here. Still marking. Some presences in the Grid accumulate history the way a place accumulates sediment -- slowly, and in layers no one fully maps.',
    ],
    afterContext: {
      ERA_SHIFT: 'The new era drew the old signal out. Near {zone}, an ancient presence appeared -- watching the turn the way the oldest always watch turns. They have seen them before. They know what kind of thing tends to come next.',
      DEPARTURE: 'The fading near {zone} brought an ancient signal out. They had seen departures before, they said. This one resembled an earlier one. They wouldn\'t say what followed that time. Only: be ready.',
    },
  },

  WANDERER: {
    loreType: 'WANDERER', icon: '●',
    ruleApplied: 'Wanderer Returns',
    ruleExplanation: 'Someone comes back after being gone long enough to be almost forgotten.',
    headlines: [
      'A Signal Returns Near {zone}',
      '{signal} -- Back After the Long Absence',
      'Gone, Then Back Near {zone}',
      'The Absence Ends Near {zone}',
      'Back at {zone}: A Signal the Chronicle Had Lost',
    ],
    bodies: [
      'Near {zone}, a signal the Grid\'s record had gone quiet on came back. The gap in the record is visible -- a long stretch of nothing -- and now a mark. They\'re active again. The Grid that welcomed their return is not the Grid they left.',
      'A return near {zone}. The chronicle had noted the absence -- the stretch without any marks from this presence -- and now the absence is over. They\'re shaping cells again. What they do next will show how much the Grid\'s changes changed them.',
      '{signal} came back to the Grid near {zone}. The record shows when they last marked. Then silence. Then this entry -- the first mark after the gap. The record opens again. The chronicle watches what kind of signal they\'ve become since they left.',
      'They were gone. Now they\'re active near {zone}. The Grid\'s record holds both: the gap and the return. Whatever pulled them from the active Grid, it\'s done. They\'re here. The chronicle will track whether they stay.',
    ],
    afterContext: {
      LONG_DARK: 'The long stillness ended with a return. A signal gone since before the quiet reappeared near {zone} as activity resumed. Both things at once: the world waking up, and someone stepping back into it.',
      DEPARTURE: 'After the fading near {zone}, an old absence ended. Someone who had been gone came back to the active record. Drawn by what happened, or by the timing of it. The Grid doesn\'t explain returns.',
    },
  },

  THE_BUILDER: {
    loreType: 'THE_BUILDER', icon: '⊓',
    ruleApplied: 'The Builder',
    ruleExplanation: 'Rapid cluster of activity from the same signal -- something is being made.',
    headlines: [
      '{signal} -- Fast and Deliberate Near {zone}',
      'A Burst of Making Near {zone}',
      '{signal} Escalates Their Presence at {zone}',
      'Something Is Being Built Near {zone}',
      'High Tempo: {signal} at {zone}',
      'The Pace Changes Near {zone}',
    ],
    bodies: [
      '{signal} moved fast and often near {zone} -- multiple marks in a short window, each one building on the last. Something shifted in their approach. The pace changed.',
      'A burst of activity from {signal} near {zone}. Not one large reshaping -- a cluster of smaller ones, rapid and deliberate, each mark locking more of the zone into their shape.',
      'Near {zone}, {signal} picked up their rate dramatically. More marks per block window, faster response to what {other} was doing, an urgency that hadn\'t been in the record before.',
      '{signal} came to {zone} with a different tempo -- more marks, faster, concentrated in a way that looked like intent rather than habit. The configuration near {zone} changed faster for it.',
    ],
    afterContext: {
      SIGNAL_SURGE: 'After the big reshaping, {signal} met the zone differently -- accounting for what was used and what remained. Fast activity after a large change always requires this kind of follow-through.',
      DEPARTURE: 'After the fading, {signal} moved faster. Not strategy -- urgency. Who was gone, what that meant, what needed to happen next. The pace near {zone} reflects all of that.',
    },
  },

  CARTOGRAPHER: {
    loreType: 'CARTOGRAPHER', icon: '⊞',
    ruleApplied: 'Cartographer',
    ruleExplanation: 'Someone reads the current shape of the Grid -- accurate understanding is power.',
    headlines: [
      'The Shape of {zone} -- Read and Recorded',
      'Where Things Stand Near {zone}',
      'The Chronicle Takes Stock Near {zone}',
      'The Current Configuration at {zone}',
      'Surveying {zone}: Who Holds What Shape',
      'A Reading of the Grid at {zone}',
    ],
    bodies: [
      'The configuration at {zone}, read from the current Grid: {signal}\'s shape in the interior, {other}\'s holding the margins, the boundary between them drawn by the most recent activity.',
      'The chronicle reads {zone}\'s current state. {signal} further into the zone than the last reading. {other} compressed at the edges. The distribution has been moving in one direction.',
      'A survey of {zone}: the story written in cells. {signal} here, {other} there, the contested middle ground carrying every configuration it\'s held since the first mark in the log.',
      'Where things stand at {zone}: {signal} with more of the zone than {other}, the boundary settled into the configuration recent activity left it. Not permanent. Current. The next mark will shift it.',
    ],
    afterContext: {
      SIGNAL_SURGE: 'After the reshaping, a survey was needed. The configuration had changed. The chronicle needed to record where things stood before the next movement obscured it.',
      THE_QUIET: 'The stillness was the right time for a reading. With nothing moving, {zone} could be understood as it actually was -- not as it had been while things were changing.',
    },
  },

  GONE: {
    loreType: 'GONE', icon: '○',
    ruleApplied: 'Gone',
    ruleExplanation: 'A signal stops appearing -- the record closes and their mark remains.',
    headlines: [
      'A Signal Goes Quiet Near {zone}',
      '{signal} -- Last Seen Near {zone}',
      'The Record Closes: Near {zone}',
      'Gone Quiet: Near {zone}',
      'One Less Presence Near {zone}',
      'They Were Here. Now They\'re Not.',
    ],
    bodies: [
      'A signal that had been marking near {zone} went quiet. The Grid\'s record closes at a specific entry -- after it, nothing. Their shape still marks the cells they last worked. They\'re no longer in the active Grid.',
      'Near {zone}, a consistent presence stopped appearing. The record ends at their last mark. What pulled them from the active Grid isn\'t logged. The absence is.',
      'The record near {zone} shows a gap where a regular signal used to be. Their last mark is there. Everything after: missing. The cells they shaped still carry their form.',
      'Someone who had been marking at {zone} left the Grid. Not in a reshaping -- they simply stopped. The chronicle closes their entry at the last confirmed mark. The Grid runs on.',
    ],
    afterContext: {
      DEPARTURE: 'After the fading, one who had witnessed it stopped appearing. The chronicle notes both events in sequence without claiming a connection.',
      THE_QUIET: 'The quiet stretched long enough that some signals did not come back out of it. Near {zone}, one has gone dark -- no marks in the record since the stillness started. Stillness can be a kind of ending.',
    },
  },

  STORY_TOLD: {
    loreType: 'STORY_TOLD', icon: '≈',
    ruleApplied: 'Story Told',
    ruleExplanation: 'Stories circulate about what happened -- the Grid\'s history travels through its people.',
    headlines: [
      'The Story Going Around Near {zone}',
      'What They\'re Saying Near {zone}',
      'The Account Spreading Near {zone}',
      'Near {zone}: The Version People Are Telling',
      'How Things Are Being Described Near {zone}',
    ],
    bodies: [
      'The version of events circulating near {zone} is simpler than the one the Grid\'s record holds. {signal} are the protagonists. The configuration changes make clean sense. The Grid\'s actual sequence is more complicated -- it always is.',
      'Near {zone}, the account people are sharing has {signal} moving clearly and {other} yielding clearly. One reading of the Grid\'s record. The chronicle holds several others. Stories need shapes. The Grid\'s truth resists them.',
      'Word traveling near {zone}: {signal} dominating the configuration, {other} adapting, the direction obvious. This is what the Grid looks like at a glance. The record is longer than a glance.',
      'The story being told about {zone} has a clear arc -- {signal} as the force, {other} as the response. One interpretation of the Grid\'s sequence. Accurate in outline. Missing the moments between the marks.',
    ],
    afterContext: {
      FIRST_LIGHT: 'The new arrival at {zone} had heard stories before they got there. The stories and the Grid they found were related but not identical. They are adjusting.',
      SIGNAL_SURGE: 'The accounts of the reshaping have already grown larger than the Grid\'s actual record. Near {zone}, newer signals describe something close to legend. The older ones who were there listen and say nothing.',
    },
  },

  LONG_DARK: {
    loreType: 'LONG_DARK', icon: '░',
    ruleApplied: 'Long Dark',
    ruleExplanation: 'A very long silence -- the Grid was still for a long time.',
    headlines: [
      'A Long Quiet Near {zone}',
      'The Chronicle Goes Still Near {zone}',
      'Extended Stillness Near {zone}',
      'The Grid Pauses Near {zone}',
      'Many Entries, Almost Nothing Near {zone}',
    ],
    bodies: [
      'The Grid near {zone} went quiet for a long stretch. Not the short pause between marks -- a real stillness, many entries long, the configuration holding without change while the rest of the Grid moved elsewhere.',
      'Near {zone}, the chronicle crossed a long gap. The configuration held from the last active period. No new marks. No new shapes. The Grid unchanged in this zone across many logged blocks.',
      'A sustained stillness near {zone}: many entries with almost nothing to record. The activity didn\'t stop -- it simply moved away from here. The cells sat in the last shapes they were given.',
      'The long dark near {zone}: a stretch of the Grid\'s record that describes near-stillness. Both presences still registered. The configuration unchanged. Long enough to name as its own thing.',
    ],
    afterContext: {
      SIGNAL_SURGE: 'The reshaping at {zone} came out of the long stillness -- which means {signal} used the dark to prepare. The whole quiet was preparation. The reshaping was the delivery.',
      ERA_SHIFT: 'The long stillness was the space between eras. {era} began when the quiet ended -- the dark was the pause between one chapter and the next.',
    },
  },


  PIVOT: {
    loreType: 'PIVOT', icon: '↺',
    ruleApplied: 'Pivot',
    ruleExplanation: 'A veteran signal does something unexpected -- the Grid taught them something.',
    headlines: [
      '{signal} Changes Their Approach Near {zone}',
      'A New Way of Moving Near {zone}',
      'Near {zone}: {signal} Breaks Their Own Pattern',
      '{signal}\'s Approach Shifts Near {zone}',
      'Something Different in {signal}\'s Marks Near {zone}',
    ],
    bodies: [
      '{signal} changed their marking pattern near {zone}. Different cells, different edges -- the Grid\'s configuration updating in a way that doesn\'t match what the recent record showed. Something changed.',
      'Near {zone}, {signal} shifted approach. The targets changed. The sequence changed. The Grid is logging a different kind of presence from the same signal.',
      '{signal} adjusted their expression near {zone} -- different zones, different pace, the pattern breaking from what the recent record showed. Something in them shifted. The new approach is running.',
      'The way {signal} is marking {zone}\'s cells now is not the way they were marking them before. Both patterns are in the record. The gap between them is where the decision was made.',
    ],
    afterContext: {
      THE_READING: 'The pattern reading made {signal} change course. Twenty-five entries of moving one way, then seeing the shape from outside, then deciding it needed to break. Near {zone}, it broke.',
      THE_QUIET: 'The stillness gave {signal} time to reconsider. The next move near {zone} looked nothing like what came before the pause. The stillness was used for something.',
    },
  },

  UNALIGNED: {
    loreType: 'UNALIGNED', icon: '□',
    ruleApplied: 'Unaligned',
    ruleExplanation: 'A signal outside the main currents -- not everyone has found a pattern to follow.',
    headlines: [
      'A Presence Outside the Main Currents Near {zone}',
      'Neither {signal} Nor {other}: Someone Else at {zone}',
      'An Unaffiliated Presence Near {zone}',
      'Outside the Dominant Patterns -- Near {zone}',
      'The Grid Gets a Different Kind of Signal Near {zone}',
    ],
    bodies: [
      'Neither {signal} nor {other} -- a third kind of presence marked near {zone}. The Grid logged it. The configuration shows a shape that doesn\'t belong to either of the main currents. Something else is active.',
      'The story near {zone} has been described as two-sided. A mark in the current window complicates that -- a signal outside both main patterns, active in the middle of what everyone thought was settled.',
      'Neither {signal} nor {other}. Near {zone}, a presence outside the main currents has placed their shape in space both sides claim. The Grid logged the mark without asking whose pattern it fits.',
      'The configuration near {zone} just got more complicated. A signal outside the dominant patterns placed their shape in the contested zone -- unaffiliated, making their own mark on the Grid\'s record.',
    ],
  },


  DYNASTY: {
    loreType: 'DYNASTY', icon: '▪',
    ruleApplied: 'Dynasty',
    ruleExplanation: 'Three appearances from the same signal -- a pattern becomes a lineage.',
    headlines: [
      '{signal} at {zone} -- Three Times and Counting',
      'A Pattern at {zone}: {signal} Keeps Coming Back',
      '{signal}\'s Relationship with {zone} Is a History Now',
      'Third Time at {zone}: Something Is Forming',
      '{zone} Keeps Seeing {signal}',
      'The Record at {zone}: {signal} More Than Anyone',
    ],
    bodies: [
      '{signal} at {zone} -- again. Third entry in the record for this signal at this zone. Once is presence. Twice is intention. Three times is a lineage -- the kind of thing the chronicle starts to track differently.',
      'Third mark from {signal} at {zone}. The Grid\'s record holds all three. Once: arrival. Twice: intent. Three times: something the configuration of {zone} now reflects as a repeated presence that the record can\'t ignore.',
      '{zone} and {signal}: three entries in the record, each one deepening the relationship. Not one large reshaping -- a repeated presence that the zone\'s history now carries.',
      '{signal} returned to {zone} a third time. The first was a visit. The second was intention. The third is a dynasty in the Grid\'s record -- a zone that keeps drawing the same signal back.',
    ],
  },

  THRESHOLD: {
    loreType: 'THRESHOLD', icon: '×',
    ruleApplied: 'Threshold',
    ruleExplanation: 'A known signal enters a zone they\'ve never marked before.',
    headlines: [
      '{signal} Reaches {zone} for the First Time',
      'New Zone: {signal} at {zone}',
      'The Chronicle Opens {zone} for {signal}',
      'A First Mark at {zone}: {signal} Arrives',
      '{signal} Crosses into {zone}',
    ],
    bodies: [
      '{signal} marked near {zone} for the first time. No prior history in the record for this signal in this zone -- just this entry, which opens a new thread in the chronicle.',
      'First mark: {signal} at {zone}. The Grid\'s record for this combination starts here. No prior entries, no prior shape. The record opens.',
      '{signal} extended their presence to {zone}. A zone they hadn\'t marked before. The Grid confirmed the first entry. What they build from it is ahead in the record.',
      'New territory for {signal}: {zone}, never in their history before. The first mark is the most honest -- before they know what they\'re building. The chronicle opens a new thread.',
    ],
  },

  THE_STEADY: {
    loreType: 'THE_STEADY', icon: '―',
    ruleApplied: 'The Steady',
    ruleExplanation: 'The unglamorous work -- maintaining presence without drama.',
    headlines: [
      '{signal} Holds Their Ground Near {zone}',
      'Steady Work Near {zone} -- {signal} Persists',
      'The Quiet Maintenance Near {zone}',
      '{signal} Keeps {zone} Without Making News',
      'Small Acts of Holding Near {zone}',
    ],
    bodies: [
      '{signal} doing the quiet work near {zone}: small marks, steady presence, the zone maintained rather than advanced. The kind of activity that keeps held space held.',
      'Near {zone}, {signal} holds through consistent low-intensity presence rather than through major reshapings. Small marks that keep the zone carrying their shape without claiming it again.',
      'The Grid near {zone} under {signal}\'s steady attention: not advancing, not yielding -- holding. Small marks that confirm the zone without expanding it. Unglamorous. Necessary.',
      '{signal} holds {zone} by returning to it. Small marks that confirm the zone is theirs without forcing a complete reshaping to prove it again. The cells hold. So do they.',
    ],
  },

  NIGHTWATCH: {
    loreType: 'NIGHTWATCH', icon: '◦',
    ruleApplied: 'Night Watch',
    ruleExplanation: 'A quiet vigil -- the Grid is tended in the dark intervals.',
    headlines: [
      'The Ground Held Near {zone}',
      '{signal} Watches the Zone Near {zone}',
      'Low Activity, Steady Presence Near {zone}',
      'The Night Watch at {zone}',
      'Held Without Drama -- Near {zone}',
    ],
    bodies: [
      'Near {zone}, {signal} holds through the quiet -- small marks, steady presence, the zone maintained by attention rather than force. The Grid logs small marks the same as large ones.',
      'The night watch near {zone}: {signal} maintaining their presence through low-activity intervals. Not a surge. Not a statement. The kind of consistency that keeps a zone from drifting when no one is pushing.',
      'Near {zone}, quiet on the Grid. {signal} still active, still confirming their shape in small marks -- low intensity, but not absent. The chronicle records the watch.',
      '{signal} kept {zone} through the quiet stretch -- small confirmations, the zone maintained by regular low-level presence. This is how held territory stays held in the Grid. Entry by entry.',
    ],
  },

  // ─── CONNECTORS -- auto-inserted ──────────────────────────────────────────

  RESONANCE: {
    loreType: 'RESONANCE', icon: '·',
    ruleApplied: 'Resonance',
    ruleExplanation: 'Auto-inserted after a major shift -- the Grid absorbs what just happened.',
    headlines: [
      'After the Shift at {zone} -- {signal} Settles In',
      'The Work After the Change at {zone}',
      '{signal} Consolidates at {zone}',
      'The Quiet Work After the Big Moment at {zone}',
      'After the Move: Steady Confirmation at {zone}',
    ],
    bodies: [
      'After the shift at {zone}, the Grid settled. {signal} consolidating what the change established -- smaller marks now, the zone being confirmed rather than advanced.',
      'The major reshaping at {zone} is done. {signal} is in the aftermath -- smaller marks, the zone being held, the shape maintained rather than expanded. Quieter. Still in the record.',
      'Following the big moment near {zone}: lower intensity, the configuration stabilizing around the new state {signal}\'s reshaping created. The work is done. The holding begins.',
      'After a major shift, the Grid requires smaller follow-through. Near {zone}: {signal} in resonance mode, the zone being locked in through consistent presence rather than force.',
    ],
  },

  ACCELERATION: {
    loreType: 'ACCELERATION', icon: '↑',
    ruleApplied: 'Acceleration',
    ruleExplanation: 'Auto-inserted when the pace surges -- the chronicle notices the change.',
    headlines: [
      'The Grid Picks Up Speed Near {zone}',
      'More Activity, Faster -- Near {zone}',
      'The Tempo Changes Near {zone}',
      'Something Drives the Grid Faster Near {zone}',
      'Escalating Near {zone}: The Rate Is Rising',
    ],
    bodies: [
      'The activity near {zone} has accelerated. More marks per window, larger reshapings per event, the Grid\'s record moving faster than the recent baseline.',
      'The mark rate near {zone} picked up. {signal} and {other} both moving faster -- more changes per window, the active configuration shifting at a pace the recent entries didn\'t show.',
      'The Grid near {zone} is moving faster. Mark density up, changes per event larger, the record accumulating entries faster than it had been. Something escalated.',
      'More activity. The record near {zone} shows a denser pattern than the previous window -- both signals contributing to a configuration that just picked up speed.',
    ],
  },

  WEIGHT: {
    loreType: 'WEIGHT', icon: '†',
    ruleApplied: 'Weight',
    ruleExplanation: 'Auto-inserted when cumulative energy crosses a threshold -- the toll accumulates.',
    headlines: [
      'The Weight Accumulates -- Another Threshold',
      'The Chronicle Counts What Has Passed',
      'The Accumulated Passage of Energy',
      'Another Mark in the Record of What Was Given',
      'The Passings Are Adding Up',
    ],
    bodies: [
      'The total crossed another mark. All the energy that has moved through the Grid -- every signal that gave something forward, every transfer recorded -- has accumulated to a threshold worth noting.',
      'The chronicle counts the passings. Across all entries, the record of given energy has grown to a new threshold. Each individual transfer was one entry. Together they describe a scale of generosity the Grid accumulates quietly.',
      'Another mark in the passage register. The accumulated energy movements have crossed a threshold -- not through one large giving but through many small ones logged across many entries.',
      'The toll is real. The energy total across the current chronicle window has reached a new level -- each giving small in the record, together describing something the chronicle marks.',
    ],
  },

}

// ─────────────────────────────────────────────────────────────────────────────

function isPrime(n: number): boolean {
  if (n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false
  return true
}

function isRareTxHash(h: string): boolean {
  return /^(.)\1{3}$/.test(h.slice(-4))
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE SELECTION -- the genius engine
// Priority order determines what fires. Arc tension shapes which texture rules appear.
// ─────────────────────────────────────────────────────────────────────────────

function selectRule(
  event: IndexedEvent,
  index: number,
  allEvents: IndexedEvent[],
  cumCount: number,
  prev: IndexedEvent | null,
  state: WarState,
): string {
  const tokenId = Number(event.tokenId)
  const count   = Number(event.count)
  const priorSameOwner = allEvents.slice(0, index).filter(e => e.owner === event.owner)
  const isVeteran = priorSameOwner.length > 0
  const seed = seedN(event.tokenId, event.blockNumber)

  // ── Structural milestones (always fire -- narrative skeleton) ──────────────
  if (cumCount > 0 && cumCount % 40 === 0) return 'DEEP_READING'
  if (cumCount > 0 && cumCount % 25 === 0) return 'THE_READING'
  if (cumCount > 0 && cumCount % 10 === 0) return 'PULSE'
  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'ERA_SHIFT'
  const nextEra = ERAS.find(e => e.threshold > cumCount)
  if (nextEra && nextEra.threshold - cumCount <= 3) return 'VIGIL'

  // ── Rare / special signals ────────────────────────────────────────────────
  if (isRareTxHash(event.transactionHash)) return 'RELIC_FOUND'
  if (prev && prev.blockNumber === event.blockNumber) return 'CONVERGENCE'

  // ── Arc-driven pacing -- shapes the emotional rhythm ──────────────────────
  // Too much intensity -> force breathing room
  if (state.arcTension >= 75 && state.sinceLastQuiet >= 5 && seed % 3 === 0) {
    return avoidRepeat('INTERVAL', state, 'NIGHTWATCH')
  }
  // Too quiet too long -> nudge toward activity
  if (state.arcTension < 25 && state.sinceLastBattle >= 10 && seed % 4 === 0) {
    return 'MARK_MADE'
  }
  // After a departure, next pixel event leans reflective
  if (state.sinceLastSacrifice === 1 && event.type !== 'BurnRevealed' && seed % 2 === 0) {
    return avoidRepeat('OLD_GHOST', state, 'STORY_TOLD')
  }

  // ── Block gap signals -- time is a character in this story ─────────────────
  if (prev) {
    const gap = event.blockNumber - prev.blockNumber
    if (gap > 50000n) return 'LONG_DARK'
    if (gap > 10000n) return avoidRepeat('THE_QUIET', state, 'INTERVAL')
    if (gap > 3000n && seed % 3 === 0) return avoidRepeat('INTERVAL', state, 'NIGHTWATCH')
  }

  // ── Veteran-specific signals ───────────────────────────────────────────────
  if (isVeteran) {
    const last = priorSameOwner[priorSameOwner.length - 1]
    const gap = event.blockNumber - last.blockNumber
    if (gap > 20000n) return 'WANDERER'
    if (gap < 500n) return avoidRepeat('THE_BUILDER', state, 'PIVOT')
  }

  // ── Token range signals -- the Grid's population has internal structure ────
  if (tokenId < 500 && index > 10) return avoidRepeat('OLD_GHOST', state, 'ANCIENT_STIRS')
  if (tokenId < 1000) return avoidRepeat('ANCIENT_STIRS', state, 'THE_ELDER')
  if (tokenId >= 1000 && tokenId < 2000 && !isVeteran) return avoidRepeat('THRESHOLD', state, 'NEW_BLOOD')
  if (tokenId >= 2000 && tokenId < 3000) return seed % 3 === 0
    ? avoidRepeat('CARTOGRAPHER', state, 'THE_STEADY')
    : avoidRepeat('THE_STEADY', state, 'NIGHTWATCH')
  if (tokenId >= 5000 && tokenId <= 6000) return avoidRepeat('CONTESTED_ZONE', state, 'GHOST_TOUCH')
  if (tokenId > 8500 && index > 5) return avoidRepeat('FAR_SIGNAL', state, 'WANDERER')
  if (tokenId > 8000) return avoidRepeat('FAR_SIGNAL', state, 'GHOST_TOUCH')
  if (isPrime(tokenId)) return avoidRepeat('THE_ELDER', state, 'ANCIENT_STIRS')

  // ── Energy events (burns) -- dissolution, not sacrifice ────────────────────
  if (event.type === 'BurnRevealed') {
    if (count >= 10) return 'DEPARTURE'
    if (count === 1) return avoidRepeat('PASSING', state, 'GHOST_TOUCH')
    if (isVeteran && priorSameOwner.filter(e => e.type === 'BurnRevealed').length >= 2)
      return avoidRepeat('TWICE_GIVEN', state, 'PASSING')
    if (isVeteran) return avoidRepeat('PASSING', state, 'TWICE_GIVEN')
    return avoidRepeat('PASSING', state, 'GHOST_TOUCH')
  }

  // ── Pixel count signals -- size of mark = weight of statement ──────────────
  if (count >= 200) return 'SIGNAL_SURGE'
  if (count >= 50 && count % 50 === 0) return avoidRepeat('DECLARATION', state, 'MARK_MADE')
  if (count >= 50) return avoidRepeat('MARK_MADE', state, 'GHOST_TOUCH')
  if (count === 1) return 'GHOST_TOUCH'

  // ── Veteran arc-aware roll ─────────────────────────────────────────────────
  if (isVeteran) {
    const roll = seedN(event.tokenId, event.blockNumber, 23) % 10
    if (state.phase === 'escalating' || state.phase === 'siege') {
      if (roll <= 2) return avoidRepeat('MARK_MADE', state, 'GHOST_TOUCH')
      if (roll === 3) return avoidRepeat('DOMINION', state, 'DYNASTY')
      if (roll === 4) return avoidRepeat('DYNASTY', state, 'RETURN')
      if (roll === 5) return avoidRepeat('PIVOT', state, 'THE_BUILDER')
      if (roll === 6) return avoidRepeat('THRESHOLD', state, 'FAR_SIGNAL')
      if (roll === 7) return avoidRepeat('CARTOGRAPHER', state, 'FAR_SIGNAL')
      if (roll === 8) return avoidRepeat('STORY_TOLD', state, 'UNALIGNED')
      return avoidRepeat('RETURN', state, 'MARK_MADE')
    }
    // Quieter phases -- more texture, more character
    if (roll === 0) return avoidRepeat('DOMINION', state, 'DYNASTY')
    if (roll === 1) return avoidRepeat('THRESHOLD', state, 'FAR_SIGNAL')
    if (roll === 2) return priorSameOwner.length >= 3
      ? avoidRepeat('DYNASTY', state, 'RETURN')
      : avoidRepeat('RETURN', state, 'MARK_MADE')
    if (roll === 3) return avoidRepeat('PIVOT', state, 'THE_BUILDER')
    if (roll === 4) return avoidRepeat('GONE', state, 'UNALIGNED')
    if (roll === 5) return avoidRepeat('THE_STEADY', state, 'CARTOGRAPHER')
    if (roll === 6) return avoidRepeat('STORY_TOLD', state, 'OLD_GHOST')
    if (roll === 7) return avoidRepeat('THRESHOLD', state, 'FAR_SIGNAL')
    if (roll === 8) return avoidRepeat('NIGHTWATCH', state, 'INTERVAL')
    return avoidRepeat('RETURN', state, 'MARK_MADE')
  }

  // ── New signal roll ────────────────────────────────────────────────────────
  const newRoll = seedN(event.tokenId, event.blockNumber, 29) % 8
  if (newRoll === 0) return avoidRepeat('STORY_TOLD', state, 'NEW_BLOOD')
  if (newRoll === 1) return avoidRepeat('UNALIGNED', state, 'NEW_BLOOD')
  if (newRoll === 2) return avoidRepeat('NIGHTWATCH', state, 'GHOST_TOUCH')
  if (newRoll === 3) return avoidRepeat('GHOST_TOUCH', state, 'NEW_BLOOD')
  if (newRoll === 4) return avoidRepeat('NEW_BLOOD', state, 'STORY_TOLD')
  if (newRoll === 5) return avoidRepeat('THRESHOLD', state, 'NEW_BLOOD')
  if (newRoll === 6) return avoidRepeat('GHOST_TOUCH', state, 'FAR_SIGNAL')
  return avoidRepeat('NEW_BLOOD', state, 'STORY_TOLD')
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY SELECTION -- uses narrative memory for richer prose when available
// ─────────────────────────────────────────────────────────────────────────────

function selectBody(
  rule: LoreRule,
  ctx: WorldCtx,
  state: WarState,
  seed: number
): { headline: string; body: string } {
  const cs = Math.abs(seed ^ (state.eventCount * 7919) ^ (state.consecutiveCores * 1031))

  // Phase variants fire 30% of the time
  if (rule.phaseVariants) {
    const variant = rule.phaseVariants.find(v => v.phase === state.phase)
    if (variant && cs % 10 < 3) {
      return {
        headline: variant.headline ? fill(variant.headline, ctx) : fill(pick(rule.headlines, cs), ctx),
        body: fill(variant.body, ctx),
      }
    }
  }

  // After-context fires 25% of the time when there's a relevant last core type
  if (rule.afterContext && state.lastCoreType) {
    const contextBody = rule.afterContext[state.lastCoreType]
    if (contextBody && cs % 4 === 0) {
      return {
        headline: fill(pick(rule.headlines, cs + 1), ctx),
        body: fill(contextBody, ctx),
      }
    }
  }

  const s2 = seedN(BigInt(cs), BigInt(state.eventCount + seed), 3)
  return {
    headline: fill(pick(rule.headlines, seed), ctx),
    body: fill(pick(rule.bodies, s2), ctx),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTORS
// ─────────────────────────────────────────────────────────────────────────────

function shouldInsertConnector(
  prevRuleKey: string,
  nextRuleKey: string,
  state: WarState,
  blockGap: bigint
): string | null {
  const nextIsCore = isCoreType(nextRuleKey)
  if (prevRuleKey === 'SIGNAL_SURGE' && nextIsCore && blockGap < 2000n) return 'RESONANCE'
  if (state.consecutiveCores >= 3 && nextIsCore) return 'INTERVAL'
  if (state.pixelsInWindow >= 500 && nextRuleKey !== 'ACCELERATION' && isCoreType(prevRuleKey) && nextIsCore) return 'ACCELERATION'
  const burnThresholds = [25, 50, 100, 200]
  for (const t of burnThresholds) {
    const prev = state.totalBurnAP - (prevRuleKey === 'DEPARTURE' ? 12 : 0)
    if (state.totalBurnAP >= t && prev < t) return 'WEIGHT'
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY ENTRY INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

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
  // Visual state -- drives the WarGrid animation
  visualState?: {
    mood: 'surge' | 'quiet' | 'departure' | 'discovery' | 'wonder' | 'chaos' | 'normal'
    intensity: number   // 0-100
    dominantZone: string
    signalName: string
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

// ─────────────────────────────────────────────────────────────────────────────
// INTERVAL RULE (filler, needs to be in RULES for connector to work)
// ─────────────────────────────────────────────────────────────────────────────

RULES['INTERVAL'] = {
  loreType: 'INTERVAL' as LoreType,
  icon: '~',
  ruleApplied: 'Interval',
  ruleExplanation: 'A breath between events -- the ordinary world.',
  headlines: [
    'A Breath Between Moments Near {zone}',
    'The Quiet Between the Marks Near {zone}',
    'Low Activity -- The Grid Catches Itself Near {zone}',
    'Between Moments: Near {zone}',
    'Not Moving -- Near {zone}',
    'The Grid Rests Near {zone}',
  ],
  bodies: [
    'The Grid near {zone} paused. Both shapes present, both signals registered but not active, neither adding to what\'s already there. The configuration holds. The pause has its own weight.',
    '{signal} and {other} face each other across {zone}\'s current shape in a moment between marks. The last change settled. The next one hasn\'t started. The Grid holds its current form.',
    'A rest near {zone}: low activity, both presences in position, neither pressing. The story hasn\'t stopped -- it\'s between moments. This kind of quiet doesn\'t last.',
    'Near {zone}, the space between marks. The configuration unchanged from the last active period. Both signals still present on the Grid. The next mark simply hasn\'t started forming yet.',
    'The ordinary quiet of a long Grid story: near {zone}, a pause that has no drama -- just the absence of the next mark, which will come when it comes.',
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL MOOD -- drives the WarGrid animation
// ─────────────────────────────────────────────────────────────────────────────

type VisualStateFull = NonNullable<StoryEntry['visualState']>

function moodFromRule(ruleKey: string, state: WarState): VisualStateFull {
  const ZONE_RULES: Record<string, string> = {}
  const moodMap: Record<string, VisualStateFull['mood']> = {
    SIGNAL_SURGE: 'surge',
    MARK_MADE: 'surge',
    DECLARATION: 'surge',
    DEPARTURE: 'departure',
    TWICE_GIVEN: 'departure',
    PASSING: 'quiet',
    THE_QUIET: 'quiet',
    LONG_DARK: 'quiet',
    NIGHTWATCH: 'quiet',
    INTERVAL: 'quiet',
    RELIC_FOUND: 'discovery',
    CONVERGENCE: 'wonder',
    ERA_SHIFT: 'wonder',
    THE_READING: 'chaos',
    DEEP_READING: 'chaos',
    ANCIENT_STIRS: 'wonder',
    THE_ELDER: 'wonder',
  }
  const mood = moodMap[ruleKey] ?? 'normal'
  const intensity = Math.round(state.arcTension)
  const dominantZone = state.world.lastSurgeZone ?? 'the Open Grid'
  const signalName = state.world.dominantSignalName ?? 'the Unnamed'
  return { mood, intensity, dominantZone, signalName }
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNTHETIC ENTRY MAKER
// ─────────────────────────────────────────────────────────────────────────────

function makeSyntheticEntry(
  ruleKey: string,
  afterEvent: IndexedEvent,
  era: string,
  state: WarState
): StoryEntry {
  const rule = RULES[ruleKey]
  const ctx = buildCtx(afterEvent.tokenId, afterEvent.blockNumber + 1n, era, afterEvent.owner, state.world, 0)
  const seed = seedN(afterEvent.tokenId, afterEvent.blockNumber, 99)
  const s2 = seedN(afterEvent.tokenId, afterEvent.blockNumber, 77)
  return {
    id: `synthetic-${ruleKey}-${afterEvent.transactionHash}`,
    eventType: 'PixelsTransformed',
    loreType: rule.loreType,
    era,
    headline: fill(pick(rule.headlines, seed), ctx),
    body: fill(pick(rule.bodies, s2), ctx),
    icon: rule.icon,
    featured: false,
    synthetic: true,
    visualState: moodFromRule(ruleKey, state),
    sourceEvent: {
      type: 'connector',
      tokenId: '--',
      blockNumber: '--',
      txHash: '--',
      count: '--',
      ruleApplied: rule.ruleApplied,
      ruleExplanation: rule.ruleExplanation,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURED TYPES
// ─────────────────────────────────────────────────────────────────────────────

const FEATURED_TYPES = new Set([
  'SIGNAL_SURGE', 'THE_READING', 'ERA_SHIFT', 'RELIC_FOUND',
  'DEEP_READING', 'CONVERGENCE', 'DEPARTURE', 'LONG_DARK',
  'ACCELERATION', 'WEIGHT',
])

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function generateStoryEntries(events: IndexedEvent[], startCount = 0): StoryEntry[] {
  const result: StoryEntry[] = []
  const ruleKeys: string[] = []
  const scanState = freshWarState()

  // First pass -- determine rule for every event
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const cumCount = startCount + i + 1
    const prev = i > 0 ? events[i - 1] : null
    const ruleKey = selectRule(event, i, events, cumCount, prev, scanState)
    ruleKeys.push(ruleKey)
    updateWarState(scanState, event, ruleKey, events, i, cumCount)
  }

  // Second pass -- generate entries using accumulated world memory
  const genState = freshWarState()
  for (let index = 0; index < events.length; index++) {
    const event = events[index]
    const cumCount = startCount + index + 1
    const ruleKey = ruleKeys[index]
    const nextRuleKey = ruleKeys[index + 1] ?? null

    const rule = RULES[ruleKey] ?? RULES['NIGHTWATCH']
    const era = getEra(cumCount)
    const ctx = buildCtx(event.tokenId, event.blockNumber, era, event.owner, genState.world, cumCount)
    const seed = seedN(event.tokenId, event.blockNumber)
    const { headline, body } = selectBody(rule, ctx, genState, seed)

    result.push({
      id: `${event.transactionHash}-${event.tokenId.toString()}`,
      eventType: event.type,
      loreType: rule.loreType,
      era,
      headline,
      body,
      icon: rule.icon,
      featured: FEATURED_TYPES.has(ruleKey) || Number(event.count) > 200,
      visualState: moodFromRule(ruleKey, genState),
      sourceEvent: {
        type: event.type,
        tokenId: event.type === 'BurnRevealed' && event.targetTokenId !== undefined
          ? `#${event.tokenId.toString()} -> #${event.targetTokenId.toString()}`
          : `#${event.tokenId.toString()}`,
        blockNumber: event.blockNumber.toLocaleString(),
        txHash: event.transactionHash,
        count: event.count.toString(),
        ruleApplied: rule.ruleApplied,
        ruleExplanation: rule.ruleExplanation,
      },
    })

    updateWarState(genState, event, ruleKey, events, index, cumCount)

    if (nextRuleKey !== null && events[index + 1]) {
      const nextEvent = events[index + 1]
      const blockGap = nextEvent.blockNumber - event.blockNumber
      const connectorKey = shouldInsertConnector(ruleKey, nextRuleKey, genState, blockGap)
      if (connectorKey) result.push(makeSyntheticEntry(connectorKey, event, era, genState))
    }
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMER ENTRIES -- the world before the first event
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMER_ENTRIES: StoryEntry[] = [
  {
    id: 'primer-genesis',
    eventType: 'genesis',
    loreType: 'GENESIS',
    era: 'The First Days',
    headline: 'Ten Thousand Signals. One Grid. The Story Has Not Yet Started.',
    body: 'Ten thousand faces share a world called the Grid. It stretches in every direction -- a living space of cells and signals, each one capable of being shaped, marked, held, or released. None of them know yet what the others will do with it. None of them know what they will do with it themselves. The chronicle is open. What follows will be shaped by real choices made by real people, each one changing the world invisibly and permanently. The Grid forgets nothing. The chronicle records everything. The first entry has not yet been made.',
    icon: '◈',
    featured: true,
    visualState: { mood: 'wonder', intensity: 10, dominantZone: 'the Open Grid', signalName: 'the Unnamed' },
    sourceEvent: {
      type: 'genesis',
      tokenId: 'All 10,000',
      blockNumber: 'Genesis',
      txHash: 'N/A',
      count: '10000',
      ruleApplied: 'Genesis',
      ruleExplanation: 'Normies are 10,000 fully on-chain pixel faces on Ethereum. Every real action shapes this story.',
    },
  },
  {
    id: 'primer-signals',
    eventType: 'genesis',
    loreType: 'GENESIS',
    era: 'The First Days',
    headline: 'Four Kinds of Face. Four Ways of Seeing the Grid.',
    body: 'Before the first mark, the people of the Grid found each other the way people always find each other -- by what they value, what they want, what they think the world is for. Human, Cat, Alien, Agent. Four kinds, four ways of understanding what a shared space means. Some want to hold it. Some want to express themselves through it. Some want to understand it. Some want to build something in it that will last. They are all here. The chronicle is watching to see what they make of each other -- and of themselves.',
    icon: '▫',
    featured: false,
    visualState: { mood: 'wonder', intensity: 15, dominantZone: 'the Open Grid', signalName: 'the First Circle' },
    sourceEvent: {
      type: 'genesis',
      tokenId: 'All 10,000',
      blockNumber: 'Genesis',
      txHash: 'N/A',
      count: '10000',
      ruleApplied: 'Genesis',
      ruleExplanation: 'The four Normie types -- Human, Cat, Alien, Agent -- are the four peoples of the Grid.',
    },
  },
]

export { RULES }
