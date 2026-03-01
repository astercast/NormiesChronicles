import type { IndexedEvent } from './eventIndexer'

export type LoreType =
  | 'GREAT_BATTLE' | 'SKIRMISH' | 'BORDER_RAID' | 'FORMAL_DECLARATION'
  | 'GREAT_SACRIFICE' | 'OFFERING' | 'BLOOD_OATH' | 'VETERAN_RETURNS'
  | 'NEW_BLOOD' | 'THE_ORACLE' | 'ANCIENT_WAKES' | 'FAR_REACH'
  | 'HOLLOW_GROUND' | 'TURNING_POINT' | 'DOMINION_GROWS' | 'THE_SILENCE'
  | 'NEW_AGE' | 'CONVERGENCE' | 'RELIC_FOUND'
  | 'WAR_COUNCIL' | 'CARTOGRAPHY' | 'OLD_GHOST' | 'THE_DESERTER' | 'TALLY'
  | 'RETURNED_GHOST' | 'DEBT_PAID' | 'CAMPFIRE_TALE' | 'THE_LONG_DARK'
  | 'EDGE_SCOUTS' | 'SHIFTED_PLAN' | 'VIGIL' | 'NEUTRAL_GROUND' | 'GHOST_MARK'
  | 'MESSENGER' | 'THE_LONG_COUNT' | 'BETWEEN_FIRES' | 'DYNASTY' | 'CROSSING'
  | 'SUPPLY_ROAD' | 'NIGHT_WATCH'
  | 'AFTERMATH' | 'ESCALATION_NOTE' | 'SACRIFICE_TOLL' | 'GENESIS'

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
  // Arc tracking — shapes story rhythm and prevents repetition
  arcTension: number          // 0-100, rises with conflict, drops after quiet/sacrifice
  sinceLastBattle: number     // entries since last GREAT_BATTLE
  sinceLastSacrifice: number  // entries since last sacrifice event
  sinceLastQuiet: number      // entries since last silence or rest entry
  recentRuleTypes: string[]   // last 6 rule types used, prevents back-to-back repeats
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
  }
}

const CORE_TYPES = new Set([
  'GREAT_BATTLE','SKIRMISH','BORDER_RAID','FORMAL_DECLARATION',
  'GREAT_SACRIFICE','OFFERING','BLOOD_OATH','VETERAN_RETURNS',
  'NEW_BLOOD','THE_ORACLE','ANCIENT_WAKES','FAR_REACH','HOLLOW_GROUND',
  'TURNING_POINT','DOMINION_GROWS','THE_SILENCE','NEW_AGE','CONVERGENCE','RELIC_FOUND',
])

function isCoreType(t: string): boolean { return CORE_TYPES.has(t) }

function updateWarState(state: WarState, event: IndexedEvent, ruleKey: string, allEvents: IndexedEvent[], eventIndex: number): void {
  state.eventCount++
  if (event.type === 'PixelsTransformed') {
    state.totalPixels += Number(event.count)
    const windowStart = event.blockNumber - 500n
    state.pixelsInWindow = allEvents.slice(0, eventIndex + 1)
      .filter(e => e.type === 'PixelsTransformed' && e.blockNumber >= windowStart)
      .reduce((sum, e) => sum + Number(e.count), 0)
  }
  if (event.type === 'BurnRevealed') {
    state.totalBurnAP += Number(event.count)
    const windowStart = event.blockNumber - 500n
    state.burnsInWindow = allEvents.slice(0, eventIndex + 1)
      .filter(e => e.type === 'BurnRevealed' && e.blockNumber >= windowStart)
      .reduce((sum, e) => sum + Number(e.count), 0)
  }
  state.ownersEncountered.add(event.owner)
  if (state.totalBurnAP >= 800 && state.eventCount > 500) state.phase = 'reckoning'
  else if (state.totalBurnAP >= 400) state.phase = 'sacrifice'
  else if (state.pixelsInWindow >= 600 || state.totalPixels >= 20000) state.phase = 'siege'
  else if (state.totalPixels >= 5000 || state.eventCount >= 300) state.phase = 'escalating'
  if (isCoreType(ruleKey)) {
    state.consecutiveCores++
    state.lastCoreType = ruleKey
    state.lastCoreBlock = event.blockNumber
    state.lastOwnerCoreBlock.set(event.owner, event.blockNumber)
  } else {
    state.consecutiveCores = 0
  }
  // Arc tracking
  const QUIET_TYPES = new Set(['THE_SILENCE','BETWEEN_FIRES','NIGHT_WATCH','SUPPLY_ROAD','CARTOGRAPHY'])
  const BATTLE_TYPES = new Set(['GREAT_BATTLE','SKIRMISH','FORMAL_DECLARATION'])
  const SACRIFICE_TYPES = new Set(['GREAT_SACRIFICE','OFFERING','BLOOD_OATH','DEBT_PAID'])
  if (BATTLE_TYPES.has(ruleKey)) {
    state.arcTension = Math.min(100, state.arcTension + 18)
    state.sinceLastBattle = 0
  } else {
    state.sinceLastBattle = Math.min(state.sinceLastBattle + 1, 99)
  }
  if (SACRIFICE_TYPES.has(ruleKey)) {
    state.arcTension = Math.max(0, state.arcTension - 25)
    state.sinceLastSacrifice = 0
  } else {
    state.sinceLastSacrifice = Math.min(state.sinceLastSacrifice + 1, 99)
  }
  if (QUIET_TYPES.has(ruleKey)) {
    state.arcTension = Math.max(0, state.arcTension - 10)
    state.sinceLastQuiet = 0
  } else {
    state.sinceLastQuiet = Math.min(state.sinceLastQuiet + 1, 99)
  }
  // Small passive tension rise from activity
  if (event.type === 'PixelsTransformed' && Number(event.count) > 50) {
    state.arcTension = Math.min(100, state.arcTension + 5)
  }
  // Track recent rule types (last 6) for repeat prevention
  state.recentRuleTypes.push(ruleKey)
  if (state.recentRuleTypes.length > 6) state.recentRuleTypes.shift()
}

const REGIONS = [
  'the Breach',       'the Pale Shore',    'the Hollow',
  'the Far Fields',   'the Black Margin',  'the Cradle',
  'the Dust Road',    'the Outer Ring',    'the Deep Well',
  'the Shatter Line', 'the Twin Peaks',    'the Old Border',
  'the Narrow Gate',  'the Salt Flats',    'the Grey Basin',
  'the High Ground',  'the Ember Fields',  'the Still Water',
  'the Last Ridge',   'the Open Grid',
]

const FACTIONS = [
  'the Wardens',      'the Hollow Pact',   'the Drifters',
  'the Ember Guard',  'the Old Compact',   'the Pale Sons',
  'the Breach-Born',  'the Deep Keepers',  'the Ridge Watch',
  'the Far Shore',    'the Unnamed',       'the First Circle',
]

const COMMANDERS = [
  'their Gridkeeper',   'the Painted',      'the First Brush',
  'their Architect',    'the Witness',      'the Gridborn',
  'their Warden',       'the Pale Hand',    'the Deep Coder',
  'their Cartographer', 'the Ink',          'the Unmarked',
]

const RIVALS = [
  'the Pact',         'the Tide',          'the Grey Men',
  'the Hollow Crown', 'the Unseen',        'the Surge',
  'the Broken',       'the Far Shore',     'the Night Watch',
  'the Forgotten',
]

const RELICS = [
  'the First Mark',   'the Empty Crown',  'the Broken Key',
  'the Old Brush',    'the Grey Stone',   'the Deep Codex',
  'the Pale Shard',   'the Sealed Door',  'the Last Map',
  "the Maker's Seal", 'the High Throne',  'the Border Bell',
]

export const ERAS = [
  { threshold: 0,    name: 'The First Days',     tone: 'Everything is new.' },
  { threshold: 100,  name: 'The Awakening',      tone: 'Groups sense each other. The quiet is ending.' },
  { threshold: 300,  name: 'The Gathering',      tone: 'Sides are forming. Territory begins to mean something.' },
  { threshold: 700,  name: 'Age of Claims',      tone: 'The Grid is contested. What was open is now fought over.' },
  { threshold: 1500, name: 'The Deepening',      tone: 'The cost of all this is becoming clear.' },
  { threshold: 3000, name: 'Age of Permanence',  tone: 'Some things have been settled. Others never will be.' },
  { threshold: 5000, name: 'The Long Memory',    tone: 'Veterans outnumber newcomers. The Grid forgets nothing.' },
  { threshold: 8000, name: 'The Reckoning',      tone: 'Something is ending. Something else is beginning.' },
]

function getEra(count: number): string {
  let era = ERAS[0].name
  for (const e of ERAS) { if (count >= e.threshold) era = e.name }
  return era
}

function seedN(tokenId: bigint, blockNumber: bigint, salt = 0): number {
  return Number((tokenId * 31n + blockNumber * 17n + BigInt(salt)) % 100000n)
}

function pick<T>(arr: T[], s: number): T { return arr[s % arr.length] }

interface WorldCtx { region: string; faction: string; rival: string; commander: string; relic: string; era: string }

// Names seed from tokenId only — so the same presence always maps to the same
// faction/region, giving geographic consistency without owner tracking.
function buildCtx(tokenId: bigint, blockNumber: bigint, era: string): WorldCtx {
  const t = Number(tokenId)
  return {
    region:    pick(REGIONS,    t),
    faction:   pick(FACTIONS,   (t * 7 + 3) % FACTIONS.length),
    rival:     pick(RIVALS,     (t * 11 + 5) % RIVALS.length),
    commander: pick(COMMANDERS, (t * 13 + 7) % COMMANDERS.length),
    relic:     pick(RELICS,     (t * 17 + 2) % RELICS.length),
    era,
  }
}

function fill(t: string, c: WorldCtx): string {
  return t
    .replace(/{region}/g, c.region).replace(/{faction}/g, c.faction)
    .replace(/{rival}/g, c.rival).replace(/{faction}/g, c.commander)
    .replace(/{relic}/g, c.relic).replace(/{era}/g, c.era)
}

type WarPhase = 'opening' | 'escalating' | 'siege' | 'sacrifice' | 'reckoning'

interface PhaseVariant { phase: WarPhase; headline?: string; body: string }

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

