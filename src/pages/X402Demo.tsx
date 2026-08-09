import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, CheckCircle2, XCircle, Loader2, Coins, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://arc-agent-pay-backend.onrender.com";

type DemoResult = {
  success: boolean;
  buyerAddress: string;
  data: {
    metal: string;
    price_usd_per_oz: string;
    timestamp: string;
  };
  amountPaid: string;
  formattedAmount: string;
  transaction: string;
};

export default function X402Demo() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDemo = async () => {
    setState("loading");
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/x402-demo/fetch-gold-price`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Something went wrong");
      }
      setResult(json);
      setState("success");
    } catch (err: any) {
      setError(err.message || "Request failed");
      setState("error");
    }
  };

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
            real data — no manual signing, no approval clicks, all in one request.
          </p>
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
                <div className="flex items-center gap-2 mb-4 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Payment settled & resource unlocked
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
              </motion.div>
            )}

            {state === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-left rounded-xl p-5 flex items-start gap-3"
                style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}
              >
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-rose-400 font-semibold text-sm mb-1">Payment failed</div>
                  <div className="text-white/40 text-xs">{error}</div>
                </div>
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
