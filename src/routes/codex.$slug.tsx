import { Link, createFileRoute } from "@tanstack/react-router";
import { Bookmark, ExternalLink } from "lucide-react";
import { AcquisitionPanel } from "@/components/hud/acquisition";
import { ItemArt } from "@/components/hud/item-art";
import { Polarities } from "@/components/hud/polarity";
import { StatBar } from "@/components/hud/stat-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusNote } from "@/components/hud/world-bits";
import { useNexus } from "@/lib/stores";
import { formatNumber, marketNameToSlug, pct, wfImage, wikiUrl } from "@/lib/wf/format";
import { useCodexItem } from "@/lib/wf/hooks";
import type { WarframeItem, WeaponItem } from "@/lib/wf/types";

export const Route = createFileRoute("/codex/$slug")({ component: CodexDetail });

function CodexDetail() {
  const { slug } = Route.useParams();
  const { data, isPending, error, refetch } = useCodexItem(slug);
  const owned = useNexus((s) => s.owned);
  const toggleOwned = useNexus((s) => s.toggleOwned);
  const foundry = useNexus((s) => s.foundry);
  const toggleFoundry = useNexus((s) => s.toggleFoundry);

  if (isPending) {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (error) return <StatusNote error={error} onRetry={() => void refetch()} />;
  if (!data) return <StatusNote empty />;

  const isOwned = owned.some((o) => o.slug === data.slug);
  const inFoundry = foundry.some((o) => o.slug === data.slug);
  const marketSlug = marketNameToSlug(data.name);

  return (
    <div className="space-y-6">
      <p className="font-display text-[0.7rem] uppercase tracking-[0.22em] text-muted">
        <Link to="/codex" className="hover:text-accent">
          Codex
        </Link>
        <span className="mx-2 text-subtle">/</span>
        {data.kind}
      </p>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Panel>
          <div className="aspect-square overflow-hidden rounded-lg bg-elevated">
            <ItemArt src={wfImage(data.imageName)} alt={data.name} className="size-full" />
          </div>
          <h1 className="mt-4 font-display text-3xl tracking-[0.08em]">{data.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.isPrime ? <Badge tone="accent">Prime</Badge> : null}
            {data.acquisition.vaulted ? <Badge tone="live">Vaulted</Badge> : null}
            <Badge tone="outline">MR {data.masteryReq}</Badge>
            {"type" in data ? <Badge tone="outline">{data.type}</Badge> : null}
          </div>
          <p className="mt-3 text-sm text-muted">{data.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={isOwned ? "secondary" : "outline"}
              size="sm"
              onClick={() =>
                toggleOwned({ slug: data.slug, name: data.name, kind: data.kind, mastered: false })
              }
            >
              {isOwned ? "In arsenal" : "Mark owned"}
            </Button>
            <Button
              variant={inFoundry ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleFoundry({ slug: data.slug, name: data.name, kind: "codex" })}
            >
              <Bookmark className="size-3.5" />
              Foundry
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={wikiUrl(data.name)} target="_blank" rel="noreferrer">
                Wiki <ExternalLink className="size-3.5" />
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/market/$slug" params={{ slug: marketSlug }}>
                Market
              </Link>
            </Button>
          </div>
        </Panel>

        {data.kind === "warframe" ? <WarframeBody item={data} /> : <WeaponBody item={data} />}
      </div>
    </div>
  );
}

function WarframeBody({ item }: { item: WarframeItem }) {
  return (
    <div className="space-y-4">
      <AcquisitionPanel acquisition={item.acquisition} />
      <Panel title="Defenses">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatBar label="Health" value={item.health} max={800} />
          <StatBar label="Shields" value={item.shield} max={800} />
          <StatBar label="Armor" value={item.armor} max={700} />
          <StatBar label="Energy" value={item.power} max={300} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-muted">
            Sprint <span className="tabular text-fg">{item.sprint.toFixed(2)}</span>
          </span>
          <span className="text-muted">
            Polarities <Polarities values={item.polarities} className="ml-2 align-middle" />
          </span>
        </div>
        {item.passive ? <p className="mt-4 text-sm text-muted">{item.passive}</p> : null}
      </Panel>
      <Panel title="Abilities">
        <ol className="space-y-3">
          {item.abilities.map((a, i) => (
            <li key={a.name} className="rounded-lg bg-elevated p-3">
              <p className="font-display text-sm text-accent">
                {String(i + 1).padStart(2, "0")} {a.name}
              </p>
              <p className="mt-1 text-sm text-muted">{a.description.replace(/<[^>]+>/g, "")}</p>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function WeaponBody({ item }: { item: WeaponItem }) {
  const entries = Object.entries(item.damage);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-4">
      <AcquisitionPanel acquisition={item.acquisition} />
      <Panel title="Ballistics">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Damage" value={formatNumber(item.totalDamage)} />
          <Stat label="Crit" value={`${pct(item.critChance, 0)} · ${item.critMult.toFixed(1)}x`} />
          <Stat label="Status" value={pct(item.status, 0)} />
          <Stat label="Fire rate" value={item.fireRate.toFixed(2)} />
          {item.mag != null ? <Stat label="Magazine" value={String(item.mag)} /> : null}
          {item.reload != null ? <Stat label="Reload" value={`${item.reload.toFixed(2)}s`} /> : null}
          {item.trigger ? <Stat label="Trigger" value={item.trigger} /> : null}
          <Stat label="Riven disp." value={item.riven.toFixed(2)} />
        </div>
      </Panel>
      <Panel title="Damage types">
        <div className="space-y-2">
          {entries.map(([k, v]) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.12em] text-muted">
                <span>{k}</span>
                <span className="tabular text-fg">{v}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                <div className="h-full bg-accent" style={{ width: `${(v / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-elevated p-3">
      <p className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="tabular font-display text-lg text-fg">{value}</p>
    </div>
  );
}
