import { cn } from "@/lib/utils";

const MARKS: Record<string, string> = {
  madurai: "V",
  vazarin: "D",
  naramon: "—",
  zenurik: "=",
  unairu: "R",
  umbra: "U",
  penjaga: "P",
  aura: "A",
};

export function Polarities({ values, className }: { values: string[]; className?: string }) {
  if (!values.length) return <span className="text-subtle">—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {values.map((p, i) => {
        const key = p.toLowerCase();
        return (
          <span
            key={`${p}-${i}`}
            title={p}
            className="inline-flex size-6 items-center justify-center rounded-sm border border-border font-display text-xs text-accent"
          >
            {MARKS[key] ?? p.slice(0, 1).toUpperCase()}
          </span>
        );
      })}
    </span>
  );
}
