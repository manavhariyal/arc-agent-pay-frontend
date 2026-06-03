import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { formatUnits } from 'viem'
import { arcTestnet } from '@/config/arc-network'

export function useWallet() {
  const { address, isConnected, chain, status } = useAccount()

  const { connect, isPending: isConnecting, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: { enabled: isConnected && !!address },
  })

  const isOnArcTestnet = chain?.id === arcTestnet.id

  const isMetaMaskAvailable = typeof window !== 'undefined' && Boolean(
    (window as Window & { ethereum?: { isMetaMask?: boolean } }).ethereum?.isMetaMask
  )

  const connectMetaMask = () => {
    try {
      if (isMetaMaskAvailable) {
        connect({
          connector: injected({ target: 'metaMask' }),
          chainId: arcTestnet.id,
        })
      } else {
        connect({
          connector: injected(),
          chainId: arcTestnet.id,
        })
      }
    } catch (err) {
      console.error('Wallet connect error:', err)
    }
  }

  const switchToArc = () => {
    try {
      switchChain({ chainId: arcTestnet.id })
    } catch (err) {
      console.error('Switch chain error:', err)
    }
  }

  const formattedBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals)).toFixed(4)
    : null

  return {
    address,
    isConnected,
    isConnecting,
    isSwitching,
    isBalanceLoading,
    isMetaMaskAvailable,
    balance: balanceData,
    formattedBalance,
    chain,
    isOnArcTestnet,
    status,
    connectError,
    connectMetaMask,
    switchToArc,
    disconnect,
  }
}
