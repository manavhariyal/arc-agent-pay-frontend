import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSpendingRules } from "@/hooks/useSpendingRules";
import { useAgents } from "@/hooks/useAgents";
import { formatUSDC, truncateAddress, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Shield, Plus, Settings2, Trash2, ToggleLeft, ToggleRight,
  Zap, Clock, CheckCircle2, AlertCircle, RefreshCw, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SpendingRule } from "@/types";

const isValidAddress = (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr);

interface RuleForm {
  agentId: string;
  type: "recurring" | "one-time";
  amount: string;
  recipient: string;
  recipientLabel: string;
  interval: "hourly" | "every6h" | "every12h" | "daily" | "weekly" | "monthly";
}

const emptyForm: RuleForm = {
  agentId: "",
  type: "recurring",
  amount: "",
  recipient: "",
  recipientLabel: "",
  interval: "daily",
};

const intervalLabels: Record<string, string> = {
  hourly: "Every Hour",
  every6h: "Every 6 Hours",
  every12h: "Every 12 Hours",
  daily: "Every Day",
  weekly: "Every Week",
  monthly: "Every Month",
};

export default function Rules() {
  const { rules, addRule, deleteRule, toggleRule, executeNow, loading, backendAvailable, refetch } = useSpendingRules();
  const { agents } = useAgents();
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [tab, setTab] = useState<"recurring" | "one-time">("recurring");
  const [executing, setExecuting] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  const canSubmit =
    form.agentId &&
    parseFloat(form.amount) > 0 &&
    isValidAddress(form.recipient);

  const handleDeploy = async () => {
    if (!canSubmit) return;
    const agent = agents.find((a) => a.id === form.agentId);
    await addRule({
      agentId: form.agentId,
      agentName: agent?.name ?? "",
      type: tab,
      amount: form.amount,
      interval: tab === "recurring" ? form.interval : undefined,
      recipient: form.recipient,
      recipientLabel: form.recipientLabel || undefined,
      status: "active",
    });
    setForm(emptyForm);
    setSuccessMsg("Rule created! Scheduler will execute automatically.");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleExecuteNow = async (id: string) => {
    setExecuting(id);
    const result = await executeNow(id);
    setExecuting(null);
    if (result?.success) {
      setSuccessMsg("Payment executed successfully on Arc Testnet!");
    } else {
      setSuccessMsg(result?.message || "Execution triggered.");
    }
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">Rule Builder</h1>
            <div className="h-1 w-16 bg-[#22F0FF] rounded-full mb-3"></div>
            <p className="text-white/40 text-sm">Configure autonomous spending parameters for your registered agents.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Backend status indicator */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border",
              backendAvailable
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            )}>
              {backendAvailable ? (
                <><CheckCircle2 className="w-3 h-3" /> Auto-Pay Active</>
              ) : (
                <><AlertCircle className="w-3 h-3" /> Local Mode — won't auto-run</>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              className="rounded-full h-8 w-8 text-white/40 hover:text-white"
              title="Refresh rules"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-elevated rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* Backend info banner */}
        {backendAvailable && (
          <div className="glass-panel-elevated rounded-2xl p-4 border border-[#05D8EA]/20 bg-[#05D8EA]/5 text-[#9FF6FF] text-sm flex items-center gap-3">
            <Zap className="w-5 h-5 shrink-0 text-[#22F0FF]" />
            <span>
              <strong>Auto-Payment Scheduler is active!</strong> Rules will execute automatically on Arc Testnet every hour/day based on your schedule. No action needed from you.
            </span>
          </div>
        )}

        {agents.length === 0 && (
          <div className="glass-panel-elevated rounded-2xl p-6 border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm flex items-center gap-3">
            <Shield className="w-5 h-5 shrink-0" />
            <span>Register at least one agent before creating spending rules.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <Card className="glass-panel-elevated p-8 rounded-3xl sticky top-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0A84FF]/20 border border-[#0A84FF]/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#3AB4FF]" />
                </div>
                New Rule
              </h2>

              <Tabs value={tab} onValueChange={(v) => setTab(v as "recurring" | "one-time")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 glass-panel border-[#0A84FF]/20 mb-6 p-1 rounded-full">
                  <TabsTrigger value="recurring" className="rounded-full font-semibold text-sm data-[state=active]:bg-[#0B3FD1] data-[state=active]:text-white">
                    Recurring
                  </TabsTrigger>
                  <TabsTrigger value="one-time" className="rounded-full font-semibold text-sm data-[state=active]:bg-[#0B3FD1] data-[state=active]:text-white">
                    One-time
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Agent</Label>
                    <Select
                      value={form.agentId}
                      onValueChange={(v) => setForm((f) => ({ ...f, agentId: v }))}
                      disabled={agents.length === 0}
                    >
                      <SelectTrigger className="glass-panel border-[#0A84FF]/20 text-white h-11 rounded-xl">
                        <SelectValue placeholder="Select agent…" />
                      </SelectTrigger>
                      <SelectContent className="glass-panel-elevated border-[#0A84FF]/20 rounded-xl">
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id} className="text-white rounded-lg">
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Recipient Address</Label>
                    <Input
                      value={form.recipient}
                      onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
                      placeholder="0x…"
                      className={cn(
                        "glass-panel border-[#0A84FF]/20 text-white font-mono h-11 rounded-xl focus-visible:ring-[#0A84FF]/40",
                        form.recipient && !isValidAddress(form.recipient) && "border-rose-500/40"
                      )}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Label (optional)</Label>
                    <Input
                      value={form.recipientLabel}
                      onChange={(e) => setForm((f) => ({ ...f, recipientLabel: e.target.value }))}
                      placeholder="e.g. Oracle Provider"
                      className="glass-panel border-[#0A84FF]/20 text-white h-11 rounded-xl focus-visible:ring-[#0A84FF]/40"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Amount (USDC)</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      min="0"
                      step="0.001"
                      className="glass-panel border-[#0A84FF]/20 text-white h-11 rounded-xl focus-visible:ring-[#0A84FF]/40"
                    />
                  </div>

                  <TabsContent value="recurring" className="mt-0 pt-0">
                    <div className="grid gap-2 mt-4">
                      <Label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Schedule</Label>
                      <Select value={form.interval} onValueChange={(v) => setForm((f) => ({ ...f, interval: v as RuleForm["interval"] }))}>
                        <SelectTrigger className="glass-panel border-[#0A84FF]/20 text-white h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-panel-elevated border-[#0A84FF]/20 rounded-xl">
                          <SelectItem value="hourly" className="text-white rounded-lg">Every Hour</SelectItem>
                          <SelectItem value="every6h" className="text-white rounded-lg">Every 6 Hours</SelectItem>
                          <SelectItem value="every12h" className="text-white rounded-lg">Every 12 Hours</SelectItem>
                          <SelectItem value="daily" className="text-white rounded-lg">Every Day</SelectItem>
                          <SelectItem value="weekly" className="text-white rounded-lg">Every Week</SelectItem>
                          <SelectItem value="monthly" className="text-white rounded-lg">Every Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <Button
                    onClick={handleDeploy}
                    disabled={!canSubmit}
                    className="w-full mt-4 bg-gradient-to-r from-[#0B3FD1] to-[#049CAE] hover:from-[#072E9E] hover:to-[#037685] text-white h-12 rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create Rule
                  </Button>
                </div>
              </Tabs>
            </Card>
          </div>

          {/* Rules list */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-[#22F0FF]" /> Configured Rules
              {rules.length > 0 && (
                <span className="text-sm font-normal text-white/30">({rules.length})</span>
              )}
            </h2>

            {loading && rules.length === 0 ? (
              <div className="glass-panel-elevated rounded-2xl p-12 text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 text-[#22F0FF] animate-spin" />
                <p className="text-white/40 text-sm">Loading rules...</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="glass-panel-elevated rounded-2xl p-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#05D8EA]/10 border border-[#05D8EA]/20 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-[#22F0FF]/50" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">No rules yet</h3>
                <p className="text-white/40 text-sm">Create spending rules to define how agents should dispatch payments automatically.</p>
              </div>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                {rules.map((rule) => (
                  <motion.div key={rule.id} variants={item}>
                    <div className={cn(
                      "glass-panel-elevated p-6 rounded-2xl border transition-all",
                      rule.status === "active" ? "border-[#05D8EA]/20" : "border-white/[0.04]"
                    )}>
                      <div className="flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
                            rule.status === "active"
                              ? "bg-[#05D8EA]/10 border-[#05D8EA]/20 text-[#22F0FF]"
                              : "bg-white/[0.04] border-white/10 text-white/30"
                          )}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="font-bold text-white">{rule.agentName}</span>
                              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-[#3AB4FF] border-[#3AB4FF]/30 bg-[#3AB4FF]/10">
                                {rule.type}
                              </Badge>
                              <Badge variant="outline" className={cn(
                                "text-[10px] uppercase font-bold tracking-wider",
                                rule.status === "active" ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" : "text-white/30 border-white/10"
                              )}>
                                {rule.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-mono font-bold text-[#22F0FF]">{formatUSDC(parseFloat(rule.amount))}</span>
                              {rule.interval && (
                                <span className="text-white/40 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {intervalLabels[rule.interval] || rule.interval}
                                </span>
                              )}
                              <span className="text-white/40">
                                → {rule.recipientLabel ? (
                                  <span className="text-white/70">{rule.recipientLabel}</span>
                                ) : (
                                  <span className="font-mono">{truncateAddress(rule.recipient)}</span>
                                )}
                              </span>
                            </div>
                            <div className="text-[10px] text-white/20 mt-1 font-mono">{truncateAddress(rule.recipient)}</div>

                            {/* Execution stats */}
                            {(rule as any).executionCount > 0 && (
                              <div className="mt-2 flex items-center gap-3 text-[10px] text-white/30">
                                <span>Executed {(rule as any).executionCount}x</span>
                                {(rule as any).lastExecutedAt && (
                                  <span>Last: {new Date((rule as any).lastExecutedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {/* Execute now button */}
                          {backendAvailable && rule.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExecuteNow(rule.id)}
                              disabled={executing === rule.id}
                              className="rounded-full h-9 w-9 text-[#22F0FF]/60 hover:text-[#22F0FF] hover:bg-[#05D8EA]/10 transition-colors"
                              title="Execute now"
                            >
                              {executing === rule.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleRule(rule.id)}
                            className={cn(
                              "rounded-full h-9 w-9 transition-colors",
                              rule.status === "active"
                                ? "text-emerald-400 hover:bg-emerald-500/10"
                                : "text-white/30 hover:bg-white/10"
                            )}
                            title={rule.status === "active" ? "Deactivate" : "Activate"}
                          >
                            {rule.status === "active" ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRule(rule.id)}
                            className="rounded-full h-9 w-9 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
