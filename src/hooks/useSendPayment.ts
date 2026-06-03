import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { arcTestnet } from '@/config/arc-network'

export function useSendPayment() {
  const {
    sendTransaction,
    data: hash,
    isPending,
    error,
    reset,
  } = useSendTransaction()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash })

  const send = (to: `0x${string}`, amountUSDC: string) => {
    sendTransaction({
      to,
      value: parseUnits(amountUSDC, 18),
      chainId: arcTestnet.id,
    })
  }

  return { send, hash, isPending, isConfirming, isConfirmed, error, reset }
}
