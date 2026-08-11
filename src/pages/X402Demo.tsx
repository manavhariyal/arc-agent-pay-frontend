import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, CheckCircle2, XCircle, Loader2, Coins, Lock, Unlock, Wallet, PlusCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://arc-agent-pay-backend.onrender.com";
const LOW_BALANCE_THRESHOLD = 0.01; // USDC

type DemoResult = {
  success: boolean;
  buyerAddress: string;
  data: {
    metal: string;
    price_usd_per_oz: string;
    price_source: "live" | "estimate";
    timestamp: string;
  };
  amountPaid: string;
  formattedAmount: string;
  transferId: string;
};

type SettlementInfo = {
  status: string;
  txHash: string | null;
  settled: boolean;
  explorerUrl: string | null;
};

type BalanceInfo = {
  buyerAddress: string;
  gatewayAvailable: string;
  walletBalance: string;
};

export default function X402Demo() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLowBalance, setIsLowBalance] = useState(false);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);
  const [settlement, setSettlement] = useState<SettlementInfo | null>(null);
  const [settlementChecking, setSettlementChecking] = useState(false);

  const pollSettlement = useCallback(async (transferId: string) => {
    setSettlementChecking(true);
    setSettlement(null);
    // Gateway settles batches on its own cadence, not instantly — poll for
    // a couple minutes before falling back to a manual "check again" button.
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/x402-demo/settlement/${transferId}`);
        const json: SettlementInfo = await res.json();
        setSettlement(json);
        if (json.settled) break;
      } catch {
        // keep trying — a single failed check isn't worth surfacing as an error
      }
      await new Promise((r) => setTimeout(r, 8000));
    }
    setSettlementChecking(false);
  }, []);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/x402-demo/buyer-balance`);
      const json = await res.json();
      if (res.ok) setBalance(json);
    } catch {
      // silent — balance display is a nice-to-have, not critical
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const runDemo = async () => {
    setState("loading");
    setError(null);
    setResult(null);
    setIsLowBalance(false);
    setSettlement(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/x402-demo/fetch-gold-price`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setIsLowBalance(!!json.lowBalance);
        throw new Error(json.error || "Something went wrong");
      }
      setResult(json);
      setState("success");
      fetchBalance();
      pollSettlement(json.transferId);
    } catch (err: any) {
      setError(err.message || "Request failed");
      setState("error");
    }
  };

  const topUp = async () => {
    setToppingUp(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/x402-demo/setup-buyer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: "1" }),
      });
      if (res.ok) {
        await fetchBalance();
        setState("idle");
        setError(null);
        setIsLowBalance(false);
      }
    } catch {
      // leave state as-is; the balance display will still reflect reality on next refresh
    } finally {
      setToppingUp(false);
    }
  };

  const gatewayAvailableNum = balance ? parseFloat(balance.gatewayAvailable) : null;
  const showLowBalanceWarning = gatewayAvailableNum !== null && gatewayAvailableNum < LOW_BALANCE_THRESHOLD;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "rgba(165,180,252,0.9)" }}>
            <Zap className="w-3 h-3" /> x402 · Live on Arc Testnet
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">Autonomous Micropayments</h1>
          <div className="h-1 w-16 bg-indigo-500 rounded-full mb-4"></div>
          <p className="text-white/40 text-sm leading-relaxed max-w-xl">
            This is a real, live paywalled API endpoint. Click below and a dedicated agent wallet will
            automatically discover the paywall, pay $0.001 USDC through Circle's Gateway, and fetch the
            real, current gold price — no manual signing, no approval clicks, all in one request.
          </p>
        </div>

        {/* Buyer wallet balance */}
        <div className="glass-panel rounded-xl px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 text-sm">
            <Wallet className="w-4 h-4 text-white/30" />
            <span className="text-white/40">Demo buyer wallet balance:</span>
            {balanceLoading ? (
              <span className="text-white/20">…</span>
            ) : balance ? (
              <span className={showLowBalanceWarning ? "text-amber-400 font-mono font-bold" : "text-cyan-400 font-mono font-bold"}>
                {balance.gatewayAvailable} USDC
              </span>
            ) : (
              <span className="text-white/20">—</span>
            )}
            {balance && (
              <span className="text-white/20 text-xs font-mono hidden sm:inline">
                ({truncateAddress(balance.buyerAddress)})
              </span>
            )}
          </div>
          {(showLowBalanceWarning || isLowBalance) && (
            <Button
              onClick={topUp}
              disabled={toppingUp}
              size="sm"
              variant="outline"
              className="h-8 rounded-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs"
            >
              {toppingUp ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <PlusCircle className="w-3 h-3 mr-1.5" />}
              Top up $1
            </Button>
          )}
        </div>

        {/* Flow diagram */}
        <div className="glass-panel-elevated rounded-2xl p-6">
          <div className="flex items-center justify-between gap-2 text-center">
            <div className="flex-1">
              <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-xs text-white/50 font-medium">Agent requests<br />gold price data</div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/15 shrink-0" />
            <div className="flex-1">
              <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-xs text-white/50 font-medium">Server replies<br />"$0.001 required"</div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/15 shrink-0" />
            <div className="flex-1">
              <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-xs text-white/50 font-medium">Agent auto-pays<br />via Circle Gateway</div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/15 shrink-0" />
            <div className="flex-1">
              <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Unlock className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-xs text-white/50 font-medium">Real data<br />unlocked</div>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="glass-panel-elevated rounded-2xl p-8 text-center">
          <Button
            onClick={runDemo}
            disabled={state === "loading"}
            className="h-12 px-8 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-60"
          >
            {state === "loading" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Paying & fetching…</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" /> Auto-Pay & Fetch Gold Price ($0.001)</>
            )}
          </Button>

          <AnimatePresence mode="wait">
            {state === "success" && result && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-left rounded-xl p-5"
                style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Payment settled & resource unlocked
                  </div>
                  {result.data.price_source && (
                    <span className={
                      "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full " +
                      (result.data.price_source === "live"
                        ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20"
                        : "text-amber-400 bg-amber-400/10 border border-amber-400/20")
                    }>
                      {result.data.price_source === "live" ? "Live market data" : "Estimated"}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-white/30 text-xs uppercase tracking-wider mb-1">Gold Price</div>
                    <div className="text-white font-bold text-lg">${result.data.price_usd_per_oz} / oz</div>
                  </div>
                  <div>
                    <div className="text-white/30 text-xs uppercase tracking-wider mb-1">Amount Paid</div>
                    <div className="text-cyan-400 font-mono font-bold">{result.formattedAmount} USDC</div>
                  </div>
                  <div>
                    <div className="text-white/30 text-xs uppercase tracking-wider mb-1">Buyer Wallet</div>
                    <div className="text-white/60 font-mono text-xs">{truncateAddress(result.buyerAddress)}</div>
                  </div>
                  <div>
                    <div className="text-white/30 text-xs uppercase tracking-wider mb-1">Fetched At</div>
                    <div className="text-white/60 text-xs">{new Date(result.data.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="text-white/30 text-xs uppercase tracking-wider mb-1.5">Onchain Proof</div>
                  {settlement?.settled && settlement.explorerUrl ? (
                    <a
                      href={settlement.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-mono transition-colors"
                    >
                      View settlement on ArcScan <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : settlementChecking ? (
                    <div className="flex items-center gap-1.5 text-white/30 text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" /> Waiting for Gateway batch to settle onchain…
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-white/20 text-xs">Not yet settled — Gateway batches payments periodically, this can take a few minutes.</div>
                      <button
                        onClick={() => pollSettlement(result.transferId)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline decoration-dotted"
                      >
                        Check again
                      </button>
                    </div>
                  )}
                  <div className="text-white/15 text-[10px] mt-1">
                    Multiple payments may share one settlement hash — that's how batching keeps fees near zero.
                  </div>
                </div>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-left rounded-xl p-5"
                style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}
              >
                <div className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-rose-400 font-semibold text-sm mb-1">
                      {isLowBalance ? "Buyer wallet needs a top-up" : "Payment failed"}
                    </div>
                    <div className="text-white/40 text-xs">{error}</div>
                  </div>
                </div>
                {isLowBalance && (
                  <Button
                    onClick={topUp}
                    disabled={toppingUp}
                    size="sm"
                    className="mt-3 h-8 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs border border-amber-500/30"
                  >
                    {toppingUp ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <PlusCircle className="w-3 h-3 mr-1.5" />}
                    Top up $1 & retry
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-white/20 text-xs">
          Powered by Circle Gateway on Arc Testnet · Chain 5042002
        </p>
      </div>
    </AppLayout>
  );
}
