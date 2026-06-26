import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import type { Agent, AgentStatus } from '@/types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://arc-agent-pay-backend.onrender.com'

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
  const { address } = useAccount()
  const ownerKey = address ? address.toLowerCase() : null
  const STORAGE_KEY = ownerKey ? `arc_agents_v4_${ownerKey}` : null

  const [agents, setAgents] = useState<Agent[]>(() => {
    if (!STORAGE_KEY) return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [saving, setSaving] = useState(false)

  // Reload from localStorage whenever the connected wallet changes
  useEffect(() => {
    if (!STORAGE_KEY) {
      setAgents([])
      return
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      setAgents(stored ? JSON.parse(stored) : [])
    } catch {
      setAgents([])
    }
  }, [STORAGE_KEY])

  useEffect(() => {
    if (!STORAGE_KEY) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
  }, [agents, STORAGE_KEY])

  const fetchAgents = useCallback(async () => {
    if (!ownerKey) return
    try {
      const res = await fetch(`${BACKEND_URL}/api/agents?owner=${ownerKey}`, {
        signal: AbortSignal.timeout(10000)
      })
      if (!res.ok) throw new Error('Backend error')
      const data = await res.json()
      setBackendAvailable(true)

      if (data.length === 0) return

      const backendAgents = data.map(mapBackendAgent)

      setAgents(prev => {
        const backendIds = new Set(backendAgents.map((a: Agent) => a.id))
        const localOnly = prev.filter(a => !backendIds.has(a.id) && !a.id.startsWith('agt_'))
        const merged = [...backendAgents, ...localOnly]
        if (STORAGE_KEY) localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        return merged
      })
    } catch {
      setBackendAvailable(false)
    }
  }, [ownerKey, STORAGE_KEY])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const addAgent = async (input: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> => {
    if (!ownerKey || !STORAGE_KEY) {
      throw new Error('Connect your wallet first')
    }

    const tempId = `agt_${Date.now()}`
    const localAgent: Agent = {
      ...input,
      id: tempId,
      createdAt: new Date().toISOString(),
    }

    setAgents(prev => {
      const updated = [localAgent, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })

    setSaving(true)
    const tryBackend = async () => {
      for (let attempt = 0; attempt < 10; attempt++) {
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
              owner_address: ownerKey,
            }),
            signal: AbortSignal.timeout(15000)
          })
          if (res.ok) {
            const data = await res.json()
            const backendAgent = mapBackendAgent(data)
            setAgents(prev => {
              const updated = prev.map(a => a.id === tempId ? backendAgent : a)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
              return updated
            })
            setBackendAvailable(true)
            setSaving(false)
            return
          }
        } catch {}
        await new Promise(r => setTimeout(r, 5000))
      }
      setSaving(false)
    }

    tryBackend()
    return localAgent
  }

  const updateAgent = async (id: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>) => {
    if (!STORAGE_KEY || !ownerKey) return
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
      await fetch(`${BACKEND_URL}/api/agents/${id}?owner=${ownerKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      })
    } catch {}
  }

  const deleteAgent = async (id: string) => {
    if (!STORAGE_KEY || !ownerKey) return
    setAgents(prev => {
      const updated = prev.filter(a => a.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    try {
      await fetch(`${BACKEND_URL}/api/agents/${id}?owner=${ownerKey}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(15000)
      })
    } catch {}
  }

  const setAgentStatus = (id: string, status: AgentStatus) => {
    updateAgent(id, { status })
  }

  return { agents, addAgent, updateAgent, deleteAgent, setAgentStatus, refetch: fetchAgents, backendAvailable, saving }
}
