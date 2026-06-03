import { useState, useEffect, useCallback } from 'react'
import type { SpendingRule } from '@/types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://arc-agent-pay-backend.onrender.com'
const STORAGE_KEY = 'arc_spending_rules_v2'

// Helper to map backend rule to frontend SpendingRule format
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

  // Fetch rules from backend
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/rules`)
      if (!res.ok) throw new Error('Backend error')
      const data = await res.json()
      const mapped = data.map(mapBackendRule)
      setRules(mapped)
      setBackendAvailable(true)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
    } catch {
      // Fall back to localStorage if backend is unavailable
      setBackendAvailable(false)
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) setRules(JSON.parse(stored))
      } catch {}
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  // Save to localStorage as fallback whenever rules change
  useEffect(() => {
    if (!backendAvailable) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
    }
  }, [rules, backendAvailable])

  const addRule = async (input: Omit<SpendingRule, 'id' | 'createdAt'>): Promise<SpendingRule> => {
    if (backendAvailable) {
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
        })
        if (!res.ok) throw new Error('Backend error')
        const data = await res.json()
        const newRule = mapBackendRule(data)
        setRules(prev => [newRule, ...prev])
        return newRule
      } catch {
        // Fall through to local storage
      }
    }

    // Fallback: local only
    const newRule: SpendingRule = {
      ...input,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setRules(prev => [newRule, ...prev])
    return newRule
  }

  const updateRule = async (id: string, updates: Partial<SpendingRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  const deleteRule = async (id: string) => {
    if (backendAvailable) {
      try {
        await fetch(`${BACKEND_URL}/api/rules/${id}`, { method: 'DELETE' })
      } catch {}
    }
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const toggleRule = async (id: string) => {
    if (backendAvailable) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rules/${id}/toggle`, { method: 'PATCH' })
        if (res.ok) {
          const data = await res.json()
          const updated = mapBackendRule(data)
          setRules(prev => prev.map(r => r.id === id ? updated : r))
          return
        }
      } catch {}
    }
    // Fallback
    setRules(prev =>
      prev.map(r =>
        r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r
      )
    )
  }

  const executeNow = async (id: string) => {
    if (!backendAvailable) return { success: false, message: 'Backend not available' }
    try {
      const res = await fetch(`${BACKEND_URL}/api/rules/${id}/execute`, { method: 'POST' })
      const data = await res.json()
      return data
    } catch {
      return { success: false, message: 'Failed to execute' }
    }
  }

  return { rules, addRule, updateRule, deleteRule, toggleRule, executeNow, loading, backendAvailable, refetch: fetchRules }
}
