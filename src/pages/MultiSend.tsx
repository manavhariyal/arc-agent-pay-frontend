import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAgents } from "@/hooks/useAgents";
import { useTransactions } from "@/hooks/useTransactions";
import { useWallet } from "@/hooks/useWallet";
import { formatUSDC, truncateAddress, cn } from "@/lib/utils";
import { arcTestnet, ARC_NETWORK } from "@/config/arc-network";
import { motion, AnimatePresence } from "framer-motion";
import { useSendTransaction } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  Plus, Trash2, Send, CheckCircle2, XCircle, Clock, Loader2,
  Wallet, AlertTriangle, ExternalLink, ListChecks, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/wallet/WalletButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type QueueStatus = "queued" | "waiting" | "broadcasting" | "confirmed" | "failed";

interface QueueItem {
  id: string;
  address: string;
  amount: string;
  agentId?: string;
  agentName?: string;
  note?: string;
  status: QueueStatus;
  hash?: string;
  errorMsg?: string;
}

const isValidAddress = (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr);

export default function MultiSend() {
  const { address, isConnected, isOnArcTestnet, formattedBalance } = useWallet();
  const { agents } = useAgents();
  const { addTransaction } = useTransactions();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const queueRef = useRef<QueueItem[]>([]);

  const [isRunning, setIsRunning] = useState(false);
  const processingIdxRef = useRef(-1);

  // Form state
  const [form, setForm] = useState({ address: "", amount: "", agentId: "", note: "" });

  const { sendTransaction, data: hash, isPending, error: txError, reset } = useSendTransaction();

  // Mirror queue state to ref for effects
  const syncQueue = (updater: (prev: QueueItem[]) => QueueItem[]) => {
    setQueue(prev => {
      const next = updater(prev);
      queueRef.current = next;
      return next;
    });
  };

  // Watch for confirmed hash
  useEffect(() => {
    if (!hash) return;
    const idx = processingIdxRef.current;
    if (idx < 0) return;

    const item = queueRef.current[idx];
    if (!item) return;

    // Mark broadcasting
    syncQueue(q => q.map((it, i) => i === idx ? { ...it, status: "broadcasting", hash } : it));

    // Save to global transactions
    try {
      addTransaction({
        hash,
        fromAddress: address!,
        toAddress: item.address,
        amount: parseUnits(item.amount, 18).toString(),
        agentId: item.agentId,
        agentName: item.agentName,
        note: item.note,
        timestamp: Date.now(),
        status: "pending",
      });
    } catch {}

    reset();

    // Advance to next queued item
    const nextIdx = queueRef.current.findIndex((it, i) => i > idx && it.status === "queued");
    if (nextIdx > -1) {
      processItem(nextIdx);
    } else {
      setIsRunning(false);
      processingIdxRef.current = -1;
    }
  }, [hash]);

  // Watch for errors
  useEffect(() => {
    if (!txError) return;
    const idx = processingIdxRef.current;
    if (idx < 0) return;

    syncQueue(q =>
      q.map((it, i) =>
        i === idx
          ? { ...it, status: "failed", errorMsg: txError.message?.slice(0, 80) || "Rejected" }
          : it
      )
    );
    reset();
    setIsRunning(false);
    processingIdxRef.current = -1;
  }, [txError]);

  const processItem = (idx: number) => {
    const item = queueRef.current[idx];
    if (!item) return;
    processingIdxRef.current = idx;
    syncQueue(q => q.map((it, i) => i === idx ? { ...it, status: "waiting" } : it));
    sendTransaction({
      to: item.address as `0x${string}`,
      value: parseUnits(item.amount, 18),
      chainId: arcTestnet.id,
    });
  };

  const executeAll = () => {
    const firstQueued = queueRef.current.findIndex(it => it.status === "queued");
    if (firstQueued < 0) return;
    setIsRunning(true);
    processItem(firstQueued);
  };

  const addToQueue = () => {
    if (!isValidAddress(form.address) || parseFloat(form.amount) <= 0) return;
    const agent = agents.find(a => a.id === form.agentId);
    const item: QueueItem = {
      id: `q_${Date.now()}`,
      address: form.address,
      amount: form.amount,
      agentId: agent?.id,
      agentName: agent?.name,
      note: form.note || undefined,
      status: "queued",
    };
    syncQueue(q => [...q, item]);
    setForm({ address: "", amount: "", agentId: "", note: "" });
  };

  const removeItem = (id: string) => {
    syncQueue(q => q.filter(it => it.id !== id));
  };

  const clearQueue = () => {
    syncQueue(() => []);
    setIsRunning(false);
    processingIdxRef.current = -1;
    reset();
  };

  const totalAmount = queue.reduce((acc, it) => {
    try { return acc + parseFloat(it.amount); } catch { return acc; }
  }, 0);

  const queuedCount = queue.filter(it => it.status === "queued").length;
  const confirmedCount = queue.filter(it => it.status === "confirmed" || it.status === "broadcasting").length;
  const failedCount = queue.filter(it => it.status === "failed").length;
  const isDone = queue.length > 0 && queuedCount === 0 && !isRunning;

  const item = {
    hidden: { opacity: 0, x: -16 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
    exit: { opacity: 0, x: 16, transition: { duration: 0.15 } },
  };

  if (!isConnected) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-16 glass-panel-elevated rounded-2xl p-12 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-indigo-400/40" />
          <h2 className="text-white font-bold text-xl mb-2">Connect your wallet</h2>
          <p className="text-white/40 text-sm mb-6">Connect to Arc Testnet to use multi-send.</p>
          <WalletButton />
        </div>
      </AppLayout>
    );
  }

  if (!isOnArcTestnet) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-16 glass-panel-elevated rounded-2xl p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h2 className="text-white font-bold text-xl mb-2">Switch to Arc Testnet</h2>
          <p className="text-white/40 text-sm mb-6">Multi-send requires Arc Testnet (Chain 5042002).</p>
          <WalletButton />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20 flex items-center justify-center">
                <ListChecks className="w-6 h-6 text-indigo-400" />
              </div>
              Multi-Send
            </h1>
            <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full mb-3" />
            <p className="text-white/40 text-sm">Batch USDC payments to multiple addresses — MetaMask confirms each one sequentially.</p>
          </div>
          <div className="flex items-center gap-3 glass-panel px-4 py-2.5 rounded-xl border border-indigo-500/15">
            <Wallet className="w-4 h-4 text-indigo-400" />
            <span className="text-white/50 text-sm">Balance:</span>
            <span className="font-mono font-bold text-cyan-400">{formattedBalance ?? "…"} USDC</span>
          </div>
        </div>

        {/* Progress bar when running */}
        {queue.length > 0 && (
          <div className="glass-panel-elevated rounded-xl p-4 flex items-center gap-6">
            <div className="flex items-center gap-3 shrink-0">
              {isRunning ? (
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              ) : isDone ? (
                failedCount > 0 ? (
                  <XCircle className="w-5 h-5 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )
              ) : (
                <Zap className="w-5 h-5 text-white/30" />
              )}
              <span className="text-white font-bold">
                {isRunning
                  ? "Executing…"
                  : isDone
                  ? failedCount > 0
                    ? "Completed with errors"
                    : "All payments sent!"
                  : `${queue.length} payment${queue.length !== 1 ? "s" : ""} queued`}
              </span>
            </div>
            <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                animate={{
                  width: queue.length > 0
                    ? `${((confirmedCount + failedCount) / queue.length) * 100}%`
                    : "0%",
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex items-center gap-4 text-sm shrink-0">
              <span className="text-emerald-400 font-bold">{confirmedCount} sent</span>
              {failedCount > 0 && <span className="text-rose-400 font-bold">{failedCount} failed</span>}
              <span className="text-white/30">{queuedCount} remaining</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form — left 2 cols */}
          <div className="lg:col-span-2">
            <div className="glass-panel-elevated p-7 rounded-3xl sticky top-8 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> Add Recipient
              </h2>

              {agents.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Quick-select Agent</Label>
                  <Select
                    value={form.agentId}
                    onValueChange={v => {
                      const agent = agents.find(a => a.id === v);
                      setForm(f => ({ ...f, agentId: v, address: agent?.address ?? f.address }));
                    }}
                  >
                    <SelectTrigger className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl">
                      <SelectValue placeholder="Select agent…" />
                    </SelectTrigger>
                    <SelectContent className="glass-panel-elevated border-indigo-500/20 rounded-xl">
                      <SelectItem value="none" className="text-white/50 rounded-lg">No agent</SelectItem>
                      {agents.map(a => (
                        <SelectItem key={a.id} value={a.id} className="text-white rounded-lg">
                          {a.name} — {truncateAddress(a.address)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Recipient Address</Label>
                <Input
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="0x…"
                  className={cn(
                    "glass-panel border-indigo-500/20 text-white font-mono h-11 rounded-xl focus-visible:ring-indigo-500/40",
                    form.address && !isValidAddress(form.address) && "border-rose-500/40"
                  )}
                />
                {form.address && !isValidAddress(form.address) && (
                  <p className="text-rose-400 text-xs">Invalid address</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Amount (USDC)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.001"
                  className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl focus-visible:ring-indigo-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Note (optional)</Label>
                <Input
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="What's this for?"
                  className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl focus-visible:ring-indigo-500/40"
                />
              </div>

              <Button
                onClick={addToQueue}
                disabled={!isValidAddress(form.address) || parseFloat(form.amount) <= 0 || isRunning}
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold rounded-xl disabled:opacity-40"
              >
                <Plus className="w-4 h-4 mr-2" /> Add to Queue
              </Button>
            </div>
          </div>

          {/* Queue — right 3 cols */}
          <div className="lg:col-span-3 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Payment Queue{" "}
                {queue.length > 0 && (
                  <span className="text-white/30 font-normal text-sm ml-1">({queue.length})</span>
                )}
              </h2>
              {queue.length > 0 && !isRunning && (
                <button
                  onClick={clearQueue}
                  className="text-xs text-white/30 hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="glass-panel-elevated rounded-2xl p-14 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <ListChecks className="w-7 h-7 text-white/15" />
                </div>
                <h3 className="text-white font-bold mb-1">No payments queued</h3>
                <p className="text-white/30 text-sm">Add recipients on the left — they'll appear here before execution.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {queue.map((it, idx) => (
                      <motion.div
                        key={it.id}
                        variants={item}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        layout
                      >
                        <div
                          className={cn(
                            "glass-panel-elevated p-5 rounded-2xl flex items-center gap-4 transition-all",
                            it.status === "waiting" && "border border-indigo-500/40 shadow-[0_0_16px_rgba(99,102,241,0.2)]",
                            it.status === "broadcasting" && "border border-amber-500/30",
                            it.status === "confirmed" && "border border-emerald-500/20 opacity-70",
                            it.status === "failed" && "border border-rose-500/30"
                          )}
                        >
                          {/* Index */}
                          <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 text-xs font-bold shrink-0">
                            {idx + 1}
                          </div>

                          {/* Status icon */}
                          <div className="shrink-0">
                            {it.status === "queued" && <Clock className="w-5 h-5 text-white/25" />}
                            {it.status === "waiting" && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                            {it.status === "broadcasting" && <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />}
                            {it.status === "confirmed" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                            {it.status === "failed" && <XCircle className="w-5 h-5 text-rose-400" />}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {it.agentName && (
                                <span className="text-indigo-300 text-sm font-semibold">{it.agentName}</span>
                              )}
                              <span className="font-mono text-xs text-white/50 truncate">{truncateAddress(it.address)}</span>
                              {it.hash && (
                                <a
                                  href={`${ARC_NETWORK.explorerUrl}/tx/${it.hash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-400/50 hover:text-indigo-400 transition-colors shrink-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/30">
                              {it.note && <span className="italic">"{it.note}"</span>}
                              {it.errorMsg && <span className="text-rose-400/70">{it.errorMsg}</span>}
                              {it.status === "waiting" && <span className="text-indigo-400 animate-pulse">Waiting for MetaMask…</span>}
                              {it.status === "broadcasting" && <span className="text-amber-400 animate-pulse">Broadcasting…</span>}
                            </div>
                          </div>

                          {/* Amount + Remove */}
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono font-bold text-white text-base">
                              {formatUSDC(parseFloat(it.amount))}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase font-bold capitalize",
                                it.status === "queued" && "text-white/30 border-white/10",
                                it.status === "waiting" && "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
                                it.status === "broadcasting" && "text-amber-400 border-amber-400/30 bg-amber-400/10",
                                it.status === "confirmed" && "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
                                it.status === "failed" && "text-rose-400 border-rose-400/30 bg-rose-400/10"
                              )}
                            >
                              {it.status}
                            </Badge>
                            {it.status === "queued" && !isRunning && (
                              <button
                                onClick={() => removeItem(it.id)}
                                className="text-white/20 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Total + Execute */}
                <div className="glass-panel-elevated rounded-2xl p-5 border border-indigo-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Total to Send</div>
                      <div className="text-3xl font-black text-white">{formatUSDC(totalAmount)}</div>
                      <div className="text-xs text-white/30 mt-0.5">{queue.length} transactions · MetaMask confirms each</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Remaining Queue</div>
                      <div className="text-2xl font-bold text-cyan-400">{queuedCount}</div>
                    </div>
                  </div>

                  {isDone ? (
                    <div className={cn(
                      "w-full h-12 rounded-xl flex items-center justify-center font-bold",
                      failedCount > 0
                        ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                        : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    )}>
                      {failedCount > 0 ? (
                        <><XCircle className="w-5 h-5 mr-2" /> {confirmedCount} sent · {failedCount} failed</>
                      ) : (
                        <><CheckCircle2 className="w-5 h-5 mr-2" /> All {confirmedCount} payments submitted!</>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={executeAll}
                      disabled={isRunning || queuedCount === 0}
                      className="w-full h-12 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-black text-base rounded-xl shadow-[0_0_24px_rgba(99,102,241,0.4)] disabled:opacity-50"
                    >
                      {isRunning ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Executing…</>
                      ) : (
                        <><Send className="w-5 h-5 mr-2" /> Execute {queuedCount} Payment{queuedCount !== 1 ? "s" : ""}</>
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
