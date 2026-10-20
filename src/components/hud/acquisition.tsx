import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { formatNumber } from "@/lib/wf/format";
import type { Acquisition } from "@/lib/wf/types";

export function AcquisitionPanel({ acquisition }: { acquisition: Acquisition }) {
  const parts = new Map<string, typeof acquisition.sources>();
  for (const src of acquisition.sources) {
    const list = parts.get(src.part) ?? [];
    list.push(src);
    parts.set(src.part, list);
  }

  return (
    <Panel title="Acquisition">
      <div className="flex flex-wrap gap-2">
        {acquisition.summary ? <Badge tone="accent">{acquisition.summary}</Badge> : null}
        {acquisition.vaulted ? <Badge tone="live">Vaulted</Badge> : null}
        {acquisition.introduced ? <Badge tone="outline">{acquisition.introduced}</Badge> : null}
        {acquisition.marketCost != null ? (
          <Badge tone="outline">{acquisition.marketCost}p market</Badge>
        ) : null}
        {acquisition.bpCost != null ? (
          <Badge tone="outline">{formatNumber(acquisition.bpCost)} cr blueprint</Badge>
        ) : null}
      </div>

      {parts.size ? (
        <ul className="mt-4 space-y-3">
          {[...parts.entries()].map(([part, drops]) => (
            <li key={part}>
              <p className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-accent">{part}</p>
              <ul className="mt-1 space-y-1">
                {drops.map((d) => (
                  <li key={`${d.part}-${d.location}`} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 text-muted">{d.location}</span>
                    <span className="shrink-0 tabular text-xs text-subtle">
                      {d.rarity ? `${d.rarity} · ` : ""}
                      {d.chance != null ? `${d.chance % 1 ? d.chance.toFixed(1) : d.chance}%` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">
          {acquisition.summary}. No public drop table is listed for the main parts — check the wiki for lab
          research, quests, or nightwave offerings.
        </p>
      )}
    </Panel>
  );
}

export function AcquisitionLine({ summary, vaulted }: { summary?: string; vaulted?: boolean }) {
  if (!summary && !vaulted) return null;
  const text = summary?.toLowerCase().startsWith("vaulted")
    ? summary
    : vaulted
      ? `Vaulted${summary ? ` · ${summary}` : ""}`
      : summary;
  return <p className="mt-1 truncate text-[0.7rem] text-subtle">{text}</p>;
}
