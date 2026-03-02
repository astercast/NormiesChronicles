import type { IndexedEvent } from './eventIndexer'

export const CHARACTERS = {
  LYRA: {
    name: 'Lyra', title: 'the Architect', pronoun: 'she', possessive: 'her',
    shortDesc: 'She designs open-source grid patterns that let ordinary people hold their own territory. The Cartel has tried to hire her twice. She declined both times in ways they found upsetting.',
  },
  VOSS: {
    name: 'Finn', title: 'the Reclaimer', pronoun: 'he', possessive: 'his',
    shortDesc: 'He used to work for the Cartel. He left. He has been spending the years since undoing what he helped build, one district at a time.',
  },
  CAST: {
    name: 'The Cast', title: 'the Record', pronoun: 'it', possessive: 'its',
    shortDesc: 'The grid\'s autonomous witness-system. It logs everything — claims, losses, small acts, long silences. It has no faction. That is the point of it.',
  },
  SABLE: {
    name: 'Cielo', title: 'the Keeper', pronoun: 'she', possessive: 'her',
    shortDesc: 'She runs the safehouse network — food, medicine, shelter, forged credentials, safe routes. She is the reason more people are still fighting than the Cartel expected.',
  },
  ECHO: {
    name: 'Echo', title: 'the Scout', pronoun: 'he', possessive: 'his',
    shortDesc: 'He maps what the Cartel doesn\'t want mapped — the gaps in their grid, corridors they think nobody knows about, places where people are still living outside their reach.',
  },
} as const

export type CharacterKey = keyof typeof CHARACTERS

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

export const ERAS = [
  { threshold: 0,    name: 'Before the Cartel Moved' },
  { threshold: 100,  name: 'The First Pushback' },
  { threshold: 300,  name: 'Living Under Pressure' },
  { threshold: 700,  name: 'The Contested Season' },
  { threshold: 1500, name: 'What the Resistance Costs' },
  { threshold: 3000, name: 'The Long Fight' },
  { threshold: 5000, name: 'Old Normia, Still Standing' },
  { threshold: 8000, name: 'After Everything' },
]

function getEra(n: number): string {
  let name = ERAS[0].name
  for (const e of ERAS) { if (n >= e.threshold) name = e.name }
  return name
}

interface W {
  totalActs: number
  era: string
  lyraHolds: string[]
  finnReclaimed: string[]
  cieloSafehouses: string[]
  echoMapped: string[]
  lyraCount: number
  finnCount: number
  castCount: number
  cieloCount: number
  echoCount: number
  cartellPressure: number
  lastCartelPush: string | null
  lastCartelPushWasLyras: boolean
  finnReclaimedAfterPush: boolean
  consecutiveCartelMoves: number
  cartelStreak: boolean
  cieloShortage: string | null
  echoLastFind: string | null
  lyraCurrentProject: string | null
  prev: { char: CharacterKey; zone: string; beat: Beat } | null
}

function freshW(): W {
  return {
    totalActs: 0, era: 'Before the Cartel Moved',
    lyraHolds: [], finnReclaimed: [], cieloSafehouses: [], echoMapped: [],
    lyraCount: 0, finnCount: 0, castCount: 0, cieloCount: 0, echoCount: 0,
    cartellPressure: 20,
    lastCartelPush: null, lastCartelPushWasLyras: false, finnReclaimedAfterPush: false,
    consecutiveCartelMoves: 0, cartelStreak: false,
    cieloShortage: null, echoLastFind: null, lyraCurrentProject: null,
    prev: null,
  }
}

