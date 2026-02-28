import type { IndexedEvent } from './eventIndexer'

export type LoreType =
  | 'GRAND_MIGRATION' | 'TERRITORIAL_CLAIM' | 'SUBTLE_INSCRIPTION'
  | 'FACTION_DECLARATION' | 'SCHOLARS_WORK' | 'WANDERERS_PASSAGE'
  | 'POWER_INFUSION' | 'ETHEREAL_INFUSION' | 'RITE_OF_RECOGNITION'
  | 'ORACLES_OBSERVATION' | 'FOUNDATION_STONE' | 'RECORD_OF_THE_DEEP'
  | 'THE_UNMAPPED' | 'PROPHECY_SPOKEN' | 'FACTION_RISE'
  | 'LULL_BETWEEN_AGES' | 'NEW_ERA_DAWN' | 'CONVERGENCE_POINT'
  | 'ARTIFACT_DISCOVERY' | 'GENESIS'
  | 'COUNCIL_CONVENES' | 'THE_CARTOGRAPHY' | 'ECHO_OF_THE_ANCIENT'
  | 'BORDER_CROSSING' | 'THE_RECKONING' | 'SIGNAL_LOST'
  | 'SIGNAL_FOUND' | 'DEBT_RECORDED' | 'THE_TRANSLATION'
  | 'SILENT_WITNESS' | 'PASSAGE_SEALED' | 'THE_FORGETTING'
  | 'RETURN_FROM_MARGIN' | 'ARCHIVE_CORRECTION' | 'THE_INTERLUDE'
  | 'LINEAGE_NOTED' | 'THRESHOLD_WATCHED' | 'THE_ACCORD'
  | 'DUST_RECORD' | 'EMISSARY_ARRIVES' | 'THE_LONG_COUNT'

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

// World-building elements — seeded deterministically per event
const REGIONS = [
  'the Glyph Wastes', 'the Monochrome Reaches', 'the Lattice Plains', 'the Obsidian Moors',
  'the Silver Threshold', 'the Hollow Deep', 'the Cipher Peaks', 'the Wandering Shore',
  'the Pale Expanse', 'the Root Network', 'the Murmur Forests', 'the Fracture Line',
  'the Dim Archives', 'the Ember Flats', 'the Vaulted Silence', 'the Mirror Shelf',
  'the Null Basin', 'the Crossroads', 'the Counting Fields', 'the Unseen Margin',
]

const FACTIONS = [
  'the Cartographers', 'the Quiet Order', 'the Lattice Keepers',
  'the Pale Wanderers', 'the Archive Monks', 'the Threshold Watch',
  'the Deep Seekers', 'the Signal Weavers', 'the Monolith Circle',
  'the Unnamed', 'the Wayfarers', 'the Root Scholars',
]

const FIGURES = [
  'Elder Varun', 'the Witness', 'Keeper Solen', 'Old Mira',
  'the Builder', 'Cartographer Neth', 'the Shadow', 'Archivist Teld',
  'the Watcher', 'Keeper of Marks',
]

const ARTIFACTS = [
  'the Codex of Days', 'the Crown of Thresholds', 'the Crooked Mirror', 'the First Compass',
  'the Cold Ink', 'the Speaking Stone', 'the Unbroken Thread', 'the Stopped Clock',
  'the Unreadable Glyph', 'the Distant Bell', 'the Counting Beads', 'the Last True Map',
]

// Eras are calibrated to ~500–600 total events (current scale of Normies activity).
// Thresholds are low so the story feels like it's just beginning — because it is.
// PVP / Arena era will add a whole new chapter when it launches.
const ERAS = [
  { threshold: 0,   name: 'The First Days' },
  { threshold: 10,  name: 'The Waking' },
  { threshold: 30,  name: 'Age of Arrivals' },
  { threshold: 75,  name: 'The Gathering' },
  { threshold: 150, name: 'Age of Marks' },
  { threshold: 300, name: 'The Deepening' },
  { threshold: 500, name: 'Age of Builders' },
  { threshold: 800, name: 'The Long Road' },
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
  return {
    region: pick(REGIONS, seedN(tokenId, blockNumber)),
    faction: pick(FACTIONS, seedN(tokenId, blockNumber, 7)),
    figure: pick(FIGURES, seedN(tokenId, blockNumber, 13)),
    artifact: pick(ARTIFACTS, seedN(tokenId, blockNumber, 19)),
    era,
  }
}

function fill(t: string, ctx: ReturnType<typeof buildCtx>): string {
  return t
    .replace(/{region}/g, ctx.region)
    .replace(/{faction}/g, ctx.faction)
    .replace(/{figure}/g, ctx.figure)
    .replace(/{artifact}/g, ctx.artifact)
    .replace(/{era}/g, ctx.era)
}

interface LoreRule {
  loreType: LoreType; icon: string; ruleApplied: string; ruleExplanation: string
  headlines: string[]; bodies: string[]
}

