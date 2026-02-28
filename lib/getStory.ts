import { put, list } from '@vercel/blob'
import { getCanvasEvents } from './eventIndexer'
import { generateStoryEntries, PRIMER_ENTRIES } from './storyGenerator'
import { publicClient, DEPLOY_BLOCK } from './viemClient'
import type { IndexedEvent } from './eventIndexer'

const BLOB_KEY = 'normies-chronicles-cache.json'
const CACHE_TTL_MS = 5 * 60 * 1000

// How many blocks to scan per /api/index call.
// ~500 chunks × 2 parallel getLogs at ~80ms each ≈ 40s. Safe under 60s.
const BATCH_BLOCKS = 500_000n

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
  // lastBlock = furthest block we've indexed (used for incremental updates)
  lastBlock: string
  // indexedFrom = how far back we've gone (null means full history done)
  indexedFrom: string | null
  lastUpdated: string
}

// Local dev in-memory cache
let memEvents: IndexedEvent[] = []
let memLastBlock = 0n
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

function buildResponse(events: IndexedEvent[], lastUpdated: string, status: {
  indexing: boolean
  indexedFrom: string | null
}) {
  const entries = generateStoryEntries(events, 0)
  return {
    entries: [...PRIMER_ENTRIES, ...entries],
    indexing: status.indexing,
    indexedFrom: status.indexedFrom,
    meta: {
      totalEvents: events.length,
      dynamicEntries: entries.length,
      lastUpdated,
    },
  }
}

// ── /api/story — always returns immediately ───────────────────────────────────
export async function getStoryEntries() {
  try {
    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN

    if (useBlob) {
      const result = await readBlob()
      if (result) {
        const { cache } = result
        const events = deserialize(cache.events)
        const stillIndexingHistory = cache.indexedFrom !== null
        return buildResponse(events, cache.lastUpdated, {
          indexing: stillIndexingHistory,
          indexedFrom: cache.indexedFrom,
        })
      }
      // No blob — signal client to trigger /api/index
      return buildResponse([], new Date().toISOString(), { indexing: true, indexedFrom: null })
    }

    // Local dev
    if (memLastBlock > 0n) {
      return buildResponse(memEvents, new Date().toISOString(), {
        indexing: memIndexing,
        indexedFrom: null,
      })
    }
    if (!memIndexing) startLocalIndex()
    return buildResponse([], new Date().toISOString(), { indexing: true, indexedFrom: null })

  } catch (err) {
    console.error('[getStoryEntries]', err)
    return buildResponse([], new Date().toISOString(), { indexing: false, indexedFrom: null })
  }
}

// ── /api/index — called repeatedly by client until indexedFrom === null ───────
export async function runFullIndex() {
  const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN
  if (!useBlob) return { status: 'no_blob' }

  try {
    const latest = await publicClient.getBlockNumber()
    const existing = await readBlob()

    if (!existing) {
      // Very first call — scan the most recent BATCH_BLOCKS, save, signal more needed
      const batchFrom = latest > BATCH_BLOCKS + DEPLOY_BLOCK
        ? latest - BATCH_BLOCKS
        : DEPLOY_BLOCK
      const events = await getCanvasEvents(batchFrom, latest)
      await writeBlob({
        events: serialize(events),
        lastBlock: latest.toString(),
        indexedFrom: batchFrom > DEPLOY_BLOCK ? batchFrom.toString() : null,
        lastUpdated: new Date().toISOString(),
      })
      return {
        status: 'first_batch',
        events: events.length,
        batchFrom: batchFrom.toString(),
        needsMore: batchFrom > DEPLOY_BLOCK,
      }
    }

    const cache = existing.cache
    const indexedFrom = cache.indexedFrom ? BigInt(cache.indexedFrom) : null

    // If still have older history to scan — go one batch further back
    if (indexedFrom !== null && indexedFrom > DEPLOY_BLOCK) {
      const batchTo = indexedFrom - 1n
      const batchFrom = batchTo > BATCH_BLOCKS + DEPLOY_BLOCK
        ? batchTo - BATCH_BLOCKS + 1n
        : DEPLOY_BLOCK
      const olderEvents = await getCanvasEvents(batchFrom, batchTo)
      const allEvents = [...deserialize(cache.events), ...olderEvents]
        .sort((a, b) => a.blockNumber < b.blockNumber ? -1 : 1)
      await writeBlob({
        events: serialize(allEvents),
        lastBlock: cache.lastBlock,
        indexedFrom: batchFrom > DEPLOY_BLOCK ? batchFrom.toString() : null,
        lastUpdated: new Date().toISOString(),
      })
      return {
        status: 'backfill_batch',
        events: allEvents.length,
        newEvents: olderEvents.length,
        batchFrom: batchFrom.toString(),
        needsMore: batchFrom > DEPLOY_BLOCK,
      }
    }

    // History fully indexed — do incremental update for new blocks
    const lastBlock = BigInt(cache.lastBlock)
    if (lastBlock >= latest - 5n) {
      return { status: 'up_to_date', events: cache.events.length }
    }
    const newEvents = await getCanvasEvents(lastBlock + 1n, latest)
    if (newEvents.length > 0) {
      const allEvents = [...deserialize(cache.events), ...newEvents]
        .sort((a, b) => a.blockNumber < b.blockNumber ? -1 : 1)
      await writeBlob({
        events: serialize(allEvents),
        lastBlock: latest.toString(),
        indexedFrom: null,
        lastUpdated: new Date().toISOString(),
      })
      return { status: 'incremental', events: allEvents.length, newEvents: newEvents.length }
    }
    return { status: 'up_to_date', events: cache.events.length }

  } catch (err) {
    console.error('[runFullIndex]', err)
    throw err
  }
}

async function startLocalIndex() {
  if (memIndexing) return
  memIndexing = true
  try {
    const latest = await publicClient.getBlockNumber()
    const events = await getCanvasEvents(DEPLOY_BLOCK, latest)
    memEvents = events
    memLastBlock = latest
  } catch (err) {
    console.error('[localIndex]', err)
  } finally {
    memIndexing = false
  }
}
