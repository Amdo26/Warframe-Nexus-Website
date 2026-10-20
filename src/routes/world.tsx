import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Countdown } from "@/components/hud/countdown";
import { FissureRow, InvasionRow, SortieCard, StatusNote } from "@/components/hud/world-bits";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isLive } from "@/lib/wf/format";
import { useNow, useWorldState } from "@/lib/wf/hooks";

export const Route = createFileRoute("/world")({ component: WorldPage });

function WorldPage() {
  const world = useWorldState();
  const data = world.data;
  const [tier, setTier] = useState("all");
  const [lane, setLane] = useState<"all" | "normal" | "hard" | "storm">("all");

  const clock = useNow(5000);
  const fissures = useMemo(() => {
    return (data?.fissures ?? []).filter((f) => {
      if (!isLive(f.expiry, clock)) return false;
      if (tier !== "all" && f.tier !== tier) return false;
      if (lane === "hard" && !f.isHard) return false;
      if (lane === "storm" && !f.isStorm) return false;
      if (lane === "normal" && (f.isHard || f.isStorm)) return false;
      return true;
    });
  }, [data?.fissures, tier, lane, clock]);

  const tiers = ["all", "Lith", "Meso", "Neo", "Axi", "Requiem"];

  return (
    <div className="space-y-6">
      <header>
        <p className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-accent">Hub</p>
        <h1 className="mt-1 font-display text-4xl tracking-[0.12em]">WORLD STATE</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Fissures, invasions, Nightwave, bounties, and the rest of the Origin System clock.
        </p>
        {world.dataUpdatedAt ? (
          <p className="mt-1 text-xs text-subtle">
            Synced {Math.max(0, Math.round((clock - world.dataUpdatedAt) / 1000))}s ago
            {world.isFetching ? " · refreshing…" : ""}
          </p>
        ) : null}
      </header>

      {world.isError ? (
        <StatusNote error={world.error} onRetry={() => void world.refetch()} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Sortie">
          <SortieCard title="Sortie" data={data?.sortie} />
        </Panel>
        <Panel title="Archon Hunt">
          <SortieCard title="Archon Hunt" data={data?.archonHunt} />
        </Panel>
      </div>

      <Panel title="Void Fissures">
        <div className="mb-4 flex flex-wrap gap-2">
          {tiers.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className="rounded-sm"
            >
              <Badge tone={tier === t ? "accent" : "outline"}>{t}</Badge>
            </button>
          ))}
          {(["all", "normal", "hard", "storm"] as const).map((l) => (
            <button key={l} type="button" onClick={() => setLane(l)}>
              <Badge tone={lane === l ? "live" : "outline"}>
                {l === "hard" ? "Steel Path" : l}
              </Badge>
            </button>
          ))}
        </div>
        {fissures.length ? (
          fissures.map((f) => <FissureRow key={f.id} fissure={f} />)
        ) : (
          <StatusNote loading={world.isPending} empty />
        )}
      </Panel>

      <Tabs defaultValue="invasions">
        <TabsList>
          <TabsTrigger value="invasions">Invasions</TabsTrigger>
          <TabsTrigger value="nightwave">Nightwave</TabsTrigger>
          <TabsTrigger value="bounties">Bounties</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
        <TabsContent value="invasions" className="mt-4">
          <Panel padded={false}>
            <div className="px-4 pb-2">
              {(data?.invasions ?? []).length ? (
                data?.invasions.map((i) => <InvasionRow key={i.id} invasion={i} />)
              ) : (
                <div className="p-4">
                  <StatusNote loading={world.isPending} empty />
                </div>
              )}
            </div>
          </Panel>
        </TabsContent>
        <TabsContent value="nightwave" className="mt-4">
          <Panel title={data?.nightwave ? `Season ${data.nightwave.season}` : "Nightwave"}>
            <ul className="grid gap-3 md:grid-cols-2">
              {(data?.nightwave?.challenges ?? []).map((c) => (
                <li key={c.id} className="rounded-lg bg-elevated p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-sm text-fg">{c.title}</p>
                    <Badge tone={c.isElite ? "danger" : c.isDaily ? "live" : "accent"}>
                      {c.isElite ? "Elite" : c.isDaily ? "Daily" : "Weekly"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{c.desc}</p>
                  <div className="mt-2 flex justify-between text-xs text-subtle">
                    <span>{c.reputation} standing</span>
                    <Countdown expiry={c.expiry} compact />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>
        <TabsContent value="bounties" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {(data?.syndicates ?? []).map((s) => (
              <Panel key={s.syndicate} title={s.syndicate}>
                <ul className="space-y-3">
                  {s.jobs.map((j, idx) => (
                    <li key={`${j.type}-${idx}`} className="rounded-md bg-elevated p-3">
                      <p className="text-sm text-fg">{j.type}</p>
                      <p className="text-xs text-subtle">
                        MR {j.minMR}
                        {j.enemyLevels.length ? ` · Lv ${j.enemyLevels.join("–")}` : ""}
                      </p>
                      {j.rewards.length ? (
                        <p className="mt-1 text-xs text-muted">{j.rewards.join(" · ")}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="events" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Events">
              {(data?.events ?? []).length ? (
                <ul className="space-y-3">
                  {data?.events.map((e) => (
                    <li key={e.id} className="rounded-md bg-elevated p-3">
                      <p className="text-sm text-fg">{e.description}</p>
                      <p className="text-xs text-subtle">{e.node}</p>
                      <Countdown expiry={e.expiry} compact className="text-xs" />
                    </li>
                  ))}
                </ul>
              ) : (
                <StatusNote empty />
              )}
            </Panel>
            <Panel title="Steel Path">
              {data?.steelPath ? (
                <div>
                  <p className="font-display text-lg">{data.steelPath.name}</p>
                  <p className="text-sm text-muted">{data.steelPath.cost} Steel Essence</p>
                  <Countdown expiry={data.steelPath.expiry} className="mt-2 block" />
                </div>
              ) : (
                <StatusNote empty />
              )}
              {data?.deals[0] ? (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="font-display text-[0.65rem] uppercase tracking-[0.16em] text-muted">Darvo</p>
                  <p className="mt-1 text-fg">{data.deals[0].item}</p>
                  <p className="text-sm text-accent">
                    {data.deals[0].salePrice}p{" "}
                    <span className="text-subtle line-through">{data.deals[0].originalPrice}p</span>
                    {" · "}
                    {data.deals[0].discount}% off
                  </p>
                </div>
              ) : null}
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-elevated p-3">
                  <p className="text-xs text-subtle">Fomorian</p>
                  <p className="tabular font-display text-lg">{data?.construction.fomorian.toFixed(1)}%</p>
                </div>
                <div className="rounded-md bg-elevated p-3">
                  <p className="text-xs text-subtle">Razorback</p>
                  <p className="tabular font-display text-lg">{data?.construction.razorback.toFixed(1)}%</p>
                </div>
              </div>
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
