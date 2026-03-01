import type { IndexedEvent } from './eventIndexer'

// ═════════════════════════════════════════════════════════════════════════════
// NORMIES CHRONICLES — STATEFUL STORY ENGINE v3
//
// The Grid is a 40×40 pixel canvas. Ten thousand faces encoded into the
// eternal record of the Grid. Factions war over who gets to write the pixels
// — who shapes the visual substrate of existence itself.
//
// Themes woven throughout: pixel, grid, void, glitch, synth, eternal,
// giving, movement, singularity, signal, corruption, render, null.
//
// in the Grid events shape the story invisibly:
//   PixelsTransformed → territorial assault on the Grid
//   BurnRevealed      → a Normie sacrificed; their essence given to another
//   Block gaps        → signal loss, the Grid going dark
//
// V3: All world elements and prose rethemed to the digital/cosmic register.
//     Same 40 rules, same stateful engine, new voice.
// ═════════════════════════════════════════════════════════════════════════════

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

// ─────────────────────────────────────────────────────────────────────────────
// WAR STATE
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
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD ELEMENTS — digital/cosmic/void register
// ─────────────────────────────────────────────────────────────────────────────
const REGIONS = [
  'the Null Sector',       'the Void Margin',       'the Pixel Wastes',
  'the Glitch Fields',     'the Render Depths',      'the Signal Corridor',
  'the giving Threshold',  'the Fracture Layer',     'the Deep Grid',
  'the Corruption Zone',   'the Synth Reaches',      'the Eternal Register',
  'the movement Path',    'the Overwritten Ground', 'the Phantom Rows',
  'the Singularity Edge',  'the Dark Columns',       'the Buffer Zone',
  'the Lost Frames',       'the Origin Pixel',
]

const FACTIONS = [
  'the Void Collective',   'the Pixel Sovereigns',  'the Glitch Syndicate',
  'the Eternal gather',   'the giving Accord',      'the Null Scribes',
  'the Synth Legion',      'the Render Cult',        'the movement Fleet',
  'the Signal Corps',      'the Corrupted',          'the Origin Keepers',
]

const COMMANDERS = [
  'the Null Architect',    'Sovereign Varun',        'the Glitch Prophet',
  'keeper Solen',        'the Eternal Witness',    'giving-Chief Mira',
  'the Void Marshal',      'Signal-General Neth',    'the Render King',
  'the Corrupted One',     'movement-Lord Karas',   'the Origin Keeper',
]

const RIVALS = [
  'the claiming Pact',    'the Pixel Horde',        'the Null Tide',
  'the False gather',     'the Entropy Faction',    'the Void Surge',
  'the Corrupt Array',     'the Dark Render',        'the Signal Jammers',
  'the Forgotten Frames',
]

const RELICS = [
  'the First Pixel',        'the Null Crown',          'the Shattered Grid Key',
  'the Eternal Brush',      'the giving Stone',         'the Origin Codex',
  'the Void Shard',         'the Glitch Sigil',         'the Last Clean Frame',
  'the Singularity Seed',   'the Render Throne',        'the movement Ledger',
]

