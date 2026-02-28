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

let memCache: { data: BlobCache; ts: number } | null = null

function deserialize(events: SerializedEvent[]): IndexedEvent[] {
  return events.map(e => ({ ...e, tokenId: BigInt(e.tokenId), count: BigInt(e.count), blockNumber: BigInt(e.blockNumber) }))
}
function serialize(events: IndexedEvent[]): SerializedEvent[] {
  return events.map(e => ({ ...e, tokenId: e.tokenId.toString(), count: e.count.toString(), blockNumber: e.blockNumber.toString() }))
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
    await put(BLOB_KEY, JSON.stringify(cache), { access: 'public', allowOverwrite: true, contentType: 'application/json' })
  } catch (err) { console.error('[blob] write failed', err) }
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

        if (ageMs < CACHE_TTL_MS && lastBlock >= latest - 10n) {
          const entries = generateStoryEntries(cachedEvents, 0)
          return { entries: [...PRIMER_ENTRIES, ...entries], meta: { totalEvents: cachedEvents.length, dynamicEntries: entries.length, lastUpdated: cache.lastUpdated } }
        }

        const fromBlock = lastBlock + 1n
        let allEvents = cachedEvents
        if (fromBlock <= latest) {
          const newEvents = await getCanvasEvents(fromBlock, latest)
          allEvents = [...cachedEvents, ...newEvents].sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : 1))
          writeBlob({ events: serialize(allEvents), lastBlock: latest.toString(), lastUpdated: new Date().toISOString() })
        }

        const entries = generateStoryEntries(allEvents, 0)
        return { entries: [...PRIMER_ENTRIES, ...entries], meta: { totalEvents: allEvents.length, dynamicEntries: entries.length, lastUpdated: new Date().toISOString() } }
      }

      // Cold start — full index
      const events = await getCanvasEvents()
      await writeBlob({ events: serialize(events), lastBlock: latest.toString(), lastUpdated: new Date().toISOString() })
      const entries = generateStoryEntries(events, 0)
      return { entries: [...PRIMER_ENTRIES, ...entries], meta: { totalEvents: events.length, dynamicEntries: entries.length, lastUpdated: new Date().toISOString() } }
    }

    // Local dev — in-memory
    const now = Date.now()
    if (memCache && now - memCache.ts < CACHE_TTL_MS) {
      const events = deserialize(memCache.data.events)
      const entries = generateStoryEntries(events, 0)
      return { entries: [...PRIMER_ENTRIES, ...entries], meta: { totalEvents: events.length, dynamicEntries: entries.length, lastUpdated: memCache.data.lastUpdated } }
    }
    const events = await getCanvasEvents()
    memCache = { data: { events: serialize(events), lastBlock: latest.toString(), lastUpdated: new Date().toISOString() }, ts: now }
    const entries = generateStoryEntries(events, 0)
    return { entries: [...PRIMER_ENTRIES, ...entries], meta: { totalEvents: events.length, dynamicEntries: entries.length, lastUpdated: new Date().toISOString() } }

  } catch (err) {
    console.error('[getStoryEntries]', err)
    return { entries: PRIMER_ENTRIES, meta: { totalEvents: 0, dynamicEntries: 0, lastUpdated: new Date().toISOString() } }
  }
}
