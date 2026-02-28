import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const rpcUrl = process.env.ALCHEMY_KEY
  ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
  : 'https://eth.llamarpc.com'

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl, { timeout: 30_000 }),
})

export const CANVAS_ADDRESS = '0x64951d92e345C50381267380e2975f66810E869c' as const
export const DEPLOY_BLOCK = 19_500_000n
// Alchemy supports up to 10k blocks; use 5k to be safe with two event types
export const BLOCK_CHUNK = 5000n

export const PIXELS_TRANSFORMED_EVENT = {
  type: 'event',
  name: 'PixelsTransformed',
  inputs: [
    { name: 'tokenId', type: 'uint256', indexed: true },
    { name: 'owner', type: 'address', indexed: true },
    { name: 'pixelCount', type: 'uint256', indexed: false },
  ],
} as const

export const BURN_REVEALED_EVENT = {
  type: 'event',
  name: 'BurnRevealed',
  inputs: [
    { name: 'tokenId', type: 'uint256', indexed: true },
    { name: 'owner', type: 'address', indexed: true },
    { name: 'burnedCount', type: 'uint256', indexed: false },
  ],
} as const
