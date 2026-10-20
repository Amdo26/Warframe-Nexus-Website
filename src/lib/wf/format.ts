import type { CycleSnapshot, Platform } from "./types";

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizePlatform(raw: string): Platform {
  const v = raw.toLowerCase();
  if (v === "ps4" || v === "psn") return "ps4";
  if (v === "xbox" || v === "xb1") return "xbox";
  if (v === "switch" || v === "swi" || v === "ns") return "switch";
  return "pc";
}

export function worldPath(platform: Platform) {
  if (platform === "xbox") return "xb1";
  if (platform === "switch") return "swi";
  return platform;
}

export function remainingMs(iso?: string | null, now = Date.now()) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return t - now;
}

export function formatEta(ms: number) {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h ${m.toString().padStart(2, "0")}m`;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  return `${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
}

export function formatCompactEta(ms: number) {
  if (ms <= 0) return "end";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function wfImage(imageName?: string | null) {
  if (!imageName) return "";
  return `https://cdn.warframestat.us/img/${encodeURIComponent(imageName)}`;
}

export function marketAsset(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://warframe.market/static/assets/${path}`;
}

export function wikiUrl(name: string) {
  return `https://wiki.warframe.com/w/${encodeURIComponent(name.replace(/ /g, "_"))}`;
}

export function pct(n: number, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  const v = n > 0 && n <= 1 ? n * 100 : n;
  return `${v.toFixed(digits)}%`;
}

export function formatNewsDate(iso?: string | null) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t) || t < 1_000_000_000_000) return "";
  return new Date(t).toLocaleString();
}

export function formatNumber(n: number, digits = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function titleCase(s: string) {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function rarityTone(rarity: string) {
  const r = rarity.toLowerCase();
  if (r.includes("rare") || r.includes("legendary")) return "text-accent";
  if (r.includes("uncommon")) return "text-live";
  return "text-muted";
}

export function cycleProgress(activation: string, expiry: string, now = Date.now()) {
  const start = new Date(activation).getTime();
  const end = new Date(expiry).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

export function marketNameToSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/ blueprint$/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Two-state cycles: [stateA, stateB] with each state's length in seconds. null = copy current length. */
const CYCLE_RULES: Record<string, { states: [string, string]; labels: [string, string]; secs: [number | null, number | null] }> = {
  cetus: { states: ["day", "night"], labels: ["Day", "Night"], secs: [6000, 3000] },
  cambion: { states: ["fass", "vome"], labels: ["Fass", "Vome"], secs: [6000, 3000] },
  vallis: { states: ["warm", "cold"], labels: ["Warm", "Cold"], secs: [400, 1200] },
  earth: { states: ["day", "night"], labels: ["Day", "Night"], secs: [14400, 14400] },
  zariman: { states: ["corpus", "grineer"], labels: ["Corpus", "Grineer"], secs: [null, null] },
};

/**
 * Moves an expired cycle forward to the current period so the UI flips on time
 * without waiting for the next API refresh. Cycles we can't predict (e.g. Duviri) are returned as-is.
 */
export function rollCycle(cycle: CycleSnapshot, now = Date.now()): CycleSnapshot {
  const rule = CYCLE_RULES[cycle.id];
  let end = new Date(cycle.expiry).getTime();
  if (!rule || !Number.isFinite(end) || end > now) return cycle;
  const start0 = new Date(cycle.activation).getTime();
  const fallbackMs = Number.isFinite(start0) && end > start0 ? end - start0 : 0;
  let idx = rule.states.indexOf(cycle.state) === 1 ? 1 : 0;
  let start = end;
  for (let i = 0; i < 5000 && end <= now; i++) {
    idx = idx === 0 ? 1 : 0;
    const ms = (rule.secs[idx] ?? 0) * 1000 || fallbackMs;
    if (!ms) return cycle;
    start = end;
    end = start + ms;
  }
  if (end <= now) return cycle;
  return {
    ...cycle,
    state: rule.states[idx],
    stateLabel: rule.labels[idx],
    activation: new Date(start).toISOString(),
    expiry: new Date(end).toISOString(),
  };
}

export function isLive(expiry?: string | null, now = Date.now()) {
  if (!expiry) return true;
  const t = new Date(expiry).getTime();
  return Number.isNaN(t) || t > now;
}
