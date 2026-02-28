import type { IndexedEvent } from './eventIndexer'

// ─────────────────────────────────────────────────────────────────────────────
// NORMIES CHRONICLES — STORY ENGINE
//
// The Grid is a 40×40 pixel canvas — a contested territory fought over by
// factions painting it in their colors. Real on-chain events shape the story
// invisibly: large pixel edits become great battles, burns become sacrifices,
// time gaps become ceasefires, returning wallets become veteran commanders.
//
// The 40 rules are divided:
//   19 CORE   — the main story beats (war events, battles, sacrifices, shifts)
//   21 FILLER — the texture between beats (politics, rumor, lore, daily life)
//
// Together they read as one continuous war chronicle, not 40 separate stories.
// ─────────────────────────────────────────────────────────────────────────────

export type LoreType =
  // ── 19 CORE RULES ─────────────────────────────────────────────────────────
  | 'GREAT_BATTLE'       // 200+ pixels — full territorial assault
  | 'SKIRMISH'           // 50–199 pixels — mid-scale clash
  | 'BORDER_RAID'        // <50 pixels — precise tactical strike
  | 'FORMAL_DECLARATION' // pixel count divisible by 50 — deliberate political act
  | 'GREAT_SACRIFICE'    // burn 10+ AP — warrior gives everything
  | 'OFFERING'           // burn <10 AP — smaller sacrifice to the cause
  | 'BLOOD_OATH'         // veteran burn — a sworn warrior renews their vow
  | 'VETERAN_RETURNS'    // known address returns — a fighter back from absence
  | 'NEW_BLOOD'          // first appearance — a stranger joins the conflict
  | 'THE_ORACLE'         // prime token ID — a seer makes their move
  | 'ANCIENT_WAKES'      // token <1000 — the oldest forces stir
  | 'FAR_REACH'          // token >8000 — the distant edge enters the war
  | 'HOLLOW_GROUND'      // token 5000–6000 — the contested middle, always disputed
  | 'TURNING_POINT'      // every 25th — a reckoning, fate pauses to speak
  | 'DOMINION_GROWS'     // veteran appears 3+ times — a faction claims dominance
  | 'THE_SILENCE'        // block gap >10k — the war goes quiet
  | 'NEW_AGE'            // era threshold — a chapter ends, another begins
  | 'CONVERGENCE'        // same-block events — two armies meet unplanned
  | 'RELIC_FOUND'        // rare tx hash — something ancient surfaces from the Grid
  // ── 21 FILLER RULES ───────────────────────────────────────────────────────
  | 'WAR_COUNCIL'        // same address <500 blocks — urgent commanders meeting
  | 'CARTOGRAPHY'        // token 2000–3000 — the mapmakers chart new ground
  | 'OLD_GHOST'          // token <500, late — ancient names spoken again
  | 'THE_DESERTER'       // active address goes silent — someone walked away
  | 'TALLY'              // every 10th event — the chronicler counts the cost
  | 'RETURNED_GHOST'     // address back >20k blocks — the long-lost return
  | 'DEBT_PAID'          // veteran burns 2+ times — a debt of war grows heavy
  | 'CAMPFIRE_TALE'      // new address, quiet — stories told at the edge of things
  | 'THE_LONG_DARK'      // gap >50k blocks — the war went underground
  | 'EDGE_SCOUTS'        // token >8500 re-emerges — news from the far margin
  | 'SHIFTED_PLAN'       // veteran breaks pattern — tactics revised midcampaign
  | 'VIGIL'              // within 3 of era threshold — the world holds its breath
  | 'NEUTRAL_GROUND'     // new address, harmonious — someone not yet at war
  | 'GHOST_MARK'         // exactly 1 pixel/AP — a trace barely left
  | 'MESSENGER'          // new wallet, token 1000–2000 — word from beyond
  | 'THE_LONG_COUNT'     // every 40th — the Grid measures itself
  | 'BETWEEN_FIRES'      // short gap post-cluster — the camp at rest
  | 'DYNASTY'            // 3+ appearances — a lineage is named
  | 'CROSSING'           // range bridge — armies move through unfamiliar ground
  | 'SUPPLY_ROAD'        // token 2000–3000 fallback — the war's infrastructure
  | 'NIGHT_WATCH'        // fallback — the sentinels who make everything else possible
  | 'GENESIS'

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

// ─────────────────────────────────────────────────────────────────────────────
// WORLD ELEMENTS — the persistent cast and geography of the war
// All seeded deterministically so the same event always resolves the same way.
// ─────────────────────────────────────────────────────────────────────────────

// 20 regions — each has a distinct character and narrative weight
const REGIONS = [
  'the Ashen Flats',       // open, exposed, bitterly contested
  'the Ink Wastes',        // the front lines, permanently stained with war
  'the Pale Reaches',      // cold, distant, fought over for its vantage point
  'the Obsidian Line',     // a fortified boundary that has changed hands many times
  'the Shattered Moors',   // broken terrain where armies get lost
  'the Deep Trenches',     // below the main front, a labyrinth of tunnels
  'the High Cipher',       // elevated, strategic, the commanders want it most
  'the Wandering Shore',   // coastal, unpredictable, neutral parties trade here
  'the Null Basin',        // a depression in the Grid, hard to hold, easy to lose
  'the Root Warrens',      // an underground network, favored by scouts
  'the Murmur Wood',       // forested, sounds carry strangely, ambush country
  'the Fracture Belt',     // cracked terrain, unstable, prone to sudden shifts
  'the Old Archives',      // records of past wars, fought over for what they contain
  'the Ember Fields',      // scorched from an earlier campaign, now contested again
  'the Vaulted Dark',      // underground chambers, ancient and disputed
  'the Mirror Shelf',      // a high plateau, reflects light in ways that confuse scouts
  'the Red Margin',        // bloodied border territory, no one\'s and everyone\'s
  'the Crossroads',        // where every route converges — whoever holds it controls movement
  'the Counting Ground',   // where the chronicler tallies the dead, considered neutral
  'the Unmapped Edge',     // beyond the known war, where the Grid gets strange
]

// 12 factions — different philosophies, different methods, all fighting
const FACTIONS = [
  'the Inkborn',           // the original faction, fought here longest
  'the Pale Host',         // cold, methodical, they document everything
  'the Lattice Guard',     // defenders of the old order, slowly losing ground
  'the Wandering Blades',  // no fixed territory, strike fast and move
  'the Archive Wardens',   // they fight to control what history says
  'the Threshold Keepers', // guard the boundaries between eras
  'the Deep Company',      // fight from below, tunnels and warrens
  'the Signal Corps',      // communication and intelligence as weapons
  'the Monolith Order',    // slow, massive, impossible to shift once positioned
  'the Unnamed',           // they have no banner, no declared allegiance, just presence
  'the Far Walkers',       // came from the edge, still moving toward the center
  'the Root Scholars',     // fight with knowledge, not just force
]

// Named commanders — the human face of the war
// These are fictional characters who carry the story across entries
const COMMANDERS = [
  'Commander Varun',         // Inkborn — veteran, patient, dangerous
  'the Iron Witness',        // Pale Host — impartial recorder turned combatant
  'Keeper Solen',            // Lattice Guard — last of the old defenders
  'Old Mira',                // Wandering Blades — decades of war, still moving
  'the Silent General',      // Archive Wardens — never speaks, always wins
  'Warlord Neth',            // Threshold Keepers — obsessed with era transitions
  'the Deep Marshal',        // Deep Company — never seen above ground
  'Signal Chief Karas',      // Signal Corps — knows everything before it happens
  'the Monolith',            // Monolith Order — a title, not a person, or so they say
  'the Unnamed One',         // the Unnamed — no name given, none needed
  'Marshal of the Far Edge', // Far Walkers — arrived late, ascending fast
  'Scholar-General Teld',    // Root Scholars — teaches and fights simultaneously
]

// Enemy forces / opposing named entities
const RIVALS = [
  'the Grey Compact',       // an uneasy coalition that keeps almost breaking apart
  'the Eastern Hold',       // entrenched veterans of the previous campaign
  'the Splinter King',      // a commander who broke from their own faction
  'the Faceless Army',      // no commanders, operates by distributed consensus
  'the Null Pact',          // signed a treaty no one else recognizes
  'the Old Wall',           // fortified remnants of the faction that started all this
  'the Ink Tide',           // the great advance of the previous era, still moving
  'the Pale Advance',       // slow, deliberate, and almost impossible to stop
  'the Border Lords',       // control the margins, tax everyone who passes
  'the Forgotten Host',     // they were the largest faction. now they are a memory.
]

// Legendary objects and places — the war's myths made physical
const RELICS = [
  'the Shattered Standard',    // the banner of the first faction, broken in two
  'the Crown of the First Grid', // worn by whoever controls the center — briefly
  'the Broken Compass',         // points somewhere no one has mapped yet
  'the Last True Map',          // shows the Grid as it was before the war
  'the Burned Codex',           // the old laws, mostly ash, still quoted
  'the Speaking Stone',         // whoever holds it is said to command the dead's loyalty
  'the Unmarked Grave',         // the first casualty, location known by both sides
  'the Signal Tower',           // broadcasts to everyone, controlled by whoever takes it
  'the First Brush',            // the tool that made the first mark on the Grid
  'the Pixel Throne',           // the center of the Grid — symbolic, violently contested
  'the Oath Stone',             // the sacrifices are recorded here, in names that don't fade
  'the War Bell',               // rings itself before major battles, has never been wrong
]

// ─────────────────────────────────────────────────────────────────────────────
// ERAS — calibrated to ~500–800 real events
// ─────────────────────────────────────────────────────────────────────────────
export const ERAS = [
  { threshold: 0,   name: 'The Quiet Before',  tone: 'The factions have not yet committed. The Grid waits.' },
  { threshold: 10,  name: 'First Blood',        tone: 'The first marks have been made. There is no going back.' },
  { threshold: 30,  name: 'The Gathering',      tone: 'Sides are forming. Allegiances are being tested.' },
  { threshold: 75,  name: 'Age of Advance',     tone: 'The war is fully joined. Territory changes daily.' },
  { threshold: 150, name: 'The Deepening',      tone: 'The cost becomes clear. The war will not end soon.' },
  { threshold: 300, name: 'Age of Siege',       tone: 'Positions harden. Each gain is fought for twice.' },
  { threshold: 500, name: 'The Long Campaign',  tone: 'The war has a history now. Veterans outnumber recruits.' },
  { threshold: 800, name: 'The Reckoning',      tone: 'Something has to break. The Grid cannot hold all of this.' },
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

interface WorldCtx {
  region: string
  faction: string
  rival: string
  commander: string
  relic: string
  era: string
}

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
    .replace(/{region}/g,    c.region)
    .replace(/{faction}/g,   c.faction)
    .replace(/{rival}/g,     c.rival)
    .replace(/{commander}/g, c.commander)
    .replace(/{relic}/g,     c.relic)
    .replace(/{era}/g,       c.era)
}