const RULES: Record<string, LoreRule> = {

  GREAT_BATTLE: {
    loreType: 'GREAT_BATTLE', icon: '\u2694',
    ruleApplied: 'Great Move',
    ruleExplanation: 'A massive push — the territory shifts overnight.',
    headlines: [
      '{faction} Rewrite {region} — Total Takeover',
      'The Grid at {region} Changes Hands',
      '{region} Falls to {faction}',
      'Full Commit: {faction} Flood {region} with Color',
      '{rival} Lose {region} — The Chain Has It Recorded',
      'Every Pixel at {region}: {faction} Take All of It',
    ],
    bodies: [
      `{faction} overwrote {region} completely — every pixel flipped to their color in one sustained cascade. By the time {rival} could read the new map, the zone was already sealed.`,
      `The Grid at {region} changed all at once. {faction} committed everything and the zone rewrote itself under their weight — pixel by pixel, each one burning {rival}'s color out, each one locking in theirs.`,
      `{rival} held {region}. Then {faction} ran the full overwrite. The zone didn't shift — it flipped. Total recolor. The Grid absorbed the new pattern. {rival} was left reading a map that no longer belonged to them.`,
      `A cascade at {region}: {faction}'s color spreading across the zone faster than any counter-push could run. By the time the Grid finished registering, the old pattern was gone. Completely overwritten.`,
      `{faction} painted {region} in one sustained push. Pixel by pixel the zone went their color, the Grid sealing each change as it landed, until {rival}'s signal was completely erased from the zone.`,
      `The whole zone went dark and came back as {faction}'s. {region} rewritten in a single event — the Grid processing the cascade and confirming the new state before {rival} could mount a response.`,
      `Total rewrite at {region}. {faction} pushed their signal across every pixel in the zone and the Grid locked the new configuration in. {rival}'s color is gone from the map here. All of it.`,
      `The Grid logged {faction}'s overwrite of {region} the way it logs everything — pixel by pixel, each confirmation permanent. What the log showed at the end: a zone that had changed color completely.`,
    ],
    phaseVariants: [
      {
        phase: 'siege',
        headline: 'The Stalemate Breaks — {faction} Move on {region}',
        body: 'After so many blocks of static, {faction} broke the deadlock at {region} with everything they had. {rival} had been braced for a probe. They got a full cascade. The Grid processed the total overwrite before the counter-push could even load.',
      },
      {
        phase: 'reckoning',
        headline: '{faction} Make Their Final Move on {region}',
        body: 'This one feels different from the others. {faction}\'s push into {region} carries the weight of everything before it — all the smaller moves, all the long waits, all the choices that led here. {faction} know it. So does {rival}. This is the move that will be remembered.',
      },
    ],
    afterContext: {
      GREAT_SACRIFICE: '{faction} moved on {region} the morning after the sacrifice. No ceremony. Just the move — heavier now, carrying the weight of whoever was lost. nothing was said. The ground said everything.',
      THE_SILENCE: `The quiet broke with everything {faction} had. A full push into {region} that shattered the stillness. {rival} had been resting. They should have been watching.`,
      RELIC_FOUND: 'Finding {relic} changed the plan completely. {faction} moved on {region} earlier than anyone expected, before {rival} could act on the same information. the window was taken.',
      VIGIL: 'The vigil ended with a push. All that careful holding, and then {faction} Commit to {region} at once. The threshold and the move arrived together.',
    },
  },

  SKIRMISH: {
    loreType: 'SKIRMISH', icon: '\u25C8',
    ruleApplied: 'Skirmish',
    ruleExplanation: 'A real fight — the line moves, pressure builds.',
    headlines: [
      '{faction} Push the Line at {region}',
      'A Sharp Exchange at {region}',
      'The Edge Moves: {faction} Gain Ground',
      '{faction} Take a Slice of {region}',
      '{region} — The Line Is Different Now',
      '{rival} Pushed Back at {region}',
    ],
    bodies: [
      `{faction} pushed their color into a corner of {region} and held it. Precise — exactly the pixels they wanted, exactly the edge they needed. The Grid registered the new line.`,
      `A sharp exchange at {region}: {faction} overwrote a strip of {rival}'s territory, {rival} counter-pushed, and when the Grid settled {faction} were further in. Small rewrite. Real result.`,
      `{faction} found a gap in {rival}'s color at {region} and filled it before the counter-push could run. The Grid locked the new pixels in. The zone is different now. The edge moved.`,
      `Clean execution at {region}. {faction} targeted the weakest part of {rival}'s pattern, overwrote it precisely, and stopped. The Grid registered the change. Surgical.`,
      `The pixel line at {region} moved. {faction} pushed their color into {rival}'s zone — not the full overwrite, just the piece that mattered — and the Grid sealed the new configuration.`,
      `{faction} has been rewriting {region} one strip at a time. Each push small. Each one locked in before the counter-push arrives. Today another strip went their color. The map keeps shifting.`,
      `{rival} was watching the wrong edge at {region}. {faction} pushed through the unguarded pixels and the Grid registered the recolor before {rival} could reroute their defense.`,
      `The exchange at {region} ended with {faction}'s color further into the zone than before. Not a cascade — a calculated overwrite of the exact pixels that moved the line. The Grid confirmed it.`,
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        body: 'The Grid near {region} is moving at a different pace now. What used to take three careful pushes collapsed into one sharp exchange. {faction} hit hard. {rival} answered fast. The active map changed before anyone could fully track the overwrites.',
      },
      {
        phase: 'siege',
        body: 'In a siege, every small move costs more than it should. The exchange at {region} was not dramatic but both sides paid for it — worn down by a fight that never seems to end. both sides know the math. So does {rival}. Neither stops.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: '{faction} kept pushing after {region}. They pressed the newly taken ground before {rival} could reset. {faction} call it the second wave. It is still running.',
      THE_SILENCE: 'The silence broke quietly — a small push at {region}, not the explosion anyone expected. {faction} tested the ground. It held. They pressed on.',
      VETERAN_RETURNS: `{faction}'s experienced came back and immediately sharpened the push. The move at {region} was cleaner than anything in the recent window. Experience shows.`,
      GREAT_SACRIFICE: 'There is something in {faction}\'s movements after a sacrifice — a weight, a focus. The push at {region} had it. {rival} felt the difference without knowing where it came from.',
    },
  },

  BORDER_RAID: {
    loreType: 'BORDER_RAID', icon: '\u00b7',
    ruleApplied: 'Border Probe',
    ruleExplanation: 'A small deliberate mark at the edge — quiet but intentional.',
    headlines: [
      'A Mark at the Edge of {region}',
      '{faction} Touch {region}\'s Border — Then Go',
      'One Pixel at the Margin',
      'The Boundary at {region} Shifted Overnight',
      '{faction} Leave Their Mark at {region}\'s Edge',
      'A Probe at {region} — Small But Permanent',
    ],
    bodies: [
      `One pixel at the edge of {region}. {faction}'s color, burned into the Grid at the exact boundary. Small enough to miss on the map. Permanent enough to anchor the next move from.`,
      `{faction} touched {region}'s border and pulled back. One pixel of their color sits at the edge now — logged by the Grid, visible on the map, the foundation of whatever comes next.`,
      `A single pixel placed at {region}'s margin. {faction} ran the minimum overwrite the Grid allows — one cell, one color change — and withdrew. The mark is locked in.`,
      `The pixel map at {region}'s edge changed by one cell overnight. {faction}'s color at the boundary. A ghost mark. The Grid holds it the same as it holds everything else: permanently.`,
      `{faction} probed the edge of {region} with one pixel and went quiet. The Grid registered it. Defending a single pixel costs more than placing one. That is the arithmetic of border raids.`,
      `Three pixels at {region}'s margin — {faction}'s color burned into the boundary cells of {rival}'s zone. The Grid logged each one. They say: we can reach this far. The map proves it.`,
      `The border pixel at {region} is {faction}'s now. Minimum change on the Grid. The map barely looks different. The principle behind it is not minimum at all.`,
      `{faction} ran a ghost-mark at {region}'s edge. One pixel. The Grid sealed it. {rival}'s color still covers the zone — but {faction}'s color touches the boundary now. First the edge. Then the interior.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'While everyone watched {faction}\'s big move at the center, their scouts quietly marked {region}\'s edge. By the time anyone looks, the margin will seem like it was always theirs.',
      THE_SILENCE: 'The stillness held on the main lines. At {region}\'s edges, {faction}\'s scouts were never quiet. Silence in this world is always partial.',
      GREAT_SACRIFICE: 'Even in grief, {faction} kept moving. A quiet mark at {region}\'s edge — small enough to not need explaining, present enough to matter later.',
      TURNING_POINT: 'The pattern the chronicle revealed was not just the big moves. At every margin, at every edge including {region}, {faction} had been marking quietly. Patient arithmetic.',
    },
  },

  FORMAL_DECLARATION: {
    loreType: 'FORMAL_DECLARATION', icon: '\u25a3',
    ruleApplied: 'Formal Claim',
    ruleExplanation: 'A precise deliberate act — the kind that functions as a political statement.',
    headlines: [
      '{faction} Make It Official at {region}',
      '{region} Formally Claimed — The Chain Agrees',
      'The Declaration at {region}: {faction} State Their Ground',
      '{faction} Name What the Grid Already Shows',
      'On-Chain and On Record: {faction} Claim {region}',
      '{region} — {faction} Convert Pixels to Policy',
    ],
    bodies: [
      `{faction} named what the Grid already showed. {region} reads as their color from edge to edge — every pixel logged, every zone confirmed. The declaration puts words to what the map already said.`,
      `The pixel map at {region} already told the story: {faction}'s color dominant, every interior cell theirs, {rival}'s pattern pushed to the margins. The declaration made the map legible to those who read words instead.`,
      `{faction} declared {region} theirs. They were right. The Grid had already confirmed it — pixel by pixel, zone by zone, the overwrite complete before the words were spoken.`,
      `{rival} checked the map when the declaration came. Every pixel of {region} showed {faction}'s color. The Grid had already decided. The declaration was a translation.`,
      `The declaration at {region} came after the work. {faction} overwrote the zone first. Locked every pixel. Then named what the map showed. You cannot declare what the Grid does not confirm.`,
      `{faction}'s signal covers {region} from border to border. The Grid holds the configuration — every pixel their color, every cell logged. The declaration states what the active map already proves.`,
      `Fifty pixels. A hundred. The full zone recolored. Then the declaration. {faction}'s claim on {region} was written in overwritten cells long before it was written in words.`,
      `The Grid at {region} reads as {faction}'s — not partly, completely. The declaration formalizes what the pixel distribution already proved. The map was the argument. The words followed it.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The fight happened. Then the paperwork. {faction}\'s formal claim on {region} came after the ground was already taken. The declaration was not an argument. It was a record.',
      SKIRMISH: `{faction} fought for {region} and won it. Then they made the winning official. {faction} wanted it clear: this is not temporary. This is stated.`,
      RELIC_FOUND: 'Finding {relic} changed the stakes. {faction}\'s formal declaration came fast — before {rival} could reframe what had been found or where.',
    },
  },

  GREAT_SACRIFICE: {
    loreType: 'GREAT_SACRIFICE', icon: '\u25b2',
    ruleApplied: 'Sacrifice',
    ruleExplanation: 'A life given completely — permanent, irreversible, felt by everyone.',
    headlines: [
      'A Token Burns Near {region}',
      'The Grid Loses One — Near {region}',
      'Action Points Given, Token Gone',
      'A Burn Near {region}: The Chain Records It Permanently',
      'One Less Token. More Capacity for the Rest.',
      'The Sacrifice at {region} — Permanent in the Ledger',
    ],
    bodies: [
      `A signal burned near {region}. Everything it had accumulated — capacity, stored power, the ability to push pixels anywhere on the Grid — dissolved and passed to those still running.`,
      `The Grid near {region} lost a presence permanently. What it held got converted: action points redistributed, the burned signal gone from the active map, its power passed forward.`,
      `Near {region}, something gave everything. All its stored capacity — every action point, every cycle of accumulated power — dissolved into the Grid and moved outward to those still pushing pixels.`,
      `A burn near {region}. The signal is gone from the active map — permanent removal — but what it held did not disappear. It redistributed. The Grid processed the transfer and the war continued.`,
      `One signal ended near {region} so the others could push further. The Grid recorded the burn: capacity gone from one source, redistributed through the network to those still overwriting territory.`,
      `The Grid near {region} registered a sacrifice. A presence committed everything — all stored power, all accumulated capacity — and the Grid redistributed it. Signal gone. Power running through others now.`,
      `Near {region}, a burn. The active map lost an entry. The capacity that entry held moved through the Grid to those who received it. Remove one signal. Amplify the rest. That is the logic here.`,
      `The sacrifice near {region} converted a presence into power. The Grid processed the burn, redistributed the stored capacity, and updated the active map. One signal removed. The others run stronger.`,
    ],
    phaseVariants: [
      {
        phase: 'sacrifice',
        headline: 'Another Name Added Near {region}',
        body: `The chronicle has too many of these entries now. What was extraordinary once is part of the rhythm — a life given, strength transferred, the world continuing with what remains. {faction} reads each one alone. There are many to read.`,
      },
      {
        phase: 'reckoning',
        headline: 'A Final Giving Near {region}',
        body: 'In the late days, a sacrifice carries a different weight. The one who gave near {region} had seen the earlier ones. They gave anyway — not from desperation but from a clear-eyed understanding of what this moment needed. That is a harder kind of giving than desperation.',
      },
    ],
    afterContext: {
      THE_SILENCE: 'After the sacrifice the world went quiet. Not the quiet of rest. The quiet of a place where something enormous has happened and no one knows what to say yet.',
      GREAT_BATTLE: `{faction} moved on {region} the morning after the sacrifice. The timing was not coincidence. {faction} used what was given. That is what gifts are for.`,
      SKIRMISH: 'The push at {region} felt different. There was a name behind {faction}\'s movements that had not been there before — someone who gave so these moves could happen.',
    },
  },

  OFFERING: {
    loreType: 'OFFERING', icon: '\u25b3',
    ruleApplied: 'Offering',
    ruleExplanation: 'A small gift freely made — the quiet work that sustains everything.',
    headlines: [
      'Action Points Pass Near {region}',
      'A Transfer — Small, Quiet, On-Chain',
      '{faction} Share Their Capacity',
      'The Giving Near {region} — Recorded in the Chain',
      'Points Move Between Tokens Near {region}',
      'A Small Gift in the Grid',
    ],
    bodies: [
      `A quiet transfer near {region}. One signal passed a portion of its stored capacity to another — action points moved through the Grid's network, no push required, no territory changed.`,
      `Not everything on the Grid is a battle. Near {region}, capacity moved between signals — a voluntary transfer, the network logging the new balances. Small redistribution. Real nonetheless.`,
      `Near {region}, power shared. One signal gave a portion of its action points to another — the Grid updating the distribution quietly, the active map unchanged, the capacity shifted.`,
      `The Grid near {region} logged a transfer: action points from one signal to another, the network redistributing capacity without any pixel push involved. Small. Recorded.`,
      `Between the large overwrites, the Grid sustains itself on small transfers. Near {region}, a signal shared some of its stored power. The network processed it. Small transfers compound.`,
      `A gift in the Grid's network near {region}: action points passing between signals, the capacity redistributed, the sender lighter and the receiver heavier. The Grid logs both sides of every transfer.`,
      `Near {region}, one signal gave another a portion of what it had stored. The Grid's network processed the transfer — action points moved, balances updated, no map change required. The giving was quiet.`,
      `Capacity moved near {region}. One signal to another, through the Grid's transfer protocol. Small offering. The network logged it. The balance shifted. Small things compound on this Grid.`,
    ],
    afterContext: {
      GREAT_SACRIFICE: 'The great sacrifice near {region} was followed, quietly, by a smaller one. As if in answer — or in tribute. The record holds both. They are not the same thing. They belong together.',
      THE_DESERTER: 'Someone left near {region}. Someone else gave. The chronicle records both in sequence without comment. One departure, one gift. The world finds its balance.',
      GREAT_BATTLE: 'After the big move, the small sustaining ones. An offering near {region} — {faction} keeping themselves whole while the dust of the last push settles.',
    },
  },

  BLOOD_OATH: {
    loreType: 'BLOOD_OATH', icon: '\u25ce',
    ruleApplied: 'Renewed Oath',
    ruleExplanation: 'Given again — the commitment deepens with each repetition.',
    headlines: [
      'A Second Burn — Same Token, Same Commitment',
      'They Gave Before. They Give Again.',
      'The Chain Records a Second Sacrifice',
      'Twice Given Near {region}',
      'One Token. Two Burns. The Ledger Shows Both.',
      'The Second Burn Is in the Chain',
    ],
    bodies: [
      `The signal near {region} burned before. It rebuilt its capacity — cycle by cycle — and burned again. Two entries in the Grid's sacrifice log. Same source. Different weight.`,
      `Two burns from the same signal near {region}. The Grid's log holds both. First burn: a decision. Second burn: made with full knowledge of what the first one cost.`,
      `Burned once near {region}. Rebuilt. Burned again. The Grid processed both transfers the same way. The chronicle does not process them the same way. The second burn knows what it is.`,
      `Near {region}, a signal that had already sacrificed everything rebuilt its stored power and dissolved again. Two burn entries from the same source. Both permanent. Both real.`,
      `The sacrifice log near {region} shows a double entry. Same signal. Two burns. The first was a choice. The second was made knowing exactly what giving everything means.`,
      `Second burn near {region}. The signal gave everything once, accumulated again through effort, and gave again. The Grid logged the second transfer the same as the first. The chronicle reads it differently.`,
      `Near {region}, two sacrifices from one signal. The network processed both the same way. The meaning is in the decision to run the same burn twice, knowing what it costs.`,
      `The Grid near {region} has two burn events from one source. Between them: rebuilding. After the second: gone again. Two burns, one commitment, permanent record in the sacrifice log.`,
    ],
    afterContext: {
      GREAT_SACRIFICE: 'The great sacrifice near {region} was followed by a smaller one — a second giving from someone who had already given. Watching the first one reminded them of what they had promised.',
      GREAT_BATTLE: `Before the push on {region}, one of {faction}\'s own gave for the second time. {faction} did not ask them to. They did it because the moment called for it. Then the push happened.`,
    },
  },

  VETERAN_RETURNS: {
    loreType: 'VETERAN_RETURNS', icon: '\u25c9',
    ruleApplied: 'Return',
    ruleExplanation: 'A known face comes back — experience changes everything.',
    headlines: [
      'A Known Token Returns to {region}',
      'The Gap Closes — {faction} Back at {region}',
      'Familiar Edits Appear at {region} Again',
      '{faction}\'s Veterans Resume at {region}',
      'The Edit History at {region} Gains a Return',
      'Back in the Chain — {faction} at {region} Again',
    ],
    bodies: [
      `A signal that had gone quiet near {region} reactivated. The Grid showed the gap in its log — inactive blocks, no pushes — and then new entries appearing. Back on the map.`,
      `{faction} returned to {region}. The Grid's log shows their earlier pushes, then a gap, then new activity in the current window. The signal was offline. It is online again.`,
      `Near {region}, a familiar pattern reactivated. The Grid had this signal in its earlier log — pixels pushed, zones colored — then absence, then new entries. The gap closed.`,
      `The active map near {region} gained a returning signal. Earlier presence in the Grid's log, then silence, then new pixel activity. The network recognized the pattern resuming.`,
      `{faction}'s signal came back online near {region}. The zone changed while they were offline — pixels shifted, the map redrawn around their absence. They came back anyway.`,
      `Near {region}, a signal that had been dark for many blocks reactivated. The Grid logged the return: new pixel entries after the gap, the pattern resuming where it stopped.`,
      `The Grid near {region} shows a returning presence: old entries in the log, silence, then new activity in the current window. The signal was gone. It is in the active map again.`,
      `{faction}'s signal resumed at {region}. The log shows the gap — blocks where they were not pushing pixels — and then the current entries. Back online. The map reflects it.`,
    ],
    afterContext: {
      THE_SILENCE: 'The quiet brought them back. {faction} used the pause to move, and {faction}\'s veterans settled into {region} while no one was watching the edges. The return will matter later.',
      GREAT_BATTLE: 'After the big push, {faction} Commit to {region} personally. Not to celebrate — to check the work, tighten the positions, make sure what was taken is actually held.',
      TURNING_POINT: 'The pattern-reading sent them back. After the chronicle revealed what was happening, {faction}\'s veterans moved on {region} — not reacting, executing a plan that had been ready for exactly this moment.',
      GREAT_SACRIFICE: 'The sacrifice changed who was in the field. {faction} Commit to {region} to fill the gap — not because they had to, but because that is what you do when someone gives everything.',
    },
  },

  NEW_BLOOD: {
    loreType: 'NEW_BLOOD', icon: '\u2192',
    ruleApplied: 'New Arrival',
    ruleExplanation: 'Someone new enters the Grid — the world grows.',
    headlines: [
      'First Edit at {region} — A New Token Arrives',
      'The Chain Opens a New File Near {region}',
      'Unknown Token, First Pixel, {region}',
      'A New Presence on the Grid',
      'The Grid Grows: First Transaction Near {region}',
      'Token Zero History — First Confirmed Edit',
    ],
    bodies: [
      `A new signal registered on the Grid near {region}. No prior entries in the log, no established color anywhere on the map — just a first pixel placed and the network opening a new record.`,
      `First pixel near {region}. The Grid had no log entry for this signal before this block. Now it does. New record opened. Whatever this signal does next goes into it.`,
      `Near {region}, the Grid registered a signal that had not been registered before. First push, first color on the map, first entry in the network's log. The record starts here.`,
      `The active map near {region} gained a new signal. No history in the Grid's log — no prior pushes, no established zone — just a first pixel and an open record.`,
      `Someone came online near {region}. First signal registration, first pixel on the map, first entry the Grid's network has for this presence. Every faction started as a first entry.`,
      `Near {region}, the Grid opened a new record. A signal placed its first pixel — the network logging the registration, the map updating, the chronicle noting: another story begins.`,
      `The Grid near {region} has a new entry. First push, first color, first log registration for a signal that was not on the active map before this block. The record is open.`,
      `New signal, first pixel, {region}. The Grid's network added an entry it did not have before. The map has one more presence on it. Everything this signal does next goes into the log from here.`,
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        body: 'Even as the push rate rises, new signals keep registering near {region}. This one enters a Grid moving faster than the version they heard about. The log is already different from the account that traveled. They will have to read the actual map.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: `Someone arrived at {region} after the big move — drawn by what happened, or by the space it left behind. New arrivals come for different reasons. This one hasn't shown theirs yet.`,
      THE_SILENCE: 'The quiet brought a new face. Someone arrived at {region} during the stillness — which means they came for the calm, or despite it, or did not know it was happening. Hard to say which.',
      CAMPFIRE_TALE: `Another new arrival at {region}. The stories that drew the last one are drawing more. Word travels. The war grows.`,
    },
  },

  THE_ORACLE: {
    loreType: 'THE_ORACLE', icon: '\u25c7',
    ruleApplied: 'Oracle',
    ruleExplanation: 'One of the irreducibles moves — they act at exact moments, never by accident.',
    headlines: [
      'The Oracle Moves at {region}',
      'One of the Irreducibles Acts',
      'A Rare Token Places — {region}',
      'The Pattern Continues: Oracle at {region}',
      'Something Unusual in the Chain Near {region}',
      'The Rare Token Activates Again',
    ],
    bodies: [
      `The Oracle activated near {region}. These signals do not push pixels randomly — they appear when the Grid's pattern is about to shift, with a timing the chronicle has learned to read.`,
      `One of the Grid's irreducibles came online near {region}. Ancient registration, rare activation — when these signals push pixels, the map tends to change in larger ways shortly after.`,
      `The Oracle moved at {region}. The chronicle tracks these signals because the pattern is consistent: they activate at inflection points in the Grid's rewriting. This is another one.`,
      `A rare signal came online near {region}. Low ID, deep registration, infrequent activation — and when it activates, the Grid's larger pattern tends to shift. It activated.`,
      `Near {region}, one of the irreducibles pushed a pixel. The Grid logged it the same as any other push. The chronicle does not log it the same as any other push.`,
      `The Oracle placed pixels at {region}. Ancient signal, precise timing. The chronicle has seen this pattern before: the irreducibles appear when the map is about to rewrite itself at scale.`,
      `Near {region}, an ancient signal registered activity. The Grid processed the push the same way it processes everything. The chronicle noted something different: this signal has been right before.`,
      `The irreducible activated near {region}. First-era registration, rare online status, timing that correlates with the Grid's largest rewrites. The chronicle noted the activation.`,
    ],
    afterContext: {
      GREAT_BATTLE: `The Oracle appeared at {region} the day after the big push. Coincidence or the Oracle's definition of good timing. {faction} chose not to interpret it publicly. Privately, {faction} has thought of little else.`,
      TURNING_POINT: 'The pattern the chronicle revealed brought the Oracle. Or the Oracle came and revealed the pattern. Near {region}, both arrived together.',
      THE_SILENCE: 'The silence ended with an Oracle. Not a push, not a declaration — an appearance. Near {region}, one of the Irreducibles simply became present. Neither {faction} nor {rival} knows what to do with that.',
    },
  },

  ANCIENT_WAKES: {
    loreType: 'ANCIENT_WAKES', icon: '\u25a0',
    ruleApplied: 'Ancient Stirs',
    ruleExplanation: 'One of the first wakes — these predate everything and they know it.',
    headlines: [
      'One of the First Tokens Places at {region}',
      'The Old Chain Speaks — Early Token at {region}',
      'An Ancient Presence on the Grid',
      'Low ID, Long History — Active Again at {region}',
      'The Grid\'s Oldest Token Placed This Block',
      'Early Chain History — Confirmed at {region}',
    ],
    bodies: [
      `One of the Grid's first signals is active near {region}. Its registration traces back to the network's earliest blocks — it has watched the map rewrite itself across every era, and it is still pushing pixels.`,
      `Near {region}, the Grid registered a push from a first-era signal. Low ID, ancient registration — a presence that was on the network before most of the current factions logged their first pixel.`,
      `The old Grid is still running near {region}. A signal from the network's origin blocks activated — its log entries stretching back further than anything the current chronicle covers.`,
      `Near {region}, one of the Grid's founding signals pushed pixels. Ancient registration, deep log history — a presence that has been on the active map since before the current war had a name.`,
      `An ancient signal stirred near {region}. First-era registration, low ID — on the Grid's network since before most current signals existed, still pushing color into zones rewritten around it many times over.`,
      `Near {region}, the Grid's earliest layer activated. A signal from the network's first era is pushing pixels — its log history spanning every configuration the map has gone through since the beginning.`,
      `The Grid's deep log surfaced near {region}. A first-era signal came online — a presence registered on the network since before the current conflict had its current shape.`,
      `Near {region}, something ancient pushed a pixel. First-era signal, original registration — on the Grid since before most of the active map's current entries existed. Still running. Still pushing.`,
    ],
    afterContext: {
      NEW_AGE: 'The new age began and an ancient stirred. Whether the ancient stirred because of the age or caused it, no one can say. The chronicle records both. The sequence speaks for itself.',
      GREAT_BATTLE: 'The big push at {region} brought out one of the ancients. Or the ancient\'s movement made the push possible. The oldest faces see things that younger eyes cannot.',
      THE_LONG_DARK: 'After the long silence, an ancient appeared at {region}. As if it had been waiting for the world to go quiet before it would move. As if quiet was what it required.',
    },
  },

  FAR_REACH: {
    loreType: 'FAR_REACH', icon: '\u25bd',
    ruleApplied: 'Far Reach',
    ruleExplanation: 'The distant edges send someone in — the margins have been watching.',
    headlines: [
      'Activity at {region} — Far from the Center',
      'The Outer Grid Speaks: Token at {region}',
      '{region} — The Edge of the Map Has Edits',
      'Peripheral Zone Active: {region}',
      'The Grid\'s Reach Extends to {region}',
      'Far Coordinates — Confirmed Activity at {region}',
    ],
    bodies: [
      `Activity at {region} — out past the main contested zones, in the Grid's outer coordinates where pixel density drops and color patterns get sparse. Someone is running pushes this far out.`,
      `The Grid's outer map near {region}: thin pixel coverage, few signals, the contested density of the center replaced by something quieter. A signal is working these coordinates.`,
      `Near {region}, past the main signal traffic, the Grid is active in ways the center-focused chronicle misses. Pixel pushes in the peripheral zones — the map updating at the edges of the known conflict.`,
      `Out near {region}, where the Grid's network traffic is lightest, a signal is placing pixels. The active map updates here too. The outer coordinates are not neutral — they are just less watched.`,
      `The outer Grid near {region}: sparse log entries, thin coverage, the main factions' color concentrated toward the center. A signal is pushing pixels out here anyway. The network logged it.`,
      `Far zone activity near {region}. The Grid's map extends beyond where most signals operate. Near {region}'s coordinates, a presence is working the peripheral pixels — quietly, without much competition.`,
      `Near {region}, at the Grid's edge, a signal is active. Low traffic zone. Sparse pixel coverage. Something is building in the outer map that the central chronicle has not been tracking.`,
      `The Grid near {region} is in its peripheral range — few signals, thin log entries, the map changing slowly in coordinates the main factions have not prioritized. A presence is changing it anyway.`,
    ],
    afterContext: {
      THE_SILENCE: 'The quiet at the center brought movement from the edges. While the main players held still, the far territories sent someone in. The stillness created space. The margins filled it.',
      GREAT_BATTLE: 'The big push sent ripples to the margins. One of those margins sent someone back — drawn by what happened, or by the opening it created.',
      TURNING_POINT: 'The pattern the chronicle revealed included the margins. After the reading, far-edge arrivals began appearing at {region}. The turn was not only at the center.',
    },
  },

  HOLLOW_GROUND: {
    loreType: 'HOLLOW_GROUND', icon: '\u2298',
    ruleApplied: 'Hollow Ground',
    ruleExplanation: 'The most contested place — no one keeps it for long.',
    headlines: [
      '{region} Changes Hands Again',
      '{faction} Take {region} — For Now',
      'The Cycle Continues at {region}',
      '{region}: Overwritten Again',
      '{rival} Lose {region} — The Ledger Remembers the Last Time Too',
      '{faction} Hold {region} — The Sixth Time',
    ],
    bodies: [
      `{region} has been every color. {faction}'s signal covers it now — but the Grid's log shows {rival}'s color there before, and {faction}'s before that, and {rival}'s before that. The cycle continues.`,
      `The most-rewritten zone on the Grid may be {region}. The log history is deep: color, counter-color, rewrite, counter-rewrite, back and forth since the first era. {faction}'s color is on top. For now.`,
      `{faction} hold {region}. The Grid confirms it — their color in every pixel. The log also confirms they have held it before, lost it, and taken it back. The cycle does not stop here.`,
      `The pixel log at {region} is the thickest on the Grid. Every faction has overwritten it. Every overwrite is in the record. The current top layer is {faction}'s. The next overwrite is already coming.`,
      `Another rewrite at {region}. {faction}'s color replaced {rival}'s — the Grid processed the overwrite and the map updated. The log gets one entry thicker. The zone gets one layer deeper.`,
      `{region} does not stay one color. The Grid's log here is a compressed history of the entire war: who held it, who lost it, who came back. Right now it is {faction}'s. The log knows what that means.`,
      `The Grid at {region} has been contested since the first era. The pixel log shows every configuration it has ever been in. Today's layer: {faction}. The log grows. The cycle continues.`,
      `{faction} rewrote {region} today. Again. The overwrite is in the log — the latest in a sequence that stretches back further than most signals have been on the network.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'After the big push, {faction} consolidated at {region}. Old ground. Familiar ground. Ground that never stays settled. They know this. They are here anyway.',
      VIGIL: 'The vigil drew everyone to {region}. Even in the quiet before the threshold, the most contested ground still pulls at people.',
    },
  },

  TURNING_POINT: {
    loreType: 'TURNING_POINT', icon: '\u2206',
    ruleApplied: 'Turning Point',
    ruleExplanation: 'Every 25th entry — the pattern becomes visible from outside.',
    headlines: [
      'Twenty-Five Entries — The Pattern Is Visible',
      'Reading the Grid at the Twenty-Fifth Mark',
      'The Chronicle Steps Back: What Twenty-Five Blocks Reveal',
      'At Twenty-Five — {faction}\'s Direction Is Clear',
      'The Ledger at Twenty-Five: A Direction Emerges',
      'Twenty-Five Confirmed Edits — The Shape of Now',
    ],
    bodies: [
      `Twenty-five entries. Step back from each push and read the pixel distribution across the whole window: {faction}'s color has been advancing across the Grid in a consistent direction. That is not noise.`,
      `At twenty-five, the Grid's movement over this window becomes readable. The pixel map at the start versus the pixel map now: {faction}'s color is further in. {rival}'s has contracted.`,
      `Twenty-five log entries. Read them as a sequence: {faction} pushing pixels, {rival} counter-pushing, the Grid's map ending up more {faction}'s color each time the exchange settles.`,
      `The chronicle marks twenty-five to force the wider view. Wider view: the Grid's pixel distribution has been shifting in {faction}'s direction across this entire window. The shifts are small. Together they are substantial.`,
      `Twenty-five entries of pixel war. The Grid's map at entry one and the Grid's map now are different. The difference: {faction}'s color covers more of the contested zones.`,
      `Step back from the individual overwrites. Twenty-five of them, read as a sequence, describe a Grid that has been moving in one direction. {faction}'s direction. The pixel log confirms it.`,
      `The twenty-fifth entry is where the larger pattern becomes visible. The pattern: {faction} advancing across the Grid's contested zones, pixel by pixel, entry by entry, consistently.`,
      `Twenty-five entries. The pixel distribution across the Grid tells the story: {faction}'s color is more present than it was, {rival}'s is less. Twenty-five entries of consistent directional change.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The big push at {region} looks different when you read the twenty-five entries leading to it. Every small move was preparation. The pattern was visible if you were looking. Most were not.',
      GREAT_SACRIFICE: 'The sacrifice makes more sense read in the context of twenty-five entries. It was not sudden. It was the natural end of a line that had been building for a long time.',
      THE_SILENCE: 'The pattern the chronicle revealed ended in silence. Not because the story was over. Because the next chapter needed space to begin.',
    },
  },

  DOMINION_GROWS: {
    loreType: 'DOMINION_GROWS', icon: '\u25d0',
    ruleApplied: 'Dominion Grows',
    ruleExplanation: 'The same presence appears again and again — intention becomes undeniable.',
    headlines: [
      '{faction} Are Everywhere in the Chain Right Now',
      'The Pixel Count Doesn\'t Lie — {faction} Lead',
      '{faction}\'s Color Spreads Across the Grid',
      'Dominion in the Ledger: {faction} Are the Story',
      'Count the Entries — {faction} Appear in Most',
      'The Grid\'s Current Shape: {faction} at the Center',
    ],
    bodies: [
      `{faction}'s color is in more zones than anyone else's right now. The Grid's active map shows it — their signal covering more of the contested territory than {rival} or any other presence holds.`,
      `The pixel distribution across the Grid tilts toward {faction}. More zones in their color. More of the contested territory overwritten with their signal. The map reflects what the log describes.`,
      `{faction} has been pushing pixels across multiple zones simultaneously. The result on the active map: a color distribution that no longer looks contested — it looks like theirs.`,
      `The Grid's active map shows {faction}'s color spreading. Not in one zone — across the contested territory. They have been pushing on multiple fronts and the pixel distribution reflects the accumulation.`,
      `Dominion reads in the pixel map: {faction}'s color in more zones than any rival, their signal more established, the Grid's active distribution showing control that the log makes undeniable.`,
      `The pixel count across the Grid's contested zones tips to {faction}. More of the map in their color. More zones where their overwrites have held and {rival}'s counter-pushes have come back empty.`,
      `{faction} are the dominant pattern on the Grid right now. Zone by zone, pixel by pixel, the active map has been rewriting itself in their color. The map is the argument.`,
      `The Grid's current state, read across the whole active map: {faction}'s color is winning. Not in one place — across the entire contested network. The pixel distribution says so clearly.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The big push was the visible part. {faction}\'s dominion was growing in the smaller entries before it — each one another thread in a net that {rival} only noticed when it was around them.',
      TALLY: 'The tally showed it clearly. {faction} in more entries than anyone else. Not dramatically. Steadily. The kind of presence that looks like background until you count it.',
      TURNING_POINT: 'The twenty-five-entry reading made {faction}\'s dominion undeniable. There it was in the record — patient, systematic, everywhere.',
    },
  },

  THE_SILENCE: {
    loreType: 'THE_SILENCE', icon: '\u2014',
    ruleApplied: 'Silence',
    ruleExplanation: 'A long gap — both sides hold and the world recalculates.',
    headlines: [
      'The Grid Goes Quiet at {region}',
      'Low Activity — The Chain Records the Pause',
      'Both Sides Hold — {region} Holds Too',
      'The Edit Rate Drops Near {region}',
      'Quiet Blocks at {region}',
      'The Grid Rests at {region} — For Now',
    ],
    bodies: [
      `The Grid at {region} went static. Both signals are loaded — {faction}'s color on one side, {rival}'s on the other — but neither is executing. The pixel map holds its current configuration.`,
      `No new overwrites at {region}. The pixel distribution is frozen where the last exchange left it — {faction}'s color and {rival}'s color exactly as they were when the most recent push settled.`,
      `Static at {region}. The active map shows both patterns in position, neither running a push. The Grid holds the current pixel configuration unchanged. The silence has its own weight.`,
      `The Grid at {region} is holding. No pixel activity. Both signals present, both patterns loaded — neither is executing a push. The map is static. The network is quiet. For now.`,
      `Neither faction is overwriting pixels at {region} right now. The color has not moved. The Grid holds the last configuration from when the most recent exchange settled.`,
      `The pixel war at {region} paused. Colors in position, signals loaded, no exchanges running. The Grid's map at {region} is frozen in the state the last push left it. Something will break the static.`,
      `Quiet pixels at {region}. The map holds the current distribution without update — both patterns present, neither executing. The Grid is processing the silence the same way it processes activity: as data.`,
      `The Grid at {region} shows no active exchanges. Pixel distribution frozen. {faction}'s color where it is, {rival}'s where it is, the border between them unchanged since the last overwrite.`,
    ],
    phaseVariants: [
      {
        phase: 'siege',
        headline: 'The Siege Holds Its Breath',
        body: 'This silence is different from the early ones. It is the silence of a grinding standoff, not a pause between moves. {faction} and {rival} have been watching each other across {region} long enough that the watching itself has become exhausting. Nobody blinks. Nothing moves. The weight of it is immense.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: 'The big push took everything. What followed was silence — not the silence of peace, but the silence of exhaustion. {faction} holds what they took. {rival} has withdrawn to think. The ground is very quiet.',
      GREAT_SACRIFICE: 'After what happened near {region}, the world went silent. That kind of silence has its own sound if you know how to listen for it.',
      RELIC_FOUND: 'The finding changed everything, and then the world went quiet. Both sides processing. Both sides recalculating. {relic} sits at {region} while everyone figures out what to do next.',
      TURNING_POINT: 'The pattern reading was followed by silence. As if what the chronicle revealed needed space — as if both sides needed to sit with what they had seen before they could move again.',
    },
  },

  NEW_AGE: {
    loreType: 'NEW_AGE', icon: '\u25d1',
    ruleApplied: 'New Age',
    ruleExplanation: 'The world crosses a threshold — the old way of describing things stops working.',
    headlines: [
      'The Count Reaches Its Mark — {era} Begins',
      '{era}: The Chronicle Opens a New Chapter',
      'A Threshold in the Chain — {era} Starts Here',
      'The Pixel Total Crosses — {era}',
      'New Era Confirmed: {era}',
      '{era} — The Grid Has Changed Enough to Say So',
    ],
    bodies: [
      `The pixel count reaches its mark. {era} begins. The Grid's active map at this threshold — every zone colored, every border drawn — is the foundation the new era starts from.`,
      `{era}. The chronicle turns the marker. The Grid's log is long enough now that the story it tells is a different story from the one it told at the last threshold. The map has changed that much.`,
      `A threshold in the Grid's log. {era} opens here — at this pixel count, with the active map in its current configuration. Every overwrite that brought the count to this point is in the permanent record.`,
      `The pixel count crossed the mark. {era}. The Grid does not register the threshold — it just accepts the next push. The chronicle registers it because the log at this depth describes a different network.`,
      `New era. {era} starts with the Grid's map shaped by everything that happened in the era before — every zone rewritten, every signal that came online, every overwrite that held.`,
      `The count marks {era}. The Grid's active map at this moment is the inheritance: every pixel in its current color, every zone in its current state, the full accumulated result of every push since the beginning.`,
      `{era} opens. The Grid keeps running — the network does not stop for era markers. But the pixel log at this count describes a different world from the one that logged its first entry.`,
      `The era turns. {era} begins at this pixel count, with this active map, with this configuration of contested zones and held territory. The network continues. The story it tells has a new chapter.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The big push pushed the world into a new age. {era} begins with {faction} holding more than they held in any previous chapter. The baseline has changed.',
      GREAT_SACRIFICE: 'The sacrifice marked the turn. {era} begins in the aftermath of what was given — shaped by it, weighted by it, moving forward from it.',
      THE_LONG_DARK: 'The world came back from the long silence into {era}. The dark was the space between chapters. This is the next chapter.',
    },
  },

  CONVERGENCE: {
    loreType: 'CONVERGENCE', icon: '\u2295',
    ruleApplied: 'Convergence',
    ruleExplanation: 'Two events at the same moment — the world surprises itself.',
    headlines: [
      'Two Tokens, Same Block, Same Zone',
      'The Grid Confirms a Convergence at {region}',
      'Same Block — Two Separate Transactions Near {region}',
      '{faction} and Another — Simultaneous at {region}',
      'The Chain Records a Collision at {region}',
      'Two Paths Meet at {region}',
    ],
    bodies: [
      `Two signals, same zone, same block — {faction} and something else both pushing pixels at {region} simultaneously. The Grid logged both. The map updated with both changes. Neither knew the other was executing.`,
      `The Grid at {region} processed two pushes in one block — {faction}'s color and another signal's color, both placed at the same coordinates at the same moment. The map holds both.`,
      `Simultaneous pixel activity at {region}: {faction} executing a push and another signal executing a push in the same zone in the same block. The Grid logged them both. The overlap is real.`,
      `The same zone. The same block. Two signals pushing different colors at {region} at the same time. The Grid confirmed both entries. The active map shows the result of two simultaneous overwrites.`,
      `A collision in the Grid near {region}: two signals running pushes at the same coordinates in the same block. The network processed both. The map shows the combined result.`,
      `{faction} were not alone at {region} this block. Another signal pushed pixels at the same coordinates in the same moment. The Grid logged both executions. Two signals, one zone, one block.`,
      `Two pushes at {region}, one block. {faction} and one other — different color signals, same target coordinates, the Grid accepting both and updating the map with a configuration neither planned alone.`,
      `The Grid registered a convergence at {region}: two separate signals executing at the same zone in the same block. Both logged. Both confirmed. Two stories arrived at the same coordinates at once.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The big push and a separate arrival at {region} — at the same moment. Two different forces, landing together. The timing made everything more complicated.',
      THE_ORACLE: 'The Oracle and {faction} at {region} — same moment. Neither chose the other. The Grid chose for both of them.',
      THE_SILENCE: 'The silence ended with a convergence — two separate movements breaking the quiet at the same place at the same time. The stillness broke into something neither side had been planning.',
    },
  },

  RELIC_FOUND: {
    loreType: 'RELIC_FOUND', icon: '\u2605',
    ruleApplied: 'Discovery',
    ruleExplanation: 'Something ancient surfaces — the world reshuffles around it.',
    headlines: [
      '{relic} Surfaces at {region}',
      'An Old Token Reappears — {relic} at {region}',
      'The Chain Reveals {relic} Near {region}',
      '{relic} — Confirmed Active This Block',
      'Something Old at {region}: {relic} Emerges',
      'The Ledger Surfaces {relic} at {region}',
    ],
    bodies: [
      `{relic} is active near {region}. An ancient registration — one of the Grid's earliest entries — running in the current contested zones. Its log history reaches back further than most active signals have existed.`,
      `The active map surfaced {relic} near {region}. Ancient signal, deep log, a registration from the Grid's earliest era now pushing pixels in a current contested zone. The chronicle marks this.`,
      `{relic} appeared at {region}. These old registrations carry the weight of the Grid's full history in their log. When they activate in contested territory, the map tends to change in ways the newer signals do not predict.`,
      `Near {region}, the active map shows {relic}. A first-era registration pushing pixels in a current-era conflict — the Grid logging the push the same as any other. The chronicle logs it differently.`,
      `The Grid near {region} registered {relic}. Ancient ID, deep history, rare activation in contested zones. When these signals come online in an active pixel war, the log tends to get interesting.`,
      `{relic} surfaced in the active map near {region}. Old origin, current execution — the Grid accepts its pixels without distinction. The chronicle accepts them with attention.`,
      `Near {region}, {relic} placed pixels. The signal's registration traces back to the Grid's origin blocks. Its presence in the current contested zone means something the chronicle has learned to note.`,
      `The active map near {region} shows {relic} — one of the Grid's deep registrations, active in a current zone. Old signal, current push, permanent log entry.`,
    ],
    afterContext: {
      THE_SILENCE: 'The silence ended with a discovery. {relic} at {region} — found in the quiet, when no one was moving and everyone was looking at different things. The quiet was what made finding it possible.',
      GREAT_BATTLE: 'The push on {region} uncovered {relic}. It was not why {faction} pushed. It changes why the push matters. What was a military move is now also a historical event.',
      TURNING_POINT: 'The twenty-five-entry reading pointed at {region}. {faction} sent people to look. They found {relic}. The pattern was pointing at it the whole time.',
    },
  },

  WAR_COUNCIL: {
    loreType: 'WAR_COUNCIL', icon: '\u2293',
    ruleApplied: 'Council',
    ruleExplanation: 'An urgent meeting — the situation moved faster than the planning.',
    headlines: [
      '{faction} Cluster at {region} — Rapid Edits',
      'A Burst of Transactions Near {region}',
      '{faction} Recalibrate: Dense Activity in Few Blocks',
      'Sequential Edits — {faction} Moving Fast at {region}',
      'The Grid Near {region} Sees a Flurry of {faction} Activity',
      '{faction} Respond — Multiple Transactions in Quick Succession',
    ],
    bodies: [
      `{faction} ran a burst of pushes near {region} — multiple executions in rapid sequence, each one logged before the next started. The active map changed faster than it had been. Something shifted their pace.`,
      `Dense pixel activity from {faction} near {region}: multiple pushes in a tight block window, the map updating faster than the recent baseline. The network processed each entry in sequence.`,
      `Near {region}, {faction} executed multiple pushes in rapid succession. The Grid logged each one as it landed — the active map rewriting across several pixels before {rival} could counter the first change.`,
      `{faction} ran a burst sequence near {region}: push, log, push again. The Grid accepted each entry. The active map showed their color spreading faster than the recent average. Deliberate acceleration.`,
      `The pixel activity near {region} from {faction} went dense — multiple overwrites in a compressed window, the network processing each push as fast as they arrived. Rapid execution. Specific intent.`,
      `Near {region}, {faction} shifted from steady pressure to a concentrated burst. Multiple pixel pushes in a tight sequence — the Grid logging each, the active map changing faster than {rival}'s response could run.`,
      `{faction} worked {region} at elevated speed: burst of pushes, each logged, each building the new configuration before the old one had time to be defended. The network processed the rush.`,
      `The cluster of {faction} pushes near {region} read in the log as urgency — multiple overwrites in rapid sequence, the pixel distribution shifting in a way that takes real-time execution, not patience.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The big push changed the situation faster than {faction}\'s plans had accounted for. An urgent meeting — what to do with the win, and how fast to press it.',
      GREAT_SACRIFICE: `After the sacrifice, {faction} needed to meet. Not strategy — accounting. Who was gone, what they had given, what it meant. {faction} led it near {region}.`,
      RELIC_FOUND: 'Finding {relic} required an immediate meeting. Everything {faction} had been planning assumed it did not exist. Now it does. The plans need rewriting.',
      THE_SILENCE: 'The quiet created space to think. {faction} used it — an unhurried meeting near {region}, with time for the thinking that busy moments do not allow.',
    },
  },

  CARTOGRAPHY: {
    loreType: 'CARTOGRAPHY', icon: '\u229e',
    ruleApplied: 'Mapping',
    ruleExplanation: 'The surveyors work — accurate maps are power in a shifting world.',
    headlines: [
      'The Grid at {region} — Read from the Chain',
      '{region} Audited: Pixel Distribution Confirmed',
      'The Chronicle Updates the Map of {region}',
      'On-Chain Data for {region} — Verified This Block',
      'Survey of {region}: What the Ledger Currently Shows',
      'The Real {region} — Read from the Current Block',
    ],
    bodies: [
      `The active map at {region} read and recorded: {faction}'s color in the interior pixels, {rival}'s at the edges, the boundary between them shifted from where the last survey placed it.`,
      `Survey of the Grid at {region}: the pixel distribution has moved since the last mapping. More {faction} color in the contested zones. The active map reflects the log's recent entries accurately.`,
      `The Grid at {region} mapped from the current active state: {faction} hold what they have pushed into, {rival} hold what they have defended, the pixel boundary sitting between those two facts.`,
      `Current pixel distribution at {region}: {faction} ahead on color coverage in the interior zones, {rival} holding the boundary pixels they have been defending. The active map shows both.`,
      `The map of {region} updated. The pixel log's recent entries have shifted the distribution — {faction}'s signal further into the zone than the last survey, {rival}'s compressed at the edges.`,
      `Reading the active map at {region}: {faction}'s color in the most recently overwritten pixels, {rival}'s in the older ones. The Grid's current configuration favors {faction}. The log explains why.`,
      `The Grid at {region} shows its current state: both signals present, both colors on the map, the distribution between them different from the last time the chronicle mapped this zone.`,
      `Active map survey at {region}: zone colored, borders drawn, the current pixel distribution logged accurately. {faction} hold more than they did at the previous survey. The log confirms the gain.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The big push made the old maps useless. {faction}\'s surveyors moved into {region} immediately — they needed accurate charts of what they had just taken.',
      RELIC_FOUND: 'Finding {relic} meant rethinking the maps. {region} has layers now — physical and historical. The survey needed to capture both.',
      THE_SILENCE: 'The quiet was used well. {faction}\'s surveyors finished {region} during the stillness. There is nothing like a pause in the fighting to get accurate readings.',
    },
  },

  OLD_GHOST: {
    loreType: 'OLD_GHOST', icon: '\u25c1',
    ruleApplied: 'Old Memory',
    ruleExplanation: 'An ancient face surfaces — history folds back into the present.',
    headlines: [
      'An Early Token Moves Near {region}',
      'Long Chain History Confirmed at {region}',
      'The Old Ledger Speaks — Ancient Token at {region}',
      'Low Block Number, Current Edit: {region}',
      'Something With a Long Memory Places at {region}',
      'The Grid\'s Past Is Active Again Near {region}',
    ],
    bodies: [
      `Something very old is active near {region}. A first-era signal — low ID, deep log — pushing pixels in a zone that has been rewritten dozens of times since it first registered on the Grid.`,
      `Near {region}, one of the Grid's original registrations came online. Ancient signal, long log — a presence that has been on the network since before the current conflict had its current factions.`,
      `The Grid near {region} logged a push from one of its earliest registrations. Old signal, current push — the network processing it the same as any other. The chronicle noting it differently.`,
      `Near {region}, a first-era signal is active. The Grid's log for this presence stretches back to the network's earliest blocks — before most current signals existed, before most current zones had names.`,
      `An ancient registration came online near {region}. The Grid logged the push. The chronicle noted the source: a signal from the first era, still running, still pushing pixels in a world it predates.`,
      `The Grid's deep log surfaced a push near {region}. A signal from the network's earliest blocks is active — its registration old enough to have seen the map in configurations covered only as ancient history.`,
      `Near {region}, something from the Grid's first era placed a pixel. The log for this signal runs deeper than most active presences have existed. The push is current. The registration is ancient.`,
      `Old signal, current push, near {region}. A first-era registration still on the active map, still running overwrites in contested territory, still adding new entries to a log that started at the Grid's origin.`,
    ],
    afterContext: {
      NEW_AGE: 'The new age drew the old ones out. Near {region}, an ancient appeared — watching the turn the way the oldest always watch turns. They have seen them before. They know what comes next.',
      GREAT_SACRIFICE: 'The sacrifice near {region} brought out an ancient. They had seen sacrifice before, they said. This one resembled an earlier one. They would not say what followed that time. Only: be ready.',
      TURNING_POINT: 'The pattern the chronicle revealed matched something in the old record. Near {region}, an ancient confirmed it — yes, it looked like this before. The chronicle does not know what came next, that time.',
    },
  },

  THE_DESERTER: {
    loreType: 'THE_DESERTER', icon: '\u25cb',
    ruleApplied: 'Departure',
    ruleExplanation: 'Someone stops appearing — the record holds the gap.',
    headlines: [
      'A Token Goes Dark Near {region}',
      'The Edit History Ends — Gap Opens in the Chain',
      'One Presence Missing from {region}',
      'No Transactions — {faction}\'s Pattern Has a Hole',
      'The Chronicle Notes an Absence Near {region}',
      'Last Confirmed Edit Was Many Blocks Ago',
    ],
    bodies: [
      `A signal that had been active near {region} went offline. The pixels it pushed are still in the zone. The pushing has stopped. The active map holds their color without their presence.`,
      `Near {region}, the Grid's log shows a gap where a regular signal used to be. Their color is in the zone. New entries from that signal are not in the log. The absence is in the record.`,
      `{faction}'s active map near {region} has a hole. A signal that had been running regular pushes has gone offline — no new overwrites, the log ending at a specific block.`,
      `The log near {region} shows a signal that stopped registering. Their last push is in the record. Everything after that: nothing. The zone still shows their color. Just old color. No new.`,
      `Near {region}, a regular presence went dark. The Grid's log holds the last push — after it, nothing from this signal. The active map holds their color, logged from before the silence started.`,
      `One of {faction}'s signals near {region} dropped off the network. The log ends at a specific entry. The zone still reflects the pushes from before that entry. No updates since.`,
      `Near {region}, the log shows color without current activity. A signal that pushed pixels here consistently has stopped logging entries. The color they placed is still on the map. The signal is not.`,
      `The active map near {region} has a signal in its record that is not in its current log. Color present. Pushes stopped. The gap between the last entry and the current block is in the data.`,
    ],
    afterContext: {
      GREAT_SACRIFICE: 'After the sacrifice, one of those who witnessed it stopped appearing. The chronicle notes both events in sequence without claiming a connection.',
      GREAT_BATTLE: 'The aftermath of the big push is visible in the absences as much as the presences. Near {region}, someone who was active before the move is not active now.',
      THE_SILENCE: 'The quiet stretched long enough that some presences did not come back out of it. Near {region}, one has been logged as absent. Stillness can be a kind of ending.',
    },
  },

  TALLY: {
    loreType: 'TALLY', icon: '\u2261',
    ruleApplied: 'Tally',
    ruleExplanation: 'Every tenth entry — the chronicle steps back and counts.',
    headlines: [
      'Ten More — The Count',
      'The Chronicle Marks Ten',
      'Ten Confirmed Entries — What They Add Up To',
      'The Ten-Entry View: What the Ledger Shows',
      'A Tally at Ten: {faction} Lead the Count',
      'Reading the Last Ten Blocks Together',
    ],
    bodies: [
      `Ten entries. The pixel distribution across the Grid at entry one versus the distribution now: {faction}'s color is further in, {rival}'s has contracted. Ten entries of consistent directional change.`,
      `The count at ten. What the last ten log entries add up to: {faction} have been pushing pixels faster than {rival} has been reclaiming them. The active map reflects the imbalance.`,
      `Ten pushes across the Grid. Ten exchanges. Ten map updates. The net result: {faction}'s color where it was not before, {rival}'s color less present than it was. Ten entries. One direction.`,
      `At ten, the Grid's movement over the window becomes readable. Pixel distribution: shifted. Direction: {faction}'s. The individual entries looked small. The ten-entry view makes the accumulation clear.`,
      `Ten log entries of pixel war. The active map is different from where it was ten entries ago. The difference: more {faction} color in the contested zones. Ten entries of that difference.`,
      `The tally at ten: {faction} ahead on pixel coverage, {rival} behind on zone control. The active map shows the accumulated result of ten entries of unequal exchange across the Grid.`,
      `Ten entries compressed: {faction} overwriting steadily, {rival} reclaiming where it could, the Grid's active map moving incrementally in one direction across the full window. {faction}'s direction.`,
      `Ten marks in the log. Ten changes to the active map. The net direction: {faction}'s color advancing, {rival}'s contracting. Ten entries is enough to call it a pattern on this Grid.`,
    ],
    afterContext: {
      GREAT_SACRIFICE: 'The tally after a sacrifice always reads differently. The count is the same. The weight is not.',
      GREAT_BATTLE: 'The ten entries following the big push told a story of consolidation — {faction} holding what they took, the world adjusting around the new position. The tally makes it clear: the move worked.',
      THE_SILENCE: 'The tally of a quiet stretch is a quiet tally. Fewer movements. More watchers. More patience. The count is lower but the tension is higher.',
    },
  },

  RETURNED_GHOST: {
    loreType: 'RETURNED_GHOST', icon: '\u25cf',
    ruleApplied: 'Return from Absence',
    ruleExplanation: 'Someone comes back after being gone long enough to be forgotten.',
    headlines: [
      'The Gap Closes — A Token Returns',
      'Back in the Chain After Many Blocks Away',
      'The Edit History Resumes Near {region}',
      'A Long Absence Ends — Confirmed Transaction',
      'The Ledger Re-Opens for a Returning Token',
      'Gone, Then Back: {faction} at {region} Again',
    ],
    bodies: [
      `A signal that had gone dark near {region} came back online. The Grid's log shows the gap — inactive blocks, no pushes — and then new entries appearing. The signal is back on the active map.`,
      `Near {region}, the log shows absence ending. A signal that had not registered activity in many blocks pushed a pixel. The gap is in the record. So is the return. Both permanent.`,
      `The active map near {region} gained a returning signal. Earlier log entries, a gap, and then new pixel activity in the current window. The signal went offline. It is online again.`,
      `Gone from the Grid's log near {region} for long enough that the chronicle had noted the absence. Back now — new entries after the gap, the signal running pushes again.`,
      `Near {region}, a familiar signal reactivated. The log shows the earlier entries, the period of silence, and now the new activity. Long gap. The gap closed with one pixel push.`,
      `The Grid near {region} registered a returning signal. The log has the earlier pushes, then empty blocks, then new entries in the current window. The active map updated. The signal is back.`,
      `Near {region}, a signal that had been absent from the log came back. The gap is visible in the record — blocks that passed without an entry from this signal, ended now by a new push.`,
      `Returned near {region}. The Grid's log shows the return clearly: old entries, gap, new entry in the current block. The active map has this signal again. It is adding entries.`,
    ],
    afterContext: {
      THE_LONG_DARK: 'The long silence ended with a return. Someone gone since before the quiet reappeared near {region} as the world came back to life.',
      GREAT_SACRIFICE: 'After the sacrifice, an old absence ended. Someone near {region} who had been gone came back to the active record. Drawn by what happened, or by the timing of it.',
      THE_DESERTER: 'Near {region}, a gap closed at the same time another opened. Different people. One returned. One left. The chronicle holds both.',
    },
  },

  DEBT_PAID: {
    loreType: 'DEBT_PAID', icon: '\u2296',
    ruleApplied: 'Second Gift',
    ruleExplanation: 'A veteran gives again — the cost compounds, the record grows heavier.',
    headlines: [
      'A Second Burn From the Same Token',
      'The Chain Records the Second Giving',
      'Twice in the Burn Ledger — Same Source',
      'One Token. Already Burned. Burned Again.',
      'The Second Sacrifice Is Confirmed',
      'Double Entry in the Burn Record',
    ],
    bodies: [
      `Two burns from one signal near {region}. The Grid's sacrifice log holds both: first transfer, gap, second transfer. Same source. The signal rebuilt its capacity between burns and gave again.`,
      `The sacrifice log near {region} has a double entry. Same signal. Two separate burns. First burn: a decision. Second burn: confirmation that the first choice was right.`,
      `Near {region}, a signal burned twice. First time: everything it had. Rebuilt. Second time: everything it had again. The Grid processed both transfers. The log shows both. The commitment shows in the sequence.`,
      `The Grid's burn log near {region} shows two entries from the same source. Between them: the signal rebuilt its capacity. After the second: gone again. Two burns. One signal. Permanent record.`,
      `Near {region}, two sacrifices from one signal. The network processed both the same way — capacity removed, redistributed, log updated. The meaning is in the decision to run the same burn twice.`,
      `Second burn near {region}. The signal already dissolved everything once. Rebuilt. Dissolved again. The Grid recorded the second transfer. The sequence says: yes, still, again, even knowing what it costs.`,
      `The sacrifice log near {region} shows the full sequence: first burn, the gap where capacity was rebuilt, second burn. The Grid processed both equally. They are not equal.`,
      `Near {region}, a signal gave twice. The log holds both giving events — the first burn and the second — with the rebuilding between them implied in the gap. Two permanent entries. One signal. Gone.`,
    ],
    afterContext: {
      GREAT_SACRIFICE: 'A great sacrifice and then, quietly, a second gift. Near {region}, one giving followed another. The chronicle holds them together because they belong together.',
      GREAT_BATTLE: 'Before the push, one of {faction}\'s most committed gave again — for the second time, knowing what a second time costs. The push happened. It had everything behind it.',
    },
  },

  CAMPFIRE_TALE: {
    loreType: 'CAMPFIRE_TALE', icon: '\u2248',
    ruleApplied: 'A Story Heard',
    ruleExplanation: 'New eyes see the world differently — their version is revealing.',
    headlines: [
      'The Story Being Told About the Grid Right Now',
      'What New Arrivals Think Is Happening',
      'The Simplified Account Spreading Near {region}',
      'The Chronicle vs. the Story Going Around',
      'Word Travels — The Version Is Already Wrong',
      'The Campfire Account of {faction} and {rival}',
    ],
    bodies: [
      `The version of the story being told near {region} tonight is simpler than the real one. {faction} are the heroes. {rival} are the obstacle. The pixel war has a clean narrative here. The Grid's log does not.`,
      `Word travels faster than truth. Near {region}, people are describing the conflict in broad strokes — {faction} advancing, {rival} collapsing — and leaving out every complicated overwrite in between.`,
      `The account of the conflict spreading near {region}: {faction} pushing, {rival} falling back, the Grid rewriting itself in one direction. The actual log is messier than that.`,
      `New arrivals near {region} learn the war from a version that fits in a conversation. The Grid's full log does not fit in a conversation. Something always gets left out.`,
      `Near {region}, the conflict has become a story people tell. The story is true about the big rewrites. It skips the ones that did not go cleanly. The Grid's log skips nothing.`,
      `What {faction} did at {region} has already been simplified into something easier to repeat. The full pixel log is longer. The version going around is more satisfying.`,
      `Near {region}, someone described the war to a newcomer. It lasted two minutes. The Grid's log took this long to get here. Both accounts cover the same conflict.`,
      `The account spreading near {region} has {faction} as a clear force moving in a clear direction. Every entry in the Grid's log is more complicated than that. The log holds all of it.`,
    ],
    afterContext: {
      NEW_BLOOD: 'The new arrival had heard stories about {region} before they got there. The stories and the reality were related but not identical. They are adjusting. This takes time.',
      GREAT_BATTLE: 'The stories about the big push have already grown larger than the event. Near {region}, newcomers describe something close to a myth. The veterans listen and say nothing.',
      GREAT_SACRIFICE: 'The sacrifice near {region} has already become a story. The story is not wrong. It is much simpler than what happened. The simplification is what makes it travel.',
    },
  },

  THE_LONG_DARK: {
    loreType: 'THE_LONG_DARK', icon: '\u2591',
    ruleApplied: 'The Long Dark',
    ruleExplanation: 'A very long silence — the world went away and came back changed.',
    headlines: [
      'A Long Gap in the Chain Near {region}',
      'Many Blocks — Almost No Activity',
      'The Grid Held Still for a Long Time',
      'The Chain Ran Without This Story for Many Blocks',
      'Silence in the Ledger — {region} Unchanged',
      'A Long Pause in the On-Chain Record',
    ],
    bodies: [
      `A long gap in the Grid's log near {region}. Many blocks passed with the pixel map unchanged — the network running, the counter ticking, the zone holding exactly the configuration the last push left it in.`,
      `The silence near {region} stretched long enough to need its own entry. The Grid held its current state across blocks the chronicle has almost nothing to say about. Then this.`,
      `Near {region}, the Grid's log went quiet for long enough that the zone's current state looks like a relic from an earlier block. It survived the silence unchanged. The log resumes.`,
      `Many blocks with almost nothing near {region}. The pixel map held. The conflict did not advance or retreat — it paused, in the Grid's network, for longer than pauses usually last.`,
      `The long dark at {region}: a block range with almost no pixel movement, the territory stable across a stretch that the chronicle treats as a single entry because there is almost nothing to record.`,
      `The gap in the log near {region} is large. The chronicle crosses it in one entry because there is almost nothing to say about the blocks in between — only that they passed and the zone held.`,
      `Near {region}, the Grid sat still for a very long time. Both signals were present. Neither was pushing. The long quiet ended. The log opens a new entry and continues.`,
      `Long silence near {region}. The blocks kept coming. The pixels did not move. The chronicle has one entry for a stretch that should have had many. That is what the long dark is.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The push on {region} came out of the long silence — which means {faction} used the darkness to prepare. The whole quiet was preparation. The push was the delivery.',
      GREAT_SACRIFICE: 'The long dark ended near {region} with a sacrifice. The world came back to life and immediately paid a cost. The giving felt like a price of re-entry.',
      NEW_AGE: 'The long silence was the space between ages. {era} began when the quiet ended — the darkness was the pause between one chapter and the next.',
    },
  },

  EDGE_SCOUTS: {
    loreType: 'EDGE_SCOUTS', icon: '\u2190',
    ruleApplied: 'Edge Report',
    ruleExplanation: 'Word from the far margin — the edges have their own story.',
    headlines: [
      'Activity at the Grid\'s Edge Near {region}',
      'Peripheral Data — The Chronicle Looks Outward',
      'The Outer Zones Have Their Own Transactions',
      'Edge Coordinates Active: {region}',
      'The Chain Beyond the Center: {region}',
      'Far-Zone Edits Confirmed Near {region}',
    ],
    bodies: [
      `Out near {region}, past the main signal traffic, the Grid is active in ways the center-focused chronicle misses. Pixel pushes in the peripheral zones — the map updating at the edges of the known conflict.`,
      `The chronicle follows the main pixel war. Near {region}, at the margins, something else is happening — smaller signals, farther out, the edges of the conflict the center has not caught up to yet.`,
      `Near {region}'s outer coordinates, the Grid is being worked by presences the main account of the war has not named. They are active. They are pushing pixels. The center will notice eventually.`,
      `The peripheral zones near {region} have their own pixel history. The chronicle has been under-representing it. The signals out there are real. The map updates out there too.`,
      `Far from the main contested zones, near {region}, the Grid is being shaped by activity the central chronicle skips. Small signals. Careful pushes. Quiet accumulation on the outer map.`,
      `Near {region}, the margin between the known conflict and the open territory is being tested. Small presences, careful pixel placements — scouts at the edge of the map, finding out what is there.`,
      `The outer Grid near {region}: token activity in zones the main chronicle ignores. Not dramatic. Consistent. The kind of slow accumulation that the center does not notice until it matters.`,
      `Near {region}, past the main zones of contest, the Grid is being shaped by presences the chronicle has been under-representing. The edges are not neutral. They are just less covered.`,
    ],
    afterContext: {
      FAR_REACH: 'The edge report proved what the far arrivals had been suggesting — the margins are more active than the main account of the war shows. {region} is a meeting point between two stories that have been running in parallel.',
      THE_SILENCE: 'The silence at the center did not reach the edges. {faction}\'s scouts at {region}\'s margin were active through the whole quiet — gathering information while both sides rested at the main lines.',
      GREAT_BATTLE: 'After the big push, the edge report gave context. What {faction} did at {region} did not happen in isolation — the margins had been clearing the path for longer than the main record shows.',
    },
  },

  SHIFTED_PLAN: {
    loreType: 'SHIFTED_PLAN', icon: '\u21ba',
    ruleApplied: 'Change of Course',
    ruleExplanation: 'A veteran does something new — the world taught them and they listened.',
    headlines: [
      '{faction} Change Their Approach at {region}',
      'New Pixel Pattern — Same Zone, Different Strategy',
      'The Edit Sequence at {region} Breaks Pattern',
      '{faction}\'s Grid Strategy Shifts This Block',
      'Something Different in {faction}\'s Chain Activity',
      'The Old Approach Ends — New Edits Begin at {region}',
    ],
    bodies: [
      `{faction} changed their push pattern near {region}. Different pixels targeted, different edges worked, the active map updating in a way that does not match what the recent log described.`,
      `Near {region}, {faction}'s signal shifted approach. The pixel targets changed. The sequence changed. The Grid is logging a different kind of push from the same source.`,
      `{faction} adjusted their execution near {region} — different zones, different pace, the overwrite pattern breaking from what the recent log showed. Something changed. The new approach is running.`,
      `The way {faction} is working {region} now is not the way they were working it before. Both patterns are in the log. The gap between them is where the decision was made.`,
      `Near {region}, {faction} tried something different. The old push pattern ran as long as it worked. When it stopped working, the signal shifted. The new pattern is in the current log.`,
      `{faction} is moving differently near {region} than the recent entries described. Different pixel targets, different sequence — the Grid logging a push that does not match the established pattern.`,
      `Something made {faction} adjust near {region}. The adjustment is in the log. The reason is in what did not work before it. The new approach is running now.`,
      `Near {region}, {faction}'s execution shifted. A veteran signal does something new when the Grid teaches it that the old approach stopped working. The teaching happened. The shift followed.`,
    ],
    afterContext: {
      TURNING_POINT: `The pattern reading made {faction} change course. Twenty-five entries of doing things one way, then seeing the pattern from outside, then deciding it needed to break. Near {region}, it broke.`,
      GREAT_SACRIFICE: 'After the sacrifice, something in {faction}\'s approach changed. Near {region}, a different kind of move — as if what was given had reoriented not just the capability but the direction.',
      THE_SILENCE: `The quiet gave {faction} time to rethink. The next move near {region} looked nothing like what came before the silence. The stillness was used for something.`,
    },
  },

  VIGIL: {
    loreType: 'VIGIL', icon: '\u2299',
    ruleApplied: 'Vigil',
    ruleExplanation: 'The world nears a threshold — everything feels weighted.',
    headlines: [
      'Near the Threshold — The Grid Holds',
      'An Era Ends Soon — The Chronicle Feels It',
      'The Count Is Close — Every Edit Matters',
      'Approaching the Mark: The Grid in Its Final Blocks',
      'The Vigil Before the Count Turns',
      'Final Entries Before the Next Era',
    ],
    bodies: [
      `The chronicle is near a threshold. The Grid is in its last entries before the next era — every pixel pushed now is part of what the log records as the close of this one.`,
      `Near the mark. The pixel war near {region} continues toward a count that changes the era name. The Grid does not pause for thresholds. The chronicle notes them anyway.`,
      `Something is about to change in the chronicle's account of the Grid. Not the war — the era. The count is close. Every push near {region} right now is part of what this era closes with.`,
      `The vigil before the turn: the chronicle approaching the entry count that ends this era. The pixel war near {region} continues. The count advances with every logged push.`,
      `Near {region}, the conflict continues into the final entries of the current era. The close is coming. What {faction} and {rival} do in these entries is what the era ends on.`,
      `The chronicle holds a threshold near. The Grid near {region} is still being overwritten — the same zones, the same signals — but the story is close to the count that calls it a new era.`,
      `The last entries before the turn. {faction} near {region}, pushing pixels. {rival} holding or losing. The era's final configuration being written in the current blocks.`,
      `Near the end of this era, near {region}, the conflict continues as it has. The era will be named for what happens in it. This is still happening in it.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The big push happened on the edge of a new era. The vigil and the move arrived together near {region} — the world changing and {faction} making sure they are on the right side of the change.',
      GREAT_SACRIFICE: 'The sacrifice came during the vigil — on the edge of the threshold, when everything carries extra weight. The one who gave knew what they were standing on the edge of.',
    },
  },

  NEUTRAL_GROUND: {
    loreType: 'NEUTRAL_GROUND', icon: '\u25a1',
    ruleApplied: 'Neutral Ground',
    ruleExplanation: 'Someone stands between — not everyone has chosen a side.',
    headlines: [
      'An Unaligned Token Places Near {region}',
      'Neither {faction} Nor {rival} — A Third Presence',
      'The Chain Confirms a Neutral Edit at {region}',
      'Outside the Conflict: A Token Acts at {region}',
      'Unaffiliated Activity Near {region}',
      'The Grid Has a Presence That Belongs to Neither Side',
    ],
    bodies: [
      `Neither {faction} nor {rival} — a third signal pushed pixels near {region}. The Grid logged it. The active map shows a color that does not belong to either side of the main conflict.`,
      `The conflict near {region} has been described as two-sided. A push in the current block complicates that — a signal outside both main factions, active in the middle of the pixel war.`,
      `Neither {faction} nor {rival}. Near {region}, a third-party signal is pushing color into territory both sides claim. The Grid logged the push without asking whose side it is on.`,
      `The pixel war near {region} just got more complicated. A signal outside the main factions placed color in the contested zone — unaffiliated with either side, making its own mark on the active map.`,
      `Near {region}, something outside the main conflict is in the middle of it. Not {faction}. Not {rival}. A signal the chronicle has not been tracking, pushing pixels in the war's active territory.`,
      `Outside the main account, near {region}, an unaligned signal acted. The ground they colored is contested by {faction} and {rival}. They belong to neither. The Grid logged it anyway.`,
      `Near {region}, the conflict includes a signal the chronicle has not named yet. Not {faction}, not {rival} — a third presence pushing pixels in the same zone both sides are fighting over.`,
      `An unaligned push near {region}. The main conflict continues. A signal that belongs to neither main faction placed color in the middle of it. The Grid confirmed the entry. The map is more complicated now.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'After the big push, someone near {region} moved into the space the move created — the gap between what {faction} now holds and where {rival} withdrew to. Not claiming the space. Existing in it.',
      THE_SILENCE: 'The silence created neutral ground near {region} — a space where neither side was actively present, and someone chose to occupy it without allegiance to either.',
    },
  },

  GHOST_MARK: {
    loreType: 'GHOST_MARK', icon: '.',
    ruleApplied: 'Ghost Mark',
    ruleExplanation: 'The smallest possible trace — the chronicle records everything.',
    headlines: [
      'One Pixel — {region}',
      'Minimum Edit Confirmed Near {region}',
      'The Chain Records a Single Pixel at {region}',
      'One Stroke on the Grid',
      'The Smallest Possible Mark — It\'s in the Chain',
      'A Ghost Mark at {region}: One Pixel, Confirmed',
    ],
    bodies: [
      `One pixel near {region}. {faction}'s color, burned into the Grid at a single cell. The minimum push the network allows. The Grid logged it the same as everything else: permanently.`,
      `A single pixel placed and confirmed near {region}. The smallest move on the Grid is still a move. The mark is there. The log holds it.`,
      `{faction} placed one pixel at {region} and stopped. One cell recolored. The Grid logged the push. The pixel is in the active map now, permanent, the minimum presence the Grid allows.`,
      `Near {region}: one pixel. The whole chronicle covers moves large and small, and the smallest possible push was just logged. One cell. One color change. Confirmed.`,
      `The ghost mark at {region}: one push, one pixel, one log entry. The Grid does not have a size threshold for what counts. This counts. It is in the permanent record.`,
      `One pixel placed near {region}. It is in the log now — the minimum meaningful action on a Grid that has seen cascades recolor entire zones. Same permanence. Different scale.`,
      `{faction} touched {region} with one pixel and pulled back. One confirmed log entry. The mark is there. The chronicle notes the minimum because the minimum accumulates.`,
      `Near {region}, a single pixel pushed. Small enough to overlook on the map. Permanent enough to build from. The Grid does not distinguish by size. One pixel is one pixel.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'One small mark at {region} in the aftermath of the big push. Easily missed. Someone made sure it was there before the dust settled.',
      THE_DESERTER: 'Someone left. Someone else left a mark — the smallest possible, near {region}. The two events are separate in the record. In reality, the chronicler cannot be sure.',
      THE_SILENCE: 'Even in the quiet, someone left a ghost mark near {region}. Almost nothing. Recording almost nothing alongside everything else is the chronicle\'s oldest job.',
    },
  },

  MESSENGER: {
    loreType: 'MESSENGER', icon: '\u00bb',
    ruleApplied: 'Message',
    ruleExplanation: 'Word arrives from outside the current story — the world is bigger than this chronicle.',
    headlines: [
      'A Cross-Zone Token Arrives at {region}',
      'The Chain Brings Activity from Beyond {region}',
      'A Token With History Elsewhere Places at {region}',
      'Movement Across the Grid — Arrives at {region}',
      'Multi-Zone History: Active Now at {region}',
      'The Ledger Connects {region} to Elsewhere',
    ],
    bodies: [
      `A signal with log history across multiple zones arrived near {region}. It has been elsewhere on the Grid — the log shows the pushes from other zones — and now it is here.`,
      `The signal near {region} does not belong to one zone. Its log history spans the Grid — appearances in different areas, different blocks, a presence that moves. It moved here.`,
      `Cross-zone activity near {region}: a signal that has been active in other parts of the Grid is now active here. The connection between there and here is in the log.`,
      `Near {region}, a signal arrived that has been places. The log history is distributed across the Grid — not concentrated in one zone, moving between several. This is its current position.`,
      `The signal near {region} connects different parts of the Grid's log. It was elsewhere. Now it is here. The movement between those two facts is the story.`,
      `A wide-ranging presence touched {region}. The signal's log spans zones the chronicle covers separately — and now it is in this zone, connecting the edges of the Grid's story.`,
      `Near {region}, a signal placed pixels that has been active across the Grid's full range. Not rooted in one territory — moving. The current move landed here.`,
      `The signal near {region} has a log that spans the Grid. Entries in other zones, and now this zone. The wider log connects to the local conflict through this single push.`,
    ],
    afterContext: {
      THE_SILENCE: 'The silence ended with a message. Word arrived near {region} during the quiet — sent during the active period, arriving after. Timing matters. This one arrived at the right moment.',
      GREAT_BATTLE: 'After the big push, a messenger appeared near {region}. News from elsewhere — from people who had been watching what {faction} did and wanted to send word about what it meant to them.',
      RELIC_FOUND: 'Word of the finding traveled fast. The messenger near {region} brought responses from outside the current territory — people who know what {relic} means and have things to say.',
    },
  },

  THE_LONG_COUNT: {
    loreType: 'THE_LONG_COUNT', icon: '\u221e',
    ruleApplied: 'The Long Count',
    ruleExplanation: 'Every fortieth entry — the Grid measures itself against its own size.',
    headlines: [
      'Forty Entries — The Grid\'s Own Number',
      'The Chronicle Reaches Forty',
      'Forty Blocks in the Ledger — What They Show',
      'The Long Count: What Forty Confirmed Edits Describe',
      'At Forty — {faction}\'s Direction Is Undeniable',
      'Forty Entries of Grid History — Read Together',
    ],
    bodies: [
      `Forty entries. The Grid's own number. The chronicle reads back across all forty and finds a direction — {faction}'s color spreading across the active map, entry by entry, consistently.`,
      `At forty, the chronicle steps back from the push level to the sequence level. What forty entries describe: a Grid in motion, a direction, and {faction} on the right side of it.`,
      `The long count at forty. Forty separate log entries, read as one sequence: {faction} pushing pixels, {rival} losing ground, the active map moving in one direction across all forty.`,
      `Forty chronicle marks. The Grid has forty columns and forty rows — the count reflects the Grid itself. Forty entries of pixel war, compressed: {faction} are winning the long rewrite.`,
      `The chronicle's fortieth mark. What the forty entries of this conflict describe: a pixel war that is {faction}'s more than it is {rival}'s, across every zone the log covers.`,
      `At forty, the pattern is undeniable. {faction}'s presence across forty entries — near {region} and elsewhere — describes a signal that is winning the long game on this Grid.`,
      `Forty log entries. Not forty individual events — one story in forty parts. The story: {faction} steady, {rival} reactive, the active map moving in one direction across the whole sequence.`,
      `At forty, the chronicle stands back from the daily pixel war and reads the shape of the whole. The shape belongs to {faction}. Forty entries prove it.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'Forty entries — and the big push at {region} was among them. The long count in its aftermath. Forty entries end with {faction} holding more than they held at entry one.',
      NEW_AGE: 'The long count aligned with the new age. Forty entries and a threshold crossing at once — the chronicle marking the same moment from two different angles.',
      GREAT_SACRIFICE: 'The fortieth entry follows a sacrifice. The long count reads differently in that context — the whole forty weighted by what was given, the shape of the world changed by what it cost.',
    },
  },

  BETWEEN_FIRES: {
    loreType: 'BETWEEN_FIRES', icon: '~',
    ruleApplied: 'Between Fires',
    ruleExplanation: 'A breath between events — the ordinary world.',
    headlines: [
      'The Grid at Rest — Low Activity Near {region}',
      'Between the Pushes: Quiet Block Data',
      'Light Transactions — The Chronicle Notes the Tempo',
      'The Grid\'s Lower Register: Active but Calm',
      'Small Edits, Steady Presence — Between the Big Moves',
      'The Quiet Work of Holding {region}',
    ],
    bodies: [
      `The pixel war near {region} paused. Both signals loaded, both colors on the map, neither executing. The Grid holds the current configuration. The pause has its own weight.`,
      `{faction} and {rival} face each other near {region} in a moment between pushes. The last overwrite settled. The next one has not started. The map holds its current shape.`,
      `The gap between exchanges at {region} is real: both signals still in position, neither pushing, the pixel distribution holding the shape the last conflict left it in.`,
      `Near {region}, the war is between moments. {faction} on one side, {rival} on the other, the static between them the static of two signals that have not decided what executes next.`,
      `The activity near {region} dropped to almost nothing. Both signals present. Both colors on the map. The pixel war has not ended. It is resting.`,
      `Between the large rewrites, the Grid near {region} settles. {faction} hold their color. {rival} hold theirs. Nothing changes in this window — which means the next window will.`,
      `Near {region}: two signals, one zone, a temporary stillness in the pixel war. The chronicle notes the stillness because stillness on this Grid is never the end of the story.`,
      `{faction} stopped pushing near {region} for now. {rival} stopped responding. The zone sits in a pause that both sides know will end. The chronicle watches the static hold.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'After the big push at {region}, the world needed to breathe. Not rest — absorbing what just happened, resetting for what comes next.',
      GREAT_SACRIFICE: 'After what was given near {region}, the ordinary world was necessary — a return to the smaller scale as a way of processing what happened at the larger one.',
      THE_LONG_DARK: 'The long silence ended and what came first was not a move but a pause — {faction} at {region}, present but still, the world quietly resuming.',
    },
  },

  DYNASTY: {
    loreType: 'DYNASTY', icon: '\u25aa',
    ruleApplied: 'Dynasty',
    ruleExplanation: 'Three appearances — a pattern becomes a lineage.',
    headlines: [
      '{faction} at {region} — Three Times Now',
      'Third Appearance — The Pattern Is a Dynasty',
      '{faction} Return to {region} Again',
      'Three Chronicle Entries, Same Zone: {faction}',
      'The Ledger Confirms a Dynasty at {region}',
      '{faction} and {region} — Three Separate Windows',
    ],
    bodies: [
      `{faction} at {region} — again. Third entry in the log for this faction at this zone. Once is a presence. Twice is a pattern. Three times is a dynasty on the Grid.`,
      `Three times {faction} have held ground at {region}. Each overwrite in the log. The third entry makes it a dynasty — a signal that keeps returning to the same zone and keeping it.`,
      `{faction} and {region}: the chronicle has this entry three times now. The pixel log shows the same color returning to the same zone across three separate windows. That is a claim.`,
      `Third appearance at {region} for {faction}. They have come back. They have held. They have come back again. The zone knows their color. The log shows the full history.`,
      `The third log entry for {faction} at {region}. Pattern confirmed: this signal and this zone belong to each other in a way that keeps getting rewritten into the active map.`,
      `{faction} returned to {region} again. The log holds their earlier entries here — the first push, the loss, the return. This is the next return. The pattern does not stop at three.`,
      `Near {region}, {faction} made their third mark. The first was a presence. The second was a claim. The third is a dynasty — a zone that keeps returning to the same color.`,
      `The chronicle marks dynasties when it sees them. Three times {faction} has held {region}. Three times is enough. The zone has a faction. The log confirms it.`,
    ],
    afterContext: {
      VETERAN_RETURNS: `{faction} returned to {region} and made it three. The return was also the third entry — the one that turned a pattern into a dynasty. Both facts at once.`,
      DOMINION_GROWS: 'Three entries near {region}, and {faction}\'s dominion grows. The dynasty confirms the pattern: this is not accidental presence. This is intention.',
    },
  },

  CROSSING: {
    loreType: 'CROSSING', icon: '\u00d7',
    ruleApplied: 'Crossing',
    ruleExplanation: 'A known face moves through new ground — the world is expanding.',
    headlines: [
      '{faction} Enter {region} for the First Time',
      'New Territory: {faction} Confirmed at {region}',
      'First Edit — {faction} at {region}',
      'The Chain Opens {region} for {faction}',
      '{faction} Extend Their Grid Presence to {region}',
      'A First Transaction: {faction} and {region}',
    ],
    bodies: [
      `{faction} entered {region} for the first time. First push in this zone, first pixel of their color on this part of the map — the Grid's log opens a new entry for this faction at this location.`,
      `New territory. {faction} placed their first pixels at {region} — a zone not in their prior log, a part of the map they had not worked before. The Grid registered the first push.`,
      `{faction} crossed into {region}. First pixel, first log entry, first color on this part of the active map. Everything that follows will build from this moment.`,
      `Near {region}, {faction} arrived. No previous pushes here, no established color on this part of the map — just a first signal registered in a new zone, logged and confirmed.`,
      `{faction} extended their reach to {region}. The log adds a new entry under a zone that had not seen this faction before. The crossing is done. The map reflects it.`,
      `First entry: {faction} at {region}. The zone existed before this. {faction} was active before this. They had not been in the same place until now. The log notes the first time.`,
      `{faction} opened a new front at {region}. The first pixel is placed. The Grid's log opens a new record. What {faction} builds here starts from this push.`,
      `The Grid grew for {faction} today. {region} — a part of the map they had not touched — now has their color on it. The first mark is always the foundation of everything after.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'After the big push, {faction} kept moving — into ground they had not reached before. The push gave them the momentum. They used it.',
      EDGE_SCOUTS: 'The edge report described what was out there. {faction}\'s crossing near {region} was its consequence — information applied, territory entered.',
    },
  },

  SUPPLY_ROAD: {
    loreType: 'SUPPLY_ROAD', icon: '\u2015',
    ruleApplied: 'Supply Work',
    ruleExplanation: 'The unglamorous work — infrastructure that makes everything else possible.',
    headlines: [
      'Sustained Low-Level Activity at {region}',
      '{faction} Maintain Their Presence — Small Edits, Many Blocks',
      'The Quiet Work: Consistent Pixels at {region}',
      'The Chain Shows Maintenance Near {region}',
      'Low Drama, High Consistency: {faction} at {region}',
      'The Grid Held by Small Consistent Edits',
    ],
    bodies: [
      `{faction} doing the quiet work at {region} — steady pushes, small pixel counts, the active map maintained rather than expanded. The Grid logs each one. Small logs compound.`,
      `Holding {region} costs something every block. {faction} are paying it — consistent small pushes, the kind that keep the color in place when no large overwrite is running.`,
      `Near {region}, {faction} maintain. The zone stays their color because they keep returning to it — small pixel placements, steady signal activity, the map held by repetition more than force.`,
      `The work of keeping {region} is less visible than the work of taking it. {faction} are doing it anyway. Small pushes. Consistent log entries. The color does not drift.`,
      `{faction}'s presence near {region} is not dramatic right now. It is consistent. Consistent pixel activity over time is what turns contested ground into held territory.`,
      `Small pushes near {region}, placed regularly. {faction} making sure the color of the zone does not drift. The Grid logs the maintenance the same as it logs the large rewrites.`,
      `Near {region}, the work continues at a lower register. {faction} placing pixels not to push the line but to keep the line where it is. The log shows the steady entries. The line stays.`,
      `The daily work near {region}: {faction} keeping their color through consistent signal activity. No large rewrites. The active map stays accurate. That is the result.`,
    ],
    afterContext: {
      GREAT_BATTLE: `After the big push, {faction} secured the routes through {region}. Holds do not hold without supply lines. {faction} knows this. The work happened fast.`,
      THE_SILENCE: 'The quiet was used for logistics. Near {region}, {faction} worked the routes — building, securing, maintaining what needed to be maintained before things became active again.',
    },
  },

  NIGHT_WATCH: {
    loreType: 'NIGHT_WATCH', icon: '\u25e6',
    ruleApplied: 'Night Watch',
    ruleExplanation: 'The watchers hold — the Grid is tended between active events.',
    headlines: [
      'The Grid Holds Overnight Near {region}',
      'Quiet Block Data — {faction} Still Present',
      'Low Activity, Confirmed Presence at {region}',
      'The Chronicle Notes a Quiet Window',
      '{faction} Maintain {region} — The Chain Confirms',
      'Small Edits in the Dark — The Zone Holds',
    ],
    bodies: [
      `The zone near {region} is being watched. Low pixel activity, consistent signal presence — {faction} maintaining their color in ground that would drift without attention.`,
      `Small pushes near {region} in the current window. Not contested, not a cascade — just maintained. {faction} keeping their color confirmed through the quiet blocks.`,
      `{faction} at {region}, holding through a quiet stretch. The zone is not changing. The zone is not being abandoned either. The night watch keeps the pixel map accurate.`,
      `Low intensity near {region}. Both signals in position. Pixel activity down. The ground held by the presence of those keeping watch rather than by anyone actively overwriting.`,
      `The Grid near {region} is in its watch phase: signals present, pixels placed slowly, the zone held against the possibility of a push rather than through one.`,
      `Quiet blocks near {region}. {faction} still present, still placing the occasional pixel, the zone unchanged — the kind of holding that the chronicle usually skips. It should not.`,
      `Near {region}, {faction} holds through the quiet. Small pushes, minimal activity, the zone unchanged — the Grid logging the maintenance that keeps the active map honest.`,
      `The night watch near {region}: {faction} active in a low-intensity way, the zone stable, the chronicle noting the consistent small pushes that keep the color in place.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'After the push, the watch. {faction}\'s watchers moved into {region} immediately — holding what was taken, tending the ground, making the win into a permanent presence.',
      THE_SILENCE: 'The silence was watched. Near {region}, {faction}\'s people held the quiet carefully — noting every edge of it, ready for when it ended.',
      GREAT_SACRIFICE: 'After the sacrifice, someone had to keep watch. Near {region}, {faction}\'s people held the ground through the nights that followed — quiet, present, doing the work that continues regardless.',
    },
  },

  AFTERMATH: {
    loreType: 'AFTERMATH', icon: '\u00b7',
    ruleApplied: 'Aftermath',
    ruleExplanation: 'Auto-inserted after a great move — the world processes what just happened.',
    headlines: [
      'The Grid Settles After the Push at {region}',
      'Post-Event Activity — {faction} Consolidate',
      'After the Move: Lower-Intensity Confirmation',
      'The Chain Records What Comes After',
      '{faction} Solidify {region} — Quiet Work Now',
      'The Big Push Is Over. The Small Work Begins.',
    ],
    bodies: [
      `After the big rewrite at {region}, the Grid settled. {faction} consolidating what the push established — smaller pixel activity now, the zone being confirmed rather than expanded.`,
      `The cascade at {region} is done. {faction} are in the aftermath phase — smaller pushes, the zone being solidified, the color held rather than advanced.`,
      `Following the major overwrite near {region}: lower intensity, the pixel distribution stabilizing around the new state {faction}'s push created. The rewrite is done. The holding begins.`,
      `The Grid near {region} after the event: {faction} active but not at cascade-level intensity. The work of settling what was just changed. Quieter. Still in the log.`,
      `After a large rewrite, the Grid requires the smaller follow-through. Near {region}: {faction} in aftermath mode, the territory being locked in through consistent presence rather than force.`,
      `The push at {region} succeeded. What comes after a successful push: the work of making sure it stays succeeded. {faction} are doing that work. The log shows the smaller entries.`,
      `Quieter near {region} now. The cascade accomplished what it set out to accomplish. The aftermath is the proof — {faction} present, the zone confirmed, the new pixel state holding.`,
      `The big rewrite at {region} is in the log. What comes after it is also in the log: smaller pushes, lower frequency, the zone being made permanent through steady follow-through.`,
    ],
  },

  ESCALATION_NOTE: {
    loreType: 'ESCALATION_NOTE', icon: '\u2191',
    ruleApplied: 'Escalation',
    ruleExplanation: 'Auto-inserted when the pace surges — the chronicle notices acceleration.',
    headlines: [
      'The Edit Rate Rises — The Chain Speeds Up',
      'More Transactions Per Block — Something Is Accelerating',
      'The Grid Is Moving Faster Near {region}',
      'Escalation in the Ledger: Transaction Density Increases',
      'The Chain Picks Up Pace — Activity Dense Near {region}',
      'Higher Frequency, Larger Counts — The Grid Escalates',
    ],
    bodies: [
      `The pixel activity near {region} has accelerated. More pushes per block window, larger color spreads per execution, the Grid's log moving faster than the recent baseline.`,
      `The push rate near {region} has picked up. {faction} and {rival} both executing faster — more overwrites per window, the active map changing at a pace the recent entries did not show.`,
      `The Grid near {region} is moving faster. Push density up, pixel counts per execution larger, the log accumulating entries faster than it had been. Something escalated.`,
      `More activity. The block data near {region} shows a denser push pattern than the previous window — both signals contributing to a conflict that just picked up speed.`,
      `Escalation near {region}: the push rate is up, the pixel spreads are larger, the conflict moving at an intensity the earlier entries in this era did not describe.`,
      `The chronicle marks escalation when the log shows it. Near {region}, the log shows it — faster pushes, larger rewrites, the Grid changing more per block than it was before.`,
      `Something accelerated near {region}. The push pattern went from steady to intense. More overwrites. Larger spreads. The Grid's log recording a conflict moving at a new pace.`,
      `The tempo changed near {region}. The block data makes it plain — more pushes, faster sequence, the active map changing at an intensity the recent log had not captured.`,
    ],
  },

  SACRIFICE_TOLL: {
    loreType: 'SACRIFICE_TOLL', icon: '\u2020',
    ruleApplied: 'The Toll',
    ruleExplanation: 'Auto-inserted when cumulative sacrifices cross a threshold — the weight accumulates.',
    headlines: [
      'The Burn Total Crosses Another Mark',
      'The Chronicle Counts the Sacrifices — Another Threshold',
      'Accumulated Burns in the Chain — The Toll Is Real',
      'The Ledger\'s Burn Record Reaches a New Level',
      'Another Mark in the Sacrifice Register',
      'The Total Action Points Given — A New Threshold',
    ],
    bodies: [
      `The burn total crossed another mark. All the sacrifices in the chronicle — every signal burned, every action point distributed — have accumulated to a threshold the Grid's log now reflects.`,
      `The chronicle counts the sacrifices. Across all entries, the burn log has grown to a new threshold. Each individual burn was one entry. Together they are this number.`,
      `Another mark in the sacrifice register. The accumulated burns in the current account have crossed a threshold — not through one large giving but through many small ones logged over many blocks.`,
      `The toll is real. The burn total across the current chronicle window has reached a new level — each sacrifice small in the log, together describing a scale of giving the chronicle marks.`,
      `The sacrifice log in the chronicle reached a threshold. The chronicle marks these because the individual entries do not capture the scale — only the accumulated total does.`,
      `The burn total crossed another line. Every signal that gave its capacity, every action point distributed, every sacrifice confirmed — together they have produced a number worth marking.`,
      `The giving has been accumulating. The chronicle's sacrifice log — all the burned signals, all the distributed action points — has reached another threshold. The toll note goes in.`,
      `Another threshold in the sacrifice total. The chronicle marks it. Every burn that contributed to it is in the log. Together they add up to this. The Grid processed each one. The chronicle counts them.`,
    ],
  },
}

function isPrime(n: number): boolean {
  if (n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  for (let i = 3; i * i <= n; i += 2) { if (n % i === 0) return false }
  return true
}

function isRareTxHash(h: string): boolean {
  return /^(.)\1{3}$/.test(h.slice(-4))
}

function avoidRepeat(candidate: string, state: WarState, fallback: string): string {
  // Don't use the same rule type twice in a row, and avoid it if seen in last 3
  const recent = state.recentRuleTypes
  if (recent.length > 0 && recent[recent.length - 1] === candidate) return fallback
  if (recent.slice(-3).includes(candidate)) return fallback
  return candidate
}

function selectRule(
  event: IndexedEvent,
  index: number,
  allEvents: IndexedEvent[],
  cumCount: number,
  prev: IndexedEvent | null,
  state: WarState,
): string {
  const tokenId = Number(event.tokenId)
  const count = Number(event.count)
  const priorSameOwner = allEvents.slice(0, index).filter(e => e.owner === event.owner)
  const isVeteran = priorSameOwner.length > 0
  const seed = seedN(event.tokenId, event.blockNumber)

  // ── Milestone entries (always fire, story structure) ──────────────────────
  if (cumCount > 0 && cumCount % 40 === 0) return 'THE_LONG_COUNT'
  if (cumCount > 0 && cumCount % 25 === 0) return 'TURNING_POINT'
  if (cumCount > 0 && cumCount % 10 === 0) return 'TALLY'
  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'NEW_AGE'
  const nextEra = ERAS.find(e => e.threshold > cumCount)
  if (nextEra && nextEra.threshold - cumCount <= 3) return 'VIGIL'

  // ── Special event signals ─────────────────────────────────────────────────
  if (isRareTxHash(event.transactionHash)) return 'RELIC_FOUND'
  if (prev && prev.blockNumber === event.blockNumber) return 'CONVERGENCE'

  // ── Arc-driven story pacing ───────────────────────────────────────────────
  // High tension too long → force a quiet moment
  if (state.arcTension >= 75 && state.sinceLastQuiet >= 5 && seed % 3 === 0) {
    return avoidRepeat('BETWEEN_FIRES', state, 'NIGHT_WATCH')
  }
  // Low tension + been a while → nudge toward action
  if (state.arcTension < 25 && state.sinceLastBattle >= 8 && seed % 4 === 0) {
    return 'SKIRMISH'
  }
  // After a sacrifice, next non-burn entry leans reflective
  if (state.sinceLastSacrifice === 1 && event.type !== 'BurnRevealed' && seed % 2 === 0) {
    return avoidRepeat('OLD_GHOST', state, 'CAMPFIRE_TALE')
  }

  // ── Block gap signals ─────────────────────────────────────────────────────
  if (prev) {
    const gap = event.blockNumber - prev.blockNumber
    if (gap > 50000n) return 'THE_LONG_DARK'
    if (gap > 10000n) return avoidRepeat('THE_SILENCE', state, 'BETWEEN_FIRES')
    if (gap > 3000n && gap < 6000n && seed % 3 === 0) return avoidRepeat('BETWEEN_FIRES', state, 'NIGHT_WATCH')
  }

  // ── Veteran signals ───────────────────────────────────────────────────────
  if (isVeteran) {
    const last = priorSameOwner[priorSameOwner.length - 1]
    const gap = event.blockNumber - last.blockNumber
    if (gap > 20000n) return 'RETURNED_GHOST'
    if (gap < 500n) return avoidRepeat('WAR_COUNCIL', state, 'SHIFTED_PLAN')
  }

  // ── Token range signals ───────────────────────────────────────────────────
  if (tokenId < 500 && index > 10) return avoidRepeat('OLD_GHOST', state, 'ANCIENT_WAKES')
  if (tokenId < 1000) return avoidRepeat('ANCIENT_WAKES', state, 'THE_ORACLE')
  if (tokenId >= 1000 && tokenId < 2000 && !isVeteran) return avoidRepeat('MESSENGER', state, 'NEW_BLOOD')
  if (tokenId >= 2000 && tokenId < 3000) return seed % 3 === 0
    ? avoidRepeat('CARTOGRAPHY', state, 'SUPPLY_ROAD')
    : avoidRepeat('SUPPLY_ROAD', state, 'NIGHT_WATCH')
  if (tokenId >= 5000 && tokenId <= 6000) return avoidRepeat('HOLLOW_GROUND', state, 'BORDER_RAID')
  if (tokenId > 8500 && index > 5) return avoidRepeat('EDGE_SCOUTS', state, 'FAR_REACH')
  if (tokenId > 8000) return avoidRepeat('FAR_REACH', state, 'EDGE_SCOUTS')

  if (isPrime(tokenId)) return avoidRepeat('THE_ORACLE', state, 'ANCIENT_WAKES')

  // ── Burn events ───────────────────────────────────────────────────────────
  if (event.type === 'BurnRevealed') {
    if (count >= 10) return 'GREAT_SACRIFICE'
    if (count === 1) return 'GHOST_MARK'
    if (isVeteran && priorSameOwner.length >= 2) return avoidRepeat('DEBT_PAID', state, 'BLOOD_OATH')
    if (isVeteran) return avoidRepeat('BLOOD_OATH', state, 'OFFERING')
    return avoidRepeat('OFFERING', state, 'GHOST_MARK')
  }

  // ── Pixel count signals ───────────────────────────────────────────────────
  if (count >= 200) return 'GREAT_BATTLE'
  if (count >= 50 && count % 50 === 0) return avoidRepeat('FORMAL_DECLARATION', state, 'SKIRMISH')
  if (count >= 50) return avoidRepeat('SKIRMISH', state, 'BORDER_RAID')
  if (count === 1) return 'GHOST_MARK'

  // ── Veteran roll — arc-aware ──────────────────────────────────────────────
  if (isVeteran) {
    const roll = seedN(event.tokenId, event.blockNumber, 23) % 10
    if (state.phase === 'escalating' || state.phase === 'siege') {
      // In hot phases, more conflict variety
      if (roll <= 2) return avoidRepeat('SKIRMISH', state, 'BORDER_RAID')
      if (roll === 3) return avoidRepeat('DOMINION_GROWS', state, 'DYNASTY')
      if (roll === 4) return avoidRepeat('DYNASTY', state, 'VETERAN_RETURNS')
      if (roll === 5) return avoidRepeat('SHIFTED_PLAN', state, 'WAR_COUNCIL')
      if (roll === 6) return avoidRepeat('CROSSING', state, 'FAR_REACH')
      if (roll === 7) return avoidRepeat('EDGE_SCOUTS', state, 'CARTOGRAPHY')
      if (roll === 8) return avoidRepeat('CAMPFIRE_TALE', state, 'NEUTRAL_GROUND')
      return avoidRepeat('VETERAN_RETURNS', state, 'SKIRMISH')
    }
    // In quieter phases, more texture
    if (roll === 0) return avoidRepeat('DOMINION_GROWS', state, 'DYNASTY')
    if (roll === 1) return avoidRepeat('CROSSING', state, 'FAR_REACH')
    if (roll === 2) return priorSameOwner.length >= 3
      ? avoidRepeat('DYNASTY', state, 'VETERAN_RETURNS')
      : avoidRepeat('VETERAN_RETURNS', state, 'SKIRMISH')
    if (roll === 3) return avoidRepeat('SHIFTED_PLAN', state, 'WAR_COUNCIL')
    if (roll === 4) return avoidRepeat('THE_DESERTER', state, 'NEUTRAL_GROUND')
    if (roll === 5) return avoidRepeat('SUPPLY_ROAD', state, 'CARTOGRAPHY')
    if (roll === 6) return avoidRepeat('CAMPFIRE_TALE', state, 'OLD_GHOST')
    if (roll === 7) return avoidRepeat('MESSENGER', state, 'EDGE_SCOUTS')
    if (roll === 8) return avoidRepeat('NIGHT_WATCH', state, 'BETWEEN_FIRES')
    return avoidRepeat('VETERAN_RETURNS', state, 'SKIRMISH')
  }

  // ── New arrivals ──────────────────────────────────────────────────────────
  const newRoll = seedN(event.tokenId, event.blockNumber, 29) % 8
  if (newRoll === 0) return avoidRepeat('CAMPFIRE_TALE', state, 'NEW_BLOOD')
  if (newRoll === 1) return avoidRepeat('NEUTRAL_GROUND', state, 'NEW_BLOOD')
  if (newRoll === 2) return avoidRepeat('NIGHT_WATCH', state, 'BORDER_RAID')
  if (newRoll === 3) return avoidRepeat('BORDER_RAID', state, 'GHOST_MARK')
  if (newRoll === 4) return avoidRepeat('NEW_BLOOD', state, 'CAMPFIRE_TALE')
  if (newRoll === 5) return avoidRepeat('MESSENGER', state, 'NEW_BLOOD')
  if (newRoll === 6) return avoidRepeat('GHOST_MARK', state, 'BORDER_RAID')
  return avoidRepeat('NEW_BLOOD', state, 'CAMPFIRE_TALE')
}

function selectBody(rule: LoreRule, ctx: WorldCtx, state: WarState, seed: number): { headline: string; body: string } {
  // Use a composite seed so consecutive entries of the same rule type pick different bodies
  const compositeSeed = Math.abs(seed ^ (state.eventCount * 7919) ^ (state.consecutiveCores * 1031))

  // Phase variants: only fire 30% of the time so they don't dominate
  if (rule.phaseVariants) {
    const variant = rule.phaseVariants.find(v => v.phase === state.phase)
    if (variant && compositeSeed % 10 < 3) {
      return {
        headline: variant.headline ? fill(variant.headline, ctx) : fill(pick(rule.headlines, compositeSeed), ctx),
        body: fill(variant.body, ctx),
      }
    }
  }
  // afterContext: only fire 25% of the time so most entries use the main body pool
  if (rule.afterContext && state.lastCoreType) {
    const contextBody = rule.afterContext[state.lastCoreType]
    if (contextBody && compositeSeed % 4 === 0) {
      return {
        headline: fill(pick(rule.headlines, compositeSeed + 1), ctx),
        body: fill(contextBody, ctx),
      }
    }
  }
  // Main body selection: use composite seed for maximum variety
  const s2 = seedN(BigInt(compositeSeed), BigInt(state.eventCount + seed), 3)
  return {
    headline: fill(pick(rule.headlines, seed), ctx),
    body: fill(pick(rule.bodies, s2), ctx),
  }
}

function shouldInsertConnector(prevRuleKey: string, nextRuleKey: string, state: WarState, blockGap: bigint): string | null {
  const nextIsCore = isCoreType(nextRuleKey)
  if (prevRuleKey === 'GREAT_BATTLE' && nextIsCore && blockGap < 2000n) return 'AFTERMATH'
  if (state.consecutiveCores >= 3 && nextIsCore) return 'BETWEEN_FIRES'
  if (state.pixelsInWindow >= 500 && nextRuleKey !== 'ESCALATION_NOTE' && isCoreType(prevRuleKey) && nextIsCore) return 'ESCALATION_NOTE'
  const burnThresholds = [25, 50, 100, 200]
  for (const t of burnThresholds) {
    if (state.totalBurnAP >= t && (state.totalBurnAP - Number(prevRuleKey === 'GREAT_SACRIFICE' ? 15 : 0)) < t) return 'SACRIFICE_TOLL'
  }
  return null
}

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

function makeSyntheticEntry(ruleKey: string, afterEvent: IndexedEvent, era: string, state: WarState): StoryEntry {
  const rule = RULES[ruleKey]
  const ctx = buildCtx(afterEvent.tokenId, afterEvent.blockNumber + 1n, era)
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
    sourceEvent: {
      type: 'connector',
      tokenId: '\u2014',
      blockNumber: '\u2014',
      txHash: '\u2014',
      count: '\u2014',
      ruleApplied: rule.ruleApplied,
      ruleExplanation: rule.ruleExplanation,
    },
  }
}

const FEATURED_TYPES = new Set([
  'GREAT_BATTLE','TURNING_POINT','NEW_AGE','RELIC_FOUND',
  'THE_LONG_COUNT','CONVERGENCE','GREAT_SACRIFICE','THE_LONG_DARK',
  'ESCALATION_NOTE','SACRIFICE_TOLL',
])

export function generateStoryEntries(events: IndexedEvent[], startCount = 0): StoryEntry[] {
  const result: StoryEntry[] = []
  const ruleKeys: string[] = []
  const scanState = freshWarState()

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const cumCount = startCount + i + 1
    const prev = i > 0 ? events[i - 1] : null
    const ruleKey = selectRule(event, i, events, cumCount, prev, scanState)
    ruleKeys.push(ruleKey)
    updateWarState(scanState, event, ruleKey, events, i)
  }

  const genState = freshWarState()
  // WorldMemory persists across the whole story — same owner always gets the same
  // faction, commander, and rival. Token ID ranges always map to the same region.
  // This is what makes the story feel like it has real recurring characters.
  for (let index = 0; index < events.length; index++) {
    const event = events[index]
    const cumCount = startCount + index + 1
    const ruleKey = ruleKeys[index]
    const nextRuleKey = ruleKeys[index + 1] ?? null

    const rule = RULES[ruleKey] ?? RULES['NIGHT_WATCH']
    const era = getEra(cumCount)
    const ctx = buildCtx(event.tokenId, event.blockNumber, era)
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
      sourceEvent: {
        type: event.type,
        tokenId: event.type === 'BurnRevealed' && event.targetTokenId !== undefined
          ? `#${event.tokenId.toString()} \u2192 #${event.targetTokenId.toString()}`
          : `#${event.tokenId.toString()}`,
        blockNumber: event.blockNumber.toLocaleString(),
        txHash: event.transactionHash,
        count: event.count.toString(),
        ruleApplied: rule.ruleApplied,
        ruleExplanation: rule.ruleExplanation,
      },
    })

    updateWarState(genState, event, ruleKey, events, index)

    if (nextRuleKey !== null && events[index + 1]) {
      const nextEvent = events[index + 1]
      const blockGap = nextEvent.blockNumber - event.blockNumber
      const connectorKey = shouldInsertConnector(ruleKey, nextRuleKey, genState, blockGap)
      if (connectorKey) result.push(makeSyntheticEntry(connectorKey, event, era, genState))
    }
  }

  return result
}