function advance(w: W, char: CharacterKey, zone: string, beat: Beat, isCartelMove: boolean): void {
  w.totalActs++
  w.era = getEra(w.totalActs)
  if (isCartelMove) {
    const wasLyras = w.lyraHolds.includes(zone)
    w.lyraHolds = w.lyraHolds.filter(z => z !== zone)
    w.lastCartelPush = zone
    w.lastCartelPushWasLyras = wasLyras
    w.finnReclaimedAfterPush = false
    w.consecutiveCartelMoves++
    w.cartelStreak = w.consecutiveCartelMoves >= 3
    w.cartellPressure = Math.min(100, w.cartellPressure + 18)
  } else {
    w.consecutiveCartelMoves = 0
    w.cartelStreak = false
    w.cartellPressure = Math.max(15, w.cartellPressure - 7)
  }
  if (char === 'LYRA') {
    w.lyraCount++
    if (!isCartelMove && !w.lyraHolds.includes(zone)) w.lyraHolds.push(zone)
    if (w.lastCartelPush === zone && !isCartelMove) w.finnReclaimedAfterPush = true
    const projects = ['a new open-source grid extension', 'the Cradle district defensive pattern', 'a mesh that routes around Cartel checkpoints', 'the Old Crossing anchor system']
    w.lyraCurrentProject = projects[w.lyraCount % projects.length]
  }
  if (char === 'VOSS') {
    w.finnCount++
    if (!w.finnReclaimed.includes(zone)) w.finnReclaimed.push(zone)
    if (w.lastCartelPush === zone) w.finnReclaimedAfterPush = true
  }
  if (char === 'CAST') { w.castCount++ }
  if (char === 'SABLE') {
    w.cieloCount++
    if (!w.cieloSafehouses.includes(zone)) w.cieloSafehouses.push(zone)
    const shortages = ['clean water', 'grid-access tokens', 'medicine', 'power cells', 'cold food', null]
    w.cieloShortage = shortages[(w.cieloCount + Math.floor(w.cartellPressure / 20)) % shortages.length]
  }
  if (char === 'ECHO') {
    w.echoCount++
    if (!w.echoMapped.includes(zone)) w.echoMapped.push(zone)
    const finds = ['an unmapped corridor behind the old market', 'a dead Cartel relay nobody deactivated', 'a family living in a zone marked as cleared', 'a pre-Cartel access tunnel', 'a cache of old grid-tokens', 'a shortwave still broadcasting old music']
    w.echoLastFind = finds[w.echoCount % finds.length]
  }
  w.prev = { char, zone, beat }
}

const ROTATION: CharacterKey[] = ['LYRA', 'VOSS', 'CAST', 'SABLE', 'ECHO']
function assignChar(_event: IndexedEvent, idx: number): CharacterKey { return ROTATION[idx % 5] }

type Beat =
  | 'GENESIS' | 'ERA_TURN' | 'LONG_QUIET' | 'SIMULTANEOUS'
  | 'LYRA_DESIGNS' | 'LYRA_DAILY' | 'LYRA_RESPONDS'
  | 'FINN_RECLAIMS' | 'FINN_DAILY' | 'FINN_STREAK'
  | 'CAST_LOGS' | 'CAST_READS'
  | 'CIELO_RUNS' | 'CIELO_DAILY' | 'CIELO_CRISIS'
  | 'ECHO_SCOUTS' | 'ECHO_FINDS'
  | 'CARTEL_PUSH' | 'CARTEL_ADVANCE'

function getBeat(event: IndexedEvent, char: CharacterKey, cumCount: number, prev: IndexedEvent | null, w: W): Beat {
  if (cumCount <= 5) return 'GENESIS'
  if (ERAS.some(e => e.threshold === cumCount && e.threshold > 0)) return 'ERA_TURN'
  if (prev && event.blockNumber - prev.blockNumber > 50000n) return 'LONG_QUIET'
  if (prev && prev.blockNumber === event.blockNumber) return 'SIMULTANEOUS'
  const isCartelMove = event.type === 'BurnRevealed'
  const zone = zoneFor(event.tokenId)
  if (isCartelMove) return w.lyraHolds.includes(zone) ? 'CARTEL_PUSH' : 'CARTEL_ADVANCE'
  if (char === 'LYRA') {
    if (w.lastCartelPushWasLyras && !w.finnReclaimedAfterPush) return 'LYRA_RESPONDS'
    return w.lyraCount % 3 === 0 ? 'LYRA_DAILY' : 'LYRA_DESIGNS'
  }
  if (char === 'VOSS') {
    if (w.cartelStreak) return 'FINN_STREAK'
    return w.finnCount % 4 === 0 ? 'FINN_DAILY' : 'FINN_RECLAIMS'
  }
  if (char === 'CAST') return w.cartellPressure > 65 ? 'CAST_READS' : 'CAST_LOGS'
  if (char === 'SABLE') {
    if (w.cartellPressure > 70 || w.cieloShortage) return 'CIELO_CRISIS'
    return w.cieloCount % 3 === 1 ? 'CIELO_DAILY' : 'CIELO_RUNS'
  }
  if (char === 'ECHO') return w.echoCount > 0 && w.echoCount % 3 === 0 ? 'ECHO_FINDS' : 'ECHO_SCOUTS'
  return 'CAST_LOGS'
}

function r<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length] }

