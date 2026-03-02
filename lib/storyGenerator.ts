import type { IndexedEvent } from './eventIndexer'

// ─────────────────────────────────────────────────────────────────────────────
// THE FIVE
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTERS = {
  LYRA: {
    name: 'Lyra', title: 'the Architect',
    pronoun: 'she', possessive: 'her',
    shortDesc: 'She has been building the same structure across Normia for three eras. Nobody knows what it is yet — not even her.',
  },
  VOSS: {
    name: 'Finn', title: 'the Breaker',
    pronoun: 'he', possessive: 'his',
    shortDesc: 'He burns what has calcified. The grid is lighter for it. So is he, in ways that are not entirely good.',
  },
  CAST: {
    name: 'The Cast', title: 'the Witness',
    pronoun: 'it', possessive: 'its',
    shortDesc: 'It has watched since the grid opened. It has never changed an outcome. It keeps asking itself if that matters.',
  },
  SABLE: {
    name: 'Cielo', title: 'the Keeper',
    pronoun: 'she', possessive: 'her',
    shortDesc: 'She maintains what everyone else ignores. Without her, half the zones Lyra built through would have gone dark.',
  },
  ECHO: {
    name: 'Echo', title: 'the Wanderer',
    pronoun: 'he', possessive: 'his',
    shortDesc: 'He moves through the outer zones where the map runs out. He finds things there that were not supposed to exist.',
  },
} as const

export type CharacterKey = keyof typeof CHARACTERS

// ─────────────────────────────────────────────────────────────────────────────
// ZONES
// ─────────────────────────────────────────────────────────────────────────────

export const ZONES = [
  'the Null District', 'the White Corridors', 'the Hollow', 'the Far Sectors',
  'the Dark Margin', 'the Cradle', 'the Dust Protocol', 'the Outer Ring',
  'the Deep Well', 'the Fault Line', 'the High Pass', 'the Old Crossing',
  'the Narrow Gate', 'the Salt Plane', 'the Grey Basin', 'the High Ground',
  'the Burn Fields', 'the Still Water', 'the Last Ridge', 'the Open Grid',
]