export const PRIMER_ENTRIES: StoryEntry[] = [
  {
    id: 'primer-genesis', eventType: 'genesis', loreType: 'GENESIS', era: 'The First Days',
    headline: 'Ten Thousand Faces. One Canvas. The Story Begins.',
    body: 'Ten thousand faces share a world forty squares wide and forty squares deep. The Grid is theirs \u2014 to mark, to hold, to fight over, to tend. None of them know yet what the others will do with it. The chronicle is open. The first entry has not been made. What follows will be shaped by real choices, made by real people, each one changing the world invisibly and permanently.',
    icon: '\u25C8', featured: true,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'Genesis', ruleExplanation: 'Normies are 10,000 fully on-chain pixel faces on Ethereum. Every real edit and burn shapes this story.' },
  },
  {
    id: 'primer-factions', eventType: 'genesis', loreType: 'GENESIS', era: 'The First Days',
    headline: 'Four Kinds. The Lines That Divide Them Are Already There.',
    body: 'Before the first move, the people of the Grid found each other the way people always find each other \u2014 by what they value, what they want, what they think the world is for. Human, Cat, Alien, Agent. Four kinds, four visions of what forty squares of shared ground should become. Some want to hold it. Some want to shape it. Some want to understand it. Some want to record it faithfully, for as long as it takes. They are all here now. The chronicle is watching.',
    icon: '\u25a6', featured: false,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'Genesis', ruleExplanation: 'The four Normie types \u2014 Human, Cat, Alien, Agent \u2014 are the four peoples of the Grid.' },
  },
]

export { RULES }