function body(beat: Beat, zone: string, char: CharacterKey, w: W, seed: number): string {
  const s = Math.abs(seed)
  function thread(): string {
    if (!w.prev) return ''
    if (w.lastCartelPush && !w.finnReclaimedAfterPush)
      return r([`${w.lastCartelPush} is still in Cartel hands.`, `The situation in ${w.lastCartelPush} hasn't changed.`], s + 1)
    if (w.prev.char === 'VOSS' && w.finnReclaimed.length > 0) return `Finn was in ${w.prev.zone} earlier. He came back quieter than he left.`
    if (w.prev.char === 'SABLE' && w.cieloShortage) return `Cielo's been rationing ${w.cieloShortage} since last week. It's starting to show.`
    return ''
  }
  const pre = thread()
  const ctx = pre ? pre + '\n\n' : ''

  switch (beat) {
    case 'GENESIS': return r([
      `The grid in ${zone} is still mostly free — the Cartel hasn't reached this far yet, or hasn't bothered. Five people are living their lives here, doing their work, trying to hold onto something. None of them set out to be in a story. The record opens anyway.`,
      `Normia is a city that runs on pixels — who holds them, who shapes them, who loses them. The Glyph Cartel wants all of it. Five people are the reason they don't have it yet. This is ${zone}. This is where it starts.`,
      `Before the Cartel made its move, ${zone} was just a place. People bought groceries there. Kids drew on the grid-walls. The record starts here because everything starts somewhere, and this is where the chain begins.`,
    ], s)

    case 'ERA_TURN': return r([
      `${ctx}The city has crossed into a new phase — what the record calls ${w.era}. The Cartel's tactics have shifted. The five are adjusting. ${zone} is where the new era's first mark falls. Nothing resets. Everything that happened before this still happened.`,
      `${w.era}. ${ctx}That's what the Cast is calling this stretch of time. The pressure has changed shape — less visible in some places, heavier in others. The five keep going. They have learned not to celebrate thresholds, because the other side of every threshold is just more of the work.`,
    ], s)

    case 'LONG_QUIET': return r([
      `${ctx}There was a stretch where almost nothing happened — not in the record, anyway. ${zone} held. The Cartel didn't push. The five caught their breath in ways they almost never get to. Cielo cooked something that required three pots. Finn slept past sunrise for the first time in months. Then the chain picked up again.`,
      `A gap in the record. ${ctx}The city went on without logging anything — weeks of ordinary time, small decisions, meals eaten and conversations had that didn't rise to the level of events. The quiet ended at ${zone}. The chain resumes.`,
    ], s)

    case 'SIMULTANEOUS': return r([
      `${ctx}Two things happened at once — the grid logged them in the same instant. The Cast noted it without knowing what to make of it. Coincidences in Normia are usually not coincidences. But sometimes they are.`,
    ], s)

    case 'LYRA_DESIGNS': return r([
      `${ctx}Lyra has been at her workstation in ${zone} since before most people woke up. ${w.lyraCurrentProject ? `She's working on ${w.lyraCurrentProject}` : `She's working on something she hasn't named yet`} — a grid pattern she'll release open-source when it's done, freely, so anyone in Normia can use it to hold their own territory. She gets offers to do this work for pay. She does it for free or not at all.`,
      `${ctx}The design Lyra is running in ${zone} today took her six weeks to get right. She threw away four earlier versions. Now she's testing the edges — checking the places where the Cartel's tools would find a way in, and closing them one by one. She eats while she works. She's been eating the same thing for three days.`,
      `${ctx}Lyra doesn't think of what she does as political. She builds things that work. The fact that they work against the Cartel's expansion model is, in her view, incidental. Her colleagues think this is either the most principled position possible or a form of denial. She doesn't engage with the argument. She's busy.`,
    ], s)

    case 'LYRA_DAILY': return r([
      `${ctx}Lyra went to the market in ${zone} this morning — the one that doesn't require a Cartel-issued access token to enter. She bought coffee and argued mildly with the vendor about the price. She overpaid anyway. On the way back she noticed a section of grid-wall that had been painted over, the old design replaced by something flat and anonymous. She stood there a moment. Then kept walking.`,
      `${ctx}It was Lyra's day off — one she'd been owing herself for weeks. She spent most of it in ${zone} doing nothing useful: lying on the floor with music on, sketching things she wasn't going to build, reading something with no technical value. By evening she was restless. She opened her workstation anyway. She told herself it was just to check something.`,
      `${ctx}Lyra ran into an old colleague in ${zone} — someone from before, when the work they did was paid and sanctioned and not about any of this. They had coffee and talked around the obvious: that version of Normia is gone. They didn't say it directly. They split the bill evenly and went separate directions.`,
    ], s)

    case 'LYRA_RESPONDS': return r([
      `${w.lastCartelPush ? `The Cartel moved into ${w.lastCartelPush} and hit Lyra's work.` : `Her design got taken.`}\n\n${ctx}She found out from Echo — he'd been watching the sector and sent her a text at 2am that said just the zone name and nothing else. She sat with it for a while. Then she opened her workstation and started designing the version that goes back in. It will be harder to dislodge. She knows what they found to exploit the last time.`,
      `${w.lastCartelPush ? `${w.lastCartelPush} is in Cartel hands now.` : `Something Lyra built is gone.`} ${ctx}She didn't react visibly when Finn told her. She asked two clarifying questions — how far in, and which edges — and then said she needed an hour. When she came back she had a plan. Finn said the plan was aggressive. She said it was proportionate.`,
    ], s)

    case 'FINN_RECLAIMS': return r([
      `${ctx}Finn went into ${zone} last night. He wasn't supposed to be there — nobody was, according to the Cartel's access map. He got in through a service corridor Echo had flagged two weeks ago and spent four hours quietly restoring what the Cartel had overwritten. He was back in his apartment before the grid-lights came on. He slept three hours. Then got up and made eggs.`,
      `${ctx}The work in ${zone} took longer than Finn expected. He'd planned a clean in-and-out, but one of the Cartel's locks had been upgraded. He improvised. He used a technique from his old Cartel days — which is a thing he doesn't usually think about while he's using it. He got the zone back. He texted Lyra the coordinates and went to get coffee.`,
      `${ctx}Finn operates in ${zone} without ceremony. He doesn't see what he does as heroic — he sees it as corrective. The Cartel took something that wasn't theirs. He puts it back. The moral accounting is simple. What gets harder is knowing how it was taken, because he used to help take things like it. He doesn't talk about this. He talks about logistics.`,
    ], s)

    case 'FINN_DAILY': return r([
      `${ctx}Finn's been in ${zone} for two days on what he calls a reconnaissance pause — meaning he's sitting in a café watching the grid traffic and not actively doing anything. He ordered food. He read something. He had a longer conversation than usual with the woman who runs the place, who wanted to know if the rumors about the Cartel's new checkpoint were true. He told her mostly. He told her what to do about it.`,
      `${ctx}Today Finn helped Cielo move supplies — nothing operational, just carrying boxes through ${zone} in broad daylight like people doing something ordinary. They talked about things that weren't the war: a film, a street that had been repaved, whether a certain noodle place was still open. It was. They ate there after.`,
      `${ctx}Finn got a message from someone he used to work with at the Cartel — a low-level systems person who never had much to do with the actual expansion. The message implied something the sender wasn't willing to say directly. Finn read it twice in ${zone}, sat outside for a while, then wrote back. He hasn't told anyone what it said.`,
    ], s)

    case 'FINN_STREAK': return r([
      `${ctx}Finn has been running for three days. ${zone} is the latest. He's not sleeping enough and Cielo has said so directly, twice. He nodded and kept going. The logic is sound: when the Cartel pushes, you push back hard. The body doesn't always agree with sound logic.`,
      `${ctx}Third zone this week. ${w.lastCartelPush ? `The Cartel hit ${w.lastCartelPush} and Finn hasn't stopped moving since.` : `Finn hasn't stopped.`} He came through ${zone} fast and clean. Echo is tracking ahead of him. Lyra is updating patterns as he restores them. It looks like coordination. It mostly is. What it also is: three people running on adrenaline and bad coffee, doing the only thing they can think to do.`,
    ], s)

    case 'CAST_LOGS': return r([
      `${ctx}The Cast logged ${zone}. Another entry — another day in a city that is still, by some combination of effort and luck, mostly itself. ${w.lastCartelPush && !w.finnReclaimedAfterPush ? `${w.lastCartelPush} is still in Cartel hands. That's in the record too.` : `The five keep moving. The Cast keeps writing it down.`}`,
      `${ctx}The Cast was watching ${zone} when the event registered. It records without favor — small acts alongside large ones, days that feel like nothing alongside the days that change things. Today was a day. The Cast logged it. The record grows.`,
      `${ctx}${zone}: logged. What the Cast can see that no single person can is the accumulation — all the ordinary days adding up to a city still standing, still mostly free, despite everything that's been trying to change that. It adds this entry and continues.`,
    ], s)

    case 'CAST_READS': return r([
      `${ctx}The Cast stepped back from ${zone} and read the full situation.\n\nThe Cartel holds more than it did. The five have been holding too — Lyra's designs protect ${w.lyraHolds.length > 0 ? `${w.lyraHolds.length} zones` : `what she's built`}, Finn has recovered ${w.finnReclaimed.length > 0 ? `${w.finnReclaimed.length} sectors` : `ground`}, Cielo's network is still running, Echo has mapped corridors the Cartel doesn't know about. The pressure is real. The resistance is real. The Cast logs both and offers no verdict. That's not what it's for.`,
      `${ctx}High pressure in the grid right now. From ${zone} the Cast is reading the whole shape of it: the Cartel advancing on one side, the five pushing back on the other, and between them the ordinary people of Normia trying to get through their days. ${w.cieloShortage ? `Cielo is short on ${w.cieloShortage}. ` : ``}${w.echoLastFind ? `Echo found ${w.echoLastFind}. ` : ``}The Cast has all of it. It writes it down.`,
    ], s)

    case 'CIELO_RUNS': return r([
      `${ctx}Cielo's been running the ${zone} safehouse for months now. Today was a supply day — she checked inventory, restocked what she could, made sure the grid-access tokens were current so people could get out without being flagged. She has a system. The system works because she never skips steps, even the boring ones. Especially the boring ones.`,
      `${ctx}Three new people came through the ${zone} network this week. Cielo did intakes: what they need, how long they need it, what they can contribute. She's not running a charity — the network works because everyone in it adds something. One of the three knew how to maintain a relay antenna. She put them to work immediately.`,
      `${ctx}Cielo spent the morning in ${zone} coordinating a handoff — someone who'd been in the network for two months, leaving for a zone outside the Cartel's current interest, carrying a hard drive with Lyra's designs on it. Clean handoff. Cielo crossed it off her list. She has seventeen more items. She made tea.`,
    ], s)

    case 'CIELO_DAILY': return r([
      `${ctx}Cielo had a slow morning in ${zone}. She cooked for the safehouse — a big pot of something that would stretch across the day, the kind of cooking that gives you time to think. Two of the people staying there sat with her in the kitchen and talked. Not about the Cartel. Not about the grid. About where they were from. About things they missed. It was a good hour.`,
      `${ctx}Cielo took the long way through ${zone} today — the route that passes the school that's still open, technically outside the Cartel's reach because it sits on pre-grid infrastructure they haven't bothered to map. She stopped to watch the kids in the yard for a moment. This is the thing she doesn't say out loud: she's not doing this for some abstract cause. She's doing it for that school. For the kids in the yard.`,
      `${ctx}Cielo got into an argument today. Someone in the network thought she was making a bad call on the ${zone} location. They might have been right. She listened, pushed back, listened again, and moved the meet point two blocks. She hates that they were right. She moved it anyway.`,
    ], s)

    case 'CIELO_CRISIS': return r([
      `${ctx}${w.cieloShortage ? `The ${w.cieloShortage} situation in the network has gotten worse.` : `Something's running low.`} Cielo is in ${zone} running the numbers and the numbers are not cooperating. She's been doing this long enough to know which shortages are logistical problems and which are structural ones. ${w.cieloShortage === 'medicine' || w.cieloShortage === 'clean water' ? `This one is structural. She's making calls.` : `This one she can solve. She's working on it.`}`,
      `${ctx}The ${zone} safehouse had a close call — a Cartel patrol came within a block of it, following a route it hadn't used before. Everyone stayed quiet. The patrol passed. After, Cielo went through the protocols again — calmly, because calm was what the situation needed. She added the new route to Echo's map request list.`,
    ], s)

    case 'ECHO_SCOUTS': return r([
      `${ctx}Echo has been moving through the outer edges of ${zone} for two days, mapping what the Cartel thinks they've locked down. They've locked down most of it. Not all. There's a section near the east wall where the grid-coverage has a gap — not large enough for a permanent installation, but large enough for a transit point. He marked it and moved on.`,
      `${ctx}Echo checked in from ${zone} this morning — a brief message, coordinates, one line of notes. That's his entire communication style. Finn has complained about this. Echo's position is that if you say less, there's less to intercept. He is not wrong. Finn still finds it aggravating.`,
      `${ctx}The route Echo found through ${zone} cuts forty minutes off the supply run Cielo's been making twice a week. He walked it three times to make sure, then sent her the path with annotated notes on every decision point. She used it the next day. She sent back a voice message that was mostly just exhaling.`,
    ], s)

    case 'ECHO_FINDS': return r([
      `${ctx}Echo found something in ${zone} that shifted the shape of things slightly: ${w.echoLastFind ?? 'something that wasn\'t on any current map'}. He sat with it before telling anyone — not hiding it, just making sure he understood what he was looking at. He told Lyra first. She went quiet. Then: "send me the coordinates."`,
      `${ctx}The thing Echo found in ${zone} — ${w.echoLastFind ?? 'an unmarked access point'} — is the kind of discovery that makes everyone reconsider their assumptions slightly. Finn wants to use it immediately. Cielo wants to secure it first. Echo is in the middle, which is usually where he ends up: he finds things, other people argue about what to do with them. He doesn't mind. He's already looking for the next one.`,
    ], s)

    case 'CARTEL_PUSH': return r([
      `The Cartel moved into ${zone} — and ${zone} had Lyra's patterns in it.\n\n${ctx}Her designs are gone now, overwritten with the Cartel's flat template. The grid there looks the way all Cartel-held territory looks: uniform, locked, nothing personal. Finn heard from Echo and sent Lyra a message that was mostly practical — what's accessible, what's covered, what can be recovered. She hasn't replied yet. She will.`,
      `${zone} fell to the Cartel.\n\n${ctx}Lyra had been working there for weeks. The Cartel found the vulnerability she hadn't closed yet — she'd known it was there, been working toward it, didn't get there in time. She told Finn this exactly once. He said nothing, because there was nothing useful to say. He's already looking at the map.`,
    ], s)

    case 'CARTEL_ADVANCE': return r([
      `${ctx}The Cartel made a move in ${zone} today — open territory, or what was. Now it's another flat grey section on the map. The Cast logged it. The five noted it. The pressure went up. Life in the parts of Normia that are still free continued, because it has to.`,
      `${ctx}Another zone goes grey. ${zone} is Cartel territory now. The people who were living there in the grid's open layer have been pushed into corners or have moved on. This is what the Cast calls an advance. What the people who used to paint their grid-walls there call it is not something the Cast records.`,
    ], s)

    default: return `The Cast logged ${zone}. The city keeps moving.`
  }
}

