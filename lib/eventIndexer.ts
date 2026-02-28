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
  tokenId: bigint        // for PixelsTransformed: the token being edited; for BurnRevealed: the burned token
  targetTokenId?: bigint // BurnRevealed only: the token receiving the action points
  owner: string
  count: bigint          // PixelsTransformed: pixelCount this edit; BurnRevealed: burnedCount (AP transferred)
  totalPixels?: bigint   // PixelsTransformed only: running total pixel count after this edit
  blockNumber: bigint
  transactionHash: string
}

export async function getCanvasEvents(
  fromBlock: bigint = DEPLOY_BLOCK,
  toBlock?: bigint,
  onProgress?: (fetched: number, total: number) => void
): Promise<IndexedEvent[]> {
  const latest = toBlock ?? (await publicClient.getBlockNumber())
  const totalChunks = Number((latest - fromBlock) / BLOCK_CHUNK) + 1
  const events: IndexedEvent[] = []
  let chunksDone = 0

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
            totalPixels: log.args.totalPixelCount ?? 0n,
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: log.transactionHash ?? '',
          })
        }
      }

      for (const log of burns) {
        if (log.args.burnedTokenId !== undefined) {
          events.push({
            type: 'BurnRevealed',
            tokenId: log.args.burnedTokenId,
            targetTokenId: log.args.targetTokenId,
            owner: log.args.owner ?? '0x',
            count: log.args.burnedCount ?? 0n,
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: log.transactionHash ?? '',
          })
        }
      }
    } catch (err) {
      console.error(`[indexer] chunk ${start}-${end} failed:`, err)
    }

    chunksDone++
    onProgress?.(chunksDone, totalChunks)
  }

  return events.sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : 1))
}
