import { put, list } from '@vercel/blob'
import { getCanvasEvents } from './eventIndexer'
import { generateStoryEntries, PRIMER_ENTRIES } from './storyGenerator'
import { publicClient, DEPLOY_BLOCK } from './viemClient'
import type { IndexedEvent } from './eventIndexer'

const BLOB_KEY = 'normies-chronicles-cache.json'
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface SerializedEvent {
  type: 'PixelsTransformed' | 'BurnRevealed'
  tokenId: string
  owner: string
  count: string
  blockNumber: string
  transactionHash: string
  targetTokenId?: string
  totalPixels?: string
}

interface BlobCache {
  events: SerializedEvent[]
  lastBlock: string
  lastUpdated: string
}

function deserialize(events: SerializedEvent[]): IndexedEvent[] {
  return events.map(e => {
    const result: IndexedEvent = {
      type: e.type,
      tokenId: BigInt(e.tokenId),
      owner: e.owner,
      count: BigInt(e.count),
      blockNumber: BigInt(e.blockNumber),
      transactionHash: e.transactionHash,
    }
    if (e.targetTokenId !== undefined) result.targetTokenId = BigInt(e.targetTokenId)
    if (e.totalPixels !== undefined) result.totalPixels = BigInt(e.totalPixels)
    return result
  })
}

function serialize(events: IndexedEvent[]): SerializedEvent[] {
  return events.map(e => ({
    type: e.type,
    tokenId: e.tokenId.toString(),
    owner: e.owner,
    count: e.count.toString(),
    blockNumber: e.blockNumber.toString(),
    transactionHash: e.transactionHash,
    ...(e.targetTokenId !== undefined && { targetTokenId: e.targetTokenId.toString() }),
    ...(e.totalPixels !== undefined && { totalPixels: e.totalPixels.toString() }),
  }))
}

async function readBlob(): Promise<{ cache: BlobCache; ageMs: number } | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY })
    console.log('[readBlob] found blobs:', blobs.length, blobs.map(b => b.pathname))
    if (!blobs.length) return null
    const blob = blobs[0]
    console.log('[readBlob] fetching:', blob.downloadUrl?.slice(0, 60))
    // Try downloadUrl first, fall back to url
    const urlToFetch = blob.downloadUrl ?? blob.url
    const res = await fetch(urlToFetch, { cache: 'no-store' })
    console.log('[readBlob] fetch status:', res.status)
    if (!res.ok) {
      console.error('[readBlob] fetch failed:', res.status, res.statusText)
      return null
    }
    const cache = await res.json() as BlobCache
    console.log('[readBlob] events in cache:', cache.events?.length)
    const ageMs = Date.now() - new Date(blob.uploadedAt).getTime()
    return { cache, ageMs }
  } catch (err) {
    console.error('[readBlob] error:', err)
    return null
  }
}

async function writeBlob(cache: BlobCache) {
  try {
    await put(BLOB_KEY, JSON.stringify(cache), {
      access: 'private',
      allowOverwrite: true,
      contentType: 'application/json',
    })
  } catch (err) {
    console.error('[writeBlob]', err)
  }
}

function buildResponse(events: IndexedEvent[], lastUpdated: string, indexing: boolean) {
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

// ── /api/story — always returns immediately ───────────────────────────────────
export async function getStoryEntries() {
  try {
    const result = await readBlob()
    if (result) {
      const events = deserialize(result.cache.events)
      // Always return what we have — indexing:false means client shows it as done
      return buildResponse(events, result.cache.lastUpdated, false)
    }
    // No cache yet — return primers, signal client to call /api/index
    return buildResponse([], new Date().toISOString(), true)
  } catch (err) {
    console.error('[getStoryEntries]', err)
    return buildResponse([], new Date().toISOString(), true)
  }
}

// ── /api/index — does the full index, saves to blob ──────────────────────────
export async function runFullIndex() {
  try {
    console.log('[runFullIndex] start')
    const latest = await publicClient.getBlockNumber()
    console.log('[runFullIndex] latest block:', latest.toString())

    // Check existing cache first
    const existing = await readBlob()
    console.log('[runFullIndex] existing cache:', existing ? `${existing.cache.events.length} events, age ${existing.ageMs}ms` : 'none')

    if (existing) {
      const ageMs = existing.ageMs
      if (ageMs < CACHE_TTL_MS) {
        const lastBlock = BigInt(existing.cache.lastBlock)
        if (lastBlock >= latest - 5n) {
          console.log('[runFullIndex] up to date')
          return { status: 'up_to_date', events: existing.cache.events.length }
        }
        console.log('[runFullIndex] incremental from', lastBlock.toString())
        const newEvents = await getCanvasEvents(lastBlock + 1n, latest)
        console.log('[runFullIndex] new events:', newEvents.length)
        if (newEvents.length > 0) {
          const allEvents = [...deserialize(existing.cache.events), ...newEvents]
            .sort((a, b) => a.blockNumber < b.blockNumber ? -1 : 1)
          await writeBlob({
            events: serialize(allEvents),
            lastBlock: latest.toString(),
            lastUpdated: new Date().toISOString(),
          })
          return { status: 'incremental', events: allEvents.length, newEvents: newEvents.length }
        }
        return { status: 'up_to_date', events: existing.cache.events.length }
      }
    }

    // No cache or stale — full index from deploy block
    console.log('[runFullIndex] full scan from', DEPLOY_BLOCK.toString(), 'to', latest.toString())
    const events = await getCanvasEvents(DEPLOY_BLOCK, latest)
    console.log('[runFullIndex] found', events.length, 'events, writing blob...')
    await writeBlob({
      events: serialize(events),
      lastBlock: latest.toString(),
      lastUpdated: new Date().toISOString(),
    })
    console.log('[runFullIndex] blob written OK')
    return { status: 'full_index', events: events.length, needsMore: false }

  } catch (err) {
    console.error('[runFullIndex] error:', err)
    throw err
  }
}