function headline(beat: Beat, zone: string, w: W, seed: number): string {
  const s = Math.abs(seed)
  switch (beat) {
    case 'GENESIS':        return r([`The Record Opens`, `Normia, Before Everything`, `${zone} — First Entry`], s)
    case 'ERA_TURN':       return `${w.era}`
    case 'LONG_QUIET':     return r([`A Pause in the Record`, `The City Breathes`, `Quiet Stretch`], s)
    case 'SIMULTANEOUS':   return r([`Two at Once`, `Same Moment — ${zone}`, `The Grid Doubles`], s)
    case 'LYRA_DESIGNS':   return r([`Lyra, Working`, `New Pattern — ${zone}`, `Lyra's Current Project`], s)
    case 'LYRA_DAILY':     return r([`Lyra's Day`, `An Ordinary Morning — ${zone}`, `Lyra, Off the Clock`], s)
    case 'LYRA_RESPONDS':  return r([`Lyra Adjusts`, `After the Cartel Moved — ${zone}`, `She's Already Working on It`], s)
    case 'FINN_RECLAIMS':  return r([`Finn, Last Night`, `${zone} — Recovered`, `The Quiet Return`], s)
    case 'FINN_DAILY':     return r([`Finn at the Café`, `A Day Between Operations`, `Finn, Sitting Still`], s)
    case 'FINN_STREAK':    return r([`Three Days Running`, `Finn, Still Going`, `No Stopping Yet`], s)
    case 'CAST_LOGS':      return r([`The Record: ${zone}`, `Logged`, `Another Entry`], s)
    case 'CAST_READS':     return r([`The Cast Reads the Situation`, `Full Picture`, `Where Things Stand`], s)
    case 'CIELO_RUNS':     return r([`Cielo's Network`, `The ${zone} Operation`, `Supply Day`], s)
    case 'CIELO_DAILY':    return r([`Cielo, This Morning`, `The Long Way Through ${zone}`, `A Good Hour`], s)
    case 'CIELO_CRISIS':   return r([`Running Short`, `${zone} — Close Call`, `Cielo Works It`], s)
    case 'ECHO_SCOUTS':    return r([`Echo in ${zone}`, `What the Cartel Missed`, `Two Days Mapping`], s)
    case 'ECHO_FINDS':     return r([`Echo Found Something`, `Unmarked — ${zone}`, `What Wasn't on the Map`], s)
    case 'CARTEL_PUSH':    return r([`${zone} Falls`, `The Cartel Takes Lyra's Work`, `A Zone Goes Dark`], s)
    case 'CARTEL_ADVANCE': return r([`${zone} Goes Grey`, `The Cartel Advances`, `Another One`], s)
    default:               return zone
  }
}

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
  GENESIS: 'FIRST_LIGHT', ERA_TURN: 'ERA_SHIFT', LONG_QUIET: 'LONG_DARK', SIMULTANEOUS: 'CONVERGENCE',
  LYRA_DESIGNS: 'MARK_MADE', LYRA_DAILY: 'THE_STEADY', LYRA_RESPONDS: 'RETURN',
  FINN_RECLAIMS: 'RETURN', FINN_DAILY: 'THE_STEADY', FINN_STREAK: 'SIGNAL_SURGE',
  CAST_LOGS: 'NIGHTWATCH', CAST_READS: 'THE_READING',
  CIELO_RUNS: 'THE_STEADY', CIELO_DAILY: 'THE_STEADY', CIELO_CRISIS: 'DEPARTURE',
  ECHO_SCOUTS: 'FAR_SIGNAL', ECHO_FINDS: 'RELIC_FOUND',
  CARTEL_PUSH: 'CONTESTED_ZONE', CARTEL_ADVANCE: 'DEPARTURE',
}
const BEAT_ICON: Record<Beat, string> = {
  GENESIS: '→', ERA_TURN: '║', LONG_QUIET: '◌', SIMULTANEOUS: '⊕',
  LYRA_DESIGNS: '▪', LYRA_DAILY: '▫', LYRA_RESPONDS: '◈',
  FINN_RECLAIMS: '◆', FINN_DAILY: '◇', FINN_STREAK: '◆',
  CAST_LOGS: '○', CAST_READS: '◉',
  CIELO_RUNS: '—', CIELO_DAILY: '–', CIELO_CRISIS: '—',
  ECHO_SCOUTS: '▿', ECHO_FINDS: '◈',
  CARTEL_PUSH: '✕', CARTEL_ADVANCE: '✕',
}
const BEAT_SCENE: Record<Beat, SceneType> = {
  GENESIS: 'dawn', ERA_TURN: 'reckoning', LONG_QUIET: 'quiet', SIMULTANEOUS: 'convergence',
  LYRA_DESIGNS: 'construction', LYRA_DAILY: 'quiet', LYRA_RESPONDS: 'reckoning',
  FINN_RECLAIMS: 'arrival', FINN_DAILY: 'quiet', FINN_STREAK: 'sacrifice',
  CAST_LOGS: 'vigil', CAST_READS: 'vigil',
  CIELO_RUNS: 'tending', CIELO_DAILY: 'quiet', CIELO_CRISIS: 'tending',
  ECHO_SCOUTS: 'arrival', ECHO_FINDS: 'arrival',
  CARTEL_PUSH: 'destruction', CARTEL_ADVANCE: 'destruction',
}
const BEAT_INTENSITY: Record<Beat, number> = {
  GENESIS: 25, ERA_TURN: 90, LONG_QUIET: 40, SIMULTANEOUS: 70,
  LYRA_DESIGNS: 45, LYRA_DAILY: 20, LYRA_RESPONDS: 80,
  FINN_RECLAIMS: 75, FINN_DAILY: 25, FINN_STREAK: 90,
  CAST_LOGS: 30, CAST_READS: 65,
  CIELO_RUNS: 35, CIELO_DAILY: 15, CIELO_CRISIS: 70,
  ECHO_SCOUTS: 50, ECHO_FINDS: 80,
  CARTEL_PUSH: 95, CARTEL_ADVANCE: 75,
}
const BEAT_FEATURED = new Set<Beat>(['GENESIS','ERA_TURN','LONG_QUIET','LYRA_RESPONDS','FINN_STREAK','CAST_READS','ECHO_FINDS','CARTEL_PUSH'])
const MOOD_FOR_SCENE: Record<SceneType, NonNullable<StoryEntry['visualState']>['mood']> = {
  construction: 'surge', destruction: 'chaos', vigil: 'quiet', tending: 'quiet',
  arrival: 'wonder', convergence: 'wonder', reckoning: 'chaos', quiet: 'quiet',
  dawn: 'normal', sacrifice: 'departure',
}

