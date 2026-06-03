import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { StoredTransaction } from '@/types'

const STORAGE_KEY = 'arc_transactions_v2'

interface TransactionContextValue {
  allTransactions: StoredTransaction[]
  addTransaction: (tx: Omit<StoredTransaction, 'id'>) => StoredTransaction
  updateStatus: (hash: string, status: StoredTransaction['status']) => void
  clearAll: () => void
}

const TransactionContext = createContext<TransactionContextValue | null>(null)

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<StoredTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  }, [all])

  const addTransaction = (tx: Omit<StoredTransaction, 'id'>): StoredTransaction => {
    const newTx: StoredTransaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    }
    setAll(prev => [newTx, ...prev])
    return newTx
  }

  const updateStatus = (hash: string, status: StoredTransaction['status']) => {
    setAll(prev => prev.map(tx => (tx.hash === hash ? { ...tx, status } : tx)))
  }

  const clearAll = () => {
    setAll([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <TransactionContext.Provider value={{ allTransactions: all, addTransaction, updateStatus, clearAll }}>
      {children}
    </TransactionContext.Provider>
  )
}

export function useTransactionContext() {
  const ctx = useContext(TransactionContext)
  if (!ctx) throw new Error('useTransactionContext must be used within TransactionProvider')
  return ctx
}
