import { NextResponse } from 'next/server'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { character, storyContext } = await req.json()
    if (!character) return NextResponse.json({ error: 'no character' }, { status: 400 })

    const prompt = `Write a character portrait of ${character.name} (${character.title}) for The Chronicles of Normia.

CHARACTER FACTS:
- Name: ${character.name}
- Title: ${character.title}
- Goal: ${character.goal}
- Nature: ${character.nature}
- What activates them: ${character.activatedBy}
- Pronoun: ${character.pronoun}

${storyContext ? `CURRENT STORY STATE:\n${storyContext}\n` : ''}

Write exactly 4 short paragraphs:

P1: WHO THEY ARE — their essential nature, what they look like to the people of Normia who see them passing through. Do not describe their physical appearance in detail (no images yet). Describe their presence, their reputation, the feeling of them.

P2: THEIR HISTORY — where they came from before the chronicle, what shaped them, what they left behind or lost. Write as myth, as rumor, as things people say about them in the market stalls.

P3: THEIR CURRENT STORY — what they are doing right now in Normia. What they are building toward, what they are fighting against, what they cannot stop thinking about. This should feel urgent and alive.

P4: WHY THEY MATTER — what Normia would be without them. What only they can do. Why you should care whether they win or lose the influence over this world.

Write in a literary, mythic voice. Present tense. No technical language. No mention of blockchain or pixels or NFTs. This is a living world with real history.`

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          {
            role: 'system',
            content: 'You are the Grand Chronicler of Normia — keeper of the living record of a world of ten thousand faces. Write from inside the world: atmospheric, literary, present tense, grounded in specific names and places. Never mention blockchain, pixels, wallets, tokens, or anything technical. This is a living world with real history and real stakes.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      console.error('[character] upstream error:', response.status)
      return NextResponse.json({ error: 'upstream error' }, { status: 502 })
    }

    let text = (await response.text()).trim()
    if (text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text)
        text = parsed?.choices?.[0]?.message?.content
          || parsed?.content?.[0]?.text
          || parsed?.text
          || parsed?.message
          || ''
      } catch { text = '' }
    }

    if (!text) return NextResponse.json({ error: 'no text' }, { status: 502 })
    return NextResponse.json({ text })
  } catch (err) {
    console.error('[character] error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
