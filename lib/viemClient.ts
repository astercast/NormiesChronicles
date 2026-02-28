import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.llamarpc.com'),
})

export const CANVAS_ADDRESS = '0x64951d92e345C50381267380e2975f66810E869c' as const
export const DEPLOY_BLOCK = 19_500_000n
export const BLOCK_CHUNK = 2000n

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
