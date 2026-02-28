import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { getCanvasEvents } from '@/lib/eventIndexer'
import { generateStoryEntries, PRIMER_ENTRIES } from '@/lib/storyGenerator'
import { publicClient } from '@/lib/viemClient'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const BLOB_KEY = 'normies-chronicles-cache.json'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

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
let memCache: { data: BlobCache; ts: number } | null = null

function deserializeEvents(events: SerializedEvent[]) {
  return events.map(e => ({
    ...e,
    tokenId: BigInt(e.tokenId),
    count: BigInt(e.count),
    blockNumber: BigInt(e.blockNumber),
  }))
}

function serializeEvents(events: Awaited<ReturnType<typeof getCanvasEvents>>): SerializedEvent[] {
  return events.map(e => ({
    ...e,
    tokenId: e.tokenId.toString(),
    count: e.count.toString(),
    blockNumber: e.blockNumber.toString(),
  }))
}

async function readBlob(): Promise<{ cache: BlobCache; fresh: boolean } | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY })
    if (blobs.length === 0) return null
    const blob = blobs[0]
    const res = await fetch(blob.url)
    if (!res.ok) return null
    const cache = await res.json() as BlobCache
    const fresh = Date.now() - new Date(blob.uploadedAt).getTime() < CACHE_TTL_MS
    return { cache, fresh }
  } catch {
    return null
  }
}

async function writeBlob(cache: BlobCache) {
  try {
    await put(BLOB_KEY, JSON.stringify(cache), {
      access: 'public',
      allowOverwrite: true,
      contentType: 'application/json',
    })
  } catch (err) {
    console.error('[blob] write failed', err)
  }
}

export async function GET() {
  try {
    const latest = await publicClient.getBlockNumber()
    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN

    if (useBlob) {
      const result = await readBlob()

      if (result) {
        const { cache, fresh } = result
        const cachedEvents = deserializeEvents(cache.events)
        const lastBlock = BigInt(cache.lastBlock)

        if (fresh && lastBlock >= latest - 10n) {
          // Fully fresh — return immediately
          const entries = generateStoryEntries(cachedEvents, 0)
          return NextResponse.json({
            entries: [...PRIMER_ENTRIES, ...entries],
            meta: { totalEvents: cachedEvents.length, dynamicEntries: entries.length, lastUpdated: cache.lastUpdated, source: 'blob-fresh' },
          })
        }

        // Stale — incremental: only fetch new blocks
        const fromBlock = lastBlock + 1n
        let allEvents = cachedEvents

        if (fromBlock <= latest) {
          const newEvents = await getCanvasEvents(fromBlock, latest)
          allEvents = [...cachedEvents, ...newEvents].sort((a, b) =>
            a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : 0
          )
          // Fire and forget — don't block the response
          writeBlob({ events: serializeEvents(allEvents), lastBlock: latest.toString(), lastUpdated: new Date().toISOString() })
        }

        const entries = generateStoryEntries(allEvents, 0)
        return NextResponse.json({
          entries: [...PRIMER_ENTRIES, ...entries],
          meta: { totalEvents: allEvents.length, dynamicEntries: entries.length, lastUpdated: new Date().toISOString(), source: 'blob-incremental' },
        })
      }

      // No blob at all — full index from deploy block
      const events = await getCanvasEvents()
      await writeBlob({ events: serializeEvents(events), lastBlock: latest.toString(), lastUpdated: new Date().toISOString() })

      const entries = generateStoryEntries(events, 0)
      return NextResponse.json({
        entries: [...PRIMER_ENTRIES, ...entries],
        meta: { totalEvents: events.length, dynamicEntries: entries.length, lastUpdated: new Date().toISOString(), source: 'blob-cold' },
      })
    }

    // --- Local dev: in-memory cache ---
    const now = Date.now()
    if (memCache && now - memCache.ts < CACHE_TTL_MS) {
      const cachedEvents = deserializeEvents(memCache.data.events)
      const entries = generateStoryEntries(cachedEvents, 0)
      return NextResponse.json({
        entries: [...PRIMER_ENTRIES, ...entries],
        meta: { totalEvents: cachedEvents.length, dynamicEntries: entries.length, lastUpdated: memCache.data.lastUpdated, source: 'memory' },
      })
    }

    const events = await getCanvasEvents()
    memCache = { data: { events: serializeEvents(events), lastBlock: latest.toString(), lastUpdated: new Date().toISOString() }, ts: now }

    const entries = generateStoryEntries(events, 0)
    return NextResponse.json({
      entries: [...PRIMER_ENTRIES, ...entries],
      meta: { totalEvents: events.length, dynamicEntries: entries.length, lastUpdated: new Date().toISOString(), source: 'memory-fresh' },
    })

  } catch (error) {
    console.error('[/api/story]', error)
    return NextResponse.json({
      entries: PRIMER_ENTRIES,
      meta: { totalEvents: 0, dynamicEntries: 0, lastUpdated: new Date().toISOString(), source: 'error-fallback' },
    })
  }
}
