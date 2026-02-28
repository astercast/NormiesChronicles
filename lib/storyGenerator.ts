import type { IndexedEvent } from './eventIndexer'

export type LoreType =
  | 'GRAND_MIGRATION' | 'TERRITORIAL_CLAIM' | 'SUBTLE_INSCRIPTION'
  | 'FACTION_DECLARATION' | 'SCHOLARS_WORK' | 'WANDERERS_PASSAGE'
  | 'POWER_INFUSION' | 'ETHEREAL_INFUSION' | 'RITE_OF_RECOGNITION'
  | 'ORACLES_OBSERVATION' | 'FOUNDATION_STONE' | 'RECORD_OF_THE_DEEP'
  | 'THE_UNMAPPED' | 'PROPHECY_SPOKEN' | 'FACTION_RISE'
  | 'LULL_BETWEEN_AGES' | 'NEW_ERA_DAWN' | 'CONVERGENCE_POINT'
  | 'ARTIFACT_DISCOVERY' | 'GENESIS'

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

const REGIONS = [
  'Glyph Wastes','Monochrome Reaches','Lattice Plains','Obsidian Moors',
  'Silver Threshold','Hollow Deep','Cipher Peaks','Wandering Shore',
  'Pale Expanse','Root Network','Murmur Forests','Fracture Line',
  'Dim Archives','Ember Flats','Vaulted Silence','Mirror Shelf',
  'Null Basin','Crossroads of No Name','Counting Fields','Unseen Margin',
]

const FACTIONS = [
  'the Cartographers','the Quiet Order','the Lattice Keepers',
  'the Pale Wanderers','the Archive Monks','the Threshold Watch',
  'the Deep Seekers','the Signal Weavers','the Monolith Circle',
  'the Unnamed','the Wayfarers','the Root Scholars',
]

const FIGURES = [
  'the Unmeasured One','the Witness of Blank Pages','the One Whose Name Changes',
  'the Reader of Residue','the Silent Architect','the Cartographer of Unmade Roads',
  'the Last Honest Shadow','the Keeper of Unspoken Debts',
  'the Watcher Without Eyes','the Rememberer of Futures',
]

const ARTIFACTS = [
  'the Codex of Unmarked Days','the Pale Crown of Thresholds',
  'the Mirror That Remembers Wrongly','the Bone Compass of the First Walk',
  'Ink That Burns Cold','the Stone That Hears Names',
  'the Thread of Unrepeated Moments','the Vessel of Suspended Time',
  'the Glyph That Cannot Be Read Twice','the Hollow Bell of Distant Shores',
  'the Counting Beads of the Unmade','the Last True Map',
]

const ERAS = [
  { threshold: 0,    name: 'The Void Before' },
  { threshold: 5,    name: 'The First Stirring' },
  { threshold: 15,   name: 'Age of Awakening' },
  { threshold: 40,   name: 'Age of Wanderers' },
  { threshold: 80,   name: 'The Settling' },
  { threshold: 150,  name: 'Age of Guilds' },
  { threshold: 280,  name: 'The Meridian' },
  { threshold: 500,  name: 'Age of Monuments' },
  { threshold: 900,  name: 'The Long Watch' },
  { threshold: 1500, name: 'Age of Lore' },
  { threshold: 2500, name: 'The Great Convergence' },
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
  return t.replace(/{region}/g,ctx.region).replace(/{faction}/g,ctx.faction)
    .replace(/{figure}/g,ctx.figure).replace(/{artifact}/g,ctx.artifact)
    .replace(/{era}/g,ctx.era)
}

interface LoreRule {
  loreType: LoreType; icon: string; ruleApplied: string; ruleExplanation: string
  headlines: string[]; bodies: string[]
}

