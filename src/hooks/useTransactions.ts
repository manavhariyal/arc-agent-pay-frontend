import { useTransactionContext } from '@/context/TransactionContext'
import type { StoredTransaction } from '@/types'

export function useTransactions(filterByAddress?: string) {
  const { allTransactions, addTransaction, updateStatus, clearAll } = useTransactionContext()

  const transactions = filterByAddress
    ? allTransactions.filter(
        tx => tx.fromAddress.toLowerCase() === filterByAddress.toLowerCase()
      )
    : allTransactions

  return { transactions, allTransactions, addTransaction, updateStatus, clearAll }
}

export type { StoredTransaction }
