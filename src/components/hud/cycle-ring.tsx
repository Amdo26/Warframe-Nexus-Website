import { cycleProgress, remainingMs, rollCycle } from "@/lib/wf/format";
import { useNow } from "@/lib/wf/hooks";
import type { CycleSnapshot } from "@/lib/wf/types";
import { cn } from "@/lib/utils";
import { Countdown } from "./countdown";

export function CycleRing({ cycle: rawCycle, compact = false }: { cycle: CycleSnapshot; compact?: boolean }) {
  const now = useNow();
  const cycle = rollCycle(rawCycle, now);
  const progress = cycleProgress(cycle.activation, cycle.expiry, now);
  const remaining = remainingMs(cycle.expiry, now);
  const size = compact ? 42 : 72;
  const r = compact ? 16 : 30;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - progress);
  const ending = remaining > 0 && remaining < 5 * 60 * 1000;

  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2")}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-border-strong"
          strokeWidth={compact ? 3 : 4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className={ending ? "text-danger" : "text-accent"}
          strokeWidth={compact ? 3 : 4}
          strokeDasharray={c}
          strokeDashoffset={dash}
          strokeLinecap="round"
        />
      </svg>
      <div className="min-w-0">
        <p className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-muted">{cycle.label}</p>
        <p className={cn("font-display text-sm text-fg", compact && "text-xs")}>{cycle.stateLabel}</p>
        <Countdown expiry={cycle.expiry} compact className="text-xs" />
      </div>
    </div>
  );
}