function makeDispatch(beat: Beat, zone: string, char: CharacterKey, w: W): string {
  if (beat === 'CARTEL_PUSH') return `The Cartel took ${zone}. It was Lyra's.`
  if (beat === 'CARTEL_ADVANCE') return `${zone} is Cartel territory now.`
  if (beat === 'LYRA_RESPONDS') return `Lyra is already working on getting it back.`
  if (beat === 'FINN_STREAK') return `Finn hasn't stopped. Third zone this stretch.`
  if (beat === 'CAST_READS') return `The Cast read the full picture. The five are still standing.`
  if (beat === 'ECHO_FINDS') return w.echoLastFind ? `Echo found ${w.echoLastFind}.` : 'Echo found something.'
  if (beat === 'CIELO_CRISIS') return w.cieloShortage ? `The network is short on ${w.cieloShortage}.` : 'Something is wrong.'
  if (w.lastCartelPush && !w.finnReclaimedAfterPush) return `${w.lastCartelPush} is still grey. Working on it.`
  return `${CHARACTERS[char].name} in ${zone}.`
}

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
    const isCartelMove = event.type === 'BurnRevealed'
    const h = headline(beat, zone, w, seed)
    const b = body(beat, zone, char, w, seed)
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
      dispatch: makeDispatch(beat, zone, char, w),
      visualState: {
        mood: MOOD_FOR_SCENE[scene],
        intensity: BEAT_INTENSITY[beat],
        dominantZone: zone,
        signalName: CHARACTERS[char].name,
        scene, charKey: char,
      },
      sourceEvent: {
        type: event.type,
        tokenId: isCartelMove && event.targetTokenId !== undefined ? `#${event.tokenId} → #${event.targetTokenId}` : `#${event.tokenId}`,
        blockNumber: event.blockNumber.toLocaleString(),
        txHash: event.transactionHash,
        count: event.count.toString(),
        ruleApplied: `${CHARACTERS[char].name} — ${beat.toLowerCase().replace(/_/g, ' ')}`,
        ruleExplanation: `Token #${event.tokenId} → ${CHARACTERS[char].name}. Beat: ${beat}. Zone: ${zone}.`,
      },
    })
    advance(w, char, zone, beat, isCartelMove)
  }
  return result
}

