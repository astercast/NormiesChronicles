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
  'Solen',        'Varun',       'Mira',
  'Neth',         'the Witness', 'Karas',
  'Deln',         'the Keeper',  'Aster',
  'the Pale One', 'Voro',        'the Elder',
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
    .replace(/{rival}/g, c.rival).replace(/{commander}/g, c.commander)
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
      '{faction} Take {region}',
      '{commander} Moves on {region} — and Takes It',
      '{region} Falls. {faction} Hold It Now.',
      'The Big Push: {faction} at {region}',
    ],
    bodies: [
      `{faction} hit {region} before sunrise. By the time {rival} understood what was happening, it was already over. {commander} had been planning this for a long time and it showed. {rival} held a meeting afterward. {faction} held a celebration.`,
      `No one expected it to be this fast. {faction} swept through {region} in a single push, changing so much so quickly that the old maps were useless by midday. {rival} will spend a long time figuring out how to respond.`,
      `{region} belongs to {faction} now. It did not yesterday. {commander} made that happen — a careful, heavy move that {rival} had no real answer to. Some wins feel close. This one felt final.`,
      `{commander} called it simple afterward. We went. We stayed. But there was nothing simple about what {faction} did to {region}. The ground changed hands completely.`,
      `The move on {region} was not a surprise to everyone. {faction} had been watching {rival}'s weak spots for weeks. When they moved, they moved on three points at once. {rival} tried to answer the middle. The edges were already gone.`,
      `Hours, not days. {faction}'s push through {region} lasted hours. When it was done, {commander} walked the new ground alone before anyone else was allowed in. {rival} sent a messenger. {commander} sent the messenger back with no reply.`,
      `{rival} will call it overwhelming force. {faction} will call it preparation. The difference is: {commander} has been imagining this exact move since the first time they looked at a map of {region}. Today the imagining became real.`,
      `The chronicle will mark this as the day {region} changed. What the chronicle cannot capture is the silence that fell over both sides when it was clear — that particular silence when something large and irreversible has just happened.`,
    ],
    phaseVariants: [
      {
        phase: 'siege',
        headline: 'The Stalemate Breaks — {faction} Move on {region}',
        body: 'After so long with neither side able to push, {faction} broke first — and broke well. The move on {region} was fast and decisive. {rival} had been ready for a small probe. They got everything {faction} had. {commander} is not someone who waits forever.',
      },
      {
        phase: 'reckoning',
        headline: '{faction} Make Their Final Move on {region}',
        body: 'This one feels different from the others. {faction}\'s push into {region} carries the weight of everything before it — all the smaller moves, all the long waits, all the choices that led here. {commander} knows it. So does {rival}. This is the move that will be remembered.',
      },
    ],
    afterContext: {
      GREAT_SACRIFICE: '{faction} moved on {region} the morning after the sacrifice. No ceremony. Just the move — heavier now, carrying the weight of whoever was lost. {commander} said nothing. The ground said everything.',
      THE_SILENCE: 'The quiet broke with everything {faction} had. A full push into {region} that shattered the stillness. {rival} had been resting. They should have been watching.',
      RELIC_FOUND: 'Finding {relic} changed the plan completely. {faction} moved on {region} earlier than anyone expected, before {rival} could act on the same information. {commander} saw the window and took it.',
      VIGIL: 'The vigil ended with a push. All that careful holding, and then {commander} committed everything to {region} at once. The threshold and the move arrived together.',
    },
  },

  SKIRMISH: {
    loreType: 'SKIRMISH', icon: '\u25C8',
    ruleApplied: 'Skirmish',
    ruleExplanation: 'A real fight — the line moves, pressure builds.',
    headlines: [
      '{faction} Push Into {region}',
      'A Sharp Exchange at {region}',
      'The Line Moves at {region}',
      '{commander} Tests {rival} at {region}',
    ],
    bodies: [
      `{faction} took the part of {region} they came for and held it. {rival} pushed back, but too late — the center had already moved. {commander} calls these clean wins. Not dramatic. Just: the line is further along than it was.`,
      `The fight at {region} was quick and real. {faction} moved, {rival} responded, and when it settled the front sat further in {faction}'s favor. Not a lot. Enough. The kind of enough that adds up.`,
      `{rival} will say they held {region}. Looking at where the line sits now, that is not quite right. {faction} took what they came for. {commander} knows the difference between a withdrawal and a retreat. So does {rival}.`,
      `Small moves make large facts over time. {faction}'s push at {region} was one of several like it — careful, directional. {rival} has started calling {commander}'s approach the slow water. The name fits.`,
      `{commander} ran the exchange at {region} personally. This was unusual. The result was the same as always — {faction} took ground — but the way it happened was more deliberate. More watched.`,
      `Two hours. That is how long the contest at {region} lasted. {faction} moved at first light, {rival} answered by midmorning, and by noon the line was settled in a new place. {commander} ate lunch. {rival}'s equivalent did not.`,
      `The rumor in {faction}'s camp is that {rival} expected a probe and got a push. The rumor in {rival}'s camp is that they held better than it looks. Both rumors are half true, which is how most rumors in this world work.`,
      `{faction} did not take all of {region}. They did not try to. {commander} identified one specific stretch — the highest point on the edge — and that is what they went for. They have it now. From there, everything in {region} looks different.`,
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        body: 'Everything is moving faster now. What used to take three careful moves collapsed into one sharp exchange at {region}. {faction} hit hard. {rival} answered fast. The ground changed before anyone could fully track it.',
      },
      {
        phase: 'siege',
        body: 'In a siege, every small move costs more than it should. The exchange at {region} was not dramatic but both sides paid for it — worn down by a fight that never seems to end. {commander} knows the math. So does {rival}. Neither stops.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: '{faction} kept pushing after {region}. They pressed the newly taken ground before {rival} could reset. {commander} calls it the second wave. It is still running.',
      THE_SILENCE: 'The silence broke quietly — a small push at {region}, not the explosion anyone expected. {faction} tested the ground. It held. They pressed on.',
      VETERAN_RETURNS: '{commander} came back and immediately sharpened the approach. The push at {region} was cleaner than anything in the recent entries. Experienced hands make a difference you can see.',
      GREAT_SACRIFICE: 'There is something in {faction}\'s movements after a sacrifice — a weight, a focus. The push at {region} had it. {rival} felt the difference without knowing where it came from.',
    },
  },

  BORDER_RAID: {
    loreType: 'BORDER_RAID', icon: '\u00b7',
    ruleApplied: 'Border Probe',
    ruleExplanation: 'A small deliberate mark at the edge — quiet but intentional.',
    headlines: [
      `A Mark Left at {region}\'s Edge`,
      '{faction} Move Quietly at {region}',
      'Something Changed at {region} Overnight',
      'Small Move at {region} — Deliberate',
    ],
    bodies: [
      `A corner of {region} changed in the night. Small. Deliberate. {faction}'s people were gone before anyone looked. The mark is there now, and in this world small marks outlast the arguments about what they mean.`,
      `{commander} says: hold the edge and the center follows. The mark left at {region} was one precise point at the margin. {rival} will call it nothing. It is not nothing.`,
      `The probe at {region}'s border lasted one move. {faction} touched the edge, left their mark, and withdrew. In size, almost nothing changed. In what {rival} must now defend, a great deal did.`,
      `{faction}'s scouts know where the needle goes. They put it there at {region} and left. The mark is quiet. The mark is permanent.`,
      `It was not the first time {faction}'s scouts had been to this edge of {region}. The mark they left is slightly different from the last one. Those who know what to look for can read the difference. It says: we have been here before. We will be here again.`,
      `{rival} found the mark at {region}'s border two days after it was placed. By then {faction}'s scouts were long gone. {rival} spent an afternoon arguing about whether it was deliberate. It was deliberate. {commander} is methodical.`,
      `A single mark at the margin. {faction}'s scouts operate at the level of what can be dismissed as accident. That is exactly the level they want to operate at. By the time the accumulation is undeniable, it is also irreversible.`,
      `The edge of {region} is different this morning. Not noticeably — a casual observer would miss it. But the people who are paid to notice are noticing. {commander} received confirmation at dawn. The mark holds.`,
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
      'The Claim Is Filed — {region} Belongs to {faction}',
      `{commander}\'s Declaration: {region} Is Ours`,
      'No Room for Argument — {faction} at {region}',
    ],
    bodies: [
      `{faction} had already been at {region} for some time. Today they made it formal — a precise claim, stated clearly, delivered to {rival} before midday. {commander} did not ask for a response. Formal claims in this world do not ask. They tell.`,
      `There is a difference between holding ground and claiming it. {faction} has now done both at {region}. The holding came first. The claiming this morning was the part that goes in the record — exact, measured, not open to interpretation.`,
      `{rival} received {faction}'s declaration before finishing the morning reports. Every line was precise. Every term was defined. {commander} believes in clarity. {region} is a clear statement.`,
      `Some moves are about ground. Some are about what the ground means. {faction}'s formal claim at {region} is the second kind — it changes what the territory means, not just who holds it. The room went quiet when {rival} read it.`,
      `The declaration was nineteen lines. {commander} wrote it personally over two nights. When {rival}'s people read it aloud to their council, they stopped at line seven. Then they read it again from the beginning.`,
      `{faction} did not file the declaration the day they took {region}. They waited three weeks. {commander} wanted time to be certain the hold was real before making it official. The hold was real. The declaration is official.`,
      `Formal declarations are rare in this world. Most factions prefer to hold without stating — leaving room for retreat without looking like retreat. {faction}'s declaration about {region} closes that room deliberately. {commander} wants {rival} to know there is no retreat being planned.`,
      `The precision of {faction}'s claim is itself the message. Every line exact, every boundary measured. This is not the declaration of a group that is uncertain. {rival} has read it three times. The certainty is real.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The fight happened. Then the paperwork. {faction}\'s formal claim on {region} came after the ground was already taken. The declaration was not an argument. It was a record.',
      SKIRMISH: '{faction} fought for {region} and won it. Then they made the winning official. {commander} wanted it clear: this is not temporary. This is stated.',
      RELIC_FOUND: 'Finding {relic} changed the stakes. {faction}\'s formal declaration came fast — before {rival} could reframe what had been found or where.',
    },
  },

  GREAT_SACRIFICE: {
    loreType: 'GREAT_SACRIFICE', icon: '\u25b2',
    ruleApplied: 'Sacrifice',
    ruleExplanation: 'A life given completely — permanent, irreversible, felt by everyone.',
    headlines: [
      'One Gives Everything Near {region}',
      'The Sacrifice — What Was Given Cannot Return',
      '{faction} Loses One So Others Can Carry More',
      'It Cannot Be Undone — {commander} Witnesses',
    ],
    bodies: [
      `Near {region}, one of {faction}'s own gave everything. Not partially. Completely. So that the others could carry more. {commander} was there. What was given is gone. What it made possible is not.`,
      `There are no words for this that feel right. Someone near {region} dissolved so that others could go further. That is the fact. {rival} will feel the effect without knowing the cause. The cause is in this entry, quietly.`,
      `{faction} has not spoken about what happened near {region}. Some things are not spoken about. The chronicle records it because the chronicle records everything. One gave everything. Everyone else goes on.`,
      `{relic} stands at the place where it happened near {region}. Not a grave — there is nothing to mark a grave with. Just {relic}, and the understanding that what stood here is now in the people who continue.`,
      `The ones who received what was given near {region} know the weight of what they hold. They have not spoken about it directly. But {commander} watches how they move — more carefully, more deliberately, as if carrying something that must not be dropped.`,
      `{rival} noticed a shift in {faction}'s capabilities after what happened near {region}. Their analysts have several theories. None of the theories includes the true explanation. Some things in this world do not show up in the accounting.`,
      `The chronicle has many kinds of entries. This is one of the rare ones where the chronicler sets down the pen for a moment before writing. Not from uncertainty — from weight. Something was given near {region}. The record is permanent. The person is gone.`,
      `In the hours after what happened near {region}, {commander} walked alone. No one approached them. The silence that surrounded {commander} then is not the silence of respect — it is the silence of people who do not know what to say to someone who witnessed what {commander} witnessed.`,
    ],
    phaseVariants: [
      {
        phase: 'sacrifice',
        headline: 'Another Name Added Near {region}',
        body: 'The chronicle has too many of these entries now. What was extraordinary once is part of the rhythm — a life given, strength transferred, the world continuing with what remains. {commander} reads each one alone. There are many to read.',
      },
      {
        phase: 'reckoning',
        headline: 'A Final Giving Near {region}',
        body: 'In the late days, a sacrifice carries a different weight. The one who gave near {region} had seen the earlier ones. They gave anyway — not from desperation but from a clear-eyed understanding of what this moment needed. That is a harder kind of giving than desperation.',
      },
    ],
    afterContext: {
      THE_SILENCE: 'After the sacrifice the world went quiet. Not the quiet of rest. The quiet of a place where something enormous has happened and no one knows what to say yet.',
      GREAT_BATTLE: '{faction} moved on {region} the morning after the sacrifice. The timing was not coincidence. {commander} used what was given. That is what gifts are for.',
      SKIRMISH: 'The push at {region} felt different. There was a name behind {faction}\'s movements that had not been there before — someone who gave so these moves could happen.',
    },
  },

  OFFERING: {
    loreType: 'OFFERING', icon: '\u25b3',
    ruleApplied: 'Offering',
    ruleExplanation: 'A small gift freely made — the quiet work that sustains everything.',
    headlines: [
      'Something Given Near {region}',
      '{faction} Make an Offering',
      'A Transfer — The Record Notes It',
      'One Gives to Another',
    ],
    bodies: [
      `Not every gift changes the world. The one near {region} was smaller — something given from one who had it to one who needed it. These quiet transfers are how {faction} stays together between the big events.`,
      `The offering near {region} was quiet. No announcement. {faction} makes these regularly — a culture of small transfers that the outside eye misses. {commander} keeps a private count. It is longer than anyone would guess.`,
      `A small amount, given willingly. Near {region}, another offering — one of many, none individually dramatic, all adding up to something real. Both parties were back in position before evening.`,
      `Between the large events, the world is sustained by small ones. The offering near {region} is one of those — given without ceremony, received without spectacle.`,
      `{commander} does not attend the small offerings. They are not ceremonies that require witnesses. But {commander} knows about each one. The list is maintained. The people on it are treated accordingly.`,
      `The giving near {region} was voluntary. That matters more than the size. There are things in this world that can be taken, and things that can only be given. The offering was the second kind, which makes it worth more than any equivalent amount of the first kind.`,
      `Someone near {region} had more than they needed. Someone else had less. The transfer happened. The chronicle notes it not because it was dramatic but because the chronicle notes everything — including the quiet arithmetic of people taking care of each other.`,
      `{rival} does not have a practice like this. {commander} has noted the difference many times. The small offerings — unrequested, uncelebrated, consistent — are one of the reasons {faction}'s center holds when {rival}'s edges fray.`,
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
      'Given Again — Deeper Than the First Time',
      `{faction}\'s Most Committed Give a Second Time`,
      'The Oath Renewed Near {region}',
      'Twice Bound — No Going Back',
    ],
    bodies: [
      `They had already given once. They knew what it cost. They gave again. Near {region}, one of {faction}'s own renewed an oath that most would have considered already fulfilled. {commander} keeps a list of those who give twice. This name is on it now.`,
      `The first giving earns recognition. The second earns something different — quieter, more serious, impossible to put into ceremony. The one near {region} who gave again did not do it for recognition.`,
      `Near {region}, a second giving. The chronicle records it simply because there is no way to record it that matches what it actually is. Someone chose this twice. That is a kind of person. {faction} is made of that kind, at its center.`,
      `{faction} holds a quiet acknowledgment for those who give twice. Not a ceremony. Something between {commander} and the person who gave. It happened near {region}.`,
      `{commander} asked them afterward: why again? They did not answer immediately. Then: because the first time I was not sure I meant it. Now I am sure. {commander} wrote this down. It is in the private record.`,
      `The secondary register gains a name today. Those who have given twice are tracked separately — not because one giving is greater than the other, but because twice-given is a different category of commitment. Near {region}, the category gained a member.`,
      `Word of the second giving spread through {faction}'s camp quietly. No announcement. But people found out, as they always do in close quarters. The person who gave was looked at differently afterward — with the particular regard reserved for those who have passed a test most people will never face.`,
      `The cost of giving twice is not double the cost of giving once. It is something else entirely — the cost of doing a hard thing after you already know how hard it is. Near {region}, someone paid that cost. {commander} sat with it for an hour before responding.`,
    ],
    afterContext: {
      GREAT_SACRIFICE: 'The great sacrifice near {region} was followed by a smaller one — a second giving from someone who had already given. Watching the first one reminded them of what they had promised.',
      GREAT_BATTLE: 'Before the push on {region}, one of {faction}\'s own gave for the second time. {commander} did not ask them to. They did it because the moment called for it. Then the push happened.',
    },
  },

  VETERAN_RETURNS: {
    loreType: 'VETERAN_RETURNS', icon: '\u25c9',
    ruleApplied: 'Return',
    ruleExplanation: 'A known face comes back — experience changes everything.',
    headlines: [
      '{commander} Returns to {region}',
      'A Known Face Back at {region}',
      'They Have Been Here Before. They Are Back.',
      `{faction}\'s Veterans Move on {region}`,
    ],
    bodies: [
      `{commander} came back to {region} without announcement. By evening, {faction}'s position had shifted in small precise ways that only someone who had been here before would know to shift. {rival} noticed. They went quiet.`,
      `{faction}'s veterans who returned to {region} have already made every mistake it is possible to make here. They corrected those mistakes long ago. {rival} is now dealing with people who have answers to every question the territory raises.`,
      `Experience does not announce itself. {faction}'s veterans moved back into {region} efficiently — no wasted effort, no unnecessary noise. The difference is visible only in what they do not do.`,
      `The chronicle has {faction} at {region} before. The pattern of their returns is not random. {commander} comes back when the conditions are right. The conditions are right.`,
      `{commander} was asked why they came back to {region}. The answer was brief: because it is not finished. The people who heard this understood immediately. The people who did not hear it would understand eventually.`,
      `{rival} had adjusted to {faction}'s absence from {region}. They had stopped watching for the moves that characterized {commander}'s approach to this ground. That was a mistake. The return exposed the adjustment.`,
      `Some leaders read the ground. {commander} reads {region} the way readers read a language they grew up speaking — without visible effort, from habit, finding things in it that are invisible to those who learned it late.`,
      `The younger members of {faction} had heard stories about {commander} at {region}. Meeting the reality is different from the stories. {commander} is quieter than the stories suggest. More precise. The stories emphasize the wins. {commander}'s attention is on the next one.`,
    ],
    afterContext: {
      THE_SILENCE: 'The quiet brought them back. {commander} used the pause to move, and {faction}\'s veterans settled into {region} while no one was watching the edges. The return will matter later.',
      GREAT_BATTLE: 'After the big push, {commander} came back to {region} personally. Not to celebrate — to check the work, tighten the positions, make sure what was taken is actually held.',
      TURNING_POINT: 'The pattern-reading sent them back. After the chronicle revealed what was happening, {faction}\'s veterans moved on {region} — not reacting, executing a plan that had been ready for exactly this moment.',
      GREAT_SACRIFICE: 'The sacrifice changed who was in the field. {commander} came back to {region} to fill the gap — not because they had to, but because that is what you do when someone gives everything.',
    },
  },

  NEW_BLOOD: {
    loreType: 'NEW_BLOOD', icon: '\u2192',
    ruleApplied: 'New Arrival',
    ruleExplanation: 'Someone new enters the Grid — the world grows.',
    headlines: [
      'A New Face at {region}',
      'Someone Arrives Who Has Not Been Here Before',
      'Unknown at {region} — The Chronicle Opens a File',
      'The World Grows: A Stranger at {region}',
    ],
    bodies: [
      `Nobody knew them. A new face at {region}'s edge — no history here, no connections, no prior record. {faction}'s watchers noted it and waited. Everyone is worth watching at the start.`,
      `The Grid draws people. What is being built and fought over here reaches beyond its own edges and calls in the curious. The one who appeared at {region} today is standing at the edge of something large, not yet knowing how large.`,
      `Every person in this world was new once. The one at {region} today is at that beginning — not knowing the history, not knowing the players. They will learn. For now, they are here.`,
      `{commander} notes every new arrival near {region}. New people are unpredictable in ways veterans are not. They sometimes break the rules in ways that turn out to matter.`,
      `The new arrival at {region} asked the wrong questions — not because they were stupid, but because they did not know which questions were the right ones. The veteran who answered them recognized the questions as the same ones they themselves had asked, once.`,
      `No allegiance yet. No history. No stake in how things have been. The one at {region} today brings none of the accumulated weight that makes everyone else in this world move the way they move. That makes them interesting to {commander}.`,
      `{faction} has been growing steadily. The new arrival at {region} is part of that growth. {commander} made a note. One more face that did not exist in the record yesterday.`,
      `The newcomer at {region} was careful. They watched before they moved, moved before they spoke, and spoke less than they knew. {commander} noticed. {rival} did not. {commander} filed the name.`,
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
      'Something Shifts at {region} — An Oracle Stirs',
      '{faction} Watch as the Oracle Moves',
    ],
    bodies: [
      `The Oracles are known in this world — faces that cannot be absorbed, predicted, or divided. They act rarely. When they act, the experienced people pay close attention. The one that moved at {region} had been still for a long time.`,
      `There is a tradition that says: when an Oracle moves, something else is already moving. The one at {region} had been absent from the record longer than anyone had tracked. Everyone is forming a theory. The theories will not agree.`,
      `{commander} has studied every Oracle movement in the old record. They share one quality: they arrive at the exact moment when their arrival changes the meaning of everything already happening. {region} just changed meaning.`,
      `The Oracles cannot be understood by the same logic that governs everything else. The one at {region} moved, and nothing happened immediately after. The people who have been here long enough know: immediately is not when Oracles work.`,
      `The Oracle's appearance at {region} was noted by twelve different people before anyone spoke about it. Then they all spoke about it at once. {commander} let the conversation run for an hour before saying a single word. The word was: wait.`,
      `Oracles do not explain themselves. The one near {region} appeared, moved, and was still again. {rival}'s analysts produced three documents. {faction}'s chronicler produced one sentence: the Oracle was here, and what it means is not yet clear.`,
      `{commander} kept a record of the last time this particular Oracle was visible. Seventeen entries ago. What happened in the seventeen entries that followed is part of the reason {commander} called an immediate meeting when word came from {region}.`,
      `The people near {region} when the Oracle moved all described the same thing: a shift in the quality of the air, a sense that the moment had weight it did not have before. The official report says only: Oracle observed at {region}. Both descriptions are accurate.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The Oracle appeared at {region} the day after the big push. Coincidence or the Oracle\'s definition of good timing. {commander} chose not to interpret it publicly. Privately, {commander} has thought of little else.',
      TURNING_POINT: 'The pattern the chronicle revealed brought the Oracle. Or the Oracle came and revealed the pattern. Near {region}, both arrived together.',
      THE_SILENCE: 'The silence ended with an Oracle. Not a push, not a declaration — an appearance. Near {region}, one of the Irreducibles simply became present. Neither {faction} nor {rival} knows what to do with that.',
    },
  },

  ANCIENT_WAKES: {
    loreType: 'ANCIENT_WAKES', icon: '\u25a0',
    ruleApplied: 'Ancient Stirs',
    ruleExplanation: 'One of the first wakes — these predate everything and they know it.',
    headlines: [
      'An Ancient Stirs at {region}',
      'One of the First Is Moving',
      'Before the Factions Had Names, There Was This One',
      'The Oldest Face at {region} — Moving Again',
    ],
    bodies: [
      `The ancients predate the factions. They predate the names of places like {region}. They predate the chronicle itself. When one of them moves, every experienced person in the Grid notices — not from obligation, but from the deep sense that it is a signal.`,
      `There is a list of those who were here before everything else. The one at {region} is on it. It has appeared in the record before — always at turns, always with a patience that makes everyone else look frantic.`,
      `{commander} keeps a separate record of the ancients. When one moves, {commander} reads back through what happened the last time. The last time was long ago. What followed was large.`,
      `The oldest in this world carry a weight that younger presences do not. When the ancient at {region} moved through the territory, people adjusted — even those who do not know the history. Some things are felt before they are understood.`,
      `The ancient at {region} has no faction. It predates the concept. {faction} and {rival} both watched it move and neither claimed it as allied. That neutrality, from something so old, is itself information. {commander} spent an evening thinking about what information.`,
      `How do you account for something when you do not know whose side it is on? {rival}'s analysts have been arguing about the ancient at {region} for days. {faction}'s chronicler simply logged it under its own category, the way the old keepers used to: Ancient. Observed. Reason: unknown.`,
      `The ancient at {region} moved slowly enough that three people watched the whole movement and could describe it in detail afterward. The details, when compared, were different in small ways that suggested each person had been watching something slightly different. {commander} interviewed all three.`,
      `In the early days of the chronicle, the ancients appeared regularly. Then less. Then rarely. The appearance at {region} is the fourth in the current era. The chronicler who tracks such things has flagged the number. Four is more than recent history suggests is normal.`,
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
      'The Far Edge Moves — Someone Arrives at {region}',
      'The Margins Have Been Watching. Now They Are Here.',
      'Word from Beyond the Known Territory',
      '{faction} Receives Arrivals from the Outer Grid',
    ],
    bodies: [
      `The far edge of the Grid is easy to forget. {commander} has never forgotten it. When arrivals appeared at {region} from beyond the usual range, {faction} was the only one who was not surprised.`,
      `The people of the outer reaches have been watching the main story from a distance long enough to decide what they want and when to move. What arrived at {region} had been thinking about this moment longer than anyone at the center had been paying attention to the margins.`,
      `{rival} did not see it coming because {rival} does not watch the edges. The arrival at {region} is the result of that consistent failure becoming visible. {faction} saw it coming.`,
      `There is a whole other story running in the outer Grid — quieter, slower, less dramatic. The one who arrived at {region} brings pieces of it. They carry {relic}. They did not find it in the center.`,
      `The arrival from the far reaches moved through {region} without immediately declaring anything. They watched. They asked small questions. They moved slowly enough that it was not alarming and purposefully enough that it was clearly intentional. {commander} recognized the approach.`,
      `{faction} made contact with the far-edge arrival at {region} before {rival} realized the arrival had happened. That timing was not accidental. {commander} had been maintaining quiet correspondence with the outer reaches for longer than the main chronicle reflects.`,
      `The outer reaches have a different read on the main story. The one who arrived at {region} described the current conflict the way someone from very far away describes a storm — in terms of direction and size and what it is heading toward, not in terms of who is right or wrong.`,
      `What the far-edge arrival brought to {region} was not resources or intelligence in the conventional sense. It was perspective — the view of someone who has been watching the whole shape of things from outside the shape. {commander} sat with them for three hours.`,
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
      'The Eternal Contest — {faction} at {region}',
      'Nobody Keeps {region}. {faction} Try Anyway.',
      'Another Exchange at {region}',
    ],
    bodies: [
      `{region} teaches one lesson repeatedly: nothing holds here. Every group that has had it has lost it. {faction} is the current holder. {rival} is the current challenger. This pattern is older than either of them.`,
      `{commander} has a theory about {region}: the fight is not about what it is worth. It is about what giving it up means. Neither {faction} nor {rival} can afford to be seen losing it. The ground is almost beside the point.`,
      `Another exchange at {region}. The chronicle notes it without surprise. This is what {region} does. Today {faction} holds what they came for. The line between holding and losing here is measured in hours.`,
      `{faction} took {region} from {rival}. {rival} will take it back. This is the permanent condition of {region}. {commander} holds it now and calls it a win. They have held it before. They know what that means.`,
      `There is a soldier's joke in {faction}'s camp about {region}: the fastest way to lose it is to celebrate holding it. {commander} does not celebrate. {commander} checks the defenses, updates the maps, and starts planning for the next exchange. The next exchange is coming.`,
      `{rival} does not understand why {faction} keeps coming back to {region}. From {rival}'s perspective, the ground is not worth the cost. That misunderstanding is itself an advantage for {faction}: {rival} fights reluctantly, while {faction} fights deliberately.`,
      `The fifth time a place changes hands, it stops feeling like victory or defeat. The exchange at {region} was witnessed by veterans on both sides who had the same thought: again. They fought anyway. That is what veterans do.`,
      `The chronicler has been tracking {region} since the early entries. No other location appears in the record more. It is not the most valuable territory. The chronicler has asked why it is the most contested. The answer from everyone asked is the same: because it is. Which is not an answer. But it is true.`,
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
      'Twenty-Five Entries — The Pattern Is Clear',
      'The Chronicle Reads Itself',
      'What the Last Twenty-Five Mean Together',
      'A Direction Becomes Visible',
    ],
    bodies: [
      'Read the last twenty-five entries in order. A pattern emerges that is invisible inside any single entry — {faction} moving consistently in one direction, {rival} responding rather than leading, {commander} always two steps ahead of what the record shows.',
      'Twenty-five entries in, the shape of the current story resolves. Not completed — resolved. {faction} has the initiative. {rival} has been reacting. {region} appears more than anywhere else. These three facts are related.',
      'The chronicle does not interpret. It records. But recording twenty-five events in sequence is a kind of interpretation — you cannot list that many things in order without a story emerging. The story is about {faction}. It is going somewhere.',
      'At the twenty-fifth entry, {commander} read the whole sequence aloud to the council. No commentary. Just the reading. When it was over, the room sat with it. The direction was clear. No one argued.',
      'Twenty-five entries. The chronicler counts them because the number matters — not magically, but because twenty-five events is enough to distinguish a pattern from noise. The pattern here is not ambiguous. {faction} is winning the pace of the story, which is different from winning any individual entry.',
      'The council that met to discuss the twenty-five-entry reading did not meet to make decisions. It met to agree on what it was seeing. Agreement took longer than expected. Not because the pattern was unclear — because its implications were uncomfortable. {commander} waited. The implications were faced.',
      `{rival} has access to the same chronicle that {faction} has. {rival} has also read the twenty-five entries. The difference is what both sides decided to do after reading them. {faction}'s response was to continue what was working. {rival}'s response was to change something that might not have been the problem.`,
      'Twenty-five entries into any sequence, the tempo of the story becomes legible. The tempo here: {faction} pressing, {rival} reacting, pauses occurring when {faction} chooses to pause and not when {rival} needs them. {commander} controls the tempo. Controlling the tempo means controlling the story.',
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
      '{faction} Are Everywhere — This Is Not Coincidence',
      `{commander}\'s Reach Extends Again`,
      'Every Entry: {faction}. The Pattern Is Clear.',
      `{faction}\'s Presence in the Chronicle Keeps Growing`,
    ],
    bodies: [
      `Count the entries. {faction} appears in more of them than anyone else. Not because they are lucky — because {commander} has built something systematic and patient that the chronicle is only now making visible.`,
      `{faction} is everywhere in the current record. {rival} shows up to react. Everyone else shows up around the edges. That is the structure of the story right now: {commander} at the center, everyone else responding.`,
      `The difference between being active and being everywhere is intention. {faction} has crossed that line. The entry at {region} is one more point in a configuration that was being built from the beginning.`,
      `{commander} calls it accumulated fact. By the time anyone questions whether {faction} belongs where they are, the fact of being there is too established to question.`,
      `{faction}'s presence in the current sequence is not accidental. Each appearance connects to the others through a logic that becomes visible only at this distance. From inside any single entry, {commander}'s strategy is invisible. From here, it is the only thing visible.`,
      `The map of {faction}'s appearances in the recent chronicle, if drawn, would show a shape. Not random — directed. {region} appears at the center of the shape. {commander} appears at the center of {region}'s appearances. The shape is the strategy.`,
      `{rival}'s chronicler has reportedly been producing analyses of {faction}'s pattern of appearances. The analyses keep arriving at the same conclusion: {faction} is everywhere, {commander} is the reason, and there is no obvious counter. The analyses are accurate.`,
      `Dominion is built entry by entry. No single appearance in the chronicle constitutes dominion. But {faction}'s appearances, counted together across the current sequence, describe a presence so consistent and wide that dominion is the only accurate word for it now.`,
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
      'The Grid Goes Quiet',
      'Nothing Moves — Both Sides Hold',
      'A Pause in the Chronicle',
      'Stillness at {region}',
    ],
    bodies: [
      `Nothing moved. No announcement — the activity just stopped. {faction} holds their positions. {rival} holds theirs. The ground between them is still. The ground is doing what ground does: waiting.`,
      `Silence in this world is never neutral. What has settled over {region} is the silence of two groups watching each other — each waiting for the other to move first, neither willing to give away information.`,
      `The chronicler records absences as carefully as presences. This gap in the activity near {region} tells a story about what both sides are calculating, what they are afraid of, what they hope the other will do.`,
      `It is quiet. After everything that happened near {region}, the world has gone still. Not because it is resolved — nothing is resolved. Because both sides are tired, or careful, or waiting for something the chronicle cannot yet see.`,
      `The silence at {region} has lasted long enough that both sides have started using it. {faction} is moving things that are easier to move in quiet. {rival} is doing the same. The silence is not rest. It is a different kind of activity.`,
      `{commander} said: let it be quiet. When asked for how long, {commander} said: until we know what {rival} is doing in the quiet. Silences are information problems. The silence at {region} is being worked.`,
      `The people at {region} who have been through silences before are the calmest. The veterans are using the quiet to sleep, eat well, and fix things that broke during the active period. The newcomers are imagining what is coming. Both are preparing.`,
      `How long can a silence last in this world? Longer than it feels from inside. The silence at {region} has already lasted longer than most expected. {commander} is not surprised. The signs say {rival} is not ready to move yet.`,
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
      'A New Age: {era}',
      'The World Is Different Now — {era} Begins',
      '{faction} Steps Into {era}',
      'The Chronicle Opens a New Chapter: {era}',
    ],
    bodies: [
      'There are moments when the weight of everything that has happened becomes, all at once, something new. The age called {era} has begun. The chronicle will look back at this entry and say: here is where the register changed. Here is where the old way of counting became inadequate.',
      'Ages do not announce themselves. They are recognized after the fact, by people who can see the whole arc. The arc has bent far enough that the chronicler names a new era: {era}. Both {faction} and {rival} are at this threshold. Both will understand later what today marks.',
      '{commander} said it this morning: things are different now. Not a profound statement. But said at this moment, in this tone, it names the turn. {era} begins here. Everything before this entry belongs to another chapter.',
      'The name {era} was not chosen by the chronicler. It emerged from the record itself — from what the accumulated entries, read in sequence, revealed about where the story had arrived. The new age is already in motion. The naming is the chronicle catching up.',
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
      'Two Paths Cross at {region}',
      'An Unexpected Meeting — No One Planned This',
      '{faction} and a Stranger at {region} — Same Moment',
      'The World Coincides',
    ],
    bodies: [
      `Nobody planned it. {faction} moved on {region} at the exact moment a completely separate presence moved through the same ground. The world paused before either side knew how to respond.`,
      `Convergences are their own kind of event — not strategy, not reaction, just the Grid producing an intersection. Two separate stories arriving at the same place at the same time. What they do now is the next entry.`,
      `{commander}'s philosophy on accidents: they reveal things that planning hides. The convergence at {region} revealed that two different stories had been running in the same space without knowing about each other. Now they know.`,
      `Of all the places two paths might have crossed, they crossed at {region}. In a world this dense, intersections are inevitable. What the two parties chose to do when they found themselves face to face is what the story is about.`,
      `The convergence at {region} was witnessed by people from both groups who had never seen each other before. The first few minutes were silence. Then someone said something practical about the ground they were both standing on, and the conversation started from there.`,
      `Neither party had intelligence about the other. They arrived at {region} in the same moment through completely different routes, having made completely different decisions that happened to point at the same place. {commander} called this the world's sense of humor.`,
      `The intersection at {region} could have gone badly. It did not. Both parties recognized that the convergence was not hostile before they recognized anything else about each other. What came after the recognition is what will appear in the next entries.`,
      `Convergences are catalogued separately by the chronicle because they follow a different logic than everything else. The one at {region} joins a list that is shorter than you would expect and more significant than any single entry on it suggests.`,
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
      '{relic} Found at {region}',
      'A Discovery That Changes Everything',
      '{faction} Find What Was Lost at {region}',
      '{commander} Reports the Finding',
    ],
    bodies: [
      `{relic} was not supposed to still exist. It was presumed gone — lost in an earlier season. {faction} found it by looking where everyone else had stopped looking. Word reached {commander} before the day was over.`,
      `The Grid holds things. Objects from earlier seasons, from before the current factions had their current names. {faction} found {relic} at {region} today — not hidden exactly, but lost in the way things get lost when no one has reason to look.`,
      `Some objects accumulate meaning over time regardless of what they are. {relic} is one of those. Its discovery at {region} changes what the territory means, which changes what the fight over it means, which changes everything adjacent.`,
      `The finding happened by accident, or by patience, or by both. {faction}'s people at {region} found {relic} and the chronicle changed shape around the discovery.`,
      `{rival} learned about the finding three hours after {faction} did. {commander} is not sure how — it was supposed to be kept quiet. The implications are not yet fully understood, and {rival} already knows. This has accelerated the timeline.`,
      `The last record of {relic} in the chronicle is from an early entry — before most current participants had appeared. Finding it at {region} now, in this moment, is the kind of thing that makes experienced chronicle-readers sit back and think about what the world is doing.`,
      `{faction}'s people who found {relic} have been asked not to discuss it until {commander} decides how to handle the announcement. They are not discussing it. But the way they are not discussing it is telling everyone who knows how to read silences that something significant has happened.`,
      `What is {relic} worth? The wrong question. The right question: what does its existence change? {commander} has been working on this question since the finding was reported. The list is longer than expected and includes several things {rival} is not going to like.`,
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
      '{faction} Call an Urgent Meeting',
      'The Plans Need Changing — Everyone Gathers',
      '{commander} Calls Everyone Back',
      'A Second Meeting — Something Changed',
    ],
    bodies: [
      `Two meetings in short succession means the world moved faster than the plan. {faction} gathered again near {region} before the first meeting's decisions were even acted on. Something changed. {commander} called it as soon as they knew.`,
      `Unscheduled meetings in this world mean one thing: a surprise. {faction} reconvened near {region}. {rival} probably knows. What {rival} does not know is what changed.`,
      `{commander} does not call urgent meetings without cause. The cause here was something {faction} did not anticipate — useful information about the limits of their foresight. The meeting is happening. The surprise is being processed.`,
      `A group that reconvenes when the situation changes is a group paying attention. {faction} near {region} is reconvening. {commander} prefers being accurate over being consistent.`,
      `The second meeting was shorter than the first. {commander} had already done the analysis — the meeting was not to analyze but to communicate conclusions. The conclusions were: the situation has changed, the previous plan does not apply, here is what applies now. Twelve minutes total.`,
      `Not everyone in {faction} knew about the urgent meeting until after it had started. {commander} moved fast. The people who arrived late caught up. The urgency was explained. The new direction was clear. Everyone left with specific instructions.`,
      `What required a second meeting so quickly: {rival} had done something unexpected. Not a crisis — a move that changed the value of certain positions. {commander}'s original plan depended on those positions having a certain value. The plan needed adjusting.`,
      `The council near {region} is {commander}'s way of distributing information and receiving it simultaneously. Twelve people in a room who all know different things. {commander} asks questions in a specific order. By the end, everyone knows what {commander} knows.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'The big push changed the situation faster than {faction}\'s plans had accounted for. An urgent meeting — what to do with the win, and how fast to press it.',
      GREAT_SACRIFICE: 'After the sacrifice, {faction} needed to meet. Not strategy — accounting. Who was gone, what they had given, what it meant. {commander} led it near {region}.',
      RELIC_FOUND: 'Finding {relic} required an immediate meeting. Everything {faction} had been planning assumed it did not exist. Now it does. The plans need rewriting.',
      THE_SILENCE: 'The quiet created space to think. {faction} used it — an unhurried meeting near {region}, with time for the thinking that busy moments do not allow.',
    },
  },

  CARTOGRAPHY: {
    loreType: 'CARTOGRAPHY', icon: '\u229e',
    ruleApplied: 'Mapping',
    ruleExplanation: 'The surveyors work — accurate maps are power in a shifting world.',
    headlines: [
      'New Maps of {region} — The Ground Has Changed',
      `{faction}\'s Surveyors Finish at {region}`,
      '{commander} Studies the Updated Charts',
      'What {region} Actually Looks Like Now',
    ],
    bodies: [
      `Maps are not neutral. {faction}'s surveyors at {region} produced a record that is also an argument — what exists and what matters. {commander} reviewed them personally. The new pictures are different from the old charts.`,
      `After a big shift, the old maps become wrong. {faction}'s surveyors corrected them at {region} — an accurate picture of what is now true, not what was true when the previous maps were made.`,
      `There is unglamorous work in this world, and surveying {region} is the most unglamorous kind — patient, precise, done in the spaces between events. The result is a corrected picture.`,
      `{faction} surveys after every major change. The surveyors who finished {region} found the shift was larger than estimated. The new maps reflect reality. The old ones are in the fire.`,
      `The survey team at {region} worked for four days. What they produced is not a simple map — it is a record of how the territory has changed since the last survey, with notations about which changes are recent, which are old, and which are still in progress. {commander} has been reading it since yesterday.`,
      `{rival} does not update maps as consistently as {faction} does. This creates a systematic advantage that is invisible in any single entry but visible across the full chronicle: {faction} is almost always working from more accurate information about the ground.`,
      `The cartographers at {region} found something the last survey missed — a feature of the territory that changes how the ground should be defended. They flagged it. {commander} saw the flag and rerouted two positions before the survey was formally submitted. Maps are intelligence.`,
      `Maps are how {faction} keeps institutional memory about territory. The survey at {region} is part of a continuous record that goes back to the early entries — a map updated every time the ground has changed significantly. Laid on top of each other, the maps show a history. {commander} studies that history.`,
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
      'The Old Stories Near {region}',
      'A Face That Remembers What Came Before',
      'Before the Factions Had Names — Near {region}',
      'Someone Who Was Here at the Beginning',
    ],
    bodies: [
      `The oldest faces carry history the current chronicle has not recorded. Near {region}, one of them spoke — not of strategy, but of pattern. This place has been like this before, they said. Not exactly like this. Close enough to make them careful.`,
      `Before {faction} and {rival} had their current names, other groups fought under other names. The ancient presence near {region} remembers them. Most of what they carry from that time is not useful. Some of it is exactly what this moment needs.`,
      `{commander} is not usually interested in old stories. But the ancient near {region} described a pattern, not a story. The current situation rhymes with something from the deep record. {commander} is reading the ending of that earlier story tonight.`,
      `The old ones near {region} do not come without reason. Their appearance is a signal — this moment resembles something they have seen before. {faction} is listening carefully.`,
      `The ancient presence near {region} did not offer advice. They offered description: this is what it looked like before, this is what happened next, this is where that led. Whether the current situation follows the same path depends on choices not yet made. Then they left.`,
      `{commander} has met the ancient near {region} before, in earlier entries. The meetings share a quality: the ancient always appears to be waiting, as if they knew {commander} would be coming before {commander} knew it themselves. This time was no different.`,
      `The deep record contains several appearances by the figure near {region}. Reading them in sequence, a pattern emerges in when they appear: at turns. At moments when the story is about to change direction. This is one of those moments.`,
      `The old ones who appear near {region} are not welcome to everyone. Some in {faction} find their presence uncomfortable — the sense of being watched by something with a much longer perspective than your own. {commander} finds it clarifying. The long perspective is what {commander} came to hear.`,
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
      'A Known Face Has Gone Quiet',
      'Someone Left Near {region} — No Explanation',
      '{faction} Notes an Absence',
      'Gone — The Record Holds the Gap',
    ],
    bodies: [
      `The chronicle tracks absences. Someone who was consistent near {region} has stopped appearing — everything where they left it, no sign of conflict, just: gone.`,
      `People leave this world for many reasons. The one near {region} gave none — no announcement, no explanation, just a gap in the record where someone used to be.`,
      `Not every departure is a desertion. {commander} calls those who leave without explaining themselves journeyers — possibly active somewhere outside the chronicle's range, possibly done.`,
      `The record shows the absence, not the reason. Near {region}, a consistent presence stopped being present. Gaps in a record are also information.`,
      `{commander} has noted the absence from {region} and made a decision not to investigate it. Some departures require space to be what they are. Investigating too quickly sometimes closes doors that would otherwise stay open.`,
      `The person who left near {region} was well-regarded in {faction}. Their empty spot in the formations, the tasks that were theirs now distributed among several others, the conversations that would have included them that now do not. Absence has a shape in a close group.`,
      `Three weeks since the last entry for the one near {region}. The threshold at which the chronicle reclassifies someone from absent to departed depends on context. In this context, three weeks feels like departure. The classification has been updated.`,
      `The departure from {region} may be temporary. The chronicle does not know. The chronicle notes that it has logged returns from longer absences than this one. The note is not optimism. It is accuracy. The record is kept open.`,
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
      'Ten More — The Tally',
      'The Chronicle Counts What Has Accumulated',
      'Ten Entries Read Together',
      'The Running Count',
    ],
    bodies: [
      'Every ten entries the chronicle steps back and counts. Ten entries. In them: {faction} present in most. {rival} responding. {region} mentioned more than anywhere else.',
      'Ten entries. Some big, some small. Movement, silence, arrivals, gifts. The texture across ten entries: busy, directional, building toward something.',
      'The tally shows what accumulated, not what happened. Across the last ten: more arrivals than departures. More pressure than resistance. A weight building near {region} that has not resolved yet.',
      '{commander} reads the tally in private. The count shows {faction} leading, {rival} reacting, and a center of gravity near {region} that everything else orbits.',
      'Ten entries, counted: four territorial moves, two comings and goings, one discovery, one meeting, one silence, one chronicle marker. Nine of the ten featured {faction} in some role. Six of the ten featured {commander} by name. The tally describes a story with a protagonist.',
      'The ten-entry tally is not glamorous work. It is the work of a chronicler who believes that the shape of events is visible in aggregate if not in individual entries. The shape of the last ten: directional. Pointed at something. Not arrived yet.',
      'Both {faction} and {rival} have access to the tally. The fact that they read the same numbers and draw different conclusions is itself significant. {faction} reads the last ten entries and sees momentum. {rival} reads the last ten entries and sees a challenge to be answered. Only one of these readings is accurate.',
      'The count, for those who find numbers useful: {faction} mentioned in seven of the last ten entries. {rival} mentioned in four. {region} mentioned in six. {commander} mentioned in five. {relic} mentioned in two. The numbers describe a story. Whether the story continues in the same direction depends on the next ten.',
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
      'A Face Returns — Long Gone, Back Now',
      'They Were Absent Long Enough to Be Written Off',
      '{faction} Hears from Someone Who Disappeared',
      'Back from the Quiet',
    ],
    bodies: [
      `They had been gone long enough that the chronicle had stopped leaving space for their return. The presence that appeared near {region} was last recorded so long ago that most people had stopped thinking of them as active.`,
      `The secondary record — for those absent long enough to be reclassified — had this one listed. The appearance near {region} removes them from it and puts them back in the active chronicle.`,
      `{commander} received the news with the expression of someone whose long-held assumption just became fact. They had always thought this person would come back. The conversation {commander} had been preparing is ready.`,
      `Some go quiet and stay quiet. Some go quiet and return. The one near {region} is the second kind. What they bring back will show in the entries that follow.`,
      `The first question everyone asked about the returned presence near {region} was: where were they? The returned presence did not answer directly. They answered a different question — what are things like now? — which suggested they were more interested in the present than in explaining the past.`,
      `The return near {region} was handled quietly by {faction}, which is how {commander} handles things that require thought before response. The returned presence was received, their situation assessed, their intentions understood. The assessment is ongoing.`,
      `{commander} met with the returned presence from {region} for two hours. What was discussed is private. What the meeting produced is visible in {commander}'s decisions in the entries that follow: something has changed in how {commander} is thinking about the near term.`,
      `The secondary record is maintained because returns happen more often than endings in this world. The returned presence near {region} is the third in the current era. The pattern suggests: the world pulls people back. The pull is real.`,
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
      'Given Twice — The Cost Is Real',
      `{faction}\'s Most Committed Give Again`,
      'The Oath Returns and Is Renewed',
      'Twice in the Record Near {region}',
    ],
    bodies: [
      `The register of those who have given twice is shorter than the main record and heavier to read. Near {region}, it gained a new entry. Someone who had already given gave again.`,
      `The first giving earns recognition. The second earns something different — quieter, more serious, impossible to put into ceremony. The one near {region} who gave again knew what it cost.`,
      `What accumulates in a person after giving twice is visible to those who know what they are looking at. {faction} has people like this. The one near {region} has joined them.`,
      `Future readers will see this name twice in the secondary register and understand what that means. The commitment was not provisional. It was a character.`,
      `The second giving near {region} was not requested. {commander} did not ask. The person who gave came to {commander} and said only: I am giving again. {commander} said: I know. The conversation ended there. Both understood what there was to understand.`,
      `{faction}'s secondary register was not designed to hold many names. It was designed to hold the names of those who give twice, which was expected to be rare. It is not as rare as expected. The name added near {region} joins a growing list.`,
      `The cost of giving twice is not double the cost of giving once. It is something else — the cost of doing a hard thing after you already know how hard it is. The person near {region} knew. They gave anyway.`,
      `There will not be a ceremony for the second giving near {region}. The second giving is more private, more final, more clearly about meaning and not recognition. {commander} noted it. The secondary register has it. That is enough.`,
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
      'What the New Arrivals Think Is Happening',
      'A Story Told Near {region} — Close, But Not Right',
      'Fresh Eyes at {region}',
      'The Version of Events the World Tells Newcomers',
    ],
    bodies: [
      `The version the new arrivals carry is recognizable but wrong in its proportions. {faction} is more powerful than it is. {rival} is more desperate. The texture — the small accumulated facts that make the situation what it is — is completely missing.`,
      `The story told near {region} tonight had the main shape right: {faction} pressing, {rival} responding, the ground contested. But the reasons were invented and the nuances were flat.`,
      `{commander} always listens to what newcomers think is happening. Not because it is accurate. Because the inaccuracies show which parts of the current situation are visible from outside and which are hidden.`,
      `Every gathering near {region} has its storytellers, and the stories told to the newest arrivals have clear heroes and villains, no ambiguity, an ending already in view. The chronicle is the opposite of that genre.`,
      `The version of the story being told near {region} tonight is not wrong in any specific fact. Every named event happened. But the story has a shape — a meaning — that the people living inside the events do not recognize as accurate. This is how stories always work.`,
      `{rival}'s version of the same events is also being told somewhere tonight. The chronicle can say with some confidence: both versions are self-serving, both contain accurate facts, and neither resembles what the continuous record actually shows.`,
      `The newcomers near {region} who heard the stories will act on those stories. Not on the chronicle. They will act on the campfire version, which is shorter, clearer, and more motivating. {commander} is aware of this. Also aware of what gets lost in shorter and clearer.`,
      `One of the stories told near {region} tonight was about {commander}. {commander} heard a version of it secondhand. The story is flattering, simplified, and missing about half of what actually happened. {commander} chose not to correct it. Sometimes the story people need is not the same as the story that happened.`,
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
      'The Long Silence Ends — The World Wakes',
      'After the Long Dark, Everything Resumes',
      'The Chronicle Comes Back — Longer Gone Than Expected',
      'What the Long Silence Left Behind',
    ],
    bodies: [
      'The silence lasted long enough to change things. Not dramatically — {region} looks much the same. But the quality of what is here now is different from what was here before the quiet started.',
      'The chronicle was dark longer than anyone planned. Extended quiet is not neutral — things happen in it that do not get recorded. Decisions made, positions shifted. The landscape has rearranged itself.',
      '{commander} used the long quiet well. That is what the current positioning shows, compared to what it showed before the silence. Whether this was planned or improvised, the chronicle cannot say.',
      'The long quiet is over. What happened inside it — the small moves, the quiet talks, the repositioning — is now embedded in the shape of things. The chronicle reads the after without seeing the during.',
      `The long dark near {region} lasted long enough that both sides had to make decisions about how to use it. {faction} made those decisions quickly and began using the silence immediately. {rival}'s decisions came later. The gap between the two decisions is visible now in where each side stands.`,
      'The chronicle went quiet near {region} because nothing happened that qualified as an entry. But things happened that were not entries. The conversations that did not produce immediate action. The assessments that were revised. The relationships that shifted. These are in the after, not the record.',
      'When the long dark ended near {region}, the first entries were smaller and more careful than the entries just before the dark. Both sides checking the ground before committing weight to it. {commander} made the first real move three entries into the resumption. It was not tentative.',
      `{faction}'s position near {region} at the end of the long dark is meaningfully different from their position at the beginning. The difference accrued in the dark, invisibly, in the way real changes often accumulate. The chronicle can see the before and the after. The during is a gap that the gap itself describes.`,
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
      'A Report from the Far Edge',
      '{commander} Reads the Peripheral Record',
      'Word from Beyond the Known Territory',
      'The Edge Has Been Active — Here Is What They Found',
    ],
    bodies: [
      `{faction}'s people at the far edge have been ranging beyond {region}'s documented territory. What they brought back: {rival} has been active in places the main chronicle has not reached.`,
      `The peripheral report changes how the main chronicle reads. What was found beyond {region}'s usual boundaries complicates the simple version of what is happening.`,
      `{rival} does not watch the edges. {faction} does. The edge report near {region} is another result of that difference — {faction} knowing something about the shape of the world that {rival} does not.`,
      `The far edge has its own story, and it intersects with the main one more than it appears from the center. The report near {region} shows that intersection.`,
      `The edge scouts at {region} found evidence of activity that predates {faction}'s earliest awareness of the outer territory. Someone has been operating in that margin for longer than the current chronicle covers. {commander} is trying to determine whether this is {rival} or something else entirely.`,
      `The report from {region}'s far edge is detailed and specific. The scouts had been in the field for eleven days. Their observations are methodical. What they found near the outer boundary produced, when reported to {commander}, a silence that lasted several minutes.`,
      `{faction}'s edge-scouting practice is not widely known. Most current participants do not know that {faction} maintains a presence in peripheral territories the main chronicle does not cover. The report from near {region} is one product of that presence.`,
      `The outer territories around {region} have been mapped imprecisely because precise mapping requires time in the field under difficult conditions. {faction}'s edge scouts spend that time. The report they brought back contains corrections to the existing map that change several assumptions about the region's strategic value.`,
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
      '{commander} Does Something Different This Time',
      'The Old Plan Is Gone — Watch What Happens Now',
      'A Different Move — {faction} Adapts',
    ],
    bodies: [
      `The old approach stopped working. Not dramatically — quietly, in the way things stop working when the conditions they were designed for no longer exist. {faction} at {region} has changed tack.`,
      `Every experienced group has the moment when they realize they have been solving last season's problem. {faction}'s moment near {region} produced this entry — a clear departure from the pattern of the last several moves.`,
      `Consistency can be a strength or a prison. {faction} has been consistent. Near {region}, they stopped. {rival} noticed — they went still in the way of someone who had a plan to counter the expected move and just realized the expected move is not coming.`,
      `The new approach at {region} is not the old approach with modifications. It is a different idea. Something convinced {commander} that modifications would not be sufficient.`,
      `{faction}'s shift near {region} was preceded by three days of {commander} not communicating anything to anyone. This is unusual. {commander} is a communicator. The three days of silence were not absence — the thinking was happening. When {commander} emerged from it, the approach had changed.`,
      `{rival} had built a specific set of responses to {faction}'s previous approach at {region}. Those responses are now wrong. Not completely wrong — some elements apply. But the core assumption underlying {rival}'s defensive posture no longer describes what {faction} is doing. {rival} has not yet noticed.`,
      `The chronicle shows {faction}'s previous approach at {region} clearly, if you read back: consistent, disciplined, recognizable. The new approach will not be recognizable for several entries — possibly not until the pattern becomes clear in retrospect. {commander} prefers it this way.`,
      `What changed is not being explained by {faction}. The shift was announced by the shift itself — by the different kind of moves that started appearing in the chronicle. {rival}'s analysts are working to understand what the change means. {faction}'s people know because {commander} told them.`,
    ],
    afterContext: {
      TURNING_POINT: 'The pattern reading made {commander} change course. Twenty-five entries of doing things one way, then seeing the pattern from outside, then deciding it needed to break. Near {region}, it broke.',
      GREAT_SACRIFICE: 'After the sacrifice, something in {faction}\'s approach changed. Near {region}, a different kind of move — as if what was given had reoriented not just the capability but the direction.',
      THE_SILENCE: 'The quiet gave {commander} time to rethink. The next move near {region} looked nothing like what came before the silence. The stillness was used for something.',
    },
  },

  VIGIL: {
    loreType: 'VIGIL', icon: '\u2299',
    ruleApplied: 'Vigil',
    ruleExplanation: 'The world nears a threshold — everything feels weighted.',
    headlines: [
      'The Threshold Is Near — Everything Feels Different',
      '{faction} Holds as the World Approaches the Turn',
      'Before the New Age, a Vigil',
      'Every Move Carries Extra Weight Now',
    ],
    bodies: [
      `The chronicle can feel when it is near a threshold. The entries get heavier, more deliberate — as if everyone involved can sense that the ground is about to change register. Something is about to turn.`,
      `Before every new era there has been a period like this — a collective holding of breath, a slowing down, as if the world knows it is about to become something different and needs a moment.`,
      `{commander} holds vigils with unusual precision. Each move near {region} is made more carefully than usual — as if they know these are the last entries of a chapter and each one will be read in context later.`,
      `A few more entries, and the world crosses into something new. The vigil near {region} is the holding still before a significant change — not paralysis, but presence.`,
      `The vigil quality near {region} is not something {commander} announced. It arrived in the approach — in the way decisions are being made more slowly and carefully. The people around {commander} have noticed. They have also become more deliberate, as if catching a tone.`,
      `Near the end of an era, the things that have been building without resolution begin to resolve. The vigil at {region} is the pause before several of those things arrive at their conclusions at once. {commander} knows which resolutions are coming.`,
      `The counting-down quality of the current entries is not in the chronicle itself — it is in the people making the entries. {faction} near {region} knows that a threshold is close. The knowledge changes how they are moving, the care they are taking.`,
      `{rival} does not seem to feel the threshold approaching in the same way. {commander} has noted this. The vigil near {region} includes watching {rival}'s movements carefully — looking for signs that they understand what is coming. The signs, so far, are not there.`,
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
      'Between the Lines — Someone Moves Without a Side',
      'Neutral Near {region}',
      'Neither {faction} Nor {rival} — A Third Presence',
      'The Uncommitted Have Their Own Story',
    ],
    bodies: [
      `Not everyone in this world is fighting. Near {region}, there is a presence that has not joined {faction} or {rival} — moving in the space between them without belonging to either.`,
      `The neutral position is rarely passive. The one near {region} who has not declared is not waiting — they have decided that being outside the fight is the best available position.`,
      `The space between the main forces is not empty. Near {region}, it holds someone who has observed both sides long enough to understand something that neither fully understands about itself.`,
      `Every account the chronicle holds of people in the neutral position ends the same way: eventually the space closes. Near {region}, someone is in that space now.`,
      `The one near {region} who occupies neutral ground has been approached by both {faction} and {rival}. {faction} asked questions. {rival} made offers. Neither was accepted. The neutral presence is now more informed about what both sides want from them.`,
      `{commander} has thought carefully about the neutral presence near {region}. The conclusion: do not push. Neutrals who are pushed become opponents or unreliable allies. Neutrals who are left alone sometimes become allies voluntarily, on their own timeline.`,
      `The neutral ground near {region} is not without value. The person who occupies it provides — without necessarily intending to — a reference point. By not choosing a side, they make both sides more visible. {commander} has been watching what the neutral presence seems to notice about {faction}.`,
      `In the history of the chronicle, neutral positions have ended in several ways: absorption by one side, formal declaration of independence, quiet departure, or formation of a third group that becomes significant in its own right. Which outcome is developing near {region} is not yet visible.`,
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
      'A Single Mark at {region}',
      'Something Small Was Left at {region}',
      'The Chronicle Notes the Quietest Thing',
      'Minimum Trace at {region}',
    ],
    bodies: [
      `The chronicle records everything, including this: the smallest possible mark left near {region}. One point. Whether intentional, exploratory, or the residue of something larger — not clear. The mark is there.`,
      `Some marks are declarations. Some are accidents. The single mark near {region} is too small to be certain which — which may be exactly the point. A mark that resists interpretation is useful in ways legible marks are not.`,
      `The ghost mark at {region} is the kind of thing that gets lost in the noise of larger events. That is probably why it was left that way. A message in the minimum. The chronicle catches it.`,
      `The old keepers call these ghost marks. They appear as nearly nothing — single points, the smallest unit of action this world allows. Sometimes they are nothing. Sometimes they are the beginning of something.`,
      `The ghost mark near {region} was placed with precision that a truly accidental mark would not have. The specific location — at the edge of a contested zone, in the gap between two watched positions — suggests someone who knew the ground. {commander} has been informed.`,
      `Ghost marks accumulate. The one near {region} is the third in this area in the current era. Three ghost marks in the same area, placed with intervals that suggest patience rather than frequency. {commander} is treating the pattern as deliberate and the author as unknown.`,
      `Nobody claimed the ghost mark near {region}. Nobody will. That is the point of ghost marks — they are the smallest possible assertion of presence, below the threshold of things that require acknowledgment or response. The chronicle catches them because the chronicle catches everything.`,
      `The ghost mark near {region} may be nothing. The chronicle records it because the chronicle records everything, including the things that may be nothing. The record is complete or it is not a record. This is in the record.`,
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
      'A Messenger Arrives at {region}',
      'Word from Outside the Current Story',
      '{commander} Receives News from Elsewhere',
      'The World Is Bigger — Someone Brings News of It',
    ],
    bodies: [
      `The chronicle covers what it can reach. The messenger near {region} came from outside the current range, carrying something that has already changed things out there and will change things here.`,
      `Messengers keep the world from fragmenting. They move between parts of the Grid that would otherwise have no information about each other. The one at {region} is doing that work today.`,
      `{commander} received the messenger near {region} carefully — setting aside the current preoccupations, listening fully, asking follow-up questions before deciding what to do with the information.`,
      `The message delivered near {region} is in the record now — not its content, but the fact of its delivery. Something from outside arrived and changed what is known.`,
      `The messenger near {region} delivered their message and waited for a reply. {commander} did not reply immediately. {commander} asked the messenger to stay for two days while the message was considered. The reply, when it comes, will be worth waiting for.`,
      `What the messenger brought to {region} was not news in the conventional sense — it was a change in the interpretation of events that had already been known. The same facts, understood differently. {commander} spent an evening reconsidering several past decisions.`,
      `The messenger's route to {region} is in the record — a long route, from territory the main chronicle rarely covers, through ground that is not easily traveled. That the message made it at all is a sign of how much the sender wanted it delivered.`,
      `Not all messages carry good news. The messenger near {region} carried the kind that is difficult to receive — accurate, important, and requiring a response that will not be easy to make. {commander} received it without visible reaction. The visible reaction came later, in private.`,
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
      'Forty Entries — The Long Count',
      'The World Measures Itself at Forty',
      'The Chronicle Reaches Forty',
      `Forty — The Grid\'s Own Number`,
    ],
    bodies: [
      'The Grid is forty wide and forty deep. Every fortieth entry, the chronicle takes the long count — measuring how far the story has come against the shape of the world it lives inside.',
      `Forty is the Grid's own number. Every fortieth entry, the chronicle reads the full shape of what forty entries of action have made. The shape at this count: {faction} present, {rival} responding, {region} at the center.`,
      'The long count near {region}: forty entries. In those forty, the pattern of this world has become legible — not complete, not resolved, but legible.',
      '{commander} keeps track of the long count separately from the regular tally. The long count is about the shape of forty entries — what the world has described about itself by moving through forty moments.',
      'Forty entries. The Grid is forty across. The coincidence — if it is a coincidence — is not lost on the chronicler who has been keeping this record since the beginning. Every forty entries, the chronicle measures itself against the Grid it describes. The Grid does not change. The story does.',
      'The long count at forty is different from the short tally at ten. The tally shows what happened recently. The long count shows what has been happening the whole time — the deep trend, the pattern visible only from enough distance. The deep trend, at forty entries, is {faction}.',
      '{commander} asked to see the forty-entry analysis. It was prepared. {commander} read it once, put it down, picked it up, read it again. Whatever the analysis contained, it produced two things: a long silence, and then a specific request for a meeting that the chronicle will record in the next entry.',
      `Forty entries mark nothing structurally important about the chronicle. The chronicler chose the number because the Grid is forty across. It is the chronicler's way of asking, every forty entries: does the record match the world? At this count, the record and the world are close. The story and the territory rhyme.`,
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
      'A Pause — The Ordinary World',
      'Between the Big Events, Life Continues',
      'The Quiet Moments Count Too',
      '{faction} at Rest Near {region}',
    ],
    bodies: [
      `Between the large events, the world has a texture the chronicle rarely captures. Near {region}, {faction}'s people settled into ordinary rhythms — slower, less dramatic, real.`,
      `The ordinary things also happen. Meals. Small conversations. Arguments about nothing important. Near {region}, {faction} existed between events rather than in them — and existence between events is most of what existence actually is.`,
      `Not every entry is about conflict or discovery. Near {region}, {faction} simply was — present, intact, continuing. The chronicle notes this because the chronicle notes everything, including the quiet space between the fires.`,
      `{commander} calls this the real time — the hours between actions when everything is being processed, rested, prepared. Near {region}, it is that time.`,
      `The between-fires period near {region} is when {faction}'s people do the maintenance work that events do not allow. Equipment checked. Relationships repaired. Plans revisited. Rest taken. {commander} is visible and accessible in a way that the active periods do not allow.`,
      `What does {commander} do between events? Near {region}: plans the next phase, resolves disputes that accumulated during the active period, visits the people who need visiting, reads the accounts of what just happened. The between-fires period is not rest. It is different work.`,
      `The chronicler notes between-fires periods because the texture of a conflict includes its pauses. A story told only through its major events is a story with no sense of what it cost to get from one event to the next. Near {region}, the cost is: this time, this maintenance, this sustained presence.`,
      `Near {region}, in the quiet between events, two of {faction}'s people had an argument about something completely unrelated to the conflict. The argument was resolved. Both are back in their positions. The incident is not in the official record. It is in this note because it is the kind of thing the official record misses.`,
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
      '{faction} Again — Three Times Now',
      'A Pattern Becomes a Lineage at {region}',
      `{commander}\'s {faction}: Three Entries, One Direction`,
      'The Chronicle Recognizes a Dynasty',
    ],
    bodies: [
      `Three appearances. Three entries. The chronicle recognizes a dynasty when it sees one — not a title, but a consistent presence that has crossed from pattern into lineage.`,
      `Some presences flash through the record and vanish. Some appear, build, and persist. {faction} near {region} is the second kind — three entries that connect to each other, each one building on what came before.`,
      `The difference between presence and dynasty is time. {faction} has put in the time near {region}. Three entries, each meaningful, each connected by {commander}'s consistent intention.`,
      `Three marks near {region}. {commander} made the first, the second, and now the third. The third entry in any series changes what the first two mean — it confirms the pattern is not accidental.`,
      `The third appearance at {region} by {faction} completes a set that the chronicle classifies differently from ordinary entries. Three appearances with a consistent direction constitute a dynasty — a claim deeper than any formal declaration, because it is made in repeated action.`,
      `{commander}'s third move at {region} was made with more precision than the first two. As if each return has taught something that the next return applies. The first visit established presence. The second established pattern. The third establishes inheritance.`,
      `Dynasties in this world are not inherited. They are earned. The dynasty at {region} belongs to {faction} because {faction} has appeared there three times with intention and not once by accident. The third entry closes the question.`,
      `The chronicler marks the third appearance at {region} separately because the chronicle distinguishes between visits and dynasties. Three is the number that transforms a visit into a dynasty. {faction} has made the third appearance. The transformation is noted.`,
    ],
    afterContext: {
      VETERAN_RETURNS: '{commander} returned to {region} and made it three. The return was also the third entry — the one that turned a pattern into a dynasty. Both facts at once.',
      DOMINION_GROWS: 'Three entries near {region}, and {faction}\'s dominion grows. The dynasty confirms the pattern: this is not accidental presence. This is intention.',
    },
  },

  CROSSING: {
    loreType: 'CROSSING', icon: '\u00d7',
    ruleApplied: 'Crossing',
    ruleExplanation: 'A known face moves through new ground — the world is expanding.',
    headlines: [
      '{faction} Move Through Ground They Have Never Touched',
      '{commander} Crosses Into New Territory at {region}',
      'Beyond the Known: {faction} at {region}',
      'New Ground for {faction} — A First',
    ],
    bodies: [
      `{faction} moved through territory near {region} that was not in their previous record. New ground. {commander} executed the crossing without broadcasting it. {rival} found out after.`,
      `When a known group crosses into territory they have not touched before, the story changes shape. {faction}'s crossing near {region} expanded the map — not just physically, but in what is possible.`,
      `The chronicle logs first appearances carefully. {faction}'s presence near {region} is a first. {rival} will need to reconsider what they thought they knew about the edges of {faction}'s reach.`,
      `{commander} called it a test. A crossing into new ground near {region}, structured to see what is there and whether it can hold.`,
      `{faction}'s crossing into the new territory near {region} was not announced. It was simply done, as a fact, and the fact was allowed to speak for itself. The speaking happened when {rival} noticed.`,
      `The territory near {region} that {faction} crossed into has history that {faction} does not yet know. The crossing gives access to that history. {commander} has begun the process of learning it.`,
      `What does a first crossing feel like from inside? {commander} described it once about a different crossing: it feels like reading a sentence and knowing the paragraph, but not the book. The crossing near {region} has that quality.`,
      `The crossing near {region} was {commander}'s decision alone. No council, no consultation. {commander} looked at the map, looked at the moment, and said: now. The people who execute {commander}'s decisions recognize that tone. They moved.`,
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
      'The Work That Does Not Make Headlines',
      '{faction} Secure the Route at {region}',
      '{commander} Keeps the Lines Open Near {region}',
      'The Unglamorous Work — Necessary',
    ],
    bodies: [
      `{commander} keeps a map that shows only the supply routes. Secure the path, they say, and everything else follows. The route confirmed near {region} is a quiet win.`,
      `The dramatic entries are built on unglamorous ones. Near {region}, {faction} did the work that makes the dramatic entries possible — securing routes, maintaining connections, making sure what was taken can stay taken.`,
      `The route near {region} will appear in future entries as a given — a fact of the landscape requiring no explanation. It requires explanation today: {faction} built it. It did not exist before.`,
      `{faction} surveys after every major change. The surveyors found the shift at {region} was larger than estimated. The new maps reflect reality.`,
      `The supply work near {region} is invisible from outside {faction}. {rival} is watching the front, not the back. The front is where attention goes. The back is where capacity comes from. {commander} understands this. {rival} does not.`,
      `Three different routes to {region} now. The first was established early. The second was added after the most recent push. The third, confirmed today, provides an alternative if either of the first two becomes compromised. {commander} builds redundancy into everything.`,
      `The chronicler asked {commander} why supply work appears in the same chronicle as battles and discoveries. {commander}'s answer: because you cannot have one without the other, and a record that shows the battles but not what made them possible is not an accurate record.`,
      `The route near {region} crosses ground that {rival} considers neutral. Technically, running a supply line through neutral ground is not a violation of any stated position. {commander} made sure of this before establishing the route. Technically correct is where {commander} likes to operate when it is available.`,
    ],
    afterContext: {
      GREAT_BATTLE: 'After the big push, {faction} secured the routes through {region}. Holds do not hold without supply lines. {commander} knows this. The work happened fast.',
      THE_SILENCE: 'The quiet was used for logistics. Near {region}, {faction} worked the routes — building, securing, maintaining what needed to be maintained before things became active again.',
    },
  },

  NIGHT_WATCH: {
    loreType: 'NIGHT_WATCH', icon: '\u25e6',
    ruleApplied: 'Night Watch',
    ruleExplanation: 'The watchers hold — the Grid is tended between active events.',
    headlines: [
      'The Watch Holds at {region}',
      '{faction} Tend the Ground at {region}',
      'Watching — Nothing Changes',
      'The Night at {region} — All Quiet',
    ],
    bodies: [
      `The watchers at {region} held through the night without incident. This is what watchers are supposed to do. The dramatic entries are possible because of this kind of quiet reliability.`,
      `Near {region}, {faction}'s watchers ran through the full cycle. Quiet. No anomalies. {commander} received the report at dawn: clear.`,
      `The watch near {region} is the chronicle's oldest tradition — tending the world between the moments when it actively changes.`,
      `{commander} checks on the watch personally at irregular intervals. Near {region}, the watch is {faction}'s claim in quiet form: we are here, consistently, even when nothing is happening.`,
      `The night at {region} was long. Nothing happened, which is the optimal result for a watch. The watchers rotated, maintained their positions, flagged two things that turned out to be nothing, and reported clear at dawn. Optimal result, properly received.`,
      `Some of {faction}'s most experienced people are assigned to the watch near {region}. Not the most aggressive — the most reliable. {commander} chose them specifically. Watching requires a kind of temperament that action does not. The watchers at {region} have it.`,
      `The watch report from {region} tonight includes a notation: something moved in the outer boundary, briefly, and was gone before it could be identified. The movement was small and did not recur. {commander} saw the flag and made a note to ask the edge scouts about it.`,
      `Watchers see things that the main chronicle does not record. They see the night, the margins, the small movements too small for entries. They see the quality of the quiet. Near {region}, the quality of the quiet tonight was clean — no underlying tension, no sense of something approaching. The watchers know the difference.`,
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
      'The Aftermath Settles at {region}',
      'What Comes After — {faction} Holds the Ground',
      'After the Push: Taking Stock',
      'The Ground Has Changed — Now What',
    ],
    bodies: [
      `The chronicle does not cut from the big push directly to the next thing. There is an aftermath. Near {region}, {faction} is doing aftermath work — holding the new position, accounting for the cost, figuring out what just happened before figuring out what happens next.`,
      `Large events leave a particular kind of quiet. Not silence — there is movement, there is activity — but quieter than what came immediately before. {faction} near {region} is in that quality now.`,
      `{rival} is processing too. The aftermath of {faction}'s big move at {region} belongs to both sides — one dealing with what they won, the other with what they lost. Both slower than usual, for different reasons.`,
      `Aftermath is not rest. Near {region}, {faction} is working the changed ground — moving into the new positions, noting what the new positions reveal about what comes next. {commander} has not stopped.`,
      `The aftermath near {region} is when {faction} does the accounting. What was spent to make the move. What was gained. Whether what was gained is worth what was spent. {commander} does this accounting personally, in writing, before any celebration is permitted.`,
      `Aftermath is also when {rival} makes decisions. {faction} is watching — not the territory, which is settled, but {rival}'s movements in the wake of the settling. What {rival} does now will determine what {faction} does next. The aftermath near {region} is active intelligence work dressed as quiet.`,
      `The people near {region} who participated in the big move are not resting. They are recounting — going over what happened, comparing experiences, extracting lessons. {commander} will collect these accounts. They will become part of the institutional knowledge that informs the next move.`,
      `Some in {faction} believe the aftermath near {region} is when the win was actually secured. The move took the ground. The aftermath made sure the ground stayed taken — the fortifications, the supply lines, the watches, the maps. Without the aftermath, the move would have been temporary.`,
    ],
  },

  ESCALATION_NOTE: {
    loreType: 'ESCALATION_NOTE', icon: '\u2191',
    ruleApplied: 'Escalation',
    ruleExplanation: 'Auto-inserted when the pace surges — the chronicle notices acceleration.',
    headlines: [
      'The Pace Has Changed',
      'Everything Is Moving Faster',
      'The Chronicle Notes an Acceleration',
      'Something Has Shifted — The World Is Speeding Up',
    ],
    bodies: [
      `The chronicle has been tracking the pace. It has changed. What was moving steadily is now moving fast — more entries in less time, more territory shifting per entry. The world is accelerating.`,
      `The slow build has become something faster. Near {region}, the pace is visible in how events compress — things that used to take several entries are happening in one.`,
      `Acceleration is its own kind of message. When a story speeds up, it means it is approaching something — a peak, a resolution, a crisis. The chronicle notes the acceleration without predicting what it is accelerating toward.`,
      `Not every escalation is a crisis. Some are just velocity — the normal speed of things increasing because both sides are more committed, more certain, more willing to push.`,
      `The pace near {region} has doubled in the recent entries. Not because more is happening — because what is happening is happening faster. {commander} is moving without the deliberation of the early entries. {rival} is responding faster than before. The world has shifted gears.`,
      `Escalation produces its own pressure. The faster things move, the less time each side has to consider their moves. The less consideration, the more each side relies on established instinct. {commander}'s instincts near {region} are very good. {rival}'s instincts have not been tested at this speed.`,
      `The chronicler has been counting the interval between entries. The interval has been shrinking for the last seven entries. Near {region}, the intervals are now short enough that events are overlapping. The escalation is real and it is accelerating.`,
      `At this pace, the current phase will resolve — in one direction or another — within a manageable number of entries. {commander} is aware of this. The acceleration is partly {commander}'s choice: moving fast enough that {rival} cannot establish a stable response before the next move arrives.`,
    ],
  },

  SACRIFICE_TOLL: {
    loreType: 'SACRIFICE_TOLL', icon: '\u2020',
    ruleApplied: 'The Toll',
    ruleExplanation: 'Auto-inserted when cumulative sacrifices cross a threshold — the weight accumulates.',
    headlines: [
      'The Toll of What Has Been Given',
      'The Weight of All the Sacrifices',
      'The Count of the Given — It Grows Heavy',
      'Every Name in the Record',
    ],
    bodies: [
      `The chronicle holds every name. Every person who gave so that others could go on. The count has crossed another threshold, and the chronicle marks it because the weight of it deserves marking.`,
      `The record of the given grows. Each entry was complete in itself — one person, one moment, one irreversible choice. Together they describe something larger: a world willing to pay for itself in the deepest way.`,
      `Milestones in the toll are not celebrated. They are acknowledged. The count has crossed another number, and the chronicle records it simply. The weight of the names speaks for itself.`,
      `What was given cannot come back. The toll grows. {faction} and {rival} alike have contributed names. In this, the chronicle makes no distinction between sides. The given are the given.`,
      `The toll has crossed another threshold. {commander} reads the names alone. Not aloud — in silence, one by one, in the order they appear in the secondary register. This takes time. {commander} takes the time. It is the minimum the names deserve.`,
      `Both {faction} and {rival} maintain their own records of the given. The chronicle maintains a combined record that neither side has access to. The combined record is larger than either side knows. The giving has been more widespread, and more equal between sides, than the active entries suggest.`,
      `The toll is counted at thresholds because counting continuously would make the chronicle a different document — a document of grief rather than a document of events. The thresholds are the chronicler's way of pausing to say: remember that this has been accumulating. Remember the weight.`,
      `The names in the toll are the permanent record of what this world has cost. The cost is not in territory or resources — those fluctuate. The cost is in the names. The names do not fluctuate. They accumulate.`,
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
