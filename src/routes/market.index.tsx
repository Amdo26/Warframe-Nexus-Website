import { Link, createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemArt } from "@/components/hud/item-art";
import { StatusNote } from "@/components/hud/world-bits";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useNexus } from "@/lib/stores";
import { marketAsset } from "@/lib/wf/format";
import { useMarketCatalog, useRecentOrders } from "@/lib/wf/hooks";

export const Route = createFileRoute("/market/")({ component: MarketPage });

const TAGS = ["all", "warframe", "weapon", "mod", "set", "prime", "arcane"] as const;

function MarketPage() {
  const catalog = useMarketCatalog();
  const recent = useRecentOrders();
  const watchlist = useNexus((s) => s.watchlist);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<(typeof TAGS)[number]>("all");
  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    const list = catalog.data ?? [];
    const scored = list.filter((i) => {
      if (tag !== "all" && !i.tags.includes(tag)) return false;
      if (!query) return true;
      return i.name.toLowerCase().includes(query) || i.slug.includes(query.replace(/ /g, "_"));
    });
    return scored.slice(0, 60);
  }, [catalog.data, query, tag]);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-accent">Trading</p>
        <h1 className="mt-1 font-display text-4xl tracking-[0.12em]">MARKET</h1>
        <p className="mt-2 max-w-xl text-muted">
          Live buy and sell orders, ducat values, and a watchlist — the trading floor without the extra tabs.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search items, primed mods, sets…"
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button key={t} type="button" onClick={() => setTag(t)}>
              <Badge tone={tag === t ? "accent" : "outline"}>{t}</Badge>
            </button>
          ))}
        </div>
      </div>

      {catalog.error ? <StatusNote error={catalog.error} onRetry={() => void catalog.refetch()} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel title={query || tag !== "all" ? "Results" : "Browse"}>
          {catalog.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : results.length ? (
            <ul>
              {results.map((item) => (
                <li key={item.id}>
                  <Link
                    to="/market/$slug"
                    params={{ slug: item.slug }}
                    className="flex items-center gap-3 border-b border-border py-2 last:border-0 hover:bg-elevated"
                  >
                    <div className="size-10 overflow-hidden rounded-sm bg-elevated">
                      <ItemArt src={marketAsset(item.thumb || item.icon)} alt={item.name} className="size-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-fg">{item.name}</p>
                      <p className="truncate text-xs text-subtle">{item.tags.slice(0, 3).join(" · ")}</p>
                    </div>
                    {item.ducats != null ? (
                      <span className="tabular text-xs text-accent">{item.ducats} ducats</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No items match that filter.</p>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Watchlist">
            {watchlist.length ? (
              <ul className="space-y-2">
                {watchlist.map((w) => (
                  <li key={w.slug}>
                    <Link
                      to="/market/$slug"
                      params={{ slug: w.slug }}
                      className="flex items-center gap-2 text-sm text-fg hover:text-accent"
                    >
                      <Star className="size-3.5 text-accent" />
                      {w.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Star items on their order book to pin them here.</p>
            )}
          </Panel>
          <Panel title="Recent orders">
            {recent.isPending ? (
              <Skeleton className="h-48" />
            ) : (
              <ul className="space-y-2">
                {(recent.data ?? []).slice(0, 12).map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                    {o.item ? (
                      <Link to="/market/$slug" params={{ slug: o.item.slug }} className="truncate hover:text-accent">
                        {o.item.name}
                      </Link>
                    ) : (
                      <span className="truncate text-muted">{o.user}</span>
                    )}
                    <span className="tabular text-accent">{o.platinum}p</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
