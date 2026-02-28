import { put, list } from '@vercel/blob'
import { getCanvasEvents } from './eventIndexer'
import { generateStoryEntries, PRIMER_ENTRIES } from './storyGenerator'
import { publicClient } from './viemClient'
import type { IndexedEvent } from './eventIndexer'

const BLOB_KEY = 'normies-chronicles-cache.json'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min fresh window

interface SerializedEvent {
  type: 'PixelsTransformed' | 'BurnRevealed'
  tokenId: string
  owner: string
  count: string
  blockNumber: string
  transactionHash: string
}
interface BlobCache {
  events: SerializedEvent[]
  lastBlock: string
  lastUpdated: string
}

// In-memory fallback for local dev (no BLOB_READ_WRITE_TOKEN)
let memCache: { data: BlobCache; ts: number } | null = null

function deserialize(events: SerializedEvent[]): IndexedEvent[] {
  return events.map(e => ({
    ...e,
    tokenId: BigInt(e.tokenId),
    count: BigInt(e.count),
    blockNumber: BigInt(e.blockNumber),
  }))
}

function serialize(events: IndexedEvent[]): SerializedEvent[] {
  return events.map(e => ({
    ...e,
    tokenId: e.tokenId.toString(),
    count: e.count.toString(),
    blockNumber: e.blockNumber.toString(),
  }))
}

async function readBlob(): Promise<{ cache: BlobCache; ageMs: number } | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY })
    if (!blobs.length) return null
    const res = await fetch(blobs[0].url, { cache: 'no-store' })
    if (!res.ok) return null
    const cache = await res.json() as BlobCache
    const ageMs = Date.now() - new Date(blobs[0].uploadedAt).getTime()
    return { cache, ageMs }
  } catch { return null }
}

async function writeBlob(cache: BlobCache) {
  try {
    await put(BLOB_KEY, JSON.stringify(cache), {
      access: 'public',
      allowOverwrite: true,
      contentType: 'application/json',
    })
  } catch (err) { console.error('[blob] write failed', err) }
}

function buildResponse(events: IndexedEvent[], lastUpdated: string) {
  const entries = generateStoryEntries(events, 0)
  return {
    entries: [...PRIMER_ENTRIES, ...entries],
    meta: {
      totalEvents: events.length,
      dynamicEntries: entries.length,
      lastUpdated,
    },
  }
}

export async function getStoryEntries() {
  try {
    const latest = await publicClient.getBlockNumber()
    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN

    if (useBlob) {
      const result = await readBlob()

      if (result) {
        const { cache, ageMs } = result
        const cachedEvents = deserialize(cache.events)
        const lastBlock = BigInt(cache.lastBlock)

        // Fresh — return immediately, no indexing needed
        if (ageMs < CACHE_TTL_MS && lastBlock >= latest - 10n) {
          return buildResponse(cachedEvents, cache.lastUpdated)
        }

        // Stale — only fetch new blocks since last saved block (incremental)
        const fromBlock = lastBlock + 1n
        let allEvents = cachedEvents

        if (fromBlock <= latest) {
          const newEvents = await getCanvasEvents(fromBlock, latest)
          if (newEvents.length > 0) {
            allEvents = [...cachedEvents, ...newEvents].sort((a, b) =>
              a.blockNumber < b.blockNumber ? -1 : 1
            )
            // Fire-and-forget — don't block the response
            writeBlob({
              events: serialize(allEvents),
              lastBlock: latest.toString(),
              lastUpdated: new Date().toISOString(),
            })
          }
        }

        return buildResponse(allEvents, new Date().toISOString())
      }

      // No blob yet — this is the cold start.
      // We do a partial index: fetch last 500k blocks first (recent events),
      // return immediately, then a background job fills the rest.
      // This avoids the 60s timeout on first deploy.
      const PARTIAL_LOOKBACK = 500_000n
      const partialFrom = latest > PARTIAL_LOOKBACK + 19_500_000n
        ? latest - PARTIAL_LOOKBACK
        : 19_500_000n

      const partialEvents = await getCanvasEvents(partialFrom, latest)

      // Save partial cache immediately so next request is incremental
      const partialCache: BlobCache = {
        events: serialize(partialEvents),
        lastBlock: latest.toString(),
        lastUpdated: new Date().toISOString(),
      }
      // Await this one so blob is seeded before returning
      await writeBlob(partialCache)

      // Kick off a background fill of the older blocks (non-blocking)
      if (partialFrom > 19_500_000n) {
        fillOlderBlocks(19_500_000n, partialFrom - 1n, partialEvents, partialCache)
      }

      return buildResponse(partialEvents, new Date().toISOString())
    }

    // ── Local dev: in-memory cache ────────────────────────────────────────
    const now = Date.now()
    if (memCache && now - memCache.ts < CACHE_TTL_MS) {
      return buildResponse(deserialize(memCache.data.events), memCache.data.lastUpdated)
    }

    const events = await getCanvasEvents()
    const nowStr = new Date().toISOString()
    memCache = {
      data: { events: serialize(events), lastBlock: latest.toString(), lastUpdated: nowStr },
      ts: now,
    }
    return buildResponse(events, nowStr)

  } catch (err) {
    console.error('[getStoryEntries]', err)
    return {
      entries: PRIMER_ENTRIES,
      meta: { totalEvents: 0, dynamicEntries: 0, lastUpdated: new Date().toISOString() },
    }
  }
}

// Background fill: fetches older blocks and merges into blob
// Runs asynchronously — does not block the response
async function fillOlderBlocks(
  from: bigint,
  to: bigint,
  alreadyHave: IndexedEvent[],
  currentCache: BlobCache
) {
  try {
    const olderEvents = await getCanvasEvents(from, to)
    if (olderEvents.length === 0) return

    const allEvents = [...olderEvents, ...alreadyHave].sort((a, b) =>
      a.blockNumber < b.blockNumber ? -1 : 1
    )

    await writeBlob({
      events: serialize(allEvents),
      lastBlock: currentCache.lastBlock,
      lastUpdated: new Date().toISOString(),
    })
    console.log(`[blob] background fill complete: ${allEvents.length} total events`)
  } catch (err) {
    console.error('[blob] background fill failed', err)
  }
}
