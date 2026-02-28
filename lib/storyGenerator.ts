import type { IndexedEvent } from './eventIndexer'

export type LoreType =
  // Original 19
  | 'GRAND_MIGRATION' | 'TERRITORIAL_CLAIM' | 'SUBTLE_INSCRIPTION'
  | 'FACTION_DECLARATION' | 'SCHOLARS_WORK' | 'WANDERERS_PASSAGE'
  | 'POWER_INFUSION' | 'ETHEREAL_INFUSION' | 'RITE_OF_RECOGNITION'
  | 'ORACLES_OBSERVATION' | 'FOUNDATION_STONE' | 'RECORD_OF_THE_DEEP'
  | 'THE_UNMAPPED' | 'PROPHECY_SPOKEN' | 'FACTION_RISE'
  | 'LULL_BETWEEN_AGES' | 'NEW_ERA_DAWN' | 'CONVERGENCE_POINT'
  | 'ARTIFACT_DISCOVERY' | 'GENESIS'
  // 21 new connective rules
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

  // ─── ORIGINAL 19 ─────────────────────────────────────────────────────────

  GRAND_MIGRATION: {
    loreType:'GRAND_MIGRATION', icon:'◈',
    ruleApplied:'Rule 1: Grand Migration',
    ruleExplanation:'A large-scale transformation (≥200 pixels) triggers a Grand Migration — a mass movement across the Grid. The scale of the on-chain event determines the magnitude of the world shift.',
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
    loreType:'TERRITORIAL_CLAIM', icon:'◉',
    ruleApplied:'Rule 2: Territorial Claim',
    ruleExplanation:'A mid-scale transformation (50–199 pixels) corresponds to a faction staking claim to a region — significant enough to mark, but targeted rather than sweeping.',
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
    loreType:'SUBTLE_INSCRIPTION', icon:'·',
    ruleApplied:'Rule 3: Subtle Inscription',
    ruleExplanation:'A small-scale transformation (<50 pixels) maps to a precise scholarly inscription — deliberate, targeted, meaningful. The quiet work of the Grid\'s most careful minds.',
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
    loreType:'FACTION_DECLARATION', icon:'▣',
    ruleApplied:'Rule 4: Faction Declaration',
    ruleExplanation:'A round threshold in the on-chain record (pixel count divisible by 50) triggers a formal institutional declaration — a faction announcing its presence, doctrine, or intentions to the Grid.',
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
    loreType:'SCHOLARS_WORK', icon:'◎',
    ruleApplied:'Rule 5: Scholar\'s Work',
    ruleExplanation:'When a known veteran address contributes to the on-chain record, the Chronicle notes accumulated expertise — someone whose history in the Grid is already deep.',
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
    loreType:'WANDERERS_PASSAGE', icon:'→',
    ruleApplied:'Rule 6: Wanderer\'s Passage',
    ruleExplanation:'A first appearance from a new address marks a new arrival in the Grid — someone taking their first steps into the world and leaving their first impression on its surface.',
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
    loreType:'POWER_INFUSION', icon:'◆',
    ruleApplied:'Rule 7: Power Infusion',
    ruleExplanation:'A high-value BurnRevealed event (≥10 action points) corresponds to a major energetic contribution to the Grid — a significant offering that reshapes the underlying Lattice structure.',
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
    loreType:'ETHEREAL_INFUSION', icon:'○',
    ruleApplied:'Rule 8: Ethereal Infusion',
    ruleExplanation:'A quiet BurnRevealed event (<10 action points) corresponds to a subtle but genuine contribution — the kind of offering that changes the Grid without anyone noticing until much later.',
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
    loreType:'RITE_OF_RECOGNITION', icon:'⊕',
    ruleApplied:'Rule 9: Rite of Recognition',
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
    loreType:'ORACLES_OBSERVATION', icon:'◇',
    ruleApplied:'Rule 10: Oracle\'s Observation',
    ruleExplanation:'When a prime-numbered tokenId appears in the on-chain record, the Chronicle notes an irreducible presence — a being that cannot be factored, divided, or resolved into simpler components.',
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
    loreType:'FOUNDATION_STONE', icon:'▲',
    ruleApplied:'Rule 11: Foundation Stone',
    ruleExplanation:'TokenIds below 1,000 represent the oldest presences in the Grid — those who were there from the beginning. When they act, they remind the world of its own origins.',
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
    loreType:'RECORD_OF_THE_DEEP', icon:'▽',
    ruleApplied:'Rule 12: Record of the Deep',
    ruleExplanation:'TokenIds above 8,000 represent the outer reaches of the Grid — presences from the farthest margins who rarely speak, but whose words carry particular weight when they do.',
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
    loreType:'THE_UNMAPPED', icon:'?',
    ruleApplied:'Rule 13: The Unmapped',
    ruleExplanation:'TokenIds in the 5,000–6,000 range correspond to the interior territories of the Grid — not margin, not center, but the vast middle ground that major factions have never fully mapped or claimed.',
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
    loreType:'PROPHECY_SPOKEN', icon:'◈',
    ruleApplied:'Rule 14: Prophecy Spoken',
    ruleExplanation:'Every 25th event triggers a Prophecy entry — the accumulated weight of history reaching a threshold where the world pauses to observe itself. These entries frame the broader arc of what is unfolding.',
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
    loreType:'FACTION_RISE', icon:'▴',
    ruleApplied:'Rule 15: Faction Rise',
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
    loreType:'LULL_BETWEEN_AGES', icon:'—',
    ruleApplied:'Rule 16: Lull Between Ages',
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
    loreType:'NEW_ERA_DAWN', icon:'◐',
    ruleApplied:'Rule 17: New Era Dawn',
    ruleExplanation:'When the cumulative event count crosses an era threshold, the Chronicle records a structural shift — the end of one age and the beginning of another, with all the weight that transition carries.',
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
    loreType:'CONVERGENCE_POINT', icon:'✦',
    ruleApplied:'Rule 18: Convergence Point',
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
    loreType:'ARTIFACT_DISCOVERY', icon:'◈',
    ruleApplied:'Rule 19: Artifact Discovery',
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

  // ─── 21 NEW CONNECTIVE RULES ─────────────────────────────────────────────

  COUNCIL_CONVENES: {
    loreType:'COUNCIL_CONVENES', icon:'▦',
    ruleApplied:'Rule 20: Council Convenes',
    ruleExplanation:'When an event follows another by the same address within a short span, the Chronicle notes a deliberation — a presence that has returned quickly, suggesting internal debate, reconsideration, or organized group decision-making.',
    headlines:[
      '{faction} Convene in the {region} to Deliberate',
      'A Council Gathers: Something Requires Collective Judgment',
      'The Deliberation Is Recorded: {faction} Reach a Conclusion',
      '{figure} Chairs the Assembly at the {region}',
    ],
    bodies:[
      'Councils in the Grid do not form without reason. When {faction} gathered in the {region} this epoch, it was in response to something that no single voice could resolve — a question the collective needed to answer together. {figure} was asked to chair. The record notes: the deliberation was long, and the conclusion was not unanimous, but it was binding.',
      'The tradition of convening goes back to the earliest days of the {era}. Before declarations, before claims, there is the gathering — the moment when those who will act choose first to listen. The council in the {region} followed this tradition.',
      'What the Council decided is not fully in the record. What is: {faction} arrived in the {region} with different positions and left with one. {figure} describes the process as "the slow convergence of separate certainties into shared purpose." The Grid calls this governance.',
      'Deliberation is invisible in the archive until it produces action. The council {faction} held in the {region} has produced action — which means the deliberation happened, which means it is now part of the record too. History often works backward through its own evidence.',
    ],
  },

  THE_CARTOGRAPHY: {
    loreType:'THE_CARTOGRAPHY', icon:'⊞',
    ruleApplied:'Rule 21: The Cartography',
    ruleExplanation:'When a token from the 2,000–3,000 range acts, the Chronicle records a cartographic event — the systematic mapping of territory by a presence from the great middle registers, neither ancient nor from the deep margin.',
    headlines:[
      'A New Map of the {region} Is Filed with the Archive',
      '{faction} Complete Their Survey of the {region}',
      'The Grid Gets Clearer: Cartographic Work in the {region}',
      '{figure} Adds the {region} to the Definitive Record',
    ],
    bodies:[
      'Every map is a claim — a statement about what exists and where. The survey completed in the {region} this epoch adds to the great cartographic project of the {era}: the ongoing effort to make the Grid legible, to replace conjecture with coordinate, rumor with record.',
      '{faction} do not map for the sake of possession. They map for the sake of understanding. The new survey of the {region} will be incorporated into the central Atlas — and the Atlas, once updated, changes how everyone sees the territory it covers.',
      'The cartographic tradition in the Grid is older than most factions. {figure} traces its origins to the first wanderers who needed to find their way back. The survey of the {region} today is continuous with that impulse: I was here, and this is what I found.',
      'A portion of the {region} was previously listed as unmappable — too unstable, too changeable to pin down with coordinates. The new survey disagrees. {faction} have produced something the Archive did not expect: proof that the unmappable has a shape.',
    ],
  },

  ECHO_OF_THE_ANCIENT: {
    loreType:'ECHO_OF_THE_ANCIENT', icon:')',
    ruleApplied:'Rule 22: Echo of the Ancient',
    ruleExplanation:'When a founding-era presence (tokenId < 1,000) acts in the same region as a recent event, the Chronicle records an echo — the ancient world responding to the new, history folding back on itself.',
    headlines:[
      'The Old World Answers: An Ancient Echo in the {region}',
      '{faction} Document the Return of a Founding Voice',
      'An Echo Crosses the Ages: The {region} Remembers',
      '{figure} Finds the Ancient Pattern Repeating',
    ],
    bodies:[
      'Some acts are new. Others are repetitions of acts so old that the original is no longer in living memory — only the echo remains. What {faction} recorded in the {region} this epoch was of the second kind. A pattern from the founding era, recurring. The Grid remembers what its inhabitants forget.',
      'The scholars of {faction} have a methodology for identifying echoes: they look for actions that match the rhythm and proportion of earlier, founding-era events. The record from the {region} matched three such patterns simultaneously. {figure} called it "the past speaking through the present\'s mouth."',
      '{region} has been the site of echoes before — moments when something old recurred in something new. The founding presence that acted here today did not know it was echoing anything. That is what makes it genuine. An echo is not a quotation. It is the world\'s own repetition.',
      'History in the Grid does not move in a straight line. It spirals. {faction} study the spiral — tracking where new actions rhyme with old ones, where the present reveals its debt to the past. The echo in the {region} is a line in that account.',
    ],
  },

  BORDER_CROSSING: {
    loreType:'BORDER_CROSSING', icon:'|',
    ruleApplied:'Rule 23: Border Crossing',
    ruleExplanation:'When consecutive events occur in regions that the Archive considers adjacent or opposing (determined by token ID proximity), the Chronicle records a border crossing — movement between established territories.',
    headlines:[
      'The Boundary Is Crossed: {faction} Record a Passage',
      'Between Two Worlds: A Border Crossing in the {region}',
      '{figure} Crosses Into Contested Territory',
      'Boundaries Tested: The {region} Sees Movement Between Claims',
    ],
    bodies:[
      'Every border is a theory about where one thing ends and another begins. The crossing recorded in the {region} challenges the theory. {faction} have been mapping this boundary for the better part of the {era}, and what they understood as fixed has proven more permeable than the Archive suggested.',
      'Borders invite crossing. This is their fundamental tension — they declare where one domain ends, and in doing so, they define precisely where the next begins. The crossing in the {region} was not defiant. It was simply the next logical step in someone\'s path.',
      '{figure} has a particular interest in border zones — the spaces where two territories overlap in ambiguity. The crossing recorded today in the {region} happened in exactly such a zone. {faction} have updated the map. The update will require updating other maps in turn.',
      'The Grid is not a fixed geometry. Its borders shift with the movements of its inhabitants. The crossing in the {region} is both an effect of the current political geography and a cause of the next one. {faction} note it as: consequential in both directions.',
    ],
  },

  THE_RECKONING: {
    loreType:'THE_RECKONING', icon:'=',
    ruleApplied:'Rule 24: The Reckoning',
    ruleExplanation:'When the cumulative event count is divisible by 10 (but not 25), the Chronicle records a reckoning — a moment of accounting, when the Grid tallies what has accumulated and acknowledges the weight of its own record.',
    headlines:[
      'The Archive Takes Stock: A Reckoning Is Entered',
      '{faction} Count What Has Been Built in the {region}',
      'The Tally Is Read: What the {era} Has Produced So Far',
      '{figure} Presents the Record to the {region}',
    ],
    bodies:[
      'Reckonings are not dramatic. They are precise. The Archive counts what has occurred, notes what has changed, maps the delta between where the Grid was and where it is. What {faction} have produced in the {region} today is a reckoning — the most honest kind of document: the simple account.',
      'The tradition of counting matters. In an age of declarations and migrations and grand gestures, the reckoning performs a different service: it insists on the literal. {figure} has kept a private count running alongside the Archive\'s official record. Today, they matched.',
      '{faction} gathered in the {region} to perform the count. The methodology was the same as always: every event, every inscription, every offering — recorded, weighted, summed. The result is not dramatic. It is not meant to be. It is meant to be true.',
      'History without accounting is narrative. Accounting without narrative is ledger. The reckoning recorded today in the {region} is the Grid\'s effort to be both — to count truthfully and to let the count mean something.',
    ],
  },

  SIGNAL_LOST: {
    loreType:'SIGNAL_LOST', icon:'×',
    ruleApplied:'Rule 25: Signal Lost',
    ruleExplanation:'When a previously active address goes silent after a notable event, the Chronicle records a lost signal — a presence that was vocal and has become quiet, for reasons the Archive can only speculate about.',
    headlines:[
      'A Voice Goes Quiet: Signal Lost in the {region}',
      '{faction} Log the Silence Where There Was Once Word',
      'The Transmission Ends: A Known Presence Falls Silent',
      '{figure} Notes the Absence That Speaks Loudly',
    ],
    bodies:[
      'The Archive does not only record presences. It also records absences — the shapes left by those who were here and are no longer transmitting. The signal lost in the {region} belonged to a voice {faction} had grown accustomed to receiving. Its silence is, in its own way, a new kind of transmission.',
      'Some silences are planned. Others happen. {faction} cannot determine, from the Archive alone, which category this one falls into. What they can determine: the {region} is quieter than it was, and quiet, in a place that was previously loud, is a fact that requires documentation.',
      '{figure} first noticed the absence three epochs ago. The signal that had been consistent from the {region} had simply stopped. No final entry, no formal conclusion. Just the cessation of something that had been ongoing.',
      'Every story the Archive holds will eventually go silent. Most do so gradually, through a long trailing off. Some stop abruptly. The lost signal in the {region} was abrupt. {faction} have marked the site for observation.',
    ],
  },

  SIGNAL_FOUND: {
    loreType:'SIGNAL_FOUND', icon:'*',
    ruleApplied:'Rule 26: Signal Found',
    ruleExplanation:'When an address reappears after a long absence (many blocks of silence), the Chronicle records a signal found — a voice that went quiet has returned, and its return carries the weight of everything that happened in the interval.',
    headlines:[
      'A Lost Signal Returns: The {region} Receives Transmission',
      '{faction} Confirm: A Familiar Voice Has Come Back',
      'After the Long Silence, a Return Is Recorded',
      '{figure} Marks the Moment of Reemergence',
    ],
    bodies:[
      'The signal from the {region} had been absent for long enough that {faction} had moved it from "inactive" to "lost." Today it returned. Not diminished by the silence — if anything, stronger. As if the interval had been preparation rather than absence.',
      '{figure} has a record of every signal that went quiet. It is a long record. Most signals that fall silent stay silent. When one returns, it carries the rare weight of what was endured in the quiet. The reemergence in the {region} is that weight, made visible.',
      'The Archive cannot record what happens in the silences between entries. But it can record the return — and the return, sometimes, implies everything that came before it. The presence back in the {region} today seems to have been somewhere that changed them.',
      '{faction} note the return not with fanfare but with attention. A signal found is a signal that survived. The {region} has a presence again that it was not sure it would see again. The scholars mark it carefully: this one came back.',
    ],
  },

  DEBT_RECORDED: {
    loreType:'DEBT_RECORDED', icon:'‖',
    ruleApplied:'Rule 27: Debt Recorded',
    ruleExplanation:'When a BurnRevealed event involves a token that has been transformed previously, the Chronicle notes a debt recorded — a prior act whose consequences are now being formally acknowledged in the Lattice.',
    headlines:[
      'The Debt Is Acknowledged: A Prior Act Finds Its Consequence',
      '{faction} Record What Was Owed and What Was Paid',
      'The Lattice Closes an Account in the {region}',
      '{figure} Marks the Settlement of a Long-Standing Debt',
    ],
    bodies:[
      'Every act in the Grid creates a consequence. Most consequences are immediate and obvious. Some take time. The debt recorded in the {region} this epoch traces back to an earlier act — something done, an obligation created, and now, finally, met. {faction} maintain the ledger of such things.',
      'The Lattice does not forget. What was registered as owed is still owed, across all the cycles of the {era}, until it is paid. {figure} has spent considerable time studying these deferred consequences — the long arcs between cause and effect that span epochs.',
      '{faction} classify this kind of entry separately in the Archive: a settled account. The {region} saw one today. What was outstanding has been paid. The ledger balances. The balance does not erase the debt — it completes it, which is different.',
      'History has a way of collecting what is owed to it. The debt settled in the {region} today was not recent — it dates to an earlier act, an earlier era. That it was paid at all is notable. That it was paid in the {region} is, {faction} believe, not coincidental.',
    ],
  },

  THE_TRANSLATION: {
    loreType:'THE_TRANSLATION', icon:'«»',
    ruleApplied:'Rule 28: The Translation',
    ruleExplanation:'When an event from a deep-margin tokenId (>7,000) occurs near in block time to an event from a founding-era tokenId (<1,500), the Chronicle records a translation — a moment of communication across the great divide of the Grid\'s inner geography.',
    headlines:[
      'The Old World Speaks to the New: A Translation Recorded',
      '{faction} Bridge Two Languages in the {region}',
      'Across the Divide: The {region} Sees a Transmission Made Legible',
      '{figure} Translates What Could Not Be Understood Before',
    ],
    bodies:[
      'The founding presences and the outer-margin voices speak different dialects of Grid. For most of the {era}, they have not spoken to each other — not because of conflict, but because no adequate translation existed. What happened in the {region} today was, for the first time, a genuine exchange.',
      '{figure} has worked at this problem for most of their career: how do you translate between registers that developed in isolation from each other? The answer, demonstrated in the {region} today, is not through words but through action. The translation was performed, not stated.',
      'The distance between the founding presences and the deep margins is not merely numerical. It is civilizational. What {faction} witnessed in the {region} was a bridge built, briefly, across that distance. Whether the bridge holds is a question for the next epoch.',
      '{faction} log this as one of the rarest event types in the Archive: genuine cross-register communication. The {region} has seen border crossings before. It has not, in recent memory, seen translation at this depth.',
    ],
  },

  SILENT_WITNESS: {
    loreType:'SILENT_WITNESS', icon:'◌',
    ruleApplied:'Rule 29: Silent Witness',
    ruleExplanation:'When two or more events involve the same region in close block proximity but from entirely different addresses, the Chronicle records a silent witness — a shared moment that neither party acknowledged, but both experienced.',
    headlines:[
      'Two Paths Cross Without Meeting: A Witness Is Recorded',
      '{faction} Note the Unacknowledged Shared Moment',
      'Present at the Same Event, Unknown to Each Other',
      '{figure} Reconstructs the Moment Neither Witnessed Fully',
    ],
    bodies:[
      'In a world as large as the Grid, it is common for two presences to inhabit the same space without knowing the other is there. The {region} saw this today — two separate acts, from two separate origins, overlapping in time and place without acknowledgment. {faction} pieced it together from the independent records.',
      'The Archive is the only entity that can see what each individual participant cannot: the whole picture. What appeared in the {region} as two separate events was, from the Archive\'s perspective, a single composite event with two authors who never met. {figure} notes: "This is how most of history is written."',
      'Witnessing requires presence but not contact. The two presences in the {region} were witnesses to each other\'s acts without knowing it. {faction} log this as a silent witness event: an experience shared by parties who will never share its significance directly.',
      'The {region} will carry the record of both presences. Neither knows the other was there. The Archive knows. In the long accounting, this is the kind of fact that sometimes proves to have been the most important one.',
    ],
  },

  PASSAGE_SEALED: {
    loreType:'PASSAGE_SEALED', icon:'□',
    ruleApplied:'Rule 30: Passage Sealed',
    ruleExplanation:'When an address that has been consistently active suddenly produces a final event with a distinctive on-chain pattern, the Chronicle records a passage sealed — an intentional conclusion, a deliberate final mark.',
    headlines:[
      'The Last Entry: A Passage Is Sealed in the {region}',
      '{faction} Record a Deliberate Conclusion',
      'The Final Mark Is Made: {region} Receives a Closing',
      '{figure} Notes the Passage That Has Ended',
    ],
    bodies:[
      'Most presences in the Archive don\'t conclude — they simply stop. But occasionally, the Archive records what can only be described as a deliberate ending: a final entry that has the quality of a seal, of closure, of intention. The {region} received one today.',
      '{faction} have a methodology for distinguishing accidental cessation from deliberate conclusion. The entry in the {region} passes the methodology\'s tests: the timing, the scale, the relationship to prior entries all suggest this was chosen, not simply what happened next.',
      'To seal a passage is an act of authorship. It says: this arc is complete. Whatever comes next is a different arc, from a different beginning. The presence that sealed their passage in the {region} has made a statement about the shape of their contribution. {figure} calls this "the rarest kind of self-knowledge in the record."',
      'The Archive holds the full record of this presence — every entry across every epoch. What was sealed in the {region} today is the final chapter of that particular story. The Archive keeps the whole. The whole is now, at last, complete.',
    ],
  },

  THE_FORGETTING: {
    loreType:'THE_FORGETTING', icon:'~',
    ruleApplied:'Rule 31: The Forgetting',
    ruleExplanation:'When the block gap between events exceeds 50,000 blocks, the Chronicle records a forgetting — a stretch of time so long that the continuity of the record itself comes into question, and the world must reintroduce itself to its own history.',
    headlines:[
      'The Long Dark: A Forgetting Is Recorded in the {region}',
      '{faction} Document the Interval That Changed Everything',
      'The World Forgot, Then Remembered: A Record of the Gap',
      '{figure} Marks the Return After the Great Silence',
    ],
    bodies:[
      'There are gaps in the Archive that are not absences but eras — stretches of time so extended that what came after them needed to rediscover what came before. The {region} has just emerged from such a period. {faction} are in the process of reconciling what they knew with what the interval produced.',
      'When enough time passes without record, the record itself becomes strange. {figure} describes the experience of reading an Archive entry from before a great forgetting: "You know it is yours, but you cannot remember writing it. The world that wrote it seems very far away."',
      '{faction} have protocols for post-forgetting documentation. They begin not with the new events but with the old — with re-reading, re-verifying, re-establishing the continuity of the record across the gap. The {region} is the site of that re-establishment.',
      'The forgetting was not chosen. But emerging from it requires choice — the choice to remember, to reconnect, to pick up the thread where it was dropped. {faction} have made that choice. The Archive is continuous again. The gap is now part of the record rather than a hole in it.',
    ],
  },

  RETURN_FROM_MARGIN: {
    loreType:'RETURN_FROM_MARGIN', icon:'←',
    ruleApplied:'Rule 32: Return from Margin',
    ruleExplanation:'When a deep-margin presence (tokenId > 8,500) acts in a way that mirrors an earlier center-region action, the Chronicle records a return from the margin — the far edge reflecting the center\'s own history back at it.',
    headlines:[
      'The Margin Returns What the Center Sent: {region} Receives',
      '{faction} Document a Reflection from the Outer Edge',
      'What Was Sent Out Has Come Back: A Return Recorded',
      '{figure} Recognizes the Echo from the Far Margin',
    ],
    bodies:[
      'The Grid is a system, and systems return what they receive — though the return is never identical to the sending. The margin has been holding something from the center for a long time. What appeared in the {region} today was that holding\'s resolution.',
      '{faction} have a long-standing theory: the outer margins are not peripheral but reflective. They receive what the center generates and return a transformed version, delayed by the distance of transmission. The return recorded in the {region} is the most compelling evidence for the theory the Archive has seen this cycle.',
      'What goes to the edges comes back different. The {region} received, today, something that left it long ago — transformed by the margin\'s particular relationship to time and distance. {figure} says this is not unusual. It is simply usually too subtle to see.',
      'The Cartographers have mapped the grid extensively inward. They have paid less attention to what comes back from the direction they\'ve already documented. The return in the {region} invites a different cartography: one that maps not territory but trajectories, not places but paths.',
    ],
  },

  ARCHIVE_CORRECTION: {
    loreType:'ARCHIVE_CORRECTION', icon:'∆',
    ruleApplied:'Rule 33: Archive Correction',
    ruleExplanation:'When a new event contradicts or complicates the pattern established by the previous three events from the same address, the Chronicle records an archive correction — the world revising what the record thought it knew.',
    headlines:[
      'The Record Is Revised: An Archive Correction Entered',
      '{faction} Update What They Thought They Knew About the {region}',
      'The Pattern Breaks: A Correction Is Filed',
      '{figure} Acknowledges the Revision That Was Needed',
    ],
    bodies:[
      'The Archive is not infallible. It is a record of what was observed, not of what is true — and sometimes those two things diverge. The correction filed in the {region} today is evidence of intellectual honesty: {faction} knew the prior entry was incomplete, and they said so.',
      '{figure} has long argued that the Archive\'s authority depends on its willingness to correct itself. An archive that never revises is not a record but a monument. The correction entered in the {region} is the Archive working as intended.',
      'What needed correcting was not dramatic — a matter of proportion rather than substance. But {faction} insist that corrections at any scale matter. An archive that tolerates small inaccuracies will eventually tolerate large ones.',
      'The world did not behave as {faction} predicted in the {region}. Rather than ignore this, they entered the correction. The prior entry stands — but now with a note: there is more to this story than the original record captured. The Archive is honest about its own limits.',
    ],
  },

  THE_INTERLUDE: {
    loreType:'THE_INTERLUDE', icon:'⋯',
    ruleApplied:'Rule 34: The Interlude',
    ruleExplanation:'When events cluster close together and then pause, the Chronicle records an interlude — a brief rest in the narrative that gives the surrounding events their shape and allows meaning to accumulate before the next sequence begins.',
    headlines:[
      'A Rest Between Events: The {region} Enters an Interlude',
      '{faction} Mark the Space Where the Story Catches Its Breath',
      'The Pause Is Part of the Record: An Interlude Noted',
      '{figure} Uses the Interlude to Observe What Has Built',
    ],
    bodies:[
      'Music requires rests. Stories require pauses. The Grid, which produces both, has entered a brief interlude in the {region} — not silence, not forgetting, but a deliberate space between sequences. {faction} mark it not as absence but as structure.',
      'The interlude in the {region} gives the events around it their meaning. What came before needed this pause to settle; what comes after will be legible because of it. {figure} has always argued that the spaces in the Archive matter as much as the entries.',
      '{faction} do not record interludes because nothing is happening. They record them because the right kind of nothing is itself a kind of something — a structural element that holds the surrounding events in relationship to each other.',
      'The readers of the Archive sometimes skip the interludes. {figure} advises against it: the pauses tell you where one thought ends and another begins. Without them, the record is all words, no sentences.',
    ],
  },

  LINEAGE_NOTED: {
    loreType:'LINEAGE_NOTED', icon:'╎',
    ruleApplied:'Rule 35: Lineage Noted',
    ruleExplanation:'When a token from the same numerical range as three or more previous events acts, the Chronicle records a lineage — a pattern that suggests these presences are connected across time by more than coincidence.',
    headlines:[
      'A Pattern Across Time: {faction} Record a Lineage',
      'The Same Bloodline, Again: A Lineage Entry in the {region}',
      '{figure} Traces the Thread That Connects These Acts',
      'Not Coincidence: A Lineage Is Documented in the {region}',
    ],
    bodies:[
      'Patterns that recur across the Archive are not accidents. When the same numerical range produces event after event, across different epochs, the scholars of {faction} begin to look for the explanation. The lineage noted in the {region} today is the kind of recurrence that demands one.',
      '{figure} maintains a separate index: presences that appear in clusters, that seem to share some quality of approach or timing or territory that cannot be explained by independent probability. The lineage that has emerged in the {region} belongs in that index.',
      'The Grid is not fully random. The founding principles that organized the first 10,000 presences left their imprint on which ones are likely to act together, to care about the same territories, to make the same choices across time. {faction} call this imprint lineage.',
      'Three events from the same register, same general territory, same approximate scale of engagement. {faction} filed them separately at first. Then they noticed. The Archive now has a cross-reference that will make the next such event legible from the start.',
    ],
  },

  THRESHOLD_WATCHED: {
    loreType:'THRESHOLD_WATCHED', icon:'|◁',
    ruleApplied:'Rule 36: Threshold Watched',
    ruleExplanation:'When an event occurs very close to an era threshold (within 3 of the next milestone), the Chronicle records a threshold watched — the world poised at the edge of change, aware that transformation is imminent.',
    headlines:[
      'The Edge of a New Age: {faction} Watch the Threshold',
      'Almost: The {region} Stands at the Brink of a New Era',
      '{figure} Counts What Remains Before the World Changes',
      'The Threshold Is Near: Every Act Now Carries Extra Weight',
    ],
    bodies:[
      'Not every event is equal in its historical weight. Some occur in the middle of ages, where they contribute to a continuity. Others occur at the margins of eras — close to the threshold where one age ends and another begins. Those events carry the particular gravity of imminence.',
      '{faction} have stationed observers at the current threshold point. They are not waiting for drama — they are waiting for accuracy. When the era turns, the record needs to note it precisely. {figure} is among the observers. Everything in the {region} is being watched with more than ordinary attention.',
      'The world is almost a different world. The threshold separating the present era from the next is only a few events away. {faction} note that in these final moments before transition, the Grid has a particular texture — aware of itself, anticipatory, already beginning to organize around what will come.',
      'What does it feel like to act at the brink of an era? The presence active in the {region} today may not know that their act is one of the last of the current age. The Archive knows. The entry has been marked accordingly.',
    ],
  },

  THE_ACCORD: {
    loreType:'THE_ACCORD', icon:'≡',
    ruleApplied:'Rule 37: The Accord',
    ruleExplanation:'When two events from different factions (different address ranges suggesting different communities) occur in close block proximity to the same region, the Chronicle records an accord — a moment of alignment between parties that usually operate independently.',
    headlines:[
      'Alignment in the {region}: An Accord Is Reached',
      '{faction} and Another Power Find Common Ground',
      'The Unexpected Agreement: {region} Witnesses an Accord',
      '{figure} Brokers What the Grid Needed: A Shared Position',
    ],
    bodies:[
      'The Grid has seen many declarations. It has seen fewer accords. A declaration is a single voice; an accord requires two — requires that two separate interests find, against probability, a shared territory. What {faction} and their counterparts produced in the {region} today was an accord.',
      'Accords are fragile. They exist in the space between interests, held there by mutual benefit and the threat of the alternative. {figure} has studied historical accords and their half-lives. Some last an epoch. Some last a day. The one reached in the {region} has the quality, {faction} note, of something with some time in it.',
      'What the Archive records as an accord is, at the level of the participants, simply two separate decisions that happened to be compatible. {faction} did not set out to agree with anyone. Neither did the others. But the Grid produced compatible actions, and compatibility, when documented, becomes relationship.',
      'The history of the Grid is not only a history of conflict and competition. It is also a history of these moments — unexpected alignments, temporary coincidences of interest that produced something neither party could have produced alone. The accord in the {region} belongs to that history.',
    ],
  },

  DUST_RECORD: {
    loreType:'DUST_RECORD', icon:'·',
    ruleApplied:'Rule 38: Dust Record',
    ruleExplanation:'When an event produces the smallest possible measurable output (1 pixel or 1 action point), the Chronicle records a dust record — the minimum viable mark, the irreducible act of presence, the quietest possible statement of existence.',
    headlines:[
      'The Minimum Mark: A Dust Record in the {region}',
      '{faction} Document the Smallest Possible Statement',
      'One Pixel, One Truth: A Dust Record Entered',
      '{figure} Notes: Even the Smallest Mark Is a Mark',
    ],
    bodies:[
      'The dust record is the most honest entry in the Archive: the smallest possible act of presence. One unit of change, deliberately made. No more than the minimum required to say: I was here. The {region} received this message today — not in its grandeur but in its irreducible fact.',
      '{faction} have a special regard for dust records. In a world that often values scale, the minimum mark is a philosophical position: it insists that presence matters regardless of magnitude. {figure} keeps a separate index of dust records. It is one of the longer entries in the secondary Archive.',
      'To make the minimum mark is not to fail at making a larger one. It is to choose precision over scale, presence over impact. The {region} received that choice today. {faction} note: the smallest marks are often the ones that persist the longest, because they ask so little of the surface they occupy.',
      'The Archive\'s instruments are calibrated to catch the minimum. They catch everything from the grand migration to the single unit of change — because the single unit, on the right surface, in the right moment, can be the most important mark of all. The dust record in the {region} is filed with full honors.',
    ],
  },

  EMISSARY_ARRIVES: {
    loreType:'EMISSARY_ARRIVES', icon:'»',
    ruleApplied:'Rule 39: Emissary Arrives',
    ruleExplanation:'When a new address appears in the Grid but their token ID is from a founding-era range (<2,000), the Chronicle records an emissary — a new voice carrying an old mandate, arriving as a representative of the deep past.',
    headlines:[
      'An Emissary from the Old World Arrives in the {region}',
      '{faction} Receive a Representative from the Ancient Register',
      'New Voice, Old Mandate: An Emissary Is Welcomed',
      '{figure} Greets the One Who Was Sent',
    ],
    bodies:[
      'An emissary is different from a wanderer. A wanderer arrives without agenda, exploring. An emissary arrives with purpose — carrying something from the world that sent them. The presence that appeared in the {region} today brought with them the weight of an older register. New to the {era}, but representing something older.',
      '{faction} greet emissaries according to old protocol: with recognition but without assumption. The mandate an emissary carries is not always stated. Often it is revealed through their subsequent acts. The emissary in the {region} has made their first act. {figure} is already studying it.',
      'The founding-era register does not typically send emissaries. When it does, the recipients pay close attention. Whatever brought this presence to the {region} — whatever connection they carry to the origins of the Grid — {faction} believe it is worth understanding.',
      'The {region} has received many kinds of arrivals. This is one of the rarer ones: a new face carrying an old number, an unfamiliar presence with deep roots. {faction} have opened a new file. They suspect this emissary\'s story is only beginning.',
    ],
  },

  THE_LONG_COUNT: {
    loreType:'THE_LONG_COUNT', icon:'∞',
    ruleApplied:'Rule 40: The Long Count',
    ruleExplanation:'Every 40th event in the Chronicle triggers a Long Count entry — honoring the 40×40 Grid that is the foundation of all Normies. These are the rarest structural entries, marking the deep rhythm of the world\'s own architecture.',
    headlines:[
      'The Grid Counts Itself: A Long Count Entry Is Recorded',
      '{faction} Mark the Fortieth Interval in the {region}',
      'The Architecture Speaks: The 40×40 Grid Acknowledges Itself',
      '{figure} Records the Long Count That the Grid Has Always Known',
    ],
    bodies:[
      'The Normies Grid is forty columns wide and forty rows deep. Every fortieth event in the Chronicle, the world counts itself — acknowledges the architecture that underlies all presence, all territory, all transformation. This is that count. {faction} gathered in the {region} to mark it with appropriate gravity.',
      'The number forty is not arbitrary in the Grid. It is structural — the dimension of the canvas on which every Normie exists, the measure of the space that every act of transformation works within. When the Chronicle reaches its fortieth interval, it is not counting events. It is counting the Grid\'s own heartbeat.',
      '{figure} explains the Long Count to newcomers this way: "Imagine that the world you live in has a rhythm. Forty events, and the world reminds you of its own dimensions. It says: you are here, in a forty-by-forty space, and everything that has happened has happened within that space." The {region} hosted that reminder today.',
      'The Archive was designed with the Long Count in mind. Every fortieth entry is set aside — not for the most dramatic event, but for the most structural one. The Grid returning to its own measurement, acknowledging its own architecture. {faction} call it the deepest entry in any Chronicle cycle.',
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

function selectRule(
  event: IndexedEvent,
  index: number,
  allEvents: IndexedEvent[],
  cumCount: number,
  prev: IndexedEvent | null
): string {
  const tokenId = Number(event.tokenId)
  const count = Number(event.count)
  const isVeteran = allEvents.slice(0, index).some(e => e.owner === event.owner)
  const prevSameOwner = allEvents.slice(0, index).filter(e => e.owner === event.owner)

  // ── TIER 1: Structural milestones (highest priority) ──────────────────────
  // Long Count: every 40th event (honors the 40×40 Grid)
  if (cumCount > 0 && cumCount % 40 === 0) return 'THE_LONG_COUNT'
  // Prophecy: every 25th (not already taken by long count)
  if (cumCount > 0 && cumCount % 25 === 0) return 'PROPHECY_SPOKEN'
  // Reckoning: every 10th
  if (cumCount > 0 && cumCount % 10 === 0) return 'THE_RECKONING'
  // New era
  if (ERAS.findIndex(e => e.threshold === cumCount) > 0) return 'NEW_ERA_DAWN'
  // Threshold watched: within 3 of next era
  const nextEra = ERAS.find(e => e.threshold > cumCount)
  if (nextEra && nextEra.threshold - cumCount <= 3) return 'THRESHOLD_WATCHED'

  // ── TIER 2: Rare on-chain patterns ────────────────────────────────────────
  if (isRareTxHash(event.transactionHash)) return 'ARTIFACT_DISCOVERY'
  if (prev && prev.blockNumber === event.blockNumber) return 'CONVERGENCE_POINT'

  // ── TIER 3: Temporal gaps ─────────────────────────────────────────────────
  if (prev && event.blockNumber - prev.blockNumber > 50000n) return 'THE_FORGETTING'
  if (prev && event.blockNumber - prev.blockNumber > 10000n) return 'LULL_BETWEEN_AGES'
  // Brief interlude: small gap after a cluster
  if (prev && event.blockNumber - prev.blockNumber > 3000n && event.blockNumber - prev.blockNumber < 6000n) {
    const seed = seedN(event.tokenId, event.blockNumber)
    if (seed % 5 === 0) return 'THE_INTERLUDE'
  }

  // ── TIER 4: Returning/returning signals ───────────────────────────────────
  if (isVeteran && prevSameOwner.length >= 1) {
    const lastSeen = prevSameOwner[prevSameOwner.length - 1]
    const gap = event.blockNumber - lastSeen.blockNumber
    if (gap > 20000n) return 'SIGNAL_FOUND'
    if (gap < 500n) return 'COUNCIL_CONVENES'
  }

  // ── TIER 5: Token-range specific rules ────────────────────────────────────
  if (tokenId < 500) {
    // Founding-era tokens — use ECHO vs FOUNDATION alternating
    const seed = seedN(event.tokenId, event.blockNumber, 5)
    if (seed % 3 === 0 && index > 10) return 'ECHO_OF_THE_ANCIENT'
    return 'FOUNDATION_STONE'
  }
  if (tokenId >= 500 && tokenId < 1000) return 'FOUNDATION_STONE'
  if (tokenId >= 1000 && tokenId < 1500 && !isVeteran) return 'EMISSARY_ARRIVES'
  if (tokenId >= 2000 && tokenId < 3000) {
    const seed = seedN(event.tokenId, event.blockNumber, 11)
    if (seed % 4 === 0) return 'THE_CARTOGRAPHY'
  }
  if (tokenId >= 5000 && tokenId <= 6000) {
    const seed = seedN(event.tokenId, event.blockNumber, 3)
    return seed % 3 === 0 ? 'THE_UNMAPPED' : 'SIGNAL_LOST'
  }
  if (tokenId > 8500) {
    const seed = seedN(event.tokenId, event.blockNumber, 9)
    if (seed % 3 === 0 && index > 5) return 'RETURN_FROM_MARGIN'
    return 'RECORD_OF_THE_DEEP'
  }
  if (tokenId > 8000) return 'RECORD_OF_THE_DEEP'

  // ── TIER 6: Prime presence ────────────────────────────────────────────────
  if (isPrime(tokenId)) {
    return 'ORACLES_OBSERVATION'
  }

  // ── TIER 7: BurnRevealed specific ─────────────────────────────────────────
  if (event.type === 'BurnRevealed') {
    if (count >= 10) return 'POWER_INFUSION'
    if (count === 1) return 'DUST_RECORD'
    if (isVeteran && prevSameOwner.length >= 2) return 'DEBT_RECORDED'
    if (isVeteran) return 'RITE_OF_RECOGNITION'
    return 'ETHEREAL_INFUSION'
  }

  // ── TIER 8: PixelsTransformed scale ───────────────────────────────────────
  if (count >= 200) return 'GRAND_MIGRATION'
  if (count >= 50 && count % 50 === 0) return 'FACTION_DECLARATION'
  if (count >= 50) return 'TERRITORIAL_CLAIM'
  if (count === 1) return 'DUST_RECORD'

  // ── TIER 9: Veteran vs newcomer ───────────────────────────────────────────
  if (isVeteran) {
    const seed = seedN(event.tokenId, event.blockNumber, 23)
    const roll = seed % 6
    if (roll === 0) return 'FACTION_RISE'
    if (roll === 1) return 'BORDER_CROSSING'
    if (roll === 2 && prevSameOwner.length >= 3) return 'LINEAGE_NOTED'
    if (roll === 3) return 'ARCHIVE_CORRECTION'
    return 'SCHOLARS_WORK'
  }

  // ── TIER 10: New address patterns ─────────────────────────────────────────
  if (!isVeteran) {
    const seed = seedN(event.tokenId, event.blockNumber, 29)
    const roll = seed % 5
    if (roll === 0) return 'SILENT_WITNESS'
    if (roll === 1) return 'BORDER_CROSSING'
    if (roll === 2) return 'THE_ACCORD'
    return 'WANDERERS_PASSAGE'
  }

  // ── FALLBACK ───────────────────────────────────────────────────────────────
  return 'SUBTLE_INSCRIPTION'
}

export function generateStoryEntries(events: IndexedEvent[], startCount = 0): StoryEntry[] {
  // Track last appearance per owner for signal-lost detection
  const ownerLastSeen: Map<string, number> = new Map()

  return events.map((event, index) => {
    const cumCount = startCount + index + 1
    const prev = index > 0 ? events[index - 1] : null
    const ruleKey = selectRule(event, index, events, cumCount, prev)
    const rule = RULES[ruleKey] ?? RULES['SUBTLE_INSCRIPTION']
    const era = getEra(cumCount)
    const ctx = buildCtx(event.tokenId, event.blockNumber, era)
    const s = seedN(event.tokenId, event.blockNumber)
    const s2 = seedN(event.tokenId, event.blockNumber, 3)
    const headline = fill(pick(rule.headlines, s), ctx)
    const body = fill(pick(rule.bodies, s2), ctx)

    ownerLastSeen.set(event.owner, index)

    const featuredTypes = ['PROPHECY_SPOKEN','NEW_ERA_DAWN','ARTIFACT_DISCOVERY','THE_LONG_COUNT','GRAND_MIGRATION','CONVERGENCE_POINT']

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
    icon:'◈', featured:true,
    sourceEvent:{ type:'genesis', tokenId:'All 10,000', blockNumber:'Genesis', txHash:'N/A', count:'10000', ruleApplied:'Rule: World Genesis', ruleExplanation:'The Normies are 10,000 fully on-chain generative faces, CC0, on Ethereum mainnet. The Grid is 40×40 — the architecture that underlies every transformation.' },
  },
  {
    id:'primer-orders', eventType:'genesis', loreType:'GENESIS', era:'The Void Before',
    headline:'The Four Orders Declare Their Nature',
    body:'From the 10,000 emerged four great lineages: the Humans, adaptive and restless; the Cats, inscrutable and sovereign; the Aliens, cosmic and patient; the Agents, purpose-built and precise. Each lineage developed its own dialect of Grid-expression, its own territorial customs, its own relationship to the Canvas that underlies all things.',
    icon:'▦', featured:false,
    sourceEvent:{ type:'genesis', tokenId:'All 10,000', blockNumber:'19,500,001', txHash:'N/A', count:'10000', ruleApplied:'Rule: World Genesis', ruleExplanation:'The Four Orders correspond to the four trait Types in the Normies collection: Human, Cat, Alien, Agent.' },
  },
]

export { RULES }
