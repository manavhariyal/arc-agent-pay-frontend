import { useParams } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAgents } from "@/hooks/useAgents";
import { useTransactions } from "@/hooks/useTransactions";
import { useSpendingRules } from "@/hooks/useSpendingRules";
import { useWallet } from "@/hooks/useWallet";
import { formatUSDC, truncateAddress, cn, getSoonestNextRun } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, Wallet, Shield, Zap, History, Settings, ExternalLink,
  Copy, Send, CheckCircle2, Clock, XCircle, Trash2, ToggleLeft, ToggleRight, Link2, TrendingUp,
  ShieldAlert, Plus, X, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useBalance } from "wagmi";
import { formatUnits } from "viem";
import { arcTestnet, ARC_NETWORK } from "@/config/arc-network";
import { SendPaymentDialog } from "@/components/wallet/SendPaymentDialog";
import type { AgentStatus } from "@/types";
import type { StoredTransaction } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { address } = useWallet();
  const { agents, setAgentStatus, updateAgent } = useAgents();
  const { transactions } = useTransactions(address);
  const [backendAgentTxs, setBackendAgentTxs] = useState<StoredTransaction[]>([]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://arc-agent-pay-backend.onrender.com';

  useEffect(() => {
    if (!address || !id) {
      setBackendAgentTxs([]);
      return;
    }
    const ownerKey = address.toLowerCase();
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/transactions?owner=${ownerKey}&limit=2000`);
        if (!res.ok) return;
        const data = await res.json();
        const normalized: StoredTransaction[] = data
          .filter((tx: any) => tx.agent_id === id)
          .map((tx: any) => ({
            id: `backend-${tx.id}`,
            hash: tx.tx_hash || "",
            fromAddress: tx.from_address || "",
            toAddress: tx.to_address,
            amount: Math.round(parseFloat(tx.amount) * 1e18).toString(),
            agentId: tx.agent_id,
            timestamp: new Date(tx.created_at).getTime(),
            status: tx.status === "success" ? "confirmed" : tx.status === "pending" ? "pending" : "failed",
          }));
        setBackendAgentTxs(normalized);
      } catch {}
    })();
  }, [address, id]);

  const { rules, deleteRule, toggleRule } = useSpendingRules();
  const [sendOpen, setSendOpen] = useState(false);
  const [copiedPayLink, setCopiedPayLink] = useState(false);

  const agent = agents.find((a) => a.id === id);

  // Spending controls state — initialized from the agent once loaded.
  const [limitInput, setLimitInput] = useState<string>("");
  const [newApprovedAddr, setNewApprovedAddr] = useState<string>("");
  const [savingLimit, setSavingLimit] = useState(false);
  const [savingStop, setSavingStop] = useState(false);

  useEffect(() => {
    if (agent) setLimitInput((agent as any).spendingLimit != null ? String((agent as any).spendingLimit) : "");
  }, [agent?.id, (agent as any)?.spendingLimit]);

  const approvedAddresses: string[] = (agent as any)?.approvedAddresses || [];
  const isEmergencyStopped: boolean = !!(agent as any)?.isEmergencyStopped;

  const saveSpendingLimit = async () => {
    if (!agent) return;
    setSavingLimit(true);
    const parsed = limitInput.trim() === "" ? null : parseFloat(limitInput);
    await updateAgent(agent.id, { spendingLimit: parsed } as any);
    setSavingLimit(false);
    toast({ title: parsed === null ? "Spending limit removed" : `Spending limit set to ${parsed} USDC` });
  };

  const toggleEmergencyStop = async () => {
    if (!agent) return;
    setSavingStop(true);
    await updateAgent(agent.id, { isEmergencyStopped: !isEmergencyStopped } as any);
    setSavingStop(false);
    toast({
      title: !isEmergencyStopped ? "Emergency stop activated" : "Emergency stop lifted",
      description: !isEmergencyStopped ? "No rules for this agent will execute until you lift this." : "This agent's rules can run normally again.",
      variant: !isEmergencyStopped ? "destructive" : "default",
    });
  };

  const addApprovedAddress = async () => {
    if (!agent || !newApprovedAddr.trim()) return;
    const addr = newApprovedAddr.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      toast({ title: "Invalid address", description: "Enter a valid 0x wallet address.", variant: "destructive" });
      return;
    }
    if (approvedAddresses.some((a) => a.toLowerCase() === addr.toLowerCase())) {
      setNewApprovedAddr("");
      return;
    }
    await updateAgent(agent.id, { approvedAddresses: [...approvedAddresses, addr] } as any);
    setNewApprovedAddr("");
  };

  const removeApprovedAddress = async (addr: string) => {
    if (!agent) return;
    await updateAgent(agent.id, { approvedAddresses: approvedAddresses.filter((a) => a !== addr) } as any);
  };

  const copyPayLink = () => {
    if (!agent || !agent.walletAddress) return;
    const base = window.location.origin;
    const link = base + "/pay/" + agent.walletAddress;
    navigator.clipboard.writeText(link);
    setCopiedPayLink(true);
    setTimeout(() => setCopiedPayLink(false), 2000);
  };

  const { data: balanceData, isLoading: isBalanceLoading, isError: isBalanceError, refetch: refetchBalance } = useBalance({
    address: agent ? (agent.walletAddress as `0x${string}`) : undefined,
    chainId: arcTestnet.id,
    query: { enabled: !!agent && !!agent.walletAddress, retry: 3 },
  });

  const onChainAgentTxs = agent ? transactions.filter((tx) => tx.agentId === agent.id) : [];
  const seenHashes = new Set(onChainAgentTxs.filter(tx => tx.hash).map(tx => tx.hash));
  const agentTxs = agent ? [
    ...onChainAgentTxs,
    ...backendAgentTxs.filter(tx => !tx.hash || !seenHashes.has(tx.hash)),
  ].sort((a, b) => b.timestamp - a.timestamp) : [];
  const agentRules = agent ? rules.filter((r) => r.agentId === agent.id) : [];

  const stats = useMemo(() => {
    const confirmed = agentTxs.filter((tx) => tx.status === "confirmed");
    const totalSent = confirmed.reduce((sum, tx) => {
      try {
        return sum + parseFloat(formatUnits(BigInt(tx.amount), 18));
      } catch {
        return sum;
      }
    }, 0);
    const successRate =
      agentTxs.length > 0 ? Math.round((confirmed.length / agentTxs.length) * 100) : 100;

    const today = new Date();
    const days: { date: string; usdc: number; label: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const usdc = confirmed
        .filter((tx) => new Date(tx.timestamp).toISOString().slice(0, 10) === key)
        .reduce((sum, tx) => {
          try {
            return sum + parseFloat(formatUnits(BigInt(tx.amount), 18));
          } catch {
            return sum;
          }
        }, 0);
      days.push({ date: key, usdc: parseFloat(usdc.toFixed(4)), label });
    }
    return {
      totalSent,
      txCount: agentTxs.length,
      confirmedCount: confirmed.length,
      successRate,
      sparkline: days,
    };
  }, [agentTxs]);

  if (!agent) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] glass-panel-elevated rounded-3xl">
          <Shield className="w-16 h-16 text-white/10 mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">Agent Not Found</h2>
          <p className="text-white/40 mb-8">This agent doesn't exist or has been removed.</p>
          <Link href="/agents">
            <Button className="bg-[#0B3FD1] text-white rounded-full px-8 h-11">Back to Agents</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const formattedBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals)).toFixed(4)
    : null;

  // Derived from this agent's rules — no new backend calls needed.
  const amountSpentViaRules = agentRules.reduce(
    (sum, r) => sum + parseFloat(r.amount || "0") * (r.executionCount || 0), 0
  );
  const nextAction = getSoonestNextRun(agentRules);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Address copied to clipboard." });
  };

  const statusColors: Record<AgentStatus, string> = {
    active: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    idle: "text-sky-400 border-sky-400/30 bg-sky-400/10",
    paused: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  };

  const explorerAddressUrl = ARC_NETWORK.explorerUrl + "/address/" + agent.walletAddress;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start gap-5 justify-between">
          <div className="flex items-start gap-4">
            <Link href="/agents">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/40 hover:text-white rounded-full glass-panel h-11 w-11 shrink-0 mt-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-4xl font-black tracking-tight text-white">{agent.name}</h1>
                <Badge
                  variant="outline"
                  className={cn("capitalize px-3 py-1 rounded-full text-sm font-bold", statusColors[agent.status])}
                >
                  {agent.status}
                </Badge>
              </div>
              {agent.description && <p className="text-white/40 text-sm">{agent.description}</p>}
              <div className="text-[11px] text-white/20 mt-1 font-mono">
                Registered {new Date(agent.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex gap-3 shrink-0 flex-wrap">
            <Select value={agent.status} onValueChange={(v) => setAgentStatus(agent.id, v as AgentStatus)}>
              <SelectTrigger className="glass-panel border-[#0A84FF]/20 text-white h-11 rounded-full w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel-elevated border-[#0A84FF]/20 rounded-xl">
                <SelectItem value="active" className="text-white rounded-lg">
                  Active
                </SelectItem>
                <SelectItem value="idle" className="text-white rounded-lg">
                  Idle
                </SelectItem>
                <SelectItem value="paused" className="text-white rounded-lg">
                  Paused
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={copyPayLink}
              variant="outline"
              className="glass-panel border-[#0A84FF]/20 text-white/70 hover:text-white rounded-full h-11 px-5 font-semibold hover:border-[#0A84FF]/50 transition-all"
            >
              {copiedPayLink ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" /> Share Pay Link
                </>
              )}
            </Button>
            <Button
              onClick={() => setSendOpen(true)}
              className="bg-gradient-to-r from-[#0B3FD1] to-[#049CAE] text-white rounded-full h-11 px-6 font-semibold shadow-[0_0_16px_rgba(10,132,255,0.35)]"
            >
              <Send className="w-4 h-4 mr-2" /> Fund Wallet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="glass-panel-elevated p-7 rounded-2xl md:col-span-2 relative overflow-hidden border-l-4 border-l-[#0A84FF]">
            <div className="absolute right-0 top-0 w-64 h-64 bg-[#0A84FF]/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="text-white/40 font-semibold uppercase tracking-wider text-xs">Agent Wallet</div>
              <Wallet className="w-5 h-5 text-[#3AB4FF]" />
            </div>
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-5xl font-black text-white mb-4"
              >
                {isBalanceLoading ? (
                  <div className="h-12 w-48 bg-white/5 rounded-xl animate-pulse" />
                ) : isBalanceError || formattedBalance === null ? (
                  <button onClick={() => refetchBalance()} className="text-lg text-rose-400 hover:text-rose-300 flex items-center gap-2">
                    Couldn't load balance · <span className="underline decoration-dotted">tap to retry</span>
                  </button>
                ) : (
                  <span>
                    {formattedBalance} <span className="text-xl font-medium text-[#8FD6FF]">USDC</span>
                  </span>
                )}
              </motion.div>
              <div
                className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full w-fit cursor-pointer hover:border-[#0A84FF]/40 transition-colors"
                onClick={() => copyToClipboard(agent.walletAddress)}
              >
                <span className="font-mono text-[#22F0FF] text-sm">{agent.walletAddress}</span>
                <Copy className="w-3.5 h-3.5 text-white/30" />
                <a href={explorerAddressUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-white/30 hover:text-white transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </Card>

          <Card className="glass-panel-elevated p-7 rounded-2xl border-l-4 border-l-[#05D8EA] relative overflow-hidden">
            <div className="absolute right-0 top-0 w-48 h-48 bg-[#05D8EA]/5 rounded-full blur-[60px] pointer-events-none" />
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="text-white/40 font-semibold uppercase tracking-wider text-xs">Spending Rules</div>
              <Shield className="w-5 h-5 text-[#22F0FF]" />
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10">
              <div className="text-5xl font-black text-white mb-2">{agentRules.length}</div>
              <div className="text-white/40 text-sm">
                {agentRules.filter((r) => r.status === "active").length} active
              </div>
            </motion.div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="glass-panel-elevated p-6 rounded-2xl border-l-4 border-l-emerald-500/60">
            <div className="flex justify-between items-start mb-3">
              <div className="text-white/40 font-semibold uppercase tracking-wider text-xs">Amount Spent (via rules)</div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white">
              {amountSpentViaRules.toFixed(4)} <span className="text-sm font-medium text-white/30">USDC</span>
            </div>
            <div className="text-white/30 text-xs mt-1.5">
              Across {agentRules.reduce((n, r) => n + (r.executionCount || 0), 0)} scheduled executions
            </div>
          </Card>

          <Card className="glass-panel-elevated p-6 rounded-2xl border-l-4 border-l-[#3AB4FF]/60">
            <div className="flex justify-between items-start mb-3">
              <div className="text-white/40 font-semibold uppercase tracking-wider text-xs">Next Action</div>
              <Clock className="w-4 h-4 text-[#3AB4FF]" />
            </div>
            <div className="text-lg font-bold text-white">
              {nextAction ?? (agentRules.length === 0 ? "No rules set up" : "No active rules")}
            </div>
            <div className="text-white/30 text-xs mt-1.5">
              {agentRules.filter((r) => r.status === "active").length} active rule{agentRules.filter((r) => r.status === "active").length === 1 ? "" : "s"} scheduled
            </div>
          </Card>
        </div>

        {/* Spending Controls */}
        <Card className="glass-panel-elevated p-6 rounded-2xl border-l-4 border-l-amber-500/60">
          <div className="flex items-center gap-2 mb-5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <div className="text-white font-bold text-sm">Spending Controls</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Spending limit */}
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Total Spending Limit</div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="No limit"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="bg-white/[0.03] border-white/10 text-white text-sm h-9"
                />
                <Button size="sm" onClick={saveSpendingLimit} disabled={savingLimit} className="h-9 shrink-0">
                  {savingLimit ? "..." : "Save"}
                </Button>
              </div>
              <div className="text-white/25 text-[11px] mt-2">
                Lifetime USDC this agent may send across all its rules. Auto-pauses when reached. Leave empty for unlimited.
              </div>
            </div>

            {/* Approved addresses */}
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Approved Addresses</div>
              <div className="flex items-center gap-2 mb-2">
                <Input
                  placeholder="0x..."
                  value={newApprovedAddr}
                  onChange={(e) => setNewApprovedAddr(e.target.value)}
                  className="bg-white/[0.03] border-white/10 text-white text-xs font-mono h-9"
                />
                <Button size="sm" variant="outline" onClick={addApprovedAddress} className="h-9 shrink-0 px-2.5">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {approvedAddresses.length === 0 ? (
                <div className="text-white/25 text-[11px]">No allowlist set — this agent can pay any address its rules specify.</div>
              ) : (
                <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
                  {approvedAddresses.map((addr) => (
                    <div key={addr} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                      <span className="text-[11px] font-mono text-white/70">{truncateAddress(addr)}</span>
                      <button onClick={() => removeApprovedAddress(addr)} className="text-white/30 hover:text-rose-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency stop */}
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Emergency Stop</div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={isEmergencyStopped ? "outline" : "destructive"}
                    size="sm"
                    disabled={savingStop}
                    className={cn("w-full h-9", isEmergencyStopped && "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10")}
                  >
                    <Ban className="w-3.5 h-3.5 mr-1.5" />
                    {isEmergencyStopped ? "Lift Emergency Stop" : "Emergency Stop"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isEmergencyStopped ? "Lift emergency stop?" : "Stop all payments for this agent?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isEmergencyStopped
                        ? "This agent's scheduled rules will be able to execute again on their normal schedule."
                        : "No rule belonging to this agent will execute — including scheduled runs and manual \"Execute Now\" — until you lift this. Existing rules stay configured, they just won't fire."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={toggleEmergencyStop} className={cn(!isEmergencyStopped && "bg-rose-600 hover:bg-rose-700")}>
                      {isEmergencyStopped ? "Lift Stop" : "Confirm Stop"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="text-white/25 text-[11px] mt-2">
                {isEmergencyStopped
                  ? "All rules for this agent are currently blocked from running."
                  : "A manual kill switch, separate from individual rule pausing."}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="flex flex-col gap-4">
            {[
              {
                label: "Total USDC Sent",
                value: formatUSDC(stats.totalSent),
                unit: "USDC",
                icon: <Send className="w-4 h-4" />,
                color: "text-[#3AB4FF]",
                border: "border-l-[#0A84FF]",
                glow: "bg-[#0A84FF]/5",
              },
              {
                label: "Total Transactions",
                value: stats.txCount.toString(),
                unit: stats.confirmedCount + " confirmed",
                icon: <History className="w-4 h-4" />,
                color: "text-[#22F0FF]",
                border: "border-l-[#05D8EA]",
                glow: "bg-[#05D8EA]/5",
              },
              {
                label: "Success Rate",
                value: stats.successRate + "%",
                unit: stats.txCount === 0 ? "no transactions yet" : (stats.txCount - stats.confirmedCount) + " failed",
                icon: <TrendingUp className="w-4 h-4" />,
                color:
                  stats.successRate === 100
                    ? "text-emerald-400"
                    : stats.successRate >= 80
                    ? "text-amber-400"
                    : "text-rose-400",
                border:
                  stats.successRate === 100
                    ? "border-l-emerald-500"
                    : stats.successRate >= 80
                    ? "border-l-amber-500"
                    : "border-l-rose-500",
                glow: stats.successRate === 100 ? "bg-emerald-500/5" : "bg-amber-500/5",
              },
            ].map((s) => (
              <motion.div key={s.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <Card className={cn("glass-panel-elevated p-5 rounded-2xl border-l-4 relative overflow-hidden", s.border)}>
                  <div
                    className={cn(
                      "absolute right-0 top-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none",
                      s.glow
                    )}
                  />
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">{s.label}</span>
                    <span className={s.color}>{s.icon}</span>
                  </div>
                  <div className="relative z-10">
                    <div className={cn("text-2xl font-black", s.color)}>{s.value}</div>
                    <div className="text-[11px] text-white/30 mt-0.5">{s.unit}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="glass-panel-elevated p-6 rounded-2xl lg:col-span-2 relative overflow-hidden border border-[#0A84FF]/10">
            <div className="absolute right-0 top-0 w-64 h-64 bg-[#0A84FF]/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex justify-between items-center mb-5 relative z-10">
              <div>
                <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Payment Activity</div>
                <div className="text-white font-bold text-sm">Last 30 days · USDC Sent</div>
              </div>
              <TrendingUp className="w-4 h-4 text-[#3AB4FF]" />
            </div>
            {stats.txCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-white/20 text-sm">
                <Zap className="w-8 h-8 mb-2 opacity-30" />
                No payment data yet
              </div>
            ) : (
              <div className="relative z-10 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.sparkline} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="agentSparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={6}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v === 0 ? "" : String(v))}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,10,20,0.92)",
                        border: "1px solid rgba(10,132,255,0.3)",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: 12,
                      }}
                      formatter={(value) => [value + " USDC", "Sent"]}
                      labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}
                      cursor={{ stroke: "rgba(10,132,255,0.3)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="usdc"
                      stroke="#0A84FF"
                      strokeWidth={2}
                      fill="url(#agentSparkGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#0A84FF", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList className="glass-panel border-[#0A84FF]/20 mb-6 p-1.5 rounded-full inline-flex">
            <TabsTrigger
              value="transactions"
              className="rounded-full px-5 py-2 text-sm font-bold data-[state=active]:bg-[#0B3FD1] data-[state=active]:text-white"
            >
              <History className="w-4 h-4 mr-2" /> Transactions ({agentTxs.length})
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="rounded-full px-5 py-2 text-sm font-bold data-[state=active]:bg-[#0B3FD1] data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4 mr-2" /> Rules ({agentRules.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="focus-visible:outline-none">
            <div className="glass-panel-elevated rounded-2xl overflow-hidden">
              {agentTxs.length === 0 ? (
                <div className="p-12 text-center">
                  <Zap className="w-10 h-10 mx-auto mb-3 text-white/10" />
                  <p className="text-white/40">No transactions for this agent yet.</p>
                  <button
                    onClick={() => setSendOpen(true)}
                    className="mt-3 text-[#3AB4FF] hover:text-[#22F0FF] text-sm transition-colors"
                  >
                    Fund this agent →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {agentTxs.map((tx) => {
                    let usdcAmount = 0;
                    try {
                      usdcAmount = parseFloat(formatUnits(BigInt(tx.amount), 18));
                    } catch {}
                    return (
                      <div
                        key={tx.id}
                        className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                              tx.status === "confirmed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : tx.status === "pending"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}
                          >
                            {tx.status === "confirmed" ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : tx.status === "pending" ? (
                              <Clock className="w-5 h-5" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm flex items-center gap-2">
                              To: {truncateAddress(tx.toAddress)}
                              To: {truncateAddress(tx.toAddress)}
                              <a href={ARC_NETWORK.explorerUrl + "/tx/" + tx.hash} target="_blank" rel="noreferrer" className="text-white/30 hover:text-[#3AB4FF] transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            {tx.note && <div className="text-xs text-white/30 italic">{tx.note}</div>}
                            <div className="text-xs text-white/30 mt-0.5">
                              {new Date(tx.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-black text-white text-lg">-{formatUSDC(usdcAmount)}</div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase font-bold tracking-wider mt-1",
                              tx.status === "confirmed"
                                ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
                                : tx.status === "pending"
                                ? "text-amber-400 border-amber-400/20 bg-amber-400/10"
                                : "text-rose-400 border-rose-400/20 bg-rose-400/10"
                            )}
                          >
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rules" className="focus-visible:outline-none">
            <div className="glass-panel-elevated rounded-2xl overflow-hidden">
              {agentRules.length === 0 ? (
                <div className="p-12 text-center">
                  <Shield className="w-10 h-10 mx-auto mb-3 text-white/10" />
                  <p className="text-white/40 mb-2">No spending rules for this agent.</p>
                  <Link href="/rules">
                    <button className="text-[#3AB4FF] hover:text-[#22F0FF] text-sm transition-colors">
                      Create a rule →
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {agentRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                            rule.status === "active"
                              ? "bg-[#05D8EA]/10 text-[#22F0FF] border-[#05D8EA]/20"
                              : "bg-white/[0.04] text-white/30 border-white/10"
                          )}
                        >
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm capitalize">{rule.type} Payment</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase font-bold",
                                rule.status === "active"
                                  ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                                  : "text-white/30 border-white/10"
                              )}
                            >
                              {rule.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-white/50">
                            <span className="font-mono font-bold text-[#22F0FF]">
                              {formatUSDC(parseFloat(rule.amount))}
                            </span>
                            {rule.interval && <span> · {rule.interval}</span>}
                            {" · "}
                            {rule.recipientLabel ?? truncateAddress(rule.recipient)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleRule(rule.id)}
                          className={cn(
                            "rounded-full h-9 w-9",
                            rule.status === "active"
                              ? "text-emerald-400 hover:bg-emerald-500/10"
                              : "text-white/30 hover:bg-white/10"
                          )}
                        >
                          {rule.status === "active" ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRule(rule.id)}
                          className="rounded-full h-9 w-9 text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <SendPaymentDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        prefilledAddress={agent.walletAddress}
        prefilledAgentId={agent.id}
      />
    </AppLayout>
  );
}
