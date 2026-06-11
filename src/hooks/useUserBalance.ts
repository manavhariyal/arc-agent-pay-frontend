import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://arc-agent-pay-backend.onrender.com'

interface UserBalance {
  wallet_address: string
  balance: number
  total_deposited: number
  total_spent: number
}

export function useUserBalance() {
  const { address } = useWallet()
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchBalance = useCallback(async () => {
    if (!address) return
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/balance/user/${address}`)
      if (res.ok) {
        const data = await res.json()
        setUserBalance(data)
      }
    } catch {}
    finally { setLoading(false) }
  }, [address])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  const recordDeposit = async (amount: number, txHash: string) => {
    if (!address) return
    try {
      const res = await fetch(`${BACKEND_URL}/api/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          amount,
          tx_hash: txHash,
        }),
      })
      if (res.ok) await fetchBalance()
    } catch {}
  }

  return { userBalance, loading, fetchBalance, recordDeposit }
}