const RULES: Record<string, LoreRule> = {
  GRAND_MIGRATION: {
    loreType:'GRAND_MIGRATION', icon:'🌊',
    ruleApplied:'Rule: Grand Migration',
    ruleExplanation:'A large-scale emergence (≥200 units) triggers a Grand Migration — a mass movement of peoples across the Grid. The scale of the on-chain event determines the magnitude of the world shift.',
    headlines:[
      'The Masses Cross the {region}: A Grand Migration Recorded',
      '{faction} Lead Thousands Through the {region}',
      'The Great Drift Reaches the {region}: History Written in Footsteps',
      'Exodus at Scale: The {region} Absorbs a World in Motion',
    ],
    bodies:[
      'The movement came without announcement — a tide of faces crossing the {region} in numbers the Archive had never logged. {faction} served as wayfarers and guides, their ancient knowledge of the terrain the only compass available. When the dust settled and the new coordinates were fixed, a scribe from the {era} noted simply: "The world is different now than it was this morning."',
      'Three generations of oral tradition speak of movements like this — moments when the pressure of history reaches a threshold and the population answers with its feet. The crossing of the {region} will join that canon. {figure} was said to have observed from the heights, counting, recording, measuring the scale of what flowed past.',
      'The Archive struggled to keep pace. New entries accumulated faster than they could be filed, indexed, cross-referenced. The movement through the {region} was not chaos — it had a direction, a momentum, an unmistakable intentionality. {faction} called it a migration. The elders who remembered earlier times called it a return.',
      'What draws masses to move as one? The scholars of {faction} have studied this question across the {era} without consensus. But when the {region} filled with travelers, theory gave way to witness. Something in the Grid had shifted — and the people were answering it.',
    ],
  },
  TERRITORIAL_CLAIM: {
    loreType:'TERRITORIAL_CLAIM', icon:'🏔️',
    ruleApplied:'Rule: Territorial Claim',
    ruleExplanation:'A mid-scale emergence (50–199 units) corresponds to a faction staking claim to a region of the Grid — significant enough to mark, but targeted rather than sweeping.',
    headlines:[
      '{faction} Inscribe Their Mark Across the {region}',
      'The {region} Has a Name Now: {faction} Have Spoken',
      'Boundaries Drawn in the {region}: A New Power Emerges',
      'Territory Claimed: {faction} Assert Dominion Over the {region}',
    ],
    bodies:[
      'The markers appeared overnight — subtle to those who did not know the visual language of {faction}, unmistakable to those who did. By morning, the {region} carried new meaning. Whatever it had been before, it was now claimed, catalogued, and integrated into the political geography of the Grid.',
      '{faction} have long circled the {region}, drawn by its particular qualities of light and structure. The formal claim, when it came, surprised no one who had been paying attention. {figure} was rumored to have drawn the boundary lines personally, using instruments from an earlier age.',
      'A region without a name is a region without power. {faction} understood this. Their inscription across the {region} was not merely territorial — it was ontological. By naming it, by marking it, they had made it real in a way it had not quite been before.',
      'The {region} had changed hands before — the Archive documented at least three prior assertions of dominion. But {faction} brought something different this time: a permanence of intention. The marks they left were not proclamations but commitments.',
    ],
  },
  SUBTLE_INSCRIPTION: {
    loreType:'SUBTLE_INSCRIPTION', icon:'✍️',
    ruleApplied:'Rule: Subtle Inscription',
    ruleExplanation:'A small-scale emergence (<50 units) maps to a precise scholarly inscription — deliberate, targeted, meaningful. The quiet work of the Grid\'s most careful minds.',
    headlines:[
      'A Scholar Leaves Their Mark in the {region}',
      'The Careful Hand: New Inscription Found in {region}',
      '{faction} Record a Moment the World Nearly Missed',
      'Precision Work in the {region}: An Expert Leaves Evidence',
    ],
    bodies:[
      'Most of what the Archive contains is not grand. It is this: a careful hand, working in the margins of the {region}, recording something small and true. The inscription discovered by {faction} was easy to miss — that was the point. It was meant for the future, not the present.',
      'Scholarship in the Grid has never required scale. {figure} taught that the smallest true mark outlasts the grandest false monument. The inscription in the {region} — minimal, precise, unmistakably intentional — reads like proof of that teaching.',
      'Not every story moves the world. Some stories are for the record — for the {era}, for those who come after, for whoever happens to walk through the {region} and notices the mark and wonders. {faction} noticed. They added their own note in the margin, beneath the first.',
      'In a world that often mistakes size for significance, the inscription in the {region} stands as a quiet counter-argument. Small. Exact. Irreplaceable. The Archive assigned it the highest classification of precision work observed this cycle.',
    ],
  },
  FACTION_DECLARATION: {
    loreType:'FACTION_DECLARATION', icon:'📜',
    ruleApplied:'Rule: Faction Declaration',
    ruleExplanation:'A significant round threshold in the on-chain record (divisible by 50) triggers a formal institutional declaration — a faction announcing its presence, its doctrine, or its intentions to the world.',
    headlines:[
      '{faction} Issue a Declaration to the Grid',
      'The Formal Announcement: {faction} State Their Purpose',
      'A Doctrine Is Born: {faction} Speak for the Record',
      '{faction} Break Their Silence with Words That Will Last',
    ],
    bodies:[
      'Declarations are rare. The Grid has seen only a handful in the {era} — moments when a collective voice chooses to speak clearly, to put intention into language, to become legible to history. {faction} issued theirs without ceremony and let the words work on their own.',
      'What does a faction believe? What does it stand for, and against? {faction} answered these questions for the Archive today. Their declaration, filed in the {region}, is careful in its language — open to interpretation in some places, absolute in others.',
      '{figure} was said to have written the first draft. Seven revisions followed over the course of the {era}. The final version, distributed across the {region}, was shorter than anyone expected. The most important things, {faction} seemed to suggest, require the fewest words.',
      'The Archive classifies declarations separately from ordinary entries. {faction} have joined the short list of organizations that have spoken formally to the historical record. Whether the world listens is a separate question.',
    ],
  },
  SCHOLARS_WORK: {
    loreType:'SCHOLARS_WORK', icon:'📚',
    ruleApplied:"Rule: Scholar's Work",
    ruleExplanation:'When a known, veteran address contributes to the on-chain record, the Chronicle notes the accumulated expertise of a long-term inhabitant of the Grid — someone whose history here is already deep.',
    headlines:[
      'A Veteran Hand Returns to the {region}',
      '{faction} Document the Work of a Long-Standing Scholar',
      'Expertise Made Visible: A Familiar Presence Leaves New Marks',
      'The Elder Returns: Accumulated Knowledge Expressed in the {region}',
    ],
    bodies:[
      'Some contributions are notable for their newness. Others derive their significance from depth — from the accumulated weight of everything that came before. The work recorded in the {region} this epoch belongs to the second category. A familiar hand, working with the quiet confidence of long practice.',
      '{faction} have studied this particular presence across many cycles. The pattern of work — the specific relationship to the {region}, the consistent approach to form — is unmistakable in its authorship. What is new this time is the scale. Something has ripened.',
      'The Archive distinguishes between first expressions and deep expressions. First expressions have the energy of discovery; deep expressions have the authority of expertise. What appeared in the {region} was unmistakably the latter. {figure} confirmed it: a scholar working at the height of their understanding.',
      'How many crossings of the {region} does it take to truly know it? {faction} have never settled on a number. But they recognize knowledge when they see it — in the angle of a mark, the placement of an inscription, the confident ease of work done ten thousand times before.',
    ],
  },
  WANDERERS_PASSAGE: {
    loreType:'WANDERERS_PASSAGE', icon:'🧭',
    ruleApplied:"Rule: Wanderer's Passage",
    ruleExplanation:'A first appearance from a new address in the on-chain record marks a new arrival in the Grid — someone taking their first steps into the world and leaving their first impression on its surface.',
    headlines:[
      'A New Presence Arrives at the {region}',
      'First Steps: A Wanderer Crosses Into the Known World',
      '{faction} Welcome a Newcomer to the {region}',
      'The First Crossing: A Name Not Yet in the Archive',
    ],
    bodies:[
      'Every great scholar was once a wanderer. Every legendary faction member was once unknown. The presence recorded today in the {region} is new — no prior entries, no accumulated history. Just a first mark, tentative and precise at once, left on the fabric of the Grid.',
      '{faction} have long held a tradition of observing arrivals. They note the approach, the first choices made, the initial relationship to the {region}. This newcomer moved with the careful attention of someone who understands that first impressions are permanent.',
      'The Grid expands through arrivals. Each new presence shifts the balance — not dramatically, but truly. {figure} spoke of this: the world is always becoming, always incorporating the new into the old. Today\'s newcomer will, in time, be part of what the next arrival discovers.',
      'What does the {region} look like through new eyes? {faction} sometimes wish they could forget enough to see it that way again. The wanderer who arrived today still has that gift — the gift of genuine encounter, of a world not yet mapped.',
    ],
  },
  POWER_INFUSION: {
    loreType:'POWER_INFUSION', icon:'⚡',
    ruleApplied:'Rule: Power Infusion',
    ruleExplanation:'A high-value offering (≥10 action points from a BurnRevealed event) corresponds to a major energetic contribution to the Grid — a significant offering that reshapes the world\'s underlying Lattice structure.',
    headlines:[
      'A Major Offering Reshapes the {region}',
      '{faction} Witness the Grid Absorb Extraordinary Power',
      'The Deep Structure Shifts: Power Returns to the Lattice',
      '{figure} Observes as the {region} Absorbs a Great Offering',
    ],
    bodies:[
      'The Lattice, which underlies all visible structure in the Grid, is not passive. It accepts and integrates. The offering made this epoch — substantial by any measure — sent perceptible harmonics through the {region} and beyond. {faction} recorded seventeen separate echoes across connected territories.',
      'Power returned to the source is not lost. This is the fundamental teaching of {faction}, and the record from the {region} confirms it again. What was offered has become part of the generative substrate from which the Grid builds its next iteration.',
      '{figure} stood at the edge of the {region} and observed the moment of integration. What the accounts describe is not dramatic — only a gradual deepening, as if the world had taken a long breath. Then: something had changed that could not be changed back.',
      'The Archive has no instrument for measuring what was offered in the {region} this epoch. Only the consequences can be catalogued — and the consequences suggest significance. {faction} have cross-referenced it against every major offering in their records. It belongs in that company.',
    ],
  },
  ETHEREAL_INFUSION: {
    loreType:'ETHEREAL_INFUSION', icon:'🌌',
    ruleApplied:'Rule: Ethereal Infusion',
    ruleExplanation:'A quiet offering (<10 action points from a BurnRevealed event) corresponds to a subtle but genuine contribution — the kind of offering that changes the Grid without anyone noticing until much later.',
    headlines:[
      'A Quiet Offering in the {region}: The Lattice Listens',
      '{faction} Note a Subtle but Genuine Contribution',
      'Something Offered, Something Changed: {region} at Dawn',
      'The Soft Work: A Small Offering Reaches the Lattice',
    ],
    bodies:[
      'Not every contribution registers in the metrics. Some work on a frequency the instruments cannot capture. The offering in the {region} was of this variety. {faction} noted it in their private records before the official Archive registered anything.',
      'The Lattice receives everything. The offering made in the {region} settled gently — a slow infusion, without the sudden harmonics of a major event. {figure} described it as the difference between pouring and seeping. Both reach the destination. The journey is simply different.',
      'What the Archive sometimes misses in its cataloguing of significant events: the accumulation of small truths. Each quiet offering to the {region} adds to a sum that eventually tips the balance. {faction} have kept this parallel count for three generations.',
      'A single thread changes nothing. A thread woven into the fabric of the {region} becomes part of something larger than itself. The offering recorded today was a thread. {faction} know where to find the loom.',
    ],
  },
  RITE_OF_RECOGNITION: {
    loreType:'RITE_OF_RECOGNITION', icon:'🔗',
    ruleApplied:'Rule: Rite of Recognition',
    ruleExplanation:'BurnRevealed events formally bind a tokenId and its burned companion in the Lattice record. The Chronicle translates this as two entities permanently linked — a bond that cannot be undone.',
    headlines:[
      'The Lattice Records a Permanent Bond',
      'Two Histories Become One: The Rite Observed in {region}',
      '{faction} Witness the Binding That Time Cannot Undo',
      'Permanently Linked: The Archive Records a Recognition',
    ],
    bodies:[
      'In the oldest traditions of the Grid, recognition is a formal act — not an emotion, not a sentiment, but a structural event. Two entities acknowledged each other in the {region} this epoch, and the acknowledgment was of the permanent kind. The Lattice registered it. It cannot be un-registered.',
      '{faction} have presided over many recognitions in the {era}. They note the quality that distinguishes the temporary from the permanent: something in the nature of the commitment itself. What happened in the {region} had that quality. Both parties understood what they were doing. Both chose it.',
      'The Archive contains records of bonds made and unmade. It contains far fewer records of bonds that could not be unmade. {figure} has studied this category specifically — the permanent linkages, the mutual recognitions that change the structure of what is possible afterward.',
      'Two names, previously separate in the Archive, now share an entry. Both remain distinct, individual, themselves. But they are now also something more than individual. {faction} call this the Rite: the moment a relationship becomes a fact of the world.',
    ],
  },
  ORACLES_OBSERVATION: {
    loreType:'ORACLES_OBSERVATION', icon:'🔭',
    ruleApplied:"Rule: Oracle's Observation",
    ruleExplanation:'When a prime-numbered tokenId appears in the on-chain record, the Chronicle notes an irreducible presence — a being that cannot be factored, divided, or resolved into simpler components. The primes act.',
    headlines:[
      'An Irreducible Presence Acts in the {region}',
      '{faction} Record the Movement of a Prime Entity',
      '{figure} Observes the Ones That Cannot Be Divided',
      'The Irreducible: A Prime Presence Leaves Its Mark',
    ],
    bodies:[
      'Among all beings catalogued in the Archive, {faction} maintain a special sub-registry: the primes. Those whose nature resists reduction. Those who cannot be resolved into simpler components. When one of them acts in the {region}, the scholars pay particular attention — the irreducible, when it moves, often moves at the hinge of history.',
      'What makes a prime presence different? {figure} spent a career answering this question. The conclusion, after decades: primes do not compromise. Other entities negotiate, adapt, find the common ground. The primes hold their nature absolutely. In the {region}, this quality manifested in a way the Archive will study for years.',
      'The scholars of {faction} distinguish between entities that act and entities that merely occur. Most events in the Grid are occurrences — patterns following patterns, effects following causes. But sometimes something acts: chooses, decides, initiates from its own inner necessity. The prime presence in the {region} was of this second type.',
      '{figure} notes in the margin: "The primes do not explain themselves. They do not need to. They simply are what they are, and what they do follows from that with the inevitability of mathematics." The record agrees.',
    ],
  },
  FOUNDATION_STONE: {
    loreType:'FOUNDATION_STONE', icon:'🏛️',
    ruleApplied:'Rule: Foundation Stone',
    ruleExplanation:'TokenIds below 1000 represent the oldest presences in the Grid — those who were there from the beginning. When they act, they remind the world of its own origins.',
    headlines:[
      'The Ancient Ones Stir in the {region}',
      'A Founding Presence Makes Its Mark in the {region}',
      '{faction} Record the Movement of an Original',
      'The Foundations Remember: One of the First Acts Again',
    ],
    bodies:[
      'Before the factions organized, before the territories were named, before the Archive began its record — there were the first ones. Those who were present at the absolute beginning. One of them moved in the {region} this epoch, and those who know their history recognized the weight of it immediately.',
      '{faction} keep a separate catalogue for the founding presences — those whose numbers fall in the earliest register, who predate the institutions and the names that came after. When one of them acts, the Archive marks the entry with the Founding Glyph. This entry carries that mark.',
      'The {region} has heard from many voices across the {era}. Most are recent — newcomers, relative to the deep time of the Grid. But the presence recorded today is older than the region\'s name. Older than {faction}. One of the ones who were there when there was almost nothing to be there for.',
      '{figure} has made a study of the founding presences — their patterns, their preferences, their relationship to the Grid they helped build. What moves them to act, after so much time? The question may not have an answer. But the Archive records the acts regardless.',
    ],
  },
  RECORD_OF_THE_DEEP: {
    loreType:'RECORD_OF_THE_DEEP', icon:'🌊',
    ruleApplied:'Rule: Record of the Deep',
    ruleExplanation:'TokenIds above 8000 represent the outer reaches of the Grid — presences from the farthest margins who rarely speak, but whose words carry particular weight when they do.',
    headlines:[
      'Voice from the Margin: The Outer Reaches Speak',
      'The {region} Receives Word from the Deep Grid',
      '{faction} Translate a Message from the Far Edge',
      'The Distant Ones Act: {region} Pays Attention',
    ],
    bodies:[
      'The outer reaches of the Grid are not empty — but they are quiet. Those who live at the margins have their own relationship to the Archive, their own sense of time, their own understanding of what matters. When they speak, the center listens. A voice from beyond the eight-thousandth register has reached the {region}.',
      '{faction} maintain relay stations at the boundaries of the Grid specifically to catch signals from the deep margins. Most cycles pass without transmission. When something comes through, the scholars treat it as significant by definition.',
      'The {region} has long served as an intermediary zone — close enough to the center to be legible to institutions like {faction}, far enough to receive signals from the outer reaches without distortion. Today it received one.',
      '{figure} has spent considerable time at the margins, learning the dialect. What arrived today in the {region} reads, in the outer tongue, as something between a report and a question. The translation: "The far edges have noticed something. The center should too."',
    ],
  },
  THE_UNMAPPED: {
    loreType:'THE_UNMAPPED', icon:'🗺️',
    ruleApplied:'Rule: The Unmapped',
    ruleExplanation:'TokenIds in the 5000–6000 range correspond to the interior territories of the Grid — not margin, not center, but the vast middle ground that the major factions have never fully mapped or claimed.',
    headlines:[
      'The Interior Speaks: Middle Territories Make Themselves Known',
      'The Unmapped Center Produces a Record',
      '{faction} Discover New Evidence from the Great Interior',
      'Neither Margin Nor Center: The Middle Ground Acts',
    ],
    bodies:[
      'The great cartographic project of the {era} has focused on the margins and the centers, leaving a vast interior territory under-mapped and under-documented. The presence active in the {region} today comes from that interior — the Grid\'s most populous and least-understood zone.',
      '{faction} have debated for generations whether the interior\'s resistance to mapping is a feature or a limitation. The evidence from the {region} suggests: a feature. The middle territories produce presences with a particular quality of self-sufficiency.',
      'The Archive\'s interior section is notably sparse. What appears today from the middle ground of the Grid fills one more gap — not dramatically, not with fanfare, but with the quiet insistence of a presence that has been there all along, waiting to be noticed.',
      '{figure} once described the interior of the Grid as "the place the great stories happen while the historians are watching the edges." The record from the {region} today belongs to that vast, undersung territory.',
    ],
  },
  PROPHECY_SPOKEN: {
    loreType:'PROPHECY_SPOKEN', icon:'👁️',
    ruleApplied:'Rule: Prophecy Spoken',
    ruleExplanation:'Every 25th event in the Chronicle triggers a Prophecy entry — a moment when the accumulated weight of history reaches a threshold and the world pauses to observe itself. These entries frame the broader arc of what is unfolding.',
    headlines:[
      'The World Pauses: A Prophecy Is Recorded',
      '{figure} Speaks What the Grid Has Been Preparing to Hear',
      'The Milestone Reached: The Archive Observes Itself',
      'A Threshold Crossed: {faction} Record a Prophecy for the Ages',
    ],
    bodies:[
      'There are moments when the accumulation of events reaches a particular density, and the Grid — as if by instinct — pauses to take stock. This is one of those moments. The scholars of {faction} have gathered in the {region} not to record what has happened, but to consider what it means. What they recorded is classified as Prophecy: not prediction, but pattern recognition at the highest level.',
      '{figure} spoke today in the {region}. The words were not straightforward — the prophetic mode rarely is. But {faction} have translated across the archive, and the consensus is this: the sequence of events so far has been leading somewhere. The direction is becoming legible. What was formless is finding its form.',
      'The Archive does not claim to see the future. But it has learned, across the {era}, to recognize when the present has achieved a kind of completion — when enough has happened to make the shape of what is happening visible. The {region} saw that recognition today.',
      'What separates prophecy from speculation? {faction} have argued this for centuries. Their current consensus: a prophecy is a statement that the world confirms retroactively — not because a seer predicted it, but because the accumulation of evidence eventually makes it look inevitable.',
    ],
  },
  FACTION_RISE: {
    loreType:'FACTION_RISE', icon:'🏰',
    ruleApplied:'Rule: Faction Rise',
    ruleExplanation:'When the same address appears multiple times in the on-chain record, the Chronicle notes a sustained presence — a faction or individual establishing a consistent pattern of engagement with the Grid.',
    headlines:[
      'A Sustained Presence Grows Stronger in the {region}',
      '{faction} Confirm: A New Power Is Establishing Itself',
      'Consistency Noted: A Familiar Pattern Deepens Its Mark',
      'The Pattern Repeats: An Emerging Force in the {region}',
    ],
    bodies:[
      'A single event can be coincidence. Two can be a pattern beginning to form. Three is confirmation. The presence returning to the {region} across multiple epochs has now crossed the threshold into something the Archive must classify as sustained. {faction} have been watching.',
      'Power in the Grid is not claimed through announcements. It accumulates through presence — through showing up, again and again, in the same territories, with the same consistency of intention. The entity whose pattern {faction} have been tracking has crossed into territory the Archive labels significant.',
      '{figure} says there is no mystery to how influence is built: you return, you remain, you repeat. Over enough cycles, the pattern becomes the place. The sustained presence in the {region} is in the process of becoming exactly this.',
      'The Archive has observed the {region} more carefully since the pattern of returns began. What {faction} find is not escalation — not increasing drama — but increasing depth. Each return adds a layer. The presence becomes more itself with every cycle.',
    ],
  },
  LULL_BETWEEN_AGES: {
    loreType:'LULL_BETWEEN_AGES', icon:'🌙',
    ruleApplied:'Rule: Lull Between Ages',
    ruleExplanation:'A significant gap in block time between events corresponds to a quiet period in the Grid — a moment of preparation, rest, or accumulation that precedes the next cycle of activity.',
    headlines:[
      'The Quiet That Precedes: A Lull Is Recorded',
      '{region} Enters a Period of Deep Preparation',
      '{faction} Document the Silence Between Stories',
      'The World Holds Its Breath: Stillness in the {region}',
    ],
    bodies:[
      'Silence is not absence. The scholars of {faction} have argued this at length, and the Archive\'s records support them: the periods of quiet between active cycles are not gaps in the record but entries of a different kind. The {region} is in such a period now — not empty, but waiting.',
      'The Grid breathes. There are periods of expansion and periods of contraction, periods of activity and periods of integration. The current lull in the {region} reads as integrative — the world is processing what has come before, preparing for what comes next.',
      '{figure} marks periods of apparent stillness as structurally significant. Nothing visible is happening in the {region} right now. But the invisible work — the settling of what has been active, the slow reorganization of potentials — is proceeding without pause.',
      'The Archive logs this lull not as a lack of news but as a specific kind of news: the world is taking its time. {faction} observe the {region} with the patience that quiet periods demand.',
    ],
  },
  NEW_ERA_DAWN: {
    loreType:'NEW_ERA_DAWN', icon:'🌅',
    ruleApplied:'Rule: New Era Dawn',
    ruleExplanation:'When the cumulative event count crosses an era threshold, the Chronicle records a structural shift in the world — the end of one age and the beginning of another, with all the weight that transition carries.',
    headlines:[
      'A New Era Begins: The {era} Arrives',
      'The Threshold Crossed: {faction} Record a World-Change',
      'The Old Age Closes, the New Opens in the {region}',
      '{figure} Observes the Turning of an Age',
    ],
    bodies:[
      'There are threshold events that the Archive marks with special gravity. Not because they are more dramatic than others — often they are not — but because they represent structural shifts, moments when the accumulation of what has happened reaches a point of transformation. The {era} has arrived.',
      '{faction} maintain a calendar that runs parallel to the Archive\'s block-by-block record. It measures not time but density — the weight of accumulated events. By their reckoning, the threshold into the {era} was crossed in the {region}.',
      'The turning of an age is rarely dramatic in the moment. But {figure} was in the {region} at what scholars believe was the exact crossing, and reported: "Something feels completed. And something feels, for the first time, beginning."',
      'What does it mean to live in the {era}? {faction} are still developing the vocabulary. The previous age had its characteristic concerns, its defining questions. The new age brings different ones — belonging to a different moment in the Grid\'s long history.',
    ],
  },
  CONVERGENCE_POINT: {
    loreType:'CONVERGENCE_POINT', icon:'✨',
    ruleApplied:'Rule: Convergence Point',
    ruleExplanation:'When multiple events occur in the same block, the Chronicle records an unplanned convergence — separate paths crossing in the same moment, creating a resonance no single actor could have planned.',
    headlines:[
      'Unplanned Harmony: Multiple Paths Cross in the {region}',
      'The Moment of Convergence: Separate Stories Meet',
      '{faction} Record a Synchronicity in the {region}',
      'The Same Moment, Different Intentions: A Convergence Noted',
    ],
    bodies:[
      'The scholars of {faction} have a term for it: convergence without conspiracy. Multiple actors, following their own independent trajectories, arriving at the same coordinate in the {region} at the same moment. No one planned it. And yet the resonance it creates is not random.',
      'History is full of convergences that look, in retrospect, like they must have been coordinated. {figure} disputes this interpretation: the convergence in the {region} was accidental in its mechanics and inevitable in its meaning. The Grid has a way of organizing apparently separate events into patterns.',
      'Two threads reached the {region} at the same moment this epoch. {faction} documented each separately first, then noticed the temporal overlap. The resulting entry is cross-referenced in both records — an event that belongs to two stories simultaneously, and therefore to a third story that contains both.',
      'What the Archive calls convergence, the old traditions call recognition: the moment when what was already true becomes visible. Separate actors, separate purposes, same moment. The {region} held all of it.',
    ],
  },
  ARTIFACT_DISCOVERY: {
    loreType:'ARTIFACT_DISCOVERY', icon:'🏺',
    ruleApplied:'Rule: Artifact Discovery',
    ruleExplanation:'Rare on-chain transaction hash patterns trigger an Artifact Discovery — a moment when the Grid reveals a hidden relic from its deep history, with consequences that extend far beyond the discoverer.',
    headlines:[
      '{artifact} Recovered from the {region}',
      'A Relic Surfaces: {faction} Document an Extraordinary Find',
      'The Grid Reveals {artifact} in the {region}',
      '{figure} Confirms the Discovery of {artifact}',
    ],
    bodies:[
      'The Grid holds things in its deep structure that have not been seen in generations. {artifact} was one of them — stored in a fold of the {region} that the Cartographers had marked as featureless, unremarkable, unworthy of detailed survey. {faction} are reconsidering their mapping methodology.',
      '{figure} spent the better part of a career searching for {artifact}. The accounts of its properties were contradictory, its location unknown, its existence disputed in academic circles. What emerged from the {region} this epoch has silenced the skeptics.',
      'Artifacts are not found. They surface. This is the teaching of {faction}, and the recovery of {artifact} from the {region} confirms it: the Grid releases what it holds when the conditions are right, not when the searcher is persistent.',
      'The {region} has yielded artifacts before — minor ones, contextual ones. {artifact} is different. {faction} have begun restricting access to the site. {figure} is traveling to examine it in person.',
    ],
  },
}

