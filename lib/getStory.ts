import { put, list } from '@vercel/blob'
import { getCanvasEvents } from './eventIndexer'
import { generateStoryEntries, PRIMER_ENTRIES } from './storyGenerator'
import { publicClient } from './viemClient'
import type { IndexedEvent } from './eventIndexer'

const BLOB_KEY = 'normies-chronicles-cache.json'
const CACHE_TTL_MS = 5 * 60 * 1000

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

// In-memory fallback for local dev
let memCache: { events: IndexedEvent[]; lastBlock: bigint; ts: number } | null = null
let memIndexing = false

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
    type: e.type,
    tokenId: e.tokenId.toString(),
    owner: e.owner,
    count: e.count.toString(),
    blockNumber: e.blockNumber.toString(),
    transactionHash: e.transactionHash,
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

function buildResponse(events: IndexedEvent[], lastUpdated: string, indexing = false) {
  const entries = generateStoryEntries(events, 0)
  return {
    entries: [...PRIMER_ENTRIES, ...entries],
    indexing,
    meta: {
      totalEvents: events.length,
      dynamicEntries: entries.length,
      lastUpdated,
    },
  }
}

// ── Main export: always returns fast ─────────────────────────────────────────
export async function getStoryEntries() {
  try {
    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN

    if (useBlob) {
      const result = await readBlob()

      if (result) {
        const { cache, ageMs } = result
        const cachedEvents = deserialize(cache.events)

        // Fresh enough — return immediately
        if (ageMs < CACHE_TTL_MS) {
          return buildResponse(cachedEvents, cache.lastUpdated)
        }

        // Stale — kick off incremental update in background, return cached data now
        const lastBlock = BigInt(cache.lastBlock)
        incrementalUpdate(cachedEvents, lastBlock)
        return buildResponse(cachedEvents, cache.lastUpdated)
      }

      // No blob at all — return primers + signal client to poll
      // The /api/index endpoint handles the actual first-time indexing
      return buildResponse([], new Date().toISOString(), true)
    }

    // ── Local dev path ────────────────────────────────────────────────────
    if (memCache && Date.now() - memCache.ts < CACHE_TTL_MS) {
      return buildResponse(memCache.events, new Date(memCache.ts).toISOString())
    }

    if (memIndexing) {
      // Already indexing in background — return what we have (empty or partial)
      const events = memCache?.events ?? []
      return buildResponse(events, new Date().toISOString(), true)
    }

    // Start background index, return primers immediately
    startLocalIndex()
    return buildResponse([], new Date().toISOString(), true)

  } catch (err) {
    console.error('[getStoryEntries]', err)
    return buildResponse([], new Date().toISOString(), false)
  }
}

// ── Triggered by /api/index — does the heavy lifting ─────────────────────────
export async function runFullIndex() {
  try {
    const latest = await publicClient.getBlockNumber()
    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN

    if (useBlob) {
      // Check again — might have been seeded by a concurrent request
      const existing = await readBlob()
      if (existing && Date.now() - existing.ageMs < CACHE_TTL_MS) {
        return { status: 'already_fresh', events: existing.cache.events.length }
      }

      if (existing) {
        // Incremental update
        const lastBlock = BigInt(existing.cache.lastBlock)
        const fromBlock = lastBlock + 1n
        if (fromBlock >= latest) {
          return { status: 'up_to_date', events: existing.cache.events.length }
        }
        const newEvents = await getCanvasEvents(fromBlock, latest)
        const allEvents = [...deserialize(existing.cache.events), ...newEvents]
          .sort((a, b) => a.blockNumber < b.blockNumber ? -1 : 1)
        await writeBlob({
          events: serialize(allEvents),
          lastBlock: latest.toString(),
          lastUpdated: new Date().toISOString(),
        })
        return { status: 'incremental', events: allEvents.length, newEvents: newEvents.length }
      }

      // Full cold-start index — chunk in batches to stay within timeout
      // Fetch last 300k blocks (≈60 chunks × 5000) which fits in ~60s
      const SAFE_LOOKBACK = 300_000n
      const fromBlock = latest > SAFE_LOOKBACK + 19_500_000n
        ? latest - SAFE_LOOKBACK
        : 19_500_000n

      const events = await getCanvasEvents(fromBlock, latest)
      await writeBlob({
        events: serialize(events),
        lastBlock: latest.toString(),
        lastUpdated: new Date().toISOString(),
      })

      // Schedule older-block fill for next request
      return { status: 'partial_cold_start', events: events.length, fromBlock: fromBlock.toString() }
    }

    return { status: 'no_blob', events: 0 }
  } catch (err) {
    console.error('[runFullIndex]', err)
    throw err
  }
}

// Fire-and-forget incremental update (blob path)
async function incrementalUpdate(cached: IndexedEvent[], lastBlock: bigint) {
  try {
    const latest = await publicClient.getBlockNumber()
    if (lastBlock >= latest - 5n) return
    const newEvents = await getCanvasEvents(lastBlock + 1n, latest)
    if (newEvents.length === 0) return
    const allEvents = [...cached, ...newEvents].sort((a, b) =>
      a.blockNumber < b.blockNumber ? -1 : 1
    )
    await writeBlob({
      events: serialize(allEvents),
      lastBlock: latest.toString(),
      lastUpdated: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[incrementalUpdate]', err)
  }
}

// Local dev: background index
async function startLocalIndex() {
  if (memIndexing) return
  memIndexing = true
  try {
    const latest = await publicClient.getBlockNumber()
    const events = await getCanvasEvents(19_500_000n, latest)
    memCache = { events, lastBlock: latest, ts: Date.now() }
  } catch (err) {
    console.error('[localIndex]', err)
  } finally {
    memIndexing = false
  }
}
