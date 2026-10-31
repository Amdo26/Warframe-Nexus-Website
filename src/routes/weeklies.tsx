import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  EyeOff,
  ListChecks,
  Plus,
  RotateCcw,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Countdown } from "@/components/hud/countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nextReset, periodStart, type Cadence } from "@/lib/periods";
import { useHasHydrated, useNexus } from "@/lib/stores";
import { GROUPS, TASKS } from "@/lib/weeklies";
import { useNow, useWorldState } from "@/lib/wf/hooks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/weeklies")({ component: WeekliesPage });

type Row = {
  id: string;
  title: string;
  detail: string;
  cadence: Cadence;
  icon: LucideIcon;
  reward?: string;
  tag?: string;
  custom?: boolean;
};

function WeekliesPage() {
  const hydrated = useHasHydrated();
  const now = useNow(1000);
  const world = useWorldState();

  const done = useNexus((s) => s.checkDone);
  const hidden = useNexus((s) => s.checkHidden);
  const custom = useNexus((s) => s.checkCustom);
  const hideDone = useNexus((s) => s.hideDone);
  const toggleCheck = useNexus((s) => s.toggleCheck);
  const resetChecks = useNexus((s) => s.resetChecks);
  const hideTask = useNexus((s) => s.hideTask);
  const unhideAllTasks = useNexus((s) => s.unhideAllTasks);
  const setHideDone = useNexus((s) => s.setHideDone);
  const addCustomTask = useNexus((s) => s.addCustomTask);
  const removeCustomTask = useNexus((s) => s.removeCustomTask);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState("");
  const [draftCadence, setDraftCadence] = useState<Cadence>("weekly");

  const isDone = (row: Row) => hydrated && done[row.id] === periodStart(row.cadence, now);
  const isHidden = (id: string) => hydrated && hidden.includes(id);

  // Live notes pulled from the world state, shown under the matching task.
  const w = world.data;
  const live: Record<string, ReactNode> = {};
  if (w?.archonHunt?.boss) live["archon-hunt"] = <>This week: {w.archonHunt.boss}</>;
  if (w?.steelPath) {
    live["teshin"] = (
      <>
        This week: {w.steelPath.name} · {w.steelPath.cost} Steel Essence
      </>
    );
  }
  if (w?.trader) {
    live["baro"] = w.trader.active ? (
      <>
        At {w.trader.location} · leaves in <Countdown expiry={w.trader.expiry} compact />
      </>
    ) : (
      <>
        Arrives in <Countdown expiry={w.trader.activation} compact />
      </>
    );
  }

  const groupRows = (groupId: string): Row[] => TASKS.filter((t) => t.group === groupId);
  const customRows: Row[] = hydrated
    ? custom.map((c) => ({
        id: c.id,
        title: c.title,
        detail: c.cadence === "daily" ? "Your daily task" : "Your weekly task",
        cadence: c.cadence,
        icon: ListChecks,
        custom: true,
      }))
    : [];

  const allRows: Row[] = [...TASKS, ...customRows].filter((r) => !isHidden(r.id));
  const countFor = (cadence: Cadence) => {
    const rows = allRows.filter((r) => r.cadence === cadence);
    return { done: rows.filter(isDone).length, total: rows.length };
  };
  const weekly = countFor("weekly");
  const daily = countFor("daily");
  const shardRows = groupRows("shards").filter((r) => !isHidden(r.id));
  const shardsDone = shardRows.filter(isDone).length;

  const weeklyResetAt = nextReset("weekly", now);
  const dailyResetAt = nextReset("daily", now);
  const localReset = (ms: number, withDay: boolean) =>
    new Date(ms).toLocaleString(undefined, {
      weekday: withDay ? "short" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });

  const idsFor = (cadence?: Cadence) =>
    [...TASKS, ...custom].filter((t) => !cadence || t.cadence === cadence).map((t) => t.id);

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addCustomTask(draft, draftCadence);
    setDraft("");
  };

  const sections = [
    ...GROUPS.map((g) => ({ ...g, rows: groupRows(g.id) })),
    {
      id: "custom",
      title: "My tasks",
      kicker: "Yours",
      blurb: "Anything else you want to remember — saved on this device.",
      cadence: "weekly" as Cadence,
      rows: customRows,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-accent">Companion</p>
        <h1 className="mt-1 font-display text-4xl tracking-[0.12em]">WEEKLIES</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Everything worth doing each week, in one checklist. Ticks reset by themselves when Warframe
          resets and stay on this device.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="This week"
          ready={hydrated}
          done={weekly.done}
          total={weekly.total}
          resetIso={new Date(weeklyResetAt).toISOString()}
          resetNote={hydrated ? `Mon 00:00 UTC · your time ${localReset(weeklyResetAt, true)}` : "Mon 00:00 UTC"}
        />
        <SummaryCard
          label="Today"
          ready={hydrated}
          done={daily.done}
          total={daily.total}
          resetIso={new Date(dailyResetAt).toISOString()}
          resetNote={hydrated ? `00:00 UTC · your time ${localReset(dailyResetAt, false)}` : "00:00 UTC"}
        />
        <div className="rounded-2xl bg-surface p-4 hairline">
          <p className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-subtle">
            Archon Shards
          </p>
          <p className="tabular mt-1 font-display text-3xl text-fg">
            {shardsDone}
            <span className="text-xl text-muted">/{shardRows.length}</span>
          </p>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {shardRows.map((r, i) => (
              <span
                key={r.id}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors duration-300",
                  i < shardsDone ? "bg-accent" : "bg-elevated",
                )}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-subtle">Shards collected from this week&apos;s sources.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-surface p-3 hairline lg:flex-row lg:items-center">
        <form onSubmit={onAdd} className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add your own task…"
            maxLength={80}
            aria-label="New task"
            className="min-w-48 flex-1"
          />
          <div className="flex gap-1">
            {(["weekly", "daily"] as const).map((c) => (
              <button key={c} type="button" onClick={() => setDraftCadence(c)}>
                <Badge tone={draftCadence === c ? "accent" : "outline"}>{c}</Badge>
              </button>
            ))}
          </div>
          <Button type="submit" size="sm" disabled={!draft.trim()}>
            <Plus /> Add
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={hideDone ? "default" : "outline"}
            size="sm"
            aria-pressed={hideDone}
            onClick={() => setHideDone(!hideDone)}
          >
            Hide completed
          </Button>
          <Button variant="outline" size="sm" onClick={() => resetChecks(idsFor("daily"))}>
            <RotateCcw /> Daily
          </Button>
          <Button variant="outline" size="sm" onClick={() => resetChecks(idsFor("weekly"))}>
            <RotateCcw /> Weekly
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Clear every tick on this checklist?")) resetChecks(idsFor());
            }}
          >
            Reset all
          </Button>
          {hydrated && hidden.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={unhideAllTasks}>
              Unhide {hidden.length}
            </Button>
          ) : null}
        </div>
      </div>

      {sections.map((section) => {
        const rows = section.rows.filter((r) => !isHidden(r.id));
        if (section.id === "custom" && rows.length === 0) return null;
        if (rows.length === 0 && section.id !== "custom") return null;
        const doneCount = rows.filter(isDone).length;
        const shown = hideDone ? rows.filter((r) => !isDone(r)) : rows;
        const pct = rows.length ? (doneCount / rows.length) * 100 : 0;
        const complete = rows.length > 0 && doneCount === rows.length;
        const open = !collapsed[section.id];
        return (
          <section key={section.id} className="overflow-hidden rounded-2xl bg-surface hairline">
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [section.id]: !c[section.id] }))}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-[0.62rem] uppercase tracking-[0.22em] text-accent">
                  {section.kicker}
                </p>
                <h2 className="font-display text-lg uppercase tracking-[0.14em] text-fg">
                  {section.title}
                </h2>
                <p className="hidden text-xs text-subtle sm:block">{section.blurb}</p>
              </div>
              {complete ? <Badge tone="ok">Complete</Badge> : null}
              <span className="tabular font-display text-sm text-muted">
                {doneCount}/{rows.length}
              </span>
              <ChevronDown
                className={cn("size-4 text-subtle transition-transform duration-200", !open && "-rotate-90")}
              />
            </button>
            <div className="h-0.5 bg-elevated">
              <div
                className="h-full bg-accent transition-[width] duration-300 ease-[var(--ease-smooth-out)]"
                style={{ width: `${pct}%` }}
              />
            </div>
            {open ? (
              <div className="grid gap-2 p-3 md:grid-cols-2">
                {shown.map((row) => (
                  <TaskRow
                    key={row.id}
                    row={row}
                    checked={isDone(row)}
                    note={live[row.id]}
                    onToggle={() => toggleCheck(row.id, row.cadence)}
                    onRemove={() => (row.custom ? removeCustomTask(row.id) : hideTask(row.id))}
                  />
                ))}
                {shown.length === 0 ? (
                  <p className="px-1 py-3 text-sm text-muted md:col-span-2">
                    {rows.length ? "All done here — nice work, Tenno." : "Nothing in this section yet."}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        );
      })}

      <p className="text-xs text-subtle">
        You don&apos;t need to do everything — pick what helps your goals. Task list based on the community
        Warframe weekly checklist picture; reward notes are from the Warframe wiki.
      </p>
    </div>
  );
}