const RULES: Record<string, LoreRule> = {

  // ── Pixel edits — scale determines the story ──────────────────────────────

  GRAND_MIGRATION: {
    loreType: 'GRAND_MIGRATION', icon: '◈',
    ruleApplied: 'Grand Migration',
    ruleExplanation: '200+ pixels changed at once — a massive transformation of a single Normie.',
    headlines: [
      'A Big Move in {region}',
      '{faction} Make Their Largest Move Yet',
      'Everything Changes in {region}',
      'The Biggest Edit Yet — {region} Takes Notice',
    ],
    bodies: [
      'It was the largest single change anyone had seen so far. In one go, a Normie in {region} was transformed from the inside out — not a small tweak, but a full reinvention. {faction} noted it in the record and moved on. The Grid keeps going.',
      'Nobody announced it. A wallet just opened, made its changes, and closed. But the scale was hard to ignore. {faction} counted the pixels and wrote it down. In {region}, that kind of change gets remembered.',
      'When {figure} heard about it, the reaction was simple: "That\'s a lot of pixels." It was. More than most people bother with. The Normie that came out the other side looked nothing like the one that went in.',
      '{faction} have been watching {region} for a while. They weren\'t expecting this — a change so large it was basically starting over. They logged it, catalogued it, and wondered who would be next.',
    ],
  },

  TERRITORIAL_CLAIM: {
    loreType: 'TERRITORIAL_CLAIM', icon: '◉',
    ruleApplied: 'Territorial Claim',
    ruleExplanation: '50–199 pixels changed — a significant edit that leaves a real mark.',
    headlines: [
      '{faction} Leave Their Mark in {region}',
      'A Clear Statement Made in {region}',
      'This Part of {region} Belongs to Someone Now',
      'A Normie Stakes Their Ground',
    ],
    bodies: [
      'Not the biggest edit, but not small either. Someone in {region} changed enough pixels that {faction} decided it counted as a statement. It\'s in the record now. The Grid moves on.',
      'There\'s a difference between poking at something and actually committing to it. This was commitment. {faction} saw it and wrote it down. {region} looks a little different now.',
      '{figure} always said you can tell how serious someone is by how much they change at once. This one was serious. The edit landed in {region} and stayed.',
      'Fifty pixels or more — that\'s enough for {faction} to take notice. They did. The record shows a clear mark left in {region}, and whoever made it wasn\'t being tentative about it.',
    ],
  },

  SUBTLE_INSCRIPTION: {
    loreType: 'SUBTLE_INSCRIPTION', icon: '·',
    ruleApplied: 'Subtle Inscription',
    ruleExplanation: 'A small edit — fewer than 50 pixels. Careful, deliberate work.',
    headlines: [
      'A Small Change in {region}',
      'Someone Was Careful Today',
      '{faction} Note a Precise Edit',
      'A Light Touch in {region}',
    ],
    bodies: [
      'Not every change has to be dramatic. Someone in {region} made a small edit — a few pixels, placed carefully. {faction} logged it. It will outlast things ten times its size.',
      'Small changes are easy to overlook. {faction} don\'t overlook them. This one, in {region}, was deliberate — you could tell by how few pixels moved and how precisely they moved. Someone knew what they were doing.',
      '{figure} once said: "The smallest true mark matters more than the largest false one." The edit logged in {region} today was small and true. It\'s in the Archive now.',
      'Careful work. Not the flashy kind — just someone paying attention and making exactly the change they meant to make. {faction} appreciate that. It\'s in the record.',
    ],
  },

  FACTION_DECLARATION: {
    loreType: 'FACTION_DECLARATION', icon: '▣',
    ruleApplied: 'Faction Declaration',
    ruleExplanation: 'Pixel count divisible by 50 — a clean, intentional number signals a formal statement.',
    headlines: [
      '{faction} Make It Official',
      'A Round Number, A Clear Message',
      '{faction} Put Something on the Record',
      'A Statement Filed from {region}',
    ],
    bodies: [
      'When a number is that round, it usually means something. {faction} changed exactly that many pixels — not one more, not one less. That kind of precision is a statement. The Archive has it now.',
      'Fifty. A hundred. A hundred and fifty. Round numbers mean a decision was made before the edit started. Someone in {region} knew exactly what they were doing. {faction} wrote it up as a formal act.',
      '{figure} keeps a list of round-number edits. It\'s shorter than you\'d think — most people don\'t bother with that kind of intention. This one made the list.',
      'The Grid sees a lot of edits. Most of them are approximate. This one was exact. {faction} logged it from {region} as a declaration — the kind of act where someone wanted the record to know they meant it.',
    ],
  },

  // ── Burns — sacrificing one Normie to strengthen another ─────────────────

  POWER_INFUSION: {
    loreType: 'POWER_INFUSION', icon: '▲',
    ruleApplied: 'Power Infusion',
    ruleExplanation: 'A Normie was burned and transferred 10+ action points — a major sacrifice.',
    headlines: [
      'A Normie Is Burned — Another Grows Stronger',
      '{faction} Record a Major Sacrifice',
      'Ten Points or More: The Offering Is Accepted',
      'Gone but Not Lost — the Action Points Live On',
    ],
    bodies: [
      'Burning a Normie is permanent. There\'s no undoing it. Someone decided their Normie\'s action points were worth more in another\'s hands — and now they are. {faction} logged the transfer. The burned one is gone. The one that received the points is stronger.',
      'Ten action points or more moved in one transaction. That\'s not a small thing. {figure} noted it as a major offering — the kind where you feel the weight of it afterward. {faction} marked it in the record.',
      'The burned Normie had a life on the blockchain — a history, a face, a token ID. Now it\'s a number in someone else\'s total. {faction} in {region} note that this happens. It\'s part of how the Grid works.',
      'A sacrifice that size changes things. The receiving Normie now carries what the burned one gave up. {faction} track these transfers carefully. The Chronicle knows both sides of every burn.',
    ],
  },

  ETHEREAL_INFUSION: {
    loreType: 'ETHEREAL_INFUSION', icon: '△',
    ruleApplied: 'Ethereal Infusion',
    ruleExplanation: 'A Normie was burned transferring fewer than 10 action points — a smaller offering.',
    headlines: [
      'A Small Burn — Points Passed Along',
      'A Quiet Transfer in {region}',
      '{faction} Note a Minor Offering',
      'Gone, But the Points Remain',
    ],
    bodies: [
      'Not every burn is dramatic. This one moved a handful of points from one Normie to another and left things quiet. {faction} logged it. The burned one is gone. The record shows both.',
      'Small burns happen. Someone decided a few action points were better used elsewhere. {faction} in {region} wrote it up — nothing complicated, just a transfer and a permanent end.',
      'The Archive doesn\'t distinguish between big burns and small ones when it comes to finality. Gone is gone. {figure} makes sure every burn is noted, whatever the size.',
      '{faction} have seen all kinds of burns. This one was quiet — a small number of points, a clean transfer. The Normie that received them probably won\'t make a big deal of it. The one that was burned can\'t.',
    ],
  },

  RITE_OF_RECOGNITION: {
    loreType: 'RITE_OF_RECOGNITION', icon: '◎',
    ruleApplied: 'Rite of Recognition',
    ruleExplanation: 'A veteran wallet burned a Normie — someone who\'s been here before doing it again.',
    headlines: [
      'A Known Hand Burns Again',
      '{faction} Recognize a Returning Burner',
      'Not the First Time — and Not the Last',
      'A Veteran Makes the Sacrifice',
    ],
    bodies: [
      'This wallet has been here before. They\'ve done this. {faction} recognize the address and note it — a veteran making another offering. Experience and intention in one move.',
      'The first burn is the hardest. After that, people know what they\'re doing. This wallet knew. {figure} in {region} logged it as the act of someone who understands the trade-off and has made it before.',
      '{faction} keep track of repeat burners. It says something about someone when they\'ve done this more than once — not recklessness, but commitment. The record shows their history.',
      'There are people who burn once and stop. And there are people who keep going — who understand that action points matter and are willing to do what it takes. This wallet is in the second group.',
    ],
  },

  // ── Token identity — which Normie it is matters ───────────────────────────

  ORACLES_OBSERVATION: {
    loreType: 'ORACLES_OBSERVATION', icon: '◇',
    ruleApplied: "Oracle's Observation",
    ruleExplanation: 'A prime-numbered token ID — mathematically irreducible, can\'t be divided.',
    headlines: [
      'A Prime Number Acts',
      '{faction} Note the Irreducible',
      'Token #{tokenId}: The Kind That Can\'t Be Split',
      'Only Itself — A Prime Normie Moves',
    ],
    bodies: [
      'Prime numbers can\'t be divided into smaller equal parts. Neither can this Normie, in the way that matters. {faction} always note when a prime-numbered token acts. It\'s one of those things.',
      '{figure} has a soft spot for prime numbers. "They stand alone," they say. "You can\'t reduce them further." The Normie that acted today has that quality. The Archive marks it.',
      '{faction} in {region} noticed it immediately — a prime-numbered token, doing its thing. There\'s no special power in it, just the quiet fact of it. Some numbers can\'t be broken down. This is one.',
      'The Archive logs every event. But {faction} add a small mark next to the primes. Not because it changes anything — just because math is worth noticing when it shows up.',
    ],
  },

  FOUNDATION_STONE: {
    loreType: 'FOUNDATION_STONE', icon: '■',
    ruleApplied: 'Foundation Stone',
    ruleExplanation: 'Token ID under 1,000 — one of the earliest Normies, a founding-era face.',
    headlines: [
      'One of the First Ones Acts',
      'An Early Normie Makes a Move',
      '{faction} Note Activity from the Founding Range',
      'Token Under #1,000: The Old Guard',
    ],
    bodies: [
      'Low token IDs are the originals. This one has been around since the beginning — or close enough to it. {faction} always note when the early ones do something. It doesn\'t happen as often as you\'d think.',
      'When a Normie from the first thousand moves, {figure} writes it down separately. Old tokens carry a certain weight — not because they\'re better, but because they\'ve been here longer.',
      '{faction} in {region} track activity by token range. The founding range — under one thousand — is quiet most of the time. When one of them acts, people notice.',
      'The first Normies minted set the tone for everything that came after. This one, still active, still doing things — {faction} logged it. The original faces are still in the game.',
    ],
  },

  RECORD_OF_THE_DEEP: {
    loreType: 'RECORD_OF_THE_DEEP', icon: '▽',
    ruleApplied: 'Record of the Deep',
    ruleExplanation: 'Token ID over 8,000 — from the far end of the collection.',
    headlines: [
      'A Late Number Speaks Up',
      'From the Far End of the Register',
      '{faction} Hear from the High Numbers',
      'Token Over #8,000: Still Here',
    ],
    bodies: [
      'High token numbers don\'t always get as much attention. This one didn\'t care. {faction} in {region} logged the action the same as any other — a Normie in the upper range, doing its thing.',
      'The collection goes to ten thousand. The ones near the end are easy to forget about. But they\'re still here. {figure} notes that the high numbers have been quietly active. This one proves it.',
      '{faction} track the full range. Token eight thousand and up — the far end — is part of the Grid just like everything else. Today, one of them made a move. It\'s in the record.',
      'No number is better than another. {faction} make a point of that. The high numbers act when they act, and when they do, the Chronicle writes it the same as it writes any other event.',
    ],
  },

  THE_UNMAPPED: {
    loreType: 'THE_UNMAPPED', icon: '?',
    ruleApplied: 'The Unmapped',
    ruleExplanation: 'Token ID 5,000–6,000 — the middle of the collection, often overlooked.',
    headlines: [
      'The Middle Range Checks In',
      'From the Center of the Register',
      '{faction} Note an Unmapped Presence',
      'Token 5K–6K: The Quiet Middle',
    ],
    bodies: [
      'The five-thousands don\'t get talked about as much as the early numbers or the late ones. But they\'re there, doing things. {faction} logged this one from {region}. The middle of the register is still part of the story.',
      'Some parts of the collection attract more attention than others. The five-to-six thousand range isn\'t one of them — which is part of why {figure} pays special attention to it. Someone has to.',
      '{faction} in {region} call this range "the quiet middle." Not quite founding-era, not quite the deep end. Just here. Today it did something, and {faction} wrote it down.',
      'The Grid is ten thousand tokens wide. The ones in the middle five-thousands are easy to pass over. {faction} don\'t pass over anything. This one is in the record.',
    ],
  },

  // ── Structural moments — milestones the Chronicle marks ───────────────────

  PROPHECY_SPOKEN: {
    loreType: 'PROPHECY_SPOKEN', icon: '∆',
    ruleApplied: 'Prophecy Spoken',
    ruleExplanation: 'Every 25th event — a quarter-century milestone in the Chronicle.',
    headlines: [
      'The 25th Mark',
      '{faction} Count to Twenty-Five Again',
      'Every 25 Events, the Archive Pauses',
      'A Quarter-Hundred — {region} Takes Stock',
    ],
    bodies: [
      'Every twenty-five events, the Archive pauses for a moment. Not for long — just long enough to note where things stand. {faction} in {region} made a small ceremony of it. Then the Chronicle kept going.',
      '{figure} keeps a separate tally of the twenty-fifth events. "They add up," they say. "Before long, you have something." The current tally has something. It\'s growing.',
      'Milestones don\'t have to be dramatic to matter. {faction} mark every twenty-fifth entry in the Chronicle because it\'s good practice. The Grid is patient. So are the Archivists.',
      'Twenty-five. The Archive notes it. {faction} in {region} noted it. The story keeps moving, and now there\'s a marker in the road showing how far it\'s come.',
    ],
  },

  THE_RECKONING: {
    loreType: 'THE_RECKONING', icon: '≡',
    ruleApplied: 'The Reckoning',
    ruleExplanation: 'Every 10th event — the Archive counts and takes stock.',
    headlines: [
      'Every Ten, the Archive Counts',
      'A Counting Moment in {region}',
      '{faction} Tally What\'s Been Done',
      'Ten More — The Chronicle Notes It',
    ],
    bodies: [
      'The Archive counts in tens. Every tenth event, there\'s a small pause — not a ceremony, just an accounting. {faction} in {region} noted where things stood. The number is higher than it was last time.',
      '{figure} runs the tallies. "Every ten events, we know a little more about where this is going," they say. This tenth mark added to the picture. {faction} have it on file.',
      'It\'s a habit more than a rule. Every tenth entry, {faction} write a summary of what\'s been happening. Nothing fancy — just a count and a note. The Grid deserves that much attention.',
      '{faction} in {region} made their tenth-mark entry. It won\'t be the last. The Chronicle is patient, and so are the people keeping it. Ten more and they\'ll do it again.',
    ],
  },

  NEW_ERA_DAWN: {
    loreType: 'NEW_ERA_DAWN', icon: '◐',
    ruleApplied: 'New Era Dawn',
    ruleExplanation: 'The event count crossed an era threshold — the story enters a new chapter.',
    headlines: [
      'A New Chapter Begins',
      'The {era} Starts Now',
      '{faction} Mark the Shift',
      'Something Changed — The Era Turns',
    ],
    bodies: [
      'The era changed. One chapter ended, another started. {faction} in {region} marked the moment — not with fanfare, just with a note in the record. The story is in a new phase now.',
      'Era shifts happen gradually and then all at once. The Chronicle crossed the threshold, and suddenly the {era} is what\'s being written. {figure} noted the change. {faction} updated their maps.',
      'New eras don\'t announce themselves loudly. They show up in the record as a change of tone — more of something, less of something else. {faction} in {region} felt it and wrote it down.',
      '{faction} have been expecting this. The numbers were getting close to the next threshold for a while. Now the threshold is behind them. The {era} is officially underway.',
    ],
  },

  CONVERGENCE_POINT: {
    loreType: 'CONVERGENCE_POINT', icon: '⊕',
    ruleApplied: 'Convergence Point',
    ruleExplanation: 'Multiple events happened in the same Ethereum block — different wallets, same moment.',
    headlines: [
      'Two Things at Once',
      'Same Block, Different Normies',
      '{faction} Note a Rare Overlap',
      'It Happened at the Same Time',
    ],
    bodies: [
      'Two separate wallets made their moves in the same Ethereum block. They didn\'t coordinate. They didn\'t know about each other. It just happened at the same time. {faction} in {region} noted it as an overlap.',
      'Blocks on Ethereum are twelve seconds long. In this one, more than one Normie acted. No connection between them — just the coincidence of timing. {figure} finds these moments interesting. {faction} keep track.',
      'The Chronicle usually goes one event at a time. When multiple events land in the same block, {faction} mark it. It\'s rare enough to be worth noting. Not meaningful, maybe — but notable.',
      '{faction} in {region} spotted it: two actions, one block. Different people, different tokens, same moment on the blockchain. The Archive filed both under the same timestamp.',
    ],
  },

  ARTIFACT_DISCOVERY: {
    loreType: 'ARTIFACT_DISCOVERY', icon: '★',
    ruleApplied: 'Artifact Discovery',
    ruleExplanation: 'The transaction hash ended in a rare repeating pattern — a statistical oddity.',
    headlines: [
      'A Strange Hash — Something is Found',
      '{faction} Spot a Pattern in the Data',
      'The Numbers Did Something Unusual',
      '{figure} Notes an Anomaly',
    ],
    bodies: [
      'Transaction hashes are essentially random. So when one ends in four identical characters, {faction} pay attention. The odds are low. It happened. {region} has the artifact now.',
      '{figure} scans every hash. Most are noise. This one had a pattern at the end — four of the same character in a row. {faction} logged it as a discovery. The Grid hides things sometimes.',
      'The pattern at the end of the hash was unlikely enough that {faction} in {region} flagged it. It doesn\'t change anything practically. But unlikely things get noted. That\'s what the Archive is for.',
      'Is it meaningful? Probably not. But {faction} have always logged hash anomalies — the rare patterns that show up in the data without explanation. This one goes in the collection.',
    ],
  },

  // ── Time gaps — what silence says about the Grid ──────────────────────────

  THE_FORGETTING: {
    loreType: 'THE_FORGETTING', icon: '░',
    ruleApplied: 'The Forgetting',
    ruleExplanation: 'More than 50,000 blocks passed with no activity — a very long quiet stretch.',
    headlines: [
      'A Long Silence Ends',
      '{faction} Return After a Major Gap',
      'The Grid Went Quiet — Now It\'s Back',
      'Fifty Thousand Blocks of Nothing',
    ],
    bodies: [
      'Fifty thousand blocks is about a week of Ethereum time. The Grid went quiet for that long. Then someone did something. {faction} in {region} noted the return, and also the silence that preceded it.',
      'Long gaps are their own kind of event. {figure} always says: "The silence is part of the story." The Archive had nothing to record for a long stretch. Now it has something again.',
      '{faction} track gaps as carefully as they track activity. When nothing happens for this long, it gets its own entry. The return after the silence is logged alongside the silence itself.',
      'The Grid rests sometimes. This was a long rest — long enough that {faction} marked it in the record. What broke the quiet was a single action from {region}. The Chronicle picks up where it left off.',
    ],
  },

  LULL_BETWEEN_AGES: {
    loreType: 'LULL_BETWEEN_AGES', icon: '—',
    ruleApplied: 'Lull Between Ages',
    ruleExplanation: 'More than 10,000 blocks with no activity — a quieter stretch in the record.',
    headlines: [
      'After a Pause, Something Moves',
      'The Grid Was Quiet for a While',
      '{faction} Note a Return to Activity',
      'Ten Thousand Blocks of Quiet',
    ],
    bodies: [
      'Ten thousand blocks is about a day. The Grid went quiet for that long before this event. {faction} in {region} noted the pause in the record — not as a problem, just as a fact.',
      'Not every pause means something is wrong. Sometimes the Grid just breathes. {figure} calls the quiet stretches "the space between." This one lasted longer than most. Now it\'s over.',
      '{faction} mark the gaps. When no events come for more than ten thousand blocks, the Archive notes it. This gap ended with a single action. The record resumes.',
      'Activity in the Grid comes in waves. There are busy stretches and quiet ones. This was a quiet one — long enough for {faction} to log it. The action that ended it is in the Chronicle now.',
    ],
  },

  THE_INTERLUDE: {
    loreType: 'THE_INTERLUDE', icon: '·—·',
    ruleApplied: 'The Interlude',
    ruleExplanation: 'A brief pause of 3,000–6,000 blocks after a cluster of activity.',
    headlines: [
      'A Brief Rest',
      'The Grid Took a Breath',
      'Between Events — A Short Quiet',
      '{faction} Note a Natural Pause',
    ],
    bodies: [
      'After a cluster of activity, the Grid paused. Not for long — a few thousand blocks. Then this event. {faction} in {region} noted the pattern: busy, then quiet, then busy again.',
      '{figure} calls these short gaps "natural pauses." The Grid works in bursts. A brief rest between them is just how it goes. {faction} logged the rest and the return.',
      'A few thousand blocks went by with nothing. Then this. {faction} noted that the quiet came right after a busy stretch — a small breath before the next round of activity.',
      'The Archive catches the rhythms. Cluster, pause, cluster. {faction} in {region} saw it happening again. The interlude is in the record. The next stretch of activity will be too.',
    ],
  },

  // ── Address history — returning wallets tell their own story ──────────────

  SCHOLARS_WORK: {
    loreType: 'SCHOLARS_WORK', icon: '◎',
    ruleApplied: "Scholar's Work",
    ruleExplanation: 'A wallet that\'s been active before — someone who keeps showing up.',
    headlines: [
      'A Familiar Hand Returns',
      'This Wallet Has Been Here Before',
      '{faction} Recognize the Address',
      'Back Again — A Known Contributor',
    ],
    bodies: [
      'This wallet has been here before. {faction} in {region} recognized the address immediately. Someone who keeps showing up and doing things. The Archive has their history.',
      'Returning contributors are easy to spot. The address matches something in the record. {figure} noted it — this person came back, did something, and the Chronicle keeps their full account.',
      '{faction} track active wallets over time. This one has built up a history — multiple appearances, multiple actions. Today\'s entry is another chapter in a longer story.',
      'Not everyone who acts once comes back. This wallet did. {faction} in {region} appreciate consistency. The record shows a pattern of engagement. It\'s one of the longer entries in the secondary index.',
    ],
  },

  WANDERERS_PASSAGE: {
    loreType: 'WANDERERS_PASSAGE', icon: '→',
    ruleApplied: "Wanderer's Passage",
    ruleExplanation: 'A wallet appearing for the first time — someone new to the Chronicle.',
    headlines: [
      'A New Wallet Arrives',
      'First Time Here',
      '{faction} Welcome a New Address',
      'Someone New Just Showed Up',
    ],
    bodies: [
      'This wallet hasn\'t appeared in the Chronicle before. {faction} in {region} noted the first entry. Everyone starts with a first time. This is theirs.',
      'New addresses arrive all the time. {figure} logs them — a fresh entrant to the Grid, a wallet that hasn\'t been in the record before. Whatever they do from here, this is where it starts.',
      '{faction} keep a list of first-timers. This wallet is on it now. One action logged, history officially started. The Chronicle has them.',
      'The Grid grows. New wallets show up, make their first move, and get added to the record. This one arrived in {region}. {faction} noted it. Welcome to the Archive.',
    ],
  },

  COUNCIL_CONVENES: {
    loreType: 'COUNCIL_CONVENES', icon: '⊓',
    ruleApplied: 'Council Convenes',
    ruleExplanation: 'Same wallet returned within 500 blocks — they came back very quickly.',
    headlines: [
      'Back Already',
      'A Quick Return',
      'Same Wallet, Less Than 500 Blocks Later',
      '{faction} Note a Rapid Follow-Up',
    ],
    bodies: [
      'Less than 500 blocks — about an hour — and the same wallet was back. {faction} in {region} noted it. When someone returns that quickly, it usually means they\'re not done.',
      '{figure} calls these rapid returns "deliberate." You don\'t come back in under an hour by accident. This wallet had a reason. {faction} logged both visits.',
      'Back within five hundred blocks. {faction} in {region} wrote it up as a quick turnaround — the kind that suggests someone had more to do than they fit into the first visit.',
      'The same address, returning almost immediately. {faction} noted the pattern. Two actions close together, from the same wallet. The second one is in the record alongside the first.',
    ],
  },

  SIGNAL_LOST: {
    loreType: 'SIGNAL_LOST', icon: '○',
    ruleApplied: 'Signal Lost',
    ruleExplanation: 'An active wallet went quiet for a long time after this event.',
    headlines: [
      'After This — Silence',
      'A Last Entry Before a Long Gap',
      '{faction} Note What Turned Out to Be a Goodbye',
      'The Last Signal for a While',
    ],
    bodies: [
      'This event turned out to be the last one from this wallet for a long time. {faction} in {region} noted it in hindsight — someone who was active, and then wasn\'t.',
      'The Grid doesn\'t always know when someone is leaving. Neither do they, usually. But looking back, {figure} can see that this was the last entry for this address before a major gap.',
      '{faction} track absences as well as presence. After this event, this wallet went quiet. Whether they\'ll come back is unknown. The Archive has the record of what they did before the silence.',
      'It wasn\'t obvious at the time. But this event was followed by a long stretch of nothing from the same address. {faction} logged the gap. The last thing before the silence is in the record.',
    ],
  },

  SIGNAL_FOUND: {
    loreType: 'SIGNAL_FOUND', icon: '●',
    ruleApplied: 'Signal Found',
    ruleExplanation: 'A wallet reappeared after more than 20,000 blocks away — a long return.',
    headlines: [
      'Back After a Long Time Away',
      'A Return from a Major Gap',
      '{faction} Hear from a Lost Signal',
      'Twenty Thousand Blocks — Then This',
    ],
    bodies: [
      'Twenty thousand blocks is almost three days. This wallet was gone for at least that long — maybe longer. Now they\'re back. {faction} in {region} noted both the absence and the return.',
      '{figure} keeps track of returns. When someone comes back after a major gap, it gets its own entry. This wallet was away long enough to matter. Their return is logged.',
      '{faction} were watching for this address. Long absences get noted. When the wallet finally came back, {faction} in {region} wrote it up — the return of a signal that had been missing.',
      'The archive has a patience about it. It waits. When a wallet returns after twenty thousand blocks or more, the record picks up where it left off. This one just came back.',
    ],
  },

  DEBT_RECORDED: {
    loreType: 'DEBT_RECORDED', icon: '⊖',
    ruleApplied: 'Debt Recorded',
    ruleExplanation: 'A veteran wallet burning for the second or third time — they\'ve done this before.',
    headlines: [
      'Another Burn from a Known Wallet',
      'This Wallet Has Burned Before',
      '{faction} Note a Repeat Sacrifice',
      'Not the First — Not the Last',
    ],
    bodies: [
      'This wallet has burned before. {faction} in {region} have the record. Today they did it again. Some people understand the trade-off well enough to make it more than once.',
      '{figure} keeps a separate list of repeat burners. It\'s shorter than the main burn record. This wallet is on it. Their history shows a pattern — not recklessness, but deliberate choice.',
      '{faction} track burns across time. When the same wallet shows up more than once in the burn record, it means something. This address keeps making the trade. The Chronicle keeps logging it.',
      'Two burns, maybe three. {faction} in {region} noted that this isn\'t new behavior for this wallet. They\'ve made this choice before. They made it again. It\'s in the record.',
    ],
  },

  SILENT_WITNESS: {
    loreType: 'SILENT_WITNESS', icon: '○',
    ruleApplied: 'Silent Witness',
    ruleExplanation: 'A new wallet acting quietly — first time, no fanfare.',
    headlines: [
      'A First Move, Made Quietly',
      'New Here, Saying Nothing',
      '{faction} Log a First-Timer Who Didn\'t Announce Themselves',
      'Arrived, Did Something, Left',
    ],
    bodies: [
      'First time in the record. No announcement, no fanfare. The wallet appeared in {region}, did something, and left. {faction} noted it the same as any other first entry.',
      'Not everyone who shows up for the first time makes a statement about it. This wallet didn\'t. They appeared, acted, and the Chronicle has the record. That\'s all.',
      '{figure} appreciates the quiet first-timers. Most new addresses just do their thing. This one was no exception. {faction} in {region} logged it without ceremony.',
      'A new wallet, acting once, saying nothing. {faction} wrote it up — another first entry in the Archive. Whether they come back or not, this moment is in the record.',
    ],
  },

  BORDER_CROSSING: {
    loreType: 'BORDER_CROSSING', icon: '⇒',
    ruleApplied: 'Border Crossing',
    ruleExplanation: 'A returning wallet moving between different token ranges — spreading their activity.',
    headlines: [
      'A Familiar Wallet, A Different Token',
      '{faction} Note Range Activity',
      'Same Wallet, Different Part of the Register',
      'Moving Across the Collection',
    ],
    bodies: [
      'This wallet has shown up before — but usually in a different part of the register. Today they were in {region}, with a token outside their normal range. {faction} noted the cross-over.',
      '{figure} tracks which wallets work with which token ranges. This address is moving around. That\'s worth noting. {faction} have it in the record.',
      'Not everyone sticks to one part of the collection. This wallet moves. {faction} in {region} logged the activity — a familiar address operating in new territory.',
      '{faction} keep range maps. When a known wallet shows up somewhere unexpected in the register, it gets noted. This one was in unfamiliar territory. The Chronicle has both their usual haunts and this new one.',
    ],
  },

  RETURN_FROM_MARGIN: {
    loreType: 'RETURN_FROM_MARGIN', icon: '←',
    ruleApplied: 'Return from Margin',
    ruleExplanation: 'A high token ID (8,500+) wallet becoming active again after a gap.',
    headlines: [
      'The High Numbers Are Active Again',
      '{faction} Hear from the Far End',
      'A Late-Register Token Comes Back',
      'Token 8,500+: Still in the Game',
    ],
    bodies: [
      'High token numbers — eight thousand five hundred and above — are quiet most of the time. This one wasn\'t, today. {faction} in {region} noted the activity from the far end of the register.',
      '{figure} keeps a special eye on the high numbers. They don\'t move as often. When they do, it gets a note. This one came back after a gap. The Chronicle has the return.',
      '{faction} track the full collection. The late-register tokens have their own patterns — less frequent, but not absent. This one acted. {faction} in {region} wrote it up.',
      'There are parts of the collection that don\'t get much attention. The high-number tokens are often in that group. This wallet bucked the trend. {faction} noted the return from the margin.',
    ],
  },

  ARCHIVE_CORRECTION: {
    loreType: 'ARCHIVE_CORRECTION', icon: '↺',
    ruleApplied: 'Archive Correction',
    ruleExplanation: 'A returning wallet doing something different from their usual pattern.',
    headlines: [
      'A Known Wallet Does Something New',
      '{faction} Update the File',
      'Pattern Broken — Archive Revised',
      'Not What We Expected from This Address',
    ],
    bodies: [
      'The Archive thought it knew what this wallet did. Then this. {faction} in {region} noted the break in pattern — same address, different behavior. The file is updated.',
      '{figure} revises entries when the pattern changes. This wallet did something unexpected. Not wrong — just different from their history. The Chronicle reflects the new information.',
      '{faction} don\'t assume. They update. This wallet added a new chapter to their record — something that didn\'t fit the established pattern. The Archive has both the old pattern and the new data.',
      'A returning wallet, behaving differently than before. {faction} in {region} noted it as a correction to the record. The Archive is a living document. It updates when things change.',
    ],
  },

  LINEAGE_NOTED: {
    loreType: 'LINEAGE_NOTED', icon: '⋮',
    ruleApplied: 'Lineage Noted',
    ruleExplanation: 'A wallet with three or more appearances — a consistent contributor.',
    headlines: [
      'Three Times and Counting',
      'A Consistent Presence',
      '{faction} Note a Pattern of Return',
      'This Wallet Keeps Showing Up',
    ],
    bodies: [
      'Three appearances. Maybe more. {faction} in {region} noted the consistency — a wallet that keeps coming back and doing things. That\'s worth marking. The Archive has their full history.',
      '{figure} calls it "lineage" when a wallet shows up three or more times. It\'s not random anymore at that point. Someone decided this was worth their continued attention. {faction} respect that.',
      '{faction} track frequency. When a wallet reaches three entries in the Chronicle, it gets a lineage note — a marker that says this isn\'t a one-time thing. This wallet earned one.',
      'Consistent presence in the Grid is uncommon. Most wallets appear once or twice. This one keeps showing up. {faction} in {region} noted the pattern. The Chronicle follows it.',
    ],
  },

  THRESHOLD_WATCHED: {
    loreType: 'THRESHOLD_WATCHED', icon: '◑',
    ruleApplied: 'Threshold Watched',
    ruleExplanation: 'Within 3 events of the next era threshold — the story is close to a transition.',
    headlines: [
      'Almost There — A New Era Approaches',
      'The Next Threshold is Close',
      '{faction} Are Watching the Count',
      'A Few More Events — Then Something Changes',
    ],
    bodies: [
      'The count is close to the next era threshold. {faction} in {region} are watching. A few more events and the story moves into a new chapter. This one was close to that moment.',
      '{figure} checks the tally regularly near threshold time. The number is almost there. The Chronicle is paying attention. The next era is within reach.',
      '{faction} get a little more attentive when the count gets close to a turning point. Three events from now — maybe two, maybe one — something changes. This one was logged with that in mind.',
      'The Archive knows when an era is ending. The numbers say so. {faction} in {region} noted this event as part of the approach. The next threshold is very close.',
    ],
  },

  THE_ACCORD: {
    loreType: 'THE_ACCORD', icon: '≈',
    ruleApplied: 'The Accord',
    ruleExplanation: 'A new wallet acting in a way that mirrors what others have done before.',
    headlines: [
      'A New Wallet, A Familiar Pattern',
      'Someone New Doing What Others Did',
      '{faction} Notice a Match',
      'First Time — But Not a New Kind of Move',
    ],
    bodies: [
      'New wallet, but the move they made isn\'t new. {faction} in {region} noticed the pattern — a first-time address doing something that other addresses have done before. The Grid has rhythms. New people fall into them.',
      'Not every newcomer does something original. This one did what works — a move that fits an established pattern. {faction} noted it. The Chronicle sees these alignments between old moves and new actors.',
      '{figure} tracks patterns across wallets. When a new address shows up and immediately falls into a familiar pattern, it gets noted. This one did. {faction} logged the accord between old behavior and new presence.',
      '{faction} in {region} spotted the match: a new wallet, making a move that lines up with what\'s been done before. Not coordination — just convergence. The record has both.',
    ],
  },

  DUST_RECORD: {
    loreType: 'DUST_RECORD', icon: '.',
    ruleApplied: 'Dust Record',
    ruleExplanation: 'Exactly 1 pixel changed or 1 action point transferred — the minimum possible act.',
    headlines: [
      'One Pixel. That\'s It.',
      'The Minimum Move',
      '{faction} Log the Smallest Possible Change',
      'Just One — But It\'s There',
    ],
    bodies: [
      'One pixel. {faction} in {region} logged it the same as everything else. The Archive doesn\'t have a minimum threshold for what counts. Everything counts. This one is in.',
      'The smallest possible change in the Grid: one pixel, one action point. {figure} keeps a separate index of these. It\'s one of the longer lists in the secondary Archive.',
      '{faction} note that the minimum mark isn\'t the same as no mark. Someone did something — the least they could do, yes, but they did it. The Chronicle records it.',
      'One. That\'s the whole story. {faction} in {region} logged it, because that\'s what the Archive does. The smallest acts are part of the record too. This one is now.',
    ],
  },

  ECHO_OF_THE_ANCIENT: {
    loreType: 'ECHO_OF_THE_ANCIENT', icon: '◁',
    ruleApplied: 'Echo of the Ancient',
    ruleExplanation: 'A founding-era token (under 500) acting later in the Chronicle — the old ones are still here.',
    headlines: [
      'One of the First Five Hundred, Still Active',
      'An Ancient Number Makes a Move',
      '{faction} Note the Oldest Range',
      'Token Under #500: Still Going',
    ],
    bodies: [
      'Token under five hundred. One of the very first. {faction} in {region} noted the activity — not because it\'s unusual for a token to act, but because this one is among the oldest. The old ones are still here.',
      '{figure} pays special attention to the first five hundred. When one of them does something after the Chronicle has been running for a while, it gets an echo note. The ancient range is still in the story.',
      '{faction} keep the founding-era list separate. Tokens under five hundred are the originals. When one acts later in the Chronicle\'s life, the Archive marks it as an echo — the oldest part of the Grid, still present.',
      'The first five hundred tokens were minted at the beginning. Most things from the beginning fade. These haven\'t. {faction} in {region} noted this one acting — old number, still going.',
    ],
  },

  THE_CARTOGRAPHY: {
    loreType: 'THE_CARTOGRAPHY', icon: '⊞',
    ruleApplied: 'The Cartography',
    ruleExplanation: 'Token ID 2,000–3,000 — the middle-early range, consistent and undercharted.',
    headlines: [
      'The Two-Thousands Move',
      'A Mid-Early Token Checks In',
      '{faction} Log from the Charted Middle',
      'Token 2K–3K: A Steady Range',
    ],
    bodies: [
      'The two-to-three thousand range doesn\'t get the attention the early tokens do, but it\'s one of the more consistent parts of the register. {faction} in {region} logged this one. Steady work from a steady range.',
      '{figure} calls the two-thousands "the reliable middle." Not as old as the founders, not as far out as the high numbers. Just there, doing things. This one added to the count.',
      '{faction} track activity by range. The two-to-three thousand segment has been showing up regularly. Today was another entry from that part of the collection. {faction} in {region} noted it.',
      'Some ranges act in clusters. The two-thousands are fairly consistent — a steady presence across the life of the Chronicle so far. This one fits the pattern. {faction} logged it.',
    ],
  },

  EMISSARY_ARRIVES: {
    loreType: 'EMISSARY_ARRIVES', icon: '»',
    ruleApplied: 'Emissary Arrives',
    ruleExplanation: 'New wallet, token ID 1,000–2,000 — a first-time address with a mid-early token.',
    headlines: [
      'A New Address with an Old Token',
      'First Time Here, Mid-Register Token',
      '{faction} Welcome a New Face from Range 1K–2K',
      'New Wallet, Familiar Token Range',
    ],
    bodies: [
      'New address, but the token is from the one-to-two thousand range — not the oldest, but not new either. {faction} in {region} noted the arrival. First-time wallet, mid-register token. A combination worth marking.',
      '{figure} notes when a new wallet comes in holding a mid-early token. The address is fresh, but the token has been around. Whatever history the token has, this new holder is its next chapter.',
      '{faction} log new addresses. They also log token ranges. When both point to something interesting — a fresh wallet with a token from the early-middle register — it gets its own entry. This is one.',
      'New to the Chronicle, but carrying a token from the 1,000–2,000 range. {faction} in {region} wrote it up. The wallet is new. The token has been around. They\'re together now.',
    ],
  },

  THE_LONG_COUNT: {
    loreType: 'THE_LONG_COUNT', icon: '∞',
    ruleApplied: 'The Long Count',
    ruleExplanation: 'Every 40th event — honoring the 40×40 Grid that every Normie lives on.',
    headlines: [
      'Forty More — The Grid Counts Itself',
      '{faction} Mark the Fortieth',
      'Every 40 Events, the Archive Notes the Grid',
      'A Long Count Entry — 40×40',
    ],
    bodies: [
      'Every Normie exists on a forty-by-forty grid. Every fortieth event in the Chronicle, the Archive pauses to note that fact. {faction} in {region} marked this one. Forty more events. The Grid counts itself.',
      'Forty columns. Forty rows. Sixteen hundred pixels per Normie. The fortieth Chronicle entry honors the architecture. {figure} keeps the Long Count list. It\'s growing.',
      '{faction} made a point of marking the fortieth event. "The forty matters," {figure} always says. "It\'s the number the whole thing is built on." The Archive agrees. The Long Count is in.',
      'The Grid is forty by forty. The Chronicle counts in forties. Every fortieth event gets its own entry — a quiet acknowledgment of the structure that everything sits on. This is one of those entries.',
    ],
  },

  PASSAGE_SEALED: {
    loreType: 'PASSAGE_SEALED', icon: '□',
    ruleApplied: 'Passage Sealed',
    ruleExplanation: 'A consistent address made a distinctive final-pattern edit — a clean ending.',
    headlines: [
      'A Clean Ending from a Known Wallet',
      '{faction} Note a Deliberate Close',
      'That Looks Like a Goodbye',
      'A Consistent Address, A Final-Looking Move',
    ],
    bodies: [
      'This wallet has been consistent. What they did today looked like a conclusion — a clean move that had a "done" feel to it. {faction} in {region} noted it. Whether they come back or not, this looks like a close.',
      '{figure} can spot when something has a final quality. This edit did. The wallet has a history. This move fits the end of a pattern. The Archive has it logged as a possible seal.',
      '{faction} don\'t assume anyone is done. But they note when something looks like an ending. This move, from this address, had that quality. {faction} in {region} logged it accordingly.',
      'Consistent wallets sometimes make a move that feels final. This one did. {faction} noted it — not as a confirmed end, but as something that could be. The record has the full arc.',
    ],
  },

  THE_TRANSLATION: {
    loreType: 'THE_TRANSLATION', icon: '↔',
    ruleApplied: 'The Translation',
    ruleExplanation: 'Activity near the edges of two different ranges — bridging parts of the collection.',
    headlines: [
      'A Bridge Across the Register',
      '{faction} Note Activity at Two Ranges',
      'Connecting Distant Parts of the Collection',
      'A Translation Between Ranges',
    ],
    bodies: [
      'Activity at the edges of two different ranges. {faction} in {region} noted the pattern — events that seem to bridge distant parts of the collection. Not coordinated, probably. But worth marking.',
      '{figure} maps the collection by range. When activity shows up at the boundaries between segments, it gets a translation note. Something is moving across the usual divides.',
      '{faction} track range patterns. When the borders between segments light up — different token ranges active near the same time — the Archive writes it up as a translation. This is one.',
      'The collection has natural groupings. When events happen at the edges of those groupings, {faction} in {region} note it. A translation between ranges. The Chronicle connects the dots.',
    ],
  },

}