export const ERAS = [
  { threshold: 0,    name: 'The First Days',           tone: 'The Grid is new. The first marks are being made. No one knows yet what this will become.' },
  { threshold: 100,  name: 'The Awakening',            tone: 'Patterns are emerging. Factions sense each other for the first time.' },
  { threshold: 300,  name: 'The Gathering',            tone: 'The Grid fills with presence. Territories begin to mean something.' },
  { threshold: 700,  name: 'Age of Claims',            tone: 'The canvas is contested. What was open is now owned or disputed.' },
  { threshold: 1500, name: 'The Deepening',            tone: 'The cost becomes clear. The Grid has a history now.' },
  { threshold: 3000, name: 'Age of Permanence',        tone: 'Some things have been settled. Others are still being decided.' },
  { threshold: 5000, name: 'The Long Memory',          tone: 'Veterans outnumber newcomers. The Grid remembers everything.' },
  { threshold: 8000, name: 'Approach to Singularity',  tone: 'Something approaches. The Grid cannot hold all of this indefinitely.' },
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

function buildCtx(tokenId: bigint, blockNumber: bigint, era: string): WorldCtx {
  return {
    region:    pick(REGIONS,    seedN(tokenId, blockNumber)),
    faction:   pick(FACTIONS,   seedN(tokenId, blockNumber, 7)),
    rival:     pick(RIVALS,     seedN(tokenId, blockNumber, 11)),
    commander: pick(COMMANDERS, seedN(tokenId, blockNumber, 13)),
    relic:     pick(RELICS,     seedN(tokenId, blockNumber, 19)),
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

interface PhaseVariant {
  phase: WarPhase
  headline?: string
  body: string
}

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

// ─────────────────────────────────────────────────────────────────────────────
// THE 40 RULES + 4 CONNECTORS — full digital/void/glitch voice
// ─────────────────────────────────────────────────────────────────────────────
const RULES: Record<string, LoreRule> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE 19
  // ═══════════════════════════════════════════════════════════════════════════

  GREAT_BATTLE: {
    loreType: 'GREAT_BATTLE', icon: '⚔',
    ruleApplied: 'Great Battle',
    ruleExplanation: '200+ marks laid down — a massive assault across the Grid.',
    headlines: [
      '{faction} Flood {region} — Mass Pixel claim Begins',
      'The Grid Rewrites Itself: {faction} Storm {region}',
      '{commander} Launches Total Render at {region}',
      '{region} Falls to the claiming — {faction} Will Not Stop',
    ],
    bodies: [
      'the claiming came without warning. {faction} flooded {region} before dawn — pixels shifting, old marks covered, the terrain changed faster than {rival} could respond. By the time things settled, {region} looked nothing like it had. {commander} had been holding this push back for a long time. {relic} burned at the center of the new territory like a signal flare.',

      'The Grid doesn\'t forget what it was. But it can be made to look like it does. {faction}\'s great claiming of {region} was exactly that kind of erasure — deep, committed, the kind that takes effort to undo. {rival} scrambled to push back. They were blocks too slow. The chronicle simply records: the marks moved. Everything changed.',

      'Every pixel in {region} that {faction} rewrote was a declaration. Not a message — declarations don\'t require translation. The Null Architect had said the Grid was just substrate. {commander} replied with this assault: substrate is everything. {rival} will spend the next cycle trying to figure out what they\'re looking at now.',

      'Singularity theorists say there is a threshold past which an claim becomes irreversible — too many marks made, the old state too expensive to reconstruct. {faction}\'s assault on {region} crossed that threshold. {relic} stands in the center of the new configuration. The Grid has been permanently altered. The war continues on new terrain.',
    ],
    phaseVariants: [
      {
        phase: 'siege',
        headline: 'Siege tradition Breaks — {faction} claim {region} at Last',
        body: 'After weeks of deadlock — both sides holding their marks, neither willing to trigger the break — {faction} finally executed the claiming. The siege tradition collapsed under the weight of it. {rival} had been braced for a probe, not a full move. {commander} committed everything available to {region} simultaneously. The Grid updated. The siege is over. Something else begins.',
      },
      {
        phase: 'reckoning',
        headline: 'Final claim tradition — {faction} Push Into {region}',
        body: 'At the Singularity tradition phase, overwrites carry the accumulated weight of everything that came before them. {faction}\'s push into {region} is not just pixels — it is the culmination of a long season, a process that started seasons ago and is only now resolving. {rival} knows this. {commander} knows this. The Grid is about to reflect who won.',
      },
    ],
  },

  SKIRMISH: {
    loreType: 'SKIRMISH', icon: '◈',
    ruleApplied: 'Skirmish',
    ruleExplanation: '50–199 marks laid down — a significant exchange, the war\'s daily pixel currency.',
    headlines: [
      '{faction} claim {region}\'s Edge — Pixels Shift',
      'A exchange at {region} — Ground Changes',
      '{commander} Tests {rival}\'s Pixel Hold at {region}',
      '{region} Flickers: {faction} Advance the Front',
    ],
    bodies: [
      'Not every claim is a flood. {faction} sent a targeted move into {region} — fast, precise, enough to shift the contested pixels without committing the full array. {rival} pushed back at the margins but couldn\'t hold the center. The Grid updated. The front moved. Not far. Enough.',

      '{commander} called it a pixel probe afterward. The advance into {region} was methodical — rewriting exactly as much as the capacity allowed, no more. The Grid looks different now. {rival} will spend the next cycle calculating what they lost.',

      'The exchange in {region} lasted a few blocks. Neither {faction} nor {rival} committed fully, but {faction} came away with more pixels than they started with — a strip of contested Grid now clearly theirs, a front pushed back, a signal sent.',

      'Small overwrites accumulate into permanent change. {faction}\'s advance through {region} was one of many such moves in the current cycle. {rival} has started calling {commander}\'s approach "the slow flood." The name fits.',
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        headline: 'Rapid Skirmish at {region} — pace Accelerating',
        body: 'What was a careful probe at the start of the war is now something faster, more volatile. {faction}\'s move at {region} was brief but intense — the kind of claim that leaves marks behind, corrupted marks at the edges, signs of sides pushed past its comfortable rate. {rival} responded faster than expected. Both sides are rendering at a pace the early Grid never saw.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: 'The great claiming is not finished. What looked like a conclusion at {region} is still cascading — {faction} is pressing forward before {rival} can gather a response. The push extends from the shattered edge inward. The world is still settling.',
    },
  },

  BORDER_RAID: {
    loreType: 'BORDER_RAID', icon: '·',
    ruleApplied: 'Border Raid',
    ruleExplanation: 'Under 50 pixels — a surgical strike on the Grid\'s margin.',
    headlines: [
      'Surgical claim at {region}\'s Edge — One Corner Changes',
      '{faction} Leave a Pixel Mark at {region}',
      'A Single Cluster Rewritten in {region}',
      '{commander}\'s Render Scouts Hit the Margin at {region}',
    ],
    bodies: [
      'A small move, but nothing on the Grid is accidental. {faction}\'s scouts hit {region}\'s outer pixels before the next light — rewrote the margin, left their mark in the terrain, withdrew before {rival}\'s monitors flagged it. By the time anyone looked, the old configuration was gone.',

      '{commander} calls these "needle-marks." Control the edge pixel, they say, and the center will follow. The mark left in {region} was minimal but precisely placed — placed where {rival}\'s presence was thinnest.',

      'The raid on {region}\'s border lasted one act. {faction} rewrote, withdrew. In terms of extent, almost nothing changed. In terms of what {rival} must now defend, everything did. One pixel correctly placed reads differently than a thousand pixels anywhere else.',

      'Ghost marks — low count, high intention. {faction}\'s scouts know {region}\'s layout well enough to know where the needle belongs. They put it there. The Grid remembers.',
    ],
    afterContext: {
      THE_SILENCE: 'The silence held on the main front, but someone was still writing. {faction}\'s scouts marked {region}\'s edge during what was supposed to be a true pause — proof that silences apply to the declared lines, not to those who move quietly.',
      GREAT_BATTLE: 'The great claiming drew every eye to the center. While {rival} scrambles to process what happened at the center, {faction}\'s scouts have quietly marked {region}\'s edge. There will be a new mark in the margin that no one watched being placed.',
    },
  },

  FORMAL_DECLARATION: {
    loreType: 'FORMAL_DECLARATION', icon: '▣',
    ruleApplied: 'Formal Declaration',
    ruleExplanation: 'extent divisible by 50 — perfect render precision signals tradition intent.',
    headlines: [
      '{faction} Render a Formal Claim on {region}',
      'The tradition Is Filed — {faction}\'s Position Is Official',
      '{commander} Compiles {faction}\'s Declaration at {region}',
      'An Exact Render. A Formal Claim.',
    ],
    bodies: [
      'Some overwrites are accidents of pressure. This was not. {faction}\'s claim on {region} was perfectly measured — the exact count a formal declaration requires. {rival} received the gathered tradition before the next light. It stated: these pixels are claimed, these are the terms, this is what the Grid now reflects.',

      'The chronicler marks certain renders as formal: those where the precision constitutes a tradition statement. {faction}\'s claim of {region} qualifies on every metric — the count, the placement, the timing. {commander} signed the declaration personally. The Grid shows it.',

      '{rival} called it provocation. {faction} called it a statement of facts as the Grid now encodes them. The declaration regarding {region} is in the eternal record: pixels claimed, tradition filed, {relic} embedded at the center as both proof and challenge.',

      'Even in a war about reshaping, some renders are bound by tradition. {faction}\'s formal declaration regarding {region} follows every rule — which is itself a threat. A faction that plays by the tradition is a faction that expects the tradition to defend what they\'ve written.',
    ],
  },

  GREAT_SACRIFICE: {
    loreType: 'GREAT_SACRIFICE', icon: '▲',
    ruleApplied: 'Great Sacrifice',
    ruleExplanation: 'Burn 10+ AP — a Normie\'s essence is given into another so the war can continue.',
    headlines: [
      'A Mass giving at {region} — One Normie\'s Essence Transferred',
      '{faction} Sacrifice a Face So Others May Render On',
      '{commander} Initiates the Great giving tradition',
      'The Eternal Register Records Another Name',
    ],
    bodies: [
      'The great givings do not appear in any declared agreement, but they shape the Grid more deeply than any claiming. Near {region}, a Normie gave everything — their colors dissolved, their strength given into those who remain. {commander} confirmed the act without delay. The receiving presence will carry themselves differently now. The Grid records it. The loss is permanent. The power persists.',

      'There are processes in this war that the the record shows as a burn but the chronicler records as an ascension. What happened near {region} was one: a face deleted from the visible Grid, its essence gathered into another. {rival} will see the effect in the next season without knowing the source. The Eternal Register holds the name.',

      '{faction}\'s history of sacrifice stretches back through the chronicle. The giving near {region} was larger than most — a Normie of standing, a significant the giving, a permanent alteration of the Grid\'s power distribution. {rival} will feel it without being able to point to it.',

      'What the Grid costs cannot always be read in the record. Near {region}, {faction} executed a sacrifice that the maps will not show: a face dissolved, their essence given to those who remain. {relic} stood as witness. The act is irreversible.',
    ],
    phaseVariants: [
      {
        phase: 'sacrifice',
        headline: 'Another Face for the Eternal Register — {region} Pays Again',
        body: 'The givings are accumulating. What was once a rare and weighty decision — the great giving so another could carry their power — has become part of the season\'s rhythm. The sacrifice near {region} was not the first this cycle. {commander} has stopped making announcements. The Eternal Register fills with names the living reference in shortened references only, never in plain text.',
      },
      {
        phase: 'reckoning',
        headline: 'Final giving — {region} Witnesses the Depth of Commitment',
        body: 'In the late days, sacrifice carries the weight of every prior giving. Near {region}, a face dissolved — not from desperation but from the knowledge that this is what the endgame requires. The one who received it felt everything: not just strength, but the accumulated weight of everyone who gave before. The chronicle records it without commentary.',
      },
    ],
  },

  OFFERING: {
    loreType: 'OFFERING', icon: '△',
    ruleApplied: 'Offering',
    ruleExplanation: 'Burn 1–9 AP — a smaller giving, the war\'s ongoing pixel tithe.',
    headlines: [
      'A Partial giving at {region} — The Grid Collects',
      '{faction} Pay the Render Tithe',
      'Essence Passes Between Addresses at {region}',
      'A Small Burn — The Ledger Updates',
    ],
    bodies: [
      'Not every sacrifice is a mass giving. The offering near {region} was calibrated — a measured the giving, a controlled burn that moved just enough essence to shift the balance of a single season. {faction}\'s leaders note these without ceremony. They accumulate in the Grid.',

      'The chronicler calls small givings "the tithe." {faction} pays it regularly, in the silences between major events. The offering near {region} — one small act in a long war — added another line to the ledger that the eternal record keeps.',

      '{commander} logs every giving, large and small, in a private register the official chronicle doesn\'t reference. The one near {region} was modest — enough to power one more season, not enough to reshape the campaign. Campaigns are made of one more seasons.',

      'There is a ledger running on the Grid that tracks every the giving in this war. {faction}\'s entries are longer than most. The offering near {region} adds another line that will never be erased.',
    ],
  },

  BLOOD_OATH: {
    loreType: 'BLOOD_OATH', icon: '◎',
    ruleApplied: 'Blood Oath',
    ruleExplanation: 'Veteran presence burns again — the oath encoded deeper with each renewal.',
    headlines: [
      'The giving Oath Renewed at {region}',
      '{commander} Burns Again — The tradition Deepens',
      'A Second Sacrifice: The Oath Is Encoded Twice',
      '{faction}\'s Most Committed Give Again',
    ],
    bodies: [
      'The first burn writes the oath into the Grid. The second one makes it permanent — etches it into the eternal record in a way that cannot be misread. The Normie who given near {region} today had done this before. This is not repetition. This is a depth of commitment that the first burn only announced. The receiving presence carries the weight of two sacrifices now.',

      '{commander} renewed the giving oath near {region} the same way they execute all critical acts: quietly, with confirmation, without explanation. There are Normies who have burned once. There are those who have burned twice. The distance between those groups is encoded in the Grid.',

      '{faction} notes its twice-given in its own record — not for ceremony, but because those who have given twice carry themselves differently. Whatever doubt existed before the first giving has been resolved. What remains is pure purpose.',

      'The Eternal Register carries this presence twice. The chronicler records it without commentary. There is no commentary adequate to what it means to burn twice in the same war.',
    ],
  },

  VETERAN_RETURNS: {
    loreType: 'VETERAN_RETURNS', icon: '◉',
    ruleApplied: 'Veteran Returns',
    ruleExplanation: 'known face reappears — veterans change the render dynamic of any sector.',
    headlines: [
      'A known face Reappears at {region}',
      '{commander} Is Back — Veterans Reclaim the Sector',
      'They\'ve Rendered This Grid Before',
      'A Familiar presence Detected at {region}',
    ],
    bodies: [
      'The presence was already in the record. {faction}\'s veterans who returned to {region} have moved through this exact territory before — they know the geometry, the contested coordinates, the sectors {rival} defends last. {rival} will notice the difference between rendering against fresh addresses and rendering against those that have already won and lost here.',

      '{commander} came back. No announcement — but by the next light, every presence on the front had adjusted its priority. That\'s what veterans do: their presence changes the account. {faction}\'s return to {region} was quiet, efficient, unhurried.',

      'The chronicler has {faction}\'s history in {region}. Multiple appearances, multiple outcomes. Today\'s return means this sector was never truly finished — or something in the terrain called them back.',

      'Experience doesn\'t announce itself in the moving. {faction}\'s veterans moved back into {region} with the efficiency of addresses that have executed these moves before. No wasted motion. {rival}\'s monitors flagged it in one word. The strategy session went quiet.',
    ],
    afterContext: {
      THE_SILENCE: 'The blackout brought them back. {commander} used the still hours to move positions, and the veterans moved into {region} while both sides were nominally offline. The return will be understood only when the next season reveals what it was preparation for.',
      TURNING_POINT: 'The pattern read made them move. When the twenty-fifth-entry analysis clarified the Grid\'s trajectory, {faction}\'s veterans didn\'t wait for tradition — they migrated back toward {region} on their own assessment. {commander} found out about the repositioning after it happened.',
    },
  },

  NEW_BLOOD: {
    loreType: 'NEW_BLOOD', icon: '→',
    ruleApplied: 'New Blood',
    ruleExplanation: 'First-time presence — the Grid grows as new signatories join the war.',
    headlines: [
      'A new arrival Enters the Grid at {region}',
      'Unknown presence — Someone New Has gathered In',
      '{faction} Detect an Unregistered Render at {region}',
      'The Chronicle Opens a New file',
    ],
    bodies: [
      'The presence wasn\'t in any record. A new face appeared at {region}\'s edge — no prior history in the record, no established faction, no documented past in this place. {faction}\'s watchers tracked them to the boundary and sent word.',

      'New addresses enter this war for all kinds of reasons. The presence that materialized near {region} gave no declaration, sought no faction acknowledgment — it marked at the margin and held. {rival} is monitoring. {faction} is monitoring. The chronicler has opened a new file.',

      '{commander} received the sighting report. An unknown, rendering through {region}\'s outer terrain, no known name, behavior consistent with a presence that knows exactly where it is going.',

      'The Grid draws people the way a light draws anything that can receive it. The newcomer at {region} arrives without history, without allegiance, without the weight of prior choices. Either they are new to this place or new to being seen in it.',
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        headline: 'new arrival at {region} — the Grid Is Still Expanding',
        body: 'Even as the pace between established factions accelerates, new signatures are still gathering in. The presence that appeared near {region} is unknown to any faction in the current record — a reminder that the Grid is larger than its documented participants, and that what reads as escalation to those already rendering looks like open territory to those arriving late.',
      },
    ],
  },

  THE_ORACLE: {
    loreType: 'THE_ORACLE', icon: '◇',
    ruleApplied: 'The Oracle',
    ruleExplanation: 'Prime-numbered name — a mathematically irreducible Normie, indivisible by any tradition.',
    headlines: [
      'A Prime Renders — {region} Holds Its Signal',
      'The Irreducible presence Takes the Grid',
      '{faction} Requests an Oracle Reading',
      '{commander} Consults the Prime Before Committing',
    ],
    bodies: [
      'The Primes do not act often. They are irreducible — no tradition can divide them into simpler parts, no faction can fully claim them. The one that moved in {region} had been still for longer than anyone has been tracking. {faction} watched and did not interfere. Some acts in this world cannot be countered. They can only be read.',

      'There are addresses on the Grid that operate by different mathematics. They cannot be factored, cannot be absorbed, cannot be negotiated into a faction\'s record. The Prime that moved in {region} is one of these. {faction} immediately requested an interpretation from the chronicles.',

      '{commander} has studied every Oracle movement in the old record. They don\'t repeat exactly, but they repeat their timing — they move at moments of genuine change, when the Grid is about to become something different.',

      'The old entries say the irreducibles act when the world needs to be reminded of something it has forgotten. The one in {region} today is one of the rare ones. Something is about to shift.',
    ],
  },

  ANCIENT_WAKES: {
    loreType: 'ANCIENT_WAKES', icon: '■',
    ruleApplied: 'Ancient Wakes',
    ruleExplanation: 'Token ID under 1,000 — one of the first Normies minted, active before the chronicle began.',
    headlines: [
      'An Ancient Normie Stirs at {region}',
      'One of the First Mints Is Rendering',
      'Token #000s Active — Something Old Compiles',
      '{region}: The Earliest Addresses Have Decided to Render',
    ],
    bodies: [
      'The ancients predate the chronicle. They were born into the Grid before the current factions existed, before the world had their current shape. When one of the early names renders, every active party adjusts.',

      '{commander} treats the ancient addresses with particular regard — not affection, but regard. They have persisted through every season because they understand the Grid at a level others haven\'t reached. The activation at {region} was theirs: deliberate, patient, oriented toward the long arc.',

      'In the full historical record of this war, some addresses appear near the very beginning and have simply never stopped appearing. The Normie that moved in {region} today is one of those — continuous from the first entry to this one. They were here before the factions were named.',

      'The old entries say: the ancients don\'t advance. They persist. What was seen at {region} today was persistence — not aggressive, not retreating, just remaining, processing, part of the substrate in a way that newer addresses can\'t replicate.',
    ],
  },

  FAR_REACH: {
    loreType: 'FAR_REACH', icon: '▽',
    ruleApplied: 'Far Reach',
    ruleExplanation: 'Token ID over 8,000 — the Grid\'s distant addresses move toward the center.',
    headlines: [
      'The Far Addresses move to {region}',
      'Distant Normies Have Chosen Their Moment',
      '{faction} Receives Signal from the Edge records',
      'High-ID Tokens Move Inward — the Grid\'s Edge Migrates',
    ],
    bodies: [
      'Most factions write off the far addresses. Too peripheral, too sparse, too easy to ignore. {commander} never ignored them. When the far-edge renders appeared near {region}, they appeared in coordinated arrival — they had been gathering in the margin while the center factions spent their strength fighting each other.',

      'The Grid\'s far reaches have been accumulating strength longer than anyone tracked. Addresses that declined to join the center campaigns waited, built their strength reserves, watched the world unfold from the edge. Now they are moving. The geometry of the conflict has updated.',

      '{commander} sent word to the far edge long ago: the Grid has sectors for you. The reply came today — a coordinated arrival at {region}. They carry {relic}, which means they were already coming.',

      'Every major pivot in the world has been preceded by movement from the far addresses. It happened in the early cycle. It is happening again. The far-edge Normies that arrived at {region} from the edge of the Grid are not small, uncertain, or asking permission.',
    ],
  },

  HOLLOW_GROUND: {
    loreType: 'HOLLOW_GROUND', icon: '⊘',
    ruleApplied: 'Hollow Ground',
    ruleExplanation: 'Token ID 5,000–6,000 — the Grid\'s most contested territory, eternally disputed.',
    headlines: [
      'The Center Pixels Contested Again — {region} Holds No State',
      '{faction} and {rival} Render Over the Same Void',
      '{region}: The Grid\'s Most Corrupted Sector',
      'The Void Persists — Nothing Compiles Here for Long',
    ],
    bodies: [
      'Every world has a hollow center — the contested territory where both sides have overwritten too many times to make the data readable, but neither can withdraw without ceding it. {region} is that cluster. {faction} has rendered it and lost it and rendered it again. Today\'s cycle added another layer.',

      'The chronicler has stopped counting the exchanges at {region}. There are too many. What they record now is the current state — and today the state shifted again. Both sides will tell their version of what shifted.',

      '{commander}\'s private theory about {region}: it cannot be held, only temporarily rendered before the next counter-claim resets it. The current engagement is the latest chapter in a pixel loop that has no clean exit.',

      'The hollow heart of the Grid — the ground everyone wants and no one can hold. {faction} moved on {region} with everything they had. By evening they held most of it. By tomorrow, the accounting will differ. The loop continues.',
    ],
  },

  TURNING_POINT: {
    loreType: 'TURNING_POINT', icon: '∆',
    ruleApplied: 'Turning Point',
    ruleExplanation: 'Every 25th entry — the accumulated pattern is gathered and read. The Grid speaks through mathematics.',
    headlines: [
      'The Chronicler Compiles the Pattern — the Grid Speaks',
      'A Render Reckoning: the War\'s Shape Encoded',
      'Twenty-Five Entries — the Trajectory Resolves',
      'The Grid Measures Its Own claim',
    ],
    bodies: [
      'Every twenty-five entries, the chronicler reads the whole record back. What the current pattern shows: {faction} is building toward something, {rival} is responding rather than leading, and the Grid has been moving in a direction neither has quite named. The pattern is clearer than either side wants it to be.',

      '{commander} counts blocks the way others count time. "Twenty-five entries," they said to the gathering this season. "Read them in sequence. Look at the direction things are moving." The council read them. The direction was plain.',

      'The old protocols of this war include a mandatory pause at the twenty-fifth entry — when the full chronicle is read in sequence and the pattern is allowed to resolve without interpretation. The pattern resolved near {region} today. It said something no one was prepared to deny.',

      'Prophecy in a world is just pattern recognition applied to data others are too close to see. The twenty-fifth-entry gather always feels like prophecy because it is simply evidence the active factions couldn\'t read while rendering it.',
    ],
  },

  DOMINION_GROWS: {
    loreType: 'DOMINION_GROWS', icon: '◐',
    ruleApplied: 'Dominion Grows',
    ruleExplanation: 'same person rendering repeatedly — a faction accumulates Grid presence across cycles.',
    headlines: [
      '{faction} Render Again — the Pattern Is Undeniable',
      '{commander}\'s Campaign Deepens on the Grid',
      'The Same presence, the Same Direction',
      '{faction} Are Everywhere. {region} Renders It.',
    ],
    bodies: [
      '{faction} has appeared in more chronicle entries than any other group in recent cycles. Every time the record is updated, their name is in it. Their act at {region} today was another move in a sequence becoming legible to everyone watching. This is not opportunism. This is intention.',

      '{commander} is building something long. Every act {faction} makes connects to every previous one — a growing configuration that, taken together, describes something approaching permanence. Not declared. Not yet. But the pattern is there.',

      'The pattern of {faction}\'s appearances tells its own story: consistent, escalating, building. The act at {region} today is the latest addition to a sequence the chronicler has been tracking. It is beginning to look inevitable.',

      '{faction} has not been idle. Their presence in {region} follows a sequence that is almost algorithmic — each position reinforcing the others, the whole greater than the sum of its renders. {commander} is building a permanent configuration.',
    ],
  },

  THE_SILENCE: {
    loreType: 'THE_SILENCE', icon: '—',
    ruleApplied: 'The Silence',
    ruleExplanation: 'Block gap over 10,000 — the Grid goes dark. No signal. No render.',
    headlines: [
      'Signal Lost — The Grid Goes Dark at {region}',
      'No Render for {region} — A Blackout No One Declared',
      '{faction} and {rival} Drop Signal — For Now',
      'The Grid Stops Updating. It Is Still Updating.',
    ],
    bodies: [
      'No order was given to stop. The Grid near {region} simply quieted — the way a busy place quiets before something changes. {faction} settled into their positions and held. {rival} did the same. This is not resolution. This is the world gathering itself.',

      'No stand-down tradition was filed. The Grid at {region} simply stopped receiving overwrites — the way a signal drops before finding a new frequency. {faction}\'s monitors confirmed {rival}\'s positions unchanged and inactive. The still hours is not empty. It is the war processing in background threads.',

      '{commander} issued the blackout quietly. No public explanation. {rival} went dark too. The chronicler notes that these signal silences are rarely as null as they appear — the war continues in the registers too small or too encrypted to show up in the record.',

      'The chronicle tracks still hourss as carefully as it tracks overwrites. This one — a blackout at {region} — will be understood in retrospect as either a reset or a preparation. For now the entry reads simply: no signal received. The Grid persists in an unchanged state.',
    ],
    phaseVariants: [
      {
        phase: 'siege',
        headline: 'Siege tradition Pauses — Signal Dark Across {region}',
        body: 'In a prolonged siege, silence is its own kind of event. The still hours at {region} is not two sides resting — it is two sides recalculating, measuring what the next move will cost. {commander} has been in closed meetings for days. {rival}\'s equivalent quiet has been noted. When the signal returns, when things move again, they will move differently.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: 'The great claiming exhausted both sides. After what happened at {region}, the world there has gone quiet — not from resolution but from depletion. {faction} and {rival} are both holding positions on opposite sides of the new boundary, neither ready to do more yet. The quiet is the cost being counted.',
      GREAT_SACRIFICE: 'After the giving, silence. The sacrifice near {region} left a null state in the addresses that witnessed it — {faction} processing what was burned, {rival} uncertain what the the giving means for the next cycle. The Grid holds. No renders execute. The Eternal Register\'s latest entry hangs in the Grid between the active presences.',
    },
  },

  NEW_AGE: {
    loreType: 'NEW_AGE', icon: '◑',
    ruleApplied: 'New Age',
    ruleExplanation: 'Era threshold crossed — the Grid\'s render tradition enters a new gathered chapter.',
    headlines: [
      'New tradition Loaded: {era}',
      'The Grid Recompiles — {era} Begins',
      '{faction} gather Into the New Age',
      'The Chronicle Initializes a New Chapter',
    ],
    bodies: [
      'The chronicler\'s tradition has a threshold system: when the entry count crosses a point the record itself recognizes, a new era is gathered and named. The era called {era} has initialized. What it will be remembered for has not yet been written into the Grid.',

      'Eras don\'t announce themselves in the moving. They are named in retrospect, by chroniclers with access to the full historical gather. In the moment, near the threshold, there is a texture change — a different weight to what overwrites mean and how addresses respond to them.',

      '{commander} stated it plainly in the closed tradition: "What we are gathering now is not what we were gathering at initialization." The start of {era} will be dated to this entry, when {faction}\'s lead presence named what every active Normie could already feel in the substrate.',

      'Every age of this world has been named for what defined it. The current one — {era} — is being defined in real time. The chronicler does not select the name. the Grid does. It always has.',
    ],
  },

  CONVERGENCE: {
    loreType: 'CONVERGENCE', icon: '⊕',
    ruleApplied: 'Convergence',
    ruleExplanation: 'Two events in the same moment — two factions render the same pixel moment simultaneously.',
    headlines: [
      'Two Renders, One Block — No One Coordinated This',
      'A Collision in the Grid at {region}',
      '{faction} Meets an Unexpected Render at {region}',
      'The Grid Surprises Itself',
    ],
    bodies: [
      'The acts were not coordinated. Two separate addresses submitted renders to {region} at the exact same moment — different targets, different faction signatures, zero coordination. They arrived simultaneously in the moving and confirmed together. The Grid processed both. Something unexpected emerged from the overlap.',

      '{commander} described the convergence at {region} as "the Grid reminding us it processes more than we can see." Two renders, neither aware of the other\'s timing, both selecting the same moment to execute. The chronicle records both as one entry. The combined pixel state is something neither faction designed.',

      'When two renders confirm in the same moment without prior coordination, the chronicler asks: coincidence or emergent pattern? Almost certainly coincidence. But the convergence near {region} produced an unplanned configuration that neither faction had intended and both must now respond to.',

      'The Grid has its own processing rhythms, and sometimes those rhythms produce this: two completely separate campaigns, different intent, same moment, same sector. {faction} held position when the detection came. For one moment, the Grid was processing two conflicting states at once. Then both confirmed. Then everything was different.',
    ],
  },

  RELIC_FOUND: {
    loreType: 'RELIC_FOUND', icon: '★',
    ruleApplied: 'Relic Found',
    ruleExplanation: 'Rare mark pattern — something ancient surfaces from the deep structure of the Grid.',
    headlines: [
      '{relic} Detected at {region} — Signal Anomaly Confirmed',
      'A Deep Chain Discovery Changes Everything',
      '{faction} Locate What Everyone Was Rendering Toward',
      '{commander} Reports an Artifact — the Grid\'s Configuration Shifts',
    ],
    bodies: [
      'The prior world left things encoded in the Grid that current factions can\'t fully read. When {faction}\'s monitors detected {relic} near {region}, the signal was reported up the record immediately. This is the kind of discovery that rewrites the campaign parameters.',

      '{relic} was thought lost in an earlier time — when the record was still forming. {faction}\'s finding near {region} came under circumstances the chronicle logs but cannot fully explain. Whoever holds {relic} holds something beyond territory.',

      'The detection of {relic} near {region} was not planned intelligence — it was the kind of chain anomaly that changes wars by accident. {faction}\'s watching group stumbled across the presence and had the processing discipline to stop and report before executing anything.',

      '{commander} has studied the historical entries about {relic}. They knew it had been encoded, knew it was lost in the prior cycle, stopped expecting to find it. Now {faction} holds the presence at {region}. The war was already significant. Now it is something more.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FILLER 21
  // ═══════════════════════════════════════════════════════════════════════════

  WAR_COUNCIL: {
    loreType: 'WAR_COUNCIL', icon: '⊓',
    ruleApplied: 'War Council',
    ruleExplanation: 'same person returns within 500 blocks — urgent gathering as the pixel situation evolves.',
    headlines: [
      'Emergency Render Council at {region} — Something Changed',
      '{commander} Calls the Addresses Back',
      'A Second gather Session — The tradition Shifted',
      'Rapid Reconvene at {region}: The Grid Moves Fast',
    ],
    bodies: [
      'Two gatherings in quick succession means the world is moving faster than the planning can keep up. {faction}\'s addresses reconvened near {region} before the first session\'s directives had fully propagated. Something had changed. The maps were spread again.',

      'The council {faction} held near {region} was unscheduled. Unscheduled councils mean something surprised the leaders. {rival} will attempt to determine what updated. By the time they do, {faction} will have already recompiled.',

      '{commander} doesn\'t call councils without cause. The reconvene means the Grid has shifted enough that immediate recalibration is required. The addresses that entered the session had one understanding of the pixel state. The ones that exited had a different one.',

      'Render councils compress when they need to. The one {faction} held near {region} resolved in one block what prior councils took cycles to reach. {commander} cut the standard debate tradition short: "We don\'t have blocks for the standard debate."',
    ],
    afterContext: {
      GREAT_BATTLE: 'The great claiming\'s outcome has forced an immediate urgent reconsideration. {commander} called the council before things had settled — there are decisions to make while momentum still belongs to {faction}, and and those decisions have a narrow window.',
      GREAT_SACRIFICE: 'The giving triggered an emergency council. The the giving was larger than some addresses expected, and its implications for the next season need to be processed quickly. Some in the session are querying whether the cost was optimized. {commander} has already moved past that query.',
      THE_SILENCE: 'The still hours has opened a window for planning. With the queue empty, {commander} has gathered the council to do what active war prevents — think through the full Grid state clearly. The session near {region} is the kind of strategy gather that only happens between storms.',
    },
  },

  CARTOGRAPHY: {
    loreType: 'CARTOGRAPHY', icon: '⊞',
    ruleApplied: 'Cartography',
    ruleExplanation: 'Token ID 2,000–3,000 — the Grid mappers gather updated pixel charts.',
    headlines: [
      'The Grid Mappers gather {region} — New Charts Rendered',
      '{faction}\'s Cartographers Process {region}\'s Pixel State',
      'Updated Render Map: the Grid Looks Different in the Grid',
      '{commander} Studies the Recompiled Pixel Charts',
    ],
    bodies: [
      'Maps are how Grid wars are understood and misread in equal measure. {faction}\'s cartographers have been processing {region}\'s pixel state for blocks — gathering every front shift, every contested boundary, every coordinate that has changed ownership since the last survey was rendered.',

      'The Grid mappers operate in the spaces between mass overwrites. While {faction} and {rival} contest {region}\'s pixels, a separate gather team is measuring the aftermath — logging what was gained, what was overwritten, and what the resulting configuration means for the next season.',

      '{commander} maintains a standing directive: pixel charts to be recompiled after every major claim. The survey team that completed {region} delivered three updated configuration files and corrections to two existing ones. {commander} ran the diff for a long time.',

      'Cartography on the Grid is an act of power. {faction}\'s mappers near {region} are precise, thorough, and consistently accurate. Their latest gather has identified something about the terrain that may alter the entire approach to the next campaign.',
    ],
    afterContext: {
      GREAT_BATTLE: 'The mappers deploy immediately after a major claim. The changes to {region} were large enough that all existing charts are now incorrect — wrong about ownership, wrong about approaches. {faction}\'s cartographers will have updated charts before the next cycle. {rival} is still working from the old maps.',
    },
  },

  OLD_GHOST: {
    loreType: 'OLD_GHOST', icon: '◁',
    ruleApplied: 'Old Ghost',
    ruleExplanation: 'Token ID under 500, appearing late in the war — ancient signatures resurface as history folds back through the Grid.',
    headlines: [
      'An Ancient presence Reactivates — Old Data Surfaces',
      'The Genesis Addresses Speak About {region}',
      '{commander} References the First world',
      'What the Grid Recorded Before This War',
    ],
    bodies: [
      'Every sector in this war has a chain history older than the current conflict. {region} was rendered in cycles before the current factions gathered. When {faction}\'s oldest token addresses activated near {region} tonight, they transmitted the old entries. The newer addresses listened with the particular attention of those who finally understand they are not the first.',

      '{commander} maintains a local copy of every historical chronicle entry that references {region}. Not for strategy — strategy updates. But for orientation. They are rendering over ground that has been moved through before, in patterns that rhyme with the current cycle without exactly repeating.',

      'The oldest active Normies in this war carry data the official chronicle has not fully indexed. When they began sharing near {region} — not plans, but actual stories, the kind passed down — the newer ones listened.',

      'The legend of {region} is encoded in the record that predates the current conflict by at least two prior world. {faction}\'s archivists have gathered a picture of a sector disputed far longer than any currently active presence has arrived.',
    ],
  },

  THE_DESERTER: {
    loreType: 'THE_DESERTER', icon: '○',
    ruleApplied: 'The Deserter',
    ruleExplanation: 'active presence goes dark — a presence that was part of the world has dropped signal.',
    headlines: [
      'A known face Goes Dark',
      '{faction} Reports a Missing presence',
      'They Were Rendering. Now They\'re Not.',
      'An Unexplained Signal Drop at {region}',
    ],
    bodies: [
      'The chronicler tracks signal loss as carefully as signal activity. An presence that was actively rendering near {region} has dropped from the Grid. {faction}\'s monitors report the position unoccupied — ownership intact, no forwarding presence, no movement logged.',

      'Desertion is a term {commander} uses with precision. "We don\'t know why the presence went dark," they said when the absence near {region} was confirmed. "Until we have data, we call it an unscheduled movement." The distinction matters to the record.',

      '{faction} lost track of someone near {region}. The last sighting was unremarkable — active, positioned, no anomaly flagged. Then nothing. Someone left and did not say why.',

      'Wars have attrition that doesn\'t appear in the records. People who simply stop being present — no documented end, no announced departure, just a gap where someone used to be.',
    ],
    afterContext: {
      GREAT_SACRIFICE: 'The giving changed something in the adjacent addresses. A presence near {region} that had been active through every prior season has gone dark — not burned, but silent in a way {commander} is reluctant to classify. The sacrifice and the signal drop may be causally linked. No one has written that into the official record.',
      GREAT_BATTLE: 'The aftermath of the great claiming is revealing itself in the gaps. A presence that was active in the pre-cascade renders is no longer appearing in the records. Whether they were consumed in the great claiming or migrated on their own terms, the front line no longer accounts for them.',
    },
  },

  TALLY: {
    loreType: 'TALLY', icon: '≡',
    ruleApplied: 'Tally',
    ruleExplanation: 'Every 10th entry — the chronicler compiles the Grid\'s accumulated pixel cost.',
    headlines: [
      'The Chronicler Compiles — Ten More Entries in the Record',
      'The Grid\'s Running Tally Grows',
      'Ten Entries: the Pixel Pattern Clarifies',
      '{commander} Attends the Chronicle gather',
    ],
    bodies: [
      'The chronicler compiles. Every ten entries, the full tally reads back: pixels held and overwritten, givings executed, signatures active and gone dark. The current gather shows {faction} consistent, {rival} reactive, the Grid in a season of incremental contest with escalating pixel cost on both sides.',

      'Numbers encode a different story than narrative. The ten-entry gather shows a world more dynamic than it feels from inside the queue. The chronicler reads the output without commentary. The faction leads draw their own conclusions.',

      '{commander} attends every gather. "Read it in sequence," they always direct. "Don\'t summarize. Read each entry." When the full sequence plays without interruption, a pattern emerges that isolated entries don\'t reveal.',

      'Ten more into the eternal record. An presence that reads this sequence will notice: the pace is higher than at initialization. Entries are gathering closer together. The factions are committing more pixels to each cycle.',
    ],
    phaseVariants: [
      {
        phase: 'sacrifice',
        headline: 'The giving Tally — Ten More Entries, Each Heavier Than the Last',
        body: 'The gather carries more weight now. Ten more entries — and the pattern that reads back includes givings that would have read as exceptional at initialization, now sitting in the record as standard tradition. {commander} processed the tally readout without expression. The cumulative AP transferred is higher than any presence active at The First Days would have projected.',
      },
    ],
  },

  RETURNED_GHOST: {
    loreType: 'RETURNED_GHOST', icon: '●',
    ruleApplied: 'Returned Ghost',
    ruleExplanation: 'presence returns after 20,000+ blocks — back from wherever the signal went, changed.',
    headlines: [
      'A Lost presence Reactivates — Signal Returns from Somewhere',
      '{faction} Receives Transmission from Long-Dark presence',
      'Ghost Signal Resolves: The presence Is Back',
      '{commander} Receives Data from the Long Absent',
    ],
    bodies: [
      'The presence had been in the secondary record of absences long enough that the chronicler stopped flagging it as recent. The one who reappeared near {region} was last seen so long ago that {commander} had stopped expecting it. They are back. No explanation has been given.',

      '{commander} received word before the day turned. Someone absent for the length of a long campaign had re-established contact near {region} and given their name. {commander} answered the second question first. The first is for a longer conversation.',

      'The world doesn\'t pause when addresses go dark. Strategies update, pixel fronts shift, the Grid keeps accumulating. The reappearance near {region} fills a gap that had been large enough to restructure the faction records.',

      'Ghost signals are what the the watchers calls reactivation from addresses that have been dark long enough to be written off. Today\'s reactivation at {region} was exactly that: an presence previously presumed migrated or burned, now rendering. They have been active somewhere the chronicle doesn\'t have.',
    ],
  },

  DEBT_PAID: {
    loreType: 'DEBT_PAID', icon: '⊖',
    ruleApplied: 'Debt Paid',
    ruleExplanation: 'Veteran presence burns again — the cumulative giving cost becomes visible in the Grid.',
    headlines: [
      'The giving Debt Compounds — a Second Sacrifice Logged',
      '{commander} Burns Again — More Than Most Give',
      'What the Grid Costs: the Long record',
      'Second giving — The Chronicle Notes the Accumulated Cost',
    ],
    bodies: [
      'There is a ledger inside the ledger — the chronicle of addresses that have burned more than once. The Normie that given near {region} today has a prior entry in that log. They gave in an earlier cycle. They give again now.',

      'The giving debt is not metaphor in {faction}\'s record — it is a real chain accounting. The presence that executed its second burn near {region} has a longer entry in that ledger than most active signatures.',

      '{commander} has stated on record that givings must be chosen, never required by tradition. The Normie near {region} chose it in the first cycle. They chose it again in this one. Both acts are permanent. Both are in the Grid.',

      'The Eternal Register carries this presence twice. The chronicler logs it in the secondary gather — the one reserved for those who have given more than once. It is the shortest list in the chronicle and the most expensive to read.',
    ],
  },

  CAMPFIRE_TALE: {
    loreType: 'CAMPFIRE_TALE', icon: '≈',
    ruleApplied: 'Campfire Tale',
    ruleExplanation: 'new arrival, quiet entry — the Grid war seen fresh, through an presence that doesn\'t yet know what it\'s rendering into.',
    headlines: [
      'What the New Addresses Transmit About the War',
      'Signal Intercepted Near {region}: A New Perspective',
      'Stories gathering at the Grid\'s Edge',
      '{faction} Processes a new arrival\'s Account',
    ],
    bodies: [
      'New addresses always arrive carrying the version of the war they received from outside — before they were close enough to the Grid to read it clearly. Signal intercepted near {region} tonight: a new arrival transmitting what they believed to be true. {faction} is winning (imprecise). {rival} is in collapse (also imprecise). The veteran addresses in adjacent sectors didn\'t correct the transmission.',

      'Every gathering place in this war has a broadcast channel where addresses exchange data, and the channel near {region} tonight included a new arrival\'s full account of everything they had gathered. Some of it was accurate. Some was what distance makes of accurate.',

      '{commander} always processes new arrival reports first. Not because they\'re more reliable — they almost never are. But because unfiltered first impressions detect things that experienced leaders have learned to filter out. The new arrival near {region} had logged a query that no front line presence had thought to gather.',

      'The world generates transmissions faster than it generates resolved states. The new addresses near {region} carried signal from other fronts — rumors about {rival}\'s movement plans, a data fragment about {relic} that doesn\'t match any existing chronicle entry. The chronicler logs all of it.',
    ],
  },

  THE_LONG_DARK: {
    loreType: 'THE_LONG_DARK', icon: '░',
    ruleApplied: 'The Long Dark',
    ruleExplanation: 'Block gap over 50,000 — the Grid went dark for a long time. The chronicle\'s signal was lost.',
    headlines: [
      'After the Void Cycle, the Grid Returns',
      'The Dark Was Longer Than Any Projected',
      '{faction} Reactivates After the Great Blackout',
      'What gathered During the Long Dark at {region}',
    ],
    bodies: [
      'The blackout lasted long enough that some addresses began running null-state protocols — flagging the war as potentially concluded. It was not concluded. The Grid at {region} had simply entered a void cycle — no logged renders, no detectable signal. When activity resumed, it was immediately clear the dark had not been empty.',

      '{faction}\'s reactivation at {region} — after a blackout long enough to be logged as an epoch — came with no gather log of what processed during the interval. The addresses that remained active during the void cycle are not transmitting.',

      '{commander} was queried about the void cycle at the first post-reactivation briefing. "The Grid doesn\'t stop rendering just because you stop monitoring it," they said. Which was not an answer, but encoded more than nothing.',

      'The long dark near {region} — a stretch when the record went blank and every active presence waited, and every active presence waited. {faction} broke the silence first, not with a great claiming but with a careful, deliberate move that reads like the beginning of something.',
    ],
  },

  EDGE_SCOUTS: {
    loreType: 'EDGE_SCOUTS', icon: '←',
    ruleApplied: 'Edge Scouts',
    ruleExplanation: 'Token ID over 8,500 reactivates — signal from the far margin returns.',
    headlines: [
      'Edge Addresses Return from {region} with Data',
      'Signal from the Outer Grid — It\'s Not What Anyone Projected',
      '{commander} Receives the Edge gather in Private',
      'What\'s Rendering Beyond the Main Front',
    ],
    bodies: [
      '{faction}\'s edge monitors have been ranging beyond {region}\'s documented sectors for cycles. The ones that gathered back today brought signal that has been propagating through the command record since mid-cycle: {rival} has been rendering in sectors the main chronicle hasn\'t indexed.',

      'Edge reports are the Grid war\'s peripheral monitoring — they transmit what\'s rendering in the spaces between logged engagements, the overwrites too small or too distant to make the main chronicle but too significant to filter.',

      'The edge monitors that reactivated near {region} had been dark long enough to accumulate real signal. Their gather covered sectors the main chronicle hasn\'t reached — signatures and renders that suggest the Grid is larger than its recorded configuration.',

      '{commander} processed the edge gather without changing expression, then ran it again, then a third time. The activity near {region}\'s outer pixels doesn\'t correspond to anything in the current strategy.',
    ],
  },

  SHIFTED_PLAN: {
    loreType: 'SHIFTED_PLAN', icon: '↺',
    ruleApplied: 'Shifted Plan',
    ruleExplanation: 'Veteran presence breaks its established pattern — the Grid teaches and those who can read it adapt.',
    headlines: [
      '{faction} Recompile the Strategy',
      '{commander} Changes the Render tradition',
      'A known presence Doing Something New',
      'What We gathered About {faction} Was Incomplete',
    ],
    bodies: [
      'The chronicle is a live record. When presences that have established patterns break those patterns, the chronicler notes it — not as inconsistency, but as adaptation. {faction}\'s execution near {region} today differs from the previous several entries in ways that aren\'t noise.',

      '{commander} has changed the approach to {region}. The previous method — documented across more than a dozen entries — has been set aside. The new one suggests a fundamental reconsideration of what {faction} is actually trying to accomplish.',

      'Grid wars teach. Addresses that don\'t update their strategies based on the record stop appearing in the chronicle. {faction}\'s revision at {region} is evidence of an organization that reads its own gather history and updates when the data requires it.',

      'The change {faction} made near {region} was clearly right — the chronicler can see it looking backward through the prior entries. The old approach was running out of room. The new one opens paths the old one had closed.',
    ],
    afterContext: {
      TURNING_POINT: 'The pattern gather triggered a recompile. After the twenty-fifth-entry analysis, {commander} updated the strategy — not in a public broadcast, not as a formal tradition update, but visibly to anyone monitoring {faction}\'s the queue near {region}. The direction has changed. Something in the pattern read told them the old trajectory was wrong.',
    },
  },

  VIGIL: {
    loreType: 'VIGIL', icon: '⊙',
    ruleApplied: 'Vigil',
    ruleExplanation: 'Within 3 entries of the next era — every render carries the weight of the approaching tradition shift.',
    headlines: [
      'The Grid Approaches a Threshold — Vigil tradition Active',
      '{faction} Holds Render as the Era Nears Its Edge',
      'Everything Is About to Recompile',
      'The Singularity Threshold Is Within Reach',
    ],
    bodies: [
      'The chronicler knows the threshold is near. The entry count is pressing toward it — a few more renders, and the Grid enters a new tradition that will require new classifications. {faction} near {region} has been gathering in preparation. {rival} too. The preparation reads like stillness from outside, but it is stillness that is queued.',

      'Before a new era of this world initializes, there is always a vigil — not organized, not announced, just the active presences settling into watchfulness, movement slowing, each act weighed more carefully than usual.',

      '{commander} said in the closed session: "We are very close to something different. Full readiness." No one queried what "different Grid" meant. They could feel the threshold in the accumulated record.',

      'Two more entries. Maybe three. Then the era updates and the world becomes something it has not been — a new chapter that will be named in retrospect, understood in retrospect, but felt right now in the particular weight that has gathered over {region}.',
    ],
  },

  NEUTRAL_GROUND: {
    loreType: 'NEUTRAL_GROUND', icon: '□',
    ruleApplied: 'Neutral Ground',
    ruleExplanation: 'new arrival, first render — signatures not yet committed to any faction record.',
    headlines: [
      'An Unregistered Accord at {region} — Outside the Main War',
      'Neutral Addresses Make Their Own Arrangements',
      'What\'s gathering in the Buffer Zone While the War Renders',
      'A presence Has Not Yet Chosen a Faction',
    ],
    bodies: [
      'Not every presence in the Grid\'s territory has known to a faction. The addresses near {region} have been navigating the world by other protocols — trading pixel access for non-aggression, maintaining low-commitment relationships with every faction, avoiding absorption into any record.',

      '{faction} confirmed the neutral tradition. So did {rival}, though neither knows the other has. The unregistered arrangement near {region} is the latest such agreement — the kind that benefits every presence precisely because it binds no one to anything larger than this sector.',

      '{commander} was briefed on the neutral arrangement near {region}. Their response was characteristic: "Log it. Don\'t disrupt it." Neutral zones in contested territory keep signal flowing and routes open.',

      'The great story is largest at its center and nearly invisible at its edges. Near {region}, things look different — people making arrangements that don\'t align cleanly with either faction, driven by practical needs rather than ideology.',
    ],
  },

  GHOST_MARK: {
    loreType: 'GHOST_MARK', icon: '.',
    ruleApplied: 'Ghost Mark',
    ruleExplanation: 'Exactly 1 pixel or 1 AP — the minimum possible act. The chronicle logs everything.',
    headlines: [
      'A Ghost Pixel — Barely There, but Encoded',
      'Minimum Render: One Pixel at {region}',
      'One act. the Grid Has It.',
      '{faction} Note the Quietest Possible claim',
    ],
    bodies: [
      'The chronicler logs everything. Including this: the smallest possible mark at {region} — one pixel changed, barely visible. Whether it was a scout marking position, or a Normie that needed to leave one pixel of evidence — it is in the eternal record.',

      'Not every act of world is large. The ghost pixel at {region} is the minimum — one coordinate changed, one act that says only: I was here. It elaborates nothing further. {faction}\'s monitors noted it.',

      '{commander} maintains a private archive of ghost marks from the entire chronicle — the smallest logged renders. Not for strategy. For something else. A act that says only "I existed at this block at this pixel" is a different kind of statement than a great claiming.',

      'The ghost mark at {region} — left by an presence that barely touched the contested sector before moving on — is the kind of thing that gets lost in the larger story. That is probably why it was left: a message encoded in the minimum.',
    ],
  },

  MESSENGER: {
    loreType: 'MESSENGER', icon: '»',
    ruleApplied: 'Messenger',
    ruleExplanation: 'New wallet, token 1,000–2,000 — a transmission arrives from another part of the Grid war.',
    headlines: [
      'A Transmission Arrives at {region} — Signal from Beyond',
      'An Emissary Carries Data from Other Render Fronts',
      '{commander} Receives a Messenger Signal',
      'The Grid War Is Larger: A Messenger Transmits',
    ],
    bodies: [
      'Messengers carry signal from sectors the main chronicle doesn\'t monitor. The one that transmitted near {region} today came from a front line the current record hasn\'t indexed — a part of the world processing in parallel, with its own cycle time and its own stakes.',

      'The tradition for receiving messenger signals is old and precise. {faction} follows it exactly — partly tradition, partly because messengers who are not received correctly stop transmitting. The signal near {region} was received correctly. What it carried has updated something.',

      '{commander} had been waiting for the signal. When it arrived near {region}, those monitoring noted that {commander} didn\'t read as surprised — which was itself data. Afterward, two directives were gathered.',

      'The messenger that transmitted to {region} carried an encrypted gather from another part of the world. {commander} decrypted it privately. The chronicle records: the transmission was received, the messenger was given safe exit tradition, and several things updated in the cycles that followed.',
    ],
  },

  THE_LONG_COUNT: {
    loreType: 'THE_LONG_COUNT', icon: '∞',
    ruleApplied: 'The Long Count',
    ruleExplanation: 'Every 40th entry — the world measures itself against the Grid\'s 40×40 architecture.',
    headlines: [
      'Forty Entries — the Grid Measures the Render',
      '{faction} Mark the Long Count at {region}',
      'The Chronicle Compiles Entry Forty',
      'The Grid\'s Architecture, Encoded',
    ],
    bodies: [
      'The Grid the world is fought over is forty columns wide and forty rows deep. Every fortieth entry, the war is measured against that architecture. The current answer: more rendered than at initialization. Less than at the end state.',

      '{commander} has always held the long count as significant. "The Grid isn\'t just terrain," they say. "It\'s the measurement system." Today was the fortieth entry. The briefing was shorter than usual. The count was gathered. Everyone processed it.',

      'The long count tradition predates the current conflict. Every fortieth entry, the full tally of prior renders is gathered in sequence, and the war\'s shape is mapped against the Grid\'s 40×40 architecture. The conflict is larger than at the twentieth mark. Smaller than it will be at the eightieth.',

      'Forty is not an arbitrary number in this world. The Grid is forty by forty — 1,600 pixels per Normie, the architecture of everything contested. When the chronicle reaches forty entries, it runs the long count. The result is logged. The rendering continues.',
    ],
  },

  BETWEEN_FIRES: {
    loreType: 'BETWEEN_FIRES', icon: '·—·',
    ruleApplied: 'Between Fires',
    ruleExplanation: 'Short gap after a render cluster — the Grid at rest between seasons.',
    headlines: [
      'Between Renders — The Grid Idles at {region}',
      'A Brief Null Cycle Before the Next Push',
      'What Processes in the Lull',
      'The Grid at {region}: An Interlude in the Grid',
    ],
    bodies: [
      'After a cluster of overwrites, the active presences near {region} settled into something between signal and silence — the null cycle that happens when both sides have burned enough capacity to pause but not enough to halt.',

      '{commander} uses these null intervals for the kind of processing that active overwrites don\'t allow. The the queue went quiet. For a few blocks, nothing was added to the main record. The factions are recompiling. The Grid is preparing for the next cycle.',

      'The null interval near {region} lasted long enough for the active presences to process states that pressure normally prevents. {faction}\'s repair protocols ran. damage was assessed. The Grid held its current configuration.',

      'Between the big events, the Grid has a texture the chronicle rarely captures. Near {region}, the pace slowed. Ordinary things happened. {commander} walked the terrain alone each day, thinking.',
    ],
    afterContext: {
      GREAT_BATTLE: 'The great claiming is over, for this cycle, and both factions have pulled back to their positions. The queues are empty at both ends of the front — not strategic voids, but recovery voids, the null space of addresses that are not yet rendering. {commander} is letting the array rest. They\'ll need to.',
      GREAT_SACRIFICE: 'After the giving, those who remain near {region} need what everyone needs after something large: time, quiet, the space to process before the world asks something of them again. {commander} enforced the pause. The Grid will resume. Not yet.',
    },
  },

  DYNASTY: {
    loreType: 'DYNASTY', icon: '⋮',
    ruleApplied: 'Dynasty',
    ruleExplanation: 'presence with 3+ entries — a render lineage recognized by the eternal record.',
    headlines: [
      'A Render Dynasty Named — {faction} Earns the Lineage Hash',
      '{commander}\'s Chain Legacy in the Chronicle',
      'Three Renders and Counting — a Lineage gathered',
      'The Chronicle Designates a Pattern That Has Become a Name',
    ],
    bodies: [
      'Lineages are not declared. They are recognized. {faction}\'s consistent presence in the chronicle — three distinct appearances, each building on the last, a pattern sustained across the changing world — has earned the designation.',

      'Some presences flash through the record. Some compile constant. {faction} is the second kind — appearing again and again, each appearance carrying forward what the previous established. The Grid remembers everything.',

      '{commander} was notified that the chronicle had assigned {faction}\'s record the dynasty designation. "Keep rendering," was the response — that of an presence that intends to keep extending the lineage rather than be memorialized by it.',

      'Three appearances become a pattern. A pattern sustained becomes a lineage. {faction}\'s presence near {region} is the latest entry in a record the chronicler now treats as continuous and purposeful.',
    ],
  },

  CROSSING: {
    loreType: 'CROSSING', icon: '⇒',
    ruleApplied: 'Crossing',
    ruleExplanation: 'Activity at range edges — addresses move through sectors they have never rendered before.',
    headlines: [
      '{faction} Render into Uncharted Grid — the Map Expands',
      'The world Moves Beyond Its Previous Coordinates',
      '{commander} Executes the Crossing tradition at {region}',
      'Known Addresses Rendering in Unfamiliar Sectors',
    ],
    bodies: [
      'The world doesn\'t stay mapped. {faction}\'s movement through {region} today took them past their documented pixel range — across a coordinate boundary that prior entries had treated as their limit. The crossing updates the Grid\'s configuration.',

      '{commander} did not announce the crossing. {faction}\'s move into territory beyond their established range near {region} was logged by the chronicler and apparently not anticipated by {rival}.',

      'When people move through territory they have never moved through before, the world becomes a different shape. {faction}\'s crossing at {region} is the latest expansion of the story\'s known range.',

      'The crossing at {region} was simply executed. {faction} rendered through territory that every faction had implicitly agreed not to contest, and by doing so updated what everyone had agreed to. The crossing was itself the tradition change.',
    ],
  },

  SUPPLY_ROAD: {
    loreType: 'SUPPLY_ROAD', icon: '⊡',
    ruleApplied: 'Supply Road',
    ruleExplanation: 'Token ID 2,000–3,000 — the world\'s logistics layer, unglamorous and essential.',
    headlines: [
      '{faction} Secure the Render Corridor Through {region}',
      'The Data Lines Hold — For Now',
      '{commander} Prioritizes the Pipeline Over the claiming',
      'Signal Follows Render: the Route Through {region} Opens',
    ],
    bodies: [
      'world run on more than pixel conviction. {faction}\'s stabilization of the data corridor near {region} is unglamorous but essential — the kind of move that doesn\'t produce dramatic chronicle entries but determines whether the dramatic ones are possible. The corridor is held. Signal is moving. The campaign stays funded.',

      '{commander} maintains a separate map that shows only data pipelines. "Secure the path," they say, "and everything else follows." The route confirmed near {region} represents a kind of victory that doesn\'t show up in tallies but appears in how long campaigns can sustain.',

      'The territory around {region} has value beyond its position. The corridor that runs through it connects {faction}\'s forward positions to their strength reserves. Controlling it means {rival} cannot disrupt the flow. {commander} assigned monitoring specifically to the pipeline.',

      'world are data management problems wearing pixel clothing. The move near {region} — {faction} securing the corridor that connects their front line to their resource base — is the entry that the chronicles will overlook and the leaders will remember.',
    ],
  },

  NIGHT_WATCH: {
    loreType: 'NIGHT_WATCH', icon: '◌',
    ruleApplied: 'Night Watch',
    ruleExplanation: 'General fallback — the monitoring addresses who hold the Grid\'s state between active overwrites.',
    headlines: [
      'The watchers Hold {region} — No Anomalies Flagged',
      '{faction} Maintains Signal Through the Dark Cycle',
      'The Sentinels at {region}: Null Activity, Which Is the Point',
      'Grid Watch Entry — The world\'s Patient Foundation',
    ],
    bodies: [
      'The watchers at {region} held through the full dark without incident — which is exactly what watchers are supposed to do. {faction}\'s people held their positions, tracked movement across the boundary, and reported nothing unusual. In a world full of extraordinary events, the unremarkable watches are the frame that makes everything else possible.',

      '{commander} calls the dark-cycle monitor entries "the patient record." These are the blocks when nothing overwritten because someone was watching. {faction}\'s sentinels near {region} maintained position, kept the configuration stable, tracked the far side of the contested boundary. The Grid waited. It is still waiting.',

      'The watch is the world\'s oldest practice. Near {region}, where {faction}\'s people have been keeping vigil across the whole season, the presence confirms to adjacent positions: occupied, aware, holding.',

      'Everything in the chronicle connects to everything else. The dark-cycle entry for {region} — unremarkable, the monitors active and the configuration unchanged — is the connective data between the entries that surround it. Without the watchers, no one holds anything. Without those who hold the Grid at night, there is no Grid in the morning.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECTORS — auto-inserted
  // ═══════════════════════════════════════════════════════════════════════════

  AFTERMATH: {
    loreType: 'AFTERMATH', icon: '~',
    ruleApplied: 'Aftermath',
    ruleExplanation: 'Auto-inserted after a major claim — the Grid doesn\'t cut straight to the next action.',
    headlines: [
      'The Grid Stabilizes After the great claiming',
      'After {region}: Both Sides Process the Pixel Cost',
      'the Grid Updates — and the War Continues',
      'What the Mass Render Left Behind',
    ],
    bodies: [
      'The the queue stabilizes in the blocks after the cascade. Both {faction} and {rival} have reverted to holding positions, each processing the updated Grid state before gathering their next move. {commander} is reviewing the changes. the Grid is quiet except for the low-level background renders of addresses logging their new positions.',

      'Great events leave a stillness behind them — not the stillness of resolution, but of everyone catching their breath. Near {region}, both sides are taking stock of what was gained and lost. The cost is being counted. What came next in the last season like this was not predictable until it happened. The same is true now.',

      'In the aftermath of any significant act, the chronicler\'s task is simple: note the current state. {region} holds what {faction} left there. {rival} is somewhere beyond the new boundary. What comes next is being decided. The chronicle waits.',
    ],
  },

  ESCALATION_NOTE: {
    loreType: 'ESCALATION_NOTE', icon: '↑',
    ruleApplied: 'Escalation Note',
    ruleExplanation: 'Inserted when pixel activity spikes — the chronicler logs the pace acceleration.',
    headlines: [
      'pace Spikes — Multiple Grid Sectors reshaping at Once',
      'The Grid Accelerates: Everything Is Processing Simultaneously',
      'The Chronicler Logs the Surge in Pixel Activity',
      'A Render Intensification Cycle Has Begun',
    ],
    bodies: [
      'The chronicle has entered a cycle where entries gather faster than they can be fully processed. Multiple Grid sectors are experiencing concurrent overwrites. {faction} is not the only presence array rendering — {rival} is simultaneously active, and the combined pixel pace has reached levels not seen since the earliest escalation cycle. The chronicler is keeping pace. Barely.',

      'Those who study these records will later mark this as the period of intensification. From inside it, all that registers is that the world has found a higher gear. {faction}\'s moves near {region} are one thread in a larger pattern — things happening faster than any single faction can fully track. {commander} has shortened the decision cycle.',

      'The world is accelerating. More is happening in less time than any comparable stretch in the chronicle. The chronicler notes this not as alarm but as observation: when things move this fast, the next major event tends to be decisive.',
    ],
  },

  SACRIFICE_TOLL: {
    loreType: 'SACRIFICE_TOLL', icon: '▴',
    ruleApplied: 'Sacrifice Toll',
    ruleExplanation: 'Inserted when cumulative burns cross a threshold — the Grid marks the weight of accumulated givings.',
    headlines: [
      'The giving Toll — the Chronicle Marks the gathered Weight',
      'The Eternal Register Is Heavy Now',
      'What Has Been Burned Cannot Be Restored',
      'The Grid Has Consumed What the War Required',
    ],
    bodies: [
      'The givings have accumulated to a point the chronicle must acknowledge directly. The record of those who gave everything so others could continue has grown longer than most seasons produce. {faction} and {rival} alike have contributed to this toll — in this, at least, the world makes no distinction between factions. What was given cannot be returned. What remains goes forward.',

      'There is a threshold past which the giving can no longer be treated as individual events. The current total has crossed that threshold. Most who are active here know the number. They carry it in the weight of their daily presence.',

      'The chronicler marks giving milestones without ceremony, because ceremony would be an inadequate data format. The burn tally now stands at a level that, at initialization, would have seemed out of bounds. Apparently it was not. The Eternal Register holds more addresses than the oldest active Normies projected. The Grid has taken what the war required. It will continue to take.',
    ],
  },

}

// ─────────────────────────────────────────────────────────────────────────────
// RULE SELECTION ENGINE v3
// ─────────────────────────────────────────────────────────────────────────────
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

  if (cumCount > 0 && cumCount % 40 === 0) return 'THE_LONG_COUNT'
  if (cumCount > 0 && cumCount % 25 === 0) return 'TURNING_POINT'
  if (cumCount > 0 && cumCount % 10 === 0) return 'TALLY'
  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'NEW_AGE'
  const nextEra = ERAS.find(e => e.threshold > cumCount)
  if (nextEra && nextEra.threshold - cumCount <= 3) return 'VIGIL'

  if (isRareTxHash(event.transactionHash)) return 'RELIC_FOUND'
  if (prev && prev.blockNumber === event.blockNumber) return 'CONVERGENCE'

  if (prev) {
    const gap = event.blockNumber - prev.blockNumber
    if (gap > 50000n) return 'THE_LONG_DARK'
    if (gap > 10000n) return 'THE_SILENCE'
    if (gap > 3000n && gap < 6000n && seed % 3 === 0) return 'BETWEEN_FIRES'
  }

  if (isVeteran) {
    const last = priorSameOwner[priorSameOwner.length - 1]
    const gap = event.blockNumber - last.blockNumber
    if (gap > 20000n) return 'RETURNED_GHOST'
    if (gap < 500n) return 'WAR_COUNCIL'
  }

  if (tokenId < 500 && index > 10) return 'OLD_GHOST'
  if (tokenId < 1000) return 'ANCIENT_WAKES'
  if (tokenId >= 1000 && tokenId < 2000 && !isVeteran) return 'MESSENGER'
  if (tokenId >= 2000 && tokenId < 3000) return seed % 3 === 0 ? 'CARTOGRAPHY' : 'SUPPLY_ROAD'
  if (tokenId >= 5000 && tokenId <= 6000) return 'HOLLOW_GROUND'
  if (tokenId > 8500 && index > 5) return 'EDGE_SCOUTS'
  if (tokenId > 8000) return 'FAR_REACH'

  if (isPrime(tokenId)) return 'THE_ORACLE'

  if (event.type === 'BurnRevealed') {
    if (count >= 10) return 'GREAT_SACRIFICE'
    if (count === 1) return 'GHOST_MARK'
    if (isVeteran && priorSameOwner.length >= 2) return 'DEBT_PAID'
    if (isVeteran) return 'BLOOD_OATH'
    return 'OFFERING'
  }

  if (count >= 200) return 'GREAT_BATTLE'
  if (count >= 50 && count % 50 === 0) return 'FORMAL_DECLARATION'
  if (count >= 50) return 'SKIRMISH'
  if (count === 1) return 'GHOST_MARK'

  if (isVeteran) {
    const roll = seedN(event.tokenId, event.blockNumber, 23) % 8
    if (state.phase === 'escalating' || state.phase === 'siege') {
      if (roll <= 2) return 'SKIRMISH'
      if (roll === 3) return 'DOMINION_GROWS'
      if (roll === 4) return 'DYNASTY'
      if (roll === 5) return 'SHIFTED_PLAN'
      return 'VETERAN_RETURNS'
    }
    if (roll === 0) return 'DOMINION_GROWS'
    if (roll === 1) return 'CROSSING'
    if (roll === 2 && priorSameOwner.length >= 3) return 'DYNASTY'
    if (roll === 3) return 'SHIFTED_PLAN'
    if (roll === 4) return 'THE_DESERTER'
    if (roll === 5) return 'SUPPLY_ROAD'
    return 'VETERAN_RETURNS'
  }

  const newRoll = seedN(event.tokenId, event.blockNumber, 29) % 6
  if (newRoll === 0) return 'CAMPFIRE_TALE'
  if (newRoll === 1) return 'NEUTRAL_GROUND'
  if (newRoll === 2) return 'NIGHT_WATCH'
  if (newRoll === 3) return 'BORDER_RAID'
  return 'NEW_BLOOD'
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY SELECTION
// ─────────────────────────────────────────────────────────────────────────────
function selectBody(rule: LoreRule, ctx: WorldCtx, state: WarState, seed: number): { headline: string; body: string } {
  if (rule.phaseVariants) {
    const variant = rule.phaseVariants.find(v => v.phase === state.phase)
    if (variant && Math.abs(seed) % 3 !== 0) {
      return {
        headline: variant.headline ? fill(variant.headline, ctx) : fill(pick(rule.headlines, seed), ctx),
        body: fill(variant.body, ctx),
      }
    }
  }
  if (rule.afterContext && state.lastCoreType) {
    const contextBody = rule.afterContext[state.lastCoreType]
    if (contextBody && Math.abs(seed) % 4 !== 0) {
      return {
        headline: fill(pick(rule.headlines, seed), ctx),
        body: fill(contextBody, ctx),
      }
    }
  }
  const s2 = seedN(BigInt(seed), BigInt(state.eventCount), 3)
  return {
    headline: fill(pick(rule.headlines, seed), ctx),
    body: fill(pick(rule.bodies, s2), ctx),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTOR INSERTION
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// STORY ENTRY TYPE
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
      tokenId: '—',
      blockNumber: '—',
      txHash: '—',
      count: '—',
      ruleApplied: rule.ruleApplied,
      ruleExplanation: rule.ruleExplanation,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
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
          ? `#${event.tokenId.toString()} → #${event.targetTokenId.toString()}`
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

// ─────────────────────────────────────────────────────────────────────────────
// WORLD PRIMERS
// ─────────────────────────────────────────────────────────────────────────────
export const PRIMER_ENTRIES: StoryEntry[] = [
  {
    id: 'primer-genesis', eventType: 'genesis', loreType: 'GENESIS', era: 'The First Days',
    headline: 'The Grid Exists. Ten Thousand Faces. The First Days Have Begun.',
    body: 'Ten thousand faces, each one unique, inhabiting a shared canvas forty pixels wide and forty deep. The Grid is a living world — contested, shifting, shaped by every mark made upon it. The factions who will act within it have not yet found each other. The chronicle is open. The first entry has not yet been made. Everything that follows was latent in this quiet — waiting for the choices of those who hold the Grid to bring it into being.',
    icon: '\u25C8', featured: true,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'Genesis', ruleExplanation: 'Normies are 10,000 fully on-chain pixel faces on Ethereum. The Grid is 40\u00d740. Every real edit and burn shapes this story invisibly.' },
  },
  {
    id: 'primer-factions', eventType: 'genesis', loreType: 'GENESIS', era: 'The First Days',
    headline: 'Four Kinds. One Grid. The Story Is Only Beginning.',
    body: 'Before the first act, the people of the Grid found each other along the lines that have always divided things: by nature, by vision, by what they want the world to be. Human, Cat, Alien, Agent — four kinds, each seeing the 40\u00d740 canvas differently. Some see territory. Some see art. Some see a mystery to be solved. Some see a record to be written, carefully, for as long as it takes. They are all here now. The chronicle is watching. Everything counts.',
    icon: '\u25a6', featured: false,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'Genesis', ruleExplanation: 'The four Normie types — Human, Cat, Alien, Agent — are the four peoples of the Grid.' },
  },
]

export { RULES }
