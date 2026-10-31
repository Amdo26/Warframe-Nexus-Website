import { Link, createFileRoute } from "@tanstack/react-router";
import { CycleRing } from "@/components/hud/cycle-ring";
import { Countdown } from "@/components/hud/countdown";
import { ItemArt } from "@/components/hud/item-art";
import { FissureRow, SectionLink, SortieCard, StatusNote } from "@/components/hud/world-bits";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNewsDate, isLive, marketAsset } from "@/lib/wf/format";
import { useNow, useRecentOrders, useWorldState } from "@/lib/wf/hooks";

export const Route = createFileRoute("/")({ component: Command });

function Command() {
  const world = useWorldState();
  const recent = useRecentOrders();
  const data = world.data;
  const cycles = (data?.cycles ?? []).filter((c) =>
    ["cetus", "vallis", "cambion", "zariman", "duviri"].includes(c.id),
  );
  const now = useNow(5000);
  const fissures = (data?.fissures ?? [])
    .filter((f) => isLive(f.expiry, now) && !f.isHard && !f.isStorm)
    .slice(0, 8);
  const dailies = (data?.nightwave?.challenges ?? []).filter((c) => c.isDaily).slice(0, 4);
  const trader = data?.trader
    ? {
        ...data.trader,
        active:
          now >= new Date(data.trader.activation).getTime() && isLive(data.trader.expiry, now),
      }
    : data?.trader;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-accent">Live uplink</p>
          <h1 className="mt-1 font-display text-4xl tracking-[0.12em] text-fg md:text-5xl">COMMAND</h1>
          <p className="mt-2 max-w-xl text-muted">
            World state, codex, trading floor, and relic intel — the Orbiter tools, in one pane of glass.
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-subtle">Platform</p>
          <p className="font-display text-lg uppercase tracking-[0.16em] text-fg">{data?.platform ?? "pc"}</p>
        </div>
      </header>

      {world.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cycles.map((c) => (
            <div key={c.id} className="rounded-xl bg-surface p-3 hairline">
              <CycleRing cycle={c} />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel kicker="Daily" title="Sortie" className="lg:col-span-1">
          {world.isPending ? (
            <Skeleton className="h-40" />
          ) : (
            <SortieCard title="Sortie" data={data?.sortie} />
          )}
        </Panel>
        <Panel kicker="Weekly" title="Archon Hunt">
          {world.isPending ? (
            <Skeleton className="h-40" />
          ) : (
            <SortieCard title="Archon Hunt" data={data?.archonHunt} />
          )}
        </Panel>
        <Panel kicker="Void trader" title="Baro Ki'Teer">
          {trader ? (
            <div className="space-y-3">
              <p className="font-display text-lg text-fg">{trader.location || "In transit"}</p>
              <p className="text-sm text-muted">
                {trader.active ? "Docked" : "Arrives in"}{" "}
                <Countdown expiry={trader.active ? trader.expiry : trader.activation} />
              </p>
              {trader.active && trader.inventory.length ? (
                <div>
                  <p className="mb-1 font-display text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
                    {trader.inventory.length} items for sale
                  </p>
                  <ul className="max-h-72 space-y-1 overflow-y-auto pr-1 text-sm text-muted">
                    {trader.inventory.map((it, i) => (
                      <li key={`${it.item}-${i}`} className="flex justify-between gap-2">
                        <span className="min-w-0 flex-1 text-fg">{it.item}</span>
                        <span className="tabular shrink-0 text-right text-accent">
                          {[
                            it.ducats ? `${it.ducats.toLocaleString()} ducats` : "",
                            it.credits ? `${it.credits.toLocaleString()} cr` : "",
                          ]
                            .filter(Boolean)
                            .join(" + ") || "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-subtle">Inventory posts when he docks.</p>
              )}
            </div>
          ) : (
            <StatusNote empty />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel
          title="Fissures"
          action={<SectionLink to="/world">World</SectionLink>}
          className="lg:col-span-3"
        >
          {world.isPending ? (
            <Skeleton className="h-56" />
          ) : fissures.length ? (
            <div>
              {fissures.map((f) => (
                <FissureRow key={f.id} fissure={f} />
              ))}
            </div>
          ) : (
            <StatusNote error={world.error} empty={!world.error} onRetry={() => void world.refetch()} />
          )}
        </Panel>

        <Panel title="Nightwave" className="lg:col-span-2">
          {dailies.length ? (
            <ul className="space-y-3">
              {dailies.map((c) => (
                <li key={c.id} className="rounded-md bg-elevated px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-fg">{c.title}</p>
                    <Badge tone="accent">{c.reputation}</Badge>
                  </div>
                  <p className="text-xs text-subtle">{c.desc}</p>
                </li>
              ))}
            </ul>
          ) : (
            <StatusNote loading={world.isPending} empty />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Dispatches" action={<SectionLink to="/world">All news</SectionLink>}>
          <div className="space-y-3">
            {(data?.news ?? []).slice(0, 6).map((n) => (
              <a
                key={n.id}
                href={n.link || undefined}
                target="_blank"
                rel="noreferrer"
                className="flex gap-3 rounded-md p-1 hover:bg-elevated"
              >
                <div className="size-12 shrink-0 overflow-hidden rounded-md bg-elevated">
                  <ItemArt src={n.image} alt={n.message} className="size-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-fg">{n.message}</p>
                  <p className="text-xs text-subtle">
                    {n.primeAccess ? "Prime Access" : n.update ? "Update" : ""}
                    {formatNewsDate(n.date)
                      ? `${n.primeAccess || n.update ? " · " : ""}${formatNewsDate(n.date)}`
                      : ""}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </Panel>

        <Panel title="Trading floor" action={<SectionLink to="/market">Market</SectionLink>}>
          {recent.isPending ? (
            <Skeleton className="h-56" />
          ) : (
            <ul className="space-y-2">
              {(recent.data ?? []).slice(0, 10).map((o) => (
                <li key={o.id}>
                  {o.item ? (
                    <Link
                      to="/market/$slug"
                      params={{ slug: o.item.slug }}
                      className="flex items-center gap-3 rounded-md px-1 py-1 hover:bg-elevated"
                    >
                      <div className="size-9 overflow-hidden rounded-sm bg-elevated">
                        <ItemArt src={marketAsset(o.item.thumb)} alt={o.item.name} className="size-full" />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm">{o.item.name}</span>
                      <Badge tone={o.type === "sell" ? "ok" : "live"}>{o.type}</Badge>
                      <span className="tabular font-display text-sm text-accent">{o.platinum}p</span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>{o.user}</span>
                      <span className="tabular text-accent">{o.platinum}p</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {data?.events?.[0] ? (
        <Panel kicker="Active" title={data.events[0].description}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{data.events[0].node}</p>
            {typeof data.events[0].health === "number" ? (
              <p className="tabular text-sm text-fg">Hull {data.events[0].health.toFixed(1)}%</p>
            ) : null}
            <Countdown expiry={data.events[0].expiry} />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
