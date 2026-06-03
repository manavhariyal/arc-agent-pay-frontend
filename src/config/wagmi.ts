import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { arcTestnet } from './arc-network'

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    }),
    injected(),
  ],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  },
  ssr: false,
})
