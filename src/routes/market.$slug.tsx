import { Link, createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemArt } from "@/components/hud/item-art";
import { StatusNote } from "@/components/hud/world-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useNexus } from "@/lib/stores";
import { marketAsset, slugify } from "@/lib/wf/format";
import { useMarketOrders } from "@/lib/wf/hooks";
import type { MarketOrder } from "@/lib/wf/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market/$slug")({ component: MarketItemPage });

type Presence = "ingame" | "online" | "offline";
type StatusFilter = "all" | Presence;

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ingame", label: "In game" },
  { id: "online", label: "Online" },
  { id: "offline", label: "Offline" },
];

function presenceOf(status: string): Presence {
  const s = status.toLowerCase().replace(/[\s_-]/g, "");
  if (s === "ingame") return "ingame";
  if (s === "online") return "online";
  return "offline";
}

function MarketItemPage() {
  const { slug } = Route.useParams();
  const { data, isPending, error, refetch } = useMarketOrders(slug);
  const watchlist = useNexus((s) => s.watchlist);
  const toggleWatch = useNexus((s) => s.toggleWatch);
  const [status, setStatus] = useState<StatusFilter>("all");
  const item = data?.item;
  const watched = watchlist.some((w) => w.slug === slug);

  const sells = useMemo(
    () => filterOrders(data?.sells ?? [], status),
    [data?.sells, status],
  );
  const buys = useMemo(
    () => filterOrders(data?.buys ?? [], status),
    [data?.buys, status],
  );
  const lowSell = sells[0]?.platinum;
  const highBuy = buys[0]?.platinum;

  return (
    <div className="space-y-6">
      <p className="font-display text-[0.7rem] uppercase tracking-[0.22em] text-muted">
        <Link to="/market" className="hover:text-accent">
          Market
        </Link>
        <span className="mx-2 text-subtle">/</span>
        {item?.name ?? slug}
      </p>

      {isPending ? (
        <Skeleton className="h-32" />
      ) : error ? (
        <StatusNote error={error} onRetry={() => void refetch()} />
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          <div className="size-20 overflow-hidden rounded-lg bg-elevated">
            <ItemArt src={marketAsset(item?.icon || item?.thumb)} alt={item?.name ?? slug} className="size-full" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl tracking-[0.08em]">{item?.name ?? slug}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {(item?.tags ?? []).slice(0, 6).map((t) => (
                <Badge key={t} tone="outline">
                  {t}
                </Badge>
              ))}
              {item?.ducats != null ? <Badge tone="accent">{item.ducats} ducats</Badge> : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={watched ? "default" : "outline"}
              onClick={() => toggleWatch({ slug, name: item?.name ?? slug, kind: "market" })}
            >
              <Star className="size-4" />
              {watched ? "Watching" : "Watch"}
            </Button>
            <Button asChild variant="ghost">
              <Link to="/codex/$slug" params={{ slug: slugify(item?.name ?? slug) }}>
                Codex
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Lowest sell" value={lowSell != null ? `${lowSell}p` : "—"} />
        <Stat label="Highest buy" value={highBuy != null ? `${highBuy}p` : "—"} />
        <Stat
          label="Spread"
          value={lowSell != null && highBuy != null ? `${lowSell - highBuy}p` : "—"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setStatus(f.id)}>
            <Badge tone={status === f.id ? "accent" : "outline"}>{f.label}</Badge>
          </button>
        ))}
        <span className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-subtle">
          In game, then online, then offline
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OrderBook title="Sellers" orders={sells} loading={isPending} tone="ok" />
        <OrderBook title="Buyers" orders={buys} loading={isPending} tone="live" />
      </div>
    </div>
  );
}

function filterOrders(orders: MarketOrder[], status: StatusFilter) {
  if (status === "all") return orders;
  return orders.filter((o) => presenceOf(o.status) === status);
}

function statusLabel(status: string) {
  const p = presenceOf(status);
  if (p === "ingame") return "In game";
  if (p === "online") return "Online";
  return "Offline";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-4 hairline">
      <p className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="tabular font-display text-2xl text-accent">{value}</p>
    </div>
  );
}

function OrderBook({
  title,
  orders,
  loading,
  tone,
}: {
  title: string;
  orders: MarketOrder[];
  loading: boolean;
  tone: "ok" | "live";
}) {
  return (
    <Panel title={title}>
      {loading ? (
        <Skeleton className="h-64" />
      ) : orders.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-subtle">
              <tr>
                <th className="py-2 font-medium">Platinum</th>
                <th className="font-medium">Qty</th>
                <th className="font-medium">User</th>
                <th className="font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className={cn("py-2 tabular font-display", tone === "ok" ? "text-ok" : "text-live")}>
                    {o.platinum}p
                    {o.rank != null ? <span className="ml-1 text-xs text-subtle">R{o.rank}</span> : null}
                  </td>
                  <td className="tabular text-muted">{o.quantity}</td>
                  <td className="text-fg">{o.user}</td>
                  <td>
                    <Badge tone={presenceOf(o.status) === "ingame" ? "ok" : presenceOf(o.status) === "online" ? "live" : "outline"}>
                      {statusLabel(o.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">No visible orders in the last 48 hours.</p>
      )}
    </Panel>
  );
}
