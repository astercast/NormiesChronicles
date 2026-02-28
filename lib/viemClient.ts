import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const rpcUrl = process.env.ALCHEMY_KEY
  ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
  : 'https://ethereum.publicnode.com'

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl, { timeout: 30_000 }),
})

export const CANVAS_ADDRESS = '0x64951d92e345C50381267380e2975f66810E869c' as const

// Canvas contract deployed with first events at ~block 24,534,000
// Deploy block confirmed via on-chain event scan
export const DEPLOY_BLOCK = 24_530_000n

// publicnode.com supports up to 50k blocks per getLogs request
// Use 2000 to stay well within limits and keep chunks fast
export const BLOCK_CHUNK = 2000n

// PixelsTransformed(address indexed owner, uint256 indexed tokenId, uint256 pixelCount, uint256 totalPixelCount)
// topic: 0x30a7353aa32ccc2e6f802854bc41f1e78569caffecd092138c4af54c30a9e261
export const PIXELS_TRANSFORMED_EVENT = {
  type: 'event',
  name: 'PixelsTransformed',
  inputs: [
    { name: 'owner',           type: 'address', indexed: true  },
    { name: 'tokenId',         type: 'uint256', indexed: true  },
    { name: 'pixelCount',      type: 'uint256', indexed: false },
    { name: 'totalPixelCount', type: 'uint256', indexed: false },
  ],
} as const

// BurnRevealed(uint256 indexed burnedTokenId, address indexed owner, uint256 indexed targetTokenId, uint256 burnedCount, bool finalBurn)
// topic: 0xbbb8a46d78ca27d9a639f6583a721138b69f0060e5804b813b0570a22720b00d
export const BURN_REVEALED_EVENT = {
  type: 'event',
  name: 'BurnRevealed',
  inputs: [
    { name: 'burnedTokenId', type: 'uint256', indexed: true  },
    { name: 'owner',         type: 'address', indexed: true  },
    { name: 'targetTokenId', type: 'uint256', indexed: true  },
    { name: 'burnedCount',   type: 'uint256', indexed: false },
    { name: 'finalBurn',     type: 'bool',    indexed: false },
  ],
} as const
