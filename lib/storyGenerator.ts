import type { IndexedEvent } from './eventIndexer'

export type LoreType =
  // 19 core — the main beats of the war
  | 'GREAT_BATTLE'        // massive territorial assault (200+ pixels)
  | 'SKIRMISH'            // mid-scale clash (50–199 pixels)
  | 'BORDER_RAID'         // small tactical strike (<50 pixels)
  | 'FORMAL_DECLARATION'  // round-number pixel count = deliberate act of war/peace
  | 'VETERAN_STRIKES'     // returning warrior, known to the chronicle
  | 'NEW_ARRIVAL'         // first appearance, a stranger enters the conflict
  | 'GREAT_SACRIFICE'     // burn 10+ AP — a warrior gives everything
  | 'OFFERING'            // burn <10 AP — smaller sacrifice
  | 'BLOOD_PACT'          // veteran burn — a sworn oath renewed
  | 'THE_SEER'            // prime token ID — an oracle acts
  | 'ANCIENT_STIRS'       // token <1000 — one of the oldest movers
  | 'EDGE_LORD'           // token >8000 — the far reaches act
  | 'HOLLOW_HEART'        // token 5000–6000 — the contested middle
  | 'PROPHECY'            // every 25th event — fate speaks
  | 'POWER_CONSOLIDATES'  // same address multiple times — a faction grows
  | 'CEASEFIRE'           // block gap >10k — the war pauses
  | 'AGE_TURNS'           // era threshold — a new chapter
  | 'SIMULTANEOUS'        // same-block events — two armies clash at once
  | 'RELIC_UNEARTHED'     // rare tx hash — something ancient surfaces
  | 'GENESIS'
  // 21 connective — texture, lore, flow
  | 'WAR_COUNCIL'         // same address returns fast — strategy meeting
  | 'THE_MAPMAKERS'       // token 2000–3000 — cartographers at work
  | 'OLD_LEGEND'          // token <500 late in chronicle — ancient stories resurface
  | 'DESERTION'           // active address falls silent
  | 'THE_COUNT'           // every 10th event — the chronicler tallies
  | 'GHOST_SIGNAL'        // address gone >20k blocks returns
  | 'DEBT_OF_BLOOD'       // veteran burns 2+ times — the cost accumulates
  | 'TAVERN_TALE'         // new address, quiet entry — overheard stories
  | 'LONG_SILENCE'        // gap >50k blocks — the war went underground
  | 'SCOUT_RETURNS'       // token >8500 re-emerges — news from the edge
  | 'REVISION'            // veteran breaks pattern — tactics change
  | 'THRESHOLD_VIGIL'     // within 3 of era — the world holds its breath
  | 'VILLAGE_ACCORD'      // new address, harmonious — neutral parties
  | 'DUST_MARK'           // exactly 1 pixel/AP — someone was barely here
  | 'EMISSARY'            // new wallet, token 1000–2000 — a messenger arrives
  | 'LONG_COUNT'          // every 40th — the grid measures itself
  | 'INTERLUDE'           // brief gap after cluster — camp life
  | 'LINEAGE'             // 3+ appearances — a dynasty emerges
  | 'THE_CROSSING'        // range bridge — armies cross territories
  | 'MARKET_ROAD'         // token 2000–3000 fallback — trade routes
  | 'WATCH_FIRE'          // fallback filler — sentinels in the night

