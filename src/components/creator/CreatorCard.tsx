import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Check } from "lucide-react";

const X_URL = "https://x.com/manavhariyal";
const DISCORD = "manavhariyal01";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.033.05a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function DiscordCopy({ small = false }: { small?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(DISCORD).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title="Click to copy Discord username"
      className={
        small
          ? "flex items-center gap-1 text-white/30 hover:text-indigo-300 transition-colors group/dc cursor-pointer"
          : "flex items-center gap-1 text-white/30 hover:text-indigo-300 transition-colors group/dc cursor-pointer"
      }
    >
      <DiscordIcon className={small ? "w-2.5 h-2.5 text-indigo-400/50 group-hover/dc:text-indigo-400 transition-colors" : "w-2.5 h-2.5 text-indigo-400/50 group-hover/dc:text-indigo-400 transition-colors"} />
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={small ? "text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5" : "text-xs text-emerald-400 font-semibold flex items-center gap-1"}
          >
            <Check className="w-2.5 h-2.5" /> Copied!
          </motion.span>
        ) : (
          <motion.span
            key="label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={small ? "text-[10px] underline-offset-2 group-hover/dc:underline" : "text-xs underline-offset-2 group-hover/dc:underline"}
          >
            {DISCORD}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

interface CreatorCardProps {
  variant?: "full" | "compact";
}

export function CreatorCard({ variant = "full" }: CreatorCardProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl glass-panel border border-indigo-500/15 hover:border-indigo-500/30 transition-all duration-300">
        <motion.a
          href={X_URL}
          target="_blank"
          rel="noreferrer"
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="relative shrink-0"
        >
          <img
            src="/creator-avatar.png"
            alt="@manavhariyal"
            className="w-10 h-10 rounded-full border-2 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.4)] object-cover"
          />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black border border-indigo-500/40 flex items-center justify-center">
            <XIcon className="w-2 h-2 text-white" />
          </span>
        </motion.a>
        <div className="flex-1 min-w-0 space-y-0.5">
          <a
            href={X_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-white text-xs font-bold hover:text-indigo-300 transition-colors"
          >
            <XIcon className="w-2.5 h-2.5 text-white/50 shrink-0" />
            @manavhariyal
          </a>
          <DiscordCopy small />
          <div className="text-white/20 text-[9px]">Learning. Building. Shipping.</div>
        </div>
        <a
          href={X_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-bold text-indigo-400 hover:text-cyan-400 transition-colors shrink-0"
        >
          Follow →
        </a>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-5 glass-panel-elevated rounded-2xl border border-indigo-500/15 hover:border-indigo-500/40 transition-all duration-300 overflow-hidden p-5 shadow-[0_0_24px_rgba(99,102,241,0.08)] hover:shadow-[0_0_36px_rgba(99,102,241,0.2)]">
      {/* Avatar → links to X */}
      <motion.a
        href={X_URL}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="relative shrink-0"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 blur-lg opacity-40 scale-110 group-hover:opacity-70 transition-opacity" />
        <img
          src="/creator-avatar.png"
          alt="@manavhariyal"
          className="relative w-14 h-14 rounded-full border-2 border-indigo-400/40 object-cover shadow-[0_0_16px_rgba(99,102,241,0.4)]"
        />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-600 border-2 border-background flex items-center justify-center">
          <XIcon className="w-2.5 h-2.5 text-white" />
        </div>
      </motion.a>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-indigo-400/60 font-bold mb-1">Built by</div>
        <div className="text-white font-bold text-base leading-tight">Manav Hariyal</div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <a
            href={X_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            <XIcon className="w-2.5 h-2.5" />
            @manavhariyal
          </a>
          <DiscordCopy />
        </div>
        <div className="text-white/25 text-[11px] mt-1">Learning. Building. Shipping.</div>
      </div>

      {/* CTA → links to X */}
      <motion.a
        href={X_URL}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold text-sm shadow-[0_0_16px_rgba(99,102,241,0.45)] hover:shadow-[0_0_28px_rgba(99,102,241,0.65)] transition-all"
      >
        <XIcon className="w-3.5 h-3.5" />
        Follow on X
        <ExternalLink className="w-3 h-3 opacity-70" />
      </motion.a>
    </div>
  );
}
