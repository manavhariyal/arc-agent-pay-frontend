import { useState, useEffect, useCallback } from 'react'
import type { SpendingRule } from '@/types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://arc-agent-pay-backend.onrender.com'
const STORAGE_KEY = 'arc_spending_rules_v2'

function mapBackendRule(r: any): SpendingRule {
  return {
    id: r.id,
    agentId: r.agent_id,
    agentName: r.agents?.name ?? r.agentName ?? '',
    type: 'recurring',
    amount: r.amount?.toString() ?? '0',
    interval: r.interval,
    recipient: r.recipient_address,
    recipientLabel: r.name,
    status: r.is_active ? 'active' : 'inactive',
    createdAt: r.created_at,
    executionCount: r.execution_count ?? 0,
    lastExecutedAt: r.last_executed_at ?? null,
  }
}

export function useSpendingRules() {
  const [rules, setRules] = useState<SpendingRule[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  }, [rules])

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/rules`, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) throw new Error('Backend error')
      const data = await res.json()
      if (data.length > 0) {
        const mapped = data.map(mapBackendRule)
        setRules(mapped)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
      }
      setBackendAvailable(true)
    } catch {
      setBackendAvailable(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const addRule = async (input: Omit<SpendingRule, 'id' | 'createdAt'>): Promise<SpendingRule> => {
    const localRule: SpendingRule = {
      ...input,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setRules(prev => {
      const updated = [localRule, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    try {
      const res = await fetch(`${BACKEND_URL}/api/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: input.agentId,
          name: input.recipientLabel || `Rule for ${input.agentName}`,
          amount: parseFloat(input.amount),
          interval: input.interval || 'daily',
          recipient_address: input.recipient,
        }),
        signal: AbortSignal.timeout(8000)
      })
      if (res.ok) {
        const data = await res.json()
        const backendRule = mapBackendRule(data)
        setRules(prev => {
          const updated = prev.map(r => r.id === localRule.id ? backendRule : r)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          return updated
        })
        setBackendAvailable(true)
        return backendRule
      }
    } catch {}
    return localRule
  }

  const deleteRule = async (id: string) => {
    setRules(prev => {
      const updated = prev.filter(r => r.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    try {
      await fetch(`${BACKEND_URL}/api/rules/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(8000) })
    } catch {}
  }

  const toggleRule = async (id: string) => {
    setRules(prev => {
      const updated = prev.map(r =>
        r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    try {
      await fetch(`${BACKEND_URL}/api/rules/${id}/toggle`, { method: 'PATCH', signal: AbortSignal.timeout(8000) })
    } catch {}
  }

  const executeNow = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rules/${id}/execute`, { method: 'POST', signal: AbortSignal.timeout(30000) })
      return await res.json()
    } catch {
      return { success: false, message: 'Failed to execute' }
    }
  }

  const updateRule = async (id: string, updates: Partial<SpendingRule>) => {
    setRules(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  return { rules, addRule, updateRule, deleteRule, toggleRule, executeNow, loading, backendAvailable, refetch: fetchRules }
}
