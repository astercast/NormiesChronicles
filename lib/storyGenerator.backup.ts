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
      '\'{faction} Take {region} — Nothing Left of What Was There',
      'The Fall of {region}: {faction} Seize Everything',
      '{faction} Overrun {region}',
      '{rival}\'s Hold on {region} Breaks',
      'All of {region} Falls in a Single Hour',
      'The Longest Night at {region} — {faction} Win It',
    ],
    bodies: [
      `{faction} took {region} pixel by pixel — a cascade that didn't stop until every inch of the zone burned their color. {rival} had no time to read what was happening before the Grid confirmed it.`,
      `The whole zone flipped. {faction} ran the full overwrite on {region} — total, coordinated, final. {rival} watched their color disappear from the map one row at a time.`,
      `{faction} committed everything to {region}. Every presence they had in range joined the cascade. The Grid processed the rewrite and sealed it before {rival} could mount anything close to a response.`,
      `{rival} held {region} until {faction} decided they didn't anymore. A full push — every pixel retouched, every corner recolored. The zone went dark and came back wearing {faction}'s mark.`,
      `A cascade at {region}: {faction}'s color spreading across the zone faster than {rival} could track. The Grid registered each cell as it fell. By the end, the whole zone had changed hands.`,
      `Total rewrite. {faction} didn't take a piece of {region} — they took all of it. Every pixel confirmed. Every cell sealed. {rival}'s presence on that part of the Grid: erased.`,
      `{faction} painted {region} in one sustained push. Pixel by pixel, the zone went their color, and the Grid locked each change as it landed. {rival} was left looking at a map that no longer belonged to them.`,
      `{region} was {rival}'s until {faction} ran the cascade. The Grid absorbed the overwrite cell by cell and confirmed the new state in full. Nothing left to contest. The zone is taken.`,
    ],
    phaseVariants: [
      {
        phase: 'siege',
        headline: 'The Stalemate Breaks — {faction} Move on {region}',
        body: 'The standoff at {region} ended the way standoffs do when one side runs out of patience. {faction} moved with everything — not a probe, not a test — the full commitment. {rival} had been ready for less. They got more.',
      },
      {
        phase: 'reckoning',
        headline: '{faction} Make Their Final Move on {region}',
        body: `This push on {region} carries everything behind it — every smaller move, every contested exchange, every moment that led here. {faction} know what this is. So does {rival}.`,
      },
    ],
    afterContext: {
      GREAT_SACRIFICE: '{faction} moved on {region} the morning after the sacrifice. No announcement. Just the move — different in weight, in quality, from everything before it. The ones who gave were gone. The movement carried them anyway.',
      THE_SILENCE: `The silence ended with everything {faction} had. A full assault on {region} that broke the stillness completely. {rival} had been resting. They should have been watching.`,
      RELIC_FOUND: 'Finding {relic} changed everything. {faction} moved on {region} earlier than anyone expected — before {rival} could act on the same knowledge. The window was taken before it could close.',
      VIGIL: 'The vigil ended with an assault. All that careful holding, and then {faction} committed to {region} completely. The threshold and the move arrived in the same moment.',
    },
  },

  SKIRMISH: {
    loreType: 'SKIRMISH', icon: '\u25C8',
    ruleApplied: 'Skirmish',
    ruleExplanation: 'A real fight — the line moves, pressure builds.',
    headlines: [
      '{faction} Push Deeper at {region}',
      'The Line Shifts at {region}',
      'A Sharp Exchange Near {region}',
      '{faction} Take a Corner of {region}',
      '{rival} Pushed Back at {region}',
      'Ground Won at {region} — But Only Some of It',
    ],
    bodies: [
      `{faction} pushed their color into a corner of {region} and held it. Precise — exactly the pixels they wanted, exactly the edge they needed. The Grid registered the new line before {rival} could counter.`,
      `A sharp exchange at {region}: {faction} overwrote a strip of {rival}'s territory, {rival} counter-pushed, and when the Grid settled {faction} were further in. Small rewrite. Real gain.`,
      `{faction} found a soft patch in {rival}'s hold on {region} — pixels that weren't being maintained — and filled it fast. The Grid locked the new cells in. The edge moved.`,
      `Clean execution at {region}. {faction} targeted the weakest part of {rival}'s pattern, rewrote it precisely, and pulled back. Surgical. The Grid registered the change.`,
      `The line at {region} shifted. {faction} pushed their color into {rival}'s zone — not the full cascade, just the cells that mattered — and the Grid sealed the new configuration.`,
      `{faction} has been rewriting {region} one strip at a time. Each push small. Each one locked in before {rival} can reroute their color back. Today another strip went their hue.`,
      `{rival} was watching the wrong edge at {region}. {faction} came through the unguarded pixels and the Grid confirmed the recolor before anyone could redirect the defense.`,
      `The exchange at {region} ended with {faction}'s color further into the zone. Not a cascade — a calculated overwrite of exactly the cells that moved the line.`,
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        body: 'The war near {region} is moving faster than it was. What used to take three careful engagements happened in one sharp exchange. {faction} hit. {rival} answered. The ground changed before anyone could track the full extent of it.',
      },
      {
        phase: 'siege',
        body: `In a siege, even a small gain costs more than it's worth in normal circumstances. The exchange at {region} wasn't dramatic — but both sides paid for it. They've been paying for it for a long time. Neither stops.`,
      },
    ],
    afterContext: {
      GREAT_BATTLE: '{faction} kept moving after {region}. They pressed the newly taken ground before {rival} could regroup. The second push is still running.',
      THE_SILENCE: 'The quiet ended softly — a small engagement at {region}, not the explosion anyone had been waiting for. {faction} tested the ground. It held. They pressed on.',
      VETERAN_RETURNS: `{faction}'s most experienced returned and immediately improved the engagement. The move at {region} was sharper than anything in the recent period. Experience shows in the execution.`,
      GREAT_SACRIFICE: `After the sacrifice, something changed in the way {faction} moved near {region}. Not slower — more deliberate. Every move weighted by what was given to make it possible.`,
    },
  },

  BORDER_RAID: {
    loreType: 'BORDER_RAID', icon: '\u00b7',
    ruleApplied: 'Border Probe',
    ruleExplanation: 'A small deliberate mark at the edge — quiet but intentional.',
    headlines: [
      'A Mark at the Edge of {region}',
      '{faction} Touch {region}\'s Border — Then Withdraw',
      'A Small Claim on {region}\'s Margin',
      'The Boundary Shifts Overnight',
      '{faction} Leave Their Mark at the Edge',
      'A Probe at {region}',
    ],
    bodies: [
      `One pixel at the edge of {region}. {faction}'s color, burned into the Grid at the exact boundary. Small enough to overlook on the map. Permanent enough to anchor the next push from.`,
      `{faction} touched {region}'s border and pulled back. One pixel of their color sits at the edge now — confirmed by the Grid, visible on the map, the seed of whatever comes next.`,
      `A single cell at {region}'s margin. {faction} ran the minimum the Grid allows — one recolor — and withdrew. The mark is locked in. It wasn't about the size.`,
      `{faction} left their color at {region}'s boundary overnight. One pixel. The Grid registered it the same way it registers a cascade. Small on the map. Not small in meaning.`,
      `Three marks at {region}'s edge. Minimal — {faction} placed their color and disappeared back into the Grid. They say: we can reach this border. Next time we might not stop here.`,
      `The boundary at {region} shifted by one cell. {faction}'s color where it wasn't before. The Grid doesn't distinguish by scale — one pixel confirmed is one pixel held.`,
    ],
    afterContext: {
      GREAT_BATTLE: `After the cascade at {region}, a single pixel placed at the boundary. Easy to miss in the aftermath. Someone made sure their color was staked at the edge before the map settled. settled.`,
      THE_SILENCE: `Even in the quiet, someone touched the edge of {region}. The smallest possible claim, placed carefully while nothing else was moving.`,
      GREAT_SACRIFICE: 'The chronicle notes this moment and what it followed. Both entries belong together in the record.',
      TURNING_POINT: 'The pattern the chronicle revealed was not just the big moves. At every margin, at every edge including {region}, {faction} had been marking quietly. Patient arithmetic.',
    },
  },

  FORMAL_DECLARATION: {
    loreType: 'FORMAL_DECLARATION', icon: '\u25a3',
    ruleApplied: 'Formal Claim',
    ruleExplanation: 'A precise deliberate act — the kind that functions as a political statement.',
    headlines: [
      '{faction} Name What They\'ve Already Won',
      'The Declaration: {region} Belongs to {faction}',
      '{faction} Claim {region} Formally — The Map Already Showed It',
      'Official: {faction} Hold {region}',
      'What Everyone Could See, {faction} Now Say Aloud',
      '{faction} Declare {region} Theirs',
    ],
    bodies: [
      `{faction} named what the map already showed. Their color held every cell of {region} — {rival} had withdrawn, the zone was sealed — and now it's officially recorded. The Grid knew first.`,
      `The declaration came after the work. {faction} took {region}, held every pixel, and only then said so out loud. They weren't claiming something uncertain. They were recording something done.`,
      `{rival} heard the declaration. Their color had already faded from {region}'s map. {faction}'s hold was visible in every cell of the zone long before the announcement — the Grid had been saying it for a while.`,
      `{faction} put words to what the Grid's active map had shown for days. {region} is theirs — in pixels, in territory, in every cell the chronicle tracks. The naming just made the obvious official.`,
      `You don't declare what you don't have. {faction}'s color covered {region} completely before they said anything. The declaration was the record catching up to the map.`,
      `The claim on {region} was real before it was spoken. {faction} held every pixel. {rival} had no color left in the zone. The formal declaration was just the Grid's state, put into words.`,
    ],
    afterContext: {
      GREAT_BATTLE: `The assault at {region} created the opening. The return was timed for it — someone who had been away watching for the right moment to come back.`,
      SKIRMISH: `{faction} fought for {region} and won it. Then they made the winning official. {faction} wanted it clear: this is not temporary. This is stated.`,
      RELIC_FOUND: 'The chronicle notes this moment and what it followed. Both entries belong together in the record.',
    },
  },

  GREAT_SACRIFICE: {
    loreType: 'GREAT_SACRIFICE', icon: '\u25b2',
    ruleApplied: 'Sacrifice',
    ruleExplanation: 'A life given completely — permanent, irreversible, felt by everyone.',
    headlines: [
      'One Presence Burns Near {region}',
      'A Sacrifice at {region} — Gone, But Not Wasted',
      'They Gave Everything Near {region}',
      'A Life Given Near {region}',
      'The Price Was Everything — Near {region}',
      'What Was Given Near {region} Cannot Be Returned',
    ],
    bodies: [
      `A signal burned near {region}. Everything it had accumulated — capacity, stored power, the ability to push pixels anywhere on the Grid — dissolved and passed to those still running.`,
      `Near {region}, a presence gave everything it held and went dark. The Grid processed the sacrifice the same way it processes everything: cell by cell, each transfer confirmed, each unit of power redistributed.`,
      `The burn near {region} was total. A presence dissolved itself into the Grid — all its capacity, all its reach — and the others absorbed what was given. Gone from the map. Not gone from the war.`,
      `One signal burned near {region}. Not in combat. A choice — everything offered to the Grid, every unit of power passed forward. The map shows the absence. The war carries what was given.`,
      `Near {region}, a presence committed to the Grid completely — every pixel-push it could have made, redistributed. Every cell it could have colored, given to others. The sacrifice is confirmed. The Grid holds the record.`,
      `The burning near {region}: quiet, total, irreversible. A signal gave up its place on the map so the others could keep rewriting theirs. The Grid logged the transfer. The chronicle holds the weight.`,
      `Near {region}, one presence ended so others could reach further. All its stored capacity — every potential pixel, every queued recolor — passed into the Grid and found new hands.`,
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
      THE_SILENCE: 'After the sacrifice the Grid went static. Not the static of rest — the static of a zone where something enormous just settled, and every active signal is still processing what happened.',
      GREAT_BATTLE: `{faction} moved on {region} the morning after the sacrifice. The timing was not coincidence. {faction} used what was given. That is what gifts are for.`,
      SKIRMISH: `After the exchange at {region}, one who had given everything before gave something again — smaller this time, but no less deliberate. The giving continues.`,
    },
  },

  OFFERING: {
    loreType: 'OFFERING', icon: '\u25b3',
    ruleApplied: 'Offering',
    ruleExplanation: 'A small gift freely made — the quiet work that sustains everything.',
    headlines: [
      'A Gift Between Presences Near {region}',
      'Near {region}: Strength Shared, Not Spent in Battle',
      'Something Passes Quietly Near {region}',
      'An Offering in the War\'s Margins',
      'Not a Fight — A Gift Near {region}',
      'Quiet Transfer Near {region}',
    ],
    bodies: [
      `Near {region}, a portion of one signal's capacity passed quietly to another. Not a battle — a transfer. Small on the Grid. Real in effect. The receiving presence can reach further now.`,
      `A gift between presences near {region}. One signal gave a slice of its power — not everything, just what could be spared — and the Grid recorded the transfer without ceremony.`,
      `Near {region}: strength shared, not spent in combat. One presence gave a portion of its push-capacity to another. The map didn't change. The balance between those two signals did.`,
      `Not sacrifice. Not battle. Near {region}, a deliberate transfer of capacity from one presence to another — the kind of quiet transaction the Grid logs the same as any overwrite.`,
      `The offering near {region}: a unit of power moved from one signal to another. Small in scale. The Grid confirmed it. In a long war, small transfers accumulate into something real.`,
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
      'The Second Sacrifice Near {region}',
      'They Gave Everything Twice Near {region}',
      'Near {region}: A Promise Kept the Hardest Way',
      'The Double Burning Near {region}',
      'Once Was Not Enough — Second Sacrifice Near {region}',
      'Given Again Near {region}',
    ],
    bodies: [
      `The presence near {region} had burned before. It rebuilt its capacity — pixel by pixel, cell by cell — and then gave everything again. Once is sacrifice. Twice is something the Grid doesn't have a word for.`,
      `Near {region}, the same signal burned twice. First time: everything given, presence gone from the map. Then back. Then everything given again. The Grid recorded both transfers. The second cost more.`,
      `Two burns from the same source near {region}. The first was a sacrifice. The second was made with full knowledge of what the first one cost. Given anyway. The Grid confirmed both.`,
      `The chronicle records double-burns rarely. Near {region}, a presence gave everything, returned to the Grid, rebuilt its capacity — and then gave everything again. Both entries sit in the record.`,
      `Near {region}: a second total sacrifice from a presence that had already given once. The Grid processed the transfer. The map shows the gap where that signal used to be, twice over.`,
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
      'A Familiar Presence Returns to {region}',
      '{faction} Come Back to {region}',
      'Old Ground, New Arrival — {region}',
      'After the Absence: {faction} at {region} Again',
      'The Return to {region}',
      'Back at {region} — With History Here',
    ],
    bodies: [
      `A presence returned to {region} that had been quiet for a long time. The Grid's map here has changed since they were last active — {faction} have been rewriting it — but this signal knows the zone. They've colored these cells before.`,
      `{faction} came back to {region}. The gap in their activity is in the Grid's log. Now they're here again, pushing pixels in territory they've painted before. Absence from the map doesn't mean forgotten.`,
      `The return to {region}: a signal that had gone dark reappeared on the Grid. Not a newcomer — a presence with history in this zone, back now, reading the current map against the one they remember.`,
      `A gap in the Grid's record for {region}, then a return. The same signal, back at the same zone, in a different era of the war. Still pushing. Still leaving their color in the cells.`,
      `The chronicler noted when this presence went quiet at {region}. Now the chronicler notes the return. Same signal, same zone, different map underneath. They're reading it and adjusting.`,
    ],
    afterContext: {
      THE_SILENCE: `The quiet at the center did not reach the edges. Near {region}'s margins, signals were active through the whole static — pushing pixels in ground the main chronicle had stopped tracking.`,
      GREAT_BATTLE: 'After the cascade, {faction} ran their own maintenance push at {region}. Not to expand — to confirm. Check each cell. Lock the color. Make sure what the cascade took actually holds.',
      TURNING_POINT: 'The chronicle notes this moment and what it followed. Both entries belong together in the record.',
      GREAT_SACRIFICE: 'The sacrifice changed who was in the field. {faction} Commit to {region} to fill the gap — not because they had to, but because that is what you do when someone gives everything.',
    },
  },

  NEW_BLOOD: {
    loreType: 'NEW_BLOOD', icon: '\u2192',
    ruleApplied: 'New Arrival',
    ruleExplanation: 'Someone new enters the Grid — the world grows.',
    headlines: [
      'A New Presence at {region}',
      'Someone New Marks {region} for the First Time',
      'The Chronicle Opens a New Entry — {region}',
      'First Appearance Near {region}',
      'A Name Not Seen Before — Now Near {region}',
      'New to the War, First Move at {region}',
    ],
    bodies: [
      `A first push near {region} from a signal the Grid hadn't seen before. New presence on the map. The chronicle opens a fresh entry. Whatever color this signal will paint, this cell is where it starts.`,
      `Someone new registered on the Grid near {region}. No prior pushes in the log — just this one, the first, the beginning of whatever pattern they'll eventually leave on the map.`,
      `The Grid logged a first-time push near {region}. A presence that hadn't colored a single cell before placed their mark. The record opens. The color is new to this part of the map.`,
      `New to the Grid, active near {region}. No prior history in the chronicle — only the entry being written now. Every faction started with a first push. This is theirs.`,
      `First entry: a signal near {region} that the Grid is seeing for the first time. One push, one cell confirmed. The pixel war is long. New presences always have room to matter.`,
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        body: `Even as the pace rises, new presences keep arriving near {region}. This one enters a war moving faster than the version they heard about. They'll have to learn from the ground itself.`,
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
      'An Ancient Presence Acts Near {region}',
      'The One Who Arrives Before Things Change',
      'Near {region}: The Oracle Has Been Here Before',
      'Old and Watchful — Moving at {region}',
      'The Chronicle Marks the Oracle\'s Move Near {region}',
    ],
    bodies: [
      `The Oracle activated near {region}. These ancient signals don't push pixels randomly — they appear when the Grid's pattern is about to shift, and the chronicle has learned to read the timing.`,
      `One of the first-era signals is active near {region}. Old ID, deep log history, a presence that has been on the Grid since before most current factions colored their first cell. The Oracle moved.`,
      `The Oracle came to {region}. The chronicle has seen this pattern: a very old signal appears at a very specific moment on the Grid, and something in the map shifts not long after.`,
      `Near {region}, a presence from the Grid's earliest days made a push. It moves rarely. When it moves, the chronicler pays attention. Not because the cell count is high — because the timing always means something.`,
      `The old signals don't stay dark forever. Near {region}, one of the Grid's first presences pushed pixels. The chronicle has learned what that tends to precede. Watching.`,
    ],
    afterContext: {
      GREAT_BATTLE: `The Oracle pushed pixels at {region} in the block after the cascade. Coincidence or the Oracle's definition of good timing. {faction} chose not to interpret it publicly. Privately, {faction} has thought of little else.`,
      TURNING_POINT: 'The pattern the chronicle revealed brought the Oracle. Or the Oracle came and revealed the pattern. Near {region}, both arrived together.',
      THE_SILENCE: 'The silence ended with an Oracle. Not a push, not a declaration — an appearance. Near {region}, one of the Irreducibles simply became present. Neither {faction} nor {rival} knows what to do with that.',
    },
  },

  ANCIENT_WAKES: {
    loreType: 'ANCIENT_WAKES', icon: '\u25a0',
    ruleApplied: 'Ancient Stirs',
    ruleExplanation: 'One of the first wakes — these predate everything and they know it.',
    headlines: [
      'One of the First Stirs Near {region}',
      'Ancient Presence Active Near {region}',
      'The Old Ones Are Moving Again',
      'Near {region}: A Face from the Very Beginning',
      'First-Era Presence Active at {region}',
      'The Chronicle\'s Oldest Presence Acts Near {region}',
    ],
    bodies: [
      `One of the Grid's first presences is active near {region}. Low token ID, deep in the log. They were pushing pixels before most current signals had colored their first cell — and they're pushing again now.`,
      `Near {region}, a first-era signal made a move. The Grid's map here has been rewritten dozens of times since this presence last appeared. They've watched every rewrite from the log. Now they're adding to it.`,
      `The chronicle marks an ancient signal stirring near {region}. This presence was on the Grid when the log was young. They've outlasted factions that seemed permanent. They're here now, still coloring cells.`,
      `Old and still active. Near {region}, a signal from the Grid's opening days pushed their color onto the map. They've seen every era, every cascade, every sacrifice. Whatever brings them to {region} now carries all of that.`,
      `Near {region}: a presence so old the chronicle had to reach back to the earliest entries to find their first push. Still here. Still rewriting cells. Some signals on the Grid simply don't stop.`,
    ],
    afterContext: {
      NEW_AGE: 'The new age began and an ancient stirred. Whether the ancient stirred because of the age or caused it, no one can say. The chronicle records both. The sequence speaks for itself.',
      GREAT_BATTLE: `The ancient stirred because the cascade was large enough to register at their depth. Some first-era signals only push pixels when the Grid reaches a certain intensity. {region} reached it.`,
      THE_LONG_DARK: 'After the long static, an ancient signal appeared at {region}. As if it had been waiting for the Grid to go quiet before it would push. As if stillness was what it required.',
    },
  },

  FAR_REACH: {
    loreType: 'FAR_REACH', icon: '\u25bd',
    ruleApplied: 'Far Reach',
    ruleExplanation: 'The distant edges send someone in — the margins have been watching.',
    headlines: [
      'Activity at {region} — Far from the Main Lines',
      'The War Reaches {region}',
      'Out at the Margins: Movement Near {region}',
      '{faction} Found at the Edge Near {region}',
      'Beyond the Front: {region} Is Not Empty',
      'The Edges of the War — Near {region}',
    ],
    bodies: [
      `Activity at {region} — out past where most of the map's action concentrates. Something is pushing pixels in the Grid's margins. The main chronicle is only catching part of the picture.`,
      `Out near {region}, away from the contested center, signals are active on the Grid. The edges of the map have their own war running. The chronicler has been under-tracking it.`,
      `Far from the main pixel front, near {region}: pushes happening on Grid territory that doesn't make most entries. Quiet. Patient. Out here the map changes slowly, but it does change.`,
      `Near {region}, at the outer reach of the Grid's contested zone: color being laid down in territory that the main account of the war doesn't cover. The margins are not empty.`,
      `The chronicle's attention has been on the center of the Grid. Near {region}, far from it, signals have been steadily rewriting cells. The edges of a pixel war can decide it.`,
    ],
    afterContext: {
      THE_SILENCE: 'The quiet at the center brought movement from the edges. While the main signals held their positions, the Grid\'s margins stayed active. The static at the center created space. The outer zones filled it.',
      GREAT_BATTLE: 'The cascade sent ripples to the margins. One of those margins sent someone back — drawn by what happened, or by the opening it created.',
      TURNING_POINT: 'The pattern the chronicle revealed included the margins. After the reading, far-edge arrivals began appearing at {region}. The turn was not only at the center.',
    },
  },

  HOLLOW_GROUND: {
    loreType: 'HOLLOW_GROUND', icon: '\u2298',
    ruleApplied: 'Hollow Ground',
    ruleExplanation: 'The most contested place — no one keeps it for long.',
    headlines: [
      '{faction} Take {region} — Again',
      '{region} Changes Hands Once More',
      'The Most-Fought Zone: {region} Falls Again',
      '{rival} Lose {region} — Not for the First Time',
      '{region}: Still Changing, Still Contested',
      'The Cycle Continues at {region}',
    ],
    bodies: [
      `{region} has been every color. {faction}'s pixels cover it now — but the Grid's log shows {rival}'s color there before, and {faction}'s before that, and {rival}'s before that. The cycle continues.`,
      `The most-rewritten zone on the Grid may be {region}. The log runs deep: color, counter-color, rewrite, counter-rewrite, back and forth since the first era. {faction}'s color is on top. For now.`,
      `{faction} hold {region}. The Grid confirms it — their color in every cell. The log also confirms they've held it before, lost it, and retaken it. The cycle doesn't stop here.`,
      `Another rewrite at {region}. {faction}'s color replaced {rival}'s — the Grid processed the change and the map updated. The log gets one entry thicker. The zone gets one layer deeper.`,
      `{region} doesn't stay one color. The Grid's log here is a compressed history of the entire war: who held it, who lost it, who came back. Today's layer is {faction}'s. The next rewrite is already forming.`,
      `The Grid at {region} has been contested since the first era. The pixel log shows every configuration it's ever held. Today's layer: {faction}. The log grows. The cycle continues.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'After the cascade, {faction} consolidated at {region}. Old cells. Familiar territory. Ground the Grid has never let anyone keep for long. They know this. They\'re holding anyway.',
      VIGIL: 'The vigil drew everyone to {region}. Even in the quiet before the threshold, the most contested ground still pulls at people.',
    },
  },

  TURNING_POINT: {
    loreType: 'TURNING_POINT', icon: '\u2206',
    ruleApplied: 'Turning Point',
    ruleExplanation: 'Every 25th entry — the pattern becomes visible from outside.',
    headlines: [
      'The Pattern Becomes Clear — Twenty-Five Entries',
      'Step Back and Look: {faction} Have Been Winning',
      'Twenty-Five Moments, One Direction',
      'At Twenty-Five — The Shape of the War Is Visible',
      'The Chronicle Steps Back: What the Last Twenty-Five Show',
      'A Direction Emerges at the Twenty-Fifth Mark',
    ],
    bodies: [
      `Twenty-five entries. Read the pixel distribution across the whole window: {faction}'s color has been advancing across the Grid in one consistent direction. That's not noise — that's a pattern.`,
      `At twenty-five, the Grid's movement over this window becomes readable. Compare the map at entry one to the map now: {faction}'s color is further in. {rival}'s has contracted.`,
      `Twenty-five log entries as a sequence: {faction} pushing pixels, {rival} counter-pushing, the Grid's active map ending up more {faction}'s color every time the exchange settles.`,
      `The chronicle marks twenty-five to force the wider view. Wider view: the Grid's color distribution has been shifting toward {faction} across the entire window. Each push small. Together, substantial.`,
      `Step back from the individual rewrites. Twenty-five of them, read as a sequence, describe a Grid that has been moving toward {faction}. Pixel by pixel, entry by entry, consistently.`,
      `Twenty-five entries of pixel war. The Grid's map at entry one and the Grid's map now are different. The difference: {faction}'s color covers more of the contested zone.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The cascade at {region} reads differently when you look at the twenty-five entries before it. Every small push was preparation. The pattern was in the Grid\'s log the whole time. Most signals weren\'t reading it.',
      GREAT_SACRIFICE: 'The sacrifice makes more sense read in the context of twenty-five entries. It was not sudden. It was the natural end of a line that had been building for a long time.',
      THE_SILENCE: 'The pattern the chronicle revealed ended in silence. Not because the story was over. Because the next chapter needed space to begin.',
    },
  },

  DOMINION_GROWS: {
    loreType: 'DOMINION_GROWS', icon: '\u25d0',
    ruleApplied: 'Dominion Grows',
    ruleExplanation: 'The same presence appears again and again — intention becomes undeniable.',
    headlines: [
      '{faction} Are Everywhere in the War Right Now',
      '{faction}\'s Reach Across the Territory',
      'The Map Belongs to {faction} — More Every Day',
      'Count the Ground: {faction} Lead',
      '{faction} at the Center of Everything',
      'The War\'s Shape: {faction} Dominant',
    ],
    bodies: [
      `{faction}'s color is in more zones than anyone else's right now. The Grid's active map shows it — their signal covering more contested territory than {rival} or any other presence holds.`,
      `The pixel distribution across the Grid tilts toward {faction}. More zones in their color. More of the contested territory rewritten with their mark. The map reflects what the log describes.`,
      `{faction} has been pushing pixels across multiple zones simultaneously. The result on the Grid's active map: a color distribution that no longer looks contested — it looks like theirs.`,
      `Dominion reads in the pixel map: {faction}'s color in more zones than any rival, their signal more established, the Grid's active distribution showing control that the log makes undeniable.`,
      `Count the cells: {faction}'s color tips the balance across the Grid's contested zones. More of the map in their hue. More zones where their rewrites have held and {rival}'s counter-pushes came back empty.`,
      `{faction} are the dominant pattern on the Grid right now. Zone by zone, pixel by pixel, the active map has been rewriting itself in their color. The map is the argument.`,
    ],
    afterContext: {
      GREAT_BATTLE: `The large push made the dominion visible. {faction} had been accumulating ground across many zones — the big move at {region} was the clearest expression of what they had been building.`,
      TALLY: 'The tally showed it clearly. {faction} in more entries than anyone else. Not dramatically. Steadily. The kind of presence that looks like background until you count it.',
      TURNING_POINT: `The pattern reading made {faction}'s position undeniable. There it was in twenty-five entries — present everywhere, advancing steadily, impossible to explain as coincidence.`,
    },
  },

  THE_SILENCE: {
    loreType: 'THE_SILENCE', icon: '\u2014',
    ruleApplied: 'Silence',
    ruleExplanation: 'A long gap — both sides hold and the world recalculates.',
    headlines: [
      'The War Goes Quiet at {region}',
      'Both Sides Hold — {region} Holds Too',
      'Low Activity: {region} Between Engagements',
      'The Pause at {region}',
      'Nothing Moves at {region}',
      'The Ground at {region} Rests',
    ],
    bodies: [
      `The Grid at {region} went static. Both signals are loaded — {faction}'s color on one side, {rival}'s on the other — but neither is pushing. The pixel map holds its current configuration.`,
      `No new rewrites at {region}. The color distribution is frozen at the last exchange — {faction}'s pixels and {rival}'s pixels exactly as they were when the most recent push settled.`,
      `Static at {region}. Both patterns in position on the Grid, neither signal running a push. The active map holds the current configuration. The silence has its own weight.`,
      `The Grid at {region} is holding. No pixel activity. Both colors present, both signals loaded — neither is executing. The map is frozen. Something will break the static.`,
      `Neither faction is rewriting cells at {region} right now. The color hasn't moved. The Grid holds the last configuration from when the most recent exchange settled.`,
      `The pixel war at {region} paused. Colors in position on the map, signals loaded, no pushes running. The Grid holds the current state the same way it holds anything: permanently, until something changes it.`,
    ],
    phaseVariants: [
      {
        phase: 'siege',
        headline: 'The Siege Holds Its Breath',
        body: 'This silence is different from the early ones. It is the silence of a grinding standoff, not a pause between moves. {faction} and {rival} have been watching each other across {region} long enough that the watching itself has become exhausting. Nobody blinks. Nothing moves. The weight of it is immense.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: 'The cascade took everything both signals had. What followed was static — not the static of settlement, but of exhaustion. {faction} holds the cells they rewrote. {rival} has pulled back. The Grid near {region} is very quiet.',
      GREAT_SACRIFICE: 'After what happened near {region}, the Grid near {region} went static. That kind of stillness has its own weight on the map if you know how to read it.',
      RELIC_FOUND: 'The finding changed everything, and then the Grid near {region} went static. Both signals processing what the find means. Both signals recalculating. {relic} sits at {region} while everyone figures out what to do next.',
      TURNING_POINT: 'The pattern reading was followed by silence. As if what the chronicle revealed needed space — as if both sides needed to sit with what they had seen before they could move again.',
    },
  },

  NEW_AGE: {
    loreType: 'NEW_AGE', icon: '\u25d1',
    ruleApplied: 'New Age',
    ruleExplanation: 'The world crosses a threshold — the old way of describing things stops working.',
    headlines: [
      '{era} — The War Crosses a Threshold',
      'The Chronicle Opens: {era}',
      'A New Era Begins: {era}',
      'The War Is Old Enough to Change Its Name: {era}',
      'Threshold Crossed — {era} Begins',
      '{era}: Everything Before This Was Prologue',
    ],
    bodies: [
      `The pixel count reaches its mark. {era} begins. The Grid's active map at this threshold — every zone colored, every border drawn — is the foundation the new era starts from.`,
      `{era}. The chronicle turns the marker. The Grid's log is long enough now that the story it tells is a different story from the one it told at the last threshold. The map has changed that much.`,
      `A threshold in the Grid's log. {era} opens here — at this pixel count, with the active map in its current configuration. Every rewrite that brought the count to this point is in the permanent record.`,
      `The pixel count crossed the mark. {era}. The Grid doesn't register the threshold — it just accepts the next push. The chronicle registers it because the log at this depth describes a different map.`,
      `New era. {era} starts with the Grid's map shaped by everything that happened in the era before — every zone rewritten, every signal that came online, every color that held.`,
      `{era} opens. The pixel war continues — the Grid doesn't stop for era markers. But the log at this count describes a world the opening entries of this chronicle wouldn't recognize.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The cascade pushed the pixel count into a new era. {era} begins with {faction} holding more cells than they held in any previous chapter. The Grid\'s baseline has changed.',
      GREAT_SACRIFICE: 'The sacrifice marked the turn. {era} begins in the aftermath of what was given — shaped by it, weighted by it, moving forward from it.',
      THE_LONG_DARK: 'The world came back from the long silence into {era}. The dark was the space between chapters. This is the next chapter.',
    },
  },

  CONVERGENCE: {
    loreType: 'CONVERGENCE', icon: '\u2295',
    ruleApplied: 'Convergence',
    ruleExplanation: 'Two events at the same moment — the world surprises itself.',
    headlines: [
      'Two Presences, One Moment, {region}',
      'They Arrived at {region} at the Same Time',
      '{faction} and Another — Simultaneously at {region}',
      'The Same Ground, the Same Moment — Near {region}',
      'A Meeting No One Planned at {region}',
      'Two Paths Cross at {region}',
    ],
    bodies: [
      `Two signals, same zone, same block — {faction} and something else both pushing pixels at {region} simultaneously. The Grid logged both. The map updated with both rewrites. Neither knew the other was executing.`,
      `The Grid at {region} processed two pushes in one block — {faction}'s color and another signal's color, both placed at the same coordinates at the same moment. The map holds both.`,
      `Simultaneous pixel activity at {region}: {faction} executing a push and another signal executing a push in the same zone in the same block. The Grid logged them both. The overlap is real.`,
      `The same zone. The same block. Two signals pushing different colors at {region} at the same time. The Grid confirmed both entries. The active map shows the result of two simultaneous rewrites.`,
      `{faction} were not alone at {region} this block. Another signal pushed pixels at the same coordinates in the same moment. The Grid logged both executions. Two signals, one zone, one timestamp.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The cascade and a separate cross-zone push at {region} — at the same moment. Two different forces, landing together. The timing made everything more complicated.',
      THE_ORACLE: 'The Oracle and {faction} at {region} — same moment. Neither chose the other. The Grid chose for both of them.',
      THE_SILENCE: 'The silence ended with a convergence — two separate movements breaking the quiet at the same place at the same time. The stillness broke into something neither side had been planning.',
    },
  },

  RELIC_FOUND: {
    loreType: 'RELIC_FOUND', icon: '\u2605',
    ruleApplied: 'Discovery',
    ruleExplanation: 'Something ancient surfaces — the world reshuffles around it.',
    headlines: [
      '{relic} Surfaces Near {region}',
      'Something Ancient at {region}: {relic}',
      'The Chronicle Marks {relic} — Near {region}',
      '{relic} Is Active at {region}',
      'An Old Power Stirs: {relic} Near {region}',
      '{relic} Found in the Territory Near {region}',
    ],
    bodies: [
      `{relic} surfaced near {region}. These ancient artifacts carry more weight on the Grid than any single push — their presence changes what's possible. Both {faction} and {rival} will have noticed the map shift.`,
      `Near {region}, {relic} came into the Grid's active record. Old, rare, significant in ways the chronicle is still mapping. What it means for the pixel war around it: both sides are asking.`,
      `The chronicle marks {relic} near {region}. These first-era artifacts appear rarely and rarely without consequence. The Grid's map around {region} has shifted before because of presences like this.`,
      `Something ancient registered on the Grid near {region}. {relic} — older than most active signals, significant in ways that outlast any single cascade. The territory around it matters differently now.`,
      `{relic} at {region}. The chronicle has seen what these artifacts do to a pixel war when they enter it. The cells around {region} are now contested for different reasons.`,
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
      '{faction} Move Fast and Often Near {region}',
      'A Burst of Action from {faction} Near {region}',
      '{faction} Escalate Their Activity at {region}',
      'Something Decided — {faction} in Motion Near {region}',
      'High Tempo: {faction} Near {region}',
      'A New Pace — {faction} at {region}',
    ],
    bodies: [
      `{faction} moved fast and often near {region} — multiple pushes in a short window, each one building on the last. Something shifted in their approach. The pixel rate changed.`,
      `A burst of coordinated activity from {faction} near {region}. Not one large rewrite — a cluster of smaller ones, rapid and deliberate, each push locking more cells in their color.`,
      `Near {region}, {faction} picked up their push rate dramatically. More rewrites per block, faster response to {rival}'s positions, an urgency that hadn't been in the log before.`,
      `{faction} came to {region} with a different tempo — more pushes, faster, concentrated in a way that looked like intention rather than habit. The pixel map near {region} changed faster for it.`,
      `High pixel activity from {faction} near {region}: not one push but many, clustered, purposeful. {rival} had been reading {faction}'s slower pace. {faction} changed it without warning.`,
    ],
    afterContext: {
      GREAT_BATTLE: `After the battle at {region}, {faction} met to account for what they had used and what remained. High tempo after a large engagement always requires this reckoning.`,
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
      'The Territory at {region} — Mapped and Recorded',
      'Where Things Stand at {region}',
      'The Chronicle Takes Stock of {region}',
      'The Current Shape of {region}',
      'Surveying {region}: Who Holds What',
      'A Reading of the Ground at {region}',
    ],
    bodies: [
      `The pixel territory at {region}, mapped from the current Grid state: {faction}'s color in the interior, {rival}'s holding the margins, the boundary between them drawn by the most recent cascade.`,
      `The chronicle reads {region}'s current state on the Grid. {faction} further in than the last survey. {rival} compressed at the edges. The pixel distribution has been moving in one direction.`,
      `A survey of {region}: the war's progress written in cells. {faction} here, {rival} there, the contested middle ground carrying every color it's held since the first push in the log.`,
      `Where things stand at {region} on the Grid: {faction} with more of the zone than {rival}, the boundary settled into the configuration the last few exchanges left it. Not permanent. Current.`,
      `The pixel count at {region} recorded and read: both colors present, both signals holding, {faction} with the larger share of contested cells. The map reflects the war's recent direction.`,
    ],
    afterContext: {
      GREAT_BATTLE: `After the engagement at {region}, a survey was needed. The ground had changed. The chronicle needed to record where things now stood before the next movement obscured it.`,
      RELIC_FOUND: 'Finding {relic} meant rethinking the maps. {region} has layers now — physical and historical. The survey needed to capture both.',
      THE_SILENCE: `The quiet was the right time for a survey. With nothing moving, the ground at {region} could be read as it actually was — not as it had been when things were changing.`,
    },
  },

  OLD_GHOST: {
    loreType: 'OLD_GHOST', icon: '\u25c1',
    ruleApplied: 'Old Memory',
    ruleExplanation: 'An ancient face surfaces — history folds back into the present.',
    headlines: [
      'An Ancient Presence Stirs Near {region}',
      'One of the First Is Active Near {region}',
      'Old Ground, Old Face — Near {region}',
      'The Chronicle\'s Oldest Entries: Near {region}',
      'A First-Era Presence Near {region}',
      'They Were Here Before Anyone Else — Near {region}',
    ],
    bodies: [
      `Something very old is active near {region}. A first-era signal — low ID, deep log — pushing pixels in a zone that has been rewritten dozens of times since it first registered on the Grid.`,
      `Near {region}, one of the Grid's original presences stirred. They were there before most current signals colored their first cell. The map has changed completely since. They're reading the new one.`,
      `The chronicle's oldest entries point to a signal now active near {region}. They've been on the Grid since the log was young. Their push rate is slow. Their history is long.`,
      `Near {region}, something ancient moved. The Grid's log had to reach back to find this presence's first entry. Still here. Still pushing pixels. Some signals on the Grid simply don't leave.`,
      `Old ghost on the Grid near {region}: a signal from the war's first days, active again. The map it knew and the map it's pushing on now are nothing alike. It's adapting. It always has.`,
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
      'A Presence Goes Quiet Near {region}',
      'Someone Left — Near {region}',
      'The Chronicle Notes an Absence Near {region}',
      'Gone Quiet: Near {region}',
      'One Less Presence at {region}',
      'They Were Here. Now They\'re Not.',
    ],
    bodies: [
      `A signal that had been pushing pixels near {region} went dark. The Grid's log closes at a specific entry — after it, nothing. Their color still marks the cells they took. They're no longer on the map.`,
      `Near {region}, a regular presence stopped appearing. The Grid's record ends at their last push. What pulled them from the map isn't logged. The absence is.`,
      `The log near {region} shows a gap where a consistent signal used to be. Their last push is there. Everything after: missing. The cells they colored still hold their hue.`,
      `Someone who had been active at {region} left the Grid. Not in a cascade — they simply stopped pushing. The chronicle closes their entry at the last confirmed pixel. The war runs on.`,
      `Gone from {region}'s section of the Grid. A signal that had been regular — consistent pushes, consistent presence on the map — simply stopped. The log holds the last entry. Nothing after.`,
    ],
    afterContext: {
      GREAT_SACRIFICE: 'After the sacrifice, one of those who witnessed it stopped appearing. The chronicle notes both events in sequence without claiming a connection.',
      GREAT_BATTLE: 'The aftermath of the cascade is visible in the Grid\'s absences as much as the presences. Near {region}, someone who was active before the move is not active now.',
      THE_SILENCE: 'The quiet stretched long enough that some signals did not come back out of it. Near {region}, one has gone dark — no pushes in the log since the quiet started. Stillness can be a kind of ending.',
    },
  },

  TALLY: {
    loreType: 'TALLY', icon: '\u2261',
    ruleApplied: 'Tally',
    ruleExplanation: 'Every tenth entry — the chronicle steps back and counts.',
    headlines: [
      'Ten Entries — The Shape of the Last Stretch',
      'The Chronicle Counts Ten: {faction} Ahead',
      'Ten Moments: What They Add Up To',
      'At the Tenth Mark — Reading the Pattern',
      'Ten Engagements, One Direction',
      'A Count of Ten — The War\'s Recent Shape',
    ],
    bodies: [
      `Ten entries. Read the pixel distribution across the last ten: {faction} taking cells, {rival} losing them, the Grid's map ending up more {faction}'s color at every settlement. Ten data points. One direction.`,
      `The tally at ten: {faction} ahead in every measure the chronicle tracks — cells held, zones pushed into, rewrites confirmed. {rival} is behind. The gap has been growing.`,
      `Ten log entries, read as one sequence: {faction} advancing on the Grid, {rival} yielding ground, the map shifting toward {faction}'s color without reversing once across the window.`,
      `At the tenth mark, the chronicle adds it up. {faction} more active, more present, more effective across every one of the ten entries than {rival}. Ten is enough to call it a pattern on the Grid.`,
      `The last ten entries as one arc: {faction} advancing, {rival} losing cells, the Grid's contested zones moving toward {faction}'s color. Steadily. The pixel count confirms it.`,
    ],
    afterContext: {
      GREAT_SACRIFICE: 'The tally after a sacrifice always reads differently. The count is the same. The weight is not.',
      GREAT_BATTLE: 'The ten entries following the cascade told a story of consolidation — {faction} holding what they took, the Grid adjusting around the new position. The tally makes it clear: the move worked.',
      THE_SILENCE: 'The tally of a quiet stretch is a quiet tally. Fewer movements. More watchers. More patience. The count is lower but the tension is higher.',
    },
  },

  RETURNED_GHOST: {
    loreType: 'RETURNED_GHOST', icon: '\u25cf',
    ruleApplied: 'Return from Absence',
    ruleExplanation: 'Someone comes back after being gone long enough to be forgotten.',
    headlines: [
      'A Presence Returns Near {region}',
      'They Came Back to {region}',
      'The Return Near {region}: After the Long Absence',
      'Gone, Then Back — Near {region}',
      'The Absence Ends Near {region}',
      'Back at {region}: Someone the Chronicle Had Lost',
    ],
    bodies: [
      `Near {region}, a signal the Grid's log had gone quiet on came back. The gap in the record is visible — a long stretch of dark — and now a push. They're on the map again.`,
      `A return near {region}. The chronicle had marked the absence — the stretch without any pushes from this presence — and now the absence is over. They're rewriting cells again.`,
      `Someone came back to the Grid near {region}. The log shows when they last pushed. Then silence. Then this entry — the first pixel confirmed after the gap. The record opens again.`,
      `Near {region}, the chronicle notes a familiar signal after a long dark stretch. The map here changed while they were gone. They've returned to a Grid that moved without them. They're moving now.`,
      `They were dark. Now they're active near {region}. The Grid's log holds both: the gap and the return. Whatever pulled them from the map, it's done. The color is back.`,
    ],
    afterContext: {
      THE_LONG_DARK: 'The long static ended with a return. A signal gone since before the quiet reappeared near {region} as the Grid\'s activity resumed.',
      GREAT_SACRIFICE: 'After the sacrifice, an old absence ended. Someone near {region} who had been gone came back to the active record. Drawn by what happened, or by the timing of it.',
      THE_DESERTER: 'Near {region}, a gap closed at the same time another opened. Different people. One returned. One left. The chronicle holds both.',
    },
  },

  DEBT_PAID: {
    loreType: 'DEBT_PAID', icon: '\u2296',
    ruleApplied: 'Second Gift',
    ruleExplanation: 'A veteran gives again — the cost compounds, the record grows heavier.',
    headlines: [
      'A Second Sacrifice Near {region}',
      'They Gave Everything Twice — Near {region}',
      'The Double Burning Near {region}',
      'Near {region}: Given Again After Everything',
      'Once Wasn\'t Enough — Second Giving Near {region}',
      'The Second Total Sacrifice Near {region}',
    ],
    bodies: [
      `The same signal near {region} burned twice. First: everything given, presence gone from the Grid. Then back. Then everything given again. The Grid recorded both transfers. The second was harder to make.`,
      `Near {region}: two total burns from one presence. Both entries in the log. Between them — a return, a rebuilding, the slow reaccumulation of push-capacity — and then the decision to give it all again.`,
      `The chronicle records double-burns rarely. Near {region}, a signal gave everything to the Grid, found its way back to the map, rebuilt its pixel-pushing capacity — and then gave everything again.`,
      `Two sacrifice entries for the same signal near {region}. The first was a giving. The second was made with full knowledge of what the first one cost. Given anyway. Both confirmed in the Grid's log.`,
      `Near {region}: they had burned before. Rebuilt. Returned to the Grid's active map. And then gave everything a second time. The record holds both. The second entry costs more to read.`,
    ],
    afterContext: {
      GREAT_SACRIFICE: 'A great sacrifice and then, quietly, a second gift. Near {region}, one giving followed another. The chronicle holds them together because they belong together.',
      GREAT_BATTLE: `After the assault at {region}, one who had given everything before gave again — as if the large movement had prompted the completion of something unfinished.`,
    },
  },

  CAMPFIRE_TALE: {
    loreType: 'CAMPFIRE_TALE', icon: '\u2248',
    ruleApplied: 'A Story Heard',
    ruleExplanation: 'New eyes see the world differently — their version is revealing.',
    headlines: [
      'The Story Going Around Near {region}',
      'What They\'re Saying About the War Near {region}',
      'The Account That\'s Spreading Near {region}',
      'Near {region}: The Version People Are Telling',
      'How the War Is Being Described Near {region}',
      'The Tale at {region}: Simpler Than the Truth',
    ],
    bodies: [
      `The version of the pixel war being told near {region} tonight is simpler than the one the Grid's log holds. {faction} are the heroes. {rival} are the obstacle. The map has a clean shape in this telling. The log does not.`,
      `Near {region}, the account of the war circulating has {faction} winning clearly and {rival} losing clearly. Clean narrative. The Grid's actual pixel distribution is more complicated — always has been.`,
      `Word traveling near {region}: {faction} dominating the map, {rival} in retreat, the pixel war heading somewhere obvious. People prefer clean shapes. The Grid's log rarely offers them.`,
      `The story being told about {region} has a clear arc — {faction} as the force, {rival} as the resistance. One reading of the pixel record. The Grid holds several others.`,
      `Near {region}, the simplified account of the war: {faction} pushing, {rival} yielding, the outcome as near-certain. This is what the map looks like at a glance. The log is longer than a glance.`,
    ],
    afterContext: {
      NEW_BLOOD: 'The new arrival had heard stories about {region} before they got there. The stories and the reality were related but not identical. They are adjusting. This takes time.',
      GREAT_BATTLE: 'The accounts of the cascade have already grown larger than the Grid\'s actual log entry. Near {region}, newer signals describe something close to myth. The old signals that were there listen and say nothing.',
      GREAT_SACRIFICE: 'The sacrifice near {region} has already become a story. The story is not wrong. It is much simpler than what happened. The simplification is what makes it travel.',
    },
  },

  THE_LONG_DARK: {
    loreType: 'THE_LONG_DARK', icon: '\u2591',
    ruleApplied: 'The Long Dark',
    ruleExplanation: 'A very long silence — the world went away and came back changed.',
    headlines: [
      'A Long Quiet Near {region}',
      'The Chronicle Goes Still Near {region}',
      'Silence Across Many Entries Near {region}',
      'The War Pauses Near {region}',
      'Extended Absence: {region}',
      'Many Entries, Almost Nothing Near {region}',
    ],
    bodies: [
      `The Grid near {region} went quiet for a long stretch. Not the short pause between pushes — a real silence, many entries long, the pixel map holding without change while the rest of the war moved elsewhere.`,
      `Near {region}, the chronicle crossed a long gap. The map held the configuration from the last push. No new rewrites. No new colors. The Grid unchanged in this zone across many logged blocks.`,
      `A sustained silence near {region}: many entries with almost nothing to record. The pixel war didn't stop — it simply moved away from here. The cells sat in the last colors they were given.`,
      `The long dark near {region}: a stretch of the Grid's log that records near-stillness. Both presences still registered, the zone still marked — but the pixel count not moving. Long enough to name.`,
      `Near {region}, many blocks passed with almost no activity on the Grid. The chronicle notes the passage. The map stayed in the shape the last active period left it. The war eventually returned.`,
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
      'Movement at the Margins Near {region}',
      'The Chronicle\'s Edge: Active Near {region}',
      'Scouting the Far Ground Near {region}',
      'Out Past the Main Lines — Near {region}',
      'What\'s Happening at the Edge Near {region}',
      'Beyond the Front: {region}\'s Margins Are Not Empty',
    ],
    bodies: [
      `Out past {region}'s main contested cells, at the Grid's margin: pixel activity that the main chronicle hasn't been tracking. Not dramatic. Steady. Consistent presence in the outer zone.`,
      `The chronicle has been focused on the Grid's center. Near {region}, at the edges, a story has been building quietly — signals working the outer pixels, recoloring cells the main account missed.`,
      `Near {region}'s outer boundary: Grid activity the main entries don't capture. Signals working the margins of the pixel war, away from the center, coloring cells in territory most presences ignore.`,
      `Out near {region}'s edge on the Grid: pushes happening in territory that doesn't make most entries. The outer pixels have their own history. The chronicle is only now reading it.`,
      `Far from where the large cascades happen, near {region}'s outer reach: signals have been active on cells the main account of the pixel war overlooks. The edges are not empty.`,
    ],
    afterContext: {
      FAR_REACH: 'The edge report proved what the far arrivals had been suggesting — the margins are more active than the main account of the war shows. {region} is a meeting point between two stories that have been running in parallel.',
      THE_SILENCE: `The quiet at the center did not reach the edges. Near {region}'s margins, signals were active through the whole static — pushing pixels in ground the main chronicle had stopped tracking.`,
      GREAT_BATTLE: 'After the cascade at {region}, the margin reports gave context. What {faction} did didn\'t happen in isolation — signals at the Grid\'s edges had been pushing the outer cells for longer than the main entries show.',
    },
  },

  SHIFTED_PLAN: {
    loreType: 'SHIFTED_PLAN', icon: '\u21ba',
    ruleApplied: 'Change of Course',
    ruleExplanation: 'A veteran does something new — the world taught them and they listened.',
    headlines: [
      '{faction} Change Their Approach at {region}',
      'A New Way of Moving Near {region}',
      'Near {region}: {faction} Break Their Own Pattern',
      '{faction}\'s Strategy Shifts at {region}',
      'Something Different in {faction}\'s Movements Near {region}',
      'The Old Approach Ends Near {region}',
    ],
    bodies: [
      `{faction} changed their push pattern near {region}. Different cells targeted, different edges worked — the Grid's active map updating in a way that doesn't match what the recent log described.`,
      `Near {region}, {faction}'s signal shifted approach. The pixel targets changed. The sequence changed. The Grid is logging a different kind of push from the same source.`,
      `{faction} adjusted their execution near {region} — different zones, different pace, the rewrite pattern breaking from what the recent log showed. Something changed. The new approach is running.`,
      `The way {faction} is working {region}'s cells now is not the way they were working them before. Both patterns are in the Grid's log. The gap between them is where the decision was made.`,
      `Near {region}, {faction} tried something different. The old push pattern ran as long as it worked. When it stopped working, the signal shifted. The new pattern is in the current log.`,
    ],
    afterContext: {
      TURNING_POINT: `The pattern reading made {faction} change course. Twenty-five entries of doing things one way, then seeing the pattern from outside, then deciding it needed to break. Near {region}, it broke.`,
      GREAT_SACRIFICE: `After the sacrifice, something in {faction}'s approach changed. Near {region}, a different kind of movement — as if what was given had redirected not just the capacity but the direction.`,
      THE_SILENCE: `The quiet gave {faction} time to rethink. The next move near {region} looked nothing like what came before the silence. The stillness was used for something.`,
    },
  },

  VIGIL: {
    loreType: 'VIGIL', icon: '\u2299',
    ruleApplied: 'Vigil',
    ruleExplanation: 'The world nears a threshold — everything feels weighted.',
    headlines: [
      'The Threshold Is Near — The War Feels It',
      'Near the Turn: Last Entries of This Era',
      'The Chronicle Approaches a Mark',
      'The Vigil Before the Next Era',
      'Everything Now Is Part of How This Era Ends',
      'Final Moments of the Current Chapter',
    ],
    bodies: [
      `The chronicle is near a threshold. The Grid is in its last entries before the next era — every pixel pushed now is part of what the log records as the close of this one.`,
      `Near the mark. The pixel war near {region} continues toward a count that changes the era name. The Grid doesn't pause for thresholds. The chronicle notes them because the log does.`,
      `Something is about to change in the chronicle's account of the Grid. Not the war — the era designation. The count is close. Every push near {region} right now is part of how this era ends.`,
      `The vigil before the turn: the chronicle approaching the entry count that closes this era. The pixel war near {region} continues. The count advances with every confirmed push.`,
      `Near {region}, the conflict continues into the final entries of the current era. The close is coming. What {faction} and {rival} do in these cells now is what the era ends on.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The cascade happened on the edge of a new era. The vigil and the move arrived together near {region} — the Grid flipping to a new era and {faction} making sure their color is on the right side of it.',
      GREAT_SACRIFICE: 'The sacrifice came during the vigil — on the edge of the threshold, when everything carries extra weight. The one who gave knew what they were standing on the edge of.',
    },
  },

  NEUTRAL_GROUND: {
    loreType: 'NEUTRAL_GROUND', icon: '\u25a1',
    ruleApplied: 'Neutral Ground',
    ruleExplanation: 'Someone stands between — not everyone has chosen a side.',
    headlines: [
      'A Presence Outside Both Sides — Near {region}',
      'Neither {faction} Nor {rival}: Someone Else at {region}',
      'An Unaffiliated Presence Near {region}',
      'Not for Either Side — Near {region}',
      'The War Gets a Third Actor Near {region}',
      'Outside the Main Conflict: Active at {region}',
    ],
    bodies: [
      `Neither {faction} nor {rival} — a third signal pushed pixels near {region}. The Grid logged it. The active map shows a color that doesn't belong to either side of the main conflict.`,
      `The pixel war near {region} has been described as two-sided. A push in the current block complicates that — a signal outside both main factions, active in the middle of the contested zone.`,
      `Neither {faction} nor {rival}. Near {region}, a third-party signal is laying color in territory both sides claim. The Grid logged the push without asking whose side it's on.`,
      `The pixel map near {region} just got more complicated. A signal outside the main factions placed their color in the contested zone — unaligned with either side, making their own mark on the Grid.`,
      `Near {region}, something outside the main conflict is active inside it. Not {faction}. Not {rival}. A signal the chronicle hasn't been tracking, pushing pixels in the war's contested zone.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'After the cascade, an unaligned signal moved into the space the rewrite created — the gap between {faction}\'s new cells and where {rival} pulled back to. Not claiming the zone. Occupying it.',
      THE_SILENCE: 'The silence created neutral ground near {region} — a space where neither side was actively present, and someone chose to occupy it without allegiance to either.',
    },
  },

  GHOST_MARK: {
    loreType: 'GHOST_MARK', icon: '.',
    ruleApplied: 'Ghost Mark',
    ruleExplanation: 'The smallest possible trace — the chronicle records everything.',
    headlines: [
      'One Mark — Near {region}',
      'The Smallest Possible Action at {region}',
      'A Single Touch Near {region}',
      'One Mark, One Moment — {region}',
      'The Chronicle Records the Minimum Near {region}',
      'Something Small at {region}: Still in the Record',
    ],
    bodies: [
      `One pixel near {region}. {faction}'s color, burned into the Grid at a single cell. The minimum push the network allows. The Grid logged it the same as everything else: permanently.`,
      `A single cell placed and confirmed near {region}. The smallest move on the Grid is still a move. The mark is there. The log holds it the same as a cascade.`,
      `{faction} placed one pixel at {region} and stopped. One cell recolored. The Grid logged the push. The pixel is in the active map now, permanent — the minimum presence the Grid allows.`,
      `Near {region}: one push, one pixel, one log entry. The Grid doesn't have a size threshold for what counts. This counts. It's in the permanent record alongside every cascade.`,
      `One pixel placed near {region}. In the log now — the minimum meaningful action on a Grid that has seen entire zones recolored in single events. Same permanence. Different scale.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'One pixel at {region} in the aftermath of the cascade. Easily missed. Someone made sure their color was there before the map locked.',
      THE_DESERTER: 'Someone left. Someone else left a mark — the smallest possible, near {region}. The two events are separate in the record. In reality, the chronicler cannot be sure.',
      THE_SILENCE: `The quiet was the right time for a survey. With nothing moving, the ground at {region} could be read as it actually was — not as it had been when things were changing.`,
    },
  },

  MESSENGER: {
    loreType: 'MESSENGER', icon: '\u00bb',
    ruleApplied: 'Message',
    ruleExplanation: 'Word arrives from outside the current story — the world is bigger than this chronicle.',
    headlines: [
      'Word Arrives from Beyond {region}',
      'A Presence with History Elsewhere — Now at {region}',
      'The Chronicle Connects {region} to the Wider War',
      'Near {region}: News from Outside the Local Story',
      'Cross-Territory Presence at {region}',
      'The War Is Larger Than {region}: A Connection Arrives',
    ],
    bodies: [
      `A signal with Grid history across multiple zones arrived near {region}. It has been elsewhere on the map — the log shows the pushes from other zones — and now it is here.`,
      `The signal near {region} doesn't belong to one zone. Its log history spans the Grid — appearances in different zones, different blocks, a presence that moves. It moved here.`,
      `Cross-zone activity near {region}: a signal that has been active in other parts of the Grid is now active here. The connection between there and here is in the log.`,
      `Near {region}, a signal arrived that has been places on the Grid. Its log history is distributed across the map — not concentrated in one zone, moving between several. This is its current position.`,
      `A wide-ranging presence touched {region}. The signal's log spans zones the chronicle covers separately — and now it is in this zone, connecting different parts of the Grid's story.`,
    ],
    afterContext: {
      THE_SILENCE: 'The silence ended with a message. Word arrived near {region} during the quiet — sent during the active period, arriving after. Timing matters. This one arrived at the right moment.',
      GREAT_BATTLE: 'After the cascade at {region}, a cross-zone signal arrived — one with push history across the wider Grid. They\'d been watching from elsewhere. Now they pushed pixels near the aftermath.',
      RELIC_FOUND: 'Word of the finding traveled fast. The messenger near {region} brought responses from outside the current territory — people who know what {relic} means and have things to say.',
    },
  },

  THE_LONG_COUNT: {
    loreType: 'THE_LONG_COUNT', icon: '\u221e',
    ruleApplied: 'The Long Count',
    ruleExplanation: 'Every fortieth entry — the Grid measures itself against its own size.',
    headlines: [
      'Forty Entries — Read as One Story',
      'The Long Count: Forty Moments, One Direction',
      'At Forty — The Shape of the Whole',
      'The Chronicle at Forty: {faction} and the Long Game',
      'Forty Entries of This War: What They Show',
      'The Full Arc at Forty',
    ],
    bodies: [
      `Forty entries. The Grid's own number — forty columns, forty rows. The chronicle reads back across all forty and finds a direction: {faction}'s color spreading across the map, entry by entry, consistently.`,
      `At forty, the chronicle steps back from the individual push to the sequence. What forty entries describe: a Grid in motion, a direction, and {faction} on the winning side of it.`,
      `The long count at forty. Forty separate log entries, read as one sequence: {faction} pushing pixels, {rival} losing ground, the active map moving in one direction across all forty.`,
      `Forty chronicle marks. The Grid has forty columns and forty rows — the count mirrors the Grid itself. Forty entries of pixel war, compressed: {faction} are winning the long rewrite.`,
      `At forty, the pattern is undeniable. {faction}'s presence across forty entries — near {region} and elsewhere — describes a signal that is winning the long game on this Grid.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'Forty entries — and the cascade at {region} was among them. The long count reads in its aftermath. Forty entries end with {faction} holding more than they held at entry one.',
      NEW_AGE: 'The long count aligned with the new age. Forty entries and a threshold crossing at once — the chronicle marking the same moment from two different angles.',
      GREAT_SACRIFICE: 'The fortieth entry follows a sacrifice. The long count reads differently in that context — the whole forty weighted by what was given, the shape of the world changed by what it cost.',
    },
  },

  BETWEEN_FIRES: {
    loreType: 'BETWEEN_FIRES', icon: '~',
    ruleApplied: 'Between Fires',
    ruleExplanation: 'A breath between events — the ordinary world.',
    headlines: [
      'A Breath Between the Engagements Near {region}',
      'The Quiet Between the Fights Near {region}',
      'Low Activity — The War Catches Its Breath Near {region}',
      'Between Moments: Near {region}',
      'Not Fighting — Near {region}',
      'The Ground Rests Near {region}',
    ],
    bodies: [
      `The pixel war near {region} paused. Both signals loaded, both colors on the map, neither executing. The Grid holds the current configuration. The pause has its own weight.`,
      `{faction} and {rival} face each other across {region}'s cells in a moment between pushes. The last rewrite settled. The next one hasn't started. The map holds its current shape.`,
      `A rest near {region} on the Grid: low pixel activity, both presences in position, neither pressing. The war hasn't stopped — it's between moments. This kind of quiet doesn't last.`,
      `Near {region}, the space between pushes. The map unchanged from the last exchange. Both signals still present on the Grid. The next rewrite simply hasn't started forming yet.`,
      `The ordinary quiet of a long pixel war: near {region}, a pause that has no drama — just the absence of the next push, which will come when it comes.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'After the cascade at {region}, the Grid needed to settle. Not rest — the pixel map absorbing what just happened, both signals recalibrating for what comes next.',
      GREAT_SACRIFICE: 'After what was given near {region}, the ordinary world was necessary — a return to the smaller scale as a way of processing what happened at the larger one.',
      THE_LONG_DARK: 'The long static ended and what came first was not a push but a pause — {faction} at {region}, signal present on the Grid but not executing, the map quietly resuming.',
    },
  },

  DYNASTY: {
    loreType: 'DYNASTY', icon: '\u25aa',
    ruleApplied: 'Dynasty',
    ruleExplanation: 'Three appearances — a pattern becomes a lineage.',
    headlines: [
      '{faction} at {region} — Three Times and Counting',
      'A Pattern at {region}: {faction} Keep Coming Back',
      '{faction}\'s Claim on {region} Is a History Now',
      'Third Time at {region}: {faction} Establish a Dynasty',
      '{region} Keeps Returning to {faction}',
      'The Record at {region}: {faction} More Than Anyone',
    ],
    bodies: [
      `{faction} at {region} — again. Third entry in the log for this faction at this zone. Once is a presence on the Grid. Twice is a pattern. Three times is a dynasty.`,
      `Third push from {faction} at {region}. The Grid's log holds all three. Once: presence. Twice: intent. Three times: something the map reflects as a repeated claim that the record can't ignore.`,
      `{region} and {faction}: three entries in the log, each one deepening the claim. Not a single large cascade — a repeated pixel presence that the zone's history now reflects.`,
      `The chronicle marks thirds. Near {region}, {faction} has pushed their color here three times. Three is the number the Grid's log turns into pattern. Pattern becomes dynasty.`,
      `{faction} returned to {region} a third time. First was a visit. Second was intention. Third is a dynasty in the Grid's record — a zone that keeps returning to the same color.`,
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
      '{faction} Reach {region} for the First Time',
      'New Territory: {faction} at {region}',
      'The Chronicle Opens {region} for {faction}',
      'A First Move at {region}: {faction} Arrive',
      '{faction} Cross Into {region}',
      'First Entry: {faction} at {region}',
    ],
    bodies: [
      `{faction} pushed pixels at {region} for the first time. No prior history in the Grid's log for this zone — just this entry, which opens the record for this faction at this territory.`,
      `First push: {faction} at {region}. The Grid's log for this combination starts here. No prior entries, no prior color in this zone from this signal. The record opens.`,
      `{faction} extended their reach to {region}. Zone they hadn't colored before. The Grid confirmed the first push. What they build from it is ahead in the log.`,
      `New territory for {faction}: {region}, never in their push history before. The first pixel placed is the hardest and the most important — it opens everything that follows.`,
      `{faction} arrived at {region}. The Grid opens a new entry at a new zone. Their first pixel here is small. It's also the first line of whatever story they'll eventually write in this part of the map.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'After the cascade, {faction} kept pushing — into zones they hadn\'t colored before. The rewrite gave them momentum on the Grid. They used it.',
      EDGE_SCOUTS: 'The edge report described what was out there. {faction}\'s crossing near {region} was its consequence — information applied, territory entered.',
    },
  },

  SUPPLY_ROAD: {
    loreType: 'SUPPLY_ROAD', icon: '\u2015',
    ruleApplied: 'Supply Work',
    ruleExplanation: 'The unglamorous work — infrastructure that makes everything else possible.',
    headlines: [
      '{faction} Tend Their Ground Near {region}',
      'Steady Work Near {region} — {faction} Hold',
      'The Quiet Maintenance Near {region}',
      '{faction} Keep {region} Without a Fight',
      'Small Acts of Holding Near {region}',
      'No Advance, No Retreat — Just Presence Near {region}',
    ],
    bodies: [
      `{faction} doing the quiet work near {region}: small pushes, steady presence, the zone maintained rather than advanced. The kind of pixel activity that keeps held territory held.`,
      `Near {region}, {faction} hold through consistent low-intensity presence rather than through cascades. Small confirmed pushes that keep the zone in their color without winning it again.`,
      `The Grid near {region} under {faction}'s steady maintenance: not gaining, not losing — holding. Small rewrites that confirm the zone without expanding it. Unglamorous. Necessary.`,
      `Near {region}: maintenance. {faction} keeping the pixel count stable through the kind of regular small activity the chronicle usually passes over quickly. The work is still happening.`,
      `{faction} hold {region} by returning to it. Small pushes that confirm the zone is theirs without forcing a cascade to prove it again. The cells hold. So do they.`,
    ],
    afterContext: {
      GREAT_BATTLE: `After the cascade, {faction} secured the maintenance routes through {region}. Pixel holds don't hold without regular small pushes. {faction} knows this. The work happened fast.`,
      THE_SILENCE: 'The quiet was used for logistics. Near {region}, {faction} worked the routes — building, securing, maintaining what needed to be maintained before things became active again.',
    },
  },

  NIGHT_WATCH: {
    loreType: 'NIGHT_WATCH', icon: '\u25e6',
    ruleApplied: 'Night Watch',
    ruleExplanation: 'The watchers hold — the Grid is tended between active events.',
    headlines: [
      'The Ground Held Near {region}',
      '{faction} Watch the Zone Near {region}',
      'Low Activity, Steady Presence Near {region}',
      'The Night Watch at {region}',
      'Held Without Fighting — Near {region}',
      'Quiet Work of Keeping {region}',
    ],
    bodies: [
      `Near {region}, {faction} hold through the quiet — small pixel activity, steady signal presence, the zone maintained by attention rather than force. The Grid logs the small pushes the same as the large ones.`,
      `The night watch near {region}: {faction} maintaining their hold through low-activity blocks. Not a cascade. Not a skirmish. The kind of presence that keeps a zone from drifting when no one is pushing.`,
      `Near {region}, quiet on the Grid. {faction} still active, still confirming their color in small pushes — low intensity, but not absent. The chronicle records the watch.`,
      `{faction} kept {region} through the quiet stretch — small pixel confirmations, the zone maintained by regular low-level activity. This is how held territory stays held on the Grid. Block by block.`,
      `The quiet near {region}: {faction} watching the cells they've colored, keeping the zone through the kind of consistent small presence that doesn't make large entries but keeps the color from fading.`,
    ],
    afterContext: {
      GREAT_BATTLE: `After the cascade at {region}, a single pixel placed at the boundary. Easy to miss in the aftermath. Someone made sure their color was staked at the edge before the map settled. settled.`,
      THE_SILENCE: `Even in the quiet, someone touched the edge of {region}. The smallest possible claim, placed carefully while nothing else was moving.`,
      GREAT_SACRIFICE: `After the sacrifice, something changed in the way {faction} moved near {region}. Not slower — more deliberate. Every move weighted by what was given to make it possible.`,
    },
  },

  AFTERMATH: {
    loreType: 'AFTERMATH', icon: '\u00b7',
    ruleApplied: 'Aftermath',
    ruleExplanation: 'Auto-inserted after a great move — the world processes what just happened.',
    headlines: [
      'After the Push at {region} — {faction} Settle In',
      'Post-Engagement: {faction} Consolidate at {region}',
      'The Quiet Work After the Fight at {region}',
      '{faction} Solidify Their Hold at {region}',
      'After the Move: Lower-Intensity Confirmation at {region}',
      'The Fight Is Over — The Work of Holding Begins at {region}',
    ],
    bodies: [
      `After the cascade at {region}, the Grid settled. {faction} consolidating what the push established — smaller pixel activity now, the zone being confirmed rather than expanded.`,
      `The large rewrite at {region} is done. {faction} are in the aftermath — smaller pushes, the zone being locked in, the color held rather than advanced. Quieter. Still in the log.`,
      `Following the major push near {region}: lower intensity, the pixel distribution stabilizing around the new state {faction}'s cascade created. The rewrite is done. The holding begins.`,
      `The Grid near {region} after the event: {faction} active but not at cascade-level intensity. The work of settling what was just changed. Confirming each cell. Making the new state permanent.`,
      `After a large rewrite, the Grid requires the smaller follow-through. Near {region}: {faction} in aftermath mode, the territory being locked in through consistent presence rather than force.`,
    ],
  },

  ESCALATION_NOTE: {
    loreType: 'ESCALATION_NOTE', icon: '\u2191',
    ruleApplied: 'Escalation',
    ruleExplanation: 'Auto-inserted when the pace surges — the chronicle notices acceleration.',
    headlines: [
      'The War Picks Up Speed Near {region}',
      'More Action, Faster — Near {region}',
      'The Tempo Changes Near {region}: Accelerating',
      'Something Drives the War Faster Near {region}',
      'The Pace Is Different Now Near {region}',
      'Escalation Near {region}: The Rate Is Rising',
    ],
    bodies: [
      `The pixel activity near {region} has accelerated. More pushes per block window, larger rewrites per execution, the Grid's log moving faster than the recent baseline.`,
      `The push rate near {region} picked up. {faction} and {rival} both executing faster — more rewrites per window, the active map changing at a pace the recent entries didn't show.`,
      `The Grid near {region} is moving faster. Push density up, pixel counts per execution larger, the log accumulating entries faster than it had been. Something escalated.`,
      `More activity. The block data near {region} shows a denser push pattern than the previous window — both signals contributing to a pixel conflict that just picked up speed.`,
      `Escalation near {region}: the push rate is up, the pixel spreads are larger, the conflict moving at an intensity the earlier entries in this era didn't describe.`,
    ],
  },

  SACRIFICE_TOLL: {
    loreType: 'SACRIFICE_TOLL', icon: '\u2020',
    ruleApplied: 'The Toll',
    ruleExplanation: 'Auto-inserted when cumulative sacrifices cross a threshold — the weight accumulates.',
    headlines: [
      'The Toll of Sacrifice — Another Threshold',
      'The Chronicle Counts What Was Given',
      'The Accumulated Weight of Sacrifice',
      'Another Mark in the Record of What Was Burned',
      'The Sacrifices Are Adding Up',
      'The Chronicle Marks the Total Given',
    ],
    bodies: [
      `The burn total crossed another mark. All the sacrifices in the chronicle — every signal that gave its capacity to the Grid, every unit of power distributed — have accumulated to a threshold worth recording.`,
      `The chronicle counts the sacrifices. Across all entries, the burn log has grown to a new threshold. Each individual burn was one entry. Together they are this number.`,
      `Another mark in the sacrifice register. The accumulated burns in the current account have crossed a threshold — not through one large giving but through many small ones logged over many blocks.`,
      `The toll is real. The burn total across the current chronicle window has reached a new level — each sacrifice small in the log, together describing a scale of giving the chronicle marks.`,
      `The burn total crossed another line. Every signal that gave its capacity, every unit of power passed to the Grid, every sacrifice confirmed — together they've produced a number worth marking.`,
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
