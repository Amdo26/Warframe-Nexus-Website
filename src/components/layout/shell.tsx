import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  Crosshair,
  ListChecks,
  Menu,
  Search,
  Shield,
  Sparkles,
  Store,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CycleRing } from "@/components/hud/cycle-ring";
import { CommandPalette } from "@/components/layout/command-palette";
import { PLATFORMS } from "@/lib/wf/types";
import { useWorldState } from "@/lib/wf/hooks";
import { useNexus, useHasHydrated } from "@/lib/stores";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Command", icon: Compass },
  { to: "/world", label: "World", icon: Crosshair },
  { to: "/weeklies", label: "Weeklies", icon: ListChecks },
  { to: "/codex", label: "Codex", icon: BookOpen },
  { to: "/market", label: "Market", icon: Store },
  { to: "/relics", label: "Relics", icon: Sparkles },
  { to: "/arsenal", label: "Arsenal", icon: Shield },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="relative flex size-9 items-center justify-center rounded-md border border-accent/40 bg-elevated">
        <span className="font-display text-lg leading-none text-accent">N</span>
      </span>
      <span className="leading-tight">
        <span className="block font-display text-base tracking-[0.28em] text-fg">NEXUS</span>
        <span className="block font-display text-[0.62rem] uppercase tracking-[0.22em] text-muted">
          Origin System
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className={cn("flex flex-col gap-1", compact && "flex-row")}>
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex h-11 items-center gap-3 rounded-md px-3 font-display text-sm uppercase tracking-[0.16em] transition-colors duration-150",
              active ? "bg-elevated text-accent" : "text-muted hover:bg-elevated/70 hover:text-fg",
              compact && "h-12 flex-1 justify-center px-0",
            )}
          >
            <Icon className="size-4" />
            <span className={cn(compact && "sr-only")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const platform = useNexus((s) => s.platform);
  const setPlatform = useNexus((s) => s.setPlatform);
  useHasHydrated();
  const world = useWorldState();
  const cycles = (world.data?.cycles ?? []).filter((c) =>
    ["cetus", "vallis", "cambion", "zariman", "duviri"].includes(c.id),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="void-field min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-[1440px]">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border px-4 py-5 lg:flex">
          <BrandMark />
          <div className="mt-8 flex-1">
            <NavLinks />
          </div>
          <p className="font-display text-[0.62rem] uppercase leading-relaxed tracking-[0.14em] text-subtle">
            Wiki · Market
            <br />
            World · Companion
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-bg/85 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMenu(true)}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
              <div className="lg:hidden">
                <BrandMark />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPalette(true)}>
                  <Search className="size-3.5" />
                  <span className="hidden sm:inline">Search</span>
                  <span className="hidden font-display text-[0.62rem] text-subtle md:inline">⌘K</span>
                </Button>
                <label className="sr-only" htmlFor="platform">
                  Platform
                </label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as typeof platform)}
                  className="h-10 rounded-md border border-border bg-elevated px-2 font-display text-xs uppercase tracking-[0.14em] text-fg"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 hidden gap-5 overflow-x-auto md:flex">
              {cycles.map((c) => (
                <CycleRing key={c.id} cycle={c} compact />
              ))}
            </div>
          </header>

          <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-10">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 px-2 py-1 backdrop-blur-sm lg:hidden">
        <NavLinks compact />
      </nav>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent>
          <div className="px-4 py-6">
            <BrandMark />
            <div className="mt-8">
              <NavLinks onNavigate={() => setMenu(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CommandPalette open={palette} onOpenChange={setPalette} />
    </div>
  );
}