function isPrime(n: number): boolean {
  if (n < 2) return false; if (n === 2) return true; if (n % 2 === 0) return false
  for (let i = 3; i * i <= n; i += 2) { if (n % i === 0) return false }
  return true
}

function isRareTxHash(h: string): boolean {
  const last4 = h.slice(-4)
  return /^(.)\1{3}$/.test(last4)
}

function selectRule(
  event: IndexedEvent,
  index: number,
  allEvents: IndexedEvent[],
  cumCount: number,
  prev: IndexedEvent | null
): string {
  const tokenId = Number(event.tokenId)
  const count = Number(event.count)
  const priorSameOwner = allEvents.slice(0, index).filter(e => e.owner === event.owner)
  const isVeteran = priorSameOwner.length > 0

  // ── TIER 1: Structural milestones ─────────────────────────────────────────
  if (cumCount > 0 && cumCount % 40 === 0) return 'THE_LONG_COUNT'
  if (cumCount > 0 && cumCount % 25 === 0) return 'PROPHECY_SPOKEN'
  if (cumCount > 0 && cumCount % 10 === 0) return 'THE_RECKONING'
  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'NEW_ERA_DAWN'
  const nextEra = ERAS.find(e => e.threshold > cumCount)
  if (nextEra && nextEra.threshold - cumCount <= 3) return 'THRESHOLD_WATCHED'

  // ── TIER 2: Rare chain patterns ────────────────────────────────────────────
  if (isRareTxHash(event.transactionHash)) return 'ARTIFACT_DISCOVERY'
  if (prev && prev.blockNumber === event.blockNumber) return 'CONVERGENCE_POINT'

  // ── TIER 3: Time gaps ──────────────────────────────────────────────────────
  if (prev && event.blockNumber - prev.blockNumber > 50000n) return 'THE_FORGETTING'
  if (prev && event.blockNumber - prev.blockNumber > 10000n) return 'LULL_BETWEEN_AGES'
  if (prev && event.blockNumber - prev.blockNumber > 3000n && event.blockNumber - prev.blockNumber < 6000n) {
    if (seedN(event.tokenId, event.blockNumber) % 5 === 0) return 'THE_INTERLUDE'
  }

  // ── TIER 4: Veteran return patterns ───────────────────────────────────────
  if (isVeteran && priorSameOwner.length >= 1) {
    const lastSeen = priorSameOwner[priorSameOwner.length - 1]
    const gap = event.blockNumber - lastSeen.blockNumber
    if (gap > 20000n) return 'SIGNAL_FOUND'
    if (gap < 500n) return 'COUNCIL_CONVENES'
  }

  // ── TIER 5: Token ranges ───────────────────────────────────────────────────
  if (tokenId < 500 && index > 10) return 'ECHO_OF_THE_ANCIENT'
  if (tokenId < 1000) return 'FOUNDATION_STONE'
  if (tokenId >= 1000 && tokenId < 2000 && !isVeteran) return 'EMISSARY_ARRIVES'
  if (tokenId >= 2000 && tokenId < 3000 && seedN(event.tokenId, event.blockNumber, 11) % 4 === 0) return 'THE_CARTOGRAPHY'
  if (tokenId >= 5000 && tokenId <= 6000) {
    return seedN(event.tokenId, event.blockNumber, 3) % 3 === 0 ? 'THE_UNMAPPED' : 'SIGNAL_LOST'
  }
  if (tokenId > 8500 && seedN(event.tokenId, event.blockNumber, 9) % 3 === 0 && index > 5) return 'RETURN_FROM_MARGIN'
  if (tokenId > 8000) return 'RECORD_OF_THE_DEEP'

  // ── TIER 6: Prime token IDs ────────────────────────────────────────────────
  if (isPrime(tokenId)) return 'ORACLES_OBSERVATION'

  // ── TIER 7: Burns ─────────────────────────────────────────────────────────
  if (event.type === 'BurnRevealed') {
    if (count >= 10) return 'POWER_INFUSION'
    if (count === 1) return 'DUST_RECORD'
    if (isVeteran && priorSameOwner.length >= 2) return 'DEBT_RECORDED'
    if (isVeteran) return 'RITE_OF_RECOGNITION'
    return 'ETHEREAL_INFUSION'
  }

  // ── TIER 8: Pixel scale ────────────────────────────────────────────────────
  if (count >= 200) return 'GRAND_MIGRATION'
  if (count >= 50 && count % 50 === 0) return 'FACTION_DECLARATION'
  if (count >= 50) return 'TERRITORIAL_CLAIM'
  if (count === 1) return 'DUST_RECORD'

  // ── TIER 9: Veteran address patterns ──────────────────────────────────────
  if (isVeteran) {
    const roll = seedN(event.tokenId, event.blockNumber, 23) % 6
    if (roll === 0) return 'FACTION_RISE'
    if (roll === 1) return 'BORDER_CROSSING'
    if (roll === 2 && priorSameOwner.length >= 3) return 'LINEAGE_NOTED'
    if (roll === 3) return 'ARCHIVE_CORRECTION'
    return 'SCHOLARS_WORK'
  }

  // ── TIER 10: New addresses ─────────────────────────────────────────────────
  const roll = seedN(event.tokenId, event.blockNumber, 29) % 5
  if (roll === 0) return 'SILENT_WITNESS'
  if (roll === 1) return 'BORDER_CROSSING'
  if (roll === 2) return 'THE_ACCORD'
  return 'WANDERERS_PASSAGE'
}

