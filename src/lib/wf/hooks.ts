import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNexus } from "@/lib/stores";
import {
  getCodex,
  getCodexItem,
  getMarketCatalog,
  getMarketOrders,
  getRecentOrders,
  getRelics,
  getWorldState,
} from "./api";

export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

export function useWorldState() {
  const platform = useNexus((s) => s.platform);
  return useQuery({
    queryKey: ["world", platform],
    queryFn: () => getWorldState({ data: { platform } }),
    // Poll every 60s, but every 15s while any cycle/sortie/trader timer has run out
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d) return 15_000;
      const now = Date.now();
      const expired =
        d.cycles.some((c) => new Date(c.expiry).getTime() <= now) ||
        (d.sortie ? new Date(d.sortie.expiry).getTime() <= now : false);
      return expired ? 15_000 : 60_000;
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 20_000,
    retry: 2,
    enabled: typeof window !== "undefined",
  });
}

export function useCodex() {
  return useQuery({
    queryKey: ["codex"],
    queryFn: () => getCodex(),
    staleTime: 1000 * 60 * 30,
    enabled: typeof window !== "undefined",
  });
}

export function useCodexItem(slug: string) {
  return useQuery({
    queryKey: ["codex-item", slug],
    queryFn: () => getCodexItem({ data: { slug } }),
    enabled: typeof window !== "undefined" && Boolean(slug),
    staleTime: 1000 * 60 * 30,
  });
}

export function useMarketCatalog() {
  return useQuery({
    queryKey: ["market-catalog"],
    queryFn: () => getMarketCatalog(),
    staleTime: 1000 * 60 * 20,
    enabled: typeof window !== "undefined",
  });
}

export function useMarketOrders(slug: string) {
  const platform = useNexus((s) => s.platform);
  return useQuery({
    queryKey: ["market-orders", slug, platform],
    queryFn: () => getMarketOrders({ data: { slug, platform } }),
    enabled: typeof window !== "undefined" && Boolean(slug),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useRecentOrders() {
  const platform = useNexus((s) => s.platform);
  return useQuery({
    queryKey: ["recent-orders", platform],
    queryFn: () => getRecentOrders({ data: { platform } }),
    refetchInterval: 45_000,
    staleTime: 20_000,
    enabled: typeof window !== "undefined",
  });
}

export function useRelics() {
  return useQuery({
    queryKey: ["relics"],
    queryFn: () => getRelics(),
    staleTime: 1000 * 60 * 60,
    enabled: typeof window !== "undefined",
  });
}
