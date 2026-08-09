import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, GitMerge, Activity, BarChart3, Send, ListChecks, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { WalletButton } from "@/components/wallet/WalletButton";
import { SendPaymentDialog } from "@/components/wallet/SendPaymentDialog";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { useBlockNumber } from "wagmi";
import { arcTestnet } from "@/config/arc-network";
import { useWallet } from "@/hooks/useWallet";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const [sendOpen, setSendOpen] = useState(false);
  const { isConnected, isOnArcTestnet } = useWallet();

  const { data: blockNumber } = useBlockNumber({
    watch: true,
    chainId: arcTestnet.id,
    query: { enabled: isConnected && isOnArcTestnet },
  });

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/agents", label: "Agents", icon: Users },
    { href: "/rules", label: "Rules", icon: GitMerge },
    { href: "/multi-send", label: "Multi-Send", icon: ListChecks },
    { href: "/activity", label: "Activity", icon: Activity },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/x402-demo", label: "x402 Demo", icon: Zap },
  ];

  return (
    <>
      <div className="w-full h-full flex flex-col">
        {/* Brand */}
        <div className="px-4 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <img
            src="/arc-logo.png"
            alt="Arc Agent Pay"
            className="h-8 w-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.35))' }}
          />
        </div>

        {/* Quick Send */}
        {isConnected && isOnArcTestnet && (
          <div className="px-3 pt-4 pb-2">
            <button
              onClick={() => setSendOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(6,182,212,0.85) 100%)",
                boxShadow: "0 0 20px rgba(99,102,241,0.2)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(99,102,241,0.35)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(99,102,241,0.2)"; }}
            >
              <Send className="w-3.5 h-3.5" /> Quick Send
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {links.map(link => {
            const isActive = location === link.href || location.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="block" onClick={onNavigate}>
                <motion.div
                  whileHover={{ x: 1 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer",
                    isActive
                      ? "text-white"
                      : "text-white/35 hover:text-white/70 hover:bg-white/[0.03]"
                  )}
                  style={isActive ? {
                    background: "rgba(99,102,241,0.1)",
                    borderLeft: "2px solid rgba(99,102,241,0.8)",
                  } : {
                    borderLeft: "2px solid transparent",
                  }}
                >
                  <Icon className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-indigo-400" : "text-white/25"
                  )} />
                  <span className="font-medium text-sm tracking-tight">{link.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <WalletButton compact />

          {/* Network indicator */}
          <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-[10px] uppercase tracking-[0.15em] text-white/25 mb-1.5 font-semibold">Network</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }} />
                </span>
                <span className="text-xs font-medium text-white/60">Arc Testnet</span>
              </div>
              <span className="text-[10px] font-mono text-white/20">5042002</span>
            </div>
            {blockNumber !== undefined && (
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-white/20 uppercase tracking-wider">Block</span>
                <span className="text-[10px] font-mono font-bold text-cyan-400/60">#{blockNumber.toString()}</span>
              </div>
            )}
          </div>

          <CreatorCard variant="compact" />
        </div>
      </div>

      <SendPaymentDialog open={sendOpen} onClose={() => setSendOpen(false)} />
    </>
  );
}

export function Sidebar() {
  return (
    <div
      className="hidden md:flex w-64 h-screen flex-col fixed left-0 top-0 z-40"
      style={{
        background: "rgba(9,11,18,0.97)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(24px)",
      }}
    >
      <SidebarContent />
    </div>
  );
}

export { SidebarContent };
