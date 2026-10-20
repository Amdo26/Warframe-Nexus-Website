import { cn } from "@/lib/utils";

export function StatBar({
  label,
  value,
  max,
  className,
}: {
  label: string;
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between font-display text-[0.68rem] uppercase tracking-[0.14em] text-muted">
        <span>{label}</span>
        <span className="tabular text-fg">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
