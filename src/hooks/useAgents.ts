import { useState, useEffect } from 'react'
import type { Agent, AgentStatus } from '@/types'

const STORAGE_KEY = 'arc_agents_v2'

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
  }, [agents])

  const addAgent = (input: Omit<Agent, 'id' | 'createdAt'>): Agent => {
    const newAgent: Agent = {
      ...input,
      id: `agt_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setAgents(prev => [...prev, newAgent])
    return newAgent
  }

  const updateAgent = (id: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  const deleteAgent = (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id))
  }

  const setAgentStatus = (id: string, status: AgentStatus) => {
    updateAgent(id, { status })
  }

  return { agents, addAgent, updateAgent, deleteAgent, setAgentStatus }
}
