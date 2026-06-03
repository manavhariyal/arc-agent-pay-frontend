export type AgentStatus = "active" | "idle" | "paused";

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  address: string;
  createdAt: string;
  lowBalanceThreshold?: number;
}

export interface StoredTransaction {
  id: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  agentId?: string;
  agentName?: string;
  note?: string;
  timestamp: number;
  status: "confirmed" | "pending" | "failed";
}

export interface SpendingRule {
  id: string;
  agentId: string;
  agentName: string;
  type: "recurring" | "one-time";
  amount: string;
  interval?: "hourly" | "daily" | "weekly" | "monthly";
  recipient: string;
  recipientLabel?: string;
  status: "active" | "inactive";
  createdAt: string;
}
