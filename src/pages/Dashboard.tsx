import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAgents } from "@/hooks/useAgents";
import { useTransactions } from "@/hooks/useTransactions";
import { formatUSDC, truncateAddress } from "@/lib/utils";
import { motion } from "framer-motion";
import { Wallet, Activity, Zap, Copy, ArrowUpRight, ExternalLink, AlertTriangle, Send, Plus, Droplets, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useWallet } from "@/hooks/useWallet";
import { WalletButton } from "@/components/wallet/WalletButton";
import { SendPaymentDialog } from "@/components/wallet/SendPaymentDialog";
import { ARC_NETWORK } from "@/config/arc-network";
import { formatUnits } from "viem";
import { useAgentHealth } from "@/context/AgentHealthContext";

export default function Dashboard() {
  const { toast } = useToast();
  const { address, isConnected, isOnArcTestnet, formattedBalance, isBalanceLoading } = useWallet();
  const { agents } = useAgents();
  const { transactions } = useTransactions(address);
  const { alerts } = useAgentHealth();
  const [sendOpen, setSendOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Address copied to clipboard." });
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
  };

  const activeAgents = agents.filter((a) => a.status === "active");
  const confirmedTxs = transactions.filter((tx) => tx.status === "confirmed");
  const totalVolume = confirmedTxs.reduce((acc, tx) => {
    try { return acc + parseFloat(formatUnits(BigInt(tx.amount), 18)); } catch { return acc; }
  }, 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Command Center
              <span className="block w-10 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 mt-1.5 rounded-full" />
            </h1>
            <p className="text-white/40 mt-2 text-sm">Your AI agent payment network on Arc Testnet.</p>
          </div>

          <div className="flex items-center gap-3">
            {isConnected && isOnArcTestnet ? (
              <>
                <button
                  onClick={() => copyToClipboard(address!)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl glass-panel border border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer"
                >
                  <Wallet className="w-4 h-4 text-indigo-400" />
                  <span className="font-mono text-sm text-white">{truncateAddress(address!)}</span>
                  <div className="w-px h-4 bg-white/10" />
                  <span className="font-bold text-cyan-400 font-mono text-sm">
                    {isBalanceLoading ? "…" : `${formattedBalance} USDC`}
                  </span>
                  <Copy className="w-3.5 h-3.5 text-white/30" />
                </button>
                <a
                  href={`${ARC_NETWORK.faucetUrl}?address=${address}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    variant="outline"
                    className="h-10 px-4 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-xl font-semibold transition-all"
                  >
                    <Droplets className="w-4 h-4 mr-2" /> Faucet
                  </Button>
                </a>
                <Button
                  onClick={() => setSendOpen(true)}
                  className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-[0_0_16px_rgba(99,102,241,0.4)]"
                >
                  <Send className="w-4 h-4 mr-2" /> Send
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {!isConnected && (
                  <div className="text-xs text-white/30 italic hidden sm:block">Connect wallet to begin</div>
                )}
                <WalletButton />
              </div>
            )}
          </div>
        </div>

        {/* Low balance alerts */}
        {isConnected && isOnArcTestnet && alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-amber-300 mb-1">
                  {alerts.length === 1
                    ? "1 agent has a low balance"
                    : `${alerts.length} agents have low balances`}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {alerts.map((alert) => (
                    <Link key={alert.agentId} href={`/agents/${alert.agentId}`}>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-xs font-semibold text-amber-300">{alert.agentName}</span>
                        <span className="text-[10px] font-mono text-amber-400/70">
                          {alert.balance.toFixed(4)} USDC
                        </span>
                        <span className="text-[10px] text-amber-500/60">/ {alert.threshold} min</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/agents">
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg shrink-0"
                >
                  Fund Agents
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Wrong network */}
        {isConnected && !isOnArcTestnet && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium flex-1">
              Switch to Arc Testnet (Chain ID: {ARC_NETWORK.chainId}) to use the dashboard.
            </span>
            <WalletButton compact={false} />
          </motion.div>
        )}

        {/* Not connected CTA */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-elevated rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 border border-indigo-500/20"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Wallet className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-white font-bold text-xl mb-1">Connect your wallet to get started</h2>
              <p className="text-white/40 text-sm">
                Link MetaMask to Arc Testnet to view your balance, register agents, and send USDC payments on-chain.
              </p>
            </div>
            <WalletButton />
          </motion.div>
        )}

        {/* Stat Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div variants={item} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <div className="glass-panel-elevated p-6 rounded-2xl h-full">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-indigo-400" />
                </div>
                {isConnected && isOnArcTestnet && (
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">Live</span>
                )}
              </div>
              <div className="text-xs text-white/40 uppercase tracking-wider font-medium mb-2">Wallet Balance</div>
              <div className="text-3xl font-black text-white leading-none">
                {isConnected && isOnArcTestnet ? (
                  isBalanceLoading ? (
                    <div className="h-9 w-40 bg-white/5 rounded-lg animate-pulse" />
                  ) : (
                    <span>{formattedBalance} <span className="text-sm font-medium text-indigo-300">USDC</span></span>
                  )
                ) : (
                  <span className="text-white/20 text-2xl">—</span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-indigo-400/60">
                  {isConnected && isOnArcTestnet ? `Arc Testnet · Chain ${ARC_NETWORK.chainId}` : "Connect wallet"}
                </span>
                {isConnected && isOnArcTestnet && (
                  <a
                    href={`${ARC_NETWORK.faucetUrl}?address=${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400/70 hover:text-emerald-400 transition-colors"
                  >
                    <Droplets className="w-3 h-3" /> Get test USDC
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <div className="glass-panel-elevated p-6 rounded-2xl h-full">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="text-xs text-white/40 uppercase tracking-wider font-medium mb-2">Registered Agents</div>
              <div className="text-3xl font-black text-white leading-none">
                {agents.length > 0 ? (
                  <span>
                    {activeAgents.length}{" "}
                    <span className="text-sm font-medium text-white/30">/ {agents.length} total</span>
                  </span>
                ) : (
                  <span className="text-white/20">0</span>
                )}
              </div>
              <div className="mt-2 text-xs text-cyan-400/60">
                {agents.length === 0 ? "Add your first agent" : `${activeAgents.length} active`}
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <div className="glass-panel-elevated p-6 rounded-2xl h-full">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="text-xs text-white/40 uppercase tracking-wider font-medium mb-2">Volume Sent</div>
              <div className="text-3xl font-black text-white leading-none">
                {confirmedTxs.length > 0 ? (
                  <span>{formatUSDC(totalVolume)}</span>
                ) : (
                  <span className="text-white/20">0.00 USDC</span>
                )}
              </div>
              <div className="mt-2 text-xs text-purple-400/60">{confirmedTxs.length} confirmed transactions</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Your Agents</h2>
              <Link href="/agents" className="text-xs text-indigo-400 hover:text-cyan-400 transition-colors flex items-center gap-1">
                Manage <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="glass-panel rounded-xl overflow-hidden min-h-[160px]">
              {agents.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white/20" />
                  </div>
                  <p className="text-white/30 text-sm">No agents registered yet.</p>
                  <Link href="/agents">
                    <button className="mt-3 text-indigo-400 hover:text-cyan-400 text-xs transition-colors">
                      Add your first agent →
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {agents.slice(0, 3).map((agent) => (
                    <Link key={agent.id} href={`/agents/${agent.id}`}>
                      <div className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-1 h-10 rounded-full shrink-0 ${
                              agent.status === "active"
                                ? "bg-emerald-400"
                                : agent.status === "idle"
                                ? "bg-sky-400"
                                : "bg-amber-400"
                            }`}
                          />
                          <div>
                            <div className="font-semibold text-sm text-white flex items-center gap-2">
                              {agent.name}
                              {agent.status === "active" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              )}
                            </div>
                            <div className="text-[11px] text-white/35 mt-0.5 font-mono">
                              {truncateAddress(agent.address)}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`capitalize text-[10px] ${
                            agent.status === "active"
                              ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
                              : agent.status === "idle"
                              ? "text-sky-400 border-sky-400/20 bg-sky-400/10"
                              : "text-amber-400 border-amber-400/20 bg-amber-400/10"
                          }`}
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Recent Transactions</h2>
              <Link href="/activity" className="text-xs text-indigo-400 hover:text-cyan-400 transition-colors flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="glass-panel rounded-xl overflow-hidden min-h-[160px]">
              {transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <Send className="w-5 h-5 text-white/20" />
                  </div>
                  <p className="text-white/30 text-sm">No transactions yet.</p>
                  {isConnected && isOnArcTestnet && (
                    <button
                      onClick={() => setSendOpen(true)}
                      className="mt-3 text-indigo-400 hover:text-cyan-400 text-xs transition-colors"
                    >
                      Send your first payment →
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {transactions.slice(0, 4).map((tx) => {
                    let usdcAmount = 0;
                    try { usdcAmount = parseFloat(formatUnits(BigInt(tx.amount), 18)); } catch {}
                    return (
                      <div key={tx.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              tx.status === "confirmed"
                                ? "bg-emerald-400"
                                : tx.status === "pending"
                                ? "bg-amber-400 animate-pulse"
                                : "bg-rose-400"
                            }`}
                          />
                          <div>
                            <div className="font-medium text-sm text-white">{tx.agentName ?? "Direct"}</div>
                            <div className="text-[11px] text-white/35 font-mono mt-0.5 flex items-center gap-1">
                              To: {truncateAddress(tx.toAddress)}
                              <a
                                href={`${ARC_NETWORK.explorerUrl}/tx/${tx.hash}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-400/50 hover:text-indigo-400 transition-colors ml-1"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm font-semibold text-white">
                            -{formatUSDC(usdcAmount)}
                          </div>
                          <Badge
                            variant="outline"
                            className={`mt-1 text-[10px] capitalize ${
                              tx.status === "confirmed"
                                ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
                                : tx.status === "pending"
                                ? "text-amber-400 border-amber-400/20 bg-amber-400/10"
                                : "text-rose-400 border-rose-400/20 bg-rose-400/10"
                            }`}
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
          </motion.div>
        </div>
      </div>

      <SendPaymentDialog open={sendOpen} onClose={() => setSendOpen(false)} />
    </AppLayout>
  );
}
