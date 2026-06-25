import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { useBalance, useSendTransaction } from "wagmi";
import { parseUnits, formatUnits, isAddress } from "viem";
import {
  Send, ExternalLink, Copy, Check, Wallet, AlertTriangle,
  ArrowLeft, Zap, Shield, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/useWallet";
import { useAgents } from "@/hooks/useAgents";
import { useTransactions } from "@/hooks/useTransactions";
import { arcTestnet, ARC_NETWORK } from "@/config/arc-network";
import { formatUSDC, truncateAddress } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

const PRESETS = [0.1, 0.5, 1, 5, 10];

function QRCode({ value, size = 160 }: { value: string; size?: number }) {
  const src = "https://api.qrserver.com/v1/create-qr-code/?data=" + encodeURIComponent(value) + "&size=" + size + "x" + size + "&bgcolor=0a0d19&color=818cf8&qzone=2";
  return (
    <div className="rounded-2xl overflow-hidden border border-indigo-500/20 shadow-[0_0_24px_rgba(99,102,241,0.15)]">
      <img src={src} alt="QR Code" width={size} height={size} className="block" />
    </div>
  );
}

export default function PayPage() {
  const params = useParams<{ address: string }>();
  const targetAddress = params.address as `0x${string}`;

  const { address, isConnected, isOnArcTestnet, connectMetaMask, switchToArc, formattedBalance } = useWallet();
  const { agents } = useAgents();
  const { addTransaction } = useTransactions(address);
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [sent, setSent] = useState(false);

  const matchedAgent = agents.find(
    (a) => a.walletAddress && targetAddress && a.walletAddress.toLowerCase() === targetAddress.toLowerCase()
  );

  const { data: targetBalance, isLoading: balanceLoading } = useBalance({
    address: targetAddress,
    chainId: arcTestnet.id,
    query: { enabled: !!targetAddress && isAddress(targetAddress) },
  });

  const {
    sendTransaction,
    data: txHash,
    isPending,
    error: txError,
    reset,
  } = useSendTransaction();

  useEffect(() => {
    if (!txHash) return;
    try {
      addTransaction({
        hash: txHash,
        fromAddress: address as string,
        toAddress: targetAddress,
        amount: parseUnits(amount || "0", 18).toString(),
        agentId: matchedAgent ? matchedAgent.id : undefined,
        agentName: matchedAgent ? matchedAgent.name : undefined,
        note: note || undefined,
        timestamp: Date.now(),
        status: "pending",
      });
    } catch (e) {}
    setSent(true);
    reset();
    toast({
      title: "Payment sent!",
      description: formatUSDC(parseFloat(amount || "0")) + " sent",
    });
  }, [txHash]);

  useEffect(() => {
    if (!txError) return;
    toast({ title: "Transaction rejected", description: "MetaMask request was cancelled.", variant: "destructive" });
    reset();
  }, [txError]);

  const handleSend = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    sendTransaction({
      to: targetAddress,
      value: parseUnits(amount, 18),
      chainId: arcTestnet.id,
    });
  };

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const explorerAddressUrl = ARC_NETWORK.explorerUrl + "/address/" + targetAddress;
  const twitterShareUrl = "https://twitter.com/intent/tweet?text=Send+me+USDC+on+Arc+Testnet&url=" + encodeURIComponent(pageUrl);

  const copyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(targetAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  if (!targetAddress || !isAddress(targetAddress)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-panel-elevated rounded-3xl p-12 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h2 className="text-white font-bold text-xl mb-2">Invalid address</h2>
          <p className="text-white/40 text-sm mb-6">This pay link contains an invalid wallet address.</p>
          <Link href="/">
            <Button variant="ghost" className="text-white/40 hover:text-white">Go home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const targetUSDC = targetBalance
    ? parseFloat(formatUnits(targetBalance.value, targetBalance.decimals))
    : null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between p-5 max-w-5xl mx-auto w-full">
        <Link href="/">
          <button className="flex items-center gap-2 text-white/40 hover:text-white/80 text-sm transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Arc Agent Pay
          </button>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
          <span className="text-xs text-white/50 font-medium">Arc Testnet Native USDC</span>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex items-start justify-center p-5 pt-4">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-panel-elevated rounded-3xl overflow-hidden"
            >
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500" />
              <div className="p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                      {matchedAgent && matchedAgent.name ? (
                        <span className="text-3xl font-black text-indigo-300">
                          {matchedAgent.name.slice(0, 2).toUpperCase()}
                        </span>
                      ) : (
                        <Wallet className="w-9 h-9 text-indigo-400" />
                      )}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-widest text-indigo-400/60 font-bold mb-1">
                      {matchedAgent ? "Registered Agent" : "Payment Address"}
                    </div>
                    <h1 className="text-2xl font-black text-white mb-1">
                      {matchedAgent && matchedAgent.name ? matchedAgent.name : "Anonymous Wallet"}
                    </h1>
                    {matchedAgent && matchedAgent.description && (
                      <p className="text-white/40 text-sm">{matchedAgent.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 glass-panel rounded-xl px-4 py-3 mb-5">
                  <span className="font-mono text-white/60 text-sm truncate flex-1">{targetAddress}</span>
                  <button onClick={copyAddr} className="text-white/30 hover:text-indigo-400 transition-colors shrink-0">
                    {copiedAddr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  
                    <a
                      href={explorerAddressUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/30 hover:text-indigo-400 transition-colors shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel rounded-xl p-4">
                    <div className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2">Current Balance</div>
                    {balanceLoading ? (
                      <div className="h-7 w-24 bg-white/5 animate-pulse rounded" />
                    ) : targetUSDC !== null ? (
                      <div className="text-2xl font-black text-white">{formatUSDC(targetUSDC)}</div>
                    ) : (
                      <div className="text-white/30 text-sm">-</div>
                    )}
                    <div className="text-[10px] text-white/20 mt-0.5">USDC on Arc Testnet</div>
                  </div>
                  <div className="glass-panel rounded-xl p-4">
                    <div className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2">Network</div>
                    <div className="text-base font-bold text-emerald-400">Arc Testnet</div>
                    <div className="text-[10px] text-white/20 mt-0.5">Chain ID 5042002</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-panel-elevated rounded-3xl p-7"
            >
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" /> Share this pay link
              </h3>
              <div className="flex gap-6 items-start">
                <QRCode value={pageUrl} size={120} />
                <div className="flex-1 space-y-3">
                  <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="text-white/40 text-xs truncate flex-1 font-mono">{pageUrl}</span>
                    <button onClick={copyLink} className="shrink-0">
                      {copiedLink ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </span>
                      ) : (
                        <Copy className="w-4 h-4 text-white/30 hover:text-indigo-400 transition-colors" />
                      )}
                    </button>
                  </div>
                  <p className="text-white/25 text-xs leading-relaxed">
                    Anyone with this link can send USDC directly to this address on Arc Testnet, no account needed.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    
                      <a
                        href={twitterShareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel text-white/40 hover:text-white/80 text-xs transition-colors border border-white/[0.06] hover:border-indigo-500/30"
                    >
                      <XIcon className="w-3 h-3" />
                      Share on X
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex items-center justify-between text-white/20 text-xs px-1">
              <span className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Powered by Arc Agent Pay
              </span>
              
                href="https://x.com/manavhariyal"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white/40 transition-colors"
              >
                Built by @manavhariyal
              </a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:sticky lg:top-8 self-start"
          >
            <div className="glass-panel-elevated rounded-3xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-600 to-cyan-600" />
              <div className="p-7 space-y-5">
                <div>
                  <h2 className="text-xl font-black text-white mb-0.5">Send USDC</h2>
                  <p className="text-white/30 text-sm">
                    to {matchedAgent && matchedAgent.name ? matchedAgent.name : truncateAddress(targetAddress)}
                  </p>
                </div>

                {!isConnected ? (
                  <div className="space-y-4">
                    <div className="glass-panel rounded-2xl p-5 text-center">
                      <Wallet className="w-10 h-10 mx-auto mb-3 text-indigo-400/50" />
                      <p className="text-white/50 text-sm mb-4">Connect your wallet to send USDC</p>
                      <Button
                        onClick={connectMetaMask}
                        className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold rounded-xl"
                      >
                        Connect MetaMask
                      </Button>
                    </div>
                    <p className="text-white/20 text-xs text-center">
                      No account needed, just MetaMask and some Arc Testnet USDC
                    </p>
                  </div>
                ) : !isOnArcTestnet ? (
                  <div className="glass-panel rounded-2xl p-5 text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-400" />
                    <p className="text-white/50 text-sm mb-4">Switch to Arc Testnet to send</p>
                    <Button
                      onClick={switchToArc}
                      className="w-full h-11 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl"
                    >
                      Switch Network
                    </Button>
                  </div>
                ) : sent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel rounded-2xl p-8 text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(52,211,153,0.3)]">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">Payment sent!</h3>
                    <p className="text-white/40 text-sm mb-5">
                      {formatUSDC(parseFloat(amount || "0"))} is on its way, confirming on-chain now.
                    </p>
                    <Button
                      onClick={() => { setSent(false); setAmount(""); setNote(""); }}
                      variant="ghost"
                      className="text-indigo-400 hover:text-cyan-400 text-sm"
                    >
                      Send another
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/30">Your balance</span>
                      <span className="font-mono font-bold text-cyan-400">{formattedBalance ? formattedBalance : "..."} USDC</span>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Amount (USDC)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.001"
                          className="glass-panel border-indigo-500/20 text-white text-2xl font-black h-16 rounded-xl focus-visible:ring-indigo-500/40 pr-20"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 font-bold text-sm">USDC</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {PRESETS.map((p) => (
                          <button
                            key={p}
                            onClick={() => setAmount(String(p))}
                            className={
                              amount === String(p)
                                ? "px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                                : "px-3 py-1.5 rounded-lg text-xs font-bold transition-all glass-panel text-white/40 hover:text-white/70 border border-white/[0.06]"
                            }
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Note (optional)</Label>
                      <Input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What's this for?"
                        className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl focus-visible:ring-indigo-500/40"
                      />
                    </div>

                    <Button
                      onClick={handleSend}
                      disabled={isPending || !amount || parseFloat(amount) <= 0}
                      className="w-full h-14 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-black text-lg rounded-2xl shadow-[0_0_24px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] disabled:opacity-40 transition-all"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Confirm in MetaMask...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-5 h-5" />
                          Send {amount ? formatUSDC(parseFloat(amount)) : "USDC"}
                        </span>
                      )}
                    </Button>

                    <p className="text-white/20 text-[11px] text-center">
                      Transaction will be confirmed on Arc Testnet via MetaMask
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
