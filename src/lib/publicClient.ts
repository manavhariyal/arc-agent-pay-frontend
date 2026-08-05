import { createPublicClient, http } from 'viem'
import { arcTestnet } from '@/config/arc-network'

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.io'),
})
