import { useState, useEffect, useCallback } from 'react'
import type { Agent, AgentStatus } from '@/types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://arc-agent-pay-backend.onrender.com'
const STORAGE_KEY = 'arc_agents_v2'

function mapBackendAgent(a: any): Agent {
  return {
    id: a.id,
    name: a.name,
    description: a.description ?? '',
    walletAddress: a.wallet_address,
    status: a.status ?? 'active',
    alertThreshold: a.alert_threshold ?? 10,
    createdAt: a.created_at,
  }
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [backendAvailable, setBackendAvailable] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
  }, [agents])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/agents`, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) throw new Error('Backend error')
      const data = await res.json()
      if (data.length > 0) {
        const mapped = data.map(mapBackendAgent)
        setAgents(mapped)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
      }
      setBackendAvailable(true)
    } catch {
      setBackendAvailable(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const addAgent = async (input: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> => {
    const localAgent: Agent = {
      ...input,
      id: `agt_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setAgents(prev => {
      const updated = [localAgent, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    try {
      const res = await fetch(`${BACKEND_URL}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          description: input.description,
          wallet_address: input.walletAddress,
          status: input.status,
          alert_threshold: input.alertThreshold,
        }),
        signal: AbortSignal.timeout(8000)
      })
      if (res.ok) {
        const data = await res.json()
        const backendAgent = mapBackendAgent(data)
        setAgents(prev => {
          const updated = prev.map(a => a.id === localAgent.id ? backendAgent : a)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          return updated
        })
        setBackendAvailable(true)
        return backendAgent
      }
    } catch {}
    return localAgent
  }

  const updateAgent = async (id: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>) => {
    setAgents(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, ...updates } : a)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    try {
      const body: any = {}
      if (updates.name) body.name = updates.name
      if (updates.description !== undefined) body.description = updates.description
      if (updates.walletAddress) body.wallet_address = updates.walletAddress
      if (updates.status) body.status = updates.status
      if (updates.alertThreshold !== undefined) body.alert_threshold = updates.alertThreshold
      await fetch(`${BACKEND_URL}/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      })
    } catch {}
  }

  const deleteAgent = async (id: string) => {
    setAgents(prev => {
      const updated = prev.filter(a => a.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    try {
      await fetch(`${BACKEND_URL}/api/agents/${id}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(8000)
      })
    } catch {}
  }

  const setAgentStatus = (id: string, status: AgentStatus) => {
    updateAgent(id, { status })
  }

  return { agents, addAgent, updateAgent, deleteAgent, setAgentStatus, refetch: fetchAgents, backendAvailable }
}
