import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUSDC(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value).replace('$', '') + ' USDC';
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const RULE_INTERVAL_HOURS: Record<string, number> = {
  hourly: 1, every6h: 6, every12h: 12, daily: 24, weekly: 168, monthly: 720,
};

/** Computes when a scheduled rule will next run, based on its interval and last execution.
 *  Mirrors the backend's isRuleDue() cadence logic so the two never disagree.
 *  `agentActive` must reflect the rule's PARENT AGENT's status, not just the rule's own
 *  status — the scheduler skips execution for any rule whose agent isn't active, so a
 *  next-run estimate that ignores this would show a countdown that never actually fires. */
export function getNextRunLabel(
  interval: string,
  lastExecutedAt: string | null | undefined,
  agentActive: boolean = true
): string {
  if (!agentActive) return "Agent is paused — won't run until reactivated";

  if (interval === "once") {
    return lastExecutedAt ? "Already sent (one-time)" : "Runs once, within 5 min of activation";
  }

  const hours = RULE_INTERVAL_HOURS[interval];
  if (!hours) return "";
  if (!lastExecutedAt) return "First run within 5 min of activation";
  const next = new Date(new Date(lastExecutedAt).getTime() + hours * 60 * 60 * 1000);
  const diffMs = next.getTime() - Date.now();
  if (diffMs <= 0) return "Due now — runs on next scheduler pass";
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 60) return `Next run in ~${diffMins}m`;
  const diffHrs = Math.round(diffMins / 60);
  if (diffHrs < 24) return `Next run in ~${diffHrs}h`;
  return `Next run ${next.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
}

/** Returns the soonest next-run label across a set of active rules for ONE agent, or null
 *  if none are eligible to run. Pass the agent's own active status so the label never
 *  promises a run that the scheduler will actually skip. */
export function getSoonestNextRun(
  rules: { interval: string; status: string; lastExecutedAt?: string | null }[],
  agentActive: boolean = true
): string | null {
  if (!agentActive) return rules.length > 0 ? "Agent is paused — no rules will run until reactivated" : null;
  const active = rules.filter((r) => r.status === "active" && (RULE_INTERVAL_HOURS[r.interval] || r.interval === "once"));
  if (active.length === 0) return null;
  let soonest: { time: number; label: string } | null = null;
  for (const r of active) {
    const hours = r.interval === "once" ? 0 : RULE_INTERVAL_HOURS[r.interval];
    const base = r.lastExecutedAt ? new Date(r.lastExecutedAt).getTime() : Date.now();
    const nextTime = r.lastExecutedAt ? base + hours * 60 * 60 * 1000 : Date.now();
    if (!soonest || nextTime < soonest.time) {
      soonest = { time: nextTime, label: getNextRunLabel(r.interval, r.lastExecutedAt, true) };
    }
  }
  return soonest?.label ?? null;
}