// FACTION_RISE and PASSAGE_SEALED need their own inline rules since they map to existing lore types
const FACTION_RISE_RULE: LoreRule = {
  loreType: 'FACTION_RISE', icon: '▲',
  ruleApplied: 'Faction Rise',
  ruleExplanation: 'A veteran wallet acting consistently — the same address keeps showing up and doing things.',
  headlines: [
    'Same Wallet, Still Here',
    '{faction} Note a Consistent Presence',
    'This Address Keeps Coming Back',
    'A Familiar Name, Another Entry',
  ],
  bodies: [
    '{faction} have seen this address before. More than once. Today\'s entry adds to the pattern. Some wallets show up and disappear. This one keeps going. {faction} in {region} noted the consistency.',
    'The Archive values consistency. Not everyone who starts keeps going. This wallet has. {figure} logged the latest entry from a familiar address — part of a pattern that shows no sign of stopping.',
    'Three entries, maybe four. More on the way. {faction} in {region} have been following this address for a while. Whatever they\'re doing in the Grid, they\'re committed to it.',
    '{figure} says you can tell a lot about someone by whether they come back. This wallet comes back. {faction} noted the latest entry — same address, still active, still in the Chronicle.',
  ],
}

const PASSAGE_SEALED_RULE: LoreRule = {
  loreType: 'PASSAGE_SEALED', icon: '□',
  ruleApplied: 'Passage Sealed',
  ruleExplanation: 'A consistent address, a distinctive close — something that looked like a conclusion.',
  headlines: [
    'A Clean Ending from a Known Wallet',
    '{faction} Note a Deliberate Close',
    'That Looks Like a Goodbye',
    'A Consistent Address Makes a Final-Looking Move',
  ],
  bodies: [
    'This wallet has been consistent. What they did today looked like a conclusion. {faction} in {region} noted it. Whether they come back or not, this looks like a close.',
    '{figure} can tell when something has a final quality. This one did. The Archive has the full arc of this address. Today might be the last chapter. It\'s logged either way.',
    '{faction} don\'t assume anyone is done. But they note when something looks like an ending. This move had that quality. {faction} in {region} logged it accordingly.',
    'Consistent wallets sometimes make a move that feels final. This did. {faction} noted it — not confirmed, but possible. The record has everything that came before.',
  ],
}

