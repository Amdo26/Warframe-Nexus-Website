import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import { BookOpen, Compass, Crosshair, ListChecks, Shield, Sparkles, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { useCodex, useMarketCatalog } from "@/lib/wf/hooks";

const PAGES = [
  { to: "/", label: "Command", icon: Compass },
  { to: "/world", label: "World State", icon: Crosshair },
  { to: "/weeklies", label: "Weeklies", icon: ListChecks },
  { to: "/codex", label: "Codex", icon: BookOpen },
  { to: "/market", label: "Market", icon: Store },
  { to: "/relics", label: "Relics", icon: Sparkles },
  { to: "/arsenal", label: "Arsenal", icon: Shield },
] as const;

const itemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-fg data-[selected=true]:bg-elevated data-[selected=true]:text-accent";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const codex = useCodex();
  const market = useMarketCatalog();
  const query = q.trim().toLowerCase();

  const frames = useMemo(() => {
    const list = codex.data?.warframes ?? [];
    const filtered = query ? list.filter((f) => f.name.toLowerCase().includes(query)) : list.filter((f) => !f.isPrime);
    return filtered.slice(0, 20);
  }, [codex.data?.warframes, query]);

  const weapons = useMemo(() => {
    if (!query) return [];
    return (codex.data?.weapons ?? [])
      .filter((w) => w.name.toLowerCase().includes(query))
      .slice(0, 16);
  }, [codex.data?.weapons, query]);

  const items = useMemo(() => {
    if (!query) return [];
    return (market.data ?? [])
      .filter((i) => i.name.toLowerCase().includes(query) || i.slug.includes(query.replace(/ /g, "_")))
      .slice(0, 20);
  }, [market.data, query]);

  const close = () => {
    setQ("");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-bg/70"
        aria-label="Close search"
        onClick={close}
      />
      <div className="relative mx-auto mt-[12vh] w-[min(640px,calc(100%-1.5rem))] rounded-2xl bg-surface p-2 hairline">
        <Command label="Command" className="flex flex-col" shouldFilter={false}>
          <Command.Input
            autoFocus
            value={q}
            onValueChange={setQ}
            placeholder="Search frames, weapons, market, pages…"
            className="h-12 w-full border-b border-border bg-transparent px-3 font-display text-base text-fg outline-none placeholder:text-subtle"
          />
          <Command.List className="max-h-[min(420px,50vh)] overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-sm text-muted">No matches.</Command.Empty>
            <Command.Group heading="Navigate" className="px-1 py-2">
              {PAGES.filter((p) => !query || p.label.toLowerCase().includes(query)).map((p) => (
                <Command.Item
                  key={p.to}
                  value={`page ${p.label}`}
                  onSelect={() => {
                    close();
                    void navigate({ to: p.to });
                  }}
                  className={itemClass}
                >
                  <p.icon className="size-4 text-muted" />
                  {p.label}
                </Command.Item>
              ))}
            </Command.Group>
            {frames.length ? (
              <Command.Group heading="Codex" className="px-1 py-2">
                {frames.map((f) => (
                  <Command.Item
                    key={f.slug}
                    value={`codex ${f.name}`}
                    onSelect={() => {
                      close();
                      void navigate({ to: "/codex/$slug", params: { slug: f.slug } });
                    }}
                    className={itemClass}
                  >
                    {f.name}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            {weapons.length ? (
              <Command.Group heading="Weapons" className="px-1 py-2">
                {weapons.map((w) => (
                  <Command.Item
                    key={w.slug}
                    value={`weapon ${w.name}`}
                    onSelect={() => {
                      close();
                      void navigate({ to: "/codex/$slug", params: { slug: w.slug } });
                    }}
                    className={itemClass}
                  >
                    {w.name}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            {items.length ? (
              <Command.Group heading="Market" className="px-1 py-2">
                {items.map((i) => (
                  <Command.Item
                    key={i.slug}
                    value={`market ${i.name} ${i.slug}`}
                    onSelect={() => {
                      close();
                      void navigate({ to: "/market/$slug", params: { slug: i.slug } });
                    }}
                    className={itemClass}
                  >
                    {i.name}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