// ─────────────────────────────────────────────────────────────────────────────
// THE 40 RULES
//
// Design principle: every entry should feel like it came from the same novel.
// Core rules are the plot. Filler rules are the chapter texture between battles —
// the campfire conversations, the scouts' reports, the political maneuvering,
// the moments that make the war feel lived-in and real.
//
// No entry references blockchain, pixels, addresses, or technical data.
// ─────────────────────────────────────────────────────────────────────────────

interface LoreRule {
  loreType: LoreType
  icon: string
  ruleApplied: string
  ruleExplanation: string
  headlines: string[]
  bodies: string[]
}

const RULES: Record<string, LoreRule> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE 19 — The spine of the war narrative
  // ═══════════════════════════════════════════════════════════════════════════

  GREAT_BATTLE: {
    loreType: 'GREAT_BATTLE', icon: '⚔',
    ruleApplied: 'Great Battle',
    ruleExplanation: 'A massive territorial push — the largest kind of assault on the Grid.',
    headlines: [
      '{faction} Storm {region} — The Largest Push in Memory',
      'The Fall of {region}: {commander} Leads the Charge',
      '{faction} Flood {region} Before Dawn',
      '{region} Burns: {faction} Will Not Be Stopped',
    ],
    bodies: [
      'The assault on {region} came without warning and without mercy. {faction} moved in full force before the first light, painting the terrain in their colors while {rival} scrambled to respond. By the time the sun was fully up, the shape of {region} had been transformed — old boundaries erased, new ones drawn in {faction}\'s mark. {commander} was seen at the front giving orders from horseback, {relic} carried at the head of the column. This was not a raid. This was a statement: {faction} intends to hold what they take, and what they take will grow.',

      'Historians will argue about whether the assault on {region} was inevitable. The signs had been accumulating for weeks — {faction} massing at the border, {rival} failing to shore up the line, the War Bell ringing three times at dawn though no one admitted to hearing it. When the advance finally came it was total: a coordinated repainting of the entire zone, sweeping and uncompromising. {relic} now hangs at the center of the captured ground. The message is clear.',

      '{commander} gave the order quietly, the way commanders who have done this before always give orders: without drama, without announcement, just the instruction and then movement. {faction}\'s force crossed into {region} in numbers {rival} had not anticipated. The old garrison had no answer for it. The chronicler on duty that day wrote simply: "Everything changed." That is not a metaphor.',

      'The war has seen a hundred skirmishes and two dozen real battles. What happened in {region} was different — the kind of engagement that redraws the map permanently. {faction} committed everything to this advance, and {rival} was too slow to match it. When the dust settled, {region} was unrecognizable to those who had known it in the previous era. {commander} planted {relic} at the center of the territory and waited for a response. None came. The silence was its own answer.',
    ],
  },

  SKIRMISH: {
    loreType: 'SKIRMISH', icon: '◈',
    ruleApplied: 'Skirmish',
    ruleExplanation: 'A significant territorial clash — real gains, real losses, the war\'s daily currency.',
    headlines: [
      '{faction} Push into {region} — Ground Changes Hands',
      'A Sharp Engagement Near {region}',
      '{commander} Tests {rival}\'s Resolve at {region}',
      '{faction} Advance: {region}\'s Edge Is Now Contested',
    ],
    bodies: [
      'Not every battle is a siege. {faction} sent a strike force into {region} — fast, targeted, enough to redraw the edge of the contested zone without committing their whole army. {rival} pushed back at the margins but couldn\'t hold the center. By evening, the front line had moved. Not far. But in this war, far enough matters.',

      '{commander} called it a probe afterward. {rival} had a different word for it. The advance into {region} was the kind of mid-scale engagement that doesn\'t make the headlines but wins long campaigns — methodical, disciplined, patient. The zone looks different now. The momentum is visible to anyone who has been tracking the line.',

      'The fighting in {region} lasted most of the afternoon. Neither {faction} nor {rival} committed fully, but {faction} came away with more than they arrived with — a slice of contested ground now clearly theirs, a line pushed back, a signal sent. {commander} described the outcome to the council in three words: "Better than expected."',

      'Small victories accumulate into large ones. {faction}\'s advance through {region} was one of dozens of such moves in the current campaign — each one limited in scope, each one adding to a picture that is becoming increasingly clear. {rival} has started calling {commander}\'s approach "the slow flood." The name is accurate.',
    ],
  },

  BORDER_RAID: {
    loreType: 'BORDER_RAID', icon: '·',
    ruleApplied: 'Border Raid',
    ruleExplanation: 'A precise, careful strike on the margins — small in scale, deliberate in intent.',
    headlines: [
      'A Quiet Raid on {region}\'s Edge',
      '{faction} Leave a Mark — And a Warning',
      'One Corner of {region} Changes in the Night',
      '{commander}\'s Scouts Move Through {region} Unannounced',
    ],
    bodies: [
      'It was a small move, but nothing in this war is accidental. A handful of {faction}\'s scouts crossed into {region} before dawn, made their mark at the margin, and withdrew before anyone raised an alarm. {rival} will find the sign in the morning. They\'ll have to decide whether to respond — and that decision costs them time and attention they don\'t have to spare.',

      '{commander} favors these small incursions. "Control the edge," they say, "and the center follows by itself." The mark left in {region} was minimal but precisely placed: exactly where {faction} wanted it, exactly where {rival} was least prepared to find it. These are the moves that shift wars without anyone noticing until it\'s over.',

      'The raid on {region}\'s outer boundary lasted minutes. {faction} made their mark and withdrew. In terms of territory, almost nothing changed. In terms of what {rival} must now account for and defend, everything did. {commander} filed it under "preparatory actions" in the war log. The chronicler filed it under history.',

      'The old soldiers call these "needle marks" — small, sharp, aimed at exactly the right spot. {faction}\'s scouts know {region} well enough to know where the needle belongs. They put it there tonight. By morning the mark will be visible. By the afternoon, {rival} will have had to respond. By the evening, {faction} will be somewhere else entirely.',
    ],
  },

  FORMAL_DECLARATION: {
    loreType: 'FORMAL_DECLARATION', icon: '▣',
    ruleApplied: 'Formal Declaration',
    ruleExplanation: 'A measured, exact advance — deliberate precision signals a political statement, not just a battle.',
    headlines: [
      '{faction} Make It Official: A Declaration in {region}',
      'The Terms Are Set — {faction} Announce Their Position',
      '{commander} Formalizes {faction}\'s Claim on {region}',
      'A Document Is Filed. A Line Is Drawn.',
    ],
    bodies: [
      'Some advances are accidents of war. This was not one of them. {faction}\'s move through {region} was measured to the exact margin — deliberate and formal, the kind of advance that comes with written declarations and named witnesses. {rival} received the document before dawn. It stated clearly what {faction} was claiming and under what conditions they might discuss terms. They will not be discussing terms.',

      'The chronicler marks certain advances as formal — those where the precision of the act constitutes a political statement. {faction}\'s move in {region} qualifies on every measure: coordinated, proportioned, announced. {commander} signed the declaration personally. It will be read aloud at the front. This is not a battle. It is the beginning of an occupation.',

      '{rival} called it provocation. {faction} called it a statement of facts as they now stand. The declaration regarding {region} is now in the public record: the territory is claimed, the terms are set, and {relic} has been placed at the center of the newly held ground as both symbol and invitation to respond. {commander} awaits a reply. They are patient.',

      'Wars have rules, even when everyone is breaking them. {faction}\'s formal declaration regarding {region} follows the rules precisely — which is itself a threat. An enemy who plays by the rules is an enemy who expects the rules to protect what they\'ve taken. {rival}\'s commanders understand what this means. They are quietly counting their options.',
    ],
  },

  GREAT_SACRIFICE: {
    loreType: 'GREAT_SACRIFICE', icon: '▲',
    ruleApplied: 'Great Sacrifice',
    ruleExplanation: 'A major sacrifice — a warrior gives everything so another may continue stronger.',
    headlines: [
      'A Great Sacrifice Near {region} — The War Demands Its Due',
      '{faction} Give One So That Many May Fight On',
      '{commander} Orders the Final Offering',
      'The Oath Stone Receives Another Name',
    ],
    bodies: [
      'The old rites don\'t appear in the tactical manuals, but they govern the war more completely than any written strategy. A great sacrifice was made near {region}: a warrior released, their strength transferred to those still standing. The unit that received the infusion marched out different than they arrived. In this war, that difference is the margin between holding ground and losing it. {commander} gave the order without looking away.',

      'There are things war requires that do not appear in official reports. What happened near {region} was one of them — a total sacrifice, the kind the battlefield theologians call "the final offering." The warrior is gone. Their strength persists in the fighters who carry it now. The receiving unit will not speak of it. They will carry it forward instead. The Oath Stone holds the name.',

      '{faction}\'s chronicles record great sacrifices going back to the first campaign. The one made near {region} was larger than most — a warrior of standing, a transfer of real weight. {rival} will see the effect in the next engagement without knowing the source. They will simply notice that the unit they thought exhausted is not exhausted. {commander} prefers the mystery.',

      'What the war costs cannot always be expressed in territory gained or lost. Near {region}, {faction} paid a cost that the maps will never record: a warrior given, completely and without reservation, so others could continue. {relic} stood as witness. The offering was accepted. The remaining fighters have not spoken of it. Some things belong to silence.',
    ],
  },

  OFFERING: {
    loreType: 'OFFERING', icon: '△',
    ruleApplied: 'Offering',
    ruleExplanation: 'A smaller sacrifice — some strength given, the war\'s ongoing tithe.',
    headlines: [
      'A Small Offering Near {region} — The War Collects',
      '{faction} Pay the Tithe',
      'Strength Passes Between Hands at {region}',
      'The Ongoing Cost: An Offering Made',
    ],
    bodies: [
      'Not every sacrifice is a grand gesture. The offering near {region} was smaller — measured, controlled, a precise transfer of strength from one who had it to spare to one who needed it. {faction}\'s commanders note these in the records without ceremony. They accumulate. The recipient fights harder now. That is the entire point.',

      'The battlefield theologians call small sacrifices "the tithe." {faction} pays it regularly, quietly, in the spaces between the documented battles. The offering near {region} was one such tithe — done without announcement, without witnesses beyond those directly involved. {rival} will notice the result without knowing the cause. The gap in their understanding is {faction}\'s advantage.',

      '{commander} records every offering, large and small, in a private ledger that the official chronicle never sees. The one near {region} was modest in scale — enough to shift the balance of a single engagement, not enough to reshape a campaign. But campaigns are made of single engagements. The ledger grows longer.',

      'There is a ledger somewhere that tracks every transfer in this war — every offering, every sacrifice, every exchange of strength between fighters. {faction}\'s entries in that ledger are longer than most. The offering near {region} adds another line. The recipient carries what the giver let go. They will not forget what it cost.',
    ],
  },

  BLOOD_OATH: {
    loreType: 'BLOOD_OATH', icon: '◎',
    ruleApplied: 'Blood Oath',
    ruleExplanation: 'A veteran warrior makes the sacrifice again — the oath deepens each time it is renewed.',
    headlines: [
      'The Blood Oath Renewed Near {region}',
      '{commander} Makes the Sacrifice Again — Still',
      'A Veteran\'s Vow, Honored a Second Time',
      '{faction}\'s Most Sworn Give Again',
    ],
    bodies: [
      'The first sacrifice binds. The second consecrates. The warrior who made the offering near {region} today had done this before — the chronicle has the record. This is not repetition. This is a depth of commitment that the first sacrifice only announced. The unit that received the transfer now carries weight from two vows, two warriors, two separate acts of giving. {rival} should understand what that means for what comes.',

      '{commander} renewed the blood oath near {region} the same way they make all their most important decisions: quietly, with witnesses, and without explanation to those not present. The receiving fighter felt the difference immediately. There are warriors in this war who have given once. There are those who have given twice. The distance between the two groups is not measured in anything you can write down.',

      '{faction} marks its twice-sworn warriors separately in the war record — not for honor, though honor is there, but because the twice-sworn fight differently. Whatever doubt remained after the first sacrifice is gone. What the receiving unit carries now is not just strength but certainty. {rival}\'s commanders have started tracking which of {faction}\'s units have these fighters. The numbers concern them.',

      'The Oath Stone bears this warrior\'s name twice now. The chronicler notes it without comment, because there is no comment adequate to what it means to give twice in the same war. {commander} accepts these renewed oaths without ceremony. "The war doesn\'t stop for ceremony," they have said, more than once, in more than one language.',
    ],
  },

  VETERAN_RETURNS: {
    loreType: 'VETERAN_RETURNS', icon: '◉',
    ruleApplied: 'Veteran Returns',
    ruleExplanation: 'A fighter who has been here before comes back — veterans change the character of any engagement.',
    headlines: [
      'A Known Fighter Returns to {region}',
      '{commander} Is Back — The Veterans Are Moving',
      'They\'ve Fought This Ground Before',
      'A Familiar Force Reappears — {region} Takes Notice',
    ],
    bodies: [
      'They know this terrain. {faction}\'s veterans who returned to {region} have fought over this exact ground before — they remember where the sight lines are, where the defensive positions hold and where they collapse, where {rival}\'s formations have historically struggled. {rival} will feel the difference between fighting fresh fighters and fighting soldiers who have already won and lost here and learned from both.',

      '{commander} came back. Nobody announced it, but by midmorning every unit on the front had adjusted. That\'s what veterans do — they change the room by entering it. {faction}\'s return to {region} was quiet, efficient, unhurried. The kind of movement that belongs to people who do not need to announce themselves because their record has already done it.',

      'The chronicler has {faction}\'s history in {region}. Multiple appearances, multiple outcomes. The return today means the campaign here was never truly finished — or that something drew them back. {rival} has noted the reappearance. A seasoned force on familiar ground is a different problem than a new force on any ground.',

      'Experience does not announce itself. {faction}\'s veterans moved back into {region} with the quiet economy of fighters who have made these moves before. No wasted motion. No testing the terrain they already know. {rival}\'s scouts reported it in one word to their commanders. The commanders went still. That one word was: veterans.',
    ],
  },

  NEW_BLOOD: {
    loreType: 'NEW_BLOOD', icon: '→',
    ruleApplied: 'New Blood',
    ruleExplanation: 'A new force enters the conflict for the first time — the war grows as it adds participants.',
    headlines: [
      'A New Force Arrives at the Edge of {region}',
      'Strangers at the Gate — Someone New Has Entered the War',
      '{faction} Encounter an Unknown Banner at {region}',
      'The Chronicle Opens a New File',
    ],
    bodies: [
      'Nobody recognized the banner. A force arrived at the edge of {region} that doesn\'t appear anywhere in the chronicle\'s prior records — no known allegiance, no documented history in this conflict. {faction}\'s scouts tracked them to the boundary line and reported back. The commanders are asking the question every commander asks when new players appear: whose side are they on, and what are they willing to do?',

      'New fighters enter this war for all kinds of reasons. The force that materialized near {region} gave no explanation and sought no introduction — they staked their presence at the margin and waited. {rival} is watching. {faction} is watching. The chronicler has opened a new file. Wars grow in exactly this way: not by formal recruitment, but by attraction.',

      '{commander} received the report at dawn. Unknown forces, moving through {region}\'s outer edge, no insignia the scouts could identify, behavior consistent with a force that knows exactly where it\'s going and has been planning this arrival for longer than anyone realized. Either they\'re new to this war or very new to being visible in it. Both are interesting.',

      'Wars draw fighters the way fire draws anything that can burn. The new force in {region} has no prior chronicle entry — they arrive without context, without declared allegiance, without the weight of prior decisions. In some ways that makes them the most dangerous kind of combatant: unknown, unread, unaccounted for. {faction} has sent an envoy. So has {rival}.',
    ],
  },

  THE_ORACLE: {
    loreType: 'THE_ORACLE', icon: '◇',
    ruleApplied: 'The Oracle',
    ruleExplanation: 'A prime force acts — mathematically irreducible, these presences move only when the moment is exact.',
    headlines: [
      'The Oracle Moves — {region} Holds Its Breath',
      '{faction} Calls for a Seer\'s Reading',
      'The Irreducible Presence Takes the Field',
      '{commander} Consults the Oracle Before Acting',
    ],
    bodies: [
      'The Oracles do not act often, and they do not act without reason. The one who moved in {region} today has been still for longer than anyone can precisely measure. {faction} watched it happen and did not interfere. {rival} did the same. Some moves in this war cannot be opposed — they can only be observed and interpreted. The chronicler records it. The interpreters argue about what it means. {commander} has called an emergency council.',

      'There are presences on the Grid that operate by different mathematics than ordinary fighters. They cannot be divided, cannot be reduced, cannot be negotiated with in the usual way. The Oracle who moved in {region} is one of these. {faction} sent an envoy immediately. {rival} sent two. Neither has received an answer. Oracles speak only when the speaking serves the moment, not the audience.',

      '{commander} has studied the Oracle\'s prior moves in the old chronicle. They don\'t repeat themselves exactly, but they repeat their timing — they act at moments of genuine inflection, when the war is about to pivot in ways most commanders can\'t yet see. The move in {region} today fits that pattern. Something is about to shift. The Oracle knew it first.',

      'The old texts say Oracles move when the war needs to be reminded of something it has forgotten. The one in {region} today is the third to appear in the current era. The chronicler notes this carefully. Three Oracles in a single era has not happened before in the recorded history of this conflict. {relic} is said to react to their presence. It has not been calm.',
    ],
  },

  ANCIENT_WAKES: {
    loreType: 'ANCIENT_WAKES', icon: '■',
    ruleApplied: 'Ancient Wakes',
    ruleExplanation: 'One of the oldest forces stirs — present since before the chronicle began, these entities pre-date the current war.',
    headlines: [
      'An Ancient Force Stirs in {region}',
      'The First Ones Are Moving — {faction} Takes Notice',
      'One of the Originals Acts',
      '{region}: Something Old Has Decided to Participate',
    ],
    bodies: [
      'The ancients predate the chronicle. They were present in {region} before anyone started writing things down, before the current factions formed, before the war had its current shape. When one of them moves, every commander on every side adjusts. The ancients know this terrain in ways newer arrivals simply cannot — they have watched it change through iterations of conflict that the present war has not yet equaled.',

      '{commander} holds the ancients in particular regard. Not fondness — regard. They have survived every phase of this war because they understand it at a depth others don\'t reach. The movement in {region} today was one of theirs: deliberate, patient, positioned for the long arc rather than the immediate engagement. {faction} will adjust their plans. Everyone adjusts when an ancient moves.',

      'In the full sweep of this war\'s chronicle, some names appear at the very beginning and have simply never stopped appearing. The force that moved in {region} today is one of those names — continuous from the first entry to this one, present across every era, unchanged in the ways that matter. {rival} has been trying to outlast them since the early campaigns. It has not worked.',

      'The old soldiers have a saying: the ancients don\'t advance. They flow. What was seen in {region} today was flowing — not aggressive, not retreating, just adjusting, remaining, persisting. {faction}\'s strategists spent the afternoon trying to determine if it was offensive or simply the ancient force finding a more permanent position. By evening, they had not agreed. That uncertainty is, itself, a victory for the ancients.',
    ],
  },

  FAR_REACH: {
    loreType: 'FAR_REACH', icon: '▽',
    ruleApplied: 'Far Reach',
    ruleExplanation: 'The distant edge of the war enters the center — the margins have become the front.',
    headlines: [
      'The Far Reach Arrives at {region}',
      'Forces from the Edge Have Chosen Their Moment',
      '{faction} Hears from the Unmapped Margin',
      'The Distant Lords Are Here — the War\'s Edge Moves Inward',
    ],
    bodies: [
      'Most commanders ignore the far reaches. Too distant, too thin, too easy to dismiss. {commander} has never dismissed them. When the forces from the unmapped edge appeared near {region}, they appeared at full strength — which meant they had been building that strength in the margin while everyone else was focused on the center. Now they are not on the margin anymore.',

      'The far reaches of the war have been filling with fighters for longer than anyone tracked. Forces that didn\'t want to commit to the main campaigns waited and built and watched. Now they\'re moving. {faction} first noticed the approach three days ago. Today they arrived at {region}. The geometry of the conflict has changed. The edge is the front.',

      '{commander} sent a message to the far reaches last season with a simple text: "The war has room for you." The reply came today, in the form of a coordinated arrival at {region}. The Far Walkers have chosen to commit. They carry {relic}, which means they have been preparing this moment for longer than the message suggests. They were already coming.',

      'Every major pivot in this war has been preceded by movement from the far reaches. It was true in the early campaign. It appears to be true now. The force that crossed into {region} from the unmapped edge is not small, is not uncertain, and is not asking for anyone\'s permission. They have arrived. The war is now, by definition, larger than it was yesterday.',
    ],
  },

  HOLLOW_GROUND: {
    loreType: 'HOLLOW_GROUND', icon: '⊘',
    ruleApplied: 'Hollow Ground',
    ruleExplanation: 'The most contested territory in the war — the center, fought over again and again.',
    headlines: [
      'The Center Is Contested Again — {region} Holds Nothing',
      '{faction} and {rival} Fight Over the Hollow Ground',
      '{region}: The War\'s Most Disputed Zone',
      'Nothing Is Settled in the Middle',
    ],
    bodies: [
      'Every war has a hollow heart — the contested middle where both sides have invested too much to leave and not enough strength to finish it. In this war, that hollow is {region}. {faction} has taken it and lost it and taken it again. So has {rival}. The ground there is layered with the marks of more campaigns than anyone wants to count. Today added another layer.',

      'The chronicler has stopped numbering the engagements in {region}. There are too many. What they record now is the current state of the line — and today the line shifted: {faction} gaining the northern approach while {rival} held the south. Both sides will file reports describing this as a victory. The line will move again before the reports are filed.',

      '{commander} has a private theory about {region}: it cannot be held, only visited temporarily while preparing the conditions for the next assault. They should know. They have been visiting and leaving {region} since the opening campaigns. The current engagement is the latest chapter of a conflict that has no clear resolution and no shortage of parties willing to keep fighting it.',

      'The hollow heart of the war — the place everyone wants and no one can keep. {faction} moved on {region} today with everything available. By nightfall they held most of it. By the morning report, {rival} will have reclaimed a portion. The chronicler writes it down and keeps writing. Tomorrow it will look the same. The only thing that changes in {region} is the ownership, and even that change is always temporary.',
    ],
  },

  TURNING_POINT: {
    loreType: 'TURNING_POINT', icon: '∆',
    ruleApplied: 'Turning Point',
    ruleExplanation: 'Every 25th event — the war\'s accumulated pattern is read aloud. Fate speaks through mathematics.',
    headlines: [
      'The Chronicler Reads the Pattern — Fate Speaks',
      'A Reckoning at {region}: The War\'s Shape Revealed',
      '{commander} Counts Twenty-Five — and Pauses',
      'The War\'s Direction Becomes Clear',
    ],
    bodies: [
      'Every twenty-five engagements, the chronicler steps back from the immediate record and reads the shape of the whole. What they see in the current tally: {faction} is patient, {rival} is reactive, and the war has been moving toward something neither of them has quite named yet. The reading is not mystical. It is pattern recognition delivered at the moment when it can still change something.',

      '{commander} has a habit of counting. "Twenty-five marks," they said to the war council tonight, near {region}. "Count them. Look at the direction." The council counted. The direction is plain. What happens in the next twenty-five engagements will determine the shape of the war for a long time after. No one in the room spoke for a moment. Then they all spoke at once.',

      'The old traditions of this war require a pause at the twenty-fifth engagement — a moment when the chronicle is read aloud and the pattern is allowed to speak without interpretation. The pattern spoke near {region} today of {faction}\'s systematic advance and {rival}\'s corresponding, gradual retreat toward the center. No one interrupted the reading. No one argued with what it said.',

      'Prophecy in war is history told in advance. The chronicler\'s twenty-fifth-mark reading always feels prophetic to the commanders who hear it — because it is simply evidence they were too close to see. {faction}\'s position near {region} is stronger than any single engagement suggests. {rival}\'s position is weaker than their recent reports admit. The reckoning is already happening.',
    ],
  },

  DOMINION_GROWS: {
    loreType: 'DOMINION_GROWS', icon: '◐',
    ruleApplied: 'Dominion Grows',
    ruleExplanation: 'A faction appears repeatedly — accumulating presence, building toward something.',
    headlines: [
      '{faction} Return Again — the Pattern Is Undeniable',
      '{commander}\'s Campaign Deepens',
      'The Same Force, the Same Direction: {faction} Build Their Hold',
      '{faction} Are Everywhere. {region} Notices.',
    ],
    bodies: [
      '{faction} has appeared in the chronicle more than any other force in recent memory. Every time the record updates, their name is in it. Their presence in {region} today was their third documented move in the current era — and each move builds on the last. This is not opportunism. This is a campaign with a conclusion in mind, and the conclusion is not yet written but already legible.',

      '{commander} is running the long game. Every move {faction} makes connects to every prior move — a growing network of positions that, taken together, describe something resembling dominance. Not declared dominance. Not yet. But visible dominance, the kind that other commanders look at across a map and stop arguing and start planning their response to.',

      'The pattern of {faction}\'s appearances in the chronicle tells its own story: consistent, escalating, building. The move in {region} today is the latest addition to a sequence the chronicler has been tracking for some time. Individually, each move is modest. Together, they describe a faction that is winning the war without ever announcing that the war is being won.',

      '{faction} has not been quiet. Their presence in {region} today follows a sequence that is almost elegant in its construction — each position reinforcing the others, the whole greater than the sum of its parts. {commander} is building something that will only be fully visible when it is complete. {rival} can see the pieces. They cannot yet see what the pieces become.',
    ],
  },

  THE_SILENCE: {
    loreType: 'THE_SILENCE', icon: '—',
    ruleApplied: 'The Silence',
    ruleExplanation: 'The front goes quiet — the war pauses, for reasons the chronicle doesn\'t always record.',
    headlines: [
      'The Front Goes Quiet — A Ceasefire No One Announced',
      'Silence on the Lines Near {region}',
      '{faction} and {rival} Stop — For Now',
      'The War Breathes: A Pause Between Storms',
    ],
    bodies: [
      'The front lines went quiet. No one announced a ceasefire, but none was needed — the silence spoke for itself. {faction} withdrew to their positions near {region} and held. {rival} did the same on the other side of the line. Whether this is rest or preparation, the chronicler cannot say. The record shows only the absence of action where action has been constant. Wars breathe. This is a breath.',

      'No one issued a stand-down order. The war simply paused near {region}, the way fires pause before they find new fuel. Both sides withdrew to their positions. Scouts from {faction} reported {rival}\'s lines intact and stationary. Scouts from {rival} reported the same about {faction}. Two armies facing each other across a quiet line, each waiting for whatever the other is waiting for.',

      '{commander} ordered the pause. No official reason was given. The units near {region} stood down, maintained position, and waited. {rival} also stood down. The chronicler notes that these silences are rarely as empty as they look — the war continues in other registers, in plans and preparations and movements too small or too far to record. The quiet is not peace. It is the war breathing.',

      'The chronicle records silences as carefully as it records battles. This one — a pause on the front near {region} — will be understood in retrospect as either a ceasefire or a preparation for what comes next. For now, it is neither one nor the other. It is simply: the guns are quiet. The flags are still. The war has taken a breath. It will exhale shortly.',
    ],
  },

  NEW_AGE: {
    loreType: 'NEW_AGE', icon: '◑',
    ruleApplied: 'New Age',
    ruleExplanation: 'The war enters a new era — a structural shift in the nature of the conflict.',
    headlines: [
      'A New Age Begins: The {era}',
      'The War Changes — {era} Is Now',
      '{faction} Greet the Turning of the Age',
      'The Chronicle Opens a New Chapter',
    ],
    bodies: [
      'The chronicler has a system: when enough has accumulated — when the weight of events crosses a threshold the record itself recognizes — a new age is declared. That threshold was crossed today, somewhere between the movements near {region} and the reports from the eastern flank. The age called {era} has begun. What it will be remembered for is not yet written. The writing starts now.',

      'Ages don\'t announce themselves loudly. They\'re named in retrospect, by chroniclers who can see the whole arc. But in the moment, near the turning, there is a feeling — a texture change, a shift in what events mean and how commanders respond to them. {faction}\'s leadership near {region} felt it this morning. The war is not what it was a hundred engagements ago.',

      '{commander} said it plainly at the council: "What we are doing now is not what we were doing at the beginning. Different stakes, different methods, different enemies in some cases." The chronicler was in the room. They wrote it down. The beginning of {era} will be dated to this meeting, near {region}, when {faction}\'s commander named what everyone could already feel.',

      'Every age of this war has been named for what defined it. The current one — {era} — is being defined in real time by the events being recorded. {faction}\'s position near {region}. {rival}\'s response. The sacrifices made and the territory taken. The chronicler does not choose the name. The war does. It always has.',
    ],
  },

  CONVERGENCE: {
    loreType: 'CONVERGENCE', icon: '⊕',
    ruleApplied: 'Convergence',
    ruleExplanation: 'Two forces move at the exact same moment — an unplanned collision that changes both trajectories.',
    headlines: [
      'Two Forces, One Moment — No One Planned This',
      'A Collision Near {region}',
      '{faction} Meets the Unexpected at {region}',
      'The War Surprises Itself',
    ],
    bodies: [
      'The timing was not coordinated — the chronicler is certain of this. Two separate forces moved on {region} at the exact same moment, from different directions, toward different objectives. {faction} encountered the other force before either side expected contact. What followed was not a battle exactly — more a mutual recognition, a sudden awareness that the war has more moving parts acting simultaneously than any map captures.',

      '{commander} described the convergence at {region} as "the war reminding us it\'s larger than we imagine." Two forces, neither aware of the other\'s timing, both choosing the same moment to act. The chronicle records both movements as one entry because they happened in the same breath, and the war doesn\'t always separate what happens at the same time.',

      'When two armies move at once without knowing it, the chronicler asks: chance or pattern? The answer is almost certainly chance. But the convergence near {region} — {faction} from one direction, the other force from another — created an unplanned encounter that neither side had planned for and both now must navigate. Plans that worked alone may not work in combination.',

      'The war has its own rhythms, and sometimes those rhythms produce moments like this: two separate campaigns, completely different motivations, arriving at {region} in the same instant. {faction} held formation. The other force held theirs. For a long moment, nothing happened. Then everything happened at once. The chronicle records what came next as a single entry.',
    ],
  },

  RELIC_FOUND: {
    loreType: 'RELIC_FOUND', icon: '★',
    ruleApplied: 'Relic Found',
    ruleExplanation: 'Something ancient surfaces from the deep patterns of the Grid — a discovery that changes the strategic calculus.',
    headlines: [
      '{relic} Surfaces Near {region}',
      'A Discovery That Changes Everything',
      '{faction} Find What Everyone Was Looking For',
      '{commander} Reports a Relic — The War\'s Shape Shifts',
    ],
    bodies: [
      'The wars that came before this one left things buried in the terrain. When {faction}\'s advance team found {relic} near {region}, they reported it up the chain immediately. This is the kind of discovery that reorders everything. {rival} has been looking for it too — has been looking for it longer, arguably. {commander} ordered the site secured within the hour. This is now the most important position on the map.',

      '{relic} was thought lost in the campaign before the current one, when records were burned and the front was redrawn. {faction}\'s scouts found it in {region} under circumstances the chronicle records but doesn\'t fully explain. It was simply there, waiting where it had always been, visible only to those who were looking at exactly the right scale. The faction that holds {relic} holds something beyond territory.',

      'The discovery of {relic} near {region} was not intelligence or planning — it was the kind of accident that changes wars. {faction}\'s forward unit stumbled across it during a standard advance and had the presence of mind to stop and report before doing anything else. {commander} was on site by afternoon. {rival} heard about it by evening. The race to {region} has already begun.',

      '{commander} has studied the old records about {relic}. They knew it existed, knew it had been lost in the prior campaigns, never expected to see it. Now it is secured near {region}, the subject of every council session and every strategy meeting. The war was already important. Now it is something more than important.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FILLER 21 — The texture between battles
  // These entries make the war feel like a living world, not just a sequence
  // of engagements. They carry character, mood, rumor, and the slow accumulation
  // of history that makes the core events meaningful when they arrive.
  // ═══════════════════════════════════════════════════════════════════════════

  WAR_COUNCIL: {
    loreType: 'WAR_COUNCIL', icon: '⊓',
    ruleApplied: 'War Council',
    ruleExplanation: 'A rapid return — commanders reconvening urgently as the situation evolves faster than planned.',
    headlines: [
      'The Council Meets Again — Urgently',
      '{commander} Calls the Commanders Back Before the Week Is Out',
      'A Second Meeting: Something Has Changed',
      'Plans Revised Near {region} — The War Moves Faster Than Expected',
    ],
    bodies: [
      'Two councils in quick succession means the war is moving faster than the strategies can keep up with. {faction}\'s commanders reconvened near {region} before the first meeting\'s orders had even been fully implemented. Something had changed since yesterday. {commander} had new information. The maps were spread again. The arguments began again, differently.',

      'The war council that {faction} held near {region} was not scheduled. Unscheduled councils mean something surprised the commanders — a development no one predicted, a report from the front that contradicts the existing strategy. {rival} will be trying to find out what changed. By the time they find out, {faction} will have already adjusted again.',

      '{commander} doesn\'t call councils lightly. The reconvening near {region} means the situation has shifted enough that immediate recalibration is required. The officers who entered the meeting had one understanding of the war. The officers who left had a different one. The chronicle doesn\'t record what changed in between. That\'s by design.',

      'War councils move fast when they need to. The one {faction} held near {region} covered in an hour what previous councils have taken days to resolve. {commander} cut the usual debates short. "We don\'t have time for the usual debates," they said. No one in the room disagreed. That absence of disagreement was itself a sign of how serious the situation had become.',
    ],
  },

  CARTOGRAPHY: {
    loreType: 'CARTOGRAPHY', icon: '⊞',
    ruleApplied: 'Cartography',
    ruleExplanation: 'The war\'s mapmakers are at work — knowledge of the terrain is as much a weapon as any blade.',
    headlines: [
      'The Mapmakers Survey {region} — The Charts Are Being Redrawn',
      '{faction}\'s Cartographers Work Through {region}',
      'New Maps: The War Looks Different on Paper Now',
      '{commander} Studies the Updated Charts',
    ],
    bodies: [
      'Maps are how wars are understood and misunderstood in equal measure. {faction}\'s cartographers have been working through {region} for days — cataloguing every shift in the front, every contested boundary, every position that has changed hands since the last survey. The updated charts reach {commander} by morning. The war will look different on paper than it did yesterday.',

      'The Mapmakers operate in the spaces between battles. While {faction} and {rival} fight over {region}, a separate team of scholars and surveyors is measuring the aftermath — recording what was gained, what was lost, and what the resulting geometry means for the next phase. Their work is unglamorous and indispensable. Commanders who ignore their maps lose.',

      '{commander} has a standing order: maps to be updated after every major engagement, and after every significant period of quiet. The surveyors who completed their work in {region} delivered three revised charts and corrections to two existing ones. One correction involved a significant error in how {rival}\'s eastern position had been recorded. {commander} studied that correction for a long time.',

      'Cartography is an act of power in this war. The faction that best understands the shape of the contested ground holds an advantage that numbers alone cannot overcome. {faction}\'s mapmakers near {region} are careful, thorough, and consistently accurate. Their latest survey has identified something about the terrain that may change the approach to the next campaign entirely.',
    ],
  },

  OLD_GHOST: {
    loreType: 'OLD_GHOST', icon: '◁',
    ruleApplied: 'Old Ghost',
    ruleExplanation: 'An ancient name resurfaces — history folds back into the present as the oldest forces speak.',
    headlines: [
      'An Old Ghost Returns — Ancient Names Spoken Again',
      'The Stories They Tell About {region} — And Who Told Them First',
      '{commander} Invokes the Old Wars',
      'History Comes Back: What Came Before This War',
    ],
    bodies: [
      'Every piece of ground in this war has a history older than the current conflict. {region} was a battlefield before the current factions formed — the oldest chronicles mention it in connection with wars that have no surviving victors and no clear resolution. When {faction}\'s ancient elements gathered near {region} tonight, they told those stories. The younger fighters listened with the attention that comes from finally understanding they are not the first.',

      '{commander} keeps a copy of the oldest chronicle entries that mention {region}. Not for strategy — strategy changes. But for orientation. They are fighting over ground that has been fought over before, in ways that rhyme with what\'s happening now without exactly repeating. The ghost of the prior war is not a metaphor. It is a pattern. And patterns, {commander} has always believed, are the closest thing to prophecy.',

      'The oldest forces in this war remember things the chronicle hasn\'t fully recorded. When they began telling stories near {region} — not battle reports, but actual stories, the kind passed down rather than written down — the younger commanders listened and understood, for the first time, that they were not inventing this war. They were continuing it. {relic} features in most of the old stories. It always has.',

      'The legend of {region} predates the current conflict by at least two prior chronicles. {faction}\'s scholars have studied the old records — partial, damaged, inconsistent as they are — and assembled a picture of ground that has been disputed for longer than anyone now fighting has been alive. {commander} says knowing the legend doesn\'t change the tactics. But they keep the old chronicle open on their desk.',
    ],
  },

  THE_DESERTER: {
    loreType: 'THE_DESERTER', icon: '○',
    ruleApplied: 'The Deserter',
    ruleExplanation: 'A force that was active goes quiet — someone who was part of the war has left it.',
    headlines: [
      'A Known Force Goes Silent — The Chronicler Notes the Absence',
      '{faction} Reports a Missing Unit',
      'They Were Here. Now They\'re Not.',
      'An Unexplained Withdrawal from {region}',
    ],
    bodies: [
      'The chronicler notes absences as carefully as presences. A force that was documented near {region} has not appeared in the recent record. {faction}\'s scouts report the position empty — markings intact, equipment seemingly organized, but no personnel, no indication of where they went or why. The chronicle marks the gap. The war continues without explanation.',

      'Desertion is a word {commander} uses with care. "We don\'t know why they left," they said when the absence near {region} was confirmed. "Until we know, we call it a withdrawal." The distinction matters — a withdrawal is tactical, a desertion is something else. The record will note the distinction once the reasons are known, if they become known. For now: an absence where a presence was.',

      '{faction} lost contact with a unit near {region}. The last report was unremarkable — active, positioned, no indication of difficulty. Then nothing. {commander} sent scouts. The scouts found the marks of a deliberate, organized departure. Someone left and did not say where they were going. The war has a new unknown. It was once a known.',

      'Wars have attrition that doesn\'t appear in the battle reports. Forces that simply stop being present — no recorded defeat, no announced withdrawal, just a gap where something used to be. {faction}\'s noted absence near {region} is now in the secondary record: the chronicle of things that were and are no longer. The war has plenty of those entries. It is adding another.',
    ],
  },

  TALLY: {
    loreType: 'TALLY', icon: '≡',
    ruleApplied: 'Tally',
    ruleExplanation: 'Every 10th event — the chronicler counts the war\'s accumulated cost and reads it aloud.',
    headlines: [
      'The Chronicler Counts — Ten More into the Record',
      'The War\'s Tally Grows: What the Numbers Say',
      '{commander} Attends the Reading Near {region}',
      'Ten Entries: The Shape of Things',
    ],
    bodies: [
      'The chronicler counts. Every ten engagements, the tally is read near {region}: territory held and lost, sacrifices made, forces identified and forces gone quiet. The current count shows {faction} active, {rival} responsive, the war in a phase of incremental contest with escalating cost on both sides. The next ten entries will either confirm this picture or complicate it.',

      'Numbers tell a different story than narratives. The ten-mark count today — reading back through the last entries — shows a war more dynamic than it feels from the front. {faction} has appeared in seven of the last ten. {rival} in six. The overlap is where the actual fighting lives. The chronicler reads this without comment. The commanders draw their own conclusions.',

      '{commander} attends every counting. "Read it in sequence," they always say. "Don\'t summarize. Read each entry." The hall near {region} fills for these sessions. When the full sequence is read without interruption, a pattern emerges that isolated entries don\'t show. {commander} takes notes. They do not share the notes.',

      'Ten more into the record. A reader who looks at this sequence will notice: the war is moving faster than it was at the beginning. Engagements are closer together. Sacrifices are larger. The forces are more committed to outcomes. The ten-mark count captures a conflict that is past its early phase and moving into something that will require a new kind of accounting.',
    ],
  },

  RETURNED_GHOST: {
    loreType: 'RETURNED_GHOST', icon: '●',
    ruleApplied: 'Returned Ghost',
    ruleExplanation: 'A force returns after a very long absence — carrying news from wherever they were.',
    headlines: [
      'A Lost Force Returns — from Somewhere the Chronicle Didn\'t Follow',
      '{faction} Hears from a Long-Silent Unit',
      'The Ghost Signal Resolves: They\'re Back',
      '{commander} Receives Word from the Long Absent',
    ],
    bodies: [
      'They\'ve been gone long enough that the chronicle had written them into the secondary record of absences. The force that reappeared near {region} was last documented so long ago that {commander} had stopped expecting them. They\'re back. They haven\'t explained where they were. They have, however, come back clearly changed — more certain in their movements, more deliberate in their positioning.',

      '{commander} received the signal before dawn and made a point of not showing surprise at the morning briefing. A force that had been absent from the front for a long stretch had reestablished contact near {region} and given their faction\'s name and asked for current front positions. {commander} answered the second question without hesitation. They\'re holding the first question for a longer conversation.',

      'The war doesn\'t stop when forces disappear. Strategies adjust, front lines shift, the chronicle keeps accumulating. But forces that were part of the pattern leave shaped absences when they go — gaps that change how other forces must position themselves. The reappearance near {region} fills one such gap. The gap was large enough that simply filling it rearranges things significantly.',

      'Ghost signals are what the communications corps calls contact from units that have been out of reach long enough to be presumed lost or gone. Today\'s signal, received near {region}, was exactly that: a transmission from a force the chronicle had stopped tracking. They are operational. They have been operational somewhere the record doesn\'t have. {commander} is asking where. Quietly.',
    ],
  },

  DEBT_PAID: {
    loreType: 'DEBT_PAID', icon: '⊖',
    ruleApplied: 'Debt Paid',
    ruleExplanation: 'A veteran makes the sacrifice again — the cumulative debt of war becomes visible in those who bear it.',
    headlines: [
      'The Debt Grows — A Second Sacrifice Recorded',
      '{commander} Has Given More Than Most and Gives Again',
      'What the War Costs: The Long Record',
      'A Second Offering — The Chronicle Notes the Pattern',
    ],
    bodies: [
      'There is a ledger within the ledger — the chronicle of those who have given more than once. The warrior who made an offering near {region} today has a prior entry in that ledger. They gave then. They give again now. The receiving fighter is stronger. The giver is not diminished, but the giving has left a mark that isn\'t always visible. {commander} tracks these accumulating totals carefully.',

      'The debt of war is not a metaphor in {faction}\'s tradition — it is a real accounting. The warrior who made their second sacrifice near {region} has a longer entry in that account than most. {faction} honors the twice-given with a distinction that doesn\'t translate neatly into peacetime language, because peacetime has no context for what it means to give twice in the same conflict.',

      '{commander} has said publicly that the war cannot be sustained without sacrifice, and that sacrifice must be chosen, never compelled. The warrior near {region} chose it voluntarily the first time. They chose it again voluntarily now. The unit that received the transfer will carry that knowledge into every subsequent engagement. It will change how they fight in ways they may not notice until someone points it out.',

      'The Oath Stone receives this warrior\'s name again, beside the first inscription. The chronicler records it in the secondary tally — the one reserved for those who have given more than once. It is the shortest list in the Chronicle and the heaviest to read. {commander} reads it before every major decision. It is, they have said, the best measure of what the war actually costs.',
    ],
  },

  CAMPFIRE_TALE: {
    loreType: 'CAMPFIRE_TALE', icon: '≈',
    ruleApplied: 'Campfire Tale',
    ruleExplanation: 'A newcomer talks at the edge of camp — the war seen fresh, through eyes that don\'t yet know what they\'re looking at.',
    headlines: [
      'What the Newcomers Say About the War',
      'Overheard Near {region}: A Fresh Perspective',
      'Stories at the Edge of the Conflict',
      '{faction} Listens to a Newcomer\'s Account',
    ],
    bodies: [
      'The newcomers to this war always arrive with the same version of it — the one they heard from a distance, before they were close enough to see clearly. Overheard near {region} tonight, a new arrival was telling someone what they knew: {faction} is winning (not exactly), {rival} is desperate (also not exactly), and the whole thing will resolve by next season (it won\'t). The veterans in the corner didn\'t correct them. They\'ve stopped correcting newcomers.',

      'Every outpost in this war has a gathering place where soldiers talk, and the talk near {region} tonight included a newcomer\'s full account of everything they believed to be true about the conflict. Some of it was accurate. Some was a version of accurate that distance makes of everything. The veterans who listened took notes. There is sometimes something useful in the uncorrupted view.',

      '{commander} always reads the newcomer reports first, before the veteran assessments. Not because they\'re more accurate — they almost never are. But because fresh eyes notice things that experience has learned to overlook. The newcomer who arrived near {region} tonight had a question that no one on the front had thought to ask. By morning, {commander} will have tried to answer it.',

      'The war generates stories faster than it generates victories. The newcomers near {region} tonight had brought versions of events from other fronts — accounts of {rival}\'s movements, rumors about a new faction forming somewhere, a story about {relic} that doesn\'t match any chronicle entry. The chronicler writes it all down. Myth and fact travel together. Separating them is future work.',
    ],
  },

  THE_LONG_DARK: {
    loreType: 'THE_LONG_DARK', icon: '░',
    ruleApplied: 'The Long Dark',
    ruleExplanation: 'A very long silence — the war went underground and the chronicle went blank.',
    headlines: [
      'After the Long Dark, the War Returns',
      'The Quiet Was Deeper Than Anyone Expected',
      '{faction} Reappear After the Great Pause',
      'What Happened During the Silence Near {region}',
    ],
    bodies: [
      'The silence lasted long enough that some began wondering if the war was over. It was not over. The front near {region} simply went underground — no documented engagements, no recorded movements, no signals for the chronicle to capture. When things resumed today, it was immediately clear that the silence had not been empty. Positions had shifted. Forces had moved. Decisions had been made somewhere beyond the chronicle\'s reach.',

      'Long silences in the record are never peaceful. They are opaque. {faction}\'s return near {region} today, after a pause long enough to worry historians, came with no explanation of what happened during the interval. The commanders who were present during the silence are not talking. The chronicle records: a long gap, then this. What stands between those two entries is not yet known.',

      '{commander} was asked about the silence at the first post-resumption briefing. "The war doesn\'t stop because you stop recording it," they said. Which was not an answer, but was also not nothing. {faction}\'s return to {region} after the long dark shows a force that used the quiet purposefully. They look organized. They look prepared. They look like they knew the silence was coming and planned for what would follow it.',

      'The great pause near {region} is what the chronicler is calling it — a stretch when the front went quiet, the record went blank, and everyone waited for whatever came next. {faction} broke the silence first, not with a major engagement but with a careful, deliberate move that suggests the silence was preparation, not rest. The war that resumes today is not the same war that paused. Something changed in the dark.',
    ],
  },

  EDGE_SCOUTS: {
    loreType: 'EDGE_SCOUTS', icon: '←',
    ruleApplied: 'Edge Scouts',
    ruleExplanation: 'News from the far margin — scouts return with word of what\'s happening beyond the main front.',
    headlines: [
      'The Scouts Return from {region} with Troubling News',
      'Word from the Far Edge — It\'s Not What Anyone Expected',
      '{commander} Receives the Scout\'s Report in Private',
      'What\'s Happening Beyond the Main Front: A Scout\'s Account',
    ],
    bodies: [
      '{faction}\'s scouts have been ranging far beyond {region} for weeks. The ones who returned today brought back reports that have been circulating through the command structure since mid-afternoon: {rival} has been active in places the main chronicle hasn\'t recorded, the far forces are moving in patterns that suggest coordination, and something is happening near the unmapped border that doesn\'t match any known faction\'s typical approach. {commander} has scheduled a response for tomorrow\'s briefing. Tonight they are thinking.',

      'Scout reports are the war\'s peripheral vision — they tell commanders what\'s happening in the spaces between documented engagements, the movements too small or too distant to make the main chronicle, but too significant to ignore. Today\'s report from the far edge of {region} contained three material updates and one item that {commander} has marked as requiring immediate attention. The urgent item is not being discussed publicly.',

      'The scouts that returned near {region} had been gone long enough to accumulate real intelligence. Their account covered territory the main chronicle hasn\'t reached — forces and movements in the outer zones that suggest the war is larger than its recorded form. {faction} has been fighting what the scouts are calling "the visible war." The scouts have been tracking the other one.',

      '{commander} read the scout report without expression, then read it again, then a third time. The movement near the edge of {region} that the scouts documented doesn\'t correspond to anything in the current strategic plan. Either someone is operating at the margin without orders, or someone has orders that weren\'t shared with {commander}. Both possibilities are interesting in different ways.',
    ],
  },

  SHIFTED_PLAN: {
    loreType: 'SHIFTED_PLAN', icon: '↺',
    ruleApplied: 'Shifted Plan',
    ruleExplanation: 'A veteran changes their approach — the war teaches and those who listen change.',
    headlines: [
      '{faction} Revises the Plan — The Chronicles Are Updated',
      '{commander} Changes Course',
      'What We Thought We Knew About {faction}',
      'A Familiar Force Doing Something New',
    ],
    bodies: [
      'The chronicle is a living record. When forces that have established patterns break those patterns, the chronicler notes it — not as inconsistency, but as adaptation. {faction}\'s move near {region} today differs from the previous several entries. {commander} ordered the change. The reasons have not been given publicly. They will be apparent in retrospect.',

      '{commander} has revised the approach to {region}. The previous method — documented across more than a dozen chronicle entries — has been set aside. The new approach differs in ways that suggest not just tactical adjustment but a fundamental reassessment of what {faction} is trying to achieve. The old entries remain in the record. The new direction begins today.',

      'Wars teach. Forces that don\'t learn from their own record stop appearing in it. {faction}\'s revision near {region} is evidence of an organization that reads its own chronicle and adjusts when the evidence requires adjustment. {rival} adapts too, but more slowly. The difference in adaptation speed is one of the places where campaigns are decided.',

      'The revision {faction} implemented near {region} was clearly correct — the chronicler sees it looking back at the prior entries. The old approach was running out of room. The new one opens possibilities that the old one had closed. {commander} saw it before the situation made it obvious. That gap, between seeing and being forced to see, is what separates the kind of commander {commander} is from the kind that {rival} has.',
    ],
  },

  VIGIL: {
    loreType: 'VIGIL', icon: '⊙',
    ruleApplied: 'Vigil',
    ruleExplanation: 'The war is close to a turning point — every move carries the weight of the approaching shift.',
    headlines: [
      'The War Approaches a Turning — The Vigil Begins',
      '{faction} Holds Position as the Age Nears Its Edge',
      'Everything Is About to Change',
      'The Threshold Is Within Reach',
    ],
    bodies: [
      'The chronicler knows the threshold is near. The count presses toward it — a few more entries, and the war enters a new phase that will require new language and new categories. {faction} near {region} has been preparing for this. {rival} has been preparing for this. The preparation looks like stillness from the outside, but stillness that is coiled.',

      'Before a new age of this war begins, there is always a vigil — not organized, not announced, just the armies settling into watchfulness, movement slowing, decisions being weighed more carefully than usual. The vigil near {region} has been ongoing. {commander} has issued no major orders. They are waiting to see what the turning brings before committing to a direction.',

      '{commander} said at the council: "We are very close to something different. Full readiness." No one asked what "something different" meant. They could feel it in the accumulated record — the events pressing toward a threshold the chronicle itself recognizes as significant. The vigil near {region} is {faction}\'s acknowledgment of that feeling. They are not the only ones keeping watch.',

      'Two more entries. Maybe three. Then the age turns and the war becomes something it has not been before — a new chapter that will be named later, understood later, but felt right now in the particular weight that has settled over {region}. {faction} is holding position. {rival} is holding position. The vigil is mutual, though neither side knows the other is observing it.',
    ],
  },

  NEUTRAL_GROUND: {
    loreType: 'NEUTRAL_GROUND', icon: '□',
    ruleApplied: 'Neutral Ground',
    ruleExplanation: 'Parties not yet committed to either side — the world outside the main conflict, watching and waiting.',
    headlines: [
      'A Quiet Accord Near {region} — Outside the Main War',
      'The Neutral Parties Make Their Own Arrangements',
      'What\'s Happening in the Villages While the War Continues',
      'Someone Has Not Yet Chosen a Side',
    ],
    bodies: [
      'Not everyone in the territory of this war has chosen a side. The communities near {region} have been navigating the conflict by other means — trading access for protection, maintaining useful relationships with every faction, avoiding absorption by any of them. The accord reached near {region} today is the latest such arrangement. {faction} agreed to it. So did {rival}, though neither knows the other has.',

      'The chronicle focuses on the factions, but the war is also a world. Near {region}, the non-combatants have been doing what non-combatants always do: surviving, adapting, and making pragmatic agreements with whoever is passing through. The accord recorded today is between parties the chronicle doesn\'t usually name — those who have chosen neither {faction} nor {rival} but still have to live between them.',

      '{commander} was briefed on the neutral arrangement near {region}. Their reaction was characteristic: "Note it. Don\'t disturb it." Neutral arrangements in contested territory keep information moving and passage routes open. They benefit everyone. {faction} has a policy of respecting them. It\'s good strategy, and it\'s also, {commander} has said, simply decent.',

      'Wars are largest at their center and almost invisible at their edges. Near {region}, at the very edge, the conflict looks different — people making arrangements that don\'t align neatly with either side, motivated by practical necessity rather than ideology. The chronicle records these because everything that shapes the war\'s world belongs in the record. The neutral ground is part of the map.',
    ],
  },

  GHOST_MARK: {
    loreType: 'GHOST_MARK', icon: '.',
    ruleApplied: 'Ghost Mark',
    ruleExplanation: 'The smallest possible trace — a presence barely registered, but recorded by the chronicle that misses nothing.',
    headlines: [
      'A Ghost Mark — Barely There, But There',
      'The Minimum: Someone Was Here at {region}',
      'One Mark. The Chronicle Has It.',
      '{faction} Note the Quietest Possible Statement',
    ],
    bodies: [
      'The chronicler records everything. Including this: the smallest possible mark left near {region} — deliberate, placed, visible only to those looking at the right scale. Whether it was a scout marking a position, a messenger leaving a signal, or simply a fighter who needed to leave some evidence of passing — the mark is in the record. The Chronicle does not have a minimum threshold for what matters. Everything matters.',

      'Not every act of war is large. The ghost mark near {region} is the minimum — one tiny change in the contested ground, one mark that says only: I was here. It elaborates no further. {faction}\'s surveyors noted it. {rival}\'s scouts may have missed it. The chronicle does not distinguish by scale when determining what to record. This is now in the record.',

      '{commander} has a private collection of ghost marks from the entire history of this war — the smallest documented moves, the minimum-scale statements that almost didn\'t make it into the record at all. Not for strategy. For philosophy. A mark that says only "I existed here at this moment" is a different kind of statement than a battle. The one near {region} goes in the collection.',

      'The chronicler\'s job is to notice. The ghost mark near {region} — left by someone who barely touched the contested ground before moving on — is the kind of thing that gets lost in the noise of larger events. That\'s probably why it was left: a message in the minimum, readable only to those paying attention at the right resolution. The chronicle is always paying attention.',
    ],
  },

  MESSENGER: {
    loreType: 'MESSENGER', icon: '»',
    ruleApplied: 'Messenger',
    ruleExplanation: 'An emissary arrives — word from another part of the conflict, carried by someone new to the front.',
    headlines: [
      'A Messenger Arrives at {region} — Word from Beyond',
      'An Emissary Brings News of Other Fronts',
      '{commander} Receives a Messenger',
      'The War Is Larger: A Messenger Reports',
    ],
    bodies: [
      'Messengers carry news from places the main chronicle doesn\'t reach. The one who arrived near {region} today came from a front that the current record hasn\'t covered — a part of the war developing in parallel, with its own timeline and its own stakes. {commander} spent the afternoon in the receiving room. What the messenger said is not yet in the record. What {commander} decided afterward is beginning to be.',

      'The protocol for receiving messengers is old and precise. {faction} follows it exactly — partly tradition, partly because messengers who are not properly received stop coming, and stopping the flow of information from other parts of the war is a strategic error. The messenger near {region} was received correctly. What they brought has changed something. The chronicle will reflect this in the coming entries.',

      '{commander} had been expecting word. When it finally arrived near {region}, those present noted that {commander} didn\'t look surprised — which was itself informative. The meeting lasted several hours. Afterward, two orders were issued: one moving a unit, one changing a communication protocol. The connection between those orders and the messenger\'s report is not explained. It will be clear in time.',

      'The messenger who came to {region} carried a sealed account from another part of the war — the part that {faction} knows about but rarely discusses in open councils. {commander} opened it privately. The chronicle records that the meeting happened, that the messenger was given safe passage out, and that several things changed in the hours that followed. The contents of the sealed account are not in this record.',
    ],
  },

  THE_LONG_COUNT: {
    loreType: 'THE_LONG_COUNT', icon: '∞',
    ruleApplied: 'The Long Count',
    ruleExplanation: 'Every 40th event — the war measures itself against the Grid\'s fundamental architecture: 40×40.',
    headlines: [
      'The War Counts Forty — The Grid Marks the Moment',
      '{faction} Acknowledge the Long Count at {region}',
      'Forty Entries: The Chronicle Measures the War',
      'The Grid\'s Architecture, Honored',
    ],
    bodies: [
      'The Grid that the war is fought over is forty positions wide and forty deep. Every fortieth engagement, the war is measured against that architecture — how much of the forty-by-forty has been touched, how much is still contested, how much has settled into something resembling a permanent state. The current answer: more than at the beginning. Less than at the end. {commander}\'s position near {region} was the fortieth mark. It will be remembered as such.',

      '{commander} has always held the long count as meaningful. "The Grid isn\'t just terrain," they say. "It\'s a measure." Today was the fortieth entry. The briefings were shorter than usual. The count was read. Everyone sat with it for a moment — the accumulated weight of forty engagements, forty marks on the map, forty moments that the war chose to make real.',

      'The long count tradition predates this conflict. Every fortieth entry, the full tally of all prior engagements is read in sequence, and the shape of the war is laid against the shape of the Grid. Near {region}, where the fortieth mark fell today, {faction}\'s commanders gathered for the reading. The war is larger than at the twentieth mark. Smaller than it will be at the eightieth.',

      'Forty is not an arbitrary number in this war. The Grid is forty by forty. Every mark made on it — every battle, every raid, every sacrifice — takes place within that architecture. When the chronicle reaches forty entries, it measures what has happened against that foundation. {faction} made the fortieth mark near {region}. The long count is recorded. The war continues.',
    ],
  },

  BETWEEN_FIRES: {
    loreType: 'BETWEEN_FIRES', icon: '·—·',
    ruleApplied: 'Between Fires',
    ruleExplanation: 'A brief rest after a cluster of fighting — the camp at night, the ordinary life of a war.',
    headlines: [
      'Between Battles — Camp Life Near {region}',
      'The Brief Rest Before the Next Push',
      'What Happens in the Lull',
      'The Camp at {region}: An Interlude',
    ],
    bodies: [
      'After a cluster of engagements, the forces near {region} settled into something between peace and war — the interlude that happens when both sides have spent enough to pause but not enough to stop. {faction}\'s camp filled with the ordinary sounds of soldiers resting: repairs, arguments, letters written, the particular kind of silence that belongs to fighters who know another battle is coming and don\'t talk about it.',

      '{commander} uses these interludes for the kind of thinking that battle doesn\'t permit. The camp was quiet. The front was quiet. For a few days, nothing was added to the main record. This entry is the chronicle\'s acknowledgment of the quiet — not empty, but unrecorded in the usual way. The armies are recovering. The war is preparing for its next round.',

      'The interlude near {region} lasted long enough for the soldiers to remember they were people before they were fighters. Letters went home. Equipment was repaired properly rather than just held together by urgency. {faction}\'s healers moved through the camp and did the work that battles prevent. {rival}, across the quiet line, was probably doing the same. Both sides needed the rest. Both sides know it won\'t last.',

      'Between battles, the war has a texture that the chronicle rarely captures. Near {region}, in the pause after the recent cluster of engagements, {faction}\'s camp settled into routines: morning briefings that took half the usual time, afternoons given over to maintenance and minor decisions, evenings that were quieter than the fighters expected them to be. {commander} walked the perimeter alone each night. Nobody interrupted them.',
    ],
  },

  DYNASTY: {
    loreType: 'DYNASTY', icon: '⋮',
    ruleApplied: 'Dynasty',
    ruleExplanation: 'A lineage is recognized — a force that has appeared again and again earns a name in the chronicle.',
    headlines: [
      'A Dynasty Named — {faction} Earns the Lineage Mark',
      '{commander}\'s Legacy in the Chronicle',
      'Three Times and Counting — A Lineage Recognized',
      'The Chronicle Notes a Pattern That Has Become a Name',
    ],
    bodies: [
      'Dynasties are not declared. They are recognized. {faction}\'s consistent presence in the chronicle — three distinct appearances, each building on the last, a pattern sustained across the changing landscape of the war — has earned the designation. The chronicler doesn\'t use "dynasty" lightly. It requires demonstrated sustained purpose over time, not just survival. {commander} has provided it. The lineage mark is added near {region}.',

      'Some forces flash through the war\'s record. Some burn constant. {faction} is the second kind — appearing again and again, each appearance carrying forward what the previous one established. The lineage note added near {region} today reflects a record long enough and consistent enough to be recognized as intentional. Other forces have come and gone in the time {commander}\'s record has been accumulating.',

      '{commander} was told that the chronicle had designated {faction}\'s record as a dynasty. They didn\'t react with pleasure or discomfort. "Keep fighting," was the response — that of someone who intends to keep adding to the lineage rather than be commemorated by it. The designation stands regardless. The record is real whether or not those who made it acknowledge it.',

      'Three appearances become a pattern. A pattern sustained over the chronicle\'s growing record becomes a lineage. {faction}\'s presence near {region} is the latest entry in a record the chronicler now treats as continuous and purposeful — a thread that runs through the war from its earlier pages to the current one. Other entries surround it. This thread runs through all of them.',
    ],
  },

  CROSSING: {
    loreType: 'CROSSING', icon: '⇒',
    ruleApplied: 'Crossing',
    ruleExplanation: 'Forces move into unfamiliar territory — the war\'s geography expands as boundaries are crossed.',
    headlines: [
      '{faction} Cross into Unknown Ground — The Map Expands',
      'The War Moves Beyond Its Previous Edges',
      '{commander} Orders the Crossing of {region}',
      'Known Forces in Unfamiliar Territory',
    ],
    bodies: [
      'The war doesn\'t stay where it\'s been put. {faction}\'s movement through {region} today took them beyond their established territory — across a boundary that prior entries had treated as their edge. The crossing changes the map. It also changes what {rival} has to defend. Territory that was behind the front is now on it.',

      '{commander} ordered the crossing without public announcement. {faction}\'s advance into territory beyond their usual range near {region} was noted by the chronicler and apparently not anticipated by {rival}. The geometry has changed. The edges have moved. Forces that considered themselves behind the lines must now reconsider what the lines are.',

      'When armies cross boundaries they haven\'t crossed before, the war becomes a different shape. {faction}\'s crossing near {region} is the latest expansion of the conflict\'s territory — another zone that was theoretical is now real. {rival} has been tracking {faction}\'s peripheral movements. Today those peripheries became the center. The maps are being redrawn.',

      'The crossing near {region} was not announced. It was simply done. {faction} moved through territory that everyone had implicitly agreed not to contest, and by doing so changed what everyone had agreed to. {commander} filed no declaration, sent no advance notice. The crossing was itself the declaration. The chronicle records it as the boundary it is: before, and after.',
    ],
  },

  SUPPLY_ROAD: {
    loreType: 'SUPPLY_ROAD', icon: '⊡',
    ruleApplied: 'Supply Road',
    ruleExplanation: 'The war\'s logistics — armies run on more than conviction, and whoever controls the roads controls the campaign.',
    headlines: [
      '{faction} Secure the Road Through {region}',
      'The Supply Lines Hold — For Now',
      '{commander} Prioritizes the Road Over the Battle',
      'Trade Follows War: The Route Through {region} Opens',
    ],
    bodies: [
      'Armies run on more than conviction. {faction}\'s stabilization of the supply route near {region} is unglamorous but essential — the kind of move that doesn\'t produce dramatic chronicle entries but determines whether the dramatic ones are possible. The road is open. Supplies are moving. The war continues to be funded. {rival}\'s attempts to interdict the route have, so far, failed.',

      '{commander} keeps a separate map that shows only supply lines. "Win the logistics," they say, "and everything else follows." The road secured near {region} represents a kind of victory that doesn\'t appear in battle tallies but shows up in the length of campaigns and the condition of the fighters at the end of them. {faction} can sustain. {rival} is beginning to calculate how long they can.',

      'The territory around {region} has value beyond its position on the front. The route that passes through it connects {faction}\'s forward positions to their support base. Controlling it means {rival} cannot easily cut the supply flow. {commander} assigned units specifically to the road. The assignment is a statement: this route matters as much as the front it serves.',

      'Wars are supply problems wearing tactical clothing. The movement near {region} today — {faction} securing the passage that connects their positions to their rear — is the entry that historians will overlook and quartermasters will remember. The road is held. The flow continues. The campaign can continue. Everything that comes next depends on this, and this has been decided.',
    ],
  },

  NIGHT_WATCH: {
    loreType: 'NIGHT_WATCH', icon: '◌',
    ruleApplied: 'Night Watch',
    ruleExplanation: 'The sentinels on duty — the unglamorous, indispensable work that makes everything else possible.',
    headlines: [
      'The Watch Fires Burn Near {region} — The Night Passes Quietly',
      '{faction} Holds the Line Through the Night',
      'The Sentinels at {region}: Nothing Happened, Which Is the Point',
      'A Night Watch Entry — The War\'s Patient Foundation',
    ],
    bodies: [
      'The watch fires near {region} burned through the night without incident — which is exactly what watch fires are supposed to do. {faction}\'s sentinels held their positions, tracked movement on the other side of the line, and reported nothing unusual. In a war full of unusual events, the unremarkable night watches are the frame that makes everything else possible. The chronicler notes them because the chronicle notes everything.',

      '{commander} calls the night watch entries "the patient record." These are the nights when nothing happened because someone was paying attention. {faction}\'s sentinels near {region} maintained position, kept the fires burning, tracked the terrain and the movements on the far side. {rival} didn\'t move. Neither did {faction}. The war waited. It is still waiting.',

      'The watch fires are the war\'s oldest institution. Near {region}, where {faction}\'s sentinels have been keeping vigil across the campaign, the fires burn at intervals that signal to other positions: occupied, aware, ready. {rival}\'s scouts have been counting the fires. They know what the count means. So does {commander}. The fires confirm a presence neither side needs to announce.',

      'Everything in the chronicle connects to everything else. The night watch entry for {region} — unremarkable, the sentinels awake and the line quiet — is the connective tissue between the battle entries that surround it. Without the watches, no one holds anything. Without those who hold the line at night, there is no line in the morning. The chronicle records them because the war requires them and requires that requirement to be acknowledged.',
    ],
  },

}

// ─────────────────────────────────────────────────────────────────────────────
// RULE SELECTION ENGINE
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
): string {
  const tokenId = Number(event.tokenId)
  const count = Number(event.count)
  const priorSameOwner = allEvents.slice(0, index).filter(e => e.owner === event.owner)
  const isVeteran = priorSameOwner.length > 0
  const seed = seedN(event.tokenId, event.blockNumber)

  // TIER 1: Structural milestones — highest priority, define the story's skeleton
  if (cumCount > 0 && cumCount % 40 === 0) return 'THE_LONG_COUNT'
  if (cumCount > 0 && cumCount % 25 === 0) return 'TURNING_POINT'
  if (cumCount > 0 && cumCount % 10 === 0) return 'TALLY'
  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'NEW_AGE'
  const nextEra = ERAS.find(e => e.threshold > cumCount)
  if (nextEra && nextEra.threshold - cumCount <= 3) return 'VIGIL'

  // TIER 2: Rare chain patterns — special narrative moments
  if (isRareTxHash(event.transactionHash)) return 'RELIC_FOUND'
  if (prev && prev.blockNumber === event.blockNumber) return 'CONVERGENCE'

  // TIER 3: Time gaps — the war's silences and rhythms
  if (prev && event.blockNumber - prev.blockNumber > 50000n) return 'THE_LONG_DARK'
  if (prev && event.blockNumber - prev.blockNumber > 10000n) return 'THE_SILENCE'
  if (prev && event.blockNumber - prev.blockNumber > 3000n && event.blockNumber - prev.blockNumber < 6000n) {
    if (seed % 3 === 0) return 'BETWEEN_FIRES'
  }

  // TIER 4: Veteran return patterns — the war's recurring characters
  if (isVeteran) {
    const last = priorSameOwner[priorSameOwner.length - 1]
    const gap = event.blockNumber - last.blockNumber
    if (gap > 20000n) return 'RETURNED_GHOST'
    if (gap < 500n) return 'WAR_COUNCIL'
  }

  // TIER 5: Token range lore — geographic and historical identity
  if (tokenId < 500 && index > 10) return 'OLD_GHOST'
  if (tokenId < 1000) return 'ANCIENT_WAKES'
  if (tokenId >= 1000 && tokenId < 2000 && !isVeteran) return 'MESSENGER'
  if (tokenId >= 2000 && tokenId < 3000) {
    return seed % 3 === 0 ? 'CARTOGRAPHY' : 'SUPPLY_ROAD'
  }
  if (tokenId >= 5000 && tokenId <= 6000) return 'HOLLOW_GROUND'
  if (tokenId > 8500 && index > 5) return 'EDGE_SCOUTS'
  if (tokenId > 8000) return 'FAR_REACH'

  // TIER 6: Prime token IDs — the oracles
  if (isPrime(tokenId)) return 'THE_ORACLE'

  // TIER 7: Burns — sacrifice rules
  if (event.type === 'BurnRevealed') {
    if (count >= 10) return 'GREAT_SACRIFICE'
    if (count === 1) return 'GHOST_MARK'
    if (isVeteran && priorSameOwner.length >= 2) return 'DEBT_PAID'
    if (isVeteran) return 'BLOOD_OATH'
    return 'OFFERING'
  }

  // TIER 8: Pixel scale — the size of the battle
  if (count >= 200) return 'GREAT_BATTLE'
  if (count >= 50 && count % 50 === 0) return 'FORMAL_DECLARATION'
  if (count >= 50) return 'SKIRMISH'
  if (count === 1) return 'GHOST_MARK'

  // TIER 9: Veteran address patterns — the war's experienced actors
  if (isVeteran) {
    const roll = seedN(event.tokenId, event.blockNumber, 23) % 8
    if (roll === 0) return 'DOMINION_GROWS'
    if (roll === 1) return 'CROSSING'
    if (roll === 2 && priorSameOwner.length >= 3) return 'DYNASTY'
    if (roll === 3) return 'SHIFTED_PLAN'
    if (roll === 4) return 'THE_DESERTER'
    if (roll === 5) return 'SUPPLY_ROAD'
    return 'VETERAN_RETURNS'
  }

  // TIER 10: New arrivals — the war grows
  const newRoll = seedN(event.tokenId, event.blockNumber, 29) % 6
  if (newRoll === 0) return 'CAMPFIRE_TALE'
  if (newRoll === 1) return 'NEUTRAL_GROUND'
  if (newRoll === 2) return 'NIGHT_WATCH'
  if (newRoll === 3) return 'BORDER_RAID'
  return 'NEW_BLOOD'
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY GENERATION
// ─────────────────────────────────────────────────────────────────────────────

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
    const body     = fill(pick(rule.bodies, s2), ctx)

    const FEATURED = new Set([
      'GREAT_BATTLE', 'TURNING_POINT', 'NEW_AGE', 'RELIC_FOUND',
      'THE_LONG_COUNT', 'CONVERGENCE', 'GREAT_SACRIFICE', 'THE_LONG_DARK',
    ])

    return {
      id: `${event.transactionHash}-${event.tokenId.toString()}`,
      eventType: event.type,
      loreType: rule.loreType,
      era,
      headline,
      body,
      icon: rule.icon,
      featured: FEATURED.has(ruleKey) || event.count > 200n,
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

// ─────────────────────────────────────────────────────────────────────────────
// WORLD PRIMER ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMER_ENTRIES: StoryEntry[] = [
  {
    id: 'primer-genesis', eventType: 'genesis', loreType: 'GENESIS', era: 'The Quiet Before',
    headline: 'The Grid Exists. The War Has Not Yet Begun.',
    body: 'Ten thousand faces occupy the Grid — a contested canvas forty positions wide and forty deep. Each face is a territory. Each territory is a potential battleground. The factions that will fight over them are still forming, still deciding, still standing at the edge of commitment. The chronicler has opened the record. The ink is ready. The first mark has not yet been made. Everything that follows was made possible by this silence, and everything that follows will be made from ending it.',
    icon: '◈', featured: true,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'Genesis', ruleExplanation: 'Normies are 10,000 fully on-chain pixel faces on Ethereum mainnet. The Grid is 40×40 — 1,600 pixels per Normie, stored entirely on-chain. Every real edit and sacrifice shapes this story invisibly.' },
  },
  {
    id: 'primer-factions', eventType: 'genesis', loreType: 'GENESIS', era: 'The Quiet Before',
    headline: 'Four Lineages. One Grid. The Sides Are Forming.',
    body: 'Before the first battle, the factions identify themselves along the lines that have always divided things: those who came first and those who came after, those who move in the open and those who move in shadow, those who fight for what is written and those who fight against it. Four lineages have emerged from the ten thousand — Human, Cat, Alien, Agent — each with different methods, different philosophies, different ideas about what the Grid is for and who it belongs to. They will disagree about all of it, at length, in the record.',
    icon: '▦', featured: false,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'Genesis', ruleExplanation: 'The four Normie types — Human, Cat, Alien, Agent — are the four lineages of the Grid. Their conflict is the war.' },
  },
]

export { RULES }