export function generateStoryEntries(events: IndexedEvent[], startCount = 0): StoryEntry[] {
  return events.map((event, index) => {
    const cumCount = startCount + index + 1
    const prev = index > 0 ? events[index - 1] : null
    const ruleKey = selectRule(event, index, events, cumCount, prev)

    let rule: LoreRule
    if (ruleKey === 'FACTION_RISE') rule = FACTION_RISE_RULE
    else if (ruleKey === 'PASSAGE_SEALED') rule = PASSAGE_SEALED_RULE
    else rule = RULES[ruleKey] ?? RULES['SUBTLE_INSCRIPTION']

    const era = getEra(cumCount)
    const ctx = buildCtx(event.tokenId, event.blockNumber, era)
    const s = seedN(event.tokenId, event.blockNumber)
    const s2 = seedN(event.tokenId, event.blockNumber, 3)
    const headline = fill(pick(rule.headlines, s), ctx)
    const body = fill(pick(rule.bodies, s2), ctx)

    const featuredTypes = ['PROPHECY_SPOKEN', 'NEW_ERA_DAWN', 'ARTIFACT_DISCOVERY', 'THE_LONG_COUNT', 'GRAND_MIGRATION', 'CONVERGENCE_POINT']

    return {
      id: `${event.transactionHash}-${event.tokenId.toString()}`,
      eventType: event.type,
      loreType: rule.loreType,
      era,
      headline,
      body,
      icon: rule.icon,
      featured: featuredTypes.includes(ruleKey) || event.count > 200n,
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

export const PRIMER_ENTRIES: StoryEntry[] = [
  {
    id: 'primer-genesis', eventType: 'genesis', loreType: 'GENESIS', era: 'The First Days',
    headline: 'The Grid Wakes Up',
    body: 'Ten thousand Normies exist on Ethereum. Each one a face, each one on a 40×40 grid. Some of their owners have started doing things — editing pixels, burning tokens, passing action points between them. The Chronicle is watching. This is everything that\'s happened so far.',
    icon: '◈', featured: true,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'World Genesis', ruleExplanation: 'Normies are 10,000 fully on-chain generative faces on Ethereum mainnet. The Grid is 40×40 — 1,600 pixels per Normie, stored entirely on-chain.' },
  },
  {
    id: 'primer-orders', eventType: 'genesis', loreType: 'GENESIS', era: 'The First Days',
    headline: 'Four Types, One Grid',
    body: 'The 10,000 Normies come in four types: Humans, Cats, Aliens, and Agents. The Chronicle tracks them all the same way — every edit, every burn, every transfer of action points goes into the record. The story is just getting started.',
    icon: '▦', featured: false,
    sourceEvent: { type: 'genesis', tokenId: 'All 10,000', blockNumber: 'Genesis', txHash: 'N/A', count: '10000', ruleApplied: 'World Genesis', ruleExplanation: 'The four Normie types — Human, Cat, Alien, Agent — are the four pillars of the collection. Each one is part of the same story.' },
  },
]

export { RULES, ERAS }