export const PRIMER_ENTRIES: StoryEntry[] = [{
  id: 'primer-genesis', eventType: 'genesis', loreType: 'FIRST_LIGHT',
  era: 'Before the Cartel Moved', icon: '◈', featured: true,
  headline: 'The Record Opens', dispatch: 'Normia. Before everything.',
  body: `Normia is a city that exists in two layers: the streets and buildings you can walk through, and the pixel-grid mapped onto them — a second skin of light and claim that decides who holds what and who can change it. The grid is how the city remembers itself.

The Glyph Cartel wants all of it. Not to live in. To rewrite. Control enough pixels and you control what the city is allowed to be — who can open a business, who can gather, what gets marked as sanctioned and what gets marked as illegal. The Cartel has been moving for two years. They have a lot of the grid. They don't have all of it.

Five people are the reason they don't have all of it. They didn't volunteer for this. They had lives in Normia and the war found them.

Lyra is an architect. She designs open-source grid patterns and releases them freely — tools that let anyone hold their own territory without owing the Cartel anything. She's been doing this her whole career. It has become more urgent.

Finn used to work for the Cartel. He knows how they operate because he helped build the operation. He left. He has been spending the years since undoing what he helped do.

The Cast is the grid's witness-system — autonomous, factional to no one, logging everything. Every claim, every loss, every small act of resistance or surrender. It has no feelings about what it records. That is the point of it.

Cielo runs the safehouse network. Food, medicine, shelter, forged credentials, safe routes — the infrastructure that keeps people alive when the Cartel is trying to cut them off. She is the reason more people are fighting than the Cartel expected.

Echo scouts. He maps the gaps in the Cartel's coverage — the corridors they don't know about, the zones they think they've locked but haven't. He finds things. He brings them back.

This is the Cast's record of what the five did, and what was done to them, and to the city around them, while the Cartel tried to take everything.`,
  activeCharacter: 'CAST',
  visualState: { mood: 'normal', intensity: 20, dominantZone: 'the Open Grid', signalName: 'The Cast', scene: 'dawn', charKey: 'CAST' },
  sourceEvent: { type: 'genesis', tokenId: '—', blockNumber: '—', txHash: '—', count: '—', ruleApplied: 'World Primer', ruleExplanation: 'Opening entry.' },
}]
