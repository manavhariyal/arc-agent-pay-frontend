import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAgents } from "@/hooks/useAgents";
import { truncateAddress, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, Search, Shield, MoreVertical, ExternalLink, Trash2, Edit2, Send, AlertTriangle, Copy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useBalance } from "wagmi";
import { formatUnits } from "viem";
import { arcTestnet, ARC_NETWORK } from "@/config/arc-network";
import { useWallet } from "@/hooks/useWallet";
import { SendPaymentDialog } from "@/components/wallet/SendPaymentDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Agent, AgentStatus } from "@/types";
import { useAgentHealth, DEFAULT_LOW_BALANCE_THRESHOLD } from "@/context/AgentHealthContext";

// Circle wallet that handles all auto-payments
const CIRCLE_WALLET_ADDRESS = "0x48f40e29eb0aef155c3dac794d7a34d95bddc918";

function AgentBalance({ address }: { address: string }) {
  const { data, isLoading } = useBalance({
    address: address as `0x${string}`,
    chainId: arcTestnet.id,
  });
  if (isLoading) return <span className="text-white/30 text-sm animate-pulse">…</span>;
  if (!data) return <span className="text-white/30 text-sm">—</span>;
  const formatted = parseFloat(formatUnits(data.value, data.decimals)).toFixed(4);
  return <span className="font-mono font-bold text-white text-base">{formatted} <span className="text-xs text-indigo-300">USDC</span></span>;
}

// Shows Circle wallet balance (auto-payment treasury)
function CircleWalletBalance() {
  const { data, isLoading } = useBalance({
    address: CIRCLE_WALLET_ADDRESS as `0x${string}`,
    chainId: arcTestnet.id,
  });
  if (isLoading) return <span className="text-white/30 text-xs animate-pulse">loading…</span>;
  if (!data) return <span className="text-white/30 text-xs">—</span>;
  const formatted = parseFloat(formatUnits(data.value, data.decimals)).toFixed(4);
  const isLow = parseFloat(formatted) < 10;
  return (
    <span className={cn("font-mono font-bold text-sm", isLow ? "text-amber-400" : "text-cyan-400")}>
      {formatted} USDC {isLow && "⚠️"}
    </span>
  );
}

interface AgentFormData {
  name: string;
  description: string;
  address: string;
  status: AgentStatus;
  lowBalanceThreshold: number;
}

const emptyForm: AgentFormData = { name: "", description: "", address: "", status: "active", lowBalanceThreshold: DEFAULT_LOW_BALANCE_THRESHOLD };

function AgentFormFields({ form, setForm }: { form: AgentFormData; setForm: React.Dispatch<React.SetStateAction<AgentFormData>>; }) {
  const isValidAddress = (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr);
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Agent Name</Label>
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. YieldFarmer_v2" className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl focus-visible:ring-indigo-500/40" />
      </div>
      <div className="grid gap-2">
        <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Description</Label>
        <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this agent do?" className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl focus-visible:ring-indigo-500/40" />
      </div>
      <div className="grid gap-2">
        <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Wallet Address to Monitor</Label>
        <Input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="0x…"
          className={cn("glass-panel border-indigo-500/20 text-white font-mono h-11 rounded-xl focus-visible:ring-indigo-500/40", form.address && !isValidAddress(form.address) && "border-rose-500/40")}
        />
        <p className="text-[11px] text-white/30">This wallet will be monitored for balance and activity.</p>
        {form.address && !isValidAddress(form.address) && <p className="text-rose-400 text-xs">Enter a valid Ethereum address (0x…)</p>}
      </div>
      <div className="grid gap-2">
        <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as AgentStatus }))}>
          <SelectTrigger className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent className="glass-panel-elevated border-indigo-500/20 rounded-xl">
            <SelectItem value="active" className="text-white rounded-lg">Active</SelectItem>
            <SelectItem value="idle" className="text-white rounded-lg">Idle</SelectItem>
            <SelectItem value="paused" className="text-white rounded-lg">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Low Balance Alert Threshold (USDC)</Label>
        <div className="relative">
          <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/60" />
          <Input type="number" min="0" step="1" value={form.lowBalanceThreshold} onChange={(e) => setForm((f) => ({ ...f, lowBalanceThreshold: parseFloat(e.target.value) || 0 }))} className="pl-9 glass-panel border-indigo-500/20 text-white h-11 rounded-xl focus-visible:ring-indigo-500/40" />
        </div>
        <p className="text-[11px] text-white/30">Warn when agent balance drops below this amount. Default: {DEFAULT_LOW_BALANCE_THRESHOLD} USDC.</p>
      </div>
    </div>
  );
}

