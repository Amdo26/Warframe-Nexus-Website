import { formatCompactEta, formatEta, remainingMs } from "@/lib/wf/format";
import { useNow } from "@/lib/wf/hooks";
import { cn } from "@/lib/utils";

export function Countdown({
  expiry,
  compact = false,
  className,
}: {
  expiry?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const now = useNow();
  const ms = remainingMs(expiry, now);
  const ended = ms <= 0;
  return (
    <span
      className={cn(
        "tabular font-display tracking-wide",
        ended ? "text-danger" : "text-live",
        className,
      )}
    >
      {ended ? "expired" : compact ? formatCompactEta(ms) : formatEta(ms)}
    </span>
  );
}
