import { useParams } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAgents } from "@/hooks/useAgents";
import { useTransactions } from "@/hooks/useTransactions";
import { useSpendingRules } from "@/hooks/useSpendingRules";
import { useWallet } from "@/hooks/useWallet";
import { formatUSDC, truncateAddress, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, Wallet, Shield, Zap, History, Settings, ExternalLink,
  Copy, Send, CheckCircle2, Clock, XCircle, Trash2, ToggleLeft, ToggleRight, Link2, TrendingUp,
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

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { address } = useWallet();
  const { agents, setAgentStatus } = useAgents();
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
        const res = await fetch(`${BACKEND_URL}/api/transactions?owner=${ownerKey}`);
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

  const copyPayLink = () => {
    if (!agent || !agent.walletAddress) return;
    const base = window.location.origin;
    const link = base + "/pay/" + agent.walletAddress;
    navigator.clipboard.writeText(link);
    setCopiedPayLink(true);
    setTimeout(() => setCopiedPayLink(false), 2000);
  };

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: agent ? (agent.walletAddress as `0x${string}`) : undefined,
    chainId: arcTestnet.id,
    query: { enabled: !!agent && !!agent.walletAddress },
  });

  if (!agent) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] glass-panel-elevated rounded-3xl">
          <Shield className="w-16 h-16 text-white/10 mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">Agent Not Found</h2>
          <p className="text-white/40 mb-8">This agent doesn't exist or has been removed.</p>
          <Link href="/agents">
            <Button className="bg-indigo-600 text-white rounded-full px-8 h-11">Back to Agents</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const onChainAgentTxs = transactions.filter((tx) => tx.agentId === agent.id);
  const seenHashes = new Set(onChainAgentTxs.filter(tx => tx.hash).map(tx => tx.hash));
  const agentTxs = [
    ...onChainAgentTxs,
    ...backendAgentTxs.filter(tx => !tx.hash || !seenHashes.has(tx.hash)),
  ].sort((a, b) => b.timestamp - a.timestamp);
  const agentRules = rules.filter((r) => r.agentId === agent.id);

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

  const formattedBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals)).toFixed(4)
    : null;

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
              <SelectTrigger className="glass-panel border-indigo-500/20 text-white h-11 rounded-full w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel-elevated border-indigo-500/20 rounded-xl">
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
              className="glass-panel border-indigo-500/20 text-white/70 hover:text-white rounded-full h-11 px-5 font-semibold hover:border-indigo-500/50 transition-all"
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
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-full h-11 px-6 font-semibold shadow-[0_0_16px_rgba(99,102,241,0.35)]"
            >
              <Send className="w-4 h-4 mr-2" /> Fund Wallet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="glass-panel-elevated p-7 rounded-2xl md:col-span-2 relative overflow-hidden border-l-4 border-l-indigo-500">
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="text-white/40 font-semibold uppercase tracking-wider text-xs">Agent Wallet</div>
              <Wallet className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-5xl font-black text-white mb-4"
              >
                {isBalanceLoading ? (
                  <div className="h-12 w-48 bg-white/5 rounded-xl animate-pulse" />
                ) : formattedBalance !== null ? (
                  <span>
                    {formattedBalance} <span className="text-xl font-medium text-indigo-300">USDC</span>
                  </span>
                ) : (
                  <span className="text-white/20">—</span>
                )}
              </motion.div>
              <div
                className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full w-fit cursor-pointer hover:border-indigo-500/40 transition-colors"
                onClick={() => copyToClipboard(agent.walletAddress)}
              >
                <span className="font-mono text-cyan-400 text-sm">{agent.walletAddress}</span>
                <Copy className="w-3.5 h-3.5 text-white/30" />
                
                  
                    href={explorerAddressUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-white/30 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </Card>

          <Card className="glass-panel-elevated p-7 rounded-2xl border-l-4 border-l-cyan-500 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="text-white/40 font-semibold uppercase tracking-wider text-xs">Spending Rules</div>
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10">
              <div className="text-5xl font-black text-white mb-2">{agentRules.length}</div>
              <div className="text-white/40 text-sm">
                {agentRules.filter((r) => r.status === "active").length} active
              </div>
            </motion.div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="flex flex-col gap-4">
            {[
              {
                label: "Total USDC Sent",
                value: formatUSDC(stats.totalSent),
                unit: "USDC",
                icon: <Send className="w-4 h-4" />,
                color: "text-indigo-400",
                border: "border-l-indigo-500",
                glow: "bg-indigo-500/5",
              },
              {
                label: "Total Transactions",
                value: stats.txCount.toString(),
                unit: stats.confirmedCount + " confirmed",
                icon: <History className="w-4 h-4" />,
                color: "text-cyan-400",
                border: "border-l-cyan-500",
                glow: "bg-cyan-500/5",
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

          <Card className="glass-panel-elevated p-6 rounded-2xl lg:col-span-2 relative overflow-hidden border border-indigo-500/10">
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex justify-between items-center mb-5 relative z-10">
              <div>
                <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Payment Activity</div>
                <div className="text-white font-bold text-sm">Last 30 days · USDC Sent</div>
              </div>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
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
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                        border: "1px solid rgba(99,102,241,0.3)",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: 12,
                      }}
                      formatter={(value) => [value + " USDC", "Sent"]}
                      labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}
                      cursor={{ stroke: "rgba(99,102,241,0.3)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="usdc"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#agentSparkGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList className="glass-panel border-indigo-500/20 mb-6 p-1.5 rounded-full inline-flex">
            <TabsTrigger
              value="transactions"
              className="rounded-full px-5 py-2 text-sm font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              <History className="w-4 h-4 mr-2" /> Transactions ({agentTxs.length})
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="rounded-full px-5 py-2 text-sm font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
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
                    className="mt-3 text-indigo-400 hover:text-cyan-400 text-sm transition-colors"
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
                              
                                
                                  href={ARC_NETWORK.explorerUrl + "/tx/" + tx.hash}
                                target="_blank"
                                rel="noreferrer"
                                className="text-white/30 hover:text-indigo-400 transition-colors"
                              >
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
                    <button className="text-indigo-400 hover:text-cyan-400 text-sm transition-colors">
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
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
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
                            <span className="font-mono font-bold text-cyan-400">
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