export default function Agents() {
  const { isConnected } = useWallet();
  const { agents, addAgent, updateAgent, deleteAgent, setAgentStatus } = useAgents();
  const { entries } = useAgentHealth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState<AgentFormData>(emptyForm);
  const [sendTarget, setSendTarget] = useState<{ address: string; agentId: string } | null>(null);
  const [showFundInfo, setShowFundInfo] = useState(false);

  const filteredAgents = agents.filter(
    (a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase()) || a.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };
  const isValidAddress = (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Copied!", description: "Address copied to clipboard." });
  };

  const handleAdd = () => {
    if (!form.name.trim() || !isValidAddress(form.address)) return;
    addAgent({ name: form.name.trim(), description: form.description.trim(), walletAddress: form.address, status: form.status, alertThreshold: form.lowBalanceThreshold });
    setForm(emptyForm);
    setAddOpen(false);
  };

  const handleEdit = () => {
    if (!editAgent || !form.name.trim() || !isValidAddress(form.address)) return;
    updateAgent(editAgent.id, { name: form.name.trim(), description: form.description.trim(), walletAddress: form.address, status: form.status, alertThreshold: form.lowBalanceThreshold });
    setEditAgent(null);
    setForm(emptyForm);
  };

  const openEdit = (agent: Agent) => {
    setEditAgent(agent);
    setForm({ name: agent.name, description: agent.description, address: agent.walletAddress, status: agent.status, lowBalanceThreshold: agent.alertThreshold ?? DEFAULT_LOW_BALANCE_THRESHOLD });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">Agents</h1>
            <div className="h-1 w-16 bg-indigo-500 rounded-full mb-3"></div>
            <p className="text-white/40 text-sm">Register and manage autonomous agent wallet addresses.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input placeholder="Search agents…" className="pl-9 glass-panel border-indigo-500/20 text-white h-11 rounded-full focus-visible:ring-indigo-500/40" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-[0_0_16px_rgba(99,102,241,0.35)] px-6">
                  <Plus className="w-4 h-4 mr-2" /> Register Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px] glass-panel-elevated border-indigo-500/20">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl font-bold">Register Agent</DialogTitle>
                  <DialogDescription className="text-white/40">Add an agent wallet address to track and fund on Arc Testnet.</DialogDescription>
                </DialogHeader>
                <AgentFormFields form={form} setForm={setForm} />
                <Button onClick={handleAdd} disabled={!form.name.trim() || !isValidAddress(form.address)} className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl mt-2 disabled:opacity-50">
                  Register Agent
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Auto-Payment Treasury Banner */}
        <div className="glass-panel-elevated rounded-2xl p-5 border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-white font-bold text-sm mb-0.5">Auto-Payment Treasury</div>
                <div className="text-white/40 text-xs">All scheduled payments are sent from this wallet. Fund it to enable auto-payments!</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <CircleWalletBalance />
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-white/30">{truncateAddress(CIRCLE_WALLET_ADDRESS)}</span>
                <button onClick={() => copyAddress(CIRCLE_WALLET_ADDRESS)} className="text-white/30 hover:text-cyan-400 transition-colors">
                  <Copy className="w-3 h-3" />
                </button>
                <a href={`${ARC_NETWORK.explorerUrl}/address/${CIRCLE_WALLET_ADDRESS}`} target="_blank" rel="noreferrer" className="text-white/30 hover:text-cyan-400 transition-colors">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-cyan-500/10">
            <p className="text-xs text-white/30">
              💡 To enable auto-payments for your agents, send USDC to the treasury wallet above using the <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Circle Faucet</a> (testnet) or directly from your wallet.
            </p>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="glass-panel-elevated rounded-2xl p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-indigo-400/50" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">No agents registered</h2>
            <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">Register wallet addresses to track balances, assign spending rules, and fund agents directly.</p>
            <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl px-8 h-11">
              <Plus className="w-4 h-4 mr-2" /> Register your first agent
            </Button>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <motion.div key={agent.id} variants={item} className="h-full">
                <motion.div whileHover={{ y: -3 }} className="glass-panel-elevated p-6 rounded-2xl relative overflow-hidden h-full flex flex-col transition-all duration-300 group">
                  {entries[agent.id]?.isLow && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl" />}
                  <div className="flex justify-between items-start mb-5">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border",
                      entries[agent.id]?.isLow ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                      agent.status === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      agent.status === "idle" ? "bg-sky-400/10 border-sky-400/20 text-sky-400" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      {entries[agent.id]?.isLow ? <AlertTriangle className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </div>
                    <div className="flex items-center gap-2">
                      {entries[agent.id]?.isLow && (
                        <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 animate-pulse">Low Balance</Badge>
                      )}
                      <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 text-xs font-semibold",
                        agent.status === "active" ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" :
                        agent.status === "idle" ? "text-sky-400 border-sky-400/30 bg-sky-400/10" :
                        "text-amber-400 border-amber-400/30 bg-amber-400/10"
                      )}>{agent.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/10 rounded-full"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-panel-elevated border-indigo-500/20 text-white rounded-xl">
                          <DropdownMenuItem className="hover:bg-white/10 cursor-pointer rounded-lg flex items-center gap-2" onClick={() => openEdit(agent)}>
                            <Edit2 className="w-4 h-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/10 cursor-pointer rounded-lg flex items-center gap-2" onClick={() => setSendTarget({ address: agent.walletAddress, agentId: agent.id })}>
                            <Send className="w-4 h-4" /> Fund Wallet
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-400 hover:bg-rose-400/10 hover:text-rose-300 cursor-pointer rounded-lg flex items-center gap-2" onClick={() => deleteAgent(agent.id)}>
                            <Trash2 className="w-4 h-4" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <Link href={`/agents/${agent.id}`} className="flex-1 cursor-pointer">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{agent.name}</h3>
                    {agent.description && <p className="text-white/40 text-sm mb-4 line-clamp-2">{agent.description}</p>}
                  </Link>

                  <div className="pt-4 border-t border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Monitored Wallet Balance</div>
                      <AgentBalance address={agent.walletAddress} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs text-white/40">{truncateAddress(agent.walletAddress)}</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyAddress(agent.walletAddress)} className="text-white/30 hover:text-white/60 transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                        <a href={`${ARC_NETWORK.explorerUrl}/address/${agent.walletAddress}`} target="_blank" rel="noreferrer" className="text-indigo-400/50 hover:text-indigo-400 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <div className="text-[10px] text-white/20">Registered {new Date(agent.createdAt).toLocaleDateString()}</div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
            {filteredAgents.length === 0 && searchTerm && (
              <div className="col-span-full py-16 text-center text-white/30 glass-panel-elevated rounded-2xl">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>No agents matching "{searchTerm}"</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <Dialog open={!!editAgent} onOpenChange={(open) => { if (!open) { setEditAgent(null); setForm(emptyForm); } }}>
        <DialogContent className="sm:max-w-[440px] glass-panel-elevated border-indigo-500/20">
          <DialogHeader><DialogTitle className="text-white text-xl font-bold">Edit Agent</DialogTitle></DialogHeader>
          <AgentFormFields form={form} setForm={setForm} />
          <Button onClick={handleEdit} disabled={!form.name.trim() || !isValidAddress(form.address)} className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl mt-2 disabled:opacity-50">
            Save Changes
          </Button>
        </DialogContent>
      </Dialog>

      <SendPaymentDialog open={!!sendTarget} onClose={() => setSendTarget(null)} prefilledAddress={sendTarget?.address} prefilledAgentId={sendTarget?.agentId} />
    </AppLayout>
  );
}
