import { AppLayout } from "@/components/layout/AppLayout";
import { useTransactions } from "@/hooks/useTransactions";
import { useAgents } from "@/hooks/useAgents";
import { useWallet } from "@/hooks/useWallet";
import { formatUSDC } from "@/lib/utils";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Send, Wallet, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { formatUnits } from "viem";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://arc-agent-pay-backend.onrender.com'

export default function Analytics() {
  const { address, isConnected } = useWallet();
  const { transactions } = useTransactions(address);
  const { agents } = useAgents();
  const [backendTxs, setBackendTxs] = useState<any[]>([]);

  const ownerKey = address ? address.toLowerCase() : null;

  useEffect(() => {
    if (!ownerKey) {
      setBackendTxs([]);
      return;
    }
    fetch(`${BACKEND_URL}/api/transactions?owner=${ownerKey}`)
      .then(r => r.json())
      .then(data => setBackendTxs(data))
      .catch(() => {});
  }, [ownerKey]);

  const confirmedTxs = transactions.filter((tx) => tx.status === "confirmed");
  const backendConfirmed = backendTxs.filter(tx => tx.status === "success");

  const localVolume = confirmedTxs.reduce((acc, tx) => {
    try { return acc + parseFloat(formatUnits(BigInt(tx.amount), 18)); } catch { return acc; }
  }, 0);
  const backendVolume = backendConfirmed.reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);
  const totalVolume = localVolume + backendVolume;

  const totalTxCount = transactions.length + backendTxs.length;
  const totalConfirmed = confirmedTxs.length + backendConfirmed.length;
  const avgTx = totalConfirmed > 0 ? totalVolume / totalConfirmed : 0;
  const failedCount = transactions.filter(t => t.status === "failed").length + backendTxs.filter(t => t.status === "failed").length;

  const txsByDate: Record<string, { date: string; amount: number; count: number }> = {};

  confirmedTxs.forEach(tx => {
    const date = new Date(tx.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (!txsByDate[date]) txsByDate[date] = { date, amount: 0, count: 0 };
    try { txsByDate[date].amount += parseFloat(formatUnits(BigInt(tx.amount), 18)); } catch {}
    txsByDate[date].count += 1;
  });

  backendConfirmed.forEach(tx => {
    const date = new Date(tx.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (!txsByDate[date]) txsByDate[date] = { date, amount: 0, count: 0 };
    txsByDate[date].amount += parseFloat(tx.amount || 0);
    txsByDate[date].count += 1;
  });

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });

  const chartData = last7.map((date) => txsByDate[date] ?? { date, amount: 0, count: 0 });

  const agentVolumes = agents.map((agent) => {
    const agentLocalTxs = confirmedTxs.filter((tx) => tx.agentId === agent.id);
    const agentBackendTxs = backendConfirmed.filter(tx => tx.agent_id === agent.id);
    const localVol = agentLocalTxs.reduce((acc, tx) => {
      try { return acc + parseFloat(formatUnits(BigInt(tx.amount), 18)); } catch { return acc; }
    }, 0);
    const backendVol = agentBackendTxs.reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);
    const vol = localVol + backendVol;
    return { name: agent.name, volume: vol, count: agentLocalTxs.length + agentBackendTxs.length };
  }).filter(a => a.volume > 0).sort((a, b) => b.volume - a.volume);

  const COLORS = ["#6366f1", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"];

  if (!isConnected) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-7xl mx-auto">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/20">
                <BarChart3 className="w-7 h-7 text-cyan-400" />
              </div>
              Analytics
            </h1>
            <div className="h-1 w-16 bg-cyan-400 rounded-full mt-2"></div>
          </div>
          <div className="glass-panel-elevated rounded-2xl p-12 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-indigo-400/30" />
            <h2 className="text-white font-bold text-xl mb-2">Connect your wallet</h2>
            <p className="text-white/40 text-sm mb-6">Connect to Arc Testnet to see your payment analytics.</p>
            <WalletButton />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/20">
              <BarChart3 className="w-7 h-7 text-cyan-400" />
            </div>
            Analytics
          </h1>
          <div className="h-1 w-16 bg-cyan-400 rounded-full mb-4 mt-2"></div>
          <p className="text-white/40 text-sm">Real-time metrics from your Arc Testnet transactions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { label: "Total Volume", value: formatUSDC(totalVolume), sub: `${totalConfirmed} confirmed txs`, icon: TrendingUp, color: "indigo" },
            { label: "Avg Transaction", value: formatUSDC(avgTx), sub: "per confirmed tx", icon: Send, color: "cyan" },
            { label: "Total Transactions", value: String(totalTxCount), sub: `${failedCount} failed`, icon: BarChart3, color: "purple" },
            { label: "Active Agents", value: String(agents.filter(a => a.status === "active").length), sub: `${agents.length} total registered`, icon: Users, color: "emerald" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="glass-panel-elevated p-6 rounded-2xl border-white/5">
                <div className={`w-9 h-9 rounded-xl mb-4 flex items-center justify-center bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
                <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-white/30 text-xs">{stat.sub}</div>
              </Card>
            );
          })}
        </div>

        {totalTxCount === 0 ? (
          <div className="glass-panel-elevated rounded-2xl p-12 text-center">
            <Send className="w-10 h-10 mx-auto mb-4 text-indigo-400/30" />
            <h2 className="text-white font-bold text-lg mb-2">No data yet</h2>
            <p className="text-white/40 text-sm">Send payments through Arc Agent Pay and analytics will populate here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="glass-panel-elevated rounded-3xl h-[400px] flex flex-col overflow-hidden">
                <div className="px-8 pt-7 pb-4 border-b border-white/5">
                  <h3 className="text-lg font-bold text-white">Volume — Last 7 Days</h3>
                  <p className="text-xs text-white/30 mt-0.5">USDC sent per day</p>
                </div>
                <div className="flex-1 min-h-0 p-4 pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} dx={-4} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "rgba(10,13,25,0.95)", borderColor: "rgba(99,102,241,0.3)", color: "#fff", borderRadius: "12px", fontSize: 12 }}
                        formatter={(value: number) => [formatUSDC(value), "Volume"]}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="glass-panel-elevated rounded-3xl h-[400px] flex flex-col overflow-hidden">
                <div className="px-8 pt-7 pb-4 border-b border-white/5">
                  <h3 className="text-lg font-bold text-white">Transaction Count — Last 7 Days</h3>
                  <p className="text-xs text-white/30 mt-0.5">Number of payments per day</p>
                </div>
                <div className="flex-1 min-h-0 p-4 pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dx={-4} allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "rgba(10,13,25,0.95)", borderColor: "rgba(6,182,212,0.3)", color: "#fff", borderRadius: "12px", fontSize: 12 }}
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        formatter={(value: number) => [value, "Transactions"]}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {chartData.map((_, index) => (
                          <Cell key={index} fill={index === chartData.length - 1 ? "#06b6d4" : "#6366f1"} opacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {agentVolumes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
                <Card className="glass-panel-elevated rounded-3xl overflow-hidden">
                  <div className="px-8 pt-7 pb-4 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white">Volume by Agent</h3>
                    <p className="text-xs text-white/30 mt-0.5">Confirmed USDC sent per registered agent</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {agentVolumes.map((av, i) => {
                      const pct = totalVolume > 0 ? (av.volume / totalVolume) * 100 : 0;
                      return (
                        <div key={av.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-white">{av.name}</span>
                            <span className="font-mono text-white/60">{formatUSDC(av.volume)} · {av.count} txs</span>
                          </div>
                          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
