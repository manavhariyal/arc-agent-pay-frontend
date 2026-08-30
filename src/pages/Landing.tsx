import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Globe, Send, BarChart3, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorCard } from "@/components/creator/CreatorCard";

const features = [
  { icon: Send, title: "Real On-Chain Payments", desc: "Native USDC on Arc Testnet via MetaMask. Every transaction is verifiable on ArcScan.", accent: "indigo" },
  { icon: Users, title: "Agent Registry", desc: "Register wallet addresses as named agents. View live balances, fund directly.", accent: "violet" },
  { icon: Shield, title: "Spending Rules", desc: "Create recurring or one-time rules per agent — daily limits, oracle payments.", accent: "cyan" },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Volume charts and agent-level breakdowns from your actual on-chain history.", accent: "emerald" },
  { icon: Zap, title: "Auto-Confirm Polling", desc: "Pending transactions auto-confirm every 5 seconds. No manual refresh.", accent: "amber" },
  { icon: Globe, title: "Multi-Send Batch", desc: "Queue multiple recipients and execute batch USDC payments in sequence.", accent: "sky" },
];

const accentMap: Record<string, string> = {
  indigo: "text-[#3AB4FF] bg-[#0A84FF]/8 border-[#0A84FF]/15",
  violet: "text-[#3AB4FF] bg-[#0A84FF]/8 border-[#0A84FF]/15",
  cyan: "text-[#22F0FF] bg-[#05D8EA]/8 border-[#05D8EA]/15",
  emerald: "text-emerald-400 bg-emerald-500/8 border-emerald-500/15",
  amber: "text-amber-400 bg-amber-500/8 border-amber-500/15",
  sky: "text-sky-400 bg-sky-500/8 border-sky-500/15",
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col noise-overlay">
      {/* Background: subtle radial + dot grid */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid" />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(ellipse, rgba(10,132,255,0.18) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-[-5%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(34,240,255,0.15) 0%, transparent 70%)" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img src="/arc-logo.png" alt="Arc Agent Pay" className="h-10 w-auto" style={{ filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.35))' }} />
        </div>
        <div className="flex items-center gap-3">
          <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer"
            className="text-sm text-white/40 hover:text-white/70 transition-colors font-medium hidden sm:block">
            ArcScan
          </a>
          <Link href="/dashboard">
            <Button className="bg-white text-gray-950 hover:bg-white/90 rounded-full px-5 h-9 text-sm font-semibold shadow-none">
              Launch App <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-20 text-center">

        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "rgba(52,211,153,0.9)" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            Live on Arc Testnet · Chain 5042002 · Native USDC
          </div>
        </motion.div>

        {/* Logo + live architecture visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 flex flex-col items-center"
        >
          <img
            src="/arc-logo.png"
            alt="Arc Agent Pay"
            className="w-28 h-28 md:w-32 md:h-32 object-contain mx-auto mb-8"
            style={{ filter: 'drop-shadow(0 0 30px rgba(10,132,255,0.5)) drop-shadow(0 0 60px rgba(34,240,255,0.25))' }}
          />

          {/* Real architecture flow: agent -> DCW wallet -> onchain settlement */}
          <div className="flex items-center gap-3 sm:gap-5 px-4">
            {[
              { label: "AI Agent", sub: "signs intent" },
              { label: "Circle DCW", sub: "wallet policy" },
              { label: "Arc Settlement", sub: "USDC · ArcScan" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3 sm:gap-5">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center relative"
                    style={{
                      background: "rgba(12,14,22,0.9)",
                      border: "1px solid rgba(10,132,255,0.25)",
                      boxShadow: "0 0 20px rgba(10,132,255,0.15)",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full absolute"
                      style={{ background: "#22F0FF", boxShadow: "0 0 8px #22F0FF" }}
                    />
                    <span className="text-[10px] font-mono text-white/50">{i + 1}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-white/80 whitespace-nowrap">{step.label}</div>
                    <div className="text-[10px] text-white/30 font-mono whitespace-nowrap">{step.sub}</div>
                  </div>
                </div>
                {i < 2 && (
                  <div className="relative w-8 sm:w-12 h-px mt-[-20px]" style={{ background: "linear-gradient(90deg, rgba(10,132,255,0.5), rgba(34,240,255,0.5))" }}>
                    <motion.span
                      className="absolute -top-[3px] w-[7px] h-[7px] rounded-full"
                      style={{ background: "#3AB4FF", boxShadow: "0 0 8px #3AB4FF" }}
                      animate={{ left: ["0%", "100%"] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.04] mb-6"
            style={{ letterSpacing: '-0.03em' }}>
            Payments infrastructure<br />
            <span style={{ background: "linear-gradient(135deg, #3AB4FF 0%, #22F0FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              for autonomous agents
            </span>
          </h1>

          <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed font-normal mb-10">
            Fund, monitor, and control your AI agent swarm on Arc Testnet.
            Real on-chain USDC · live balance alerts · multi-send · zero mocks.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 rounded-full bg-[#0B3FD1] hover:bg-[#0A84FF] text-white font-semibold text-sm shadow-[0_0_32px_rgba(10,132,255,0.35)] hover:shadow-[0_0_40px_rgba(10,132,255,0.5)] transition-all">
                Launch Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer">
              <Button size="lg" variant="ghost"
                className="h-12 px-7 rounded-full text-white/40 hover:text-white hover:bg-white/[0.05] font-semibold text-sm transition-all">
                View Explorer
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-px h-16 mt-20 mb-16 mx-auto"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)" }}
        />

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="w-full max-w-6xl mx-auto"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/25 font-semibold mb-10">What's inside</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
            style={{ background: "rgba(255,255,255,0.05)", borderRadius: "1.25rem", overflow: "hidden" }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              const cls = accentMap[f.accent];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                  className="p-7 text-left group hover:bg-white/[0.02] transition-colors"
                  style={{ background: "rgba(12,14,22,0.98)" }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-5 ${cls} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-[13px] text-white/35 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Creator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-3xl mx-auto mt-20"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/20 font-semibold mb-5 text-center">Built by</p>
          <CreatorCard variant="full" />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/20 text-xs">
            <img src="/arc-logo.png" alt="" className="h-5 w-auto" style={{ filter: 'brightness(1.2) opacity(0.5)' }} />
            Arc Agent Pay
          </div>
          <div className="flex items-center gap-1.5 text-white/20 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Arc Testnet · Chain 5042002 · Native USDC (18 decimals)
          </div>
        </div>
      </footer>
    </div>
  );
}
