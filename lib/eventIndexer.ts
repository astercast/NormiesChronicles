import {
  publicClient,
  CANVAS_ADDRESS,
  DEPLOY_BLOCK,
  BLOCK_CHUNK,
  PIXELS_TRANSFORMED_EVENT,
  BURN_REVEALED_EVENT,
} from './viemClient'

export interface IndexedEvent {
  type: 'PixelsTransformed' | 'BurnRevealed'
  tokenId: bigint
  owner: string
  count: bigint
  blockNumber: bigint
  transactionHash: string
}

// Paginated getLogs — same pattern as NormiesArchive
export async function getCanvasEvents(
  fromBlock: bigint = DEPLOY_BLOCK,
  toBlock?: bigint
): Promise<IndexedEvent[]> {
  const latest = toBlock ?? (await publicClient.getBlockNumber())
  const events: IndexedEvent[] = []

  for (let start = fromBlock; start <= latest; start += BLOCK_CHUNK) {
    const end = start + BLOCK_CHUNK - 1n > latest ? latest : start + BLOCK_CHUNK - 1n
    try {
      const [transforms, burns] = await Promise.all([
        publicClient.getLogs({
          address: CANVAS_ADDRESS,
          event: PIXELS_TRANSFORMED_EVENT,
          fromBlock: start,
          toBlock: end,
        }),
        publicClient.getLogs({
          address: CANVAS_ADDRESS,
          event: BURN_REVEALED_EVENT,
          fromBlock: start,
          toBlock: end,
        }),
      ])
      for (const log of transforms) {
        if (log.args.tokenId !== undefined) {
          events.push({
            type: 'PixelsTransformed',
            tokenId: log.args.tokenId,
            owner: log.args.owner ?? '0x',
            count: log.args.pixelCount ?? 0n,
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: log.transactionHash ?? '',
          })
        }
      }
      for (const log of burns) {
        if (log.args.tokenId !== undefined) {
          events.push({
            type: 'BurnRevealed',
            tokenId: log.args.tokenId,
            owner: log.args.owner ?? '0x',
            count: log.args.burnedCount ?? 0n,
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: log.transactionHash ?? '',
          })
        }
      }
    } catch (err) {
      console.error(`[indexer] chunk ${start}-${end} failed`, err)
    }
  }

  return events.sort((a, b) =>
    a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : 0
  )
}

export async function getRecentEvents(lookbackBlocks = 2000n): Promise<IndexedEvent[]> {
  const latest = await publicClient.getBlockNumber()
  const fromBlock = latest > lookbackBlocks ? latest - lookbackBlocks : DEPLOY_BLOCK
  return getCanvasEvents(fromBlock, latest)
}
