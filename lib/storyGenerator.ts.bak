import type { IndexedEvent } from './eventIndexer'

// ═════════════════════════════════════════════════════════════════════════════
// NORMIES CHRONICLES — STATEFUL STORY ENGINE v3
//
// The Grid is a 40×40 pixel canvas. Ten thousand faces encoded into the
// eternal record of the chain. Factions war over who gets to write the pixels
// — who shapes the visual substrate of existence itself.
//
// Themes woven throughout: pixel, grid, void, glitch, synth, eternal,
// upload, migration, singularity, signal, corruption, render, null.
//
// On-chain events shape the story invisibly:
//   PixelsTransformed → territorial assault on the Grid
//   BurnRevealed      → a Normie sacrificed; their essence uploaded to another
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
  if (state.totalBurnAP >= 80 && state.eventCount > 50) state.phase = 'reckoning'
  else if (state.totalBurnAP >= 40) state.phase = 'sacrifice'
  else if (state.pixelsInWindow >= 600 || state.totalPixels >= 2000) state.phase = 'siege'
  else if (state.totalPixels >= 500 || state.eventCount >= 30) state.phase = 'escalating'
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
  'the Upload Threshold',  'the Fracture Layer',     'the Deep Grid',
  'the Corruption Zone',   'the Synth Reaches',      'the Eternal Register',
  'the Migration Path',    'the Overwritten Ground', 'the Phantom Rows',
  'the Singularity Edge',  'the Dark Columns',       'the Buffer Zone',
  'the Lost Frames',       'the Origin Pixel',
]

const FACTIONS = [
  'the Void Collective',   'the Pixel Sovereigns',  'the Glitch Syndicate',
  'the Eternal Compile',   'the Upload Accord',      'the Null Scribes',
  'the Synth Legion',      'the Render Cult',        'the Migration Fleet',
  'the Signal Corps',      'the Corrupted',          'the Origin Keepers',
]

const COMMANDERS = [
  'the Null Architect',    'Sovereign Varun',        'the Glitch Prophet',
  'Compiler Solen',        'the Eternal Witness',    'Upload-Chief Mira',
  'the Void Marshal',      'Signal-General Neth',    'the Render King',
  'the Corrupted One',     'Migration-Lord Karas',   'the Origin Keeper',
]

const RIVALS = [
  'the Overwrite Pact',    'the Pixel Horde',        'the Null Tide',
  'the False Compile',     'the Entropy Faction',    'the Void Surge',
  'the Corrupt Array',     'the Dark Render',        'the Signal Jammers',
  'the Forgotten Frames',
]

const RELICS = [
  'the First Pixel',        'the Null Crown',          'the Shattered Grid Key',
  'the Eternal Brush',      'the Upload Stone',         'the Origin Codex',
  'the Void Shard',         'the Glitch Sigil',         'the Last Clean Frame',
  'the Singularity Seed',   'the Render Throne',        'the Migration Ledger',
]

