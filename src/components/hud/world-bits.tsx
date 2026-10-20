import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/hud/countdown";
import type { FissureSnapshot, InvasionSnapshot, SortieSnapshot } from "@/lib/wf/types";
import { cn } from "@/lib/utils";

export function SortieCard({
  title,
  data,
}: {
  title: string;
  data: SortieSnapshot | null | undefined;
}) {
  if (!data) {
    return (
      <p className="text-sm text-muted">No active {title.toLowerCase()}.</p>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg text-fg">{data.boss}</p>
          <p className="text-sm text-muted">{data.faction}</p>
        </div>
        <Countdown expiry={data.expiry} compact />
      </div>
      <ol className="space-y-2">
        {data.missions.map((m, i) => (
          <li key={`${m.node}-${i}`} className="flex gap-3 rounded-md bg-elevated px-3 py-2">
            <span className="font-display text-accent">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              <p className="text-sm text-fg">
                {m.type} <span className="text-muted">· {m.node}</span>
              </p>
              {m.modifier ? <p className="text-xs text-subtle">{m.modifier}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FissureRow({ fissure }: { fissure: FissureSnapshot }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 border-b border-border py-2 last:border-0">
      <Badge tone={fissure.isHard ? "accent" : fissure.isStorm ? "live" : "outline"}>{fissure.tier}</Badge>
      <div className="min-w-0">
        <p className="truncate text-sm text-fg">
          {fissure.missionType}
          <span className="text-muted"> · {fissure.node}</span>
        </p>
        <p className="text-xs text-subtle">
          {fissure.enemy}
          {fissure.isHard ? " · Steel Path" : ""}
          {fissure.isStorm ? " · Storm" : ""}
        </p>
      </div>
      <Countdown expiry={fissure.expiry} compact className="text-xs" />
    </div>
  );
}

export function InvasionRow({ invasion }: { invasion: InvasionSnapshot }) {
  const pct = Math.min(100, Math.max(0, Math.abs(invasion.completion) <= 1 ? Math.abs(invasion.completion) * 100 : Math.abs(invasion.completion)));
  return (
    <div className="space-y-2 border-b border-border py-3 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-fg">{invasion.node}</p>
          <p className="text-xs text-subtle">{invasion.desc}</p>
        </div>
        <span className="tabular font-display text-xs text-muted">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>
          {invasion.attacker.faction}: {invasion.attacker.reward}
        </span>
        <span className="text-right">
          {invasion.defender.faction}: {invasion.defender.reward}
        </span>
      </div>
    </div>
  );
}

export function StatusNote({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  onRetry?: () => void;
}) {
  if (loading) return <p className="text-sm text-muted">Uplink establishing…</p>;
  if (error) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-danger">Could not reach the Origin System feed.</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="text-accent underline-offset-2 hover:underline">
            Retry
          </button>
        ) : null}
      </div>
    );
  }
  if (empty) return <p className="text-sm text-muted">Nothing live right now.</p>;
  return null;
}

export function SectionLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to as never}
      className={cn(
        "font-display text-[0.68rem] uppercase tracking-[0.16em] text-accent hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}
