import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { arcTestnet } from './arc-network'

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({
      target: {
        id: 'io.metamask',
        name: 'MetaMask',
        provider(window) {
          if (typeof window === 'undefined') return undefined
          const w = window as any
          // EIP-6963: check announced providers first (multi-wallet safe)
          if (w.ethereum?.providers?.length) {
            return w.ethereum.providers.find((p: any) => p.isMetaMask)
          }
          // Fallback: single injected provider
          if (w.ethereum?.isMetaMask) return w.ethereum
          return undefined
        },
      },
      shimDisconnect: true,
    }),
    injected(),
  ],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  },
  ssr: false,
})
