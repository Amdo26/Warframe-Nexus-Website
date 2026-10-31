import {
  Bird,
  CalendarDays,
  Cog,
  Gem,
  Gift,
  Hourglass,
  Layers,
  LogIn,
  Orbit,
  Radio,
  Repeat,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trophy,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { Cadence } from "@/lib/periods";

export type GroupId = "shards" | "rewards" | "standing" | "daily";

export type ChecklistTask = {
  id: string;
  title: string;
  detail: string;
  cadence: Cadence;
  group: GroupId;
  icon: LucideIcon;
  /** Short reward chip, e.g. "Archon Shard". */
  reward?: string;
  /** Extra chip, e.g. "Bi-weekly". */
  tag?: string;
};

export const GROUPS: {
  id: GroupId;
  title: string;
  kicker: string;
  blurb: string;
  cadence: Cadence;
}[] = [
  {
    id: "shards",
    title: "Archon Shards",
    kicker: "Weekly",
    blurb: "Every source that pays out an Archon Shard each week.",
    cadence: "weekly",
  },
  {
    id: "rewards",
    title: "Weekly rewards",
    kicker: "Weekly",
    blurb: "Vendors, rotations and one-per-week hunts.",
    cadence: "weekly",
  },
  {
    id: "standing",
    title: "Standing & Nightwave",
    kicker: "Weekly",
    blurb: "Standing targets and Nightwave acts.",
    cadence: "weekly",
  },
  {
    id: "daily",
    title: "Daily tasks",
    kicker: "Daily",
    blurb: "Quick wins that refresh every day.",
    cadence: "daily",
  },
];

/**
 * Task list based on the "Warframe Weekly Checklist" picture.
 * Anything not shown in the picture (the Daily group) is clearly separate.
 */
export const TASKS: ChecklistTask[] = [
  // ── Archon Shards (the shard icon on each card in the picture) ──
  {
    id: "calendar-1999",
    title: "1999 Calendar",
    detail: "Finish this week's Calendar tasks.",
    cadence: "weekly",
    group: "shards",
    icon: CalendarDays,
    reward: "Archon Shard",
  },
  {
    id: "temporal-archimedea",
    title: "Temporal Archimedea",
    detail: "Run this week's Temporal Archimedea.",
    cadence: "weekly",
    group: "shards",
    icon: Hourglass,
    reward: "Archon Shard",
  },
  {
    id: "deep-archimedea",
    title: "Deep Archimedea",
    detail: "Run this week's Deep Archimedea.",
    cadence: "weekly",
    group: "shards",
    icon: Layers,
    reward: "Archon Shard",
  },
  {
    id: "netracells",
    title: "Netracells",
    detail: "Clear this week's Netracells.",
    cadence: "weekly",
    group: "shards",
    icon: Cog,
    reward: "Archon Shard",
  },
  {
    id: "archon-hunt",
    title: "Archon Hunt",
    detail: "Three missions, then the Archon fight.",
    cadence: "weekly",
    group: "shards",
    icon: Skull,
    reward: "Archon Shard",
  },
  {
    id: "bird-3",
    title: "Bird 3",
    detail: "Buy this week's Archon Shard offering.",
    cadence: "weekly",
    group: "shards",
    icon: Bird,
    reward: "Archon Shard",
  },

  // ── Weekly rewards ──
  {
    id: "maroo",
    title: "Maroo",
    detail: "Ayatan Treasure Hunt — once per week.",
    cadence: "weekly",
    group: "rewards",
    icon: Gift,
    reward: "Ayatan Sculpture",
  },
  {
    id: "teshin",
    title: "Teshin",
    detail: "Steel Path Honors — this week's rotating reward.",
    cadence: "weekly",
    group: "rewards",
    icon: Shield,
    reward: "Steel Essence",
  },
  {
    id: "clem",
    title: "Clem",
    detail: "Help Clem with his weekly mission.",
    cadence: "weekly",
    group: "rewards",
    icon: Swords,
  },
  {
    id: "circuit",
    title: "The Circuit",
    detail: "Duviri's weekly Circuit rewards.",
    cadence: "weekly",
    group: "rewards",
    icon: Repeat,
  },
  {
    id: "acrithis",
    title: "Acrithis",
    detail: "Check Duviri's weekly offerings (refreshes Sunday 00:00 UTC).",
    cadence: "weekly",
    group: "rewards",
    icon: Sparkles,
  },
  {
    id: "baro",
    title: "Baro Ki'Teer",
    detail: "Void Trader visit.",
    cadence: "weekly",
    group: "rewards",
    icon: Orbit,
    tag: "Bi-weekly",
  },

  // ── Standing & Nightwave ──
  {
    id: "ironwake",
    title: "Ironwake",
    detail: "Standing target from the checklist: 35K.",
    cadence: "weekly",
    group: "standing",
    icon: Trophy,
    reward: "35K",
  },
  {
    id: "archimedian-yonta",
    title: "Archimedian Yonta",
    detail: "Standing target from the checklist: 35K.",
    cadence: "weekly",
    group: "standing",
    icon: Trophy,
    reward: "35K",
  },
  {
    id: "nightwave-weekly",
    title: "Nightwave weekly acts",
    detail: "Five weekly acts, 4,500 standing each.",
    cadence: "weekly",
    group: "standing",
    icon: Waves,
    reward: "22.5K standing",
  },
  {
    id: "nightwave-elite",
    title: "Nightwave elite weekly acts",
    detail: "Two harder acts, 7,000 standing each.",
    cadence: "weekly",
    group: "standing",
    icon: Waves,
    reward: "14K standing",
  },
  {
    id: "nightwave-creds",
    title: "Nightwave Cred offerings",
    detail: "Spend Creds in this week's refreshed shop.",
    cadence: "weekly",
    group: "standing",
    icon: Gem,
  },

  // ── Daily ──
  {
    id: "daily-tribute",
    title: "Daily Tribute",
    detail: "Log in and claim your daily reward.",
    cadence: "daily",
    group: "daily",
    icon: LogIn,
  },
  {
    id: "daily-standing",
    title: "Daily standing",
    detail: "Spend your daily syndicate standing cap (resets 00:00 UTC).",
    cadence: "daily",
    group: "daily",
    icon: Trophy,
  },
  {
    id: "daily-nightwave",
    title: "Nightwave daily act",
    detail: "Finish today's daily act.",
    cadence: "daily",
    group: "daily",
    icon: Radio,
  },
];
