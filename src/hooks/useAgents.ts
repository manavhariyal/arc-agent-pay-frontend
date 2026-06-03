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

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/agents`)
      if (!res.ok) throw new Error('Backend error')
      const data = await res.json()
      const mapped = data.map(mapBackendAgent)
      setAgents(mapped)
      setBackendAvailable(true)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
    } catch {
      setBackendAvailable(false)
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) setAgents(JSON.parse(stored))
      } catch {}
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  useEffect(() => {
    if (!backendAvailable) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
    }
  }, [agents, backendAvailable])

  const addAgent = async (input: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> => {
    if (backendAvailable) {
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
        })
        if (!res.ok) throw new Error('Backend error')
        const data = await res.json()
        const newAgent = mapBackendAgent(data)
        setAgents(prev => [newAgent, ...prev])
        return newAgent
      } catch {}
    }
    // Fallback local
    const newAgent: Agent = {
      ...input,
      id: `agt_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setAgents(prev => [newAgent, ...prev])
    return newAgent
  }

  const updateAgent = async (id: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>) => {
    if (backendAvailable) {
      try {
        const body: any = {}
        if (updates.name) body.name = updates.name
        if (updates.description) body.description = updates.description
        if (updates.walletAddress) body.wallet_address = updates.walletAddress
        if (updates.status) body.status = updates.status
        if (updates.alertThreshold) body.alert_threshold = updates.alertThreshold
        await fetch(`${BACKEND_URL}/api/agents/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } catch {}
    }
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  const deleteAgent = async (id: string) => {
    if (backendAvailable) {
      try {
        await fetch(`${BACKEND_URL}/api/agents/${id}`, { method: 'DELETE' })
      } catch {}
    }
    setAgents(prev => prev.filter(a => a.id !== id))
  }

  const setAgentStatus = (id: string, status: AgentStatus) => {
    updateAgent(id, { status })
  }

  return { agents, addAgent, updateAgent, deleteAgent, setAgentStatus, refetch: fetchAgents, backendAvailable }
}
