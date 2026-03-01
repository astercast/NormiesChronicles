# Complete rewrite of ALL body text and headlines to remove jargon and read as war narrative
import re

content = open('/home/claude/normies-chronicles/lib/storyGenerator.ts').read()

REWRITES = {

'GREAT_BATTLE': {
  'headlines': [
    "'{faction} Take {region} — Nothing Left of What Was There",
    "The Fall of {region}: {faction} Seize Everything",
    "{faction} Overrun {region}",
    "{rival}'s Hold on {region} Breaks",
    "All of {region} Falls in a Single Hour",
    "The Longest Night at {region} — {faction} Win It",
  ],
  'bodies': [
    "{faction} came for all of {region}, not part of it. They moved on every corner at once and held nothing back. By the time {rival} understood the scale of what was happening, it was already over.",
    "{rival} had held {region} long enough to believe they would keep it. They were wrong. {faction} came with everything and left nothing untouched. The zone changed hands completely.",
    "The fight at {region} was not a skirmish. {faction} committed everything — every presence they had in the area — and the ground fell to them entirely. {rival} withdrew. There was nothing left to defend.",
    "A full assault on {region}. {faction} moved fast and hit everywhere at once, giving {rival} no single line to hold. When it ended, every corner of the zone was theirs.",
    "{faction} didn't negotiate for {region}. They took it. The assault was coordinated, complete, and final. {rival} was not given a chance to respond — only to understand what had happened.",
    "{rival} lost {region} in a single sustained push. {faction} overwhelmed every position simultaneously. The zone went silent when it was over, and the silence was {faction}'s.",
    "Everything that was {rival}'s at {region} is now {faction}'s. The assault was total. Nothing was held in reserve, no approach was left incomplete. The zone fell.",
    "At {region}, {faction} stopped holding back. They moved on the whole zone at once — not the edge, not a test — all of it. {rival} was still forming a response when it was already finished.",
  ],
},

'SKIRMISH': {
  'headlines': [
    "{faction} Push Deeper at {region}",
    "The Line Shifts at {region}",
    "A Sharp Exchange Near {region}",
    "{faction} Take a Corner of {region}",
    "{rival} Pushed Back at {region}",
    "Ground Won at {region} — But Only Some of It",
  ],
  'bodies': [
    "{faction} moved on {region} and took exactly what they came for — no more, no less. Precise. {rival} couldn't get a counter-move together before the new line was already set.",
    "An exchange at {region}: {faction} pushed in, {rival} answered, and when the dust settled {faction} were further than they'd been before. A small gain. A real one.",
    "{faction} found the weak point in {rival}'s hold on {region} and moved through it before {rival} could close the gap. The line has moved. {rival} will have noticed by now.",
    "Controlled, deliberate, and effective. {faction} took a piece of {region} that {rival} had been holding and didn't let go. The zone is different now. The difference matters.",
    "{rival} was watching the wrong direction at {region}. {faction} came through where the ground was soft and were settled before {rival} turned to look.",
    "{faction} has been working {region} piece by piece. Today another piece went to them. Each one small. Together they're adding up to something {rival} should worry about.",
    "The exchange at {region} was brief and decisive. {faction} hit the edge of {rival}'s territory, held it against the counter, and walked away with ground they didn't have before.",
    "Not a rout — a careful, measured gain. {faction} at {region}, moving precisely, taking only what was reachable. {rival} held the rest. But {faction} moved the line.",
  ],
},

'BORDER_RAID': {
  'headlines': [
    "A Mark at the Edge of {region}",
    "{faction} Touch {region}'s Border — Then Withdraw",
    "A Small Claim on {region}'s Margin",
    "The Boundary Shifts Overnight",
    "{faction} Leave Their Mark at the Edge",
    "A Probe at {region}",
  ],
  'bodies': [
    "{faction} reached the edge of {region} and left something there — small, deliberate, unmistakable. A claim without a confrontation. A line drawn quietly in the night.",
    "A single mark at {region}'s boundary. {faction} placed it and withdrew. The statement it makes is not about size. It's about reach — about proving they can touch this edge any time they want.",
    "The edge of {region} looks different this morning. {faction} was there overnight. They didn't push deep, but they left proof they were there. {rival} will have to decide what to do with that.",
    "Not an attack. Not yet. {faction}'s move at {region}'s margin was a question — one they don't need {rival} to answer out loud. The presence at the border is answer enough.",
    "{faction} touched the edge of {rival}'s ground at {region} and pulled back. The mark they left is small. The implication isn't. You don't reach the border unless you're thinking past it.",
    "Three marks at the edge of {region}. Small ones. {faction} placed them and disappeared. They say: we've been here, we can come back, and next time we might not stop at the boundary.",
  ],
},

'FORMAL_DECLARATION': {
  'headlines': [
    "{faction} Name What They've Already Won",
    "The Declaration: {region} Belongs to {faction}",
    "{faction} Claim {region} Formally — The Map Already Showed It",
    "Official: {faction} Hold {region}",
    "What Everyone Could See, {faction} Now Say Aloud",
    "{faction} Declare {region} Theirs",
  ],
  'bodies': [
    "{faction} named what the map already showed. {region} is theirs — in practice, in territory, in every measurement that matters. The declaration just makes the obvious official.",
    "The claim on {region} was real before {faction} announced it. They held every part of the zone, {rival} had withdrawn, and the ground had been theirs for long enough that naming it was almost ceremonial.",
    "{faction} put words to what they'd already done. {region} is under their control — completely, demonstrably — and now it is formally stated. {rival} can contest the words. Not the territory.",
    "The declaration came after the work. {faction} took {region}, held it, and only then said so publicly. They weren't claiming something uncertain. They were recording something complete.",
    "{rival} heard the declaration. The map had already told them everything it said. {faction}'s hold on {region} was visible long before it was spoken — the announcement changed nothing on the ground.",
    "You don't declare what you don't have. {faction} declared {region}, which means {faction} has {region}. Every corner of it, held before the words were said.",
  ],
},

'GREAT_SACRIFICE': {
  'headlines': [
    "One Presence Burns Near {region}",
    "A Sacrifice at {region} — Gone, But Not Wasted",
    "They Gave Everything Near {region}",
    "A Life Given Near {region}",
    "The Price Was Everything — Near {region}",
    "What Was Given Near {region} Cannot Be Returned",
  ],
  'bodies': [
    "Near {region}, a presence gave everything it had — every capacity, every reserve — and dissolved into the others around it. Gone now. But what it carried lives on in those who remain.",
    "Someone near {region} made the decision to give everything. Not under duress, not at the edge of defeat — a choice, made fully, with full knowledge of what it cost. The others are stronger for it.",
    "A presence burned near {region}. What it had accumulated — strength, capacity, the ability to act — passed to those still standing. The burning was quiet. The effect was not.",
    "The sacrifice near {region} was total. Everything offered, nothing held back. The one who gave is gone from the chronicle. What they gave remains, distributed among those who carry it forward.",
    "Near {region}, one ended so others could go further. The giving was complete — all of it, not just what was easy. The ground near {region} is different now. The others feel the weight of what was given.",
    "It happened without warning near {region}. A presence committed everything and was gone. No hesitation. No negotiation. The full weight of what it had, passed to those who needed it most.",
    "The burn near {region}: total, voluntary, irreversible. Someone gave the chronicle everything they had and asked for nothing in return. The map doesn't show it. The war knows.",
  ],
},

'OFFERING': {
  'headlines': [
    "A Gift Between Presences Near {region}",
    "Near {region}: Strength Shared, Not Spent in Battle",
    "Something Passes Quietly Near {region}",
    "An Offering in the War's Margins",
    "Not a Fight — A Gift Near {region}",
    "Quiet Transfer Near {region}",
  ],
  'bodies': [
    "Not every act near {region} was violent. One presence gave a portion of what it had to another — quietly, without fanfare, without asking for anything back. The war continues. So does this.",
    "A small gift in a large war. Near {region}, something was shared between two presences — strength passed from one hand to another. The ground didn't change. The people on it did.",
    "Near {region}, the giving happened in the margins of the main conflict. One offered. The other received. Both continued. Small transactions sustain a long war.",
    "An offering near {region}: not sacrifice, not battle — a deliberate gift of strength from someone who had it to someone who needed it. The chronicles are full of fighting. This was something else.",
    "Between the large events, the small ones happen. Near {region}, strength moved between presences through a quiet act of giving. No glory in it. Necessary nonetheless.",
  ],
},

'BLOOD_OATH': {
  'headlines': [
    "The Second Sacrifice Near {region}",
    "They Gave Everything Twice Near {region}",
    "Near {region}: A Promise Kept the Hardest Way",
    "The Double Burning Near {region}",
    "Once Was Not Enough — Second Sacrifice Near {region}",
    "Given Again Near {region}",
  ],
  'bodies': [
    "The presence near {region} had burned before. It rebuilt itself — gathered strength, found capacity again — and then gave it all away a second time. Once was a sacrifice. Twice is something the chronicle doesn't have a word for.",
    "Near {region}, the same presence burned twice. The first time, they gave everything. They came back. They gave everything again. Some decisions don't end with the first making.",
    "Two burns from the same source near {region}. The first was heavy. The second was heavier — made with full knowledge of what it cost the first time, and given anyway.",
    "The chronicle records double sacrifices rarely. Near {region}, the same presence gave everything, recovered, and gave everything again. What that costs is not measured in capacity. It's measured in will.",
    "Near {region}, a second total giving from a presence that had already given once before. Both entries are in the record. They tell the same story twice, and the second telling is harder.",
  ],
},

'VETERAN_RETURNS': {
  'headlines': [
    "A Familiar Presence Returns to {region}",
    "{faction} Come Back to {region}",
    "Old Ground, New Arrival — {region}",
    "After the Absence: {faction} at {region} Again",
    "The Return to {region}",
    "Back at {region} — With History Here",
  ],
  'bodies': [
    "A presence returned to {region} that had been quiet for a long time. The ground changed while they were gone — {faction} have been at work here — but the returning face knows the terrain. They've been here before.",
    "{faction} came back to {region}. They were away — the record shows the gap — but now they're back, moving on ground they've fought over before. Absence doesn't mean forgotten.",
    "The return to {region}: someone who had gone quiet arrived again. Not a newcomer. Not a stranger. Someone who knows this ground, who has history in this zone, who is back now with reason.",
    "A gap, then a return. Near {region}, a presence that had been absent for a long stretch reappeared. Whatever pulled them away is over. They're here again, and they've brought the memory of last time.",
    "The chronicler noted the absence at {region}. Now the chronicler notes the return. The same presence, back at the same ground, in a different moment of the war. Still here. Still counting.",
  ],
},

'NEW_BLOOD': {
  'headlines': [
    "A New Presence at {region}",
    "Someone New Marks {region} for the First Time",
    "The Chronicle Opens a New Entry — {region}",
    "First Appearance Near {region}",
    "A Name Not Seen Before — Now Near {region}",
    "New to the War, First Move at {region}",
  ],
  'bodies': [
    "A first mark near {region} from a presence the chronicle hadn't seen before. The record opens. The story this presence will add to the war is not yet written — only the first line of it.",
    "Someone new arrived near {region}. No history in the chronicle, no prior moves — just this one, the first, the beginning of whatever story they carry into the war from here.",
    "The chronicle notes firsts. Near {region}, a presence made their first mark in the war. They arrived when they arrived, moved when they moved. The record is open.",
    "New to the record, active near {region}. The chronicle has no prior history for this presence — only the one they're making now. The war is long. Newcomers always have room to matter.",
    "First entry: near {region}, a presence that had not been recorded before now. Every faction started with a first entry. This is theirs. What comes next is still ahead.",
  ],
},

'THE_ORACLE': {
  'headlines': [
    "The Oracle Moves at {region}",
    "An Ancient Presence Acts Near {region}",
    "The One Who Arrives Before Things Change",
    "Near {region}: The Oracle Has Been Here Before",
    "Old and Watchful — Moving at {region}",
    "The Chronicle Marks the Oracle's Move Near {region}",
  ],
  'bodies': [
    "The Oracle moved near {region}. These old presences don't act randomly — they appear when things are about to change, and they've been right before. The chronicle marks it and watches.",
    "One of the first-comers is active near {region}. Ancient, infrequent, watched carefully by those who know the pattern: when these presences move, the war tends to shift soon after.",
    "The Oracle came to {region}. The chronicle has seen this before — a very old presence appears at a very specific moment, and something changes in the war's shape not long after. Watching.",
    "Near {region}, a presence from the war's earliest hours acted. It moves rarely. When it moves, the chronicler pays attention. Not because the move is always large — because it's always timed.",
    "The old ones don't stay silent forever. Near {region}, one of the war's first presences made a move. The chronicle has learned to notice when this happens. Something usually follows.",
  ],
},

'ANCIENT_WAKES': {
  'headlines': [
    "One of the First Stirs Near {region}",
    "Ancient Presence Active Near {region}",
    "The Old Ones Are Moving Again",
    "Near {region}: A Face from the Very Beginning",
    "First-Era Presence Active at {region}",
    "The Chronicle's Oldest Presence Acts Near {region}",
  ],
  'bodies': [
    "One of the war's first participants is active near {region}. They were here before most of the current factions had names. They are here still.",
    "Near {region}, a presence from the war's opening days made a move. The ground has changed dramatically since they first appeared. They've watched it all change. They're still making moves.",
    "The chronicle marks an ancient presence stirring near {region}. This face was in the record when the record was new. They've outlasted many who came after. They're here now, active and present.",
    "Old and still moving. Near {region}, a presence from the first days of the war acted. They've seen every era, every faction, every turning. Whatever brings them to {region} now carries the weight of all that.",
    "Near {region}: a presence so old the chronicle had to search backward to find their first entry. Still here. Still acting. Some presences in this war don't fade — they simply continue.",
  ],
},

'FAR_REACH': {
  'headlines': [
    "Activity at {region} — Far from the Main Lines",
    "The War Reaches {region}",
    "Out at the Margins: Movement Near {region}",
    "{faction} Found at the Edge Near {region}",
    "Beyond the Front: {region} Is Not Empty",
    "The Edges of the War — Near {region}",
  ],
  'bodies': [
    "The war reached {region} — out past the places everyone is watching, at the far edge of the contested territory. Something is happening there that the main chronicle is only catching a glimpse of.",
    "Out near {region}, away from the loudest fights, presences are active. The margins of this war have their own story. The chronicler has been under-representing it.",
    "Far from the main front, near {region}, the war continues at a quieter register. The ground out here is less watched, less fought over — but it is not unclaimed. Someone is working it.",
    "Near {region}, at the edge of the known conflict: activity. Quiet, patient, away from the main engagements — but real. The war is larger than its center.",
    "The chronicle's attention has been on the center. Near {region}, far from it, something has been building slowly. Not dramatic. Consistent. The edges of a war can decide it.",
  ],
},

'HOLLOW_GROUND': {
  'headlines': [
    "{faction} Take {region} — Again",
    "{region} Changes Hands Once More",
    "The Most-Fought Zone: {region} Falls Again",
    "{rival} Lose {region} — Not for the First Time",
    "{region}: Still Changing, Still Contested",
    "The Cycle Continues at {region}",
  ],
  'bodies': [
    "{region} has been every faction's and no faction's. {faction} hold it now — but the ground has a memory. {rival} held it before them. Someone else before that. The zone doesn't stay.",
    "Another change at {region}. The most-fought ground in the war changes hands again. {faction} won this round. The record remembers who won the last one, and the one before that.",
    "{faction} hold {region} for now. The chronicle is careful about how it notes this — not because the taking wasn't real, but because the holding never lasts here. It never has.",
    "The ground at {region} has been contested since the first days of the war. It changes. It always changes. Today it changed in {faction}'s favor. The chronicler waits to record the next change.",
    "{rival} had {region}. Now {faction} does. The war at this zone is a history of turnovers — each one recorded, each one followed by another. Today's winner is real. Tomorrow is uncertain.",
    "{region} went to {faction}. Again. The chronicle has more entries for this zone than almost anywhere else in the war — each one a taking, a losing, a retaking. The cycle turns.",
  ],
},

'TURNING_POINT': {
  'headlines': [
    "The Pattern Becomes Clear — Twenty-Five Entries",
    "Step Back and Look: {faction} Have Been Winning",
    "Twenty-Five Moments, One Direction",
    "At Twenty-Five — The Shape of the War Is Visible",
    "The Chronicle Steps Back: What the Last Twenty-Five Show",
    "A Direction Emerges at the Twenty-Fifth Mark",
  ],
  'bodies': [
    "Twenty-five entries. Read them all together and the pattern is unmistakable: {faction} have been advancing consistently, {rival} have been losing ground, and the direction has not changed once.",
    "The chronicle marks twenty-five to force the larger view. The larger view: {faction}'s presence has grown across every zone the war touches, steadily, without reversing. Not noise. Direction.",
    "Twenty-five moments in the record. Each one seemed like its own thing at the time. Read together, they describe a war that has been moving toward {faction} since the beginning of this window.",
    "At the twenty-fifth entry, the chronicle steps back and counts. What it finds: {faction} further than they were, {rival} compressed, the territory between them changed in a way that compounds.",
    "The shape of the last twenty-five entries: {faction} gaining, {rival} yielding, the ground shifting in one direction across every exchange. The chronicle notes this. The war is going somewhere.",
    "Step back from each individual engagement and read twenty-five as a whole. The whole says: {faction}. Their direction. Their momentum. Twenty-five entries of it.",
  ],
},

'DOMINION_GROWS': {
  'headlines': [
    "{faction} Are Everywhere in the War Right Now",
    "{faction}'s Reach Across the Territory",
    "The Map Belongs to {faction} — More Every Day",
    "Count the Ground: {faction} Lead",
    "{faction} at the Center of Everything",
    "The War's Shape: {faction} Dominant",
  ],
  'bodies': [
    "{faction} appear in more of the war's active ground than anyone else right now. It's not dramatic — it's systematic. They are present across the contested zones in a way {rival} simply is not.",
    "The territory count doesn't lie: {faction} hold more, contest more, appear in more of the war's active moments than any other presence. {rival} is losing the geography of this conflict.",
    "{faction} have been pushing on multiple fronts at once. The result: a war map that increasingly belongs to them. Not through one big win — through consistent presence that adds up.",
    "Dominion reads differently from victory. {faction} haven't defeated everyone — they've simply become the dominant fact in almost every part of the contested territory. The difference matters.",
    "The map of the war, read honestly, centers on {faction} right now. More zones in their control. More engagements where they appear. More of the narrative with their presence in it.",
  ],
},

'THE_SILENCE': {
  'headlines': [
    "The War Goes Quiet at {region}",
    "Both Sides Hold — {region} Holds Too",
    "Low Activity: {region} Between Engagements",
    "The Pause at {region}",
    "Nothing Moves at {region}",
    "The Ground at {region} Rests",
  ],
  'bodies': [
    "{faction} and {rival} face each other across {region} and neither moves. Both present. Both ready. Neither acting. The silence has its own kind of weight.",
    "The war at {region} paused. The ground sits in the configuration the last engagement left it — {faction} on one side, {rival} on the other, both watching the same quiet.",
    "No movement at {region}. Both sides hold their positions. The silence isn't peace — it's recalculation. Both sides measuring what comes next, neither willing to move first.",
    "Still at {region}. {faction} hold their ground. {rival} holds theirs. The zone rests in an equilibrium neither chose — they simply stopped at the same moment and haven't started again.",
    "The quiet near {region} stretches. Not comfortable — tense, loaded, the kind of quiet that comes before something breaks. The break hasn't come yet. Both sides wait.",
    "{faction} and {rival} are both at {region}. Neither is moving. The ground remembers the last engagement and holds its shape while the next one forms somewhere else, out of sight.",
  ],
},

'NEW_AGE': {
  'headlines': [
    "{era} — The War Crosses a Threshold",
    "The Chronicle Opens: {era}",
    "A New Era Begins: {era}",
    "The War Is Old Enough to Change Its Name: {era}",
    "Threshold Crossed — {era} Begins",
    "{era}: Everything Before This Was Prologue",
  ],
  'bodies': [
    "The war has lasted long enough to earn a new name for what it's become. {era} begins here — built on everything that came before it, shaped by every choice the record holds.",
    "{era}. The chronicle turns a page that isn't in the document — a threshold the war crossed without pausing, without announcing, that only becomes visible looking back.",
    "The mark was reached and {era} began. Not because the war changed in a single moment, but because enough moments accumulated that the old name no longer fit what the war had become.",
    "Eras don't announce themselves. They're named afterward, when the record is long enough to describe a shape. {era} is the shape of what this war has been. It continues.",
    "The chronicle steps back at this threshold and names the era. {era}. The map at this moment — who holds what, who is pushing where — is the inheritance every future engagement builds from.",
    "{era} opens. The war doesn't stop for the naming of it, but the chronicle marks the change. Everything that follows happens in this era. Everything before it shaped the ground it starts from.",
  ],
},

'CONVERGENCE': {
  'headlines': [
    "Two Presences, One Moment, {region}",
    "They Arrived at {region} at the Same Time",
    "{faction} and Another — Simultaneously at {region}",
    "The Same Ground, the Same Moment — Near {region}",
    "A Meeting No One Planned at {region}",
    "Two Paths Cross at {region}",
  ],
  'bodies': [
    "Two presences arrived at {region} at the same moment — {faction} from one direction, something else from another. Neither expected the other. Both acted. The ground holds both actions.",
    "The chronicle records a meeting at {region} that no one planned: {faction} and an unknown presence, at the same place, in the same moment. The territory bears the marks of both.",
    "At {region}: two arrivals at once. {faction} moved on the ground at the same moment another presence did, neither aware of the other. The encounter is in the record. What it means is still forming.",
    "Convergence near {region}. Two separate stories arrived at the same point simultaneously. {faction} was one. Something else was the other. The ground now holds the trace of both.",
    "Two presences, same place, same breath. {faction} and another came to {region} together — not by design, not by coordination. The coincidence is documented. Coincidences in war are never only coincidences.",
  ],
},

'RELIC_FOUND': {
  'headlines': [
    "{relic} Surfaces Near {region}",
    "Something Ancient at {region}: {relic}",
    "The Chronicle Marks {relic} — Near {region}",
    "{relic} Is Active at {region}",
    "An Old Power Stirs: {relic} Near {region}",
    "{relic} Found in the Territory Near {region}",
  ],
  'bodies': [
    "{relic} came into the record near {region}. These ancient things carry more weight than any single engagement — their presence changes what's possible. Both sides will have noticed.",
    "Near {region}, {relic} surfaced. Old, rare, and significant in ways the chronicler is only beginning to understand. What it means for the territory around it is not yet clear. Both {faction} and {rival} will be asking the same question.",
    "The chronicle marks {relic} near {region}. These presences from the war's earliest days appear rarely and rarely without consequence. The territory has shifted before because of them.",
    "Something old came to light near {region}. {relic} — ancient even by the war's standards, significant in ways that outlast any particular engagement. The ground around it matters differently now.",
    "{relic} at {region}. The chronicle has seen what these things do to a conflict when they appear in it. The territory near {region} is now territory worth watching for different reasons.",
  ],
},

'WAR_COUNCIL': {
  'headlines': [
    "{faction} Move Fast and Often Near {region}",
    "A Burst of Action from {faction} Near {region}",
    "{faction} Escalate Their Activity at {region}",
    "Something Decided — {faction} in Motion Near {region}",
    "High Tempo: {faction} Near {region}",
    "A New Pace — {faction} at {region}",
  ],
  'bodies': [
    "{faction} moved faster and more often near {region} than they had been. Multiple actions in a short time, each one building on the last. Something shifted in their approach. The pace changed.",
    "A burst of coordinated movement from {faction} near {region}. Not a single large action — a cluster of smaller ones, rapid and deliberate, each placing more ground in their favor.",
    "Near {region}, {faction} picked up their tempo dramatically. More moves in less time, faster response to {rival}'s positions, an urgency that hadn't been there before. Something was decided.",
    "{faction} came to {region} with a different energy — more actions, faster, concentrated in a way that looked less like habit and more like intention. The ground near {region} changed faster for it.",
    "High activity from {faction} near {region}: not one move but many, clustered, purposeful. {rival} had been counting on the slower pace. {faction} changed it without warning.",
  ],
},

'CARTOGRAPHY': {
  'headlines': [
    "The Territory at {region} — Mapped and Recorded",
    "Where Things Stand at {region}",
    "The Chronicle Takes Stock of {region}",
    "The Current Shape of {region}",
    "Surveying {region}: Who Holds What",
    "A Reading of the Ground at {region}",
  ],
  'bodies': [
    "The territory at {region}, mapped from the current state: {faction} hold the interior, {rival} hold the edges they've been defending, the boundary between them drawn by the most recent engagement.",
    "The chronicle reads {region} as it stands now. {faction} further in than the last survey showed. {rival} compressed at the margins. The ground between them has been moving in one direction.",
    "A survey of {region}: the war's progress written in territory. {faction} here, {rival} there, the contested ground in between carrying the marks of every engagement since the chronicle began.",
    "Where things stand at {region}: {faction} with more of the zone than {rival}, the boundary settled into the configuration the last few engagements left it in. Not permanent. But current.",
    "The territory at {region} read and recorded: both sides present, both sides holding, {faction} with the larger share of the contested ground. The map reflects the war's recent direction.",
  ],
},

'OLD_GHOST': {
  'headlines': [
    "An Ancient Presence Stirs Near {region}",
    "One of the First Is Active Near {region}",
    "Old Ground, Old Face — Near {region}",
    "The Chronicle's Oldest Entries: Near {region}",
    "A First-Era Presence Near {region}",
    "They Were Here Before Anyone Else — Near {region}",
  ],
  'bodies': [
    "Near {region}, one of the war's first presences is active. They were in the chronicle before most factions had names. They've watched every era arrive and pass. They're still here, still moving.",
    "The oldest entries in the chronicle point back to a presence now active near {region}. They've been in this war since the beginning. Their moves carry the weight of everything they've witnessed.",
    "One of the war's originals appeared near {region}. Not a veteran — older than veterans. A presence from the first days of the chronicle, still unfinished, still acting.",
    "Near {region}, something ancient stirred. The chronicle had to go back to its earliest entries to find this presence's beginning. They are here still — after everything, still here.",
    "The old ones don't always stay quiet. Near {region}, a presence from the war's first era made a move. The ground has changed beyond recognition since they first appeared. They've watched it all change.",
  ],
},

'THE_DESERTER': {
  'headlines': [
    "A Presence Goes Quiet Near {region}",
    "Someone Left — Near {region}",
    "The Chronicle Notes an Absence Near {region}",
    "Gone Quiet: Near {region}",
    "One Less Presence at {region}",
    "They Were Here. Now They're Not.",
  ],
  'bodies': [
    "A presence that had been active near {region} went quiet. The record ends at a specific moment — after it, nothing. Their marks remain on the ground. They don't.",
    "Near {region}, someone stopped showing up. The chronicle records the last move, and then silence. What pulled them away isn't in the record. The absence is.",
    "The record near {region} shows a gap where a regular presence used to be. Their last action is there. Everything after it is missing. The ground they touched still shows the marks.",
    "Someone who had been fighting near {region} is gone. Not in battle — they simply stopped appearing. The record closes at their last entry. The war continues without them.",
    "Gone from {region}. A presence that was consistent — regular, recurring — simply stopped. The chronicler notes the absence without knowing the reason. The ground holds what they left.",
  ],
},

'TALLY': {
  'headlines': [
    "Ten Entries — The Shape of the Last Stretch",
    "The Chronicle Counts Ten: {faction} Ahead",
    "Ten Moments: What They Add Up To",
    "At the Tenth Mark — Reading the Pattern",
    "Ten Engagements, One Direction",
    "A Count of Ten — The War's Recent Shape",
  ],
  'bodies': [
    "Ten entries. Count them back and the direction is there: {faction} taking ground, {rival} yielding, the territory between them shifting consistently in one direction. Ten data points. One trend.",
    "The tally at ten: {faction} ahead in every measurement the chronicle tracks — territory held, ground taken, engagements won. {rival} is behind. The gap has been growing.",
    "Ten moments in the record. Each one seemed like its own story at the time. Read together, they describe a war that's been moving toward {faction} and away from {rival} without pause.",
    "At the tenth mark, the chronicle adds it up. {faction} have been more present, more active, more effective across every one of the ten entries than {rival}. Ten is enough to call it a pattern.",
    "The last ten entries of the chronicle, read as one arc: {faction} advancing, {rival} losing ground, the war's balance shifting toward one side. Not dramatically. Steadily.",
  ],
},

'RETURNED_GHOST': {
  'headlines': [
    "A Presence Returns Near {region}",
    "They Came Back to {region}",
    "The Return Near {region}: After the Long Absence",
    "Gone, Then Back — Near {region}",
    "The Absence Ends Near {region}",
    "Back at {region}: Someone the Chronicle Had Lost",
  ],
  'bodies': [
    "Near {region}, a presence the chronicle had lost track of came back. The gap in the record is visible — a stretch of silence, then a return. Why they left and what brought them back is not in the record.",
    "A return near {region}. The chronicle had marked the absence — the long quiet where this presence should have been — and now the quiet is over. They're back. Moving again.",
    "Someone came back to the war near {region}. The record shows when they left — or rather, when they stopped leaving marks. The new mark is the first in a long time. The return is real.",
    "Near {region}, the chronicler notes a familiar presence after a long absence. The ground changed while they were gone. They've returned to a war that moved on without them. They're moving again now.",
    "They were gone. Now they're back at {region}. The chronicle holds the gap — all those entries without them — and now holds the return. Something brought them back. The record opens again.",
  ],
},

'DEBT_PAID': {
  'headlines': [
    "A Second Sacrifice Near {region}",
    "They Gave Everything Twice — Near {region}",
    "The Double Burning Near {region}",
    "Near {region}: Given Again After Everything",
    "Once Wasn't Enough — Second Giving Near {region}",
    "The Second Total Sacrifice Near {region}",
  ],
  'bodies': [
    "The same presence near {region} burned twice. The first time was a sacrifice. They rebuilt. The second time was a debt paid — given again with full knowledge of what it meant to give again.",
    "Near {region}, two total givings from one presence. Both in the record. Between them: rebuilding, returning, the slow accumulation of what was spent — and then the decision to spend it again.",
    "The chronicle records double-burns rarely. Near {region}, a presence gave everything, found its way back to something, and gave everything again. The second giving is harder. They did it anyway.",
    "Two entries in the sacrifice record for the same presence near {region}. The first was heavy. The second was heavier — made knowing what the first one cost, and offered again regardless.",
    "Near {region}: they had given everything before. They had come back. Now they gave everything again. The record holds both givings, with the rebuilding between them implicit in the gap.",
  ],
},

'CAMPFIRE_TALE': {
  'headlines': [
    "The Story Going Around Near {region}",
    "What They're Saying About the War Near {region}",
    "The Account That's Spreading Near {region}",
    "Near {region}: The Version People Are Telling",
    "How the War Is Being Described Near {region}",
    "The Tale at {region}: Simpler Than the Truth",
  ],
  'bodies': [
    "Near {region}, the version of the war people are telling is simpler than the one the chronicle holds. {faction} are the heroes. {rival} are the obstacle. The ending is already certain. The chronicle knows better.",
    "The account spreading near {region} has a clean shape — {faction} moving, {rival} falling back, the war heading somewhere obvious. People prefer clean shapes. The war rarely has them.",
    "Word traveling near {region}: {faction} are winning, {rival} are losing, the direction is clear. The people saying this aren't wrong about the direction. They're wrong about the certainty.",
    "Near {region}, the story being told about the war fits inside a short conversation. What was left out to make it fit that well is the part the chronicle was built to hold.",
    "The account of the war near {region}: {faction} as a force moving in a clear direction, {rival} as the resistance, the outcome as a foregone conclusion. This is one reading. The chronicle holds others.",
  ],
},

'THE_LONG_DARK': {
  'headlines': [
    "A Long Quiet Near {region}",
    "The Chronicle Goes Still Near {region}",
    "Silence Across Many Entries Near {region}",
    "The War Pauses Near {region}",
    "Extended Absence: {region}",
    "Many Entries, Almost Nothing Near {region}",
  ],
  'bodies': [
    "The war near {region} went quiet for a long time. Not the short pause between engagements — a real silence, many entries long, the ground holding without change.",
    "Near {region}, the chronicle went still. The war didn't stop — it simply left this part of the record empty. The ground sat in its last configuration while the rest of the war moved elsewhere.",
    "A long gap near {region}. The chronicle crossed it quickly because there was almost nothing to say — many entries without movement, the territory frozen in the shape the last engagement left it.",
    "The long dark near {region}: a stretch of the chronicle that records near-silence. Both presences still there, the ground still contested — but nothing moving. Long enough to need its own entry.",
    "Near {region}, many entries passed with almost nothing. The chronicler notes the passage of time and the absence of change. The silence eventually ended. This is the entry that records the length of it.",
  ],
},

'EDGE_SCOUTS': {
  'headlines': [
    "Movement at the Margins Near {region}",
    "The Chronicle's Edge: Active Near {region}",
    "Scouting the Far Ground Near {region}",
    "Out Past the Main Lines — Near {region}",
    "What's Happening at the Edge Near {region}",
    "Beyond the Front: {region}'s Margins Are Not Empty",
  ],
  'bodies': [
    "Out near {region}'s margins, away from the main engagements, something is moving. Not dramatic. Patient. The kind of presence that doesn't announce itself and doesn't stop.",
    "The chronicle has been focused on the center. Near {region}, at the edges, a story has been building that the main record missed. Presences working the periphery, quietly, consistently.",
    "Near {region}'s outer ground: activity that the chronicle is only catching now. Presences working the margins of the contested territory, out of sight of the main engagements.",
    "The edges of the war are not empty near {region}. The main chronicle misses them — too focused on the loud fights to track the quiet ones. Out here, the ground is being worked.",
    "Far from where the large engagements happen, near {region}'s outer reach, presences have been active. The chronicle notes the edge with the same care it notes the center. The edges matter too.",
  ],
},

'SHIFTED_PLAN': {
  'headlines': [
    "{faction} Change Their Approach at {region}",
    "A New Way of Moving Near {region}",
    "Near {region}: {faction} Break Their Own Pattern",
    "{faction}'s Strategy Shifts at {region}",
    "Something Different in {faction}'s Movements Near {region}",
    "The Old Approach Ends Near {region}",
  ],
  'bodies': [
    "{faction} moved differently near {region} than they had been. The pattern broke — not by accident, but deliberately. Something in the ground or the opposition made the old approach unworkable. They adapted.",
    "Near {region}, {faction}'s way of engaging changed. The approaches shifted, the rhythm broke, the angles came from directions they hadn't tried before. The war taught them something. They listened.",
    "A veteran does something new when the old thing stops working. Near {region}, {faction} tried a different approach — noticeably different from what the recent record showed. Something prompted the change.",
    "{faction} adjusted near {region}. The change is visible in the record: before, one way; after, another. What happened in the gap between those two approaches is the decision that made the shift.",
    "Near {region}, {faction}'s engagement pattern broke from what had been consistent. New angles. Different focus. The chronicler notes the shift and watches to see whether the new approach holds.",
  ],
},

'VIGIL': {
  'headlines': [
    "The Threshold Is Near — The War Feels It",
    "Near the Turn: Last Entries of This Era",
    "The Chronicle Approaches a Mark",
    "The Vigil Before the Next Era",
    "Everything Now Is Part of How This Era Ends",
    "Final Moments of the Current Chapter",
  ],
  'bodies': [
    "The chronicle is close to a threshold — the count that marks this era's end and the next one's beginning. Every engagement now is part of how this era closes. The war doesn't know. It moves anyway.",
    "Near {region}, the war continues into the final entries of the current era. The close is approaching. What {faction} and {rival} do in these last moments is what this era will be remembered for.",
    "The threshold is almost here. The war doesn't pause for it — it never has — but the chronicle notes the proximity. Everything happening near {region} now is part of the era's final shape.",
    "The vigil: the stretch of entries before the threshold turns, when the era's shape is being finalized by the war's ordinary motion. Near {region}, the ordinary motion continues. The threshold approaches.",
    "Last entries before the turn. The chronicle watches the war continue near {region} — {faction} moving, {rival} responding — and marks the approach of the next era without knowing what it will hold.",
  ],
},

'NEUTRAL_GROUND': {
  'headlines': [
    "A Presence Outside Both Sides — Near {region}",
    "Neither {faction} Nor {rival}: Someone Else at {region}",
    "An Unaffiliated Presence Near {region}",
    "Not for Either Side — Near {region}",
    "The War Gets a Third Actor Near {region}",
    "Outside the Main Conflict: Active at {region}",
  ],
  'bodies': [
    "Near {region}, a presence that belongs to neither {faction} nor {rival} made a move in the middle of their conflict. The ground they touched is contested by both sides. They seem unconcerned with that.",
    "Neither {faction} nor {rival}. Near {region}, a third presence acted in territory both sides claim. The war has been described as two-sided. It isn't, entirely.",
    "Someone outside the main factions is active near {region} — moving through contested ground without allegiance to either of the presences fighting over it. The chronicle notes the presence without naming a side.",
    "Near {region}, the conflict picked up an unexpected participant. Not {faction}. Not {rival}. A presence outside the main account of the war, acting in its middle ground.",
    "The war near {region} acquired a presence that belongs to neither side. The ground they moved on is contested. They moved on it anyway. Their allegiance isn't clear. Their action is in the record.",
  ],
},

'GHOST_MARK': {
  'headlines': [
    "One Mark — Near {region}",
    "The Smallest Possible Action at {region}",
    "A Single Touch Near {region}",
    "One Mark, One Moment — {region}",
    "The Chronicle Records the Minimum Near {region}",
    "Something Small at {region}: Still in the Record",
  ],
  'bodies': [
    "One mark near {region}. The smallest action the war allows. The chronicle records everything — the single touches alongside the sweeping assaults — because the smallest can become the foundation of the largest.",
    "Near {region}: a single mark, placed and confirmed. The war is full of large moments. This is not one of them. The chronicle records it anyway. The minimum is still real.",
    "{faction} made one mark near {region} and nothing more. The least visible action in the war. The chronicle notes the minimum because the minimum accumulates. This one is in the record.",
    "One act near {region}. Minimal, deliberate, permanent. The war doesn't distinguish by scale — everything that happens happens, and the record holds it. This holds the smallest version.",
    "Near {region}, the chronicle records a single mark — small enough to overlook, permanent enough to build from. Not every action is a battle. This one wasn't. It's still in the record.",
  ],
},

'MESSENGER': {
  'headlines': [
    "Word Arrives from Beyond {region}",
    "A Presence with History Elsewhere — Now at {region}",
    "The Chronicle Connects {region} to the Wider War",
    "Near {region}: News from Outside the Local Story",
    "Cross-Territory Presence at {region}",
    "The War Is Larger Than {region}: A Connection Arrives",
  ],
  'bodies': [
    "Near {region}, a presence arrived that has been elsewhere in the war — far from here, in territory the chronicle covers separately. Their arrival connects two parts of the record that hadn't met before.",
    "A presence with history across the war's full scope came to {region}. Not rooted in one territory, not loyal to one zone — a traveler in the conflict, now here, bringing what they've seen elsewhere.",
    "The war near {region} intersected with the wider war through a presence that belongs to neither in particular. They've been everywhere. Now they're here. The connection is new.",
    "Near {region}, someone arrived who has been active in other parts of the conflict that the chronicle covers under different entries. Their presence links the local story to the larger one.",
    "Word from elsewhere, embodied in a presence that carries it: near {region}, a face that has been in the record from multiple directions, multiple territories, arrived to add another entry.",
  ],
},

'THE_LONG_COUNT': {
  'headlines': [
    "Forty Entries — Read as One Story",
    "The Long Count: Forty Moments, One Direction",
    "At Forty — The Shape of the Whole",
    "The Chronicle at Forty: {faction} and the Long Game",
    "Forty Entries of This War: What They Show",
    "The Full Arc at Forty",
  ],
  'bodies': [
    "Forty entries. Read them end to end and the war's direction is undeniable: {faction} advancing, {rival} yielding, the ground between them moving consistently in one direction. Not noise. The shape of the war.",
    "At forty, the chronicle stands back and reads the full sequence. The sequence says: {faction}. Their presence, their persistence, their consistent forward motion across every kind of engagement.",
    "Forty moments in the record. Each was its own story. Together they are one larger one — the story of {faction} in this war, consistent across every kind of moment the chronicle has covered.",
    "The long count at forty: {faction} on the winning side of more engagements than not, {rival} yielding more than gaining, the territory's shape reflecting the accumulated weight of forty entries.",
    "Forty entries. Not forty events — one long event, experienced in forty pieces. The chronicle reads them together now. Together: {faction}. Ahead in every measure the chronicle tracks.",
    "At the fortieth mark, the pattern that was ambiguous at ten and clearer at twenty-five is now undeniable. {faction}. The long game. Forty entries of consistent direction.",
  ],
},

'BETWEEN_FIRES': {
  'headlines': [
    "A Breath Between the Engagements Near {region}",
    "The Quiet Between the Fights Near {region}",
    "Low Activity — The War Catches Its Breath Near {region}",
    "Between Moments: Near {region}",
    "Not Fighting — Near {region}",
    "The Ground Rests Near {region}",
  ],
  'bodies': [
    "Near {region}, the war caught its breath. Both sides present, neither moving — a pause between engagements that could break at any moment but hasn't yet. The quiet is real. So is the tension.",
    "{faction} and {rival} face each other near {region} between moves. The last engagement settled. The next one hasn't formed. The ground holds its current shape while both sides reckon with what comes next.",
    "A rest near {region}: low activity, both presences in position, neither pressing. The war hasn't ended. It's resting. This kind of quiet doesn't last, but while it lasts it has its own quality.",
    "Near {region}, the space between engagements. The ground is unchanged from the last fight. Both sides are still there. The fight simply hasn't started again yet. The chronicle notes the interval.",
    "The ordinary work of a long war: near {region}, a pause that has no drama and no particular meaning — only the absence of the next engagement, which will come when it comes.",
  ],
},

'DYNASTY': {
  'headlines': [
    "{faction} at {region} — Three Times and Counting",
    "A Pattern at {region}: {faction} Keep Coming Back",
    "{faction}'s Claim on {region} Is a History Now",
    "Third Time at {region}: {faction} Establish a Dynasty",
    "{region} Keeps Returning to {faction}",
    "The Record at {region}: {faction} More Than Anyone",
  ],
  'bodies': [
    "{faction} have been to {region} three times. Once is presence. Twice is intent. Three times is something harder to dislodge — a history, a claim built from repetition that the record can't ignore.",
    "Third entry for {faction} at {region}. The chronicle has seen patterns before. This one reads as a dynasty: the same presence returning to the same ground, each time leaving a stronger claim.",
    "{region} and {faction}: the record holds three engagements, each one adding to the claim. Not a single large victory — a repeated presence that the zone now reflects in its history.",
    "Three times {faction} has held {region}. The zone knows their presence. The record shows it. Three is the number the chronicle marks as dynasty — not dominance, but pattern-become-claim.",
    "{faction} returned to {region} a third time. The chronicle marks thirds. The first was a visit. The second was intention. The third is a dynasty in the record — a ground that keeps coming back to the same hands.",
  ],
},

'CROSSING': {
  'headlines': [
    "{faction} Reach {region} for the First Time",
    "New Territory: {faction} at {region}",
    "The Chronicle Opens {region} for {faction}",
    "A First Move at {region}: {faction} Arrive",
    "{faction} Cross Into {region}",
    "First Entry: {faction} at {region}",
  ],
  'bodies': [
    "{faction} came to {region} for the first time. No history here — no prior engagements, no established presence. Only this first move, which opens the record for this place and this faction.",
    "First entry: {faction} at {region}. The ground was there before. {faction} was elsewhere. The crossing is real — they're here now, and the chronicle holds their first mark on this territory.",
    "{faction} extended their reach to {region}. The territory they hadn't been in before is now territory they've touched. The crossing is recorded. What they build from it is ahead.",
    "New ground for {faction}: {region}, never in their record before. The first move is the hardest and the most important — it opens everything that can follow. They made it.",
    "{faction} arrived at {region}. The chronicle opens a new entry at a new place. Their first mark here is small. It's also permanent. Everything this faction does at {region} from here starts with this.",
  ],
},

'SUPPLY_ROAD': {
  'headlines': [
    "{faction} Tend Their Ground Near {region}",
    "Steady Work Near {region} — {faction} Hold",
    "The Quiet Maintenance Near {region}",
    "{faction} Keep {region} Without a Fight",
    "Small Acts of Holding Near {region}",
    "No Advance, No Retreat — Just Presence Near {region}",
  ],
  'bodies': [
    "{faction} doing the quiet work near {region}: not gaining, not losing — maintaining. The kind of activity that keeps held ground held. Unglamorous. Necessary.",
    "Near {region}, {faction} hold through steady presence rather than through fighting. Small consistent actions that add up to a zone that stays theirs without anyone having to win it again.",
    "The work of a long war includes the ordinary kind. Near {region}, {faction} tend their ground — keeping what they've taken from drifting, keeping the presence alive through small consistent action.",
    "Near {region}: maintenance. {faction} keeping the zone in their column through the kind of effort the chronicle usually passes over quickly. It passes over it quickly. The work is still happening.",
    "{faction} hold {region} by returning to it. Not dramatically — steadily. Small moves that confirm the ground is theirs without having to take it again. The zone holds. So do they.",
  ],
},

'NIGHT_WATCH': {
  'headlines': [
    "The Ground Held Near {region}",
    "{faction} Watch the Zone Near {region}",
    "Low Activity, Steady Presence Near {region}",
    "The Night Watch at {region}",
    "Held Without Fighting — Near {region}",
    "Quiet Work of Keeping {region}",
  ],
  'bodies': [
    "Near {region}, {faction} hold through the quiet — small actions, steady presence, the ground maintained rather than fought over. The watch is real even when nothing is moving.",
    "The night watch near {region}: {faction} maintaining their hold through the low-activity period. Not a fight. Not a push. The kind of presence that keeps a zone from drifting when no one is paying attention.",
    "Near {region}, quiet. {faction} still present, still marking their ground — low intensity, but not absent. The chronicle records the watch because the watch is what makes held territory stay held.",
    "{faction} kept {region} through the quiet stretch — small confirmations of presence, the zone maintained by attention more than force. This is how long wars are held. Moment by moment, quietly.",
    "The quiet near {region}: {faction} watching the ground they took, keeping it through the kind of consistent small action that doesn't make large entries but keeps the zone in their column.",
  ],
},

'AFTERMATH': {
  'headlines': [
    "After the Push at {region} — {faction} Settle In",
    "Post-Engagement: {faction} Consolidate at {region}",
    "The Quiet Work After the Fight at {region}",
    "{faction} Solidify Their Hold at {region}",
    "After the Move: Lower-Intensity Confirmation at {region}",
    "The Fight Is Over — The Work of Holding Begins at {region}",
  ],
  'bodies': [
    "The big engagement at {region} is over. {faction} are in the aftermath now — smaller, steadier actions that confirm what the larger engagement established. The taking is done. The holding begins.",
    "After the fight at {region}: {faction} consolidating. The zone was taken — now it needs to be held. Different work, quieter work, but the chronicle records this phase too because it determines whether the taking lasts.",
    "Near {region}, the war has dropped to its lower register. The engagement is behind {faction}. The zone is theirs in practice. The work now is making that practice permanent.",
    "The aftermath at {region}: {faction} doing the smaller things that large victories require. The zone was won in a single sustained push. It needs to be settled in through the slow accumulation of smaller ones.",
    "After the move at {region}: quiet confirmation. {faction} working the zone they took — not pushing further, not expecting to be challenged, just making sure what was taken stays taken.",
  ],
},

'ESCALATION_NOTE': {
  'headlines': [
    "The War Picks Up Speed Near {region}",
    "More Action, Faster — Near {region}",
    "The Tempo Changes Near {region}: Accelerating",
    "Something Drives the War Faster Near {region}",
    "The Pace Is Different Now Near {region}",
    "Escalation Near {region}: The Rate Is Rising",
  ],
  'bodies': [
    "The war near {region} picked up speed. More engagements in less time, faster moves, a pace that the earlier entries in this era didn't prepare for. Something changed. The rate reflects it.",
    "Near {region}, the pace accelerated. Both sides moving faster than they had been — more actions per interval, larger exchanges, the conflict running hotter than its recent baseline.",
    "Something near {region} changed the tempo of the war. The rate of engagement went up. The moves got faster, more frequent, the territory changing at a pace that draws the chronicle's attention.",
    "The chronicle marks when the rate changes. Near {region}, the rate changed — more activity, less time between moves, an intensity that the earlier entries didn't show. It's showing now.",
    "Near {region}: the war accelerating. More and faster — more presences, more exchanges, more ground changing hands in a shorter span. The tempo near {region} rose and hasn't come back down.",
  ],
},

'SACRIFICE_TOLL': {
  'headlines': [
    "The Toll of Sacrifice — Another Threshold",
    "The Chronicle Counts What Was Given",
    "The Accumulated Weight of Sacrifice",
    "Another Mark in the Record of What Was Burned",
    "The Sacrifices Are Adding Up",
    "The Chronicle Marks the Total Given",
  ],
  'bodies': [
    "The chronicle counts what was given. Across all the entries, the sacrifices have accumulated to a threshold worth marking. Each one was an individual act. Together they are something larger.",
    "The toll of what has been sacrificed in this war crossed another mark. The chronicle records the threshold because the individual entries don't capture the scale — only the total does.",
    "Another point where the chronicle stops and counts the sacrifices. The count has grown. Each one was its own moment in the record. Together they describe a war that has cost its participants more than any single entry shows.",
    "The accumulated sacrifices of the war reach a new level. The chronicle notes this not because any single giving was new — each was already recorded — but because the sum of them means something.",
    "What has been given in this war, counted: another threshold crossed. The chronicle holds each individual sacrifice. Here it holds them all together, as a total, because the total is itself a fact about the war.",
  ],
},

}

