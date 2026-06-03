import { useState } from "react";
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

type StatusFilter = "all" | "confirmed" | "pending" | "failed";

export default function ActivityFeed() {
  const { address, isConnected, isOnArcTestnet } = useWallet();
  const { transactions, clearAll } = useTransactions(address);
  const { toast } = useToast();
  const [sendOpen, setSendOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

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
    const matchesSearch =
      !q ||
      tx.hash.toLowerCase().includes(q) ||
      tx.toAddress.toLowerCase().includes(q) ||
      (tx.agentName?.toLowerCase().includes(q) ?? false) ||
      (tx.note?.toLowerCase().includes(q) ?? false);
    return matchesStatus && matchesSearch;
  });

  const confirmedCount = transactions.filter((t) => t.status === "confirmed").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const failedCount = transactions.filter((t) => t.status === "failed").length;

  const copyTx = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({ title: "Copied", description: "Transaction hash copied." });
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Date", "Hash", "From", "To", "Amount (USDC)", "Agent", "Note", "Status"];
    const rows = transactions.map((tx) => {
      let amount = "0";
      try { amount = formatUnits(BigInt(tx.amount), 18); } catch {}
      return [
        new Date(tx.timestamp).toISOString(),
        tx.hash,
        tx.fromAddress,
        tx.toAddress,
        amount,
        tx.agentName ?? "",
        tx.note ?? "",
        tx.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arc-agent-pay-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${transactions.length} transactions downloaded as CSV.` });
  };

  return (
    <AppLayout>
      <div className="space-y-7 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">Transaction Feed</h1>
            <div className="h-1 w-16 bg-indigo-500 rounded-full mb-3"></div>
            <p className="text-white/40 text-sm">All on-chain USDC payments sent through Arc Agent Pay.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {transactions.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportCSV}
                  className="text-white/40 hover:text-white hover:bg-white/10 rounded-full h-9 px-4 text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-full h-9 px-4 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" /> Clear
                </Button>
              </>
            )}
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
            {/* Stats bar */}
            {transactions.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { label: "All", count: transactions.length, filter: "all" as StatusFilter, color: "indigo" },
                  { label: "Confirmed", count: confirmedCount, filter: "confirmed" as StatusFilter, color: "emerald" },
                  { label: "Pending", count: pendingCount, filter: "pending" as StatusFilter, color: "amber" },
                  { label: "Failed", count: failedCount, filter: "failed" as StatusFilter, color: "rose" },
                ].map((s) => (
                  <button
                    key={s.filter}
                    onClick={() => setStatusFilter(s.filter)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                      statusFilter === s.filter
                        ? `bg-${s.color}-500/20 border border-${s.color}-500/40 text-${s.color}-300`
                        : "glass-panel text-white/40 hover:text-white/70 border border-white/[0.06]"
                    )}
                  >
                    {s.label}
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                        statusFilter === s.filter ? `bg-${s.color}-500/30` : "bg-white/10"
                      )}
                    >
                      {s.count}
                    </span>
                  </button>
                ))}

                <div className="relative ml-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <Input
                    placeholder="Search hash, address, agent…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 glass-panel border-white/[0.08] text-white text-sm h-9 rounded-full w-60 focus-visible:ring-indigo-500/40"
                  />
                </div>
              </div>
            )}

            {transactions.length === 0 ? (
              <div className="glass-panel-elevated rounded-2xl p-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Send className="w-7 h-7 text-indigo-400/50" />
                </div>
                <h2 className="text-white font-bold text-xl mb-2">No transactions yet</h2>
                <p className="text-white/40 text-sm mb-6">
                  Send your first USDC payment on Arc Testnet and it will appear here.
                </p>
                {isOnArcTestnet && (
                  <Button
                    onClick={() => setSendOpen(true)}
                    className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl px-8 h-11"
                  >
                    <Send className="w-4 h-4 mr-2" /> Send First Payment
                  </Button>
                )}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-panel-elevated rounded-2xl p-10 text-center">
                <Search className="w-8 h-8 mx-auto mb-3 text-white/20" />
                <p className="text-white/40">No transactions match your filter.</p>
                <button
                  onClick={() => { setStatusFilter("all"); setSearch(""); }}
                  className="mt-2 text-indigo-400 hover:text-cyan-400 text-sm transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="relative pl-8 sm:pl-12">
                <div className="absolute left-[15px] sm:left-[23px] top-0 bottom-0 w-px bg-indigo-500/20" />
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
                  {filtered.map((tx) => {
                    let usdcAmount = 0;
                    try { usdcAmount = parseFloat(formatUnits(BigInt(tx.amount), 18)); } catch {}

                    return (
                      <motion.div key={tx.id} variants={item} className="relative">
                        <div
                          className={cn(
                            "absolute -left-[35px] sm:-left-[43px] top-5 w-4 h-4 rounded-full border-2 border-background",
                            tx.status === "confirmed"
                              ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                              : tx.status === "pending"
                              ? "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                              : "bg-rose-500"
                          )}
                        />
                        <div className="glass-panel-elevated p-5 rounded-2xl hover:border-indigo-500/20 transition-all">
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div
                                className={cn(
                                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
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
                                  <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: "3s" }} />
                                ) : (
                                  <XCircle className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white text-base mb-1">
                                  {tx.agentName ? (
                                    <span className="text-indigo-300">{tx.agentName}</span>
                                  ) : (
                                    <span className="text-white/70">Direct Payment</span>
                                  )}
                                </div>
                                <div className="text-xs text-white/40 mb-1 flex items-center gap-2 font-mono">
                                  To: {truncateAddress(tx.toAddress)}
                                  <button
                                    onClick={() => copyTx(tx.toAddress)}
                                    className="text-white/20 hover:text-white/50 transition-colors"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <a
                                    href={`${ARC_NETWORK.explorerUrl}/address/${tx.toAddress}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-400/50 hover:text-indigo-400 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                                {tx.note && (
                                  <div className="text-xs text-white/30 italic mb-1">"{tx.note}"</div>
                                )}
                                <div className="text-[11px] text-white/25 flex items-center gap-2 flex-wrap">
                                  {new Date(tx.timestamp).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  <span className="w-1 h-1 rounded-full bg-white/20" />
                                  <button
                                    onClick={() => copyTx(tx.hash)}
                                    className="font-mono text-white/20 hover:text-white/50 transition-colors flex items-center gap-1"
                                  >
                                    {tx.hash.slice(0, 14)}… <Copy className="w-2.5 h-2.5" />
                                  </button>
                                  <a
                                    href={`${ARC_NETWORK.explorerUrl}/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-400/70 hover:text-indigo-400 transition-colors font-semibold flex items-center gap-1"
                                  >
                                    ArcScan <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 pt-3 sm:pt-0 border-t sm:border-0 border-white/[0.05]">
                              <div className="font-mono font-black text-white text-2xl">
                                -{formatUSDC(usdcAmount)}
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] uppercase font-bold tracking-wider",
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