function TaskRow({
  row,
  checked,
  note,
  onToggle,
  onRemove,
}: {
  row: Row;
  checked: boolean;
  note?: ReactNode;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const Icon = row.icon;
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-200",
        checked
          ? "border-ok/25 bg-ok/5"
          : "border-border bg-elevated/60 hover:border-border-strong hover:bg-elevated",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={`${row.title} — ${checked ? "done" : "not done"}`}
        onClick={onToggle}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-90",
          checked ? "border-ok bg-ok text-bg" : "border-border-strong text-transparent hover:border-accent",
        )}
      >
        <Check className="size-4" strokeWidth={3} />
      </button>

      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg/60 transition-colors",
          checked ? "text-subtle" : "text-accent",
        )}
      >
        <Icon className="size-[1.15rem]" />
      </span>

      <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left" tabIndex={-1}>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "font-display text-sm tracking-wide transition-colors",
              checked ? "text-subtle line-through decoration-1" : "text-fg",
            )}
          >
            {row.title}
          </span>
          {row.reward ? <Badge tone={checked ? "default" : "accent"}>{row.reward}</Badge> : null}
          {row.tag ? <Badge tone="outline">{row.tag}</Badge> : null}
        </span>
        <span className="block text-xs leading-snug text-subtle">{row.detail}</span>
        {note ? <span className="mt-0.5 block text-xs text-live">{note}</span> : null}
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={row.custom ? `Delete ${row.title}` : `Hide ${row.title}`}
        title={row.custom ? "Delete task" : "Hide task"}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-subtle opacity-100 transition-opacity hover:bg-bg/60 hover:text-fg focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
      >
        {row.custom ? <X className="size-4" /> : <EyeOff className="size-4" />}
      </button>
    </div>
  );
}

function SummaryCard({
  label,
  done,
  total,
  resetIso,
  resetNote,
  ready,
}: {
  label: string;
  done: number;
  total: number;
  resetIso: string;
  resetNote: string;
  ready: boolean;
}) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface p-4 hairline">
      <div className="relative size-[76px] shrink-0">
        <svg viewBox="0 0 72 72" className="size-full -rotate-90" aria-hidden>
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6" className="stroke-elevated" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-accent transition-[stroke-dashoffset] duration-500 ease-[var(--ease-smooth-out)]"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
          />
        </svg>
        <span className="tabular absolute inset-0 flex items-center justify-center font-display text-base text-fg">
          {Math.round(pct * 100)}%
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-subtle">{label}</p>
        <p className="tabular font-display text-2xl text-fg">
          {done}
          <span className="text-lg text-muted">/{total}</span>
        </p>
        <p className="text-xs text-muted">
          Resets in {ready ? <Countdown expiry={resetIso} compact /> : "…"}
        </p>
        <p className="truncate text-[0.7rem] text-subtle">{resetNote}</p>
      </div>
    </div>
  );
}
