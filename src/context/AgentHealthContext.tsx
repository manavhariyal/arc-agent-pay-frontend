import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { arcTestnet } from '@/config/arc-network'
import type { Agent } from '@/types'

export const DEFAULT_LOW_BALANCE_THRESHOLD = 10

export interface AgentHealthEntry {
  agentId: string
  agentName: string
  address: string
  balance: number
  threshold: number
  isLow: boolean
}

interface AgentHealthContextValue {
  entries: Record<string, AgentHealthEntry>
  alerts: AgentHealthEntry[]
  updateEntry: (entry: AgentHealthEntry) => void
}

const AgentHealthContext = createContext<AgentHealthContextValue | null>(null)

export function useAgentHealth() {
  const ctx = useContext(AgentHealthContext)
  if (!ctx) throw new Error('useAgentHealth must be used within AgentHealthProvider')
  return ctx
}

function useAgentHealthContext() {
  const ctx = useContext(AgentHealthContext)
  if (!ctx) throw new Error('useAgentHealthContext must be used within AgentHealthProvider')
  return ctx
}

function AgentBalanceWatcher({ agent }: { agent: Agent }) {
  const { updateEntry } = useAgentHealthContext()
  const threshold = agent.lowBalanceThreshold ?? DEFAULT_LOW_BALANCE_THRESHOLD

  const { data } = useBalance({
    address: agent.address as `0x${string}`,
    chainId: arcTestnet.id,
    query: { refetchInterval: 30_000 },
  })

  useEffect(() => {
    if (data) {
      const balance = parseFloat(formatUnits(data.value, data.decimals))
      updateEntry({
        agentId: agent.id,
        agentName: agent.name,
        address: agent.address,
        balance,
        threshold,
        isLow: balance < threshold,
      })
    }
  }, [data, agent.id, agent.name, agent.address, threshold, updateEntry])

  return null
}

export function AgentHealthProvider({
  children,
  agents,
}: {
  children: ReactNode
  agents: Agent[]
}) {
  const [entries, setEntries] = useState<Record<string, AgentHealthEntry>>({})

  const updateEntry = useCallback((entry: AgentHealthEntry) => {
    setEntries(prev => {
      const existing = prev[entry.agentId]
      if (
        existing &&
        existing.balance === entry.balance &&
        existing.isLow === entry.isLow &&
        existing.threshold === entry.threshold
      ) {
        return prev
      }
      return { ...prev, [entry.agentId]: entry }
    })
  }, [])

  const alerts = Object.values(entries).filter(e => e.isLow)

  return (
    <AgentHealthContext.Provider value={{ entries, alerts, updateEntry }}>
      {agents.map(agent => (
        <AgentBalanceWatcher key={agent.id} agent={agent} />
      ))}
      {children}
    </AgentHealthContext.Provider>
  )
}
