import { useEffect, useRef } from 'react'
import { useTransactionContext } from '@/context/TransactionContext'
import { publicClient } from '@/lib/publicClient'
import { useToast } from '@/hooks/use-toast'
import { truncateAddress } from '@/lib/utils'

export function TxStatusWatcher() {
  const { allTransactions, updateStatus } = useTransactionContext()
  const { toast } = useToast()
  const processingRef = useRef<Set<string>>(new Set())

  const pendingHashes = allTransactions
    .filter(tx => tx.status === 'pending')
    .map(tx => tx.hash)

  useEffect(() => {
    if (pendingHashes.length === 0) return

    const poll = async () => {
      for (const hash of pendingHashes) {
        if (processingRef.current.has(hash)) continue
        processingRef.current.add(hash)

        try {
          const receipt = await publicClient.getTransactionReceipt({
            hash: hash as `0x${string}`,
          })
          const newStatus = receipt.status === 'success' ? 'confirmed' : 'failed'
          updateStatus(hash, newStatus)

          const tx = allTransactions.find(t => t.hash === hash)
          if (newStatus === 'confirmed') {
            toast({
              title: 'Transaction confirmed',
              description: tx
                ? `${tx.agentName ? tx.agentName + ' · ' : ''}To ${truncateAddress(tx.toAddress)}`
                : `Tx ${hash.slice(0, 10)}…`,
            })
          } else {
            toast({
              title: 'Transaction failed',
              description: `Tx ${hash.slice(0, 10)}… was not successful.`,
              variant: 'destructive',
            })
          }
        } catch {
          // Transaction not yet mined — keep polling
        } finally {
          processingRef.current.delete(hash)
        }
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [pendingHashes.join(',')])

  return null
}
