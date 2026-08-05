import { createConfig, http, fallback } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
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
    walletConnect({
      projectId: '2735266af8c2a85f72753baaccca0bc8',
      metadata: {
        name: 'Arc Agent Pay',
        description: 'AI agent payment network on Arc Testnet',
        url: 'https://arcagentpay.xyz',
        icons: ['https://arcagentpay.xyz/arc-logo.png'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [arcTestnet.id]: fallback([
      http('https://rpc.testnet.arc.io'),
      http('https://rpc.blockdaemon.testnet.arc.io'),
      http('https://rpc.drpc.testnet.arc.io'),
    ]),
  },
  ssr: false,
})
