import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTransactions } from "@/hooks/useTransactions";
import { useWallet } from "@/hooks/useWallet";
import { formatUSDC, truncateAddress, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ExternalLink, CheckCircle2, XCircle, Clock, Send, Wallet, RefreshCw, Download, Copy, Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendPaymentDialog } from "@/components/wallet/SendPaymentDialog";
import { ARC_NETWORK } from "@/config/arc-network";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useToast } from "@/hooks/use-toast";
import { formatUnits } from "viem";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://arc-agent-pay-backend.onrender.com'

type StatusFilter = "all" | "confirmed" | "pending" | "failed";

interface BackendTx {
  id: string;
  agent_id: string;
  from_address: string;
  to_address: string;
  amount: number;
  status: string;
  tx_hash: string;
  type: string;
  created_at: string;
  error_message: string | null;
  agents?: { name: string };
}

export default function ActivityFeed() {
  const { address, isConnected, isOnArcTestnet } = useWallet();
  const { transactions, clearAll } = useTransactions(address);
  const { toast } = useToast();
  const [sendOpen, setSendOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [backendTxs, setBackendTxs] = useState<BackendTx[]>([]);
  const [loadingBackend, setLoadingBackend] = useState(false);

  const ownerKey = address ? address.toLowerCase() : null;

  const fetchBackendTxs = async () => {
    if (!ownerKey) {
      setBackendTxs([]);
      return;
    }
    try {
      setLoadingBackend(true);
      const res = await fetch(`${BACKEND_URL}/api/transactions?owner=${ownerKey}`);
      if (res.ok) {
        const data = await res.json();
        setBackendTxs(data);
      }
    } catch {}
    finally { setLoadingBackend(false); }
  };

  useEffect(() => {
    fetchBackendTxs();
  }, [ownerKey]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  const filtered = transactions.filter((tx) => {
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || tx.hash.toLowerCase().includes(q) || tx.toAddress.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const filteredBackend = backendTxs.filter((tx) => {
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "confirmed" && tx.status === "success") ||
      (statusFilter === "failed" && tx.status === "failed") ||
      (statusFilter === "pending" && tx.status === "pending");
    const q = search.toLowerCase();
    const matchesSearch = !q || (tx.tx_hash || '').toLowerCase().includes(q) || tx.to_address.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const confirmedCount = transactions.filter((t) => t.status === "confirmed").length + backendTxs.filter(t => t.status === "success").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length + backendTxs.filter(t => t.status === "pending").length;
  const failedCount = transactions.filter((t) => t.status === "failed").length + backendTxs.filter(t => t.status === "failed").length;
  const totalCount = transactions.length + backendTxs.length;

  const copyTx = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({ title: "Copied", description: "Transaction hash copied." });
  };

  return (
    <AppLayout>
      <div className="space-y-7 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">Transaction Feed</h1>
            <div className="h-1 w-16 bg-indigo-500 rounded-full mb-3"></div>
            <p className="text-white/40 text-sm">All on-chain USDC payments sent through Arc Agent Pay.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBackendTxs}
              className="text-white/40 hover:text-white hover:bg-white/10 rounded-full h-9 px-4 text-xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loadingBackend && "animate-spin")} /> Refresh
            </Button>
            {isConnected && isOnArcTestnet && (
              <Button
                onClick={() => setSendOpen(true)}
                size="sm"
                className="rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white h-9 px-5 text-sm font-semibold"
              >
                <Send className="w-3.5 h-3.5 mr-2" /> Send
              </Button>
            )}
          </div>
        </div>

        {!isConnected ? (
          <div className="glass-panel-elevated rounded-2xl p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-indigo-400/50" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Connect your wallet</h2>
            <p className="text-white/40 text-sm mb-6">Link MetaMask to view your transaction history.</p>
            <WalletButton />
          </div>
        ) : (
          <>
            {totalCount > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { label: "All", count: totalCount, filter: "all" as StatusFilter },
                  { label: "Confirmed", count: confirmedCount, filter: "confirmed" as StatusFilter },
                  { label: "Pending", count: pendingCount, filter: "pending" as StatusFilter },
                  { label: "Failed", count: failedCount, filter: "failed" as StatusFilter },
                ].map((s) => (
                  <button
                    key={s.filter}
                    onClick={() => setStatusFilter(s.filter)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                      statusFilter === s.filter
                        ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                        : "glass-panel text-white/40 hover:text-white/70 border border-white/[0.06]"
                    )}
                  >
                    {s.label}
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/10">
                      {s.count}
                    </span>
                  </button>
                ))}
                <div className="relative ml-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <Input
                    placeholder="Search hash, address…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 glass-panel border-white/[0.08] text-white text-sm h-9 rounded-full w-60 focus-visible:ring-indigo-500/40"
                  />
                </div>
              </div>
            )}

            {totalCount === 0 ? (
              <div className="glass-panel-elevated rounded-2xl p-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Send className="w-7 h-7 text-indigo-400/50" />
                </div>
                <h2 className="text-white font-bold text-xl mb-2">No transactions yet</h2>
                <p className="text-white/40 text-sm mb-6">Send your first USDC payment on Arc Testnet and it will appear here.</p>
                {isOnArcTestnet && (
                  <Button onClick={() => setSendOpen(true)} className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl px-8 h-11">
                    <Send className="w-4 h-4 mr-2" /> Send First Payment
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative pl-8 sm:pl-12">
                <div className="absolute left-[15px] sm:left-[23px] top-0 bottom-0 w-px bg-indigo-500/20" />
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

                  {filteredBackend.map((tx) => (
                    <motion.div key={`backend-${tx.id}`} variants={item} className="relative">
                      <div className={cn(
                        "absolute -left-[35px] sm:-left-[43px] top-5 w-4 h-4 rounded-full border-2 border-background",
                        tx.status === "success" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" :
                        tx.status === "pending" ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                      )} />
                      <div className="glass-panel-elevated p-5 rounded-2xl hover:border-indigo-500/20 transition-all">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
                              tx.status === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              tx.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}>
                              {tx.status === "success" ? <CheckCircle2 className="w-5 h-5" /> :
                               tx.status === "pending" ? <Clock className="w-5 h-5" /> :
                               <XCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="font-bold text-white text-base mb-1">
                                <span className="text-cyan-300">{tx.agents?.name || "Auto Payment"}</span>
                                <Badge variant="outline" className="ml-2 text-[9px] text-cyan-400 border-cyan-400/20 bg-cyan-400/10">SCHEDULED</Badge>
                              </div>
                              <div className="text-xs text-white/40 mb-1 font-mono">
                                To: {truncateAddress(tx.to_address)}
                              </div>
                              <div className="text-[11px] text-white/25 flex items-center gap-2">
                                {new Date(tx.created_at).toLocaleString()}
                                {tx.tx_hash && (
                                  <a href={`${ARC_NETWORK.explorerUrl}/tx/${tx.tx_hash}`} target="_blank" rel="noreferrer"
                                    className="text-indigo-400/70 hover:text-indigo-400 transition-colors font-semibold flex items-center gap-1">
                                    ArcScan <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="font-mono font-black text-white text-2xl">-{tx.amount} USDC</div>
                            <Badge variant="outline" className={cn(
                              "text-[10px] uppercase font-bold",
                              tx.status === "success" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10" :
                              tx.status === "pending" ? "text-amber-400 border-amber-400/20 bg-amber-400/10" :
                              "text-rose-400 border-rose-400/20 bg-rose-400/10"
                            )}>{tx.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {filtered.map((tx) => {
                    let usdcAmount = 0;
                    try { usdcAmount = parseFloat(formatUnits(BigInt(tx.amount), 18)); } catch {}
                    return (
                      <motion.div key={tx.id} variants={item} className="relative">
                        <div className={cn(
                          "absolute -left-[35px] sm:-left-[43px] top-5 w-4 h-4 rounded-full border-2 border-background",
                          tx.status === "confirmed" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" :
                          tx.status === "pending" ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                        )} />
                        <div className="glass-panel-elevated p-5 rounded-2xl hover:border-indigo-500/20 transition-all">
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
                                tx.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                tx.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              )}>
                                {tx.status === "confirmed" ? <CheckCircle2 className="w-5 h-5" /> :
                                 tx.status === "pending" ? <Clock className="w-5 h-5" /> :
                                 <XCircle className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="font-bold text-white text-base mb-1">
                                  {tx.agentName ? <span className="text-indigo-300">{tx.agentName}</span> : <span className="text-white/70">Direct Payment</span>}
                                </div>
                                <div className="text-xs text-white/40 mb-1 font-mono">To: {truncateAddress(tx.toAddress)}</div>
                                <div className="text-[11px] text-white/25 flex items-center gap-2">
                                  {new Date(tx.timestamp).toLocaleString()}
                                  <a href={`${ARC_NETWORK.explorerUrl}/tx/${tx.hash}`} target="_blank" rel="noreferrer"
                                    className="text-indigo-400/70 hover:text-indigo-400 transition-colors font-semibold flex items-center gap-1">
                                    ArcScan <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="font-mono font-black text-white text-2xl">-{formatUSDC(usdcAmount)}</div>
                              <Badge variant="outline" className={cn(
                                "text-[10px] uppercase font-bold",
                                tx.status === "confirmed" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10" :
                                tx.status === "pending" ? "text-amber-400 border-amber-400/20 bg-amber-400/10" :
                                "text-rose-400 border-rose-400/20 bg-rose-400/10"
                              )}>{tx.status}</Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
      <SendPaymentDialog open={sendOpen} onClose={() => setSendOpen(false)} />
    </AppLayout>
  );
}
