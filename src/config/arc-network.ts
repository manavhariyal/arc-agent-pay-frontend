import { defineChain } from 'viem'

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USD Coin',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
})

export const ARC_NETWORK = {
  chainId: 5042002,
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.testnet.arc.network',
  explorerUrl: 'https://testnet.arcscan.app',
  faucetUrl: 'https://faucet.testnet.arc.network',
  nativeCurrency: {
    symbol: 'USDC',
    decimals: 18,
  },
  usdcContract: '0x3600000000000000000000000000000000000000' as `0x${string}`,
} as const

export const ARC_NETWORK_CONFIG = {
  name: ARC_NETWORK.name,
  rpcUrl: ARC_NETWORK.rpcUrl,
  chainId: ARC_NETWORK.chainId,
  currencySymbol: ARC_NETWORK.nativeCurrency.symbol,
  usdcContract: ARC_NETWORK.usdcContract,
  blockExplorer: ARC_NETWORK.explorerUrl,
}