for rule_name, rule_data in REWRITES.items():
    for field, new_values in rule_data.items():
        # Find the rule's section
        rule_start = content.find(f'  {rule_name}: {{')
        if rule_start == -1:
            print(f"MISS: {rule_name}")
            continue
        
        if field == 'bodies':
            marker = 'bodies: ['
        else:
            marker = 'headlines: ['
        
        field_start = content.find(marker, rule_start)
        if field_start == -1 or field_start > rule_start + 8000:
            print(f"MISS field {field} in {rule_name}")
            continue
        
        bracket_open = field_start + len(marker)
        depth = 1; i = bracket_open
        while i < len(content) and depth > 0:
            if content[i] == '[': depth += 1
            elif content[i] == ']': depth -= 1
            i += 1
        bracket_close = i - 1
        
        if field == 'bodies':
            new_content = '\n' + ',\n'.join(
                '      `' + b.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${') + '`'
                for b in new_values
            ) + ',\n    '
        else:
            new_content = '\n' + ',\n'.join(
                "      '" + h.replace("'", "\\'") + "'"
                for h in new_values
            ) + ',\n    '
        
        content = content[:bracket_open] + new_content + content[bracket_close:]
        print(f"OK: {rule_name}.{field}")

open('/home/claude/normies-chronicles/lib/storyGenerator.ts', 'w').write(content)
print("\nDone writing")
