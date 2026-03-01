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

// Names seed from tokenId only — so the same token always maps to the same
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
    .replace(/{rival}/g, c.rival).replace(/{faction}'s gridkeeper/g, c.commander)
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
      `The push on {region} came all at once — every pixel committed, no testing the edge first. {faction} repainted the ground completely. What {rival} held at dawn was gone by midday. The Grid remembers every stroke. This one will take time to process.`,
      `{faction} filled {region} with their color before {rival} could respond. The change was total — hundreds of pixels rewritten in a single movement, the old pattern erased. The Grid does not forget. The new shape is there now, permanent in the chain.`,
      `The Grid shifted at {region}. Not gradually. All at once. {faction} committed everything they had and the territory rewrote itself in their color. {rival} can see it in the ledger — the block, the count, the timestamp. It is immutable. It happened.`,
      `{faction}'s move on {region} was the kind that gets read in a single breath. No preamble, no testing. The full weight of their presence, expressed in one continuous push across the grid. {rival} is still counting what was lost.`,
      `A hundred pixels, then another hundred. {faction} did not stop at {region} until the whole zone was theirs. The Grid absorbed each edit in sequence, each one building the new shape. By the time {rival} understood the scope of it, the last stroke was already confirmed on-chain.`,
      `The chronicle marks large moves with a different weight. What happened at {region} was large — a wholesale rewriting of ground that {rival} had held for long enough to call their own. {faction} changed that. The Grid makes these changes permanent. This one is permanent now.`,
      `Before the push: {region} had been contested, shifting slowly. After: it belonged to {faction} completely. The speed of it was what {rival} could not account for — every pixel placed in a single coordinated movement, the territory transformed before anyone could intervene.`,
      `{faction} wrote their pattern across {region} without pause. Pixel by pixel, the old colors disappeared. The Grid recorded each edit as it arrived, building the new reality one confirmed transaction at a time. The result is not arguable. It is in the chain.`,
    ],
    phaseVariants: [
      {
        phase: 'siege',
        headline: 'The Stalemate Breaks — {faction} Move on {region}',
        body: 'After so long with neither side able to push, {faction} broke first — and broke well. The move on {region} was fast and decisive. {rival} had been ready for a small probe. They got everything {faction} had. {faction} do not wait forever.',
      },
      {
        phase: 'reckoning',
        headline: '{faction} Make Their Final Move on {region}',
        body: 'This one feels different from the others. {faction}\'s push into {region} carries the weight of everything before it — all the smaller moves, all the long waits, all the choices that led here. {faction} know it. So does {rival}. This is the move that will be remembered.',
      },
    ],
    afterContext: {
      GREAT_SACRIFICE: '{faction} moved on {region} the morning after the sacrifice. No ceremony. Just the move — heavier now, carrying the weight of whoever was lost. nothing was said. The ground said everything.',
      THE_SILENCE: 'The quiet broke with everything {faction} had. A full push into {region} that shattered the stillness. {rival} had been resting. They should have been watching.',
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
      `{faction} pushed a stretch of {region} into their color and held it. Not the whole zone — a deliberate slice, the part that mattered. {rival} responded late. The Grid shows the new line. It sits further into {faction}'s favor than it did this morning.`,
      `A few dozen pixels, placed carefully at {region}. {faction} took what they came for and stopped. This is how the Grid actually moves most of the time — not in great floods but in precise, accumulated strokes. Each one locks in. Each one shifts the ledger.`,
      `{rival} will say the exchange at {region} was inconclusive. The on-chain record disagrees. {faction}'s marks are in the confirmed blocks, the ground is different, and different is not inconclusive. The chronicle records what the Grid confirms.`,
      `Small moves make large facts. {faction}'s edit at {region} was not dramatic — fifty pixels, maybe, shifted from one color to another. But the Grid doesn't distinguish by size. A confirmed pixel is a confirmed pixel. The edge moved.`,
      `The push at {region} lasted one block. {faction} placed their edits, the chain confirmed them, and the territory shifted. {rival} was watching but watching is not the same as acting in time. The window closed. The new state is canonical.`,
      `{faction} has been working {region} incrementally — each edit small enough to seem like noise, together too coordinated to be anything but intention. Today's push made the intention undeniable. The pixel count in the ledger tells the story clearly.`,
      `Clean execution at {region}. {faction} moved on the exact pixels they needed, confirmed in the exact block they chose, and withdrew. {rival} found a grid that had shifted while they were planning their response. Planning is slower than placing.`,
      `The Grid at {region} holds a new truth. {faction} wrote it there — not in words, but in pixels, each one recorded in the chain with a timestamp that cannot be disputed. {rival} will have to work from the new truth now.`,
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        body: 'Everything is moving faster now. What used to take three careful moves collapsed into one sharp exchange at {region}. {faction} hit hard. {rival} answered fast. The ground changed before anyone could fully track it.',
      },
      {
        phase: 'siege',
        body: 'In a siege, every small move costs more than it should. The exchange at {region} was not dramatic but both sides paid for it — worn down by a fight that never seems to end. both sides know the math. So does {rival}. Neither stops.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: '{faction} kept pushing after {region}. They pressed the newly taken ground before {rival} could reset. {faction} call it the second wave. It is still running.',
      THE_SILENCE: 'The silence broke quietly — a small push at {region}, not the explosion anyone expected. {faction} tested the ground. It held. They pressed on.',
      VETERAN_RETURNS: `{faction}'s veterans came back and immediately sharpened the approach. The push at {region} was cleaner than anything in the recent entries. Experienced hands make a difference you can see.`,
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
      `A single pixel, placed at the edge of {region} in the night. {faction}'s mark is there now — small enough to be overlooked, real enough to be in the chain. The Grid keeps everything. The margin shifted.`,
      `The edge of {region} is different this morning. One pixel changed — or two, or three — at the exact boundary where {faction}'s territory meets open ground. Small. Deliberate. The chronicle notes what the Grid confirms.`,
      `{faction}'s brush touched {region}'s border and withdrew. The mark left behind is minimal. What it costs to defend is not minimal. Every pixel on the boundary has to be watched now. That is the point of boundary marks.`,
      `The probe at {region}'s edge required almost nothing. A few pixels, placed precisely at the margin, confirmed in one block. {rival} will spend more effort responding to this than {faction} spent making it. That arithmetic is intentional.`,
      `The Grid at {region}'s edge changed by one pixel. In isolation that is nothing. In the context of every other edit {faction} has confirmed at this border over the past weeks, it is the latest step in a direction that only looks random if you do not zoom out.`,
      `Small marks accumulate. {faction}'s presence at {region}'s edge has been growing one pixel at a time — each edit tiny, each one confirmed, each one permanent. The Grid does not have a threshold below which edits stop counting. Every pixel counts.`,
      `The border at {region} shifted overnight. Barely. One confirmed edit, one pixel moved from neutral to {faction}'s color. {rival} has not noticed yet. When they do, there will be a meeting. The edit will still be in the chain.`,
      `Edges matter on a fixed grid. {faction} knows exactly which pixels define the boundary of {region} and they have been working those pixels carefully — one confirmed edit at a time, each one extending their presence by the minimum meaningful amount. The minimum adds up.`,
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
      `{faction} formalized what the Grid already showed. The territory at {region} had been theirs in practice — every pixel their color, every edit their transaction. Today they named it. The declaration is a record of what the ledger had already recorded.`,
      `The Grid does not require declarations. The pixel count speaks for itself. But {faction}'s formal claim on {region} translates the on-chain truth into language — explicit, exact, entered into the chronicle where it can be read alongside the data it describes.`,
      `{rival} received {faction}'s declaration and checked the Grid. Every pixel at {region} confirmed what the declaration said. There was nothing to dispute. The chain had already said it. The declaration just said it in words.`,
      `Some moves are about pixels. Some are about what the pixels mean. {faction}'s formal claim at {region} is the second kind — it converts raw edit data into stated territory, making the Grid's record legible to those who prefer language to ledgers.`,
      `The declaration came after the work. {faction} filled {region} first, confirmed every edit, waited for the chain to settle — then said: ours. The sequence matters. You cannot declare what you have not already built in the Grid.`,
      `{faction} has been placing pixels at {region} for long enough that calling it a formal declaration almost understates the case. The Grid had decided this already. The chronicle is catching up to what the chain has known for blocks.`,
      `Fifty pixels, then a hundred, then the declaration. {faction}'s claim on {region} did not emerge from words — it emerged from a pattern of confirmed edits that made the words inevitable. The declaration is the last step, not the first.`,
      `The on-chain record at {region} is unambiguous. {faction}'s pixels outnumber everything else in the zone, their edits are more recent, their presence is consistent. The declaration this morning names that reality. Reality was already there.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The fight happened. Then the paperwork. {faction}\'s formal claim on {region} came after the ground was already taken. The declaration was not an argument. It was a record.',
      SKIRMISH: `{faction} fought for {region} and won it. Then they made the winning official. {faction}'s gridkeeper wanted it clear: this is not temporary. This is stated.`,
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
      `A token was burned at {region}. Gone from the Grid permanently — the pixels it carried, the edit history it held, dissolved into action points that passed to others. The chain recorded it. What was given cannot be taken back.`,
      `The Grid lost a presence today. Near {region}, a token was committed entirely — burned, its action points transferred, its ability to place pixels ended. The chronicle holds the transaction hash. The chain holds the permanent record of what was given.`,
      `Burning is a choice made once. Near {region}, someone made it — their token consumed, its accumulated power transferred to the collective effort. The Grid does not soften this. The burn transaction is in the chain. The token is gone.`,
      `Action points are scarce on the Grid. What was burned near {region} converted scarcity into a gift — the burned token's capacity passed on to others who will use it to place pixels that the burned token can no longer place. The arithmetic of sacrifice.`,
      `The burned token near {region} had been active. Its edit history is in the chain — every pixel it ever placed, every block it participated in. That history does not disappear with the burn. The token does. The history stays, and so does what it gave.`,
      `Near {region}, a token ended. Not lost — ended deliberately, its action points transferred in the burn transaction, its grid presence converted into something others can carry forward. The chain records this as a transfer. The chronicle records it as a gift.`,
      `The Grid changes shape when tokens burn. Near {region}, one burned, and the pixels it had been placing will now be placed by those who received its action points. The contribution continues. The contributor does not. Both facts are in the chain.`,
      `Some tokens accumulate action points over many blocks. The one burned near {region} had been building for a long time. What it gave was substantial. The chain shows the transfer amount. The chronicle notes the weight of what that amount represents.`,
    ],
    phaseVariants: [
      {
        phase: 'sacrifice',
        headline: 'Another Name Added Near {region}',
        body: `The chronicle has too many of these entries now. What was extraordinary once is part of the rhythm — a life given, strength transferred, the world continuing with what remains. {faction}'s gridkeeper reads each one alone. There are many to read.`,
      },
      {
        phase: 'reckoning',
        headline: 'A Final Giving Near {region}',
        body: 'In the late days, a sacrifice carries a different weight. The one who gave near {region} had seen the earlier ones. They gave anyway — not from desperation but from a clear-eyed understanding of what this moment needed. That is a harder kind of giving than desperation.',
      },
    ],
    afterContext: {
      THE_SILENCE: 'After the sacrifice the world went quiet. Not the quiet of rest. The quiet of a place where something enormous has happened and no one knows what to say yet.',
      GREAT_BATTLE: `{faction} moved on {region} the morning after the sacrifice. The timing was not coincidence. {faction}'s gridkeeper used what was given. That is what gifts are for.`,
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
      `Action points moved near {region}. A small transfer — one token to another, freely given, the chain confirming it in one block. The Grid does not distinguish between large gifts and small ones. Both are recorded. Both move the ledger.`,
      `The transfer near {region} was quiet. A few action points, one token to another, no announcement. This is the texture of the Grid between the large events — small confirmed exchanges that sustain the effort without appearing in any headline.`,
      `Not every on-chain action is a battle. Near {region}, a small amount passed between tokens — a voluntary transfer, the kind the Grid was built to allow. The chronicle records it because the chronicle records everything the chain confirms.`,
      `The offering near {region} added to the on-chain record without adding to the pixel count. Action points moved. The Grid's capacity shifted slightly. Both parties are still active. Small transfers are how the ecosystem sustains itself between pushes.`,
      `The Grid runs on action points. Near {region}, a few moved from one token to another — a transfer small enough to overlook, significant enough to record. The chain has it. The chronicle has it. Small things add up in a fixed-size grid.`,
      `Someone near {region} gave a portion of what they had. The chain recorded it as a transfer event — a specific amount, a specific block, two specific tokens. Behind that data: a choice to share capacity that could have been used alone.`,
      `Action points are the Grid's currency. Near {region}, some changed hands — a deliberate transfer between tokens, recorded on-chain, permanent. The giving was small. The record of it is not small. The chain keeps everything at the same resolution.`,
      `Between large moves, the Grid is sustained by small ones. The transfer near {region} is one of those — unremarkable in isolation, part of a pattern of small exchanges that keep the active tokens active. The chain has the receipt.`,
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
      `The token near {region} has burned before. Today it burned again — a second sacrifice, the chain recording a second transfer of action points from the same token. Burning once is a choice. Burning twice is a commitment to what the first burn meant.`,
      `Some tokens appear in the burn record once. The one near {region} appears twice now. The chain makes no comment on repetition. The chronicle notes it: twice given, each time permanent, each time irreversible. The pattern is its own statement.`,
      `The second burn near {region} cost the same as the first burn — everything the token had at the moment of commitment. But the second burn follows knowledge of the first. It is a choice made with full understanding of what burning means. That makes it different.`,
      `The on-chain burn record near {region} now contains two entries from the same source. The chain records these the same way. The chronicle distinguishes them — not by the transaction but by the sequence. First burns are decisions. Second burns are convictions.`,
      `Twice. The token near {region} has given twice. Each burn is a final transaction — action points transferred, token capacity reduced. The chain holds both entries. Placed next to each other in the ledger, they describe a pattern of commitment that a single entry cannot.`,
      `The second burn near {region} is in the chain now alongside the first. The two transactions, read together, tell a story the individual entries do not: that what was given the first time was not given lightly, and what was given the second time was given anyway.`,
      `Near {region}, a token that had already sacrificed everything it had built up once, rebuilt, and then gave again. The chain records the second burn without ceremony. The chronicle notes what the sequence means — a deliberate return to the same irrevocable choice.`,
      `The burn near {region} was the second from this token. The Grid absorbs second burns the same way it absorbs first ones — the action points transfer, the chain confirms, the capacity is gone. The difference is not in the chain. It is in what the second one says about the first.`,
    ],
    afterContext: {
      GREAT_SACRIFICE: 'The great sacrifice near {region} was followed by a smaller one — a second giving from someone who had already given. Watching the first one reminded them of what they had promised.',
      GREAT_BATTLE: `Before the push on {region}, one of {faction}\'s own gave for the second time. {faction}'s gridkeeper did not ask them to. They did it because the moment called for it. Then the push happened.`,
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
      `A token that had been quiet near {region} placed again. The gap in its edit history closes — inactive block, inactive block, then a confirmed transaction in the current block. The Grid does not ask where a token has been. It records where it is now.`,
      `The edit history for {region} gained a familiar signature. A token that had been present in earlier blocks, then absent, then present again — the chain showing the gap and then the return. The Grid accommodates returns. The ledger stays open.`,
      `The on-chain record near {region} has seen this token before. Earlier entries, a gap, and now new edits appearing in the current sequence. The pattern in the chain is legible to those watching the data: this presence knows this territory. It has the history to prove it.`,
      `{faction} returned to {region}. The token placing the pixels had placed pixels here before — the chain shows the earlier transactions, the gap, the new activity. Experience in the Grid is visible in the edit history. History does not disappear from the ledger.`,
      `A token with a long {region} edit history placed again this block. The gap before this entry is visible in the chain — blocks where no transaction appeared. The return ends the gap. The history before the gap and the activity after it belong to the same token.`,
      `The Grid at {region} recognizes returning patterns even if the Grid itself does not remember. The edit history does. A token placed here before, was gone, and is back — the chain's record showing each fact in sequence without commentary. The chronicle adds the commentary.`,
      `Some tokens leave and come back. Near {region}, one did — its edit history showing active blocks, then silence, then new transactions in the current window. The return is in the chain. What brought it back is not in the chain. What it does next will be.`,
      `{faction}'s presence at {region} resumed. The token history shows the previous edits, the inactive period, and now the new pixels appearing in confirmed blocks. The Grid at {region} looks different with this token active again. The ledger shows why.`,
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
      `A token with no prior edit history appeared near {region}. First transaction, first confirmed pixel, first entry in the ledger. The Grid does not have a ceremony for arrivals. The chain just records: this token was here, this block, this edit.`,
      `The on-chain record near {region} shows a new address making its first edits. No previous transactions, no prior history in the zone — just a first pixel, confirmed, in the current block. Every presence in the Grid started this way.`,
      `Someone placed their first pixel on the Grid near {region}. The chain marks it the same as any other confirmed edit. The chronicle notes the difference: this is a beginning, and beginnings matter to the shape of what comes after.`,
      `New token activity near {region}. No prior edit history in this zone, no pattern to read in the chain — just a fresh presence making its first marks on the Grid. The Grid holds ten thousand possible presences. Another one is active now.`,
      `The edit record near {region} gained a new token this block. First confirmed transaction, no prior activity to reference. The Grid accommodates ten thousand tokens. Not all of them have been active. This one is active now.`,
      `A first edit near {region} — a new token making its initial mark on the Grid. The chain records this the same way it records everything: block number, transaction hash, pixel count. What the chain cannot record is what comes after a beginning. The chronicle will.`,
      `The Grid near {region} gained a new participant this block. The token's edit history starts here — this transaction, this pixel, this confirmed block. Ten thousand tokens live in the Grid. Each has a first edit. This is this one's first edit.`,
      `New activity near {region} — a token not previously seen in this part of the Grid making its first confirmed edits. The chain opens a record. The chronicle opens a file. Whatever this token does next will be the second entry in a history that starts right now.`,
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        body: 'Even as the pace rises, new people keep arriving at {region}. This one comes into a world moving faster than the stories they have heard describe. The stories are already out of date. They will have to catch up.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: 'Someone arrived at {region} in the wake of the big move — drawn by what happened, or by the space left behind. New arrivals in the aftermath of large events come for different reasons. This one has not shown their hand yet.',
      THE_SILENCE: 'The quiet brought a new face. Someone arrived at {region} during the stillness — which means they came for the calm, or despite it, or did not know it was happening. Hard to say which.',
      CAMPFIRE_TALE: 'Another new arrival at {region}. The stories that drew the last one are drawing more. Word is spreading. The chronicle will have many new files to open.',
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
      `The token at {region} is one of the rare ones — a specific ID that appears across the chain's history at moments that, read together, form a pattern. It moved today. The Grid records every token equally. The chronicle notes that some tokens' histories are not equal.`,
      `Certain tokens appear at inflection points. The one active near {region} is one of those — its edit history a series of appearances at moments when the Grid was changing shape in significant ways. It appeared again. The pattern continues.`,
      `The chain's record near {region} includes a token that has been present at more turning points than probability alone explains. Today is another transaction from this token, at another moment when the Grid is in motion. The coincidence, if it is a coincidence, is consistent.`,
      `Not every token is the same age. The one near {region} has been on the chain since early in the Grid's history — its first transaction in a block number low enough that most current active tokens did not exist yet. What a token with that history does matters differently.`,
      `The token near {region} has an unusual edit pattern — not the most frequent, not the largest pixel counts, but consistently present at specific moments in the Grid's history. It placed again today. The consistency is in the on-chain record for anyone who looks.`,
      `Rare tokens move rarely. The one that placed near {region} today has fewer total transactions than most active tokens, but those transactions cluster at moments of significance in the Grid's history. One more transaction, at another significant moment.`,
      `The chain holds a complete history of every token's edits. The history of the token near {region}, read in full, describes a presence that appears when things are about to change — and is notably absent between those moments. It appeared again today.`,
      `Some on-chain patterns are too consistent to ignore. The token active near {region} is one — its edit history a sequence of appearances at Grid-relevant moments that spans blocks from near the beginning to now. Today's edit adds to the sequence.`,
    ],
    afterContext: {
      GREAT_BATTLE: `The Oracle appeared at {region} the day after the big push. Coincidence or the Oracle's definition of good timing. {faction}'s gridkeeper chose not to interpret it publicly. Privately, {faction}'s gridkeeper has thought of little else.`,
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
      `One of the earliest tokens on the Grid placed near {region} today. The chain knows this token from its first block — a low token ID, a long edit history, a presence that predates most of what is currently active on the Grid.`,
      `The chain holds the history of every edit ever confirmed. The token near {region} has one of the longest histories in that record — early token ID, edits from the Grid's earliest active blocks, a continuous presence through eras that newer tokens only know from the chronicle.`,
      `A low-numbered token placed near {region}. These are the Grid's oldest presences — their token IDs marking them as part of the original ten thousand, their edit histories beginning in blocks before the current landscape existed. One of them moved today.`,
      `The earliest tokens have seen the Grid in states that no current edit history can fully reconstruct. The one near {region} today has been placing pixels since before most of the currently active zones were contested. Its transaction history is older than the current conflict.`,
      `Token history near {region} today includes one of the originals — an early ID, early edit history, a presence that stretches back through the chain to moments before the current landscape took its current shape. It placed again. It has been placing for a long time.`,
      `The Grid's oldest tokens carry an edit history that most active participants only know as chronicle entries. Near {region}, one of those tokens placed pixels in the current block — its history stretching back through eras, its most recent edit happening right now.`,
      `Some tokens predate the current conflict entirely. The one active near {region} was placing pixels before most of the current zones had names in the chronicle — its edit history a record of the Grid in earlier states, its current edit another link in a very long chain.`,
      `The chain records everything in sequence. Near {region}, a transaction from a token whose sequence begins so early in the Grid's history that the blocks it first appears in look almost empty compared to the current density of activity. Old presence, new edit, same chain.`,
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
      `Activity at the grid's outer coordinates — near {region}, a token from a range not typically active in the main contested zones placed its pixels. The Grid does not have a center and a periphery. The chain records all coordinates equally. But the chronicle notices the distribution.`,
      `The edit near {region} came from coordinates that do not appear often in the chronicle's recent entries. Far from the most-contested zones, a token placed — recording its pixels in the same chain that records everything else, at a distance that most of the main activity ignores.`,
      `The Grid's full extent is forty by forty. Most of the recent activity in the chronicle covers a fraction of that. The edit near {region} is different — a token placing pixels in territory the current account of the conflict has not reached. The outer grid moves too.`,
      `Tokens active in the peripheral zones of the Grid tend not to appear in the main chronicle. Their edits are in the chain — every pixel confirmed, every block recorded — but the account of the conflict focuses on the contested center. Near {region}, the periphery is active.`,
      `The chain records edits across the full grid equally. The chronicle does not — it follows the conflict, which follows the contested zones, which are not at {region}. What placed near {region} today came from a part of the Grid that the chronicle has been neglecting. The chain has not.`,
      `Far coordinates, near {region}. A token placing pixels at the edge of the Grid's active range — far enough from the main contested zones to be invisible to anyone watching only the conflict, close enough to the chain to be recorded exactly like every other edit.`,
      `The outer grid is not empty. Near {region}, activity that the chronicle rarely covers — tokens placing pixels in the peripheral zones, their edits confirmed in the chain alongside everything else, their presence real even when the account of the main conflict ignores it.`,
      `Distance from the center does not mean distance from the chain. Near {region}, a token placed its pixels at coordinates that the current conflict has not reached — and the Grid recorded it with the same precision it records every contested pixel in the main zones.`,
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
      `The pixel count at {region} has changed hands before. The chain shows it — {faction}'s color, then {rival}'s color, then {faction}'s again, the ownership cycling through confirmed edits that each overwrote the last. Today: {faction} holds it. The cycle continues.`,
      `{region} in the chain is a sequence of overwrites. Each faction's pixels replaced the other's at different blocks, the ledger showing the full history of a zone where no single color has held for long. The current state is {faction}'s. Previous states are still in the record.`,
      `The most-edited zone in the Grid may be {region}. The chain shows why — transaction after transaction from both {faction} and {rival}, each one overwriting what the last one built, the pixel count shifting back and forth across dozens of confirmed blocks.`,
      `Holding {region} means overwriting it. The chain's history of this zone is a sequence of successful overwrites — each faction's edits replacing the other's, the territory's color resetting again and again as the conflict moves through it. {faction} has overwritten it again.`,
      `{faction} holds {region} today. The chain shows they held it before too — and lost it, and took it back. The edit history of {region} is the history of that cycle written in pixel data. No state in that history has been permanent. The current state is the latest in the sequence.`,
      `The chronicle has marked {region} before. It will mark it again. The chain holds every edit the zone has ever seen — a complete record of every time one faction's pixels replaced another's, every contested block, every temporary state that looked like resolution and wasn't.`,
      `Some zones on the Grid are genuinely disputed. {region} is genuinely disputed. The on-chain edit history shows both {faction} and {rival} holding it at different blocks — the territory's true state being not what it is now but the whole sequence of what it has been.`,
      `{rival} held {region}. {faction} holds it now. The chain recorded both facts and will record whatever comes next. In the ledger, every state of {region} exists simultaneously — the full history of every pixel that was ever placed there, every overwrite, every change.`,
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
      `Twenty-five entries into the current sequence, the Grid's pattern becomes visible in a way it was not visible from inside any individual entry. The on-chain data, read across twenty-five transactions, describes a direction. {faction} is moving in that direction. {rival} is reacting to it.`,
      `The chronicle marks every twenty-fifth entry to force a wider view. Looking at the last twenty-five: {faction}'s edit activity has been consistent and directional. {rival}'s has been responsive. {region} appears more than any other zone. These three facts, together, are the shape of the current Grid.`,
      `Twenty-five confirmed transactions, read in sequence. The pixel data shows what single-entry analysis cannot: a pattern of movement across the Grid that has been consistent for long enough to be called a direction. The direction belongs to {faction}. The chain confirms it.`,
      `At twenty-five entries, the on-chain record reveals something that was invisible inside each individual transaction: a coherent strategy playing out in pixel data. {faction}'s edits at {region} and surrounding zones, placed across these blocks, describe an intention the Grid has been recording all along.`,
      `The Grid's history, read twenty-five transactions at a time, shows structure that random placement would not produce. {faction}'s activity in the current sequence has a shape — {region} at the center, consistent direction, each edit building on the ones before it. The chain holds all of it.`,
      `Twenty-five blocks of Grid activity, compressed into a pattern: {faction} is gaining territory. Not dramatically in any single transaction, but consistently across the sequence. The on-chain record shows it in aggregate. The chronicle marks the aggregate at twenty-five.`,
      `The current twenty-five-entry span in the chronicle corresponds to a specific range of block numbers. The pixel activity in those blocks, read as a whole, tells a different story than any individual transaction does. The story is {faction}'s — their color spreading across {region} with each confirmed edit.`,
      `Zoom out from the individual transactions. The Grid's pixel data across the last twenty-five entries shows a territory that is changing shape in a consistent direction. The direction is {faction}'s. The chain recorded every step of it. The chronicle marks the accumulation.`,
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
      `Count the recent entries. {faction}'s transactions appear in more of them than any other presence. This is not noise — the on-chain data shows a systematic pattern of Grid activity that has been building across blocks. The pixel count backs it up.`,
      `The Grid's edit history for the current era shows {faction} active across more zones than any other faction. Not always with the largest pixel counts. But consistently — block after block, zone after zone, the chain recording their presence everywhere the chronicle looks.`,
      `{faction}'s footprint on the Grid has grown. The on-chain record across recent blocks shows their pixel activity spreading — not concentrated in one zone but distributed across the Grid in a pattern that, taken together, describes something the chronicle needs a single word for. Dominion.`,
      `The pixel data does not lie about proportion. {faction}'s edits represent a growing share of the total Grid activity in the current window — more transactions, more zones, more confirmed pixels. The chain shows it in the ledger. The chronicle reflects it in the entry count.`,
      `Every confirmed pixel in the Grid is a permanent fact. {faction}'s permanent facts have been accumulating faster than anyone else's in the recent blocks — each edit small, each one confirmed, together building a presence on the Grid that the chain's history makes undeniable.`,
      `The chronicle tracks which factions appear in which entries. The current pattern: {faction} in most of them. Their pixel activity is consistent across the Grid's contested zones, their edit history growing in every block the chronicle covers. The ledger reflects what the chronicle describes.`,
      `Territory in the Grid is made of pixels. {faction} has been placing more of them than anyone else in the current window — not explosively, but steadily, each confirmed transaction adding to a pixel count that has grown large enough to call dominant in the current era.`,
      `The on-chain record of the current era, read from the outside, shows one faction's color spreading steadily across more of the Grid than it held before. {faction}'s transactions are in the chain. Their pixels are on the Grid. The distribution speaks for itself.`,
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
      `The Grid went quiet. No large confirmed transactions in recent blocks — the pixel activity low, the contested zones undisturbed. The chain records this absence the same way it records presence: as a fact about a specific range of block numbers.`,
      `The block range covering the current quiet at {region} will be visible in the on-chain history forever — a span of blocks where the pixel activity dropped, the edit rate slowed, the Grid settling into a temporary equilibrium. The chain records the silence alongside the noise.`,
      `Both {faction} and {rival} are present in the Grid. Neither is placing many pixels near {region} right now. The quiet is in the data — the transaction rate down, the contested zones stable, the ledger not growing as fast as it does during active periods.`,
      `The Grid at {region} is not changing right now. The pixel data shows stability — no significant overwrites, no major pushes, the zone's color distribution holding across recent blocks. Stability in the Grid is temporary. The chain will show what ends it.`,
      `Silence in the on-chain record is still data. The current quiet at {region} — visible in the low transaction rate, the unchanged pixel counts, the absence of contested edits — is information about what both {faction} and {rival} are choosing not to do. Choices not to act are still choices.`,
      `The edit rate near {region} has dropped. The chain shows it in the block-by-block transaction count — active, active, slower, slow, quiet. The Grid is not changing in this zone right now. What the chain records during the quiet is what the quiet is: a pause with both sides still in it.`,
      `No major pixel activity near {region} in the current block window. The Grid holds its current state — {faction}'s pixels where {faction}'s pixels were, {rival}'s where {rival}'s were. The chain is adding blocks without adding significant change. That is what this is.`,
      `The quiet near {region} is visible in the data. Transaction counts down, pixel movement minimal, the contested zone's distribution unchanged. The on-chain record of this period will show a gap between the last significant edit and the next one. That gap is being written right now.`,
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
      `The Grid's edit count crossed a threshold. The chronicle marks it: {era} begins. The on-chain data has accumulated enough — enough transactions, enough pixels, enough confirmed edits — that the story the chain tells is a different story than the one it told at the previous threshold.`,
      `The accumulated pixel count reaches a new level. The chronicle has a name for this: {era}. The on-chain record that brought the count here is a compressed history of every edit that was ever placed on the Grid — each one permanent, each one part of what this threshold represents.`,
      `{era}. The chronicle opens a new chapter at this count because the chapter it was writing has filled. The Grid's chain of confirmed transactions has grown long enough that the earlier entries now look different in context — smaller, less certain, less shaped by what came after.`,
      `A threshold in the on-chain record. The chronicle marks these moments because the chain does not — the chain just adds the next block, indifferent to the accumulation it represents. {era} begins here, in this block, at this pixel count, with this entry in the record.`,
      `The current era in the chronicle ends when the Grid's on-chain activity crosses a specific threshold. It crossed today. {era} starts now. The pixels that brought the count to this point are in the chain. The story they tell together is what {era} begins with.`,
      `Count enough confirmed edits and the Grid's history divides itself. {era} is the chronicle's name for what the Grid has become after this many transactions — a world shaped by accumulated choices, each one permanent, each one contributing to the shape that now has a new name.`,
      `The Grid's chain grows one block at a time, indifferent to what accumulation means. The chronicle is not indifferent. At this block count, this pixel total, this entry number, the story becomes something it was not before. {era} begins. The chain continues.`,
      `Eras in the chronicle correspond to thresholds in the on-chain data. This threshold — this pixel count, this transaction total, this block — is where {era} begins. Everything in the chain before this entry is the foundation. Everything after is built on it.`,
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
      `Two transactions in the same block, near {region}, from different tokens. The chain confirms both in the same block number — simultaneous in the only sense that the Grid recognizes simultaneity. Two separate presences at the same coordinate at the same moment.`,
      `The Grid recorded two separate edits near {region} in the same block. {faction} placing pixels. Something else placing pixels. Different tokens, different owners, same territory, same block. The chain does not resolve the convergence. It just records that both happened.`,
      `Same block, same zone, two different transactions near {region}. {faction}'s edit and another one, confirmed simultaneously in the chain. The Grid holds both. The chronicle notes the intersection — two separate intentions arriving at the same coordinates in the same moment.`,
      `The block near {region} holds transactions from two separate sources. Both placed pixels in the same zone at the same time — the chain confirming them together without adjudicating between them. Convergence on the Grid is what happens when two separate paths arrive at the same coordinate.`,
      `Two edit transactions near {region}, same block number. {faction} and something else, both placing pixels in the same zone in the same moment the chain recorded. The convergence is in the data — two intentions that did not know about each other landing in the same place.`,
      `The Grid's ledger near {region} records two confirmed edits from the same block — separate tokens, separate transactions, but the same zone and the same timestamp in the chain's account. Simultaneous activity on a fixed grid means convergence. The chain records it. The chronicle notes it.`,
      `Same block. Same coordinates. {faction} and one other, both placing pixels near {region} at the moment the chain confirmed. The Grid absorbed both edits. The chronicle notes what the data shows: two separate presences arriving at the same point at the same time.`,
      `The on-chain record near {region} shows two transactions in the same block — a convergence that the chain records without comment, confirming both edits simultaneously. What {faction} and the other presence make of finding each other at the same coordinates will appear in the next entries.`,
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
      `{relic} surfaced in the on-chain data near {region}. Not a new token — an old one, its ID low enough that it predates most of the current active Grid. Its re-emergence now, in this territory, changes what the chronicle has been accounting for near {region}.`,
      `The transaction near {region} involved {relic} — an artifact with a chain history stretching back to the Grid's early blocks. Its edit history, visible in the ledger, shows where it has been. What brought it to {region} in this block is not in the chain. The chain shows only that it arrived.`,
      `The chain confirmed a transaction near {region} that the chronicle marks differently from regular pixel edits: {relic} was involved. What {relic} means to the current shape of the Grid, and to what {faction} is building near {region}, is a question the next several entries will begin to answer.`,
      `Something old appeared at {region}. The token ID for {relic} is early enough that its first transaction predates most of the current chronicle. Finding it active near {region} now — in this block, at this moment in the Grid's history — changes what the territory near {region} means.`,
      `The on-chain record near {region} now includes a transaction from {relic}. Its edit history tells a story in pixel data — where it has been, what zones it has touched, what it contributed to the Grid's history before this block. The story arrives in the current chronicle now.`,
      `{relic} is in the chain near {region}. The token's ID places it among the Grid's early presences — its first block early, its history long, its re-emergence now in this specific territory notable enough that the chronicle marks it as distinct from ordinary pixel activity.`,
      `The discovery near {region} is in the ledger. {relic}'s transaction, confirmed in the current block, adds a piece of the Grid's deep history to the current account. What the token carries — in action points, in edit history, in on-chain significance — is now present at {region}.`,
      `The chain records {relic}'s appearance near {region} as a confirmed transaction. The chronicle records it as more than that — as the arrival of something whose on-chain history reaches back through the Grid's full story, now active in a zone where the current conflict is most live.`,
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
      `Multiple transactions from the same token near {region} in close succession — the on-chain data showing rapid sequential edits, as if the next move was being decided and then immediately executed, decided again, executed again. The chain records the succession. The chronicle reads it as deliberation at speed.`,
      `A burst of activity near {region} from {faction} — several confirmed transactions in a short block range, the pixel data shifting rapidly as the edits accumulate. The chain shows the sequence. What the sequence describes is a faction recalibrating its approach in real time.`,
      `{faction}'s edit activity near {region} spiked in the last few blocks — multiple transactions, rapid succession, the pixel count changing faster than usual. The chain confirms each edit in order. Read together, the sequence looks less like normal placement and more like a response to something.`,
      `The on-chain data near {region} shows a cluster of {faction} transactions — sequential edits in a short block range, more concentrated than their usual activity pattern. Something shifted their approach. The new approach is in the chain. What caused the shift will have to be inferred from context.`,
      `{faction} is moving fast near {region}. The chain shows it — transaction after transaction in the current block window, the pixel activity dense, the edits coming in rapid sequence. This is what recalibration looks like in the Grid: not a pause to think, but a burst of action that embeds the thinking in the chain.`,
      `Multiple transactions near {region} in quick succession from {faction}. The chain records each one in order — edit, confirmation, next edit, confirmation. The pace is faster than {faction}'s baseline activity. Something changed. The response to the change is visible in the transaction sequence.`,
      `The Grid near {region} has seen a lot of {faction} activity in a short block range. The chain confirms it all — sequential edits, rapid succession, the pixel count accumulating faster than usual. Whether this is planned or reactive, the chain records the result the same way.`,
      `A cluster of {faction} transactions near {region} — visible in the chain as a dense block range of confirmed edits. The pace of the sequence distinguishes it from normal placement. Normal placement is steady. This is rapid. Something prompted the rapid response.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The big push changed the situation faster than {faction}\'s plans had accounted for. An urgent meeting — what to do with the win, and how fast to press it.',
      GREAT_SACRIFICE: `After the sacrifice, {faction} needed to meet. Not strategy — accounting. Who was gone, what they had given, what it meant. {faction}'s gridkeeper led it near {region}.`,
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
      `The Grid's coordinate data near {region} is being mapped in detail. The pixel distribution, the zone boundaries, the edit density by block range — all of it translated from on-chain data into a picture of what the territory actually looks like right now, as opposed to what it looked like in earlier entries.`,
      `The chronicle's account of {region} has been updated from the chain's current state. Pixel counts checked against the ledger, zone boundaries confirmed in the latest blocks, the territory's on-chain reality compared to what earlier entries described. The map and the chain agree now.`,
      `Surveying the Grid near {region} means reading the chain — the current pixel distribution, the edit history by zone, the active token addresses, the block timestamps. The survey near {region} is finished. The data is accurate to the current block.`,
      `The on-chain pixel distribution near {region} has been fully audited. Every confirmed edit, every current pixel, every zone boundary — verified against the ledger. The map of {region} that the chronicle carries forward from this entry is the Grid's actual current state, not an estimate.`,
      `Grid analysis near {region}: the chain's edit history for this zone shows how the pixel distribution has shifted over time, which factions have held which coordinates, and what the current state reflects about the whole sequence of changes that led to it. The analysis is in the data.`,
      `The territory near {region} has been read from the chain and described accurately. Pixel by pixel, zone by zone, the on-chain data translated into a current picture of where {faction} holds, where {rival} holds, and where the boundary sits in the current block.`,
      `An accurate reading of {region} requires going to the chain. The chronicle went to the chain. The pixel distribution near {region} has been verified in the ledger, the zone boundaries confirmed in the latest confirmed blocks, and the map updated to reflect what is actually there.`,
      `The Grid does not lie about its current state — the chain holds every pixel's current color in every confirmed transaction. Near {region}, the chronicle has read that state and recorded it accurately. The map reflects the chain. The chain is the truth of the Grid.`,
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
      `A token with a very early ID placed near {region} — its chain history long enough to have witnessed the Grid in states that the current chronicle covers only in retrospect. What it knows about {region} is in its edit history. The chronicle can read the history. The history goes back far.`,
      `The on-chain record near {region} includes a transaction from a token whose first edit predates most of the current chronicle's scope. The token has been on the Grid long enough to have a perspective on {region} that newer tokens, with shorter histories, cannot have.`,
      `Something old moved near {region}. The token's chain history — low ID, early first transaction, edits across multiple eras — marks it as a presence that was active on the Grid before the current conflict had its current shape. It placed again today. The history continues.`,
      `The chain holds the edit history of every token that has ever been active on the Grid. The token near {region} today has one of the longer ones — its edits stretching across a block range that covers much of the Grid's history. What it places now lands in a ledger it has been part of for a long time.`,
      `An early token, near {region}. The chain shows when this token first placed pixels — early blocks, low transaction numbers, a time when the Grid was configured differently than it is now. The token has been active since then. Its current edit is another entry in a very long record.`,
      `The Grid near {region} received a transaction from a token with a history long enough to contextualize everything the current chronicle covers. The token's edits, read in sequence from the chain, describe a presence that has witnessed the Grid change in ways that newer tokens have only heard described.`,
      `Old tokens place pixels the same way new tokens do — one confirmed transaction at a time, the chain recording each one equally. But the chain also records when the first transaction happened. The one near {region} has a very early first transaction. The history that precedes today's edit is substantial.`,
      `The chain does not distinguish between old tokens and new ones in its confirmation logic. The chronicle does. The transaction near {region} came from a token whose chain history stretches back far enough to make it a witness to most of what the current chronicle describes.`,
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
      `A token that had been active near {region} stopped appearing in confirmed blocks. The gap in its edit history is in the chain — blocks passing without a transaction, the token present in the ledger but absent from the recent activity. The chain records presence and absence equally.`,
      `The on-chain record near {region} shows a token whose edit frequency has dropped to zero in recent blocks. Previously active, now absent — the gap visible in the block range between its last confirmed transaction and the current block. The chain holds the gap. The chronicle notes it.`,
      `{faction}'s activity near {region} dropped by one regular presence. The token that had been placing pixels in this zone consistently has not appeared in recent confirmed blocks. The edit history ends at a specific transaction. What comes after that transaction, so far, is nothing.`,
      `A gap in the chain. The token that had been active near {region} placed its last confirmed pixel in a block that is now several behind the current one. The subsequent blocks contain no transaction from this token. The absence is in the data. The reason for the absence is not.`,
      `The on-chain edit pattern near {region} shows a missing presence. A token that had been part of the zone's pixel activity has not confirmed a transaction in recent blocks — its edit history ending at a specific block number, the blocks after it empty of its activity.`,
      `Tokens go inactive. The chain records this as an absence of transactions — no edits confirmed, no pixels placed, the token's ID not appearing in the recent block data. Near {region}, a token that was previously active has produced this absence. The chronicle notes the gap.`,
      `The Grid near {region} has been missing a presence it had. The token's last confirmed edit is in the chain — a specific block, a specific transaction. Nothing since. The blocks between that transaction and the current one contain no activity from this token. The gap is real.`,
      `The chronicle tracks what the chain records. Near {region}, the chain's recent blocks contain no transactions from a token that had been reliably active. The edit history stops. The token is still in the ledger — it did not cease to exist. It ceased to place pixels. The chain shows when.`,
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
      `Ten entries. The chronicle marks the count. What the last ten confirmed transactions describe, read together: pixel activity concentrated at {region}, {faction} appearing in the majority of entries, the Grid's contested zones shifting incrementally in a consistent direction.`,
      `The ten-entry tally: a majority of entries featuring {faction}'s transactions. {region} appearing more than any other zone. The on-chain data for these ten blocks shows a pattern the individual entries do not show separately — a direction, consistent, accumulating.`,
      `Ten confirmed transactions in the chronicle. The pixel data across them: a Grid that is moving, incrementally, in the direction of {faction}'s color spreading further into {region}. Not dramatically in any single block. Consistently across ten.`,
      `The chronicle marks every tenth entry to step back from the individual transaction and read the sequence as a whole. The sequence of the last ten: {faction} active, {rival} reactive, {region} the most-changed zone. Ten entries of data that, together, describe a trend.`,
      `A tally at ten entries. The on-chain activity across the last ten blocks: edit counts, pixel totals, zone distributions. What the numbers show: {faction}'s color has spread incrementally across the current zone of contest. The ten-entry view makes what the individual entry hides visible.`,
      `Ten transactions, read as a sequence rather than as individual events. The Grid's pixel data across these blocks shows {faction} making consistent progress near {region} — not in one dramatic push, but in the accumulation of smaller confirmed edits that each add a little to the ledger.`,
      `At ten, the chronicle counts. The count: {faction} present in most of the last ten entries, {region} the most-referenced zone, the pixel data showing a consistent directional movement in the Grid. Ten is a small number. The pattern it reveals is not small.`,
      `The tally at ten entries shows what the edit data shows when it is viewed in aggregate rather than transaction by transaction. The aggregate near {region}: {faction}'s pixel presence has grown in each of the ten blocks the chronicle has just covered. The chain confirms it.`,
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
      `The token's edit history shows a gap and then activity — absent from confirmed blocks for long enough that the chronicle had moved on from tracking it, now present again in the current block with a confirmed transaction near {region}. The chain records the return.`,
      `A return to the chain. The token near {region} had been inactive long enough for the gap in its edit history to be notable. Now it has placed pixels again — the current block containing its transaction, the ledger back open, the absence ended and on-chain activity resumed.`,
      `The chain holds the full edit history of every token. The history of the one near {region} includes a long gap between its previous last transaction and this one. The gap closes with today's confirmed edit. The token is active again. The chain shows both facts equally.`,
      `{faction}'s presence near {region} has a returning element — a token not seen in the zone's transaction data for many blocks, now confirmed in the current one. The edit history shows the previous activity, the gap, and the new entry. Return is visible in the chain when you look for the gap.`,
      `The on-chain record near {region} gained an entry today from a token whose previous last edit was many blocks ago. The gap in the middle is visible in the chain — blocks where no transaction appeared from this token, ended now by a confirmed edit in the current window.`,
      `A token with an interrupted edit history placed near {region} today. The previous active period is in the chain — a series of confirmed edits, then nothing, then the current transaction. Whatever happened in the gap is not in the on-chain record. The return is.`,
      `The token that placed near {region} today had been absent from confirmed blocks for long enough that anyone tracking its history would have flagged the gap. The gap is now closed — a new transaction in the chain, a new pixel in the Grid, the absence ended in one confirmed edit.`,
      `The chain holds every absence as clearly as every presence. Near {region}, an absence that had been accumulating across blocks was ended by a confirmed transaction in the current block. The token is back in the active record. Its history includes the gap and what came before it.`,
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
      `The token near {region} has burned before. The chain holds the first burn transaction — action points transferred, capacity reduced, the burn confirmed and recorded. Today's transaction is the second burn from the same token. The chain records it the same way. The chronicle does not.`,
      `Two burns from the same token, near {region}. The first is in the chain at an earlier block. The second is confirmed in the current one. Each burn is a final transaction in one direction — action points out, capacity gone, the chain holding the fact of each transfer permanently.`,
      `The chain near {region} holds two burn events from the same token ID. The first burn: early in the token's history, action points transferred, the record showing what was given. The second burn: now, the remaining capacity given again. The chain records both. The amounts are in the ledger.`,
      `Near {region}, a token burned for the second time. The first burn is in the chain at a specific earlier block. The action points from that burn are in the chain too — transferred, recorded, permanent. The second burn adds another transfer event. The chain holds both giving events in sequence.`,
      `The second burn transaction from a single token is in the chain near {region}. What the token gave the first time is in the ledger. What it gave this time is in the ledger. Together, the two burn events describe a token that has given everything it had, rebuilt, and given again.`,
      `The on-chain record near {region} shows a token with two burn transactions — one earlier in its history, one confirmed in the current block. The chronicle marks second burns separately because the chain data alone does not show why a second burn matters more than the first. But it does.`,
      `Token history near {region}: two burn events, same token ID, different blocks. The chain records them with equal weight. The chronicle gives the second one additional weight — not because the action points transferred were more, but because the decision to give again, knowing what giving means, was.`,
      `The second burn near {region} adds a second entry to the burn register. The first entry is in the chain from an earlier block. The second is in the chain from this block. Between the two entries: action points rebuilt and then given again. The chain shows the math. The chronicle notes what the math describes.`,
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
      `The account of the Grid that new tokens carry when they arrive near {region} is accurate about the large facts and wrong about the texture. The big moves are in the chronicle — {faction}'s pushes, the burns, the major overwrites. What is missing is every small confirmed transaction that connects them.`,
      `The version of the Grid's story told to new arrivals near {region} compresses the on-chain data into a shape that is easier to carry than the actual ledger. The chronicle is the actual ledger. The story told near {region} tonight is the compressed version, which is true about some things and flat about most.`,
      `The Grid's full history is in the chain. The version of that history being described near {region} is not the full history — it is a selection of entries that tells a story with a clear shape, clear sides, and an ending that is more certain than the actual ledger suggests.`,
      `New token activity near {region} comes with a prior account of the Grid — what the territory means, who the main factions are, what the conflict is about. The account is recognizable to the chronicle but simplified. The simplification is how the account became portable enough to travel.`,
      `The on-chain record of the Grid is neutral about meaning. It records pixels and transactions and block numbers. The story told near {region} tonight is not neutral about meaning — it has heroes and a direction and an inevitable conclusion. The chain does not confirm the inevitable conclusion.`,
      `How the Grid's history looks from outside the chain: simpler, more legible, with a clearer direction and less uncertainty than the actual transaction data shows. The account near {region} is that simpler version. It is not wrong, exactly. It is what the on-chain data looks like when you are not reading the on-chain data.`,
      `The chronicle has access to the full ledger. The account being passed near {region} to new arrivals does not. What gets left out in the transmission: every ambiguous entry, every inconclusive exchange, every moment the Grid moved in a direction the simplified account does not include.`,
      `New arrivals near {region} learn the Grid's history from a version that fits in the space of a conversation. The actual history is in the chain — every transaction, every confirmed pixel, every block number. The conversation-sized version is accurate about {faction} and wrong about the uncertainty.`,
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
      `The block range between the last active entry and the current one is large. The chain kept adding blocks during that range — empty of the relevant activity, recording other things, building the chain — while the Grid near {region} held whatever state it held when the activity stopped.`,
      `A long gap in the on-chain edit history near {region}. The chronicle marks the gap because the chain marks the gap — blocks passing without relevant transactions, the zone stable in its last confirmed state for longer than any previous quiet period in the current account.`,
      `The Grid at {region} has been in its current state for many blocks. The chain shows it — the last significant confirmed edit far enough back that the territory's on-chain state has been stable for longer than the chronicle expected. Long stability ends eventually. The chain will show when.`,
      `The block numbers between the last active chronicle entry and the current one represent a real gap — real blocks added to the chain, real time passing, the Grid at {region} holding its state without significant disturbance. Long gaps in the edit data are notable. This one has been noted.`,
      `The chain continued adding blocks while the chronicle was dark near {region}. Those blocks contain the period of inactivity as a negative space — the absence of the transactions that would have continued the chronicle's account, confirmed by the chain's record of what did not happen.`,
      `Near {region}, a long silence in the edit data. The chain shows the gap — blocks without relevant transactions, the zone undisturbed, the pixel distribution stable across a block range long enough that the chronicle treats the resumption as a new beginning in the same story.`,
      `The period of inactivity near {region} is in the chain as surely as any active period is. The chain records by block, and the blocks during the silence recorded other things — but they also recorded the absence of the activity that would have kept the chronicle current. The absence is in the data.`,
      `When the chronicle resumes near {region}, the chain shows what happened during the gap: not much, near {region}, but the Grid elsewhere continued. The chain does not pause for inactivity in one zone. It records everything. What was recorded during the gap near {region} is mostly other zones, other tokens, other stories.`,
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
      `The chain contains edit activity near {region} that the chronicle's main account has not been tracking — peripheral zone transactions, low-frequency placements, tokens whose activity falls outside the contested center but whose on-chain presence is real and recorded.`,
      `The Grid's peripheral zones have their own on-chain history. Near {region}, that history includes edit activity the chronicle has been underrepresenting — transactions from tokens whose pixel placement in the outer zones accumulates in the chain without appearing in the central conflict account.`,
      `Edge analysis near {region}: the on-chain data in the peripheral block range shows activity that does not appear in the main chronicle because the main chronicle follows the most contested zones. The chain records everything. The edges are in the chain too.`,
      `The Grid near {region} has been active in ways the central account of the conflict does not capture. The chain holds it — edge-zone transactions, peripheral placements, tokens active in the outer coordinates where the main factions' attention is not focused. The data is there.`,
      `Looking at the chain's data near {region}'s outer coordinates reveals a pattern the main chronicle misses: consistent pixel activity in zones that the current conflict has not prioritized. The activity is in the confirmed blocks. The chronicle has been reading the blocks but not looking at the edges.`,
      `The on-chain record near the periphery of {region} shows edit activity from tokens not prominent in the main chronicle. Their transactions are confirmed — the chain records them with the same precision it records everything — but the main account of the conflict has been focused elsewhere.`,
      `Edge-zone transactions near {region} appear in the chain even when they do not appear in the chronicle's central narrative. The outer coordinates of the Grid have their own edit history — lower frequency, smaller pixel counts, but real, confirmed, and part of the same ledger the main conflict is written in.`,
      `The chronicle's account of {region} has focused on the contested center. The chain's data near {region}'s outer coordinates tells a separate but related story — tokens placing pixels in the peripheral zones, their transactions confirmed, their presence in the Grid real even when the main account ignores it.`,
    ],
    afterContext: {
      FAR_REACH: 'The edge report confirmed what the far arrivals had been suggesting — the margins are more active than the main chronicle shows. {region} is a meeting point between two stories that have been running in parallel.',
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
      `The edit pattern near {region} changed. {faction}'s previous approach — visible in the chain as a sequence of consistent pixel placements in a specific pattern — has been replaced by a different approach in the current blocks. The chain shows both patterns. The switch is in the block range.`,
      `The on-chain data near {region} shows {faction} changing their pixel placement strategy between the previous block window and the current one. Different zones targeted, different pixel density, different edit frequency. The chain records the change without explaining it. The chronicle notes it.`,
      `{faction}'s edit history near {region} breaks pattern in the current blocks. What had been consistent — the same zones, the same placement approach, the same frequency in the chain — is different now. The new pattern is in the confirmed transactions. The old pattern is still in the chain, visible in earlier blocks.`,
      `The transaction data near {region} shows a shift in {faction}'s approach — a different pixel placement pattern in the current block window compared to what the chain shows for the previous window. The approach changed. The chain records the approach through its results. The results look different.`,
      `{faction} is doing something different near {region} than they were doing in the previous block window. The on-chain data shows it — the pixel targets changed, the placement pattern changed, the edit density changed. The chain records the new pattern. The old pattern is still in the ledger for comparison.`,
      `The pixel data near {region} shows {faction}'s edit strategy shifting in the current blocks. The chain holds both the previous approach and the new one — the previous one visible in earlier transactions, the new one visible in the current ones. What changed between them is not in the chain. What changed is in the results.`,
      `A break in {faction}'s edit pattern near {region} — the current block window showing a different kind of pixel placement than the blocks before it. The chain records the break as a change in transaction data. The chronicle records it as a strategic shift. Both readings are accurate.`,
      `The on-chain edit record near {region} has two distinct patterns from {faction}: the one that appears in blocks before a specific point, and the one that appears after. The point where the patterns switch is in the chain. What caused the switch is not. The new pattern is what matters now.`,
    ],
    afterContext: {
      TURNING_POINT: `The pattern reading made {faction}'s gridkeeper change course. Twenty-five entries of doing things one way, then seeing the pattern from outside, then deciding it needed to break. Near {region}, it broke.`,
      GREAT_SACRIFICE: 'After the sacrifice, something in {faction}\'s approach changed. Near {region}, a different kind of move — as if what was given had reoriented not just the capability but the direction.',
      THE_SILENCE: `The quiet gave {faction}'s gridkeeper time to rethink. The next move near {region} looked nothing like what came before the silence. The stillness was used for something.`,
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
      `The chronicle is approaching a threshold. The current pixel count is within a few entries of the next era boundary — the on-chain data accumulating toward a number that the chronicle marks as significant. The entries near that threshold carry a weight the individual transactions do not.`,
      `The Grid near {region} is active as the era threshold approaches. The on-chain data accumulating in the current blocks will push the chronicle across a boundary that, once crossed, changes how the story reads. Every confirmed edit in this block range is part of what the threshold represents.`,
      `An era threshold is close. The pixel count on the chain is within a small number of entries of the next significant mark. The edit activity near {region} in the current blocks will be part of what brings the count to that mark. These entries will be read later as the ones that closed the current era.`,
      `The chronicle marks the approach to era thresholds because the chain does not. The chain just adds blocks. Near {region}, the blocks being added right now are the last ones before the count crosses into a new era. The edit data in these blocks is part of the closing of something.`,
      `The count is near the threshold. The on-chain data accumulated across the current window — the pixel totals, the transaction count, the block range — is close to the number that marks a new era in the chronicle. What gets confirmed in the next few entries will be part of the turning point.`,
      `Near {region}, the Grid is adding the edits that will bring the chronicle to its next era boundary. The chain records each one without reference to the threshold it is approaching. The chronicle knows the threshold is coming. The edit activity in this block window will be part of crossing it.`,
      `The era boundary is a few entries away. The on-chain data near {region} — pixel placements, transaction confirmations, the steady addition of edits to the chain — is accumulating toward it. What gets placed in these blocks will be part of the record that closed the current era.`,
      `The chronicle's account of {region} is approaching a marker. The pixel count on-chain, the transaction total, the entry number — all converging on the threshold that separates one era from the next. The edits being confirmed near {region} right now are the last ones before the chronicle has to open a new chapter.`,
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
      `Near {region}, token activity that belongs to neither {faction} nor {rival} — a presence confirmed in the chain but not aligned with the main conflict's factions. The Grid does not enforce allegiance. The chain records edits from any token. This edit is from one outside the current account.`,
      `An unaligned transaction near {region}. The token placing pixels does not appear in the chronicle's account of either {faction} or {rival} — its edit history placing it outside the main conflict, its current transaction landing in a contested zone from a position of declared non-participation.`,
      `The pixel placement near {region} in the current block came from a token not associated with the main factions in the chronicle's account. The chain records it without distinction — a confirmed edit is a confirmed edit. The chronicle distinguishes: this one comes from outside the conflict's current sides.`,
      `Neutral activity near {region} — a token confirmed in the current block whose edit history does not connect it to either main faction's pattern. The Grid holds all pixels equally regardless of who placed them. The chronicle notes when a placement comes from outside the known factions.`,
      `The transaction near {region} is in the chain — confirmed, permanent, part of the ledger. The token that placed it is not part of either {faction} or {rival}'s known activity pattern. Neutral presences on the Grid are real. They place pixels. The pixels are in the chain.`,
      `{region}'s pixel data includes activity from a token the chronicle has not previously associated with either side of the conflict. The chain confirms the transaction without commenting on the token's allegiance. The chronicle notes it: a pixel placed by a presence outside the main account of the conflict.`,
      `The Grid near {region} holds a pixel placed by a token that belongs to neither {faction} nor {rival} in the chronicle's accounting. The chain does not keep faction records. The ledger just confirms edits. This edit is confirmed. The token that placed it is neutral in the current story.`,
      `Unaccounted activity near {region} — a confirmed transaction from a token whose edit history does not fit the pattern of either main faction. The chain records it. The chronicle notes it. Neutral presences complicate the binary account of the conflict in ways that the chain reflects accurately.`,
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
      `One pixel. Near {region}, a single confirmed edit — the minimum meaningful action on the Grid. The chain records it at the same resolution it records everything: block number, transaction hash, pixel count. The pixel count is one. The chain records it exactly the same.`,
      `The minimum edit near {region}: one pixel, one transaction, one confirmed block entry. The Grid does not have a resolution below this. The chain records the single pixel with the same permanence it records everything. One pixel is in the chain near {region}. It will not un-confirm.`,
      `A single pixel near {region}, placed in the current block and confirmed by the chain. The edit count is one. The transaction is permanent. The chronicle notes minimum edits because the chain records minimum edits — every pixel placed on the Grid is in the ledger, including this one.`,
      `The chain near {region} shows one confirmed pixel in the current block. One transaction, one edit, one pixel added to the Grid's on-chain record. The chain confirms minimum edits with the same authority it confirms maximum ones. This minimum edit is confirmed.`,
      `Near {region}, the chain confirms a single-pixel edit. The transaction is in the block — one pixel, one token, one block number, one hash. The Grid is forty by forty pixels. Each of those pixels, when placed and confirmed, is a permanent fact in the chain. One more is a permanent fact now.`,
      `One pixel placed near {region}. The chain records the transaction: a single confirmed edit, minimum pixel count, specific block. Whether this is exploratory, deliberate, or incidental, the chain does not say. The chain says: this pixel was placed, at this block, and the chain confirms it.`,
      `The minimum meaningful edit on the Grid is one pixel. Near {region}, one was confirmed in the current block. The chain records it. The chronicle records it. The Grid reflects it. Small confirmed facts are still facts. This one is in the chain.`,
      `A ghost mark near {region}: one confirmed pixel, one transaction, one block. The chain holds it the same way it holds everything else — immutably, permanently, in sequence. The pixel is there. It was not there before this block. It will not disappear from the chain after.`,
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
      `Activity near {region} includes a transaction from a token whose edit history connects it to zones outside the current chronicle's main focus. The on-chain data shows a presence that moves between areas — its history spanning a wider range of the Grid than the tokens at the center of the current conflict.`,
      `The token near {region} in the current block has an edit history that connects it to other parts of the Grid — transactions from zones not currently in the chronicle's primary account, a pattern of movement across the chain's ledger that places this token between stories rather than inside one.`,
      `A token with a cross-zone edit history placed near {region}. The chain shows its previous transactions in other zones — its presence in the Grid extending beyond the current contested territory, its history a record of activity across a wider range of the forty-by-forty than the current conflict covers.`,
      `The chain's record near {region} includes a transaction from a token whose edit history spans multiple zones. Not concentrated in one territory — distributed across the Grid's ledger, appearing in different coordinates across different blocks. The token connects zones the chronicle covers separately.`,
      `The token near {region} has been places. The chain holds its history across multiple block ranges and multiple zone coordinates — a presence that has moved across the Grid rather than focusing in one contested area. Its current transaction near {region} is one point in a longer, wider on-chain history.`,
      `Cross-zone activity near {region} — a token with confirmed transactions in other parts of the Grid also placing pixels in the current contested zone. The chain holds the full history: other zones, other blocks, and now this transaction near {region}. The token connects different parts of the ledger.`,
      `The token placing pixels near {region} has an edit history that extends beyond {region}. The chain shows it — previous transactions in other zones, a pattern of activity across the Grid's full coordinate range, a presence that appears in the chronicle when it arrives and disappears when it moves on.`,
      `Near {region}, a transaction from a token whose chain history places it in the category of cross-zone movers — tokens whose edit records span multiple areas of the Grid, whose transactions appear in different zones across different eras, whose on-chain story is about movement rather than settlement.`,
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
      `Forty entries in the chronicle. The on-chain data that corresponds to this block range: forty confirmed transactions, a pixel total that represents forty moments of Grid activity, a ledger forty entries longer than it was at the previous long-count mark. The Grid is forty by forty. The count reflects it.`,
      `The chronicle reaches forty entries. The chain that underlies this chronicle has added many blocks since the first entry — each one permanent, each one part of the ledger that the forty entries have been describing. The forty-entry mark forces a reading of the accumulated data as a whole.`,
      `At forty entries, the chronicle step back from the transaction level to the sequence level. What forty confirmed edits describe, read together: a Grid that has changed shape in a consistent direction. {faction}'s presence near {region} represents the largest concentration of those forty entries' activity.`,
      `Forty is the Grid's number — forty columns, forty rows. The chronicle marks every fortieth entry because the number means something specific here. The forty entries just completed in the ledger describe a Grid that has moved in a direction. The direction is in the data.`,
      `The forty-entry count falls here. The block range that corresponds to these forty chronicle entries contains the full record of how the Grid's pixel distribution has shifted during this window. Read in aggregate: {faction} gained, {rival} responded, {region} was most contested. That is the forty-entry summary.`,
      `The chronicle reaches its forty-entry mark. The on-chain data for this span: transactions distributed across the Grid, with concentration near {region}, showing a consistent directional shift in {faction}'s favor that no individual entry shows clearly but that forty entries together make undeniable.`,
      `Forty chronicle entries. The pixel data across the corresponding blocks: a record of incremental Grid changes that, viewed individually, look like noise and, viewed as forty consecutive entries, look like a direction. The direction is in the chain. The forty-entry view reveals it.`,
      `The long count at forty. The chain contains the transactions for every one of these forty entries — the pixel placements, the block numbers, the token addresses, the confirmation data. What those forty entries amount to, read as a sequence: a Grid that moved. The movement is in the ledger.`,
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
      `The edit rate near {region} is low but the tokens are still present — the chain showing small, infrequent transactions from active addresses rather than the high-frequency pushes of contested periods. The Grid between battles is not empty. It is resting.`,
      `Near {region}, the current block range shows light activity — confirmed transactions but not at the pace of a contested period. The tokens are in the Grid. The pixel placements are in the chain. The tempo is different. This is what the Grid feels like between the significant moves.`,
      `The chain is adding blocks near {region} with small confirmed edits rather than large ones. Light pixel counts, infrequent transactions, the Grid's contested zone stable while activity continues at a lower level. This is not a silence. It is a lower register of the same activity.`,
      `Between major pushes, the Grid settles into a slower rhythm. Near {region}, the current block data shows that rhythm — transactions present but infrequent, pixel counts low, the chain recording the quieter activity that happens when the main contest is between rounds.`,
      `The on-chain data near {region} in the current block window: small edits, light transaction density, the Grid active but not contested at the same level as during the recent pushes. The chain records everything at the same resolution. The resolution right now shows a lower tempo.`,
      `Low-intensity activity near {region} — the chain confirming edits but at a pace and scale that falls below the contested threshold. Pixels are being placed. Transactions are being confirmed. The tempo is different from a push. This is the Grid operating in the space between larger moves.`,
      `The blocks near {region} right now contain confirmed edits, but small ones — the pixel activity lower than it was during the recent contested period, the transaction frequency down, the Grid settling into the kind of on-chain state that precedes the next significant move.`,
      `Near {region}, the Grid is active at a lower register. The chain is confirming transactions — a few pixels here, a few there — but without the density that characterizes contested periods. This is not the silence that comes from inactivity. It is the quieter activity that happens while the main contest pauses.`,
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
      `{faction} has appeared in three separate entry windows near {region}. The chain holds each transaction — different blocks, consistent presence, the same zone showing up in the edit history across a span that marks a pattern rather than an incident. Three appearances. A pattern.`,
      `The chronicle marks the third appearance of {faction}'s concentrated activity near {region}. The chain holds all three — three separate block windows, three clusters of confirmed edits, three moments when this faction's pixel presence in this zone was notable enough to record. The pattern is legible in the data.`,
      `Three entries, same zone. {faction}'s edit history near {region} now spans three separate chronicle entries — each one representing a distinct block window of activity, together describing a sustained claim on the territory that the chain records as fact.`,
      `A dynasty on the Grid is not declared. It is confirmed in the chain — transaction after transaction, entry after entry, the same faction's pixel presence appearing in the same zone across enough separate blocks that the accumulation becomes the claim. {faction} near {region} is at three.`,
      `The on-chain record near {region} shows {faction}'s presence in three separate chronicle periods. Not continuous — there are gaps in the chain between them — but consistent enough to describe a sustained relationship between this faction and this zone. The third entry joins the first two.`,
      `{faction}'s edit history near {region} across the chain: three distinct windows of confirmed activity, each window visible in the ledger as a cluster of transactions, the three clusters together describing a pattern of return that the chain records and the chronicle recognizes as dynasty.`,
      `Three times {faction} has appeared in the chronicle's account of {region}. The chain holds all three appearances — the transactions, the block numbers, the pixel counts. Together, three appearances of confirmed activity in the same zone across separate periods means: this faction has claimed this territory repeatedly.`,
      `The third appearance of {faction} near {region} in the chronicle's record completes a pattern the first two appearances suggested. Three confirmed windows of activity in the same zone, readable in the chain as separate clusters of transactions. The pattern is in the data. The data is in the chain.`,
    ],
    afterContext: {
      VETERAN_RETURNS: `{faction}'s gridkeeper returned to {region} and made it three. The return was also the third entry — the one that turned a pattern into a dynasty. Both facts at once.`,
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
      `{faction}'s edit history shows activity at coordinates near {region} that have not appeared in their previous chain record. New territory — the first confirmed edit from this faction in this part of the Grid, the chain opening a record for a zone it had not previously associated with {faction}'s activity.`,
      `The chain near {region} shows a first edit from {faction} — no previous transactions from this faction in this zone, no prior pixel history here. The record opens now. What {faction} places near {region} going forward will build from this first confirmed entry.`,
      `New coordinates for {faction}. The on-chain data near {region} shows this faction placing pixels in a zone their previous edit history has not included. First transaction, first confirmed pixel, first chain record linking {faction} to {region}. The Grid's record of {faction}'s territory expands.`,
      `{faction} has extended their on-chain presence to {region}. The chain shows the first edit — a token from {faction}'s pattern of activity placing pixels at coordinates not previously associated with that pattern. The extension is real. The pixel is confirmed. The territory record grows.`,
      `The chain gains a new connection: {faction} and {region}, in the same confirmed transaction for the first time. The pixel placed is the first pixel from this faction in this zone. The first pixel is the foundation of everything the chain might record about {faction} and {region} after this.`,
      `First entry near {region} from {faction}. The chain holds it — a confirmed transaction, a specific block, a pixel placed at coordinates not previously part of {faction}'s on-chain territory. First appearances in new zones look like this in the ledger: a single transaction with no prior context.`,
      `The on-chain record expands near {region}. {faction}'s edit history, which had not included this zone, now does — one confirmed transaction, one new data point, the chain connecting this faction to this territory for the first time. The connection is permanent.`,
      `{faction}'s pixel presence on the Grid grew today. The chain confirms their first edit near {region} — a new zone entered, a new territory opened, the ledger adding a connection between this faction and these coordinates that did not exist before this block.`,
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
      `The chain near {region} shows sustained low-level activity — consistent small edits across multiple blocks, the pixel count growing steadily without large individual transactions. This is the Grid's maintenance work: not the pushes that get chronicled, but the persistent activity that keeps a zone held.`,
      `The on-chain data near {region} across recent blocks: consistent small edits, low per-transaction pixel counts, steady frequency. The pattern describes maintenance rather than expansion — {faction} keeping their on-chain presence in the zone confirmed without making a major push.`,
      `Sustained edit activity near {region} — not high-intensity, but consistent. The chain shows a steady stream of small confirmed transactions from {faction}, each one adding pixels in small amounts to a zone their previous entries have already established. Maintenance looks like this in the ledger.`,
      `The chain near {region} shows the work that holds territory rather than takes it: small, frequent confirmed edits from {faction}, each transaction modest in pixel count, together describing a sustained presence that the chain records as a pattern of consistent activity rather than a single notable event.`,
      `The pattern of {faction}'s edit activity near {region} in recent blocks describes sustained presence rather than active contest — small pixel counts per transaction, consistent block frequency, the chain recording a mode of activity that keeps the zone's on-chain state stable.`,
      `Low-intensity but consistent edit activity near {region} from {faction}. The chain holds the sequence — multiple small confirmed transactions across recent blocks, each one modest, together representing a form of Grid activity that the chronicle describes as maintenance of established territory.`,
      `The on-chain record near {region} shows {faction}'s consistent small-scale activity — the kind that holds rather than expands, that confirms rather than contests. Multiple small edits across multiple blocks. The pixel counts are low. The frequency is high enough to constitute presence.`,
      `Near {region}, the chain shows {faction}'s background activity — the steady, low-drama series of small confirmed edits that keeps a zone in the on-chain record as held territory. Not a push. Not a contest. The quiet work of maintaining what previous pushes established.`,
    ],
    afterContext: {
      GREAT_BATTLE: `After the big push, {faction} secured the routes through {region}. Holds do not hold without supply lines. {faction}'s gridkeeper knows this. The work happened fast.`,
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
      `The chain near {region} confirms a low-frequency window of consistent edit activity — small transactions, steady presence, {faction}'s pixel placement maintaining the zone's on-chain state across a block range where nothing significant changed but nothing was lost either.`,
      `The current block window near {region} shows {faction}'s consistent low-level presence — small confirmed edits, nothing dramatic, the chain recording the kind of activity that maintains a position between contests. The Grid during a watch looks like this in the ledger.`,
      `Near {region}, the chain is confirming small edits from {faction} across the current block range. The pixel counts are low. The transactions are consistent. Nothing significant is happening, and nothing significant is being lost. This is what holding looks like in the on-chain record.`,
      `The on-chain data near {region} shows steady, quiet edit activity from {faction} — consistent small transactions across the current block window, the zone's pixel distribution holding stable. The chain confirms that the zone is being maintained. The maintenance is visible in the data.`,
      `A quiet block window near {region}. The chain shows {faction}'s activity as consistent but modest — small pixel counts, regular transaction frequency, the Grid's contested zone stable under light on-chain attention. The watching is in the data. The data shows the zone is watched.`,
      `The chain near {region} is recording small, consistent edits from {faction} across the current block range. No major transactions. No significant pixel pushes. The zone's state is stable. The activity that keeps it stable is in the ledger as a pattern of quiet, steady confirmations.`,
      `Near {region}, the on-chain record shows the kind of activity that does not generate chronicle entries under most conditions: small, consistent, undramatic. But it is there in the chain — {faction} placing small numbers of pixels in steady succession, the zone holding, the ledger recording the maintenance.`,
      `The block data near {region} in the current window: small confirmed edits from {faction}, low per-transaction pixel counts, steady frequency. The Grid is being watched in the way the on-chain record shows watching — consistent presence, minimal drama, the zone's state maintained through quiet persistent activity.`,
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
      `The blocks after the major edit event near {region} show a different kind of activity — lower intensity, more distributed, {faction} consolidating what the push established rather than pushing further. The chain records this phase of Grid activity too. It looks different from the push.`,
      `Post-push data near {region}: the chain showing {faction}'s activity shifting from the high-density pixel placement of the main move to the lower-intensity confirmation activity that follows. The push is in the chain. The aftermath of the push is also in the chain.`,
      `The on-chain data following the major transaction at {region} shows the Grid settling — edit activity continuing but at lower intensity, the pixel distribution stabilizing around the new state {faction}'s push created. The push is over. The chain records what comes after.`,
      `The chain near {region} reflects a transition in {faction}'s edit pattern: the dense transaction cluster of the main push, visible at a specific block range, followed by sparser but consistent activity in the blocks after. The push established the new state. The aftermath maintains it.`,
      `After the main event at {region}, the on-chain data shows {faction}'s activity consolidating — smaller edits, lower frequency than during the push, the Grid's new pixel distribution settling into the state the push created. The chain records the push and the settling with equal permanence.`,
      `The block range following {faction}'s major edit at {region} shows the Grid in a different mode — activity continuing, but at the slower, more maintenance-oriented pace that follows a successful push. The chain holds the push and the aftermath as part of the same sequential record.`,
      `Aftermath data near {region}: the chain confirming {faction}'s continued presence after the major transaction, but in the lower-intensity form of consolidation rather than expansion. The major edit is in the chain. The edits that solidify it are also in the chain. Both are permanent.`,
      `The on-chain record near {region} contains the main push and what came after it — the high-intensity transaction cluster that changed the zone's pixel state, and the subsequent lower-intensity activity that confirms the new state across the following blocks. The chain records both phases equally.`,
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
      `The Grid's edit rate has accelerated. The chain near {region} shows a higher transaction frequency than previous windows — more edits per block range, larger pixel counts per transaction, the on-chain data moving faster than it has in recent entries. The acceleration is in the ledger.`,
      `The on-chain transaction rate near {region} has increased. The current block window contains more confirmed edits than the previous one, with higher pixel counts per transaction. The chain records acceleration the same way it records everything — in the block data. The acceleration is visible there.`,
      `The chain near {region} is moving faster than it was. The number of confirmed transactions per block range has increased, the pixel counts are higher, the edit frequency is up. The ledger is adding facts about {region} faster than it was. That change in rate is itself a fact in the chain.`,
      `An acceleration in the on-chain data near {region}: the transaction frequency up, the pixel counts per edit higher, the chain confirming more activity in the current block window than in previous comparable windows. The Grid near {region} is moving faster. The chain shows the rate change.`,
      `The block data near {region} shows an escalation in edit activity — higher frequency of confirmed transactions, larger pixel counts, the chain recording a denser period of Grid activity than the recent baseline. What is happening near {region} is happening faster than it was.`,
      `The current block window near {region} contains more confirmed edit activity than previous windows. The chain shows the increase — more transactions, more pixels per transaction, a faster rate of change in the Grid's pixel distribution at {region}. The chain records rates. The rate has increased.`,
      `Edit frequency near {region} is up. The chain confirms it — more transactions in the current block range than in comparable previous ranges, higher pixel counts, faster movement in the Grid's on-chain state. The acceleration is in the data. The data is in the chain.`,
      `The on-chain record near {region} shows a dense cluster of confirmed edits in the current block window — more transactions than the baseline, larger pixel counts, the Grid moving faster at these coordinates than it has recently. The chain records the change in tempo. The tempo has changed.`,
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
      `The burn record in the chain has reached another threshold. The accumulated action points transferred through burn transactions across all tokens in the chronicle reach a count the chronicle marks — not because the chain marks it, but because the weight of the accumulated giving warrants acknowledgment.`,
      `The chain holds every burn transaction ever confirmed — each one a permanent record of action points transferred, capacity given, a token's edit ability reduced in exchange for something passed to others. The burn total has crossed another threshold. The chronicle counts because the chain does not.`,
      `Another mark in the burn ledger. The total action points transferred through confirmed burn transactions in the current account has reached a new threshold — each individual burn small in the chain's record, together accumulating to a number large enough that the chronicle stops to note it.`,
      `The chronicle tracks what the chain confirms: burn transactions, action points transferred, tokens that gave their capacity to the Grid's collective effort. The running total has crossed another threshold. The chain has it all — every burn, every block number, every transfer amount. The total is real.`,
      `The burn total has accumulated. The chain holds every contributing transaction — each burn event, each action point transfer, each token that ended its edit capacity to give that capacity to others. Together, those transactions add up to a number large enough to mark in the chronicle.`,
      `The on-chain burn record in the current chronicle window has reached a threshold. All the tokens that burned — each one permanent in the chain, each one a confirmed transfer of action points — have together produced a total that the chronicle marks because the scale of collective giving deserves marking.`,
      `The chain's burn records for the current era total a number the chronicle acknowledges. Not because any individual burn was larger than the others — each one is in the chain at its own scale. Because the accumulation of them, together, represents a quantity of given capacity that warrants its own entry.`,
      `Threshold in the burn data. The chain holds each transaction that contributed to it — every burn event, every action point transfer, every confirmed moment of giving in the Grid. The total is in the chain as an accumulation of individual permanent records. The chronicle marks the accumulation.`,
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
