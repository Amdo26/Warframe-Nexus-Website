import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { ItemArt } from "@/components/hud/item-art";
import { StatusNote } from "@/components/hud/world-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHasHydrated, useNexus } from "@/lib/stores";
import { marketAsset, wfImage } from "@/lib/wf/format";
import { useCodex, useMarketCatalog } from "@/lib/wf/hooks";
import type { WarframeItem, WeaponItem } from "@/lib/wf/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/arsenal")({ component: ArsenalPage });

type TrackFilter = "all" | "missing" | "owned" | "mastered" | "prime";

function ArsenalPage() {
  const hydrated = useHasHydrated();
  const owned = useNexus((s) => s.owned);
  const markProgress = useNexus((s) => s.markProgress);
  const watchlist = useNexus((s) => s.watchlist);
  const foundry = useNexus((s) => s.foundry);
  const toggleFoundry = useNexus((s) => s.toggleFoundry);
  const toggleWatch = useNexus((s) => s.toggleWatch);
  const toggleOwned = useNexus((s) => s.toggleOwned);
  const codex = useCodex();
  const market = useMarketCatalog();

  const frames = codex.data?.warframes ?? [];
  const weapons = codex.data?.weapons ?? [];
  const ownedMap = useMemo(() => new Map(owned.map((o) => [o.slug, o])), [owned]);

  const frameOwned = frames.filter((f) => ownedMap.has(f.slug)).length;
  const frameMastered = frames.filter((f) => ownedMap.get(f.slug)?.mastered).length;
  const weaponOwned = weapons.filter((w) => ownedMap.has(w.slug)).length;
  const weaponMastered = weapons.filter((w) => ownedMap.get(w.slug)?.mastered).length;

  const ducatTotal = watchlist.reduce((sum, w) => {
    const item = (market.data ?? []).find((i) => i.slug === w.slug);
    return sum + (item?.ducats ?? 0);
  }, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-accent">Companion</p>
        <h1 className="mt-1 font-display text-4xl tracking-[0.12em]">ARSENAL</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Collection tracker for every frame and weapon in the live Codex. Marks stay on this device.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <ProgressStat
          label="Warframes"
          owned={hydrated ? frameOwned : 0}
          mastered={hydrated ? frameMastered : 0}
          total={frames.length}
        />
        <ProgressStat
          label="Weapons"
          owned={hydrated ? weaponOwned : 0}
          mastered={hydrated ? weaponMastered : 0}
          total={weapons.length}
        />
        <Stat label="Watchlist ducats" value={hydrated ? String(ducatTotal) : "—"} />
      </div>

      {codex.error ? <StatusNote error={codex.error} onRetry={() => void codex.refetch()} /> : null}

      <Tabs defaultValue="warframes">
        <TabsList className="flex h-auto w-full flex-wrap">
          <TabsTrigger value="warframes">Warframes</TabsTrigger>
          <TabsTrigger value="weapons">Weapons</TabsTrigger>
          <TabsTrigger value="foundry">Foundry {hydrated && foundry.length ? `(${foundry.length})` : ""}</TabsTrigger>
          <TabsTrigger value="watch">Watchlist {hydrated && watchlist.length ? `(${watchlist.length})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="warframes" className="mt-4">
          {codex.isPending ? (
            <SkeletonGrid />
          ) : (
            <TrackerGrid
              items={frames}
              ownedMap={ownedMap}
              hydrated={hydrated}
              onToggle={(item, field) => {
                const cur = ownedMap.get(item.slug);
                if (field === "owned") {
                  markProgress(
                    { slug: item.slug, name: item.name, kind: "warframe", mastered: false },
                    { owned: !cur },
                  );
                } else {
                  markProgress(
                    { slug: item.slug, name: item.name, kind: "warframe", mastered: false },
                    { owned: true, mastered: !cur?.mastered },
                  );
                }
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="weapons" className="mt-4">
          {codex.isPending ? (
            <SkeletonGrid />
          ) : (
            <WeaponTracker
              items={weapons}
              ownedMap={ownedMap}
              hydrated={hydrated}
              onToggle={(item, field) => {
                const cur = ownedMap.get(item.slug);
                if (field === "owned") {
                  markProgress(
                    { slug: item.slug, name: item.name, kind: "weapon", mastered: false },
                    { owned: !cur },
                  );
                } else {
                  markProgress(
                    { slug: item.slug, name: item.name, kind: "weapon", mastered: false },
                    { owned: true, mastered: !cur?.mastered },
                  );
                }
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="foundry" className="mt-4">
          <Panel title="Foundry queue">
            {!hydrated ? (
              <Skeleton className="h-32" />
            ) : foundry.length ? (
              <ul className="space-y-2">
                {foundry.map((f) => {
                  const frame = frames.find((x) => x.slug === f.slug);
                  const weapon = weapons.find((x) => x.slug === f.slug);
                  const img = frame?.imageName || weapon?.imageName;
                  return (
                    <li key={f.slug} className="flex items-center gap-3 rounded-md bg-elevated px-3 py-2">
                      <div className="size-10 overflow-hidden rounded-sm bg-bg">
                        <ItemArt src={wfImage(img)} alt={f.name} className="size-full" />
                      </div>
                      <Link
                        to="/codex/$slug"
                        params={{ slug: f.slug }}
                        className="min-w-0 flex-1 truncate text-sm hover:text-accent"
                      >
                        {f.name}
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const kind = frame ? "warframe" : "weapon";
                          markProgress(
                            { slug: f.slug, name: f.name, kind, mastered: false },
                            { owned: true },
                          );
                          toggleFoundry(f);
                        }}
                      >
                        Built
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleFoundry(f)}>
                        Remove
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                Pin a build from any Codex page — it lands here until you mark it built.
              </p>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="watch" className="mt-4">
          <Panel title="Trading watchlist">
            {!hydrated ? (
              <Skeleton className="h-32" />
            ) : watchlist.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {watchlist.map((w) => {
                  const item = (market.data ?? []).find((i) => i.slug === w.slug);
                  return (
                    <li key={w.slug} className="flex items-center gap-3 rounded-md bg-elevated px-3 py-2">
                      <div className="size-10 overflow-hidden rounded-sm bg-bg">
                        <ItemArt src={marketAsset(item?.thumb || item?.icon)} alt={w.name} className="size-full" />
                      </div>
                      <Link
                        to="/market/$slug"
                        params={{ slug: w.slug }}
                        className="min-w-0 flex-1 truncate text-sm hover:text-accent"
                      >
                        {w.name}
                        {item?.ducats != null ? (
                          <span className="ml-2 text-xs text-accent">{item.ducats} ducats</span>
                        ) : null}
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => toggleWatch(w)}>
                        Remove
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">Star listings on the market to track platinum and ducats.</p>
            )}
          </Panel>
        </TabsContent>
      </Tabs>

      {hydrated && owned.length > 0 && frames.length === 0 ? (
        <Panel title="Saved marks">
          <ul className="space-y-2">
            {owned.map((o) => (
              <li key={o.slug} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {o.name} {o.mastered ? "· mastered" : ""}
                </span>
                <Button variant="ghost" size="sm" onClick={() => toggleOwned(o)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function TrackerGrid({
  items,
  ownedMap,
  hydrated,
  onToggle,
}: {
  items: WarframeItem[];
  ownedMap: Map<string, { mastered: boolean }>;
  hydrated: boolean;
  onToggle: (item: WarframeItem, field: "owned" | "mastered") => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<TrackFilter>("all");
  const query = q.trim().toLowerCase();
  const shown = items.filter((f) => {
    if (query && !f.name.toLowerCase().includes(query)) return false;
    const entry = ownedMap.get(f.slug);
    if (filter === "missing") return !entry;
    if (filter === "owned") return Boolean(entry);
    if (filter === "mastered") return Boolean(entry?.mastered);
    if (filter === "prime") return f.isPrime;
    return true;
  });

  return (
    <div className="space-y-4">
      <TrackerToolbar q={q} setQ={setQ} filter={filter} setFilter={setFilter} count={shown.length} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {shown.map((f) => {
          const entry = hydrated ? ownedMap.get(f.slug) : undefined;
          return (
            <article
              key={f.slug}
              className={cn(
                "rounded-xl bg-surface p-3 hairline",
                entry ? "shadow-[var(--shadow-border-hover)]" : "",
              )}
            >
              <Link to="/codex/$slug" params={{ slug: f.slug }} className="block">
                <div className="aspect-square overflow-hidden rounded-md bg-elevated">
                  <ItemArt src={wfImage(f.imageName)} alt={f.name} className="size-full" />
                </div>
                <p className="mt-2 truncate font-display text-sm text-fg">{f.name}</p>
                <p className="truncate text-[0.65rem] text-subtle">{f.acquisition.summary}</p>
              </Link>
              <div className="mt-2 flex gap-1">
                <MarkButton
                  active={Boolean(entry)}
                  onClick={() => onToggle(f, "owned")}
                  label={entry ? "Owned" : "Own"}
                />
                <MarkButton
                  active={Boolean(entry?.mastered)}
                  onClick={() => onToggle(f, "mastered")}
                  label="MR"
                />
              </div>
            </article>
          );
        })}
      </div>
      {shown.length === 0 ? <p className="text-sm text-muted">Nothing matches that filter.</p> : null}
    </div>
  );
}

function WeaponTracker({
  items,
  ownedMap,
  hydrated,
  onToggle,
}: {
  items: WeaponItem[];
  ownedMap: Map<string, { mastered: boolean }>;
  hydrated: boolean;
  onToggle: (item: WeaponItem, field: "owned" | "mastered") => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<TrackFilter>("all");
  const [cat, setCat] = useState<"all" | "Primary" | "Secondary" | "Melee">("all");
  const query = q.trim().toLowerCase();
  const shown = items.filter((w) => {
    if (cat !== "all" && w.category !== cat) return false;
    if (query && !w.name.toLowerCase().includes(query) && !w.type.toLowerCase().includes(query)) return false;
    const entry = ownedMap.get(w.slug);
    if (filter === "missing") return !entry;
    if (filter === "owned") return Boolean(entry);
    if (filter === "mastered") return Boolean(entry?.mastered);
    if (filter === "prime") return w.isPrime;
    return true;
  });

  return (
    <div className="space-y-4">
      <TrackerToolbar q={q} setQ={setQ} filter={filter} setFilter={setFilter} count={shown.length}>
        {(["all", "Primary", "Secondary", "Melee"] as const).map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)}>
            <Badge tone={cat === c ? "accent" : "outline"}>{c}</Badge>
          </button>
        ))}
      </TrackerToolbar>
      <div className="overflow-hidden rounded-2xl bg-surface hairline">
        {shown.slice(0, 180).map((w) => {
          const entry = hydrated ? ownedMap.get(w.slug) : undefined;
          return (
            <div
              key={w.slug}
              className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-0"
            >
              <div className="size-10 overflow-hidden rounded-sm bg-elevated">
                <ItemArt src={wfImage(w.imageName)} alt={w.name} className="size-full" />
              </div>
              <Link to="/codex/$slug" params={{ slug: w.slug }} className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg hover:text-accent">{w.name}</p>
                <p className="truncate text-xs text-subtle">
                  {w.type} · {w.acquisition.summary}
                </p>
              </Link>
              <MarkButton
                active={Boolean(entry)}
                onClick={() => onToggle(w, "owned")}
                label={entry ? "Owned" : "Own"}
              />
              <MarkButton
                active={Boolean(entry?.mastered)}
                onClick={() => onToggle(w, "mastered")}
                label="MR"
              />
            </div>
          );
        })}
      </div>
      {shown.length > 180 ? (
        <p className="text-xs text-subtle">Showing 180 of {shown.length} — narrow the search.</p>
      ) : null}
      {shown.length === 0 ? <p className="text-sm text-muted">Nothing matches that filter.</p> : null}
    </div>
  );
}

function TrackerToolbar({
  q,
  setQ,
  filter,
  setFilter,
  count,
  children,
}: {
  q: string;
  setQ: (v: string) => void;
  filter: TrackFilter;
  setFilter: (v: TrackFilter) => void;
  count: number;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the tracker…"
        className="max-w-xs"
      />
      <div className="flex flex-wrap gap-2">
        {children}
        {(["all", "missing", "owned", "mastered", "prime"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}>
            <Badge tone={filter === f ? "accent" : "outline"}>{f}</Badge>
          </button>
        ))}
      </div>
      <span className="font-display text-xs uppercase tracking-[0.16em] text-subtle">{count} listed</span>
    </div>
  );
}

function MarkButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-md px-2 font-display text-[0.62rem] uppercase tracking-[0.12em]",
        active ? "bg-accent text-bg" : "bg-elevated text-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}

function ProgressStat({
  label,
  owned,
  mastered,
  total,
}: {
  label: string;
  owned: number;
  mastered: number;
  total: number;
}) {
  const pct = total ? Math.round((owned / total) * 100) : 0;
  return (
    <div className="rounded-xl bg-surface p-4 hairline">
      <p className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="tabular font-display text-2xl text-fg">
        {owned}
        <span className="text-lg text-muted">/{total || "—"}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-subtle">{mastered} mastered</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-4 hairline">
      <p className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="tabular font-display text-3xl text-fg">{value}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  );
}