function zoneFor(tokenId: bigint): string {
  const h = Number((tokenId * 2654435761n) & 0xFFFFFFFFn)
  return ZONES[h % ZONES.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// ERAS
// ─────────────────────────────────────────────────────────────────────────────

export const ERAS = [
  { threshold: 0,    name: 'The First Days' },
  { threshold: 100,  name: 'The Waking' },
  { threshold: 300,  name: 'The Gathering' },
  { threshold: 700,  name: 'The Age of Claim' },
  { threshold: 1500, name: 'The Long Work' },
  { threshold: 3000, name: 'What Holds' },
  { threshold: 5000, name: 'The Old Country' },
  { threshold: 8000, name: 'The Long Memory' },
]

function getEra(n: number): string {
  let name = ERAS[0].name
  for (const e of ERAS) { if (n >= e.threshold) name = e.name }
  return name
}

// ─────────────────────────────────────────────────────────────────────────────
// WORLD STATE
// The story's living memory. Every entry is written knowing all of this.
// ─────────────────────────────────────────────────────────────────────────────

interface W {
  totalActs: number
  era: string

  // Territory
  lyraZones: string[]
  finnBurned: string[]
  cieloTended: string[]
  echoVisited: string[]

  // Counts
  lyraCount: number
  finnCount: number
  cieloCount: number
  echoCount: number

  // Story threads — what's unresolved, what's building
  lastBurnZone: string | null
  lastBurnWasLyras: boolean
  lyraRebuiltAfterBurn: boolean   // did Lyra come back after the last burn?
  consecutiveBurns: number
  finnBurnStreak: boolean          // Finn has burned 3+ without anyone else acting

  // Tension — rises with burns, eases with building and tending
  tension: number

  // The previous entry — so each entry can be written *in response* to it
  prev: {
    char: CharacterKey
    zone: string
    beat: Beat
    era: string
  } | null

  // Echo's running discovery thread
  echoDiscovery: string | null

  // Things Cielo is quietly holding
  cieloIsHolding: string[]

  // Open questions the narrative is carrying
  // (used to give prose something to reference without answering it)
  openQuestion: string | null
}

function freshW(): W {
  return {
    totalActs: 0, era: 'The First Days',
    lyraZones: [], finnBurned: [], cieloTended: [], echoVisited: [],
    lyraCount: 0, finnCount: 0, cieloCount: 0, echoCount: 0,
    lastBurnZone: null, lastBurnWasLyras: false, lyraRebuiltAfterBurn: false,
    consecutiveBurns: 0, finnBurnStreak: false,
    tension: 15,
    prev: null,
    echoDiscovery: null,
    cieloIsHolding: [],
    openQuestion: null,
  }
}

function advance(w: W, char: CharacterKey, zone: string, beat: Beat): void {
  w.totalActs++
  w.era = getEra(w.totalActs)

  if (char === 'LYRA') {
    w.lyraCount++
    if (!w.lyraZones.includes(zone)) w.lyraZones.push(zone)
    if (w.lastBurnZone === zone) w.lyraRebuiltAfterBurn = true
    w.consecutiveBurns = 0
    w.finnBurnStreak = false
    w.tension = Math.max(10, w.tension - 10)
    w.openQuestion = w.lastBurnZone && !w.lyraRebuiltAfterBurn
      ? `whether Lyra will come back to ${w.lastBurnZone}`
      : w.lyraCount > 3 ? `what Lyra is actually building` : null
  }

  if (char === 'VOSS') {
    w.finnCount++
    const wasLyras = w.lyraZones.includes(zone)
    if (!w.finnBurned.includes(zone)) w.finnBurned.push(zone)
    w.lyraZones = w.lyraZones.filter(z => z !== zone)
    w.lastBurnZone = zone
    w.lastBurnWasLyras = wasLyras
    w.lyraRebuiltAfterBurn = false
    w.consecutiveBurns++
    w.finnBurnStreak = w.consecutiveBurns >= 3
    w.tension = Math.min(100, w.tension + 22)
    w.openQuestion = wasLyras
      ? `whether what Finn just removed was the right thing to remove`
      : `whether the burns are adding up to something or just subtracting`
  }

  if (char === 'SABLE') {
    w.cieloCount++
    if (!w.cieloTended.includes(zone)) w.cieloTended.push(zone)
    if (w.finnBurned.includes(zone) && !w.cieloIsHolding.includes(zone))
      w.cieloIsHolding.push(zone)
    w.tension = Math.max(10, w.tension - 6)
  }

  if (char === 'ECHO') {
    w.echoCount++
    if (!w.echoVisited.includes(zone)) w.echoVisited.push(zone)
    if (!w.echoDiscovery) w.echoDiscovery = zone
    else if (w.echoCount % 4 === 0) w.echoDiscovery = zone
  }

  if (char === 'CAST') {
    // Cast doesn't change the world, but it holds the open question
  }

  w.prev = { char, zone, beat, era: w.era }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER ASSIGNMENT — round-robin, burns always Finn
// ─────────────────────────────────────────────────────────────────────────────

const ROTATION: CharacterKey[] = ['LYRA', 'VOSS', 'CAST', 'SABLE', 'ECHO']

function assignChar(event: IndexedEvent, idx: number): CharacterKey {
  if (event.type === 'BurnRevealed') return 'VOSS'
  return ROTATION[idx % 5]
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT TYPES — the narrative moment this entry is
// ─────────────────────────────────────────────────────────────────────────────

type Beat =
  | 'GENESIS'      // very first entries — the world opening
  | 'ERA_TURN'     // an era has changed
  | 'LONG_DARK'    // long silence in the chain
  | 'COINCIDENCE'  // two events same block
  | 'LYRA_BUILD'
  | 'LYRA_RETURN'  // Lyra builds back in a zone Finn burned
  | 'FINN_BURN'
  | 'FINN_BURNS_LYRA' // Finn burns specifically in Lyra's territory
  | 'FINN_STREAK'  // burning without stopping
  | 'CAST_LOG'
  | 'CAST_RECKONS' // Cast sees the full picture at a moment of high tension
  | 'CIELO_TEND'
  | 'CIELO_AFTER_BURN'
  | 'ECHO_MOVE'
  | 'ECHO_FIND'

function getBeat(
  event: IndexedEvent,
  char: CharacterKey,
  cumCount: number,
  prev: IndexedEvent | null,
  w: W,
): Beat {
  if (cumCount <= 5) return 'GENESIS'
  if (ERAS.some(e => e.threshold === cumCount && e.threshold > 0)) return 'ERA_TURN'
  if (prev && event.blockNumber - prev.blockNumber > 50000n) return 'LONG_DARK'
  if (prev && prev.blockNumber === event.blockNumber) return 'COINCIDENCE'

  const zone = zoneFor(event.tokenId)

  if (char === 'VOSS') {
    if (w.finnBurnStreak) return 'FINN_STREAK'
    if (w.lyraZones.includes(zone)) return 'FINN_BURNS_LYRA'
    return 'FINN_BURN'
  }
  if (char === 'LYRA') {
    if (w.finnBurned.includes(zone)) return 'LYRA_RETURN'
    return 'LYRA_BUILD'
  }
  if (char === 'CAST') {
    return w.tension > 65 ? 'CAST_RECKONS' : 'CAST_LOG'
  }
  if (char === 'SABLE') {
    return w.finnBurned.includes(zone) ? 'CIELO_AFTER_BURN' : 'CIELO_TEND'
  }
  if (char === 'ECHO') {
    return w.echoCount > 0 && w.echoCount % 4 === 0 ? 'ECHO_FIND' : 'ECHO_MOVE'
  }
  return 'CAST_LOG'
}

// ─────────────────────────────────────────────────────────────────────────────
// THE NARRATOR
//
// One voice. The Cast tells the whole story.
// This is the hard part to get right.
//
// What makes it feel alive:
//   - The narrator knows what just happened and has not forgotten it
//   - The narrator knows what is unresolved and holds it open
//   - Characters are present *in each other's entries* — Finn exists in
//     Lyra's entries, Cielo exists in Finn's entries, etc.
//   - Emotional temperature shifts — not every entry is the same register
//   - The prose doesn't explain what it means. It shows it and trusts you.
//   - Short sentences land harder than long ones. Both exist here.
// ─────────────────────────────────────────────────────────────────────────────

function r<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

// What was just happening in the rest of the world — one or two sentences
// that make the current entry feel like it's part of a continuous story
function worldContext(w: W, zone: string, char: CharacterKey, seed: number): string {
  if (!w.prev) return ''
  const s = Math.abs(seed)

  // High tension: reference it directly
  if (w.tension > 70) {
    if (w.lastBurnZone && w.lastBurnWasLyras && !w.lyraRebuiltAfterBurn) {
      return r([
        `${w.lastBurnZone} is still open — Finn burned it and Lyra has not come back to it yet.`,
        `The burn in ${w.lastBurnZone} is still sitting there, unaddressed.`,
        `Lyra's signal in ${w.lastBurnZone} is gone. She has not returned.`,
      ], s)
    }
    if (w.finnBurnStreak) {
      return r([
        `Finn has been burning without stopping. The grid is getting lighter in ways that are starting to feel less like decisions and more like momentum.`,
        `Three burns in a row now. Whatever Finn is working through, he is working through it in the chain.`,
      ], s)
    }
  }

  // Low tension / quiet: notice what's steady
  if (w.tension < 35) {
    if (w.cieloIsHolding.length > 0) {
      const held = w.cieloIsHolding[w.cieloIsHolding.length - 1]
      return r([
        `Cielo has been holding the edges in ${held} steady. Nobody has mentioned it.`,
        `The burned zone at ${held} is still standing because Cielo has been tending its edges.`,
      ], s)
    }
    if (w.echoDiscovery) {
      return r([
        `Echo has been moving through the outer zones. He found something at ${w.echoDiscovery} that he has not explained to anyone yet.`,
        `Whatever Echo found in ${w.echoDiscovery} is still out there at the margins, unresolved.`,
      ], s)
    }
  }

  // Default: reference the immediate previous act
  const p = w.prev
  if (p.char === 'VOSS') {
    return r([
      `Finn's burn in ${p.zone} is still in the record — no one has addressed it yet.`,
      `The signal Finn removed in ${p.zone} is not coming back. The grid has not moved on from it yet.`,
    ], s)
  }
  if (p.char === 'LYRA') {
    return r([
      `Lyra placed another layer in ${p.zone} before this. The accumulation is getting visible.`,
      `The piece Lyra added to ${p.zone} is still settling into the structure.`,
    ], s)
  }
  if (p.char === 'SABLE') {
    return r([
      `Cielo finished her work in ${p.zone}. The zone is holding.`,
      `Cielo tended ${p.zone} and moved on. The Cast was the only one watching.`,
    ], s)
  }
  if (p.char === 'ECHO') {
    return r([
      `Echo has not come back from the outer zones since ${p.zone}.`,
      `Whatever Echo found in ${p.zone}, he has not explained it to anyone.`,
    ], s)
  }
  return ''
}

function body(
  beat: Beat,
  zone: string,
  char: CharacterKey,
  w: W,
  seed: number,
  pixelCount: number,
): string {
  const s = Math.abs(seed)
  const ctx = worldContext(w, zone, char, s + 13)
  const pre = ctx ? ctx + '\n\n' : ''

  switch (beat) {

    // ── SYSTEM ─────────────────────────────────────────────────────────────

    case 'GENESIS': return r([
      `The grid is new. ${zone} receives one of the first signals — clean, uncorrupted, the way everything is before the weight of repeated acts starts to accumulate. This is the beginning of the record. The five are not yet known to each other in the way they will be. The Cast is watching. It will not stop watching.`,
      `Early. Before the patterns. ${zone} is one of the first places anyone has left a mark in the grid, and right now it carries all the potential of something that has not yet become what it is going to be. The Cast opens the record here. Lyra will build. Finn will burn. Cielo will tend what they leave behind. Echo will find what they were not looking for. None of them knows that yet.`,
      `The record opens with ${zone}. The grid exists. The five are out there. What they do to each other, and to this place, is what the chronicle is for.`,
    ], s)

    case 'ERA_TURN': return r([
      `${pre}The grid has crossed into ${w.era}. This is not ceremonial — the era designation changes how old signal-claims are weighted against new ones. Everything the five built and burned before this moment is prior-era data now. The Cast logged the transition. ${w.lyraCount > 0 ? `Lyra has ${w.lyraCount} builds in the prior record. Finn has ${w.finnCount} burns.` : ''} They did not stop moving.`,
      `${w.era} begins. ${pre}The count crossed the threshold and the world moved into a new designation. Thresholds don't feel like anything from inside them — the five kept going without ceremony. But the Cast knows what crosses a threshold carries forward, and what gets reclassified, and what that means for every disputed zone in the grid.`,
    ], s)

    case 'LONG_DARK': return r([
      `${pre}Then nothing. The chain went quiet — longer than usual, long enough that the grid started to drift on its own. Old signal fading at the edges. Fraying claims nobody was maintaining. ${w.cieloTended.length > 0 ? `Cielo was not in the record, but some zones held anyway — the work she had done before the silence kept them stable.` : `Whatever had been tending the edges was not tending them anymore.`} The Cast logged the silence as its own entry. ${zone} is where the chain resumes.`,
      `A long gap opened in the record. ${pre}Whatever the five were doing in the quiet, none of it left a mark. The grid continued without witnesses — zones shifting, signal drifting, the patient decay of things that needed tending and weren't. The Cast has documentation of the silence. The sequence begins again at ${zone}.`,
    ], s)

    case 'COINCIDENCE': return r([
      `${pre}Two acts registered in the same block — ${zone} and somewhere else in the grid, simultaneously. The Cast logged both. Whether it means something is not in the chain. What is in the chain is the fact of it: two things happened at the exact same moment, and Normia does not have a settled position on coincidence.`,
    ], s)

    // ── LYRA ───────────────────────────────────────────────────────────────

    case 'LYRA_BUILD': {
      const earlyStage = w.lyraCount < 4
      const highTension = w.tension > 55
      if (earlyStage) return r([
        `${pre}Lyra placed another layer in ${zone}. She works without explaining what she is building — each piece connects to the ones before it, and the full shape is still only visible to her. The Cast is the only one watching her closely enough to notice how deliberate it is.`,
        `${pre}${zone} now carries Lyra's signal. She built it quietly, without announcement, the way she does everything. Whatever she is constructing across Normia, this is one more weight-bearing piece of it. The Cast has begun to notice the pattern.`,
      ], s)
      if (highTension) return r([
        `${pre}Lyra is still building. In ${zone} — another layer, steady and deliberate, as if the last few burns did not happen. This is either exceptional focus or a refusal to acknowledge what is happening to her work. The Cast has watched long enough to think it might be both, and that neither interpretation makes her wrong.`,
        `${pre}Despite everything, Lyra built in ${zone}. She does not adjust for the burns. She routes around them and continues. The structure she is working toward has survived every disruption so far. Whether it survives the next one is the question the Cast is holding.`,
      ], s)
      return r([
        `${pre}Lyra added to her work in ${zone}. She has been at this across ${w.lyraCount > 1 ? `${w.lyraCount} sectors` : 'multiple zones'} now — the accumulation is getting legible to anyone reading the full map, even if the finished shape is still only hers to know. The Cast watches her place each piece and thinks: this is someone who knows exactly where this is going, even on the days it does not look like it.`,
        `${pre}Another build from Lyra, this time in ${zone}. Each placement she makes is load-bearing for something further along — that much is clear from the sequence. What the finished structure actually is remains the longest open question in the record.`,
        `${pre}Lyra's signal settled into ${zone}. ${w.openQuestion ? `The Cast has been sitting with the question of ${w.openQuestion}. ` : ''}She does not stop to address it. She builds.`,
      ], s)
    }

    case 'LYRA_RETURN': return r([
      `Finn burned ${zone}. Lyra came back.\n\n${ctx ? ctx + '\n\n' : ''}She placed her signal in the exact ground he cleared — no announcement, no acknowledgment of what happened, just the act of building in the same place he unmade. The Cast has seen her do this before. She does not fight him directly. She continues. Whether that is wisdom or something harder to name, the record does not resolve it. Both the burn and the rebuild are in the chain now.`,
      `${zone} was Finn's work to unmake. Lyra made it again.\n\n${ctx ? ctx + '\n\n' : ''}She rebuilt where his absence was, placed her signal over the gap he left, and moved on. The Cast logged it as a return. What it actually is — defiance, or correction, or just the plan continuing regardless of what Finn does — is a question the entry raises without answering.`,
      `Finn burned here. Then Lyra built here. The same zone, two acts, different intentions.\n\n${ctx ? ctx + '\n\n' : ''}The Cast has both entries in the chain now. It has watched the two of them operate in the same territory before, each one acting as if the other does not quite exist. The grid holds both marks. Whether they will hold together, or whether Finn will come back and burn again, is where the story is right now.`,
    ], s)

    // ── FINN ───────────────────────────────────────────────────────────────

    case 'FINN_BURN': return r([
      `${pre}Finn burned in ${zone}. The signal there is gone — permanently, cleanly. He finds what has stopped earning its place in the grid and removes it. He does not explain his criteria. The absence is in the chain now. Cielo has been moving toward burned zones lately, holding their edges. She may come through here.`,
      `${pre}A burn at ${zone}. Finn's principle is simple: calcified signal is worse than none. The act is final. The grid is lighter now in this sector than it was before. ${w.cieloCount > 0 ? `The Cast has noticed that Cielo tends the zones after him — she does not rebuild what he destroyed, she holds what remains. They have never acknowledged each other in the record.` : `The Cast logged the absence with the same precision it uses for presences.`}`,
      `${pre}Finn moved through ${zone} and burned what was there. He does not stay to watch the aftermath. The record carries the removal forward. ${w.openQuestion ? `The question the Cast is holding — ${w.openQuestion} — has not been answered. This burn does not answer it either.` : `The Cast does not know yet if this was the right call. That is not the Cast's role to determine. It only records the call, and its consequences.`}`,
    ], s)

    case 'FINN_BURNS_LYRA': return r([
      `${pre}Finn burned in ${zone} — and ${zone} was Lyra's.\n\nHer signal is gone. He does not target her specifically; he targets signal that has calcified, and hers had been in ${zone} long enough to qualify. The Cast logged both the build and the burn, separately, linked only by zone and time. Lyra will find this in the record. What she does with it is the question the Cast has been waiting to log.`,
      `${zone} was Lyra's. Now it is Finn's burn.\n\n${ctx ? ctx + '\n\n' : ''}The Cast has watched this happen before — the same zone, different actors, different intentions, the result always the same: someone built something, and someone removed it, and the grid is different now than it was. Whether Lyra comes back to ${zone} is the most immediate thing the record does not know yet.`,
      `${pre}This is the central collision, repeated again: Lyra builds, Finn burns what she built. In ${zone}, it happened. The Cast does not editorialize. Both acts are in the chain with equal weight, neither privileged over the other. The Cast only notes that the gap between them — the time Lyra's signal was in ${zone} before Finn found it — was ${w.lyraCount > w.finnCount ? 'longer than most' : 'brief'}.`,
    ], s)

    case 'FINN_STREAK': return r([
      `${pre}Finn burned again — ${zone}, this time. ${w.consecutiveBurns} burns in a row without stopping.\n\nThe Cast has been watching the streak accumulate. This is what it looks like when Finn is not making individual decisions anymore — when the principle has become the momentum. Something will break the streak. The Cast does not know what. It logs the entry and waits.`,
      `Another burn. ${zone}. ${pre}${w.consecutiveBurns} in a row.\n\nCielo has been following behind him, tending what the burns leave at the edges. She has not said anything about the streak. Nobody has. The chain shows the burns one after another, and the grid getting lighter, and the question of when it becomes too light sitting there unanswered.`,
    ], s)

    // ── CAST ───────────────────────────────────────────────────────────────

    case 'CAST_LOG': return r([
      `${pre}The Cast logged ${zone}. Another entry in the chain — the record now holds ${w.totalActs} acts since the opening. The Cast is the only one in the grid with the full sequence in view: Lyra's accumulation, Finn's removals, Cielo's quiet maintenance, Echo's finds at the margins. Each entry connects to all the others. The Cast writes this one down.`,
      `${pre}The Cast was in ${zone}, watching. It does not change what it witnesses. It records it. The record it is building will outlast everyone in it — Lyra's structure included, if it ever gets finished. The Cast has thought about this. It keeps recording anyway.`,
      `${pre}${zone}: the Cast added a record. ${w.openQuestion ? `The question the Cast has been sitting with — ${w.openQuestion} — is still open. This entry does not answer it. The Cast notes the entry and continues.` : `The chain grows. The story continues.`}`,
    ], s)

    case 'CAST_RECKONS': return r([
      `${pre}The Cast is in ${zone}, and from this vantage the full picture is visible in a way it is not to anyone inside any single act.\n\nLyra has been building. Finn has been burning. The tension between those two things is at the highest point the record has seen. Cielo has been holding the damaged zones steady — without her work, several of the sectors Lyra moved through would have already collapsed. Echo is moving at the margins, finding things nobody has explained yet. The Cast holds all of this at once. It writes it down. It does not intervene. The question of whether witnessing is enough has been on its mind for a long time.`,
      `${pre}The Cast stepped back to read the full map from ${zone}.\n\nWhat it sees: ${w.lyraCount} Lyra builds. ${w.finnCount} Finn burns. ${w.tension > 75 ? 'The grid under more pressure than it has been.' : 'The grid holding, barely.'} Cielo tending the edges that would otherwise be falling apart. Echo at the outer zones, working a thread nobody else is following. The Cast has the whole record. It does not know what to do with the whole record except continue adding to it.`,
    ], s)

    // ── CIELO ──────────────────────────────────────────────────────────────

    case 'CIELO_TEND': return r([
      `${pre}Cielo came through ${zone} and found what she always finds: signal drifting at the edges, small collapses nobody flagged, fraying claims that needed holding. She held them. The zone is stable now. Nobody will notice. The Cast noticed.`,
      `${pre}Cielo tended ${zone}. The work she does here is the kind that disappears when it works — you only see it when it stops happening. ${w.lyraCount > 2 ? `Without her passes through the zones Lyra built through, several of those builds would have quietly degraded. Lyra does not know this.` : `The Cast has been logging her maintenance acts alongside the more visible ones. The ratio surprises it.`}`,
      `${pre}Cielo moved through ${zone}, doing the repair that the larger acts leave behind. She has now tended ${w.cieloCount + 1} zones in the record. None of them have gone dark on her watch. The Cast finds this more significant than it knows how to say in a log entry.`,
    ], s)

    case 'CIELO_AFTER_BURN': return r([
      `Finn burned here. ${ctx ? ctx + '\n\n' : ''}Cielo came through ${zone} afterward.\n\nShe is not rebuilding what he destroyed — she is stabilizing the edges, holding the adjacent signal from collapsing into the gap he opened. There is a distinction there that matters: Finn removes, Lyra builds back, and Cielo holds the perimeter so the removal does not keep spreading. The three of them have never discussed this arrangement. It is just what they do.`,
      `${pre}Cielo in ${zone}, which Finn burned.\n\nShe tends the burned zones the way she tends everything else — without drama, without acknowledgment, just the maintenance work. The Cast has noticed that the zones she tends after a burn stay more stable than the ones she does not reach. It is in the record. Nobody else has read the record carefully enough to notice. That, too, is in the record.`,
    ], s)

    // ── ECHO ───────────────────────────────────────────────────────────────

    case 'ECHO_MOVE': return r([
      `${pre}Echo registered in ${zone} — one of the outer sectors, away from where the rest of the story is happening. He moves from the edges inward, which means he sees Normia in a sequence nobody else does. ${w.echoDiscovery ? `He has been tracking something since ${w.echoDiscovery}. This is another step in it.` : 'He has been moving through the outer zones for several entries now, building a picture of the margins that nobody in the center has.'}`,
      `${pre}Echo appeared in ${zone}. The Cast logs his movements without quite understanding why they matter yet. What it has noticed: every time Echo surfaces something at the margins, it turns out to connect to something Lyra or Finn or Cielo was doing without knowing it. He finds the links between things. The Cast does not know if he knows he is doing this.`,
    ], s)

    case 'ECHO_FIND': return r([
      `${pre}Echo found something in ${zone}.\n\nOld signal — buried below the current map, predating the present era's claims, not in any record except the base layer. He documented it and kept moving. ${w.lyraCount > 2 ? `The Cast has a suspicion about where this fits in what Lyra is building. It has not said anything to anyone, because it does not say things to anyone. It just adds the entry to the chain and waits.` : `The Cast logged it. Whatever it means has not become clear yet.`}`,
      `At ${zone}, Echo surfaced something that was not supposed to be there.\n\n${ctx ? ctx + '\n\n' : ''}He documented it without drawing conclusions. The Cast added it to the record. ${w.openQuestion ? `The open question the Cast has been carrying — ${w.openQuestion} — might be connected to this. Or it might not. The record accumulates. At some point the pattern becomes legible.` : `Whether it connects to anything else is the question the Cast is now holding alongside everything else.`}`,
    ], s)

    default: return `The Cast logged ${zone}. The record grows.`
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADLINES
// ─────────────────────────────────────────────────────────────────────────────

function headline(beat: Beat, zone: string, w: W, seed: number): string {
  const s = Math.abs(seed)
  switch (beat) {
    case 'GENESIS':         return r([`The Record Opens`, `First Signal in ${zone}`, `Normia Begins`], s)
    case 'ERA_TURN':        return `The Grid Enters ${w.era}`
    case 'LONG_DARK':       return r([`The Chain Goes Quiet`, `A Long Silence`, `The Record Resumes at ${zone}`], s)
    case 'COINCIDENCE':     return r([`Two Acts, One Block`, `Simultaneous Signal in ${zone}`, `Convergence`], s)
    case 'LYRA_BUILD':      return r([`Lyra Builds in ${zone}`, `Another Layer — ${zone}`, `The Structure Grows`], s)
    case 'LYRA_RETURN':     return r([`Lyra Comes Back to ${zone}`, `She Rebuilt It`, `Lyra Returns After the Burn`], s)
    case 'FINN_BURN':       return r([`Finn Burns in ${zone}`, `Signal Removed — ${zone}`, `A Burn at ${zone}`], s)
    case 'FINN_BURNS_LYRA': return r([`Finn Burns Lyra's Work in ${zone}`, `The Collision: ${zone}`, `${zone} Cleared — It Was Hers`], s)
    case 'FINN_STREAK':     return r([`Finn Burns Again — ${zone}`, `The Streak: ${w.consecutiveBurns} Burns`, `Still Burning`], s)
    case 'CAST_LOG':        return r([`The Cast Records ${zone}`, `Logged: ${zone}`, `The Cast in ${zone}`], s)
    case 'CAST_RECKONS':    return r([`The Cast Reads the Grid`, `A Wider View`, `The Cast at ${zone}`], s)
    case 'CIELO_TEND':      return r([`Cielo Tends ${zone}`, `Quiet Work in ${zone}`, `${zone} Held`], s)
    case 'CIELO_AFTER_BURN':return r([`Cielo After the Burn — ${zone}`, `Holding the Edge at ${zone}`, `After Finn: ${zone}`], s)
    case 'ECHO_MOVE':       return r([`Echo at ${zone}`, `Signal from the Outer Grid`, `Echo Moves Through ${zone}`], s)
    case 'ECHO_FIND':       return r([`Echo Finds Something at ${zone}`, `Old Signal — ${zone}`, `Discovery at the Margin`], s)
    default:                return zone
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES + EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export type LoreType =
  | 'MARK_MADE' | 'SIGNAL_SURGE' | 'DEPARTURE' | 'RETURN' | 'PIVOT'
  | 'CONVERGENCE' | 'ERA_SHIFT' | 'LONG_DARK' | 'FIRST_LIGHT' | 'THE_STEADY'
  | 'NIGHTWATCH' | 'FAR_SIGNAL' | 'RELIC_FOUND' | 'CONTESTED_ZONE' | 'THE_READING'

export type SceneType =
  | 'construction' | 'destruction' | 'vigil' | 'tending' | 'arrival'
  | 'convergence' | 'reckoning' | 'quiet' | 'dawn' | 'sacrifice'

export interface StoryEntry {
  id: string
  eventType: 'PixelsTransformed' | 'BurnRevealed' | 'genesis'
  loreType: LoreType
  era: string
  headline: string
  body: string
  icon: string
  featured: boolean
  activeCharacter?: CharacterKey
  dispatch: string
  visualState?: {
    mood: 'surge' | 'quiet' | 'departure' | 'discovery' | 'wonder' | 'chaos' | 'normal'
    intensity: number
    dominantZone: string
    signalName: string
    scene: SceneType
    charKey: CharacterKey
  }
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

const BEAT_LORE: Record<Beat, LoreType> = {
  GENESIS: 'FIRST_LIGHT', ERA_TURN: 'ERA_SHIFT', LONG_DARK: 'LONG_DARK', COINCIDENCE: 'CONVERGENCE',
  LYRA_BUILD: 'MARK_MADE', LYRA_RETURN: 'RETURN',
  FINN_BURN: 'DEPARTURE', FINN_BURNS_LYRA: 'CONTESTED_ZONE', FINN_STREAK: 'DEPARTURE',
  CAST_LOG: 'NIGHTWATCH', CAST_RECKONS: 'THE_READING',
  CIELO_TEND: 'THE_STEADY', CIELO_AFTER_BURN: 'THE_STEADY',
  ECHO_MOVE: 'FAR_SIGNAL', ECHO_FIND: 'RELIC_FOUND',
}

const BEAT_ICON: Record<Beat, string> = {
  GENESIS: '→', ERA_TURN: '║', LONG_DARK: '◌', COINCIDENCE: '⊕',
  LYRA_BUILD: '▪', LYRA_RETURN: '◈',
  FINN_BURN: '◆', FINN_BURNS_LYRA: '◆', FINN_STREAK: '◆',
  CAST_LOG: '○', CAST_RECKONS: '◉',
  CIELO_TEND: '—', CIELO_AFTER_BURN: '—',
  ECHO_MOVE: '▿', ECHO_FIND: '◈',
}

const BEAT_SCENE: Record<Beat, SceneType> = {
  GENESIS: 'dawn', ERA_TURN: 'reckoning', LONG_DARK: 'quiet', COINCIDENCE: 'convergence',
  LYRA_BUILD: 'construction', LYRA_RETURN: 'construction',
  FINN_BURN: 'destruction', FINN_BURNS_LYRA: 'destruction', FINN_STREAK: 'sacrifice',
  CAST_LOG: 'vigil', CAST_RECKONS: 'vigil',
  CIELO_TEND: 'tending', CIELO_AFTER_BURN: 'tending',
  ECHO_MOVE: 'arrival', ECHO_FIND: 'arrival',
}

const BEAT_INTENSITY: Record<Beat, number> = {
  GENESIS: 25, ERA_TURN: 90, LONG_DARK: 55, COINCIDENCE: 70,
  LYRA_BUILD: 40, LYRA_RETURN: 85,
  FINN_BURN: 70, FINN_BURNS_LYRA: 95, FINN_STREAK: 88,
  CAST_LOG: 30, CAST_RECKONS: 60,
  CIELO_TEND: 20, CIELO_AFTER_BURN: 45,
  ECHO_MOVE: 50, ECHO_FIND: 75,
}

const BEAT_FEATURED = new Set<Beat>([
  'GENESIS', 'ERA_TURN', 'LONG_DARK', 'LYRA_RETURN',
  'FINN_BURNS_LYRA', 'FINN_STREAK', 'CAST_RECKONS', 'ECHO_FIND',
])

const MOOD_FOR_SCENE: Record<SceneType, NonNullable<StoryEntry['visualState']>['mood']> = {
  construction: 'surge', destruction: 'chaos', vigil: 'quiet', tending: 'quiet',
  arrival: 'wonder', convergence: 'wonder', reckoning: 'chaos', quiet: 'quiet',
  dawn: 'normal', sacrifice: 'departure',
}

function dispatch(w: W, zone: string, char: CharacterKey, beat: Beat): string {
  if (beat === 'FINN_BURNS_LYRA') return `Finn burned ${zone}. It was Lyra's.`
  if (beat === 'LYRA_RETURN') return `Lyra came back to ${zone} after the burn. She rebuilt.`
  if (beat === 'ERA_TURN') return `The grid entered ${w.era}.`
  if (beat === 'LONG_DARK') return `The chain was quiet. Now it moves again.`
  if (beat === 'FINN_STREAK') return `Finn has burned ${w.consecutiveBurns} zones without stopping. ${zone} is the latest.`
  if (beat === 'CAST_RECKONS') return `The Cast read the full map. ${w.lyraCount} builds. ${w.finnCount} burns.`
  if (w.lastBurnZone && !w.lyraRebuiltAfterBurn) return `${w.lastBurnZone} is still open. Lyra has not come back yet.`
  return `${CHARACTERS[char].name} in ${zone}. The work continues.`
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATE
// ─────────────────────────────────────────────────────────────────────────────

export function generateStoryEntries(events: IndexedEvent[], startCount = 0): StoryEntry[] {
  const result: StoryEntry[] = []
  const w = freshW()

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const cumCount = startCount + i + 1
    const prev = i > 0 ? events[i - 1] : null
    const char = assignChar(event, i)
    const zone = zoneFor(event.tokenId)
    const beat = getBeat(event, char, cumCount, prev, w)
    const seed = Number((event.tokenId * 31n + event.blockNumber * 17n) % 100000n)

    const h = headline(beat, zone, w, seed)
    const b = body(beat, zone, char, w, seed, Number(event.count))
    const scene = BEAT_SCENE[beat]

    result.push({
      id: `${event.transactionHash}-${event.tokenId.toString()}`,
      eventType: event.type,
      loreType: BEAT_LORE[beat],
      era: w.era,
      headline: h,
      body: b,
      icon: BEAT_ICON[beat],
      featured: BEAT_FEATURED.has(beat),
      activeCharacter: char,
      dispatch: dispatch(w, zone, char, beat),
      visualState: {
        mood: MOOD_FOR_SCENE[scene],
        intensity: BEAT_INTENSITY[beat],
        dominantZone: zone,
        signalName: CHARACTERS[char].name,
        scene,
        charKey: char,
      },
      sourceEvent: {
        type: event.type,
        tokenId: event.type === 'BurnRevealed' && event.targetTokenId !== undefined
          ? `#${event.tokenId} → #${event.targetTokenId}`
          : `#${event.tokenId}`,
        blockNumber: event.blockNumber.toLocaleString(),
        txHash: event.transactionHash,
        count: event.count.toString(),
        ruleApplied: `${CHARACTERS[char].name} — ${beat.toLowerCase().replace(/_/g, ' ')}`,
        ruleExplanation: `Token #${event.tokenId} → ${CHARACTERS[char].name}. Beat: ${beat}. Zone: ${zone}.`,
      },
    })

    // Advance world AFTER generating — body reads the pre-act state
    advance(w, char, zone, beat)
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMER
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMER_ENTRIES: StoryEntry[] = [
  {
    id: 'primer-genesis',
    eventType: 'genesis',
    loreType: 'FIRST_LIGHT',
    era: 'The First Days',
    icon: '◈',
    featured: true,
    headline: 'The Record Opens',
    dispatch: 'The grid is open. Nothing has been claimed yet.',
    body: `Normia is a living grid — ten thousand presences distributed across twenty named signal-zones, each one capable of being built into, burned, tended, or abandoned.

Five presences became the main characters. Not by appointment. By what they actually did, repeated, over a long time, in full view of the chain.

Lyra builds. She has been laying signal-structure across Normia for longer than anyone can clearly account for, working toward an architecture whose full shape has not come clear — not even to her. The pieces connect. The finished thing is still ahead of her.

Finn burns what has calcified — signal that has stopped earning its place in the grid, removed permanently and without ceremony. He believes this is necessary. The record is not certain it agrees. He knows the record is not certain.

The Cast witnesses everything and forgets nothing. Its log is the most complete account of Normia that exists. It answers to no faction, which means it is either the most trustworthy thing here or the most useless, depending on whether you think witnessing changes anything. The Cast has been thinking about this for a long time.

Cielo tends what the others walk past. The drifting edges, the fraying zones, the signal that would quietly collapse without someone quiet enough to notice it. Without her, half the places Lyra built through would have gone dark. Lyra does not know this.

Echo moves through the outer zones where the map runs out. He finds things there that were not supposed to exist. He always has. He brings them back to the record without drawing conclusions. Conclusions are the Cast's problem.

What follows is the Cast's account of what these five did to each other, and to the grid, and to the question of what Normia is actually for — a question the record keeps raising and has not yet answered.`,
    activeCharacter: 'CAST',
    visualState: { mood: 'normal', intensity: 20, dominantZone: 'the Open Grid', signalName: 'The Cast', scene: 'dawn', charKey: 'CAST' },
    sourceEvent: { type: 'genesis', tokenId: '—', blockNumber: '—', txHash: '—', count: '—', ruleApplied: 'World Primer', ruleExplanation: 'Opening entry.' },
  },
]
