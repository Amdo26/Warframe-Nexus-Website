import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { periodStart, type Cadence } from "@/lib/periods";
import type { Platform } from "@/lib/wf/types";

export type CustomTask = {
  id: string;
  title: string;
  cadence: Cadence;
};

export type OwnedEntry = {
  slug: string;
  name: string;
  kind: "warframe" | "weapon" | "item";
  mastered: boolean;
};

export type WishItem = {
  slug: string;
  name: string;
  kind: "market" | "codex";
  note?: string;
};

type NexusState = {
  platform: Platform;
  setPlatform: (platform: Platform) => void;
  watchlist: WishItem[];
  toggleWatch: (item: WishItem) => void;
  owned: OwnedEntry[];
  toggleOwned: (item: OwnedEntry) => void;
  setMastered: (slug: string, mastered: boolean) => void;
  markProgress: (item: OwnedEntry, next: { owned?: boolean; mastered?: boolean }) => void;
  foundry: WishItem[];
  toggleFoundry: (item: WishItem) => void;
  /** Weeklies checklist: task id -> start (ms, UTC) of the period it was ticked in. */
  checkDone: Record<string, number>;
  checkHidden: string[];
  checkCustom: CustomTask[];
  hideDone: boolean;
  toggleCheck: (id: string, cadence: Cadence) => void;
  resetChecks: (ids: string[]) => void;
  hideTask: (id: string) => void;
  unhideAllTasks: () => void;
  setHideDone: (value: boolean) => void;
  addCustomTask: (title: string, cadence: Cadence) => void;
  removeCustomTask: (id: string) => void;
};

export const useNexus = create<NexusState>()(
  persist(
    (set, get) => ({
      platform: "pc",
      setPlatform: (platform) => set({ platform }),
      watchlist: [],
      toggleWatch: (item) => {
        const exists = get().watchlist.some((w) => w.slug === item.slug);
        set({
          watchlist: exists
            ? get().watchlist.filter((w) => w.slug !== item.slug)
            : [{ ...item }, ...get().watchlist].slice(0, 80),
        });
      },
      owned: [],
      toggleOwned: (item) => {
        const exists = get().owned.some((w) => w.slug === item.slug);
        set({
          owned: exists
            ? get().owned.filter((w) => w.slug !== item.slug)
            : [{ ...item }, ...get().owned],
        });
      },
      setMastered: (slug, mastered) =>
        set({
          owned: get().owned.map((o) => (o.slug === slug ? { ...o, mastered } : o)),
        }),
      markProgress: (item, next) => {
        const list = get().owned;
        const current = list.find((o) => o.slug === item.slug);
        const owned = next.owned ?? (Boolean(current) || next.mastered === true);
        const mastered = owned && (next.mastered ?? current?.mastered ?? false);
        if (!owned) {
          set({ owned: list.filter((o) => o.slug !== item.slug) });
          return;
        }
        const entry: OwnedEntry = {
          slug: item.slug,
          name: item.name,
          kind: item.kind,
          mastered,
        };
        set({
          owned: current
            ? list.map((o) => (o.slug === item.slug ? entry : o))
            : [entry, ...list],
        });
      },
      foundry: [],
      toggleFoundry: (item) => {
        const exists = get().foundry.some((w) => w.slug === item.slug);
        set({
          foundry: exists
            ? get().foundry.filter((w) => w.slug !== item.slug)
            : [{ ...item }, ...get().foundry].slice(0, 40),
        });
      },
      checkDone: {},
      checkHidden: [],
      checkCustom: [],
      hideDone: false,
      toggleCheck: (id, cadence) => {
        const start = periodStart(cadence);
        const next = { ...get().checkDone };
        if (next[id] === start) delete next[id];
        else next[id] = start;
        set({ checkDone: next });
      },
      resetChecks: (ids) => {
        const next = { ...get().checkDone };
        for (const id of ids) delete next[id];
        set({ checkDone: next });
      },
      hideTask: (id) => {
        if (get().checkHidden.includes(id)) return;
        set({ checkHidden: [...get().checkHidden, id] });
      },
      unhideAllTasks: () => set({ checkHidden: [] }),
      setHideDone: (value) => set({ hideDone: value }),
      addCustomTask: (title, cadence) => {
        const clean = title.trim().slice(0, 80);
        if (!clean || get().checkCustom.length >= 40) return;
        const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        set({ checkCustom: [...get().checkCustom, { id, title: clean, cadence }] });
      },
      removeCustomTask: (id) => {
        const done = { ...get().checkDone };
        delete done[id];
        set({
          checkCustom: get().checkCustom.filter((t) => t.id !== id),
          checkDone: done,
        });
      },
    }),
    { name: "nexus-tenno", skipHydration: true },
  ),
);

export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const persist = useNexus.persist;
    if (!persist) {
      setHydrated(true);
      return;
    }
    const unsub = persist.onFinishHydration(() => setHydrated(true));
    void persist.rehydrate();
    if (persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