export interface StoryEntry {
  id: string
  eventType: 'PixelsTransformed' | 'BurnRevealed' | 'genesis'
  loreType: LoreType
  era: string
  headline: string
  body: string
  icon: string
  featured: boolean
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

// ── World elements ────────────────────────────────────────────────────────────
// The Grid is a contested canvas. Each region has a character.
// Factions are the powers fighting over it.

const REGIONS = [
  'the Ashen Flats', 'the Ink Wastes', 'the Pale Reaches', 'the Obsidian Line',
  'the Shattered Moors', 'the Deep Trenches', 'the High Cipher', 'the Wandering Shore',
  'the Null Basin', 'the Root Warrens', 'the Murmur Wood', 'the Fracture Belt',
  'the Old Archives', 'the Ember Fields', 'the Vaulted Dark', 'the Mirror Shelf',
  'the Red Margin', 'the Crossroads', 'the Counting Ground', 'the Unmapped Edge',
]

const FACTIONS = [
  'the Inkborn', 'the Pale Host', 'the Lattice Guard',
  'the Wandering Blades', 'the Archive Wardens', 'the Threshold Keepers',
  'the Deep Company', 'the Signal Corps', 'the Monolith Order',
  'the Unnamed', 'the Far Walkers', 'the Root Scholars',
]

// Named characters who appear in lore — not wallet owners, just world figures
const COMMANDERS = [
  'Commander Varun', 'the Iron Witness', 'Keeper Solen', 'Old Mira of the Flats',
  'the Silent General', 'Warlord Neth', 'the Pale Hand', 'Archivist Teld',
  'the Watcher on the Wall', 'Marshal of the Deep',
]

// Opponents / rivals — used in conflict entries
const RIVALS = [
  'the Eastern Hold', 'the Grey Compact', 'the Splinter King',
  'the Faceless Army', 'the Null Pact', 'the Old Wall',
  'the Ink Tide', 'the Pale Advance', 'the Border Lords', 'the Forgotten Host',
]

// Legendary objects / places that appear in lore
const RELICS = [
  'the Shattered Standard', 'the Crown of the First Grid',
  'the Broken Compass', 'the Last True Map',
  'the Burned Codex', 'the Speaking Stone',
  'the Unmarked Grave', 'the Signal Tower',
  'the First Brush', 'the Pixel Throne',
  'the Oath Stone', 'the War Bell',
]

// Era names — calibrated to ~500–800 real events, so we're early
export const ERAS = [
  { threshold: 0,   name: 'The Quiet Before' },
  { threshold: 10,  name: 'First Blood' },
  { threshold: 30,  name: 'The Arrival' },
  { threshold: 75,  name: 'The Gathering War' },
  { threshold: 150, name: 'Age of Marks' },
  { threshold: 300, name: 'The Deepening' },
  { threshold: 500, name: 'Age of Siege' },
  { threshold: 800, name: 'The Long Campaign' },
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

function buildCtx(tokenId: bigint, blockNumber: bigint, era: string) {
  const s0 = seedN(tokenId, blockNumber)
  return {
    region:    pick(REGIONS,    s0),
    faction:   pick(FACTIONS,   seedN(tokenId, blockNumber, 7)),
    rival:     pick(RIVALS,     seedN(tokenId, blockNumber, 11)),
    commander: pick(COMMANDERS, seedN(tokenId, blockNumber, 13)),
    relic:     pick(RELICS,     seedN(tokenId, blockNumber, 19)),
    era,
  }
}

function fill(t: string, ctx: ReturnType<typeof buildCtx>): string {
  return t
    .replace(/{region}/g,    ctx.region)
    .replace(/{faction}/g,   ctx.faction)
    .replace(/{rival}/g,     ctx.rival)
    .replace(/{commander}/g, ctx.commander)
    .replace(/{relic}/g,     ctx.relic)
    .replace(/{era}/g,       ctx.era)
}

interface LoreRule {
  loreType: LoreType
  icon: string
  ruleApplied: string
  ruleExplanation: string
  headlines: string[]
  bodies: string[]
}

// ── THE 40 RULES ──────────────────────────────────────────────────────────────
// Core philosophy: the on-chain data shapes the story invisibly.
// A large pixel edit = a massive territorial battle.
// A burn = a warrior sacrificed to strengthen another.
// A time gap = ceasefire, retreat, or the war going underground.
// Returning wallet = a veteran commander returning to the field.
// The reader should never think about blockchain — only the world.

const RULES: Record<string, LoreRule> = {

  // ══════════════════════════════════════════════════════════════
  // CORE 19 — The main beats of the Pixel War
  // ══════════════════════════════════════════════════════════════

  GREAT_BATTLE: {
    loreType: 'GREAT_BATTLE', icon: '⚔',
    ruleApplied: 'Great Battle',
    ruleExplanation: 'A massive territorial push — the largest kind of strike.',
    headlines: [
      '{faction} Storm {region} in the Largest Push Yet',
      'The Battle for {region} — {faction} Advance in Force',
      '{commander} Leads {faction} Across {region}',
      'The Grid Shakes: {faction} Launch a Full Assault on {region}',
    ],
    bodies: [
      'The assault on {region} came without warning. {faction} moved their entire force across the contested line before dawn, painting the terrain in their colors before {rival} could organize a response. When the dust settled, the shape of {region} had changed. Territory that had been neutral for weeks now bore {faction}\'s mark from edge to edge. {commander} was seen at the front, giving orders from horseback. This was not a raid. This was a claim.',
      'Historians will debate whether the fall of {region} was inevitable. {faction} had been massing on the border for days, and {rival} had done little to prepare. When the advance came it was overwhelming — a full repainting of the battlefield, a transformation so complete that scouts from the old garrison didn\'t recognize the terrain. {relic} was carried at the head of the column. It always is, when {faction} intends to hold what they take.',
      '{commander} gave the order at first light. By midday, {region} was unrecognizable — the old markings scrubbed out, {faction}\'s patterns laid over every corner of the zone. {rival} mounted a response, but too late. The chronicler on duty wrote simply: "The largest push in recent memory. The Grid has a new master in {region}." Those words will be remembered.',
      'The war has seen many skirmishes. This was not one of them. {faction}\'s advance through {region} was the kind of coordinated, total assault that changes the map permanently. By the time {rival} knew what was happening, the battle was already won. {relic} now hangs at the center of the captured zone, a clear signal to everyone watching: {faction} is not finished.',
    ],
  },

  SKIRMISH: {
    loreType: 'SKIRMISH', icon: '◈',
    ruleApplied: 'Skirmish',
    ruleExplanation: 'A mid-scale territorial clash — real gains, real losses.',
    headlines: [
      '{faction} Press into {region}',
      'A Sharp Engagement Near {region}',
      '{commander} Tests {rival}\'s Resolve',
      'Ground Changes Hands in {region}',
    ],
    bodies: [
      'Not every battle is a siege. {faction} sent a strike force into {region} — fast, targeted, enough to redraw the edge of the contested zone without committing their whole army. {rival} pushed back at the margins but couldn\'t hold the center. By evening, the front line had moved. Not far. Far enough.',
      '{commander} described it afterward as "a probe." {rival} probably had a different word for it. {faction}\'s advance into {region} was the kind of mid-scale engagement that doesn\'t make the headlines but wins campaigns — methodical, disciplined, persistent. The zone looks different now. The momentum is clear.',
      'The fighting in {region} lasted most of the afternoon. Neither {faction} nor {rival} committed fully, but {faction} came away with more than they arrived with. The chronicler notes a shift in the boundary markers. Ground that was grey yesterday is clearly {faction}\'s today. These are the moves that decide wars.',
      'Small victories accumulate. {faction}\'s push into {region} was one of dozens of such moves in the current campaign — each one limited in scope, each one adding to a larger picture. {commander} is patient. {rival} has begun to notice the pattern. The zone is being consumed, one engagement at a time.',
    ],
  },

  BORDER_RAID: {
    loreType: 'BORDER_RAID', icon: '·',
    ruleApplied: 'Border Raid',
    ruleExplanation: 'A small, precise tactical strike — sharp and intentional.',
    headlines: [
      'A Quiet Raid on {region}\'s Edge',
      '{faction} Mark Their Presence at {region}',
      'A Careful Strike — {commander} Leaves a Sign',
      'One Corner of {region} Quietly Changes',
    ],
    bodies: [
      'It was a small move, but nothing in this war is accidental. A handful of {faction}\'s scouts crossed into {region} under cover of night and made their mark — precise, limited, deliberate. {rival} won\'t lose sleep over the territory. But they\'ll know {faction} was there. That\'s the point.',
      '{commander} favors these small incursions. "Control the edge," they say, "and the center follows." The mark left in {region} tonight was minimal — but it was exactly where {faction} wanted it. Scouts from {rival} will find it in the morning. They\'ll have to decide whether to respond. That decision costs them time they don\'t have.',
      'The raid on {region}\'s outer boundary lasted only minutes. {faction} made their mark and withdrew before anyone raised an alarm. These small strikes are how territory erodes. Not in great battles, but in a hundred small moments where {rival} was one step too slow.',
      'Not every move needs to be large to matter. {faction}\'s scouts know this well. The mark they left at the edge of {region} was subtle enough that {rival} might miss it entirely — which is exactly why {commander} ordered it. The war is fought at every scale simultaneously.',
    ],
  },

  FORMAL_DECLARATION: {
    loreType: 'FORMAL_DECLARATION', icon: '▣',
    ruleApplied: 'Formal Declaration',
    ruleExplanation: 'A deliberately measured advance — round numbers signal formal intent.',
    headlines: [
      '{faction} Issue a Formal Declaration of Occupation',
      'The Lines Are Drawn: {faction} Announce Their Terms',
      'A Deliberate Statement in {region}',
      '{commander} Formalizes {faction}\'s Position',
    ],
    bodies: [
      'Some advances are accidents of war. This was not one of them. {faction}\'s move through {region} was measured and precise — a deliberate formal act, the kind that comes with written declarations and witnesses. {rival} received the document before dawn. It listed exactly what {faction} was claiming and under what terms they would consider withdrawing. They will not be withdrawing.',
      'The chronicler marks certain advances as formal — those where the precision of the act suggests a political statement rather than a battlefield necessity. {faction}\'s move in {region} was formal in every sense: coordinated, proportioned, announced. {commander} signed the declaration personally. It will be read aloud at the front.',
      '{rival} called it a provocation. {faction} called it a statement of fact. Either way, the declaration stands: {region} is claimed, the terms are set, and {relic} has been placed at the center of the newly held ground as both symbol and challenge. {commander} awaits a response.',
      'Wars have rules, even when everyone is breaking them. {faction}\'s formal declaration regarding {region} follows those rules precisely — which is itself a kind of threat. An enemy who plays by the rules is an enemy who expects the rules to protect them. {rival} knows what that means.',
    ],
  },

  VETERAN_STRIKES: {
    loreType: 'VETERAN_STRIKES', icon: '◉',
    ruleApplied: 'Veteran Strikes',
    ruleExplanation: 'A warrior who has fought before returns to the field.',
    headlines: [
      'A Known Fighter Returns to {region}',
      '{commander} Is Back — The Veterans Are Moving',
      'They\'ve Fought Here Before',
      'A Familiar Force Reappears in {region}',
    ],
    bodies: [
      'They know this terrain. {faction}\'s veterans who returned to {region} today have fought over this exact ground before — they remember where the sight lines are, where the defensive positions hold and where they don\'t. {rival} will feel the difference between fighting fresh troops and fighting soldiers who have already won and lost here.',
      '{commander} came back. Everyone knew it was only a matter of time. A fighter like that doesn\'t stay away from the war. Their return to {region} was quiet — no announcement, no ceremony — but every unit on the front adjusted when they heard. Veterans change the math of a battle just by showing up.',
      'The chronicler has {faction}\'s record in {region}. They\'ve been here before, left their mark, moved on. The return today means the first campaign wasn\'t finished — or that something unfinished called them back. {rival} has taken note. A seasoned force returned to familiar ground is a different threat than a fresh advance.',
      'Experience doesn\'t announce itself. {faction}\'s veterans moved into position in {region} with the quiet efficiency of people who have done this before. No wasted motion, no testing the terrain they already know. {rival}\'s scouts reported back a single word: "veterans." The commanders on the other side went quiet.',
    ],
  },

  NEW_ARRIVAL: {
    loreType: 'NEW_ARRIVAL', icon: '→',
    ruleApplied: 'New Arrival',
    ruleExplanation: 'A new force enters the war for the first time.',
    headlines: [
      'A New Force Arrives at {region}',
      'Strangers at the Edge of {region}',
      '{faction} Encounter an Unknown Party',
      'Someone New Has Entered the Conflict',
    ],
    bodies: [
      'Nobody recognized the banner. A force arrived at the edge of {region} this morning that doesn\'t appear in any of the chronicle\'s prior records — no known allegiance, no documented history of engagement. {faction}\'s scouts tracked them to the boundary line and reported back. The commanders are asking the same question: whose side are they on?',
      'New players enter the war for all kinds of reasons. The force that appeared near {region} today gave no explanation and sought no introduction. They staked their claim at the margin and waited. {rival} is watching. {faction} is watching. The chronicler has opened a new file.',
      '{commander} received the report at dawn: unknown forces moving through {region}\'s outer edge, no insignia the scouts could identify, behavior consistent with a force that knows where it\'s going. Either they\'re new to the war or new to being visible in it. Both possibilities are interesting.',
      'Wars attract fighters the way fires attract moths. The new force in {region} has no prior chronicle entry — which means either they\'ve been sitting this out until now or they\'ve been very careful not to be noticed. Either way, they\'re noticed now. {faction} has sent emissaries. So has {rival}.',
    ],
  },

  GREAT_SACRIFICE: {
    loreType: 'GREAT_SACRIFICE', icon: '▲',
    ruleApplied: 'Great Sacrifice',
    ruleExplanation: 'A major sacrifice — a warrior gives everything to strengthen another.',
    headlines: [
      'A Great Sacrifice Near {region}',
      '{faction} Give One to Strengthen Many',
      '{commander} Orders the Final Offering',
      'A Warrior Falls — Another Rises Stronger',
    ],
    bodies: [
      'The old rites don\'t appear in the tactical manuals. But {faction} has practiced them since before the chronicle began. A great sacrifice near {region} — a warrior released, their strength transferred to those still fighting. {commander} gave the order. The unit that received the infusion marched out stronger than they arrived. In {region}, that might be the difference.',
      'There are things war requires that commanders don\'t discuss in official reports. The sacrifice made near {region} was one of them — one warrior\'s strength poured into others, a transfer the battlefield theologians call "the final offering." The receiving unit won\'t speak of it. They\'ll carry the weight of it instead.',
      '{faction}\'s chronicles record sacrifices going back to the first campaign. This one, made at the edge of {region}, was larger than most — a substantial transfer of strength from the fallen to the living. The warriors who received it have not said thank you. There is no language for thank you in this context.',
      'The war demands more than tactics. {faction} has always known this. The great sacrifice made near {region} followed a ritual older than the current conflict — one warrior giving all so others might continue. {rival} will see the effect in the next engagement without understanding the source. {commander} prefers it that way.',
    ],
  },

  OFFERING: {
    loreType: 'OFFERING', icon: '△',
    ruleApplied: 'Offering',
    ruleExplanation: 'A smaller sacrifice — strength given, a debt incurred.',
    headlines: [
      'A Small Offering Near {region}',
      '{faction} Make the Quiet Sacrifice',
      'Strength Passes Between Hands',
      'An Offering Is Made — The Balance Shifts',
    ],
    bodies: [
      'Not every sacrifice is a grand gesture. The offering made near {region} today was smaller — a measured transfer, a precise giving of strength from one to another. {faction}\'s commanders note it in the records without ceremony. These small transfers accumulate. The recipient fights a little harder now. That matters.',
      'The battlefield theologians have a name for small sacrifices: "the tithe." {faction} pays it regularly. The offering near {region} was one such tithe — quiet, deliberate, unannounced. {rival} won\'t know what happened. They\'ll just notice that the unit they thought was weakening is not weakening.',
      '{commander} records every offering, large and small. The one made near {region} was modest in scale — enough to matter, not enough to draw attention. War runs on exactly these kinds of careful, unglamorous transfers. The chronicles are full of them.',
      'There\'s a ledger somewhere that tracks every transfer of strength in this war. {faction}\'s accountants are very precise. The offering made near {region} is in that ledger now — another small deposit in the account of the war\'s ongoing cost. The recipient knows what was given. They won\'t forget.',
    ],
  },

  BLOOD_PACT: {
    loreType: 'BLOOD_PACT', icon: '◎',
    ruleApplied: 'Blood Pact',
    ruleExplanation: 'A sworn veteran makes the sacrifice again — deepening the oath.',
    headlines: [
      'A Veteran\'s Oath Renewed Near {region}',
      '{commander} Makes the Sacrifice Again',
      'The Blood Pact Holds — Another Offering Made',
      '{faction} Renew Their Most Sacred Vow',
    ],
    bodies: [
      'The first sacrifice binds. The second consecrates. {faction}\'s veteran who made the offering near {region} today had done so before — and the chronicle remembers. This is not repetition. This is deepening. The receiving warrior now carries weight from two sacrifices, two veterans, two vows. {rival} should understand what that means for what comes next.',
      '{commander} made the vow when they joined the war. They renewed it today near {region}. The blood pact is not a phrase used lightly by {faction} — it refers specifically to warriors who have sacrificed more than once, who have gone through the offering ritual and returned to make it again. The receiving unit felt the difference immediately.',
      'There are warriors in {faction}\'s ranks who have given of themselves more than once. The one who made the offering near {region} today is one of them. The chronicler notes it separately from ordinary sacrifices — the blood pact is its own category, its own weight. {rival}\'s commanders have started tracking which of {faction}\'s units have been reinforced this way. The number is growing.',
      'Second oaths are different from first ones. {faction}\'s veteran who renewed their pact near {region} did so without being asked — a voluntary return to the offering ritual. {commander} accepted it silently. These are the moments the chronicler tries hardest to capture accurately, because they define what {faction} actually believes about the war.',
    ],
  },

  THE_SEER: {
    loreType: 'THE_SEER', icon: '◇',
    ruleApplied: 'The Seer',
    ruleExplanation: 'An oracle acts — a presence that cannot be reduced or divided.',
    headlines: [
      'The Seer Speaks from {region}',
      'An Oracle Moves — {faction} Listens',
      'The Irreducible One Enters the Field',
      '{commander} Seeks the Seer\'s Counsel',
    ],
    bodies: [
      'The Seers are not generals. They don\'t give orders. But when one of them acts in {region}, every faction stops to watch, because Seers act from knowledge no one else has access to. {faction} has been watching this one for weeks. Their move today was small, deliberate, and utterly unreadable. The interpreters are arguing about what it means. {commander} has called an emergency council.',
      'There are exactly as many Seers as there are prime positions in the chronicle — places where the numbers cannot be reduced, where what you see is all there is. The one who moved in {region} today is one of them. {faction} sent an envoy immediately. {rival} sent two. The Seer has not yet acknowledged either.',
      '{commander} has always been suspicious of prophecy. "Tell me what is," they say, "not what will be." But when a Seer takes the field in {region}, even {commander} pays attention. These are not ordinary fighters. Their moves mean something beyond the immediate tactical situation. The chronicle records this one carefully.',
      'The old texts say that Seers move when the war is about to pivot — that their presence on the field is itself a kind of signal. {faction}\'s scholars have been tracking every Seer sighting since the chronicle began. The one in {region} today marks a pattern they\'ve been watching. Something is shifting. The Seer knows it. {commander} wants to know it too.',
    ],
  },

  ANCIENT_STIRS: {
    loreType: 'ANCIENT_STIRS', icon: '■',
    ruleApplied: 'Ancient Stirs',
    ruleExplanation: 'One of the oldest forces in the war acts — the original combatants.',
    headlines: [
      'The Ancients Move Again in {region}',
      'An Original Combatant Stirs',
      '{faction} Reports Activity from the Oldest Lines',
      'One of the First Returns to {region}',
    ],
    bodies: [
      'The ancients predate the chronicle. They were fighting over {region} before anyone started writing things down. When one of them moves, every commander on every side adjusts their maps, because ancient forces operate by different rules — they know the terrain in ways that newer arrivals simply don\'t. {faction}\'s scouts came back shaken. "They were there before us," one said. "They\'ll be there after."',
      '{commander} has a particular respect for the ancient forces. Not affection — respect. They\'ve survived every phase of this war because they understand it at a level others don\'t. The movement in {region} today was one of theirs: deliberate, patient, positioned for the long game. {faction} will adjust. Everyone always adjusts when the ancients move.',
      'In the chronicles of this war, some names appear at the very beginning and have never stopped appearing. The force that moved in {region} today is one of them — present from the first entries, still present now. {rival} has been trying to outlast them since the early campaigns. It has not worked.',
      'The old timers have a saying: "The ancients don\'t advance. They flow." The movement in {region} today looked like flowing — not aggressive, not retreating, just shifting, adjusting, remaining. {faction}\'s strategists spent the afternoon trying to decide if it was an attack or simply the ancient forces finding a more comfortable position. By evening, they had not agreed.',
    ],
  },

  EDGE_LORD: {
    loreType: 'EDGE_LORD', icon: '▽',
    ruleApplied: 'Edge Lord',
    ruleExplanation: 'The far reaches of the war enter the field — the lords of the margins.',
    headlines: [
      'The Edge Lords Move on {region}',
      'Forces from the Far Margin Advance',
      '{faction} Hears News from the Unmapped Edge',
      'The Distant Lords Have Chosen a Side',
    ],
    bodies: [
      'Most commanders ignore the edge. It\'s too far from the main lines, too difficult to hold, too easy to dismiss as irrelevant. {commander} has never ignored the edge. When the forces from the far margin moved today, they moved toward {region} — and suddenly the edge is the main line. {faction} is repositioning.',
      'The far reaches of the war are not empty. They\'ve been filling with fighters for months — forces that didn\'t want to commit to the main campaigns, that waited and watched and built their strength. Now they\'re moving. {faction} first noticed them approaching {region} three days ago. Today they arrived. The margins are no longer marginal.',
      '{commander} sent a rider to the edge lords last month with a simple message: "Your patience is noted. The war has room for you." The response came today, in the form of a coordinated advance on {region}. The edge lords have chosen to commit. The geometry of the war has changed.',
      'The chronicler notes that every major turning point in this war has been preceded by movement from the far reaches. It was true in the early campaigns. It appears to be true now. The forces that crossed into {region} from the unmapped edge today carry {relic} — which means they\'ve been planning this for longer than anyone thought.',
    ],
  },

  HOLLOW_HEART: {
    loreType: 'HOLLOW_HEART', icon: '?',
    ruleApplied: 'Hollow Heart',
    ruleExplanation: 'The contested middle of the war — the most fought-over ground.',
    headlines: [
      'The Heart of the Grid Contested Again',
      '{faction} and {rival} Fight for the Center',
      'The Middle Ground Remains Unresolved',
      '{region} — The War\'s Most Contested Zone',
    ],
    bodies: [
      'Every war has a center — a contested middle where both sides have too much invested to let go and not enough strength to finish it. In this war, that center is {region}. {faction} has taken it and lost it and taken it again. So has {rival}. The ground there is layered with the marks of a dozen campaigns. Today added one more.',
      'The chronicler has stopped numbering the engagements in {region}. There have been too many. What they record instead is the current state of the line — and today the line shifted slightly, {faction} gaining the northern edge while {rival} held the south. Both will claim victory. Neither will hold it long.',
      '{commander} says the center cannot be held — only occupied temporarily while you prepare for the next assault. They should know. They\'ve been occupying and losing {region} since the early campaigns. The current engagement is another chapter in a conflict that has no clear resolution and no shortage of participants willing to keep fighting it.',
      'The hollow heart of the war — the center of everything, the place that everyone wants and no one can keep. {faction} moved on {region} today with everything they had available. By nightfall they held most of it. By the morning report, {rival} will have taken some of it back. The chronicler writes this down and moves on. Tomorrow will be the same.',
    ],
  },

  PROPHECY: {
    loreType: 'PROPHECY', icon: '∆',
    ruleApplied: 'Prophecy',
    ruleExplanation: 'Every 25th event — fate speaks through the war\'s accumulating pattern.',
    headlines: [
      'The Chronicler Reads the Pattern',
      'A Prophecy Is Recorded at {region}',
      '{commander} Speaks of What Is Coming',
      'The War\'s Shape Reveals Itself',
    ],
    bodies: [
      'Every twenty-five engagements, the chronicler steps back from the immediate record and looks at the shape of the whole. What they see in the current tally is this: {faction} is patient, {rival} is reactive, and the war is moving toward something neither of them has quite named yet. The prophecy isn\'t mystical — it\'s pattern recognition. But it lands the same way.',
      '{commander} has a habit of counting. "Twenty-five marks," they said to the council tonight. "Count them. See the direction." The council counted. The direction is clear. What happens in {region} over the next twenty-five engagements will determine the shape of the war for a long time after. Everyone in the room understood that. None of them said it aloud.',
      'The old traditions of this war require a pause every twenty-fifth engagement — a moment when the chronicler reads the accumulated record aloud and lets the pattern speak. The pattern today, in the long hall near {region}, spoke of {faction}\'s gradual dominance of the northwest quarter and {rival}\'s corresponding retreat toward the center. No one interrupted the reading. No one argued with the pattern.',
      'Prophecy in war is just history told in advance. The chronicler\'s twenty-fifth-mark reading always feels prophetic to the commanders who hear it — because it\'s based on evidence they\'ve been too close to see. {faction}\'s position near {region} is stronger than they realized. {rival}\'s is weaker. The prophecy is already happening.',
    ],
  },

  POWER_CONSOLIDATES: {
    loreType: 'POWER_CONSOLIDATES', icon: '◐',
    ruleApplied: 'Power Consolidates',
    ruleExplanation: 'A faction appears repeatedly — building dominance over time.',
    headlines: [
      '{faction} Continue to Build Their Hold',
      'The Same Force, Again — {faction} Are Everywhere',
      '{commander}\'s Campaign Deepens',
      '{faction} Tighten Their Grip on {region}',
    ],
    bodies: [
      '{faction} has been in the chronicle more than any other force in recent memory. Every time the record updates, their name appears. Their presence in {region} today was their third documented move in as many periods — and each move has built on the last. This is not opportunism. This is a campaign.',
      '{commander} is running a long game. Every move {faction} makes is connected to every previous move — a network of positions that, taken together, describe something that looks increasingly like dominance. {rival} has started calling it what it is. Others are starting to notice too.',
      'The pattern of {faction}\'s appearances in the chronicle tells its own story: consistent, escalating, coordinated. The move in {region} today is the latest addition. Individually each move is modest. Together they describe a faction that is slowly and methodically winning the war without anyone announcing that the war is being won.',
      '{faction} has not been quiet. Their presence in {region} today follows a sequence that the chronicler has been tracking for some time. The sequence suggests an endgame — a set of positions that, once all held simultaneously, would constitute something like control of the center. {commander} is almost there.',
    ],
  },

  CEASEFIRE: {
    loreType: 'CEASEFIRE', icon: '—',
    ruleApplied: 'Ceasefire',
    ruleExplanation: 'A long quiet — the war paused, for reasons the chronicle doesn\'t record.',
    headlines: [
      'The War Goes Quiet for a Time',
      'A Ceasefire Holds Near {region}',
      '{faction} and {rival} Stop — For Now',
      'Silence on the Front Lines',
    ],
    bodies: [
      'The front lines went quiet. No one announced a ceasefire, but none was needed — the silence spoke for itself. {faction} withdrew to their positions near {region} and held. {rival} did the same on the other side of the line. Whether this is rest or preparation, the chronicler cannot say. The record shows only the absence of action where action had been constant.',
      'Wars rest sometimes. The pause near {region} lasted long enough that the chronicler began to wonder if the campaign had ended without announcement. It had not. {faction}\'s positions remained. {rival}\'s remained. The front line held where it was, unmoved, as if both sides were waiting for something the chronicles hadn\'t yet recorded.',
      '{commander} ordered the pause. No official reason was given. The units near {region} stood down, maintained their positions, and waited. {rival} also stood down. Two armies facing each other across a quiet line, both waiting for something to break the stillness. Eventually, something will.',
      'The chronicle records the silences as carefully as the battles. This one — a long quiet on the front near {region} — will be looked back on as either a ceasefire or a preparation, depending on what happens next. For now, it is simply: quiet. The war breathes.',
    ],
  },

  AGE_TURNS: {
    loreType: 'AGE_TURNS', icon: '◑',
    ruleApplied: 'Age Turns',
    ruleExplanation: 'A new era begins — the war has entered a new phase.',
    headlines: [
      'A New Age Begins: {era}',
      'The War Enters a New Phase',
      '{faction} Greet the Turning of the Age',
      'The Chronicle Marks a New Chapter',
    ],
    bodies: [
      'The chronicler has a system. When enough has happened — when the weight of events crosses a threshold the record itself recognizes — a new age is declared. That threshold was crossed today, somewhere between the movements in {region} and the reports from {rival}\'s northern flank. The age now called {era} has begun. What it will be remembered for, no one can say yet.',
      'Ages don\'t announce themselves. They\'re named in retrospect, by chroniclers who can see the whole arc of what happened. But even in the moment, near the turning, there is a feeling — a shift in atmosphere, a change in the texture of events. {faction}\'s commanders near {region} felt it this morning. The war is different now than it was a hundred engagements ago.',
      '{commander} said it plainly in the war council: "What we\'re doing now is different from what we were doing at the beginning. Different stakes, different tactics, different enemies in some cases." The chronicler was in the room. They wrote it down. The beginning of {era} will be dated to this council, near {region}, when {faction}\'s commander named what everyone could feel.',
      'Every age of this war has been named for what defined it. The current one — {era} — is being defined in real time by the events being recorded. {faction}\'s position near {region}. {rival}\'s response. The sacrifices made and the ground taken. The chronicler does not choose the name. The war does.',
    ],
  },

  SIMULTANEOUS: {
    loreType: 'SIMULTANEOUS', icon: '⊕',
    ruleApplied: 'Simultaneous',
    ruleExplanation: 'Two armies moved at the exact same moment — an unplanned collision.',
    headlines: [
      'Two Forces Move at Once — No One Planned This',
      'A Collision Near {region}',
      '{faction} and Unknown Forces Strike Simultaneously',
      'The Same Moment, Two Different Wars',
    ],
    bodies: [
      'The timing was not coordinated — the chronicle is certain of this. Two separate forces moved on {region} at the exact same moment, from different directions, with different objectives. {faction} encountered the other group before either side expected contact. What followed was not a battle exactly — more of a mutual recognition, a sudden awareness that the war had more participants acting simultaneously than anyone had tracked.',
      '{commander} described the simultaneous advance as "the war reminding us it\'s larger than we imagine." Two forces, neither aware of the other\'s timing, both choosing the same moment to act near {region}. The chronicle records both movements as a single entry — because they happened in the same breath of time, and the war doesn\'t always separate things cleanly.',
      'When two armies move at once without knowing it, the chronicler asks: is this chance, or is the war itself orchestrating something? The answer is almost certainly chance. But the simultaneous advances near {region} today — {faction} from the west, the other force from the north — created a convergence that neither side expected and both now have to navigate.',
      'The war has its own rhythms. Sometimes those rhythms produce moments like this: two forces, separate campaigns, completely different motivations, arriving at {region} at the same instant. {faction} held formation. The other force did the same. For a long moment, no one moved. Then everyone moved. The chronicle records what happened next.',
    ],
  },

  RELIC_UNEARTHED: {
    loreType: 'RELIC_UNEARTHED', icon: '★',
    ruleApplied: 'Relic Unearthed',
    ruleExplanation: 'Something ancient surfaces — a discovery in the deep patterns of the war.',
    headlines: [
      '{relic} Is Found Near {region}',
      'The Buried Past Surfaces',
      '{faction} Unearths a Relic of the First War',
      '{commander} Reports a Discovery — Everything Changes',
    ],
    bodies: [
      'The wars that preceded this one left things buried in the terrain. When {faction}\'s excavation team in {region} found {relic}, they reported it up the chain immediately — this is the kind of discovery that changes the strategic calculus. {rival} has been looking for it too. {commander} has ordered the site secured and the relic transported. This is now the most important position on the map.',
      '{relic} was thought lost in the second campaign, when the old chronicles were burned and the front lines redrawn. {faction}\'s scouts found it in {region} under circumstances the chronicle records but doesn\'t fully explain. It was simply there, in the place it had been for a long time, waiting for someone to look. The faction that holds it holds something beyond territory.',
      'The discovery of {relic} near {region} was not the result of intelligence or planning — it was accident, the kind that changes wars. {faction}\'s forward unit stumbled across it during a routine advance and had the presence of mind to stop and report before doing anything else. {commander} was on site within hours. {rival} heard about it by evening. The race to {region} has already begun.',
      '{commander} has studied the old records about {relic}. They knew it existed, knew it had been lost, never expected to find it in their lifetime. Now it is in {faction}\'s possession, secured near {region}, the subject of every council meeting and every strategy session. The war was already important. Now it is something more.',
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // CONNECTIVE 21 — Texture, lore, and flow
  // These entries fill the space between battles with the world's
  // politics, rumors, personalities, and quieter moments.
  // ══════════════════════════════════════════════════════════════

  WAR_COUNCIL: {
    loreType: 'WAR_COUNCIL', icon: '⊓',
    ruleApplied: 'War Council',
    ruleExplanation: 'A rapid return — commanders reconvening in urgency.',
    headlines: [
      'The Council Meets Again — Urgently',
      '{commander} Calls the Commanders Back',
      'A Second Meeting Before the Week Is Out',
      'The War Changes Faster Than Expected',
    ],
    bodies: [
      'Two councils in quick succession means the war is moving faster than the plans can keep up with. {faction}\'s commanders reconvened near {region} before the first meeting\'s orders had even been fully implemented. Something had changed. {commander} had new information. The maps were spread again. The arguments began again.',
      'The war council that {faction} held near {region} today was not scheduled. When councils happen without warning, it usually means something has surprised the commanders — a development no one predicted, a report from the front that contradicts the strategy. {rival} will be trying to find out what it was.',
      '{commander} doesn\'t call councils lightly. The reconvening near {region} — so soon after the last — means the situation has shifted enough to require immediate recalibration. The officers who entered the meeting had one understanding of the war. The officers who left had a different one. The chronicle does not record what changed.',
      'War councils move quickly when they need to. The one {faction} held near {region} this morning covered in an hour what previous councils have taken days to resolve. {commander} cut the usual arguments short. "We don\'t have time for the usual arguments," they said. No one disagreed.',
    ],
  },

  THE_MAPMAKERS: {
    loreType: 'THE_MAPMAKERS', icon: '⊞',
    ruleApplied: 'The Mapmakers',
    ruleExplanation: 'The war\'s cartographers at work — knowledge as a weapon.',
    headlines: [
      'The Mapmakers Update the Grid',
      '{faction}\'s Cartographers Survey {region}',
      'New Maps Are Drawn — the War Looks Different Now',
      '{commander} Studies the Updated Charts',
    ],
    bodies: [
      'Maps are how wars are understood and misunderstood in equal measure. {faction}\'s cartographers have been working through {region} for three days now — cataloguing every shift in the front line, every contested boundary, every position that has changed hands since the last survey. The updated charts will reach {commander} by morning. The war will look different on paper than it did yesterday.',
      'The Mapmakers operate in the spaces between battles. While {faction} and {rival} fight over {region}, a separate team of scholars and surveyors is measuring the aftermath — recording what was gained and lost, recalculating the strategic geometry. Their work is unglamorous and indispensable. The commanders who ignore their maps lose.',
      '{commander} has a standing order: maps to be updated after every major engagement. The surveyors who completed their work in {region} today delivered three new charts and corrections to two existing ones. One correction involved a significant error in how {rival}\'s eastern position had been recorded. {commander} looked at it for a long time.',
      'Cartography is an act of power in this war. The faction that best understands the shape of the contested ground holds an advantage that no number of warriors can overcome. {faction}\'s Mapmakers near {region} are the best in the chronicle — and their latest survey has revealed something about the terrain that may change the approach to the next campaign.',
    ],
  },

  OLD_LEGEND: {
    loreType: 'OLD_LEGEND', icon: '◁',
    ruleApplied: 'Old Legend',
    ruleExplanation: 'An ancient story resurfaces — history folding back into the present.',
    headlines: [
      'An Old Legend Returns to the Front',
      'The Stories They Tell About {region}',
      '{commander} Invokes the Old Wars',
      'History Comes Back — The Ancients Are Remembered',
    ],
    bodies: [
      'Every piece of ground in this war has a history older than the current conflict. {region} was a battlefield before the current factions existed — the old chronicles mention it in connection with wars that have been forgotten, fought by forces that no longer have names. When {faction}\'s veterans gathered near {region} tonight, they told those stories. The younger soldiers listened. It matters, to know you\'re fighting on old ground.',
      '{commander} keeps a copy of the oldest chronicle entries that mention {region}. They\'ve been fighting over this ground for long enough to know that they\'re not the first and won\'t be the last. The legend they invoked at the council tonight — the story of what happened near {region} before anyone now living was born — is not quite a story anymore. It\'s a pattern that repeats.',
      'The oldest forces in this war remember things the chronicle hasn\'t fully recorded. When the ancient units near {region} began telling stories — not battle reports, but actual stories, the kind that get told around fires — {faction}\'s younger commanders asked why. "So you understand where you are," the old soldiers said. {relic} features in most of the stories.',
      'The legend of {region} precedes the current conflict by at least two chronicles. {faction}\'s scholars have studied the old records — partial, damaged, and inconsistent as they are — and pieced together a story of ground that has been fought over for longer than anyone now alive has been fighting. {commander} says that knowing the legend doesn\'t change the tactics. But they keep the old chronicle open on their desk.',
    ],
  },

  DESERTION: {
    loreType: 'DESERTION', icon: '○',
    ruleApplied: 'Desertion',
    ruleExplanation: 'A force that was active goes silent — absent without explanation.',
    headlines: [
      'A Known Force Goes Silent',
      '{faction} Reports a Missing Unit',
      'They Were Here — Now They\'re Not',
      'The Chronicler Notes an Absence',
    ],
    bodies: [
      'The chronicler notes absences as carefully as presences. A force that was documented near {region} in recent records has not appeared in today\'s tally. {faction}\'s scouts report the position empty, the markings intact but uninhabited. Where they went, and why, is not recorded. The chronicle marks the gap and keeps going.',
      'Desertion is a word {commander} uses carefully. "We don\'t know why they left," they said when the absence near {region} was reported. "Until we know, we call it a withdrawal." The distinction matters in the record — a withdrawal is tactical, a desertion is something else. The chronicle records the fact of absence and leaves the interpretation to historians.',
      '{faction} lost contact with a unit near {region}. The last report was recent — active, engaged, no sign of trouble. Then nothing. {commander} sent scouts. The scouts found marks on the terrain consistent with a deliberate, organized departure. Someone left and didn\'t say where they were going.',
      'Wars have attrition that doesn\'t appear in the battle reports. Forces that simply stop being present — no recorded defeat, no announced withdrawal, just an absence where a presence used to be. {faction} noted the disappearance of an active unit near {region}. The chronicle records it as an unexplained departure. Perhaps they\'ll return. Perhaps the record will never explain what happened.',
    ],
  },

  THE_COUNT: {
    loreType: 'THE_COUNT', icon: '≡',
    ruleApplied: 'The Count',
    ruleExplanation: 'Every 10th event — the chronicler tallies the war\'s accumulating cost.',
    headlines: [
      'The Chronicler Counts — The War\'s Tally Grows',
      'Ten More Entries — The Record Deepens',
      '{faction}\'s Progress in the Latest Count',
      'The War by the Numbers',
    ],
    bodies: [
      'The chronicler counts. Every ten engagements, the tally is read aloud in the hall near {region}: territory held, territory lost, sacrifices made, forces identified, silences noted. The current count shows {faction} active, {rival} responsive, the war in a phase of incremental contest. The next ten engagements will either confirm or complicate that picture.',
      'Numbers tell a different story than narratives. The count today — pausing to tally the last ten entries in the chronicle — shows a war that is more dynamic than it might feel from the front lines. {faction} has been present in seven of the last ten engagements. {rival} in five. The overlap is where the actual conflict lives.',
      '{commander} attends every counting. "I want to hear it in sequence," they always say. "Don\'t summarize. Read every entry." The hall near {region} fills up for these sessions. The chronicle reads clearly. The pattern is visible. The commanders take notes.',
      'Ten more marks in the chronicle. The reader who looks at the recent sequence will notice: the war is accelerating. Engagements are closer together. Sacrifices are larger. The forces are more committed. The count today captures a war that is past its early phase and moving into something harder to name. {faction} is ready. {rival} is also ready. That\'s the problem.',
    ],
  },

  GHOST_SIGNAL: {
    loreType: 'GHOST_SIGNAL', icon: '●',
    ruleApplied: 'Ghost Signal',
    ruleExplanation: 'A force returns after a very long absence — carrying news from wherever they were.',
    headlines: [
      'A Lost Force Returns — from Somewhere',
      '{faction} Hears from a Unit Gone Long Silent',
      'The Ghost Signal Resolves: They\'re Back',
      '{commander} Gets News from the Long Absent',
    ],
    bodies: [
      'They\'ve been gone long enough that the chronicle had written them out of the active record. The force that reappeared near {region} today was last documented many long periods ago — long enough to have been presumed lost, or absorbed into another faction, or simply done with the war. They\'re not done. They\'re back. And they haven\'t explained where they\'ve been.',
      '{commander} received the signal before dawn and made sure not to show surprise at the morning briefing. A force that had been absent from the front for a long stretch had reestablished contact near {region}. They gave their faction\'s name and asked for current positions. {commander} answered the second question and held the first one for later: where have you been?',
      'The war doesn\'t stop when forces disappear. The front lines shift, the strategies adjust, the chronicle keeps accumulating. But forces that were part of the pattern leave gaps when they go, and those gaps change the shape of things. The reappearance near {region} today fills one such gap — but the gap was large enough that simply filling it changes the picture significantly.',
      'Ghost signals are what the communications corps calls radio contact from units that have been out of reach long enough to be presumed lost. Today\'s signal, received near {region}, was exactly that — a transmission from a force the chronicle had stopped tracking. They are operational. They have been operational somewhere the chronicle doesn\'t have a record of. {commander} is asking questions.',
    ],
  },

  DEBT_OF_BLOOD: {
    loreType: 'DEBT_OF_BLOOD', icon: '⊖',
    ruleApplied: 'Debt of Blood',
    ruleExplanation: 'A veteran sacrifices again — the cumulative cost of the war made visible.',
    headlines: [
      'The Debt Grows — Another Sacrifice in the Name of the Pact',
      '{commander} Has Given More Than Most',
      'The Cost of the War, Counted in Sacrifices',
      'A Second Offering — the Chronicle Notes the Pattern',
    ],
    bodies: [
      'The chronicle tracks sacrifices separately from battles, because they represent a different kind of cost — not territory, but something more fundamental. The warrior who made an offering near {region} today has appeared in this section of the chronicle before. They gave then. They gave again now. The receiving unit is stronger. The giver is not diminished but also not unchanged. {commander} watches these totals carefully.',
      'There are warriors in this war who have given more than others — and the chronicle records it. The debt of blood isn\'t a metaphor: it\'s a ledger. The force that made its second sacrifice near {region} has a longer entry in that ledger than most. {faction} honours the repeat sacrificers with a designation that doesn\'t translate neatly into peacetime language.',
      '{commander} has said publicly that the war cannot be won without sacrifice — but also that sacrifice has to be chosen, never compelled. The warrior who gave again near {region} chose it voluntarily, as they had before. The receiving unit will carry that knowledge into the next engagement. It changes how they fight.',
      'The cost accumulates. {faction}\'s sacrifice record near {region} has grown longer than it was a year ago — more entries, larger offerings, veterans who have given multiple times. The debt of blood is how the chronicle describes this accumulation: not a burden, but a reckoning. The war will eventually ask for a settlement.',
    ],
  },

  TAVERN_TALE: {
    loreType: 'TAVERN_TALE', icon: '≈',
    ruleApplied: 'Tavern Tale',
    ruleExplanation: 'A newcomer heard talking — the war seen from the edges.',
    headlines: [
      'Overheard Near {region}: A Newcomer\'s Version',
      'The Rumors at the Border Outpost',
      'What the Newcomers Say About the War',
      'A Story Told at the Edge of the Conflict',
    ],
    bodies: [
      'The newcomers to this war always have the same version of it — the one they heard before they arrived. Overheard near {region} tonight, a new arrival was telling someone else what they knew: {faction} is winning (they\'re not, not decisively), {rival} is desperate (also not accurate), and the whole thing will be over by the next season (it won\'t). The veterans in the corner didn\'t correct them. They\'ve stopped correcting newcomers.',
      'Every outpost on the edge of the war has a gathering place where soldiers talk. The one near {region} is where newcomers tell the stories they brought from wherever they came from. Tonight\'s stories involved {commander} (mostly inaccurate), {relic} (partly true), and the reason {faction} is fighting (this part nobody agrees on, not even {faction}). The veterans listened. They always listen. Sometimes there\'s something useful in the newcomers\' version.',
      'A force that arrived near {region} for the first time was telling stories at the outpost tonight. The chronicle notes newcomer accounts separately — not because they\'re more or less true than veteran accounts, but because they represent a different perspective: the war as it appears from outside, before the inside view replaces it. {commander} always reads newcomer reports first.',
      'War generates stories faster than it generates victories. The newcomers near {region} tonight brought versions of events from other fronts — accounts of {rival}\'s movements in the east, rumors about a new faction forming in the south, a story about {relic} that doesn\'t match any chronicle entry. Some of it is useful. All of it is interesting. The chronicler writes it down.',
    ],
  },

  LONG_SILENCE: {
    loreType: 'LONG_SILENCE', icon: '░',
    ruleApplied: 'Long Silence',
    ruleExplanation: 'A very long pause — the war went underground for a significant time.',
    headlines: [
      'After a Long Silence, the War Returns',
      'The Quiet Was Longer Than Anyone Expected',
      '{faction} Reappear After the Great Pause',
      'What Happened During the Silence Near {region}',
    ],
    bodies: [
      'The silence lasted long enough that some started wondering if the war was over. It wasn\'t. The front near {region} simply went underground — no recorded engagements, no documented movements, no signals in the chronicle. But when things resumed today, it was clear that things had been happening during the quiet. Positions had shifted. Forces had moved. Something had been decided, somewhere, by someone. The chronicle picks up where it can.',
      'Long silences in the chronicle are not peaceful. They\'re opaque. {faction}\'s return to the record near {region} today, after a pause long enough to make historians nervous, came with no explanation of what happened during the interval. The commanders who were present during the silence are not talking. The chronicle records: a long gap, then this.',
      '{commander} was asked about the silence at the first post-resumption briefing. "The war doesn\'t stop because you stop recording it," they said. Which was not an answer, but was also not nothing. {faction}\'s return to the front near {region} after the long pause shows a force that used the quiet for something. They look organized. They look prepared. They look like they knew the silence was coming.',
      'The great pause near {region} is what the chronicler is calling it. A stretch of time when the front went quiet, the record went blank, and everyone waited. {faction} broke the silence first — not with a major engagement, but with a careful, deliberate move that suggests the silence was not rest but preparation. The war that resumes today is not quite the same war that paused.',
    ],
  },

  SCOUT_RETURNS: {
    loreType: 'SCOUT_RETURNS', icon: '←',
    ruleApplied: 'Scout Returns',
    ruleExplanation: 'News from the far edge — a scout brings word of what\'s happening beyond the main front.',
    headlines: [
      'The Scouts Return from {region} with News',
      'Word from the Far Edge — It\'s Not Good',
      '{commander} Receives a Scout\'s Report',
      'What\'s Happening Beyond the Main Front',
    ],
    bodies: [
      '{faction}\'s scouts have been ranging far beyond {region} for weeks. The ones who came back today brought reports that have been circulating through the command structure since mid-afternoon: {rival} has been active in places the main chronicle hasn\'t recorded, the edge forces are moving in ways that suggest coordination, and something is happening near the unmapped border that doesn\'t match any known faction\'s typical pattern. {commander} is scheduled to respond at tomorrow\'s briefing.',
      'Scout reports are the war\'s peripheral vision. They tell commanders what\'s happening in the spaces between the documented engagements — the movements too small or too far away to make the main chronicle, but important enough to track. Today\'s report from the far edge of {region} contained three significant updates and one item that {commander} has marked as urgent. The urgent item is not yet being discussed publicly.',
      'The scouts that returned near {region} today had been gone long enough to accumulate real intelligence. Their report covered territory the main chronicle hasn\'t reached — forces and movements in the outer regions that suggest the war is larger than its documented form. {faction} has been fighting what the scouts are calling "the visible war." The scouts have been tracking the other one.',
      '{commander} read the scout report without expression. Three times, which is twice more than the usual once. The movement near the edge of {region} that the scouts documented doesn\'t correspond to anything in the current strategic plan. Either someone is improvising at the edge without orders, or someone has orders that haven\'t been shared with {commander}. Both possibilities are interesting in bad ways.',
    ],
  },

  REVISION: {
    loreType: 'REVISION', icon: '↺',
    ruleApplied: 'Revision',
    ruleExplanation: 'A veteran changes their approach — the chronicler updates the record.',
    headlines: [
      '{faction} Changes Tactics — the Chronicles Updated',
      '{commander} Revises the Plan',
      'What We Thought We Knew About {faction}',
      'A Familiar Force Doing Something New',
    ],
    bodies: [
      'The chronicle is a living record. When forces that have established patterns change those patterns, the chronicler notes it — not as inconsistency but as adaptation. {faction}\'s move near {region} today breaks with what they\'ve done in the previous several engagements. {commander} ordered the change. The reasons are not yet documented, but they will be.',
      '{commander} has revised the approach to {region}. The previous method — documented in detail across a dozen chronicle entries — has been set aside. The new approach is different in ways that suggest not merely tactical adjustment but a fundamental reassessment of what {faction} is trying to accomplish here. The chronicles are being updated. The old entries remain.',
      'Wars teach. Forces that don\'t learn from the chronicle of their own campaigns stop appearing in it. {faction}\'s revision of their approach near {region} today is evidence of an organization that reads its own record and adjusts. {rival} does this too, but more slowly. The gap in adaptation speed is where campaigns are won and lost.',
      'The revision {faction} implemented near {region} surprised the chronicler — not because it was unexpected, but because it was so clearly right. Looking at the previous entries, the old approach was running out of options. The new one opens possibilities. {commander} saw it before the situation made it obvious. That\'s what makes a good commander.',
    ],
  },

  THRESHOLD_VIGIL: {
    loreType: 'THRESHOLD_VIGIL', icon: '◑',
    ruleApplied: 'Threshold Vigil',
    ruleExplanation: 'The war is approaching a turning point — every move carries more weight.',
    headlines: [
      'The War Approaches a Turning Point',
      '{faction} Holds Vigil Before the Coming Change',
      'Everything Is About to Shift',
      'The Threshold Is Within Reach',
    ],
    bodies: [
      'The chronicler knows the threshold is near. The count is close — a few more engagements, and the war enters a new phase, one that will require a new name and new categories for what\'s happening. {faction} near {region} has been preparing. {rival} near the eastern line has been preparing. Everyone can feel the turning approach without being able to say exactly when it will arrive.',
      'Before a new age of the war begins, there is always a vigil. It\'s not organized or announced — it just happens, the armies on both sides settling into watchfulness, movement slowing, decisions being weighed more carefully than usual. The vigil near {region} has been ongoing. {commander} has not ordered any major advances. They\'re waiting to see what the turning brings.',
      '{commander} said at the council: "We are very close to something different. I want everyone at full readiness." No one asked what "something different" meant. They could feel it in the record — the accumulation of events pressing toward a threshold that the chronicle itself recognizes as significant. The vigil near {region} is {faction}\'s response to that feeling.',
      'Three more moves. Maybe two. Then the age turns and the war becomes something else — a new chapter that will be named later, understood later, but felt right now in the particular weight that has settled over {region} and the front lines around it. {faction} is holding position. {rival} is holding position. The threshold vigil is what both sides are observing, without knowing the other is observing it too.',
    ],
  },

  VILLAGE_ACCORD: {
    loreType: 'VILLAGE_ACCORD', icon: '□',
    ruleApplied: 'Village Accord',
    ruleExplanation: 'Neutral parties reach a quiet agreement — the world outside the main conflict.',
    headlines: [
      'An Accord Reached Near {region} — Outside the Main War',
      'The Neutral Parties Make Their Own Peace',
      'What\'s Happening in the Villages While the War Continues',
      'A Quiet Agreement — Not Everyone Is Fighting',
    ],
    bodies: [
      'Not everyone in the territory of this war has chosen a side. The villages near {region} have been navigating the conflict by other means — trading access for protection, offering information for safety, maintaining enough useful relationships with every faction to avoid being absorbed by any of them. The accord reached today near {region} is the latest such arrangement. {faction} agreed to it. So did {rival}, though neither knows the other has.',
      'The chronicle focuses on the factions, but the war is also a world. Near {region}, the non-combatants have been doing what non-combatants always do: surviving, adapting, and making pragmatic agreements with whoever is passing through. The accord recorded today is between parties the chronicle doesn\'t usually name — people who have chosen neither {faction} nor {rival}, but still have to live next to both.',
      '{commander} was briefed on the village accord near {region}. Their reaction was characteristic: "Note it. Don\'t disrupt it." Neutral arrangements in contested territory are useful to everyone — they keep the supply lines open and the information moving. {faction} has a policy of respecting accords made by those who\'ve chosen not to fight. It\'s good strategy and also just decent.',
      'Wars are largest at their center and smallest at their edges — and at the very edge, near {region}, the conflict looks different. People are making agreements that don\'t align neatly with either {faction} or {rival}. The village accord recorded today is one of those — an arrangement born of practical necessity rather than ideology. The chronicle records it because everything that shapes the war\'s world belongs in the record.',
    ],
  },

  DUST_MARK: {
    loreType: 'DUST_MARK', icon: '.',
    ruleApplied: 'Dust Mark',
    ruleExplanation: 'The smallest possible act — a presence barely felt, but recorded.',
    headlines: [
      'The Smallest Mark — Barely There, But There',
      'A Presence Noted at the Edge of {region}',
      'Someone Was Here — Just Barely',
      '{faction} Records the Minimum',
    ],
    bodies: [
      'The chronicler records everything. Including this: the smallest possible mark left near {region} — a single scratch in the contested ground, barely distinguishable from the terrain itself, but deliberately placed. Whether it was a scout marking a position, a messenger leaving a signal, or simply a soldier who needed to leave some trace of passing — the mark is there. The chronicle has it.',
      'Not every act of war is large. The dust mark near {region} was the minimum — one tiny change in the territory, one mark that says "I was here" without elaborating further. {faction}\'s surveyors noted it. {rival}\'s scouts either missed it or found it too small to report. The chronicle does not distinguish by size when determining what matters.',
      '{commander} has a private collection of dust marks — the smallest recorded moves from the entire history of this war. Not because they\'re strategically significant, but because they\'re philosophically interesting. A mark that says only "I existed here, at this moment" is a different kind of statement than a battle. The one near {region} goes in the collection.',
      'The chronicler\'s job is to notice. The dust mark near {region} — left by someone who barely touched the contested ground — is the kind of thing that gets missed in the noise of larger events. That\'s probably why it was left. A message in the minimum, readable only to those who are looking at the right scale. {faction} noted it. That may or may not be the intended audience.',
    ],
  },

  EMISSARY: {
    loreType: 'EMISSARY', icon: '»',
    ruleApplied: 'Emissary',
    ruleExplanation: 'A messenger arrives carrying word from another part of the conflict.',
    headlines: [
      'An Emissary Arrives at {region}',
      'A Messenger from Beyond — News of Other Fronts',
      '{commander} Receives an Emissary',
      'Word from Elsewhere: The War Is Larger Than Expected',
    ],
    bodies: [
      'Emissaries carry news from places the main chronicle doesn\'t reach. The one who arrived near {region} today came from a front that the current record hasn\'t covered — a part of the war that has been developing in parallel, with its own timeline and its own stakes. {commander} spent most of the afternoon in the receiving room. What the emissary said is not yet in the record. What {commander} decided afterward is beginning to be.',
      'The protocol for receiving emissaries is old and elaborate. {faction} follows it precisely — partly out of tradition, partly because emissaries who are not received properly stop coming, and stopping the flow of information from other fronts is a strategic error. The emissary who arrived near {region} was received correctly. What they brought changes something. The chronicle will reflect it.',
      '{commander} has been expecting an emissary. When one finally arrived near {region}, the commanders who were present noted that {commander} didn\'t look surprised. The meeting lasted three hours. Afterward, two orders were issued: one moving a unit northward, one changing the communication protocol with the eastern scouts. The connection between the orders and the emissary\'s message is not explained.',
      'The emissary who came to {region} today carried a sealed document from another part of the war — the part that {faction} knows about but doesn\'t talk about in open councils. {commander} opened it privately. The chronicle records that the meeting happened, that the emissary was given safe passage back, and that several things changed immediately after. The content of the document is marked: do not record.',
    ],
  },

  LONG_COUNT: {
    loreType: 'LONG_COUNT', icon: '∞',
    ruleApplied: 'Long Count',
    ruleExplanation: 'Every 40th event — the war measures itself against the Grid\'s own architecture.',
    headlines: [
      'The War Counts Forty — The Grid Marks the Moment',
      '{faction} Acknowledges the Long Count',
      'Forty Engagements — The Chronicle Measures the War',
      'The Grid\'s Architecture, Honored in the Count',
    ],
    bodies: [
      'The Grid that the war is fought over is forty positions wide and forty deep. Every fortieth engagement in the chronicle, the war pauses to count itself against that architecture — to ask: how much of the forty-by-forty have we touched? The current answer: more than at the beginning, less than at the end. {faction}\'s position near {region} was the fortieth mark. It will be remembered as such.',
      '{commander} has always found the long count meaningful. "The Grid isn\'t just terrain," they say. "It\'s a measure." When the chronicle reaches its fortieth entry and the war counts itself against the forty-by-forty architecture that underlies everything, {commander} takes the day seriously. Today was that day. The briefings were brief. The count was read. Everyone sat with it.',
      'The Chronicler\'s long count tradition predates the current conflict. Every fortieth entry, the full tally of all engagements is read aloud, and the shape of the war is measured against the shape of the Grid. Near {region}, where the fortieth mark fell today, {faction}\'s commanders gathered for the reading. The war is larger than it was at the twentieth mark. Smaller than it will be at the eightieth.',
      'Forty is not an arbitrary number in this war. It is the dimension of everything. The Grid where every battle is fought, every mark is left, every sacrifice is made — forty columns, forty rows. When the chronicle reaches forty engagements, the war is measured against its own foundation. {faction} made the fortieth mark near {region}. The long count is recorded.',
    ],
  },

  INTERLUDE: {
    loreType: 'INTERLUDE', icon: '·—·',
    ruleApplied: 'Interlude',
    ruleExplanation: 'A brief rest after a cluster of fighting — camp life between battles.',
    headlines: [
      'Between Battles — Camp Life Near {region}',
      'The Brief Rest Before the Next Push',
      'What Happens in the Lull',
      '{faction} Sets Up Camp and Waits',
    ],
    bodies: [
      'After a cluster of engagements, the armies near {region} settled into something that wasn\'t quite peace and wasn\'t quite war — the brief interlude that happens when both sides have spent themselves enough to pause but not enough to stop. {faction}\'s camp filled with the ordinary sounds of soldiers resting: repairs, arguments, letters being written, meals being contested. The chronicler notes the lull because it will look significant in retrospect, one way or another.',
      '{commander} used the interlude near {region} for what they always use interludes for: thinking. The camp was quiet. The front was quiet. For a handful of days, nothing significant happened in the record. This entry is the chronicle\'s acknowledgment that the quiet happened and was real — not empty, but unrecorded in the usual way. The armies are recovering. The war is preparing for the next round.',
      'The interlude near {region} lasted just long enough for the soldiers to remember they were people, not just combatants. Letters went out. Repairs were made to things that had been held together by urgency and were now fixed properly. {faction}\'s healers moved through the camp. {rival}, across the quiet line, was probably doing the same. Both sides needed the rest. Both sides know the rest is temporary.',
      'Between battles, the war has texture that doesn\'t always make the chronicle. Near {region}, in the brief pause after the recent cluster of engagements, {faction}\'s camp developed routines: morning briefings that took half the time they used to, afternoon equipment maintenance, evenings that were quieter than anyone expected. {commander} was seen walking the perimeter alone at night. No one disturbed them.',
    ],
  },

  LINEAGE: {
    loreType: 'LINEAGE', icon: '⋮',
    ruleApplied: 'Lineage',
    ruleExplanation: 'A dynasty emerges — a force that has appeared again and again.',
    headlines: [
      'A Dynasty in the Making — {faction} Marks Their Lineage',
      '{commander}\'s Legacy Continues',
      'Three Times and More — A Lineage Recognized',
      'The Chronicle Notes a Pattern of Presence',
    ],
    bodies: [
      'Dynasties aren\'t declared; they\'re recognized. {faction}\'s consistent presence in the chronicle — three distinct engagements and now more, each building on the last — has earned the designation. The chronicler doesn\'t use "dynasty" lightly. It requires a demonstrated pattern of sustained, purposeful action over time. {commander} has provided it. Near {region}, the lineage is officially noted.',
      'Some forces flash through the record. Some burn constant. {faction} is the second kind — appearing again and again, each time leaving a mark that connects to the previous marks, building a legacy that the chronicle can trace from the early entries to the present. Near {region}, where their latest appearance is documented, the lineage note is added.',
      '{commander} was told that the chronicle had designated {faction}\'s record as a lineage. They didn\'t react much. "Keep fighting" is the response of someone who intends to keep adding to the pattern, not be commemorated by it. The chronicler notes the designation anyway. The lineage is real whether or not {commander} acknowledges it.',
      'Three appearances become a pattern. A pattern sustained across the chronicle\'s growing record becomes a lineage. {faction}\'s mark near {region} is their latest entry in a record that now runs long enough to be recognized as continuous and intentional. Other forces will come and go. {commander}\'s record is the thread that runs through everything.',
    ],
  },

  THE_CROSSING: {
    loreType: 'THE_CROSSING', icon: '⇒',
    ruleApplied: 'The Crossing',
    ruleExplanation: 'Armies cross into unfamiliar territory — the war\'s geography expands.',
    headlines: [
      'The Armies Cross into New Ground',
      '{faction} Moves Beyond Their Usual Territory',
      'The War Expands — A Crossing Noted',
      'Known Forces in Unknown Places',
    ],
    bodies: [
      'The war doesn\'t stay where you put it. {faction}\'s movement through {region} today took them beyond the territory they usually operate in — across a boundary, literal or implied, that previous entries in the chronicle had treated as their edge. The crossing changes the map. It also changes what {rival} has to defend.',
      '{commander} ordered the crossing without announcing it publicly. {faction}\'s advance into territory outside their usual range near {region} was noted by the chronicler but not, apparently, anticipated by {rival}. The geometry of the war has expanded. The edges have moved outward. Forces that thought themselves behind the front are now on it.',
      'The chronic geography of this war — which faction operates where, which territories are contested and which are held — shifted today when {faction} crossed into {region} from the direction that usually means peace. The crossing itself was the statement. {commander} didn\'t send a declaration. They sent a unit. The declaration followed.',
      'When armies cross boundaries they haven\'t crossed before, the war becomes a different shape. {faction}\'s crossing near {region} today marks the latest expansion of the conflict\'s territory — another zone that was once theoretical and is now real. {rival} has been tracking {faction}\'s peripheral movements. Today they became central movements. The maps are being redrawn.',
    ],
  },

  MARKET_ROAD: {
    loreType: 'MARKET_ROAD', icon: '⊡',
    ruleApplied: 'Market Road',
    ruleExplanation: 'The war\'s trade and supply — how armies sustain themselves.',
    headlines: [
      'The Supply Routes Hold Near {region}',
      '{faction} Secures the Road Through {region}',
      'Trade Follows War — A Market Road Established',
      '{commander} Prioritizes the Supply Line',
    ],
    bodies: [
      'Armies run on more than conviction. {faction}\'s recent stabilization of the supply route near {region} is unglamorous but essential — the kind of move that doesn\'t make for dramatic chronicle entries but determines whether the dramatic ones are possible. The road is open. Supplies are moving. The war continues to be funded.',
      '{commander} keeps a separate map of supply lines. "Win the logistics," they say, "and you\'ll eventually win everything else." The market road secured near {region} today represents the kind of victory that doesn\'t appear in battle tallies but shows up in the length of campaigns. {faction} can sustain. {rival} is beginning to struggle to.',
      'The territory around {region} has value beyond its position on the front. The market road that passes through it connects {faction}\'s forward positions to their supply base — and controlling it means {rival} cannot easily interdict the flow. {commander} assigned three units specifically to the road. Two are still there. The road is still open.',
      'Wars are supply problems wearing tactical clothing. The movement near {region} today — {faction} securing the passage that connects their position to the rear — is the kind of entry that historians overlook and quartermasters remember. The road is held. The supplies will flow. The campaign will continue.',
    ],
  },

  WATCH_FIRE: {
    loreType: 'WATCH_FIRE', icon: '◌',
    ruleApplied: 'Watch Fire',
    ruleExplanation: 'Sentinels keeping watch — the war\'s patient, unglamorous maintenance.',
    headlines: [
      'The Watch Fires Burn Near {region}',
      '{faction} Holds Position Through the Night',
      'Sentinels at the Edge',
      'The Long Watch — Nothing Happened, Which Is the Point',
    ],
    bodies: [
      'The watch fires near {region} burned through the night without incident — which is exactly what they\'re supposed to do. {faction}\'s sentinels held their positions, tracked movements on the other side of the line, and reported nothing unusual. In a war full of unusual events, the unremarkable watches are the frame that makes everything else possible.',
      '{commander} has a name for the watch fire entries in the chronicle: "the patient record." These are the nights when nothing happened because someone was paying attention. {faction}\'s sentinels near {region} maintained their position, kept the fires burning, tracked the terrain. {rival} didn\'t move. Neither did {faction}. The war waited.',
      'The watch fires are the war\'s oldest technology. Near {region}, where {faction}\'s sentinels have been keeping vigil since the campaign began, the fires burn at intervals that signal to other positions across the line: occupied, aware, not sleeping. {rival}\'s scouts have been counting the fires. They know what the count means. So does {commander}.',
      'Everything in the chronicle is connected to everything else. The watch fire entry for tonight near {region} — unremarkable, ordinary, the sentinels awake and the line quiet — is the connective tissue between the battle entries that surround it. Without the watch fires, no one holds anything. The chronicle records them because the war requires them.',
    ],
  },

}

// ── Rule selection ────────────────────────────────────────────────────────────

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
): string {
  const tokenId = Number(event.tokenId)
  const count = Number(event.count)
  const priorSameOwner = allEvents.slice(0, index).filter(e => e.owner === event.owner)
  const isVeteran = priorSameOwner.length > 0
  const seed = seedN(event.tokenId, event.blockNumber)

  // ── TIER 1: Structural milestones (highest priority) ──────────────────────
  if (cumCount > 0 && cumCount % 40 === 0) return 'LONG_COUNT'
  if (cumCount > 0 && cumCount % 25 === 0) return 'PROPHECY'
  if (cumCount > 0 && cumCount % 10 === 0) return 'THE_COUNT'
  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'AGE_TURNS'
  const nextEra = ERAS.find(e => e.threshold > cumCount)
  if (nextEra && nextEra.threshold - cumCount <= 3) return 'THRESHOLD_VIGIL'

  // ── TIER 2: Rare on-chain patterns ────────────────────────────────────────
  if (isRareTxHash(event.transactionHash)) return 'RELIC_UNEARTHED'
  if (prev && prev.blockNumber === event.blockNumber) return 'SIMULTANEOUS'

  // ── TIER 3: Time gaps ─────────────────────────────────────────────────────
  if (prev && event.blockNumber - prev.blockNumber > 50000n) return 'LONG_SILENCE'
  if (prev && event.blockNumber - prev.blockNumber > 10000n) return 'CEASEFIRE'
  if (prev && event.blockNumber - prev.blockNumber > 3000n && event.blockNumber - prev.blockNumber < 6000n) {
    if (seed % 4 === 0) return 'INTERLUDE'
  }

  // ── TIER 4: Veteran return patterns ───────────────────────────────────────
  if (isVeteran) {
    const last = priorSameOwner[priorSameOwner.length - 1]
    const gap = event.blockNumber - last.blockNumber
    if (gap > 20000n) return 'GHOST_SIGNAL'
    if (gap < 500n) return 'WAR_COUNCIL'
  }

  // ── TIER 5: Token-range lore ──────────────────────────────────────────────
  if (tokenId < 500 && index > 10) return 'OLD_LEGEND'
  if (tokenId < 1000) return 'ANCIENT_STIRS'
  if (tokenId >= 1000 && tokenId < 2000 && !isVeteran) return 'EMISSARY'
  if (tokenId >= 2000 && tokenId < 3000) {
    return seed % 3 === 0 ? 'THE_MAPMAKERS' : 'MARKET_ROAD'
  }
  if (tokenId >= 5000 && tokenId <= 6000) return 'HOLLOW_HEART'
  if (tokenId > 8500 && index > 5) return 'SCOUT_RETURNS'
  if (tokenId > 8000) return 'EDGE_LORD'

  // ── TIER 6: Prime token IDs ───────────────────────────────────────────────
  if (isPrime(tokenId)) return 'THE_SEER'

  // ── TIER 7: Burns — sacrifice rules ───────────────────────────────────────
  if (event.type === 'BurnRevealed') {
    if (count >= 10) return 'GREAT_SACRIFICE'
    if (count === 1) return 'DUST_MARK'
    if (isVeteran && priorSameOwner.length >= 2) return 'DEBT_OF_BLOOD'
    if (isVeteran) return 'BLOOD_PACT'
    return 'OFFERING'
  }

  // ── TIER 8: Pixel scale — battle size ────────────────────────────────────
  if (count >= 200) return 'GREAT_BATTLE'
  if (count >= 50 && count % 50 === 0) return 'FORMAL_DECLARATION'
  if (count >= 50) return 'SKIRMISH'
  if (count === 1) return 'DUST_MARK'

  // ── TIER 9: Veteran patterns ──────────────────────────────────────────────
  if (isVeteran) {
    const roll = seedN(event.tokenId, event.blockNumber, 23) % 7
    if (roll === 0) return 'POWER_CONSOLIDATES'
    if (roll === 1) return 'THE_CROSSING'
    if (roll === 2 && priorSameOwner.length >= 3) return 'LINEAGE'
    if (roll === 3) return 'REVISION'
    if (roll === 4) return 'DESERTION'
    return 'VETERAN_STRIKES'
  }

  // ── TIER 10: New arrivals ─────────────────────────────────────────────────
  const newRoll = seedN(event.tokenId, event.blockNumber, 29) % 5
  if (newRoll === 0) return 'TAVERN_TALE'
  if (newRoll === 1) return 'VILLAGE_ACCORD'
  if (newRoll === 2) return 'WATCH_FIRE'
  return 'NEW_ARRIVAL'

  // Fallback
  // return 'BORDER_RAID'
}

// ── Entry generation ──────────────────────────────────────────────────────────

export function generateStoryEntries(events: IndexedEvent[], startCount = 0): StoryEntry[] {
  return events.map((event, index) => {
    const cumCount = startCount + index + 1
    const prev = index > 0 ? events[index - 1] : null
    const ruleKey = selectRule(event, index, events, cumCount, prev)
    const rule = RULES[ruleKey] ?? RULES['BORDER_RAID']

    const era = getEra(cumCount)
    const ctx = buildCtx(event.tokenId, event.blockNumber, era)
    const s  = seedN(event.tokenId, event.blockNumber)
    const s2 = seedN(event.tokenId, event.blockNumber, 3)
    const headline = fill(pick(rule.headlines, s),  ctx)
    const body     = fill(pick(rule.bodies,     s2), ctx)

    const featuredTypes = new Set(['GREAT_BATTLE', 'PROPHECY', 'AGE_TURNS', 'RELIC_UNEARTHED', 'LONG_COUNT', 'SIMULTANEOUS', 'GREAT_SACRIFICE', 'LONG_SILENCE'])

    return {
      id: `${event.transactionHash}-${event.tokenId.toString()}`,
      eventType: event.type,
      loreType: rule.loreType,
      era,
      headline,
      body,
      icon: rule.icon,
      featured: featuredTypes.has(ruleKey) || event.count > 200n,
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
    }
  })
}

// ── Genesis / world-primer entries ───────────────────────────────────────────

export const PRIMER_ENTRIES: StoryEntry[] = [
  {
    id: 'primer-genesis', eventType: 'genesis', loreType: 'GENESIS', era: 'The Quiet Before',
    headline: 'The Grid Exists. The War Has Not Yet Begun.',
    body: 'Ten thousand faces occupy the Grid — a contested canvas forty positions wide and forty deep. Each face is a territory, each territory a potential battleground. The factions that will fight over them have not yet made their first moves. The chronicler has opened the record. The ink is ready. The war begins when the first mark is made.',
    icon: '◈', featured: true,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'Genesis', ruleExplanation: 'Normies are 10,000 fully on-chain pixel faces on Ethereum. The Grid is 40×40 — 1,600 pixels per Normie, all stored on-chain. Every real edit and burn shapes this story.' },
  },
  {
    id: 'primer-factions', eventType: 'genesis', loreType: 'GENESIS', era: 'The Quiet Before',
    headline: 'Four Lineages, One Grid — The Factions Take Shape',
    body: 'Before the first battle, the factions identify themselves. Four lineages have emerged from the ten thousand: the Humans, adaptive and numerous; the Cats, sovereign and unpredictable; the Aliens, patient and cosmic in their thinking; the Agents, built for precision and purpose. They will fight. They will sacrifice. They will mark the Grid with their colors. The chronicle will record everything.',
    icon: '▦', featured: false,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'Genesis', ruleExplanation: 'The four Normie types — Human, Cat, Alien, Agent — are the four lineages of the Grid.' },
  },
]

export { RULES }