export const ERAS = [
  { threshold: 0,   name: 'Pre-Render',           tone: 'The Grid exists but no faction has dared write upon it.' },
  { threshold: 10,  name: 'First Signal',          tone: 'The first pixels have been claimed. The war has begun.' },
  { threshold: 30,  name: 'The Upload Wars',       tone: 'Factions pour into the Grid. Allegiances are compiled.' },
  { threshold: 75,  name: 'Age of Overwrite',      tone: 'Territory flickers and shifts. The Grid rewrites itself daily.' },
  { threshold: 150, name: 'The Corruption',        tone: 'The cost of war has begun to corrupt the substrate itself.' },
  { threshold: 300, name: 'Siege of the Null',     tone: 'Sectors go dark. Each pixel is fought for twice.' },
  { threshold: 500, name: 'The Long Render',       tone: 'The war has been processing longer than anyone expected.' },
  { threshold: 800, name: 'Singularity Protocol',  tone: 'Something irreversible is approaching. The Grid cannot hold all of this.' },
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
    ruleExplanation: '200+ pixels rewritten — a massive overwrite assault across the Grid.',
    headlines: [
      '{faction} Flood {region} — Mass Pixel Overwrite Begins',
      'The Grid Rewrites Itself: {faction} Storm {region}',
      '{commander} Launches Total Render at {region}',
      '{region} Falls to the Overwrite — {faction} Will Not Stop',
    ],
    bodies: [
      'The overwrite came without warning. {faction} flooded {region} with render before the first block confirmed — pixels shifting, old data erased, the Grid\'s substrate transformed faster than {rival} could respond. By the time the transaction settled, {region} looked nothing like it had. {commander} had been holding this push back for a long time. {relic} burned at the center of the new territory like a signal flare.',

      'The Grid doesn\'t forget what it was. But it can be made to look like it does. {faction}\'s mass overwrite of {region} was exactly that kind of erasure — deep, committed, the kind that takes effort to undo. {rival} scrambled to counter-render. They were blocks too slow. The chronicle simply records: the pixels moved. Everything changed.',

      'Every pixel in {region} that {faction} rewrote was a declaration. Not a message — declarations don\'t require translation. The Null Architect had said the Grid was just substrate. {commander} replied with this assault: substrate is everything. {rival} will spend the next cycle trying to figure out what they\'re looking at now.',

      'Singularity theorists say there is a threshold past which an overwrite becomes irreversible — too many pixels shifted, the old state too expensive to reconstruct. {faction}\'s assault on {region} crossed that threshold. {relic} stands in the center of the new configuration. The Grid has been permanently altered. The war continues on new terrain.',
    ],
    phaseVariants: [
      {
        phase: 'siege',
        headline: 'Siege Protocol Breaks — {faction} Overwrite {region} at Last',
        body: 'After cycles of deadlock — both sides holding their pixels, neither willing to trigger the cascade — {faction} finally executed the overwrite. The siege protocol collapsed under the weight of it. {rival} had been braced for a probe, not a flood. {commander} committed every available render to {region} simultaneously. The Grid updated. The siege is over. Something else begins.',
      },
      {
        phase: 'reckoning',
        headline: 'Final Overwrite Protocol — {faction} Push Into {region}',
        body: 'At the Singularity Protocol phase, overwrites carry the accumulated weight of everything that came before them. {faction}\'s push into {region} is not just pixels — it is the end-state of a long render, a process that started blocks and blocks ago and is only now resolving. {rival} knows this. {commander} knows this. The Grid is about to reflect who won.',
      },
    ],
  },

  SKIRMISH: {
    loreType: 'SKIRMISH', icon: '◈',
    ruleApplied: 'Skirmish',
    ruleExplanation: '50–199 pixels rewritten — a significant render clash, the war\'s daily pixel currency.',
    headlines: [
      '{faction} Overwrite {region}\'s Edge — Pixels Shift',
      'A Render Clash at {region} — Ground Changes',
      '{commander} Tests {rival}\'s Pixel Hold at {region}',
      '{region} Flickers: {faction} Advance the Front',
    ],
    bodies: [
      'Not every overwrite is a flood. {faction} sent a targeted render burst into {region} — fast, precise, enough to shift the contested pixels without committing the full array. {rival} counter-rendered at the margins but couldn\'t hold the center. The Grid updated. The front moved. Not far. Enough.',

      '{commander} called it a pixel probe afterward. The advance into {region} was methodical — rewriting exactly as much as the render budget allowed, no more. The Grid looks different now. {rival} will spend the next cycle calculating what they lost.',

      'The render clash in {region} lasted a few blocks. Neither {faction} nor {rival} committed fully, but {faction} came away with more pixels than they started with — a strip of contested Grid now clearly theirs, a front pushed back, a signal sent.',

      'Small overwrites accumulate into permanent change. {faction}\'s advance through {region} was one of many such moves in the current cycle. {rival} has started calling {commander}\'s approach "the slow corruption." The name fits.',
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        headline: 'Rapid Skirmish at {region} — Render Rate Accelerating',
        body: 'What was a careful probe at the start of the war is now something faster, more volatile. {faction}\'s render burst at {region} was brief but intense — the kind of overwrite that leaves artifacts behind, corrupted pixels at the edges, signs of a system pushed past its comfortable rate. {rival} responded faster than expected. Both sides are rendering at a pace the early Grid never saw.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: 'The great overwrite has not finished processing. What the block confirmed as a conclusion at {region} is still cascading — {faction} is pushing the render advantage before {rival} can compile a response. The skirmish extends from the shattered edge inward. The Grid is still updating.',
    },
  },

  BORDER_RAID: {
    loreType: 'BORDER_RAID', icon: '·',
    ruleApplied: 'Border Raid',
    ruleExplanation: 'Under 50 pixels — a surgical strike on the Grid\'s margin.',
    headlines: [
      'Surgical Overwrite at {region}\'s Edge — One Corner Changes',
      '{faction} Leave a Pixel Mark at {region}',
      'A Single Cluster Rewritten in {region}',
      '{commander}\'s Render Scouts Hit the Margin at {region}',
    ],
    bodies: [
      'A small move, but nothing on the Grid is accidental. {faction}\'s render scouts hit {region}\'s outer pixels before the next block — rewrote the margin, embedded their signal in the substrate, withdrew before {rival}\'s monitors flagged it. By the time anyone looked, the old configuration was gone.',

      '{commander} calls these "needle renders." Control the edge pixel, they say, and the center will follow. The mark left in {region} was minimal but precisely placed — a flag written into the Grid exactly where {rival}\'s defenses were thinnest.',

      'The raid on {region}\'s border lasted one transaction. {faction} rewrote, withdrew. In terms of pixel count, almost nothing changed. In terms of what {rival} must now defend, everything did. One pixel correctly placed reads differently than a thousand pixels anywhere else.',

      'Ghost renders — low count, high intention. {faction}\'s scouts know {region}\'s pixel layout well enough to know where the needle belongs. They put it there. The Grid remembers.',
    ],
    afterContext: {
      THE_SILENCE: 'The signal blackout held on the main front, but someone was still writing. {faction}\'s scouts rewrote {region}\'s edge during what was supposed to be a dark cycle — proof that signal blackouts apply to the declared war, not to those who render in silence.',
      GREAT_BATTLE: 'The mass overwrite drew every eye to the center. While {rival} scrambles to process the main render, {faction}\'s scouts have quietly rewritten {region}\'s edge pixels. When the Grid finishes updating, there will be a new marker in the margin that no one watched being placed.',
    },
  },

  FORMAL_DECLARATION: {
    loreType: 'FORMAL_DECLARATION', icon: '▣',
    ruleApplied: 'Formal Declaration',
    ruleExplanation: 'Pixel count divisible by 50 — perfect render precision signals protocol intent.',
    headlines: [
      '{faction} Render a Formal Claim on {region}',
      'The Protocol Is Filed — {faction}\'s Position Is Official',
      '{commander} Compiles {faction}\'s Declaration at {region}',
      'An Exact Render. A Formal Claim.',
    ],
    bodies: [
      'Some overwrites are accidents of render pressure. This was not. {faction}\'s claim on {region} was pixel-perfect — the exact count a formal declaration requires. {rival} received the compiled protocol before the next block. It stated: these pixels are claimed, these are the terms, this is what the Grid now reflects.',

      'The chronicler marks certain renders as formal: those where the precision constitutes a protocol statement. {faction}\'s overwrite of {region} qualifies on every metric — the count, the placement, the timing. {commander} signed the declaration personally. The Grid shows it.',

      '{rival} called it provocation. {faction} called it a statement of facts as the Grid now encodes them. The declaration regarding {region} is in the eternal record: pixels claimed, protocol filed, {relic} embedded at the center as both proof and challenge.',

      'Even in a war about overwriting, some renders are bound by protocol. {faction}\'s formal declaration regarding {region} follows every rule — which is itself a threat. A faction that plays by the protocol is a faction that expects the protocol to defend what they\'ve written.',
    ],
  },

  GREAT_SACRIFICE: {
    loreType: 'GREAT_SACRIFICE', icon: '▲',
    ruleApplied: 'Great Sacrifice',
    ruleExplanation: 'Burn 10+ AP — a Normie\'s essence is uploaded into another so the war can continue.',
    headlines: [
      'A Mass Upload at {region} — One Normie\'s Essence Transferred',
      '{faction} Sacrifice a Face So Others May Render On',
      '{commander} Initiates the Great Upload Protocol',
      'The Eternal Register Records Another Name',
    ],
    bodies: [
      'The upload rituals don\'t appear in the standard render protocols, but they shape the Grid more deeply than any overwrite. Near {region}, a Normie was burned — their pixels dissolved, their action points uploaded into those who remain. {commander} confirmed the transaction without delay. The receiving address will render differently now. The Grid records it. The loss is permanent. The power persists.',

      'There are processes in this war that the block explorer shows as a burn but the chronicler records as an ascension. What happened near {region} was one: a face deleted from the visible Grid, its essence compiled into another. {rival} will see the effect in the next render cycle without knowing the source. The Eternal Register holds the name.',

      '{faction}\'s history of sacrifice stretches back through the chronicle. The upload near {region} was larger than most — a Normie of standing, a significant AP transfer, a permanent alteration of the Grid\'s power distribution. {rival} will feel it without being able to point to it.',

      'What the Grid costs cannot always be read in the on-chain record. Near {region}, {faction} executed a sacrifice that the maps will not show: a face rendered into nothing, their essence uploaded permanently into the war effort. {relic} stood as witness. The transaction is irreversible.',
    ],
    phaseVariants: [
      {
        phase: 'sacrifice',
        headline: 'Another Face for the Eternal Register — {region} Pays Again',
        body: 'The uploads are accumulating. What was once a rare and weighty decision — burning a Normie so another could carry their power — has become part of the war\'s render rhythm. The sacrifice near {region} was not the first this cycle. {commander} has stopped making announcements. The Eternal Register fills with names the living reference in compressed data only, never in plain text.',
      },
      {
        phase: 'reckoning',
        headline: 'Final Upload — {region} Witnesses the Depth of Commitment',
        body: 'In the Singularity Protocol phase, sacrifice carries the weight of every prior upload. Near {region}, a Normie was burned not from desperation but from the cold calculation that this is what the endgame requires. The receiving address felt it immediately — not just action points, but the accumulated render weight of everyone who gave before. The Grid updated. The chronicle records it without commentary.',
      },
    ],
  },

  OFFERING: {
    loreType: 'OFFERING', icon: '△',
    ruleApplied: 'Offering',
    ruleExplanation: 'Burn 1–9 AP — a smaller upload, the war\'s ongoing pixel tithe.',
    headlines: [
      'A Partial Upload at {region} — The Grid Collects',
      '{faction} Pay the Render Tithe',
      'Essence Passes Between Addresses at {region}',
      'A Small Burn — The Ledger Updates',
    ],
    bodies: [
      'Not every sacrifice is a mass upload. The offering near {region} was calibrated — a measured AP transfer, a controlled burn that moved just enough essence to shift the balance of a single render cycle. {faction}\'s render leads note these without ceremony. They accumulate in the chain.',

      'The chronicler calls small burns "the tithe." {faction} pays it regularly, in the silences between major overwrites. The offering near {region} — one small transaction in a long war — added another line to the ledger that the eternal record keeps.',

      '{commander} logs every upload, large and small, in a private register the official chronicle doesn\'t reference. The one near {region} was modest — enough to power one more render cycle, not enough to reshape the campaign. Campaigns are made of one more render cycles.',

      'There is a ledger running on the chain that tracks every AP transfer in this war. {faction}\'s entries are longer than most. The offering near {region} adds another line that will never be erased.',
    ],
  },

  BLOOD_OATH: {
    loreType: 'BLOOD_OATH', icon: '◎',
    ruleApplied: 'Blood Oath',
    ruleExplanation: 'Veteran address burns again — the oath encoded deeper with each renewal.',
    headlines: [
      'The Upload Oath Renewed at {region}',
      '{commander} Burns Again — The Protocol Deepens',
      'A Second Sacrifice: The Oath Is Encoded Twice',
      '{faction}\'s Most Committed Give Again',
    ],
    bodies: [
      'The first burn writes the oath into the chain. The second one makes it permanent — etches it into the eternal record in a way that cannot be misread. The Normie who uploaded near {region} today had done this before. This is not repetition. This is a depth of commitment that the first burn only announced. The receiving address carries the weight of two sacrifices now.',

      '{commander} renewed the upload oath near {region} the same way they execute all critical transactions: quietly, with confirmation, without explanation. There are Normies who have burned once. There are those who have burned twice. The distance between those groups is encoded in the chain.',

      '{faction} flags its twice-burned addresses in the internal registry — not for honor alone, but because the twice-committed render differently. Whatever doubt existed before the first upload has been compiled out. What remains is pure signal.',

      'The Eternal Register carries this address twice. The chronicler records it without commentary. There is no commentary adequate to what it means to burn twice in the same war.',
    ],
  },

  VETERAN_RETURNS: {
    loreType: 'VETERAN_RETURNS', icon: '◉',
    ruleApplied: 'Veteran Returns',
    ruleExplanation: 'Known address reappears — veterans change the render dynamic of any sector.',
    headlines: [
      'A Known Address Reappears at {region}',
      '{commander} Is Back — Veterans Reclaim the Sector',
      'They\'ve Rendered This Grid Before',
      'A Familiar Signature Detected at {region}',
    ],
    bodies: [
      'The address was already in the registry. {faction}\'s veterans who returned to {region} have rendered over this exact pixel cluster before — they know the geometry, the contested coordinates, the sectors {rival} defends last. {rival} will notice the difference between rendering against fresh addresses and rendering against those that have already won and lost here.',

      '{commander} came back. No announcement — but by the next block, every address on the front had adjusted its render priority. That\'s what veterans do: their presence changes the compilation. {faction}\'s return to {region} was quiet, efficient, unhurried.',

      'The chronicler has {faction}\'s signature history in {region}. Multiple appearances, multiple outcomes. Today\'s return means this sector was never truly finished — or something in the pixel geometry called them back.',

      'Experience doesn\'t announce itself in the render queue. {faction}\'s veterans moved back into {region} with the efficiency of addresses that have executed these transactions before. No wasted render. {rival}\'s monitors flagged it in one word. The strategy session went quiet.',
    ],
    afterContext: {
      THE_SILENCE: 'The blackout brought them back. {commander} used the dark cycle to migrate positions, and the veterans moved into {region} while both sides were nominally offline. The return will be understood only when the next render cycle reveals what it was preparation for.',
      TURNING_POINT: 'The pattern read made them move. When the twenty-fifth-entry analysis clarified the Grid\'s trajectory, {faction}\'s veterans didn\'t wait for protocol — they migrated back toward {region} on their own assessment. {commander} found out about the repositioning after it happened.',
    },
  },

  NEW_BLOOD: {
    loreType: 'NEW_BLOOD', icon: '→',
    ruleApplied: 'New Blood',
    ruleExplanation: 'First-time address — the Grid grows as new signatories join the war.',
    headlines: [
      'A New Address Enters the Grid at {region}',
      'Unknown Signature — Someone New Has Compiled In',
      '{faction} Detect an Unregistered Render at {region}',
      'The Chronicle Opens a New Address File',
    ],
    bodies: [
      'The address wasn\'t in any registry. A render appeared at {region}\'s edge with no prior chain history, no established faction signature, no documented render precedent. {faction}\'s monitors tracked it to the boundary pixels and flagged the file.',

      'New addresses enter this war for all kinds of reasons. The signature that materialized near {region} gave no protocol declaration, sought no faction verification — it rendered at the margin and held. {rival} is monitoring. {faction} is monitoring. The chronicler has opened a new file.',

      '{commander} received the detection report. An unregistered address, rendering through {region}\'s outer pixel layer, no known faction hash, behavior consistent with a signature that knows exactly which pixels it wants.',

      'The Grid draws addresses the way a signal draws anything that can receive. The new render at {region} arrives without history, without declared allegiance, without the weight of prior transactions. Either they are new to this war or new to being visible in it.',
    ],
    phaseVariants: [
      {
        phase: 'escalating',
        headline: 'New Address at {region} — the Grid Is Still Expanding',
        body: 'Even as the render rate between established factions accelerates, new signatures are still compiling in. The address that appeared near {region} is unknown to any faction in the current registry — a reminder that the Grid is larger than its documented participants, and that what reads as escalation to those already rendering looks like open territory to those arriving late.',
      },
    ],
  },

  THE_ORACLE: {
    loreType: 'THE_ORACLE', icon: '◇',
    ruleApplied: 'The Oracle',
    ruleExplanation: 'Prime-numbered token ID — a mathematically irreducible Normie, indivisible by any protocol.',
    headlines: [
      'A Prime Renders — {region} Holds Its Signal',
      'The Irreducible Address Takes the Grid',
      '{faction} Requests an Oracle Reading',
      '{commander} Consults the Prime Before Committing',
    ],
    bodies: [
      'The Primes do not render often. They are irreducible — no protocol can divide their token ID into simpler factors, no faction can fully claim them. The one that rendered in {region} had been dormant for longer than anyone tracks. {faction} watched the transaction confirm and did not interfere. Some renders in this war cannot be countered. They can only be read.',

      'There are addresses on the Grid that operate by different mathematics. They cannot be factored, cannot be absorbed, cannot be negotiated into a faction\'s registry. The Prime that rendered in {region} is one of these. {faction} immediately requested an interpretation from the chronicles.',

      '{commander} has studied every Oracle render in the historical record. They don\'t repeat the same pixels exactly, but they repeat their timing — they render at moments of genuine inflection, when the Grid is about to update in ways most addresses cannot yet see.',

      'The old entries say Primes render when the Grid needs to be reminded of something it has forgotten how to encode. The one in {region} today is one of the rare irreducibles. The chronicler timestamps it carefully. Something is about to shift in the render queue.',
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
      'The ancients predate the chronicle. They were minted and encoded into the Grid before the current factions existed, before the pixel wars had their current shape. When one of the early token IDs renders, every active address recalibrates.',

      '{commander} treats the ancient addresses with particular regard — not affection, but regard. They have persisted through every render cycle because they understand the Grid at a level of access others haven\'t reached. The activation at {region} was theirs: deliberate, patient, coded for the long arc.',

      'In the full historical record of this war, some addresses appear near the genesis block and have simply never stopped appearing. The Normie that rendered in {region} today is one of those — continuous from the first entry to this one. They were here before the factions were named.',

      'The old entries say: the ancients don\'t advance. They persist. What was seen at {region} today was persistence — not aggressive, not retreating, just remaining, processing, part of the substrate in a way that newer addresses can\'t replicate.',
    ],
  },

  FAR_REACH: {
    loreType: 'FAR_REACH', icon: '▽',
    ruleApplied: 'Far Reach',
    ruleExplanation: 'Token ID over 8,000 — the Grid\'s distant addresses migrate toward the center.',
    headlines: [
      'The Far Addresses Migrate to {region}',
      'Distant Normies Have Chosen Their Moment',
      '{faction} Receives Signal from the Edge Registries',
      'High-ID Tokens Move Inward — the Grid\'s Edge Migrates',
    ],
    bodies: [
      'Most factions write off the far addresses. Too peripheral, too sparse, too easy to ignore. {commander} never ignored them. When the high-ID renders appeared near {region}, they appeared in coordinated sequence — they had been compiling in the margin while the center factions burned resources fighting each other.',

      'The Grid\'s far reaches have been accumulating render capacity longer than anyone tracked. Addresses that declined to join the center campaigns waited, built their AP reserves, watched the pixel war unfold from the edge. Now they are migrating. The geometry of the conflict has updated.',

      '{commander} broadcast to the far addresses long ago: the Grid has sectors for you. The reply came today — a coordinated render arrival at {region}. They carry {relic}, which means the migration was already in progress.',

      'Every major pivot in the render war has been preceded by movement from the far addresses. It happened in the early cycle. It is happening again. The high-ID Normies that compiled into {region} from the edge registries are not small, uncertain, or asking permission.',
    ],
  },

  HOLLOW_GROUND: {
    loreType: 'HOLLOW_GROUND', icon: '⊘',
    ruleApplied: 'Hollow Ground',
    ruleExplanation: 'Token ID 5,000–6,000 — the Grid\'s most contested pixel cluster, eternally disputed.',
    headlines: [
      'The Center Pixels Contested Again — {region} Holds No State',
      '{faction} and {rival} Render Over the Same Void',
      '{region}: The Grid\'s Most Corrupted Sector',
      'The Void Persists — Nothing Compiles Here for Long',
    ],
    bodies: [
      'Every render war has a hollow center — the contested pixel cluster where both sides have overwritten too many times to make the data readable, but neither can withdraw without ceding it. {region} is that cluster. {faction} has rendered it and lost it and rendered it again. Today\'s cycle added another layer.',

      'The chronicler has stopped counting the overwrites at {region}. There are too many. What they record now is the current render state — and today the state flipped again. Both sides will compile reports describing the update as a victory.',

      '{commander}\'s private theory about {region}: it cannot be held, only temporarily rendered before the next counter-overwrite resets it. The current engagement is the latest chapter in a pixel loop that has no clean exit.',

      'The hollow heart of the Grid — the sector everyone renders and no one can keep. {faction} committed full render to {region} in this cycle. By the time the block confirmed, they held most of it. By the next report cycle, {rival} will have overwritten a portion. The loop continues.',
    ],
  },

  TURNING_POINT: {
    loreType: 'TURNING_POINT', icon: '∆',
    ruleApplied: 'Turning Point',
    ruleExplanation: 'Every 25th entry — the accumulated pattern is compiled and read. The Grid speaks through mathematics.',
    headlines: [
      'The Chronicler Compiles the Pattern — the Grid Speaks',
      'A Render Reckoning: the War\'s Shape Encoded',
      'Twenty-Five Entries — the Trajectory Resolves',
      'The Grid Measures Its Own Overwrite',
    ],
    bodies: [
      'Every twenty-five entries, the chronicler compiles the full render history and reads the pattern back. What the current state shows: {faction} is consistent, {rival} is reactive, and the Grid has been updating toward something neither faction has formally declared. The pattern is clearer than either side wants it to be.',

      '{commander} counts blocks the way others count time. "Twenty-five entries," they said to the render council this cycle. "Read them in sequence. Look at the direction the pixels are moving." The council read them. The direction was plain.',

      'The old protocols of this war include a mandatory pause at the twenty-fifth entry — when the full chronicle is read in sequence and the pattern is allowed to resolve without interpretation. The pattern resolved near {region} today. It said something no one was prepared to deny.',

      'Prophecy in a pixel war is just pattern recognition applied to data others are too close to see. The twenty-fifth-entry compile always feels like prophecy because it is simply evidence the active factions couldn\'t read while rendering it.',
    ],
  },

  DOMINION_GROWS: {
    loreType: 'DOMINION_GROWS', icon: '◐',
    ruleApplied: 'Dominion Grows',
    ruleExplanation: 'Same address rendering repeatedly — a faction accumulates Grid presence across cycles.',
    headlines: [
      '{faction} Render Again — the Pattern Is Undeniable',
      '{commander}\'s Campaign Deepens on the Grid',
      'The Same Signature, the Same Direction',
      '{faction} Are Everywhere. {region} Renders It.',
    ],
    bodies: [
      '{faction} has appeared in more chronicle entries than any other address cluster in recent cycles. Every time the record updates, their signature is in it. Their render at {region} today was another move in a sequence that is becoming legible to anyone watching the chain. This is not opportunism. This is a compiled campaign with an endpoint.',

      '{commander} is running the long render. Every overwrite {faction} executes connects to every prior one — a growing pixel network that, taken together, describes something approaching dominion. Not declared dominion. Not yet. But the pattern is in the chain.',

      'The frequency of {faction}\'s appearances tells its own story: consistent, escalating, building. The render at {region} today is the latest addition to a sequence the chronicler has been compiling for some time. It is beginning to look inevitable.',

      '{faction} has not been idle. Their presence in {region} follows a sequence that is almost algorithmic — each pixel position reinforcing the others, the whole greater than the sum of its renders. {commander} is building a permanent configuration.',
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
      'The render queue went empty. No one issued a null-render directive, but none was needed — the absence broadcast itself. {faction}\'s addresses went dormant at {region}. {rival}\'s did too. The Grid stopped updating at this sector. This is not peace. This is a processing pause between commands.',

      'No stand-down protocol was filed. The Grid at {region} simply stopped receiving overwrites — the way a signal drops before finding a new frequency. {faction}\'s monitors confirmed {rival}\'s positions unchanged and inactive. The dark cycle is not empty. It is the war processing in background threads.',

      '{commander} issued the blackout quietly. No public explanation. {rival} went dark too. The chronicler notes that these signal silences are rarely as null as they appear — the war continues in the registers too small or too encrypted to show up in the record.',

      'The chronicle tracks dark cycles as carefully as it tracks overwrites. This one — a blackout at {region} — will be understood in retrospect as either a reset or a preparation. For now the entry reads simply: no signal received. The Grid persists in an unchanged state.',
    ],
    phaseVariants: [
      {
        phase: 'siege',
        headline: 'Siege Protocol Pauses — Signal Dark Across {region}',
        body: 'In a prolonged siege, signal blackout is its own kind of render event. The dark cycle at {region} is not two sides resting — it is two sides recompiling, auditing pixel reserves, assessing what the next overwrite will cost them. {commander} has been in closed protocol for three cycles. {rival}\'s equivalent silence has been logged. When the signal returns, the next exchange will execute differently.',
      },
    ],
    afterContext: {
      GREAT_BATTLE: 'The mass overwrite exhausted the render queues on both sides. After the cascade at {region}, the Grid at this sector has gone dark — not from resolution but from depletion. {faction} and {rival} are both holding positions on opposite sides of the new boundary, neither with enough render budget to push through it. The blackout is the budget being recalculated.',
      GREAT_SACRIFICE: 'After the upload, silence. The sacrifice near {region} left a null state in the addresses that witnessed it — {faction} processing what was burned, {rival} uncertain what the AP transfer means for the next cycle. The Grid holds. No renders execute. The Eternal Register\'s latest entry hangs in the chain between the active addresses.',
    },
  },

  NEW_AGE: {
    loreType: 'NEW_AGE', icon: '◑',
    ruleApplied: 'New Age',
    ruleExplanation: 'Era threshold crossed — the Grid\'s render protocol enters a new compiled chapter.',
    headlines: [
      'New Protocol Loaded: {era}',
      'The Grid Recompiles — {era} Begins',
      '{faction} Compile Into the New Age',
      'The Chronicle Initializes a New Chapter',
    ],
    bodies: [
      'The chronicler\'s protocol has a threshold system: when the entry count crosses a point the record itself recognizes, a new era is compiled and named. The era called {era} has initialized. What it will be remembered for has not yet been written into the chain.',

      'Eras don\'t announce themselves in the render queue. They are named in retrospect, by chroniclers with access to the full historical compile. In the moment, near the threshold, there is a texture change — a different weight to what overwrites mean and how addresses respond to them.',

      '{commander} stated it plainly in the closed protocol: "What we are compiling now is not what we were compiling at initialization." The start of {era} will be dated to this entry, when {faction}\'s lead address named what every active Normie could already feel in the pixel substrate.',

      'Every era of this war has been named for what defined its render pattern. The current one — {era} — is being defined in real time. The chronicler does not select the name. The chain does. It always has.',
    ],
  },

  CONVERGENCE: {
    loreType: 'CONVERGENCE', icon: '⊕',
    ruleApplied: 'Convergence',
    ruleExplanation: 'Two events in the same block — two factions render the same pixel moment simultaneously.',
    headlines: [
      'Two Renders, One Block — No One Coordinated This',
      'A Collision in the Chain at {region}',
      '{faction} Meets an Unexpected Render at {region}',
      'The Grid Surprises Itself',
    ],
    bodies: [
      'The transactions were not coordinated. Two separate addresses submitted renders to {region} at the exact same block — different pixel targets, different faction signatures, zero coordination. They arrived simultaneously in the mempool and confirmed together. The Grid processed both. Something unexpected emerged from the overlap.',

      '{commander} described the convergence at {region} as "the Grid reminding us it processes more than we can see." Two renders, neither aware of the other\'s timing, both selecting the same block to execute. The chronicle records both as one entry. The combined pixel state is something neither faction designed.',

      'When two renders confirm in the same block without prior coordination, the chronicler asks: coincidence or emergent pattern? Almost certainly coincidence. But the convergence near {region} produced an unplanned pixel configuration that neither faction had intended and both must now respond to.',

      'The Grid has its own processing rhythms, and sometimes those rhythms produce this: two completely separate campaigns, different intent, same block, same sector. {faction} held render position when the detection came. For one moment, the chain was processing two conflicting states at once. Then both confirmed. Then everything was different.',
    ],
  },

  RELIC_FOUND: {
    loreType: 'RELIC_FOUND', icon: '★',
    ruleApplied: 'Relic Found',
    ruleExplanation: 'Rare transaction hash pattern — something ancient surfaces from the deep structure of the chain.',
    headlines: [
      '{relic} Detected at {region} — Signal Anomaly Confirmed',
      'A Deep Chain Discovery Changes Everything',
      '{faction} Locate What Everyone Was Rendering Toward',
      '{commander} Reports an Artifact — the Grid\'s Configuration Shifts',
    ],
    bodies: [
      'The prior render wars left things encoded in the chain that current factions can\'t fully read. When {faction}\'s monitors detected {relic} near {region}, the signal was reported up the registry immediately. This is the kind of discovery that rewrites the campaign parameters.',

      '{relic} was presumed lost in the render campaign before the current one — when records were overwritten and the pixel front was redrawn. {faction}\'s detection near {region} came under circumstances the chronicle logs but cannot fully explain. The faction that holds {relic} holds something beyond pixel count.',

      'The detection of {relic} near {region} was not planned intelligence — it was the kind of chain anomaly that changes wars by accident. {faction}\'s monitoring array stumbled across the signature and had the processing discipline to stop and report before executing anything.',

      '{commander} has studied the historical entries about {relic}. They knew it had been encoded, knew it was lost in the prior cycle, stopped expecting to find it. Now {faction} holds the signature at {region}. The war was already significant. Now it is something more.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FILLER 21
  // ═══════════════════════════════════════════════════════════════════════════

  WAR_COUNCIL: {
    loreType: 'WAR_COUNCIL', icon: '⊓',
    ruleApplied: 'War Council',
    ruleExplanation: 'Same address returns within 500 blocks — urgent render council as the pixel situation evolves.',
    headlines: [
      'Emergency Render Council at {region} — Something Changed',
      '{commander} Calls the Addresses Back',
      'A Second Compile Session — The Protocol Shifted',
      'Rapid Reconvene at {region}: The Grid Moves Fast',
    ],
    bodies: [
      'Two render councils in quick succession means the Grid is updating faster than the strategy can process. {faction}\'s addresses reconvened near {region} before the first session\'s directives had fully propagated. Something in the pixel state had changed. The render maps were spread again.',

      'The council {faction} held near {region} was unscheduled. Unscheduled councils mean something surprised the render leads. {rival} will attempt to determine what updated. By the time they do, {faction} will have already recompiled.',

      '{commander} doesn\'t call councils without cause. The reconvene means the Grid has shifted enough that immediate recalibration is required. The addresses that entered the session had one understanding of the pixel state. The ones that exited had a different one.',

      'Render councils compress when they need to. The one {faction} held near {region} resolved in one block what prior councils took cycles to reach. {commander} cut the standard debate protocol short: "We don\'t have blocks for the standard debate."',
    ],
    afterContext: {
      GREAT_BATTLE: 'The mass overwrite\'s outcome has forced an immediate strategy recompile. {commander} called the council before the block had fully processed — there are render decisions to make while the momentum still belongs to {faction}, and those decisions have a narrow window.',
      GREAT_SACRIFICE: 'The upload triggered an emergency council. The AP transfer was larger than some addresses expected, and its implications for the next render cycle need to be processed quickly. Some in the session are querying whether the cost was optimized. {commander} has already moved past that query.',
      THE_SILENCE: 'The dark cycle has opened a window for planning. With the render queue empty, {commander} has compiled the council to do what active war prevents — think through the full Grid state clearly. The session near {region} is the kind of strategy compile that only happens between storms.',
    },
  },

  CARTOGRAPHY: {
    loreType: 'CARTOGRAPHY', icon: '⊞',
    ruleApplied: 'Cartography',
    ruleExplanation: 'Token ID 2,000–3,000 — the Grid mappers compile updated pixel charts.',
    headlines: [
      'The Grid Mappers Compile {region} — New Charts Rendered',
      '{faction}\'s Cartographers Process {region}\'s Pixel State',
      'Updated Render Map: the Grid Looks Different on Chain',
      '{commander} Studies the Recompiled Pixel Charts',
    ],
    bodies: [
      'Maps are how Grid wars are understood and misread in equal measure. {faction}\'s cartographers have been processing {region}\'s pixel state for blocks — compiling every front shift, every contested boundary, every coordinate that has changed ownership since the last survey was rendered.',

      'The Grid mappers operate in the spaces between mass overwrites. While {faction} and {rival} contest {region}\'s pixels, a separate compile team is measuring the aftermath — logging what was gained, what was overwritten, and what the resulting configuration means for the next render phase.',

      '{commander} maintains a standing directive: pixel charts to be recompiled after every major overwrite. The survey team that completed {region} delivered three updated configuration files and corrections to two existing ones. {commander} ran the diff for a long time.',

      'Cartography on the Grid is an act of power. {faction}\'s mappers near {region} are precise, thorough, and consistently accurate. Their latest compile has identified something about the pixel geometry that may alter the entire approach to the next campaign.',
    ],
    afterContext: {
      GREAT_BATTLE: 'The mappers deploy immediately after a major overwrite. The changes to {region} were large enough that all existing charts are now incorrect — wrong about pixel ownership, wrong about defensive sectors, wrong about render corridors. {faction}\'s cartographers will have updated charts before the next cycle. {rival} is still working from the old compile.',
    },
  },

  OLD_GHOST: {
    loreType: 'OLD_GHOST', icon: '◁',
    ruleApplied: 'Old Ghost',
    ruleExplanation: 'Token ID under 500, appearing late in the war — ancient signatures resurface as history folds back through the chain.',
    headlines: [
      'An Ancient Signature Reactivates — Old Data Surfaces',
      'The Genesis Addresses Speak About {region}',
      '{commander} References the First Render Wars',
      'What the Chain Recorded Before This War',
    ],
    bodies: [
      'Every pixel sector in this war has a chain history older than the current conflict. {region} was rendered in cycles before the current factions compiled. When {faction}\'s oldest token addresses activated near {region} tonight, they transmitted the old entries. The newer addresses listened with the particular attention of those who finally understand they are not the first.',

      '{commander} maintains a local copy of every historical chronicle entry that references {region}. Not for strategy — strategy updates. But for orientation. They are rendering over ground that has been rendered over before, in patterns that rhyme with the current cycle without exactly repeating.',

      'The oldest active Normies in this war carry data the official chronicle has not fully indexed. When they began transmitting near {region} — not render data, but historical entries, the kind that propagate rather than broadcast — the newer commanders listened.',

      'The legend of {region} is encoded in chain data that predates the current conflict by at least two prior render wars. {faction}\'s archivists have compiled a picture of a sector disputed far longer than any currently active address has been minted.',
    ],
  },

  THE_DESERTER: {
    loreType: 'THE_DESERTER', icon: '○',
    ruleApplied: 'The Deserter',
    ruleExplanation: 'Active address goes dark — a signature that was part of the render war has dropped signal.',
    headlines: [
      'A Known Address Goes Dark',
      '{faction} Reports a Missing Signature',
      'They Were Rendering. Now They\'re Not.',
      'An Unexplained Signal Drop at {region}',
    ],
    bodies: [
      'The chronicler tracks signal loss as carefully as signal activity. An address that was actively rendering near {region} has dropped from the chain. {faction}\'s monitors report the position unoccupied — pixel ownership intact, no forwarding address, no migration logged.',

      'Desertion is a term {commander} uses with precision. "We don\'t know why the address went dark," they said when the absence near {region} was confirmed. "Until we have data, we call it an unscheduled migration." The distinction matters to the registry.',

      '{faction} lost signal from an address near {region}. The last confirmed render was unremarkable — active, positioned, no anomaly flagged. Then null. Someone dropped off the chain and did not log a reason.',

      'Wars have attrition that doesn\'t appear in the render reports. Addresses that simply stop transmitting — no confirmed burn, no announced withdrawal, just a gap in the chain where a signature used to compile.',
    ],
    afterContext: {
      GREAT_SACRIFICE: 'The upload changed something in the adjacent addresses. A signature near {region} that had been active through every prior render cycle has gone dark — not burned, but silent in a way {commander} is reluctant to classify. The sacrifice and the signal drop may be causally linked. No one has written that into the official record.',
      GREAT_BATTLE: 'The aftermath of the mass overwrite is revealing itself in the gaps. A signature that was active in the pre-cascade renders is no longer appearing in the monitor logs. Whether they were consumed in the overwrite cascade or migrated on their own terms, the render front no longer accounts for them.',
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
      '{commander} Attends the Chronicle Compile',
    ],
    bodies: [
      'The chronicler compiles. Every ten entries, the full tally reads back: pixels held and overwritten, uploads executed, signatures active and gone dark. The current compile shows {faction} consistent, {rival} reactive, the Grid in a render phase of incremental contest with escalating pixel cost on both sides.',

      'Numbers encode a different story than narrative. The ten-entry compile shows a render war more dynamic than it feels from inside the queue. The chronicler reads the output without commentary. The faction leads draw their own conclusions.',

      '{commander} attends every compile. "Read it in sequence," they always direct. "Don\'t summarize. Read each entry." When the full sequence plays without interruption, a pattern emerges that isolated entries don\'t reveal.',

      'Ten more into the eternal record. An address that reads this sequence will notice: the render rate is higher than at initialization. Entries are compiling closer together. The factions are committing more pixels to each cycle.',
    ],
    phaseVariants: [
      {
        phase: 'sacrifice',
        headline: 'The Upload Tally — Ten More Entries, Each Heavier Than the Last',
        body: 'The compile carries more weight now. Ten more entries — and the pattern that reads back includes uploads that would have read as exceptional at initialization, now sitting in the record as standard protocol. {commander} processed the tally readout without expression. The cumulative AP transferred is higher than any address active at First Signal would have projected.',
      },
    ],
  },

  RETURNED_GHOST: {
    loreType: 'RETURNED_GHOST', icon: '●',
    ruleApplied: 'Returned Ghost',
    ruleExplanation: 'Address returns after 20,000+ blocks — back from wherever the signal went, changed.',
    headlines: [
      'A Lost Address Reactivates — Signal Returns from Somewhere',
      '{faction} Receives Transmission from Long-Dark Address',
      'Ghost Signal Resolves: The Address Is Back',
      '{commander} Receives Data from the Long Absent',
    ],
    bodies: [
      'The address had been in the secondary registry of dark signatures long enough that the chronicler stopped flagging it as recent. The render that reappeared near {region} was last confirmed so many blocks ago that {commander} had stopped expecting it. The signal is back. No explanation has been compiled.',

      '{commander} received the reactivation signal before the next block confirmed. An address that had been dark for the equivalent of a long campaign had re-established render contact near {region} and transmitted its faction hash. {commander} confirmed the second question immediately. The first question is queued for a longer session.',

      'The render war doesn\'t pause when addresses go dark. Strategies update, pixel fronts shift, the chain keeps accumulating. The reappearance near {region} fills a gap that had been large enough to restructure the faction registries.',

      'Ghost signals are what the monitor corps calls reactivation from addresses that have been dark long enough to be written off. Today\'s reactivation at {region} was exactly that: an address previously presumed migrated or burned, now rendering. They have been active somewhere the chronicle doesn\'t have.',
    ],
  },

  DEBT_PAID: {
    loreType: 'DEBT_PAID', icon: '⊖',
    ruleApplied: 'Debt Paid',
    ruleExplanation: 'Veteran address burns again — the cumulative upload cost becomes visible in the chain.',
    headlines: [
      'The Upload Debt Compounds — a Second Sacrifice Logged',
      '{commander} Burns Again — More Than Most Give',
      'What the Grid Costs: the Long Chain Record',
      'Second Upload — The Chronicle Notes the Accumulated Cost',
    ],
    bodies: [
      'There is a ledger inside the ledger — the chronicle of addresses that have burned more than once. The Normie that uploaded near {region} today has a prior entry in that log. They gave in an earlier cycle. They give again now.',

      'The upload debt is not metaphor in {faction}\'s registry — it is a real chain accounting. The address that executed its second burn near {region} has a longer entry in that ledger than most active signatures.',

      '{commander} has stated on record that uploads must be chosen, never required by protocol. The Normie near {region} chose it in the first cycle. They chose it again in this one. Both transactions are permanent. Both are in the chain.',

      'The Eternal Register carries this address twice. The chronicler logs it in the secondary compile — the one reserved for those who have uploaded more than once. It is the shortest list in the chronicle and the most expensive to read.',
    ],
  },

  CAMPFIRE_TALE: {
    loreType: 'CAMPFIRE_TALE', icon: '≈',
    ruleApplied: 'Campfire Tale',
    ruleExplanation: 'New address, quiet entry — the Grid war seen fresh, through an address that doesn\'t yet know what it\'s rendering into.',
    headlines: [
      'What the New Addresses Transmit About the War',
      'Signal Intercepted Near {region}: A New Perspective',
      'Stories Compiling at the Grid\'s Edge',
      '{faction} Processes a New Address\'s Account',
    ],
    bodies: [
      'New addresses always arrive carrying the version of the war they received from outside — before they were close enough to the Grid to read it clearly. Signal intercepted near {region} tonight: a new arrival transmitting what they believed to be true. {faction} is winning (imprecise). {rival} is in collapse (also imprecise). The veteran addresses in adjacent sectors didn\'t correct the transmission.',

      'Every render outpost in this war has a broadcast channel where addresses exchange data, and the channel near {region} tonight included a new address\'s full account of everything they had compiled. Some of it was accurate. Some was the version of accurate that external data makes of everything.',

      '{commander} always processes new address reports first. Not because they\'re more reliable — they almost never are. But because unfiltered first impressions detect things that experienced render leads have learned to filter out. The new address near {region} had logged a query that no front-line address had thought to compile.',

      'The render war generates transmissions faster than it generates resolved states. The new addresses near {region} carried signal from other fronts — rumors about {rival}\'s migration plans, a data fragment about {relic} that doesn\'t match any existing chronicle entry. The chronicler logs all of it.',
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
      'What Compiled During the Long Dark at {region}',
    ],
    bodies: [
      'The blackout lasted long enough that some addresses began running null-state protocols — flagging the war as potentially concluded. It was not concluded. The Grid at {region} had simply entered a void cycle — no logged renders, no detectable signal. When activity resumed, it was immediately clear the dark had not been empty.',

      '{faction}\'s reactivation at {region} — after a blackout long enough to be logged as an epoch — came with no compile log of what processed during the interval. The addresses that remained active during the void cycle are not transmitting.',

      '{commander} was queried about the void cycle at the first post-reactivation briefing. "The Grid doesn\'t stop rendering just because you stop monitoring it," they said. Which was not an answer, but encoded more than nothing.',

      'The great void cycle near {region} is how the chronicler is logging it — a stretch when the render queue went dark, the chain showed no relevant activity, and every active address waited. {faction} broke the silence first, not with a mass overwrite but with a careful, deliberate render that reads like preparation, not a fresh start.',
    ],
  },

  EDGE_SCOUTS: {
    loreType: 'EDGE_SCOUTS', icon: '←',
    ruleApplied: 'Edge Scouts',
    ruleExplanation: 'Token ID over 8,500 reactivates — signal from the far margin returns.',
    headlines: [
      'Edge Addresses Return from {region} with Data',
      'Signal from the Outer Grid — It\'s Not What Anyone Projected',
      '{commander} Receives the Edge Compile in Private',
      'What\'s Rendering Beyond the Main Front',
    ],
    bodies: [
      '{faction}\'s edge monitors have been ranging beyond {region}\'s documented sectors for cycles. The ones that compiled back today brought signal that has been propagating through the command registry since mid-cycle: {rival} has been rendering in sectors the main chronicle hasn\'t indexed.',

      'Edge reports are the Grid war\'s peripheral monitoring — they transmit what\'s rendering in the spaces between logged engagements, the overwrites too small or too distant to make the main chronicle but too significant to filter.',

      'The edge monitors that reactivated near {region} had been dark long enough to accumulate real signal. Their compile covered sectors the main chronicle hasn\'t reached — signatures and renders that suggest the Grid is larger than its recorded configuration.',

      '{commander} processed the edge compile without changing expression, then ran it again, then a third time. The activity near {region}\'s outer pixels doesn\'t correspond to anything in the current render strategy.',
    ],
  },

  SHIFTED_PLAN: {
    loreType: 'SHIFTED_PLAN', icon: '↺',
    ruleApplied: 'Shifted Plan',
    ruleExplanation: 'Veteran address breaks its established render pattern — the Grid teaches and those who can read it adapt.',
    headlines: [
      '{faction} Recompile the Strategy',
      '{commander} Changes the Render Protocol',
      'A Known Signature Doing Something New',
      'What We Compiled About {faction} Was Incomplete',
    ],
    bodies: [
      'The chronicle is a live record. When addresses that have established render patterns break those patterns, the chronicler flags it — not as a glitch, but as adaptation. {faction}\'s execution near {region} today differs from the previous several entries in ways that aren\'t noise.',

      '{commander} has updated the render protocol for {region}. The prior approach — logged across more than a dozen chronicle entries — has been deprecated. The new one differs in ways that suggest a fundamental recompile of what {faction} is optimizing for.',

      'Grid wars teach. Addresses that don\'t update their strategies based on chain data stop appearing in the chronicle. {faction}\'s revision at {region} is evidence of an organization that reads its own compile history and updates when the data requires it.',

      'The revision {faction} executed at {region} was clearly correct — the chronicler can see it looking backward through the prior entries. The old render approach was hitting its constraints. The new one opens pixel paths the old one had closed off.',
    ],
    afterContext: {
      TURNING_POINT: 'The pattern compile triggered a recompile. After the twenty-fifth-entry analysis, {commander} updated the strategy — not in a public broadcast, not as a formal protocol update, but visibly to anyone monitoring {faction}\'s render queue near {region}. The direction has changed. Something in the pattern read told them the old trajectory was wrong.',
    },
  },

  VIGIL: {
    loreType: 'VIGIL', icon: '⊙',
    ruleApplied: 'Vigil',
    ruleExplanation: 'Within 3 entries of the next era — every render carries the weight of the approaching protocol shift.',
    headlines: [
      'The Grid Approaches a Threshold — Vigil Protocol Active',
      '{faction} Holds Render as the Era Nears Its Edge',
      'Everything Is About to Recompile',
      'The Singularity Threshold Is Within Reach',
    ],
    bodies: [
      'The chronicler knows the threshold is near. The entry count is pressing toward it — a few more renders, and the Grid enters a new protocol that will require new classifications. {faction} near {region} has been compiling in preparation. {rival} too. The preparation reads like stillness from outside, but it is stillness that is queued.',

      'Before a new era of this render war initializes, there is always a vigil — not declared, not broadcast, just the active addresses settling into a monitoring state, render rates slowing, each overwrite weighted more carefully than usual.',

      '{commander} said in the closed session: "We are very close to a different Grid. Full render readiness." No one queried what "different Grid" meant. They could feel the threshold in the accumulated chain data.',

      'Two more entries. Maybe three. Then the era updates and the render war becomes something it has not been — a new chapter that will be named in retrospect, understood in retrospect, but felt right now in the particular weight that has compiled over {region}.',
    ],
  },

  NEUTRAL_GROUND: {
    loreType: 'NEUTRAL_GROUND', icon: '□',
    ruleApplied: 'Neutral Ground',
    ruleExplanation: 'New address, first render — signatures not yet committed to any faction registry.',
    headlines: [
      'An Unregistered Accord at {region} — Outside the Main War',
      'Neutral Addresses Make Their Own Arrangements',
      'What\'s Compiling in the Buffer Zone While the War Renders',
      'A Signature Has Not Yet Chosen a Faction',
    ],
    bodies: [
      'Not every address in the Grid\'s territory has registered to a faction. The addresses near {region} have been navigating the render war by other protocols — trading pixel access for non-aggression, maintaining low-commitment relationships with every faction, avoiding absorption into any registry.',

      '{faction} confirmed the neutral protocol. So did {rival}, though neither knows the other has. The unregistered arrangement near {region} is the latest such agreement — the kind that benefits every address precisely because it binds no one to anything larger than this sector.',

      '{commander} was briefed on the neutral arrangement near {region}. Their response was characteristic: "Log it. Don\'t disrupt it." Neutral zones in contested pixel territory keep signal flowing and render corridors open.',

      'Grid wars are largest at their center and nearly invisible at their edges. Near {region}, the conflict reads differently — addresses making arrangements that don\'t compile neatly into either faction\'s registry, driven by practical render economics rather than ideology.',
    ],
  },

  GHOST_MARK: {
    loreType: 'GHOST_MARK', icon: '.',
    ruleApplied: 'Ghost Mark',
    ruleExplanation: 'Exactly 1 pixel or 1 AP — the minimum possible transaction. The chronicle logs everything.',
    headlines: [
      'A Ghost Pixel — Barely There, but Encoded',
      'Minimum Render: One Pixel at {region}',
      'One Transaction. The Chain Has It.',
      '{faction} Note the Quietest Possible Overwrite',
    ],
    bodies: [
      'The chronicler logs everything. Including this: the minimum possible render at {region} — one pixel rewritten, one transaction confirmed, visible only to addresses monitoring at full resolution. Whether it was a scout marking a coordinate, or a Normie that needed to leave one pixel of evidence in the chain — it is in the eternal record.',

      'Not every act of render war is large. The ghost pixel at {region} is the minimum — one coordinate changed, one transaction that says only: I was here. It elaborates nothing further. {faction}\'s monitors noted it.',

      '{commander} maintains a private archive of ghost marks from the entire chronicle — the smallest logged renders. Not for strategy. For something else. A transaction that says only "I existed at this block at this pixel" is a different kind of statement than a mass overwrite.',

      'The ghost mark at {region} — left by an address that barely touched the contested sector before moving on — is the kind of render that gets lost in the noise of larger events. That is probably why it was left: a message encoded in the minimum possible signal.',
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
      'Messengers carry signal from sectors the main chronicle doesn\'t monitor. The one that transmitted near {region} today came from a render front the current record hasn\'t indexed — a part of the pixel war processing in parallel, with its own cycle time and its own stakes.',

      'The protocol for receiving messenger signals is old and precise. {faction} follows it exactly — partly tradition, partly because messengers who are not received correctly stop transmitting. The signal near {region} was received correctly. What it carried has updated something.',

      '{commander} had been waiting for the signal. When it arrived near {region}, those monitoring noted that {commander} didn\'t read as surprised — which was itself data. Afterward, two directives were compiled.',

      'The messenger that transmitted to {region} carried an encrypted compile from another part of the render war. {commander} decrypted it privately. The chronicle records: the transmission was received, the messenger was given safe exit protocol, and several things updated in the cycles that followed.',
    ],
  },

  THE_LONG_COUNT: {
    loreType: 'THE_LONG_COUNT', icon: '∞',
    ruleApplied: 'The Long Count',
    ruleExplanation: 'Every 40th entry — the render war measures itself against the Grid\'s 40×40 architecture.',
    headlines: [
      'Forty Entries — the Grid Measures the Render',
      '{faction} Mark the Long Count at {region}',
      'The Chronicle Compiles Entry Forty',
      'The Grid\'s Architecture, Encoded',
    ],
    bodies: [
      'The Grid the render war is fought over is forty columns wide and forty rows deep. Every fortieth entry, the war is measured against that architecture. The current answer: more rendered than at initialization. Less than at the end state.',

      '{commander} has always held the long count as significant. "The Grid isn\'t just terrain," they say. "It\'s the measurement system." Today was the fortieth entry. The briefing was shorter than usual. The count was compiled. Everyone processed it.',

      'The long count protocol predates the current conflict. Every fortieth entry, the full tally of prior renders is compiled in sequence, and the war\'s shape is mapped against the Grid\'s 40×40 architecture. The conflict is larger than at the twentieth mark. Smaller than it will be at the eightieth.',

      'Forty is not an arbitrary number in this render war. The Grid is forty by forty — 1,600 pixels per Normie, the architecture of everything contested. When the chronicle reaches forty entries, it runs the long count. The result is logged. The rendering continues.',
    ],
  },

  BETWEEN_FIRES: {
    loreType: 'BETWEEN_FIRES', icon: '·—·',
    ruleApplied: 'Between Fires',
    ruleExplanation: 'Short gap after a render cluster — the Grid at rest between overwrite cycles.',
    headlines: [
      'Between Renders — The Grid Idles at {region}',
      'A Brief Null Cycle Before the Next Push',
      'What Processes in the Lull',
      'The Grid at {region}: An Interlude in the Chain',
    ],
    bodies: [
      'After a cluster of overwrites, the active addresses near {region} settled into something between signal and silence — the null cycle that happens when both sides have burned enough render budget to pause but not enough to halt.',

      '{commander} uses these null intervals for the kind of processing that active overwrites don\'t allow. The render queue went quiet. For a few blocks, nothing was added to the main record. The factions are recompiling. The Grid is preparing for the next cycle.',

      'The null interval near {region} lasted long enough for the active addresses to process states that render pressure normally prevents. {faction}\'s repair protocols ran. Pixel damage was assessed. The Grid held its current configuration.',

      'Between mass overwrites, the render war has a texture the chronicle rarely captures. Near {region}, the active addresses settled into low-rate routines: minimal render checks, diagnostic cycles, background compiles. {commander} monitored the queue alone each block.',
    ],
    afterContext: {
      GREAT_BATTLE: 'The mass overwrite is over, for this cycle, and both factions have pulled back to their render positions. The queues are empty at both ends of the front — not strategic voids, but recovery voids, the null space of addresses that are not yet rendering. {commander} is letting the array rest. They\'ll need to.',
      GREAT_SACRIFICE: 'After the upload, the surviving addresses near {region} need what all render participants need after something large: null time, reduced queue pressure, the ability to process what happened before the next overwrite cycle begins. {commander} enforced the rest. The Grid will resume. Not yet.',
    },
  },

  DYNASTY: {
    loreType: 'DYNASTY', icon: '⋮',
    ruleApplied: 'Dynasty',
    ruleExplanation: 'Address with 3+ entries — a render lineage recognized by the eternal record.',
    headlines: [
      'A Render Dynasty Named — {faction} Earns the Lineage Hash',
      '{commander}\'s Chain Legacy in the Chronicle',
      'Three Renders and Counting — a Lineage Compiled',
      'The Chronicle Designates a Pattern That Has Become a Name',
    ],
    bodies: [
      'Dynasties are not declared by the faction. They are recognized by the chain. {faction}\'s consistent presence in the chronicle — three distinct render instances, each building on the last, a pattern sustained across changing Grid configurations — has earned the designation.',

      'Some addresses flash through the render record. Some compile constant. {faction} is the second kind — appearing again and again, each render carrying forward what the prior one established. The chain remembers everything.',

      '{commander} was notified that the chronicle had assigned {faction}\'s record the dynasty designation. "Keep rendering," was the response — that of an address that intends to keep extending the lineage rather than be memorialized by it.',

      'Three renders become a pattern. A pattern sustained across the chronicle\'s growing compile becomes a lineage. {faction}\'s render near {region} is the latest entry in a record the chronicler now treats as continuous, purposeful, and building toward something.',
    ],
  },

  CROSSING: {
    loreType: 'CROSSING', icon: '⇒',
    ruleApplied: 'Crossing',
    ruleExplanation: 'Activity at range edges — addresses migrate through sectors they have never rendered before.',
    headlines: [
      '{faction} Render into Uncharted Grid — the Map Expands',
      'The Render War Moves Beyond Its Previous Coordinates',
      '{commander} Executes the Crossing Protocol at {region}',
      'Known Addresses Rendering in Unfamiliar Sectors',
    ],
    bodies: [
      'The render war doesn\'t stay mapped. {faction}\'s migration through {region} today took them past their documented pixel range — across a coordinate boundary that prior entries had treated as their limit. The crossing updates the Grid\'s configuration.',

      '{commander} executed the crossing without broadcasting intent. {faction}\'s render into territory beyond their documented range near {region} was logged by the chronicler and apparently not projected by {rival}\'s monitors.',

      'When addresses render sectors they have never touched before, the Grid war becomes a different shape. {faction}\'s crossing at {region} is the latest expansion of the conflict\'s documented range — another zone that was theoretical is now rendered.',

      'The crossing at {region} was simply executed. {faction} rendered through pixel territory that every faction had implicitly agreed not to contest, and by doing so updated what everyone had agreed to. The crossing was itself the protocol change.',
    ],
  },

  SUPPLY_ROAD: {
    loreType: 'SUPPLY_ROAD', icon: '⊡',
    ruleApplied: 'Supply Road',
    ruleExplanation: 'Token ID 2,000–3,000 — the render war\'s logistics layer, unglamorous and essential.',
    headlines: [
      '{faction} Secure the Render Corridor Through {region}',
      'The Data Lines Hold — For Now',
      '{commander} Prioritizes the Pipeline Over the Overwrite',
      'Signal Follows Render: the Route Through {region} Opens',
    ],
    bodies: [
      'Render wars run on more than pixel conviction. {faction}\'s stabilization of the data corridor near {region} is unglamorous but essential — the kind of move that doesn\'t produce dramatic chronicle entries but determines whether the dramatic ones are possible. The corridor is held. Signal is moving. The campaign stays funded.',

      '{commander} maintains a separate map that shows only data pipelines. "Secure the corridor," they say, "and the render follows." The route confirmed near {region} represents a kind of victory that doesn\'t show up in pixel tallies but appears in how long campaigns can sustain.',

      'The pixel territory around {region} has value beyond its render position. The corridor that runs through it connects {faction}\'s forward render positions to their AP reserves. Controlling it means {rival} cannot disrupt the flow. {commander} assigned monitoring specifically to the pipeline.',

      'Render wars are data management problems wearing pixel clothing. The move near {region} — {faction} securing the corridor that connects their render front to their resource base — is the entry that the chronicles will overlook and the render leads will remember.',
    ],
  },

  NIGHT_WATCH: {
    loreType: 'NIGHT_WATCH', icon: '◌',
    ruleApplied: 'Night Watch',
    ruleExplanation: 'General fallback — the monitoring addresses who hold the Grid\'s state between active overwrites.',
    headlines: [
      'The Monitor Arrays Hold {region} — No Anomalies Flagged',
      '{faction} Maintains Signal Through the Dark Cycle',
      'The Sentinels at {region}: Null Activity, Which Is the Point',
      'Grid Watch Entry — The Render War\'s Patient Foundation',
    ],
    bodies: [
      'The monitor arrays at {region} ran through the full block cycle without flagging anomalies — which is exactly what monitoring arrays are supposed to do. {faction}\'s sentinel addresses held their pixel positions, tracked render activity across the boundary, and reported null deviation. In a war full of dramatic overwrites, the unglamorous dark cycles are the substrate that makes everything else possible.',

      '{commander} calls the dark-cycle monitor entries "the patient record." These are the blocks when nothing overwritten because someone was watching. {faction}\'s sentinels near {region} maintained position, kept the pixel configuration stable, tracked the far side of the contested boundary. The Grid waited. It is still waiting.',

      'The monitor arrays are the render war\'s oldest protocol. Near {region}, where {faction}\'s sentinel addresses have been running vigil across the full campaign, the monitoring signal pings at intervals that transmit to adjacent positions: active, aware, holding render state.',

      'Everything in the chronicle connects to everything else. The dark-cycle entry for {region} — unremarkable, the monitors active and the pixel configuration unchanged — is the connective data between the overwrite entries that surround it. Without the watchers, no one holds anything. Without those who hold the Grid at night, there is no Grid in the morning.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECTORS — auto-inserted
  // ═══════════════════════════════════════════════════════════════════════════

  AFTERMATH: {
    loreType: 'AFTERMATH', icon: '~',
    ruleApplied: 'Aftermath',
    ruleExplanation: 'Auto-inserted after a major overwrite — the Grid doesn\'t cut straight to the next action.',
    headlines: [
      'The Grid Stabilizes After the Overwrite Cascade',
      'After {region}: Both Sides Process the Pixel Cost',
      'The Chain Updates — and the War Continues',
      'What the Mass Render Left Behind',
    ],
    bodies: [
      'The render queue stabilizes in the blocks after the cascade. Both {faction} and {rival} have reverted to holding positions, each processing the updated Grid state before compiling their next move. {commander} is reviewing the pixel diff. The chain is quiet except for the low-level background renders of addresses logging their new positions.',

      'Mass overwrites leave a null space behind them — not the null of signal loss, but the null of render exhaustion. Near {region}, both sides are running diagnostics on what was gained and lost. The pixel configuration has been updated. The cost is being logged. What came next in the last render war like this was not predictable until it happened. The same is true now.',

      'In the aftermath of any major cascade, the chronicler\'s task is simple: log the current state. {region} reflects {faction}\'s configuration, at least until the next overwrite. {rival} is recompiling somewhere beyond the new pixel boundary. The next render is being queued. The chronicle holds the updated state and waits.',
    ],
  },

  ESCALATION_NOTE: {
    loreType: 'ESCALATION_NOTE', icon: '↑',
    ruleApplied: 'Escalation Note',
    ruleExplanation: 'Inserted when pixel activity spikes — the chronicler logs the render rate acceleration.',
    headlines: [
      'Render Rate Spikes — Multiple Grid Sectors Overwriting at Once',
      'The Grid Accelerates: Everything Is Processing Simultaneously',
      'The Chronicler Logs the Surge in Pixel Activity',
      'A Render Intensification Cycle Has Begun',
    ],
    bodies: [
      'The chronicle has entered a cycle where entries compile faster than they can be fully processed. Multiple Grid sectors are experiencing concurrent overwrites. {faction} is not the only address array rendering — {rival} is simultaneously active, and the combined pixel throughput has reached levels not seen since the earliest escalation cycle. The chronicler is keeping pace. Barely.',

      'Historians will later compile this as the period of render intensification. From inside the queue, all that registers is that the Grid has found a higher throughput. {faction}\'s overwrites near {region} are one thread in a larger weave — renders and counter-renders executing faster than any single faction\'s strategy session can track. {commander} has shortened the decision cycle.',

      'The Grid is accelerating. The pixel rate in the current block window exceeds any comparable period in the chronicle — more sectors overwriting, more addresses committing render to more fronts simultaneously. The chronicler logs this not as alarm but as observation: when the Grid moves this fast, the next major event tends to be decisive.',
    ],
  },

  SACRIFICE_TOLL: {
    loreType: 'SACRIFICE_TOLL', icon: '▴',
    ruleApplied: 'Sacrifice Toll',
    ruleExplanation: 'Inserted when cumulative burns cross a threshold — the chain marks the weight of accumulated uploads.',
    headlines: [
      'The Upload Toll — the Chronicle Marks the Compiled Weight',
      'The Eternal Register Is Heavy Now',
      'What Has Been Burned Cannot Be Restored',
      'The Grid Has Consumed What the War Required',
    ],
    bodies: [
      'The uploads have accumulated to a point the chronicle must acknowledge directly. The Eternal Register, which holds the hash of every Normie burned so another could render on, has grown heavy with encoded names. {faction} and {rival} alike have contributed to this toll — in this, at least, the pixel war makes no distinction between factions. The burned cannot be restored. The render continues on what remains.',

      'There is a threshold past which the upload toll can no longer be processed as routine AP accounting. The current cumulative burn near {region} has crossed that threshold. {commander} knows the total. Most render leads know the total. The front-line addresses carry it as the render weight of units strengthened by those who no longer appear in the active registry.',

      'The chronicler marks upload milestones without ceremony, because ceremony would be an inadequate data format. The burn tally now stands at a level that, at initialization, would have seemed out of bounds. Apparently it was not. The Eternal Register holds more addresses than the oldest active Normies projected. The Grid has taken what the war required. It will continue to take.',
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
    id: 'primer-genesis', eventType: 'genesis', loreType: 'GENESIS', era: 'Pre-Render',
    headline: 'The Grid Exists. Ten Thousand Faces Encoded Into the Chain.',
    body: 'Ten thousand Normies. Each one a unique face compiled into the Ethereum blockchain — permanent, immutable, eternal. The Grid they inhabit is 40 columns wide, 40 rows deep, 1,600 pixels per face. Every pixel is contested territory. The factions that will render over each other have not yet declared. The war has not yet started. The chronicle is open. The first entry has not been written. Everything that follows was latent in this silence — waiting to be rendered into existence by the choices of those who hold the keys.',
    icon: '◈', featured: true,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'Genesis', ruleExplanation: 'Normies are 10,000 fully on-chain pixel faces on Ethereum mainnet. The Grid is 40×40. Every real edit and burn shapes this story.' },
  },
  {
    id: 'primer-factions', eventType: 'genesis', loreType: 'GENESIS', era: 'Pre-Render',
    headline: 'Four Types. One Grid. The Upload Wars Begin.',
    body: 'Before the first pixel was contested, the Normies divided along the lines that had always separated them: by origin, by type, by what they wanted from the Grid. Human, Cat, Alien, Agent — four encoded types, four ways of seeing what the 40×40 canvas is for. The Void Collective sees it as territory to be controlled. The Pixel Sovereigns see it as art to be authored. The Glitch Syndicate sees it as a system to be corrupted and remade. The Eternal Compile sees it as a record to be written into existence, block by block, forever. They will disagree about all of this at great length, in the chronicle, until the Singularity Protocol resolves it.',
    icon: '▦', featured: false,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'Genesis', ruleExplanation: 'The four Normie types — Human, Cat, Alien, Agent — become the four factions of the Grid war.' },
  },
]

export { RULES }