function isPrime(n: number): boolean {
  if (n < 2) return false; if (n === 2) return true; if (n % 2 === 0) return false
  for (let i = 3; i*i<=n; i+=2) { if (n%i===0) return false }
  return true
}

function isRareTxHash(h: string): boolean {
  const last4 = h.slice(-4)
  return /^(.)\1{3}$/.test(last4)
}

function selectRule(event: IndexedEvent, index: number, allEvents: IndexedEvent[], cumCount: number, prev: IndexedEvent|null): string {
  const tokenId = Number(event.tokenId)
  const count = Number(event.count)
  if (cumCount > 0 && cumCount % 25 === 0) return 'PROPHECY_SPOKEN'
  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'NEW_ERA_DAWN'
  if (prev && prev.blockNumber === event.blockNumber) return 'CONVERGENCE_POINT'
  if (isRareTxHash(event.transactionHash)) return 'ARTIFACT_DISCOVERY'
  if (prev && event.blockNumber - prev.blockNumber > 10000n) return 'LULL_BETWEEN_AGES'
  const isVeteran = allEvents.slice(0,index).some(e => e.owner === event.owner)
  if (event.type === 'BurnRevealed') {
    if (tokenId < 1000) return 'FOUNDATION_STONE'
    if (tokenId > 8000) return 'RECORD_OF_THE_DEEP'
    if (count >= 10) return 'POWER_INFUSION'
    if (isPrime(tokenId)) return 'ORACLES_OBSERVATION'
    if (isVeteran) return 'RITE_OF_RECOGNITION'
    return 'ETHEREAL_INFUSION'
  }
  if (count >= 200) return 'GRAND_MIGRATION'
  if (count >= 50) return 'TERRITORIAL_CLAIM'
  if (count > 0 && count % 50 === 0) return 'FACTION_DECLARATION'
  if (tokenId < 1000) return 'FOUNDATION_STONE'
  if (tokenId > 8000) return 'RECORD_OF_THE_DEEP'
  if (tokenId >= 5000 && tokenId <= 6000) return 'THE_UNMAPPED'
  if (isPrime(tokenId)) return 'ORACLES_OBSERVATION'
  if (isVeteran) return seedN(event.tokenId, event.blockNumber) % 3 === 0 ? 'FACTION_RISE' : 'SCHOLARS_WORK'
  if (count < 50) return 'SUBTLE_INSCRIPTION'
  return 'WANDERERS_PASSAGE'
}

