import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StatusNote } from "@/components/hud/world-bits";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { marketNameToSlug, rarityTone } from "@/lib/wf/format";
import { useMarketCatalog, useRelics } from "@/lib/wf/hooks";
import type { RelicItem, RelicReward } from "@/lib/wf/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/relics")({ component: RelicsPage });

const TIERS = ["All", "Lith", "Meso", "Neo", "Axi", "Requiem"] as const;

function RelicsPage() {
  const relics = useRelics();
  const catalog = useMarketCatalog();
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<(typeof TIERS)[number]>("All");
  const [refine, setRefine] = useState<"intact" | "radiant">("intact");
  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    return (relics.data ?? []).filter((r) => {
      if (tier !== "All" && r.tier !== tier) return false;
      if (!query) return true;
      if (r.key.toLowerCase().includes(query)) return true;
      return r.rewards.some((rw) => rw.itemName.toLowerCase().includes(query));
    });
  }, [relics.data, query, tier]);

  const selected = filtered[0];

  return (
    <div className="space-y-6">
      <header>
        <p className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-accent">Companion</p>
        <h1 className="mt-1 font-display text-4xl tracking-[0.12em]">RELICS</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Intact vs Radiant drop tables, ducat values, and a reverse search for the part you still need.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Relic name or reward (e.g. Rhino Prime Chassis)"
          className="max-w-lg"
        />
        <div className="flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <button key={t} type="button" onClick={() => setTier(t)}>
              <Badge tone={tier === t ? "accent" : "outline"}>{t}</Badge>
            </button>
          ))}
        </div>
      </div>

      {relics.error ? <StatusNote error={relics.error} onRetry={() => void relics.refetch()} /> : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Panel title={`${filtered.length} relics`} padded={false}>
          <div className="max-h-[70vh] overflow-y-auto">
            {relics.isPending ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : (
              filtered.slice(0, 120).map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setQ(r.key)}
                  className={cn(
                    "flex w-full items-center justify-between border-b border-border px-4 py-2 text-left text-sm last:border-0 hover:bg-elevated",
                    selected?.key === r.key && "bg-elevated text-accent",
                  )}
                >
                  <span>
                    {r.tier} {r.name}
                  </span>
                  <span className="text-xs text-subtle">{r.rewards.length}</span>
                </button>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title={selected ? selected.key : "Select a relic"}
          action={
            <Tabs value={refine} onValueChange={(v) => setRefine(v as typeof refine)}>
              <TabsList>
                <TabsTrigger value="intact">Intact</TabsTrigger>
                <TabsTrigger value="radiant">Radiant</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          {selected ? (
            <RewardTable relic={selected} refine={refine} catalog={catalog.data ?? []} />
          ) : (
            <p className="text-sm text-muted">Search a relic or a Prime part to see refinement odds.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function RewardTable({
  relic,
  refine,
  catalog,
}: {
  relic: RelicItem;
  refine: "intact" | "radiant";
  catalog: { slug: string; name: string; ducats?: number }[];
}) {
  const bySlug = new Map(catalog.map((i) => [i.slug, i]));
  return (
    <table className="w-full text-left text-sm">
      <thead className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-subtle">
        <tr>
          <th className="py-2 font-medium">Reward</th>
          <th className="font-medium">Rarity</th>
          <th className="font-medium">Chance</th>
          <th className="font-medium">Ducats</th>
        </tr>
      </thead>
      <tbody>
        {relic.rewards
          .slice()
          .sort((a, b) => chance(b, refine) - chance(a, refine))
          .map((rw) => {
            const slug = marketNameToSlug(rw.itemName);
            const item = bySlug.get(slug) || bySlug.get(`${slug}_blueprint`);
            return (
              <tr key={rw.itemName} className="border-t border-border">
                <td className="py-2">
                  <Link to="/market/$slug" params={{ slug: item?.slug ?? slug }} className="hover:text-accent">
                    {rw.itemName}
                  </Link>
                </td>
                <td className={rarityTone(rw.rarity)}>{rw.rarity}</td>
                <td className="tabular">{chance(rw, refine).toFixed(2)}%</td>
                <td className="tabular text-accent">{item?.ducats ?? "—"}</td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}

function chance(rw: RelicReward, refine: "intact" | "radiant") {
  return refine === "radiant" ? rw.radiant || rw.intact : rw.intact;
}
