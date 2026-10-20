import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AcquisitionLine } from "@/components/hud/acquisition";
import { ItemArt } from "@/components/hud/item-art";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusNote } from "@/components/hud/world-bits";
import { formatNumber, wfImage } from "@/lib/wf/format";
import { useCodex } from "@/lib/wf/hooks";
import type { WeaponItem } from "@/lib/wf/types";

export const Route = createFileRoute("/codex/")({ component: CodexPage });

function CodexPage() {
  const { data, isPending, error, refetch } = useCodex();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"warframes" | "primary" | "secondary" | "melee">("warframes");
  const query = q.trim().toLowerCase();

  const frames = useMemo(() => {
    const list = data?.warframes ?? [];
    return list.filter((f) => !query || f.name.toLowerCase().includes(query));
  }, [data?.warframes, query]);

  const weapons = useMemo(() => {
    const list = data?.weapons ?? [];
    return list.filter((w) => {
      if (tab === "primary" && w.category !== "Primary") return false;
      if (tab === "secondary" && w.category !== "Secondary") return false;
      if (tab === "melee" && w.category !== "Melee") return false;
      if (query && !w.name.toLowerCase().includes(query) && !w.type.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [data?.weapons, query, tab]);

  const tabs = [
    { id: "warframes" as const, label: "Warframes" },
    { id: "primary" as const, label: "Primary" },
    { id: "secondary" as const, label: "Secondary" },
    { id: "melee" as const, label: "Melee" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-accent">Wiki</p>
          <h1 className="mt-1 font-display text-4xl tracking-[0.12em]">CODEX</h1>
          <p className="mt-2 max-w-xl text-muted">
            Frames, arms, and stats — a readable codex without the wiki maze.
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the arsenal…"
          className="max-w-xs"
        />
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}>
            <Badge tone={tab === t.id ? "accent" : "outline"}>{t.label}</Badge>
          </button>
        ))}
      </div>

      {error ? <StatusNote error={error} onRetry={() => void refetch()} /> : null}

      {isPending ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : tab === "warframes" ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {frames.map((f) => (
            <Link
              key={f.slug}
              to="/codex/$slug"
              params={{ slug: f.slug }}
              className="group rounded-xl bg-surface p-3 hairline transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <div className="aspect-square overflow-hidden rounded-md bg-elevated">
                <ItemArt src={wfImage(f.imageName)} alt={f.name} className="size-full" />
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <p className="font-display text-sm text-fg group-hover:text-accent">{f.name}</p>
                {f.isPrime ? <Badge tone="accent">Prime</Badge> : null}
              </div>
              <p className="mt-1 tabular text-xs text-muted">
                HP {f.health} · SH {f.shield} · AR {f.armor}
              </p>
              <AcquisitionLine summary={f.acquisition.summary} vaulted={f.acquisition.vaulted} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface hairline">
          <div className="hidden grid-cols-[1.6fr_7rem_7rem_minmax(8rem,1fr)] border-b border-border px-4 py-2 font-display text-[0.65rem] uppercase tracking-[0.16em] text-subtle md:grid">
            <span>Weapon</span>
            <span>Damage</span>
            <span>MR</span>
            <span>Acquisition</span>
          </div>
          {weapons.map((w) => (
            <WeaponRow key={w.slug} weapon={w} />
          ))}
        </div>
      )}
    </div>
  );
}

function WeaponRow({ weapon }: { weapon: WeaponItem }) {
  return (
    <Link
      to="/codex/$slug"
      params={{ slug: weapon.slug }}
      className="grid grid-cols-[auto_1fr] items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-elevated md:grid-cols-[1.6fr_7rem_7rem_minmax(8rem,1fr)]"
    >
      <div className="flex items-center gap-3">
        <div className="size-10 overflow-hidden rounded-sm bg-elevated">
          <ItemArt src={wfImage(weapon.imageName)} alt={weapon.name} className="size-full" />
        </div>
        <div>
          <p className="text-sm text-fg">{weapon.name}</p>
          <p className="text-xs text-subtle">{weapon.type}</p>
        </div>
      </div>
      <span className="hidden tabular text-sm md:block">{formatNumber(weapon.totalDamage)}</span>
      <span className="hidden tabular text-sm md:block">{weapon.masteryReq}</span>
      <span className="hidden truncate text-sm text-muted md:block">
        {weapon.acquisition.vaulted ? "Vaulted · " : ""}
        {weapon.acquisition.summary}
      </span>
    </Link>
  );
}