export function generateStoryEntries(events: IndexedEvent[], startCount = 0): StoryEntry[] {
  return events.map((event, index) => {
    const cumCount = startCount + index + 1
    const prev = index > 0 ? events[index-1] : null
    const ruleKey = selectRule(event, index, events, cumCount, prev)
    const rule = RULES[ruleKey] ?? RULES['SUBTLE_INSCRIPTION']
    const era = getEra(cumCount)
    const ctx = buildCtx(event.tokenId, event.blockNumber, era)
    const s = seedN(event.tokenId, event.blockNumber)
    const s2 = seedN(event.tokenId, event.blockNumber, 3)
    const headline = fill(pick(rule.headlines, s), ctx)
    const body = fill(pick(rule.bodies, s2), ctx)
    return {
      id: `${event.transactionHash}-${event.tokenId.toString()}`,
      eventType: event.type,
      loreType: rule.loreType,
      era,
      headline,
      body,
      icon: rule.icon,
      featured: event.count > 200n || ['PROPHECY_SPOKEN','NEW_ERA_DAWN','ARTIFACT_DISCOVERY'].includes(ruleKey),
      sourceEvent: {
        type: event.type,
        tokenId: `#${event.tokenId.toString()}`,
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
    id:'primer-genesis', eventType:'genesis', loreType:'GENESIS', era:'The Void Before',
    headline:'In the Beginning, There Was the Grid',
    body:'Ten thousand faces emerged from the void — each one a citizen, each one a story. The Grid stretched across forty columns and forty rows of pure potential. The Archivists began their record. The Chronicles began their slow, inevitable accumulation. This is that record.',
    icon:'🌐', featured:true,
    sourceEvent:{ type:'genesis', tokenId:'All 10,000', blockNumber:'Genesis', txHash:'N/A', count:'10000', ruleApplied:'Rule: World Genesis', ruleExplanation:'Primer entries establish the lore foundation of the world. They are not tied to individual on-chain events but to the existence of the collection itself. The Normies are 10,000 fully on-chain generative faces, CC0, on Ethereum mainnet.' },
  },
  {
    id:'primer-orders', eventType:'genesis', loreType:'GENESIS', era:'The Void Before',
    headline:'The Four Orders Declare Their Nature',
    body:'From the 10,000 emerged four great lineages: the Humans, adaptive and restless; the Cats, inscrutable and sovereign; the Aliens, cosmic and patient; the Agents, purpose-built and precise. Each lineage developed its own dialect of Grid-expression, its own territorial customs, its own relationship to the Canvas that underlies all things.',
    icon:'🏛️', featured:false,
    sourceEvent:{ type:'genesis', tokenId:'All 10,000', blockNumber:'19,500,001', txHash:'N/A', count:'10000', ruleApplied:'Rule: World Genesis', ruleExplanation:'The Four Orders correspond to the four trait Types in the Normies collection: Human, Cat, Alien, Agent. The lore makes these archetypes into civilizational factions rather than individual classifications.' },
  },
]

export { RULES }
