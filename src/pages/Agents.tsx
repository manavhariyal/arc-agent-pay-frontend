import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAgents } from "@/hooks/useAgents";
import { truncateAddress, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, Search, Shield, MoreVertical, ExternalLink, Trash2, Edit2, Zap, Copy } from "lucide-react";
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

const CIRCLE_WALLET_ADDRESS = "0x48f40e29eb0aef155c3dac794d7a34d95bddc918";

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
  status: AgentStatus;
}

const emptyForm: AgentFormData = { name: "", description: "", status: "active" };

export default function Agents() {
  const { address: connectedAddress } = useWallet();
  const { agents, addAgent, updateAgent, deleteAgent } = useAgents();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState<AgentFormData>(emptyForm);
  const [sendTarget, setSendTarget] = useState<{ address: string; agentId: string } | null>(null);

  const filteredAgents = agents.filter(
    (a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Copied!", description: "Address copied to clipboard." });
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addAgent({
      name: form.name.trim(),
      description: form.description.trim(),
      walletAddress: connectedAddress || CIRCLE_WALLET_ADDRESS,
      status: form.status,
      alertThreshold: 10,
    });
    setForm(emptyForm);
    setAddOpen(false);
  };

  const handleEdit = () => {
    if (!editAgent || !form.name.trim()) return;
    updateAgent(editAgent.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
    });
    setEditAgent(null);
    setForm(emptyForm);
  };

  const openEdit = (agent: Agent) => {
    setEditAgent(agent);
    setForm({ name: agent.name, description: agent.description, status: agent.status });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">Agents</h1>
            <div className="h-1 w-16 bg-indigo-500 rounded-full mb-3"></div>
            <p className="text-white/40 text-sm">Register and manage your AI agents for automatic payments.</p>
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
                  <DialogDescription className="text-white/40">
                    Create an AI agent to manage automatic payments on Arc Testnet.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Agent Name</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Trading Bot, Payment Agent" className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl focus-visible:ring-indigo-500/40" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Description</Label>
                    <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this agent do?" className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl focus-visible:ring-indigo-500/40" />
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
                </div>
                <Button onClick={handleAdd} disabled={!form.name.trim()} className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl mt-2 disabled:opacity-50">
                  Register Agent
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="glass-panel-elevated rounded-2xl p-5 border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-white font-bold text-sm mb-0.5">⚡ Auto-Payment Treasury</div>
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
          <div className="mt-3 pt-3 border-t border-cyan-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs text-white/30">💡 Send USDC to the treasury wallet above to fund your agents auto-payments.</p>
            <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold whitespace-nowrap">
              Get free testnet USDC →
            </a>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="glass-panel-elevated rounded-2xl p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-indigo-400/50" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">No agents registered</h2>
            <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">Register your first AI agent to start automating payments on Arc Testnet.</p>
            <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl px-8 h-11">
              <Plus className="w-4 h-4 mr-2" /> Register your first agent
            </Button>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <motion.div key={agent.id} variants={item} className="h-full">
                <motion.div whileHover={{ y: -3 }} className="glass-panel-elevated p-6 rounded-2xl relative overflow-hidden h-full flex flex-col transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-5">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border",
                      agent.status === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      agent.status === "idle" ? "bg-sky-400/10 border-sky-400/20 text-sky-400" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 text-xs font-semibold",
                        agent.status === "active" ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" :
                        agent.status === "idle" ? "text-sky-400 border-sky-400/30 bg-sky-400/10" :
                        "text-amber-400 border-amber-400/30 bg-amber-400/10"
                      )}>{agent.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/10 rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-panel-elevated border-indigo-500/20 text-white rounded-xl">
                          <DropdownMenuItem className="hover:bg-white/10 cursor-pointer rounded-lg flex items-center gap-2" onClick={() => openEdit(agent)}>
                            <Edit2 className="w-4 h-4" /> Edit
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
                  <div className="pt-4 border-t border-white/[0.06] space-y-2">
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
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">Edit Agent</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Agent Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="glass-panel border-indigo-500/20 text-white h-11 rounded-xl" />
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
          </div>
          <Button onClick={handleEdit} disabled={!form.name.trim()} className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl mt-2 disabled:opacity-50">
            Save Changes
          </Button>
        </DialogContent>
      </Dialog>

      <SendPaymentDialog open={!!sendTarget} onClose={() => setSendTarget(null)} prefilledAddress={sendTarget?.address} prefilledAgentId={sendTarget?.agentId} />
    </AppLayout>
  );
}
