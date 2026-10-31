import {
  Bird,
  CalendarDays,
  Cog,
  Crosshair,
  Droplet,
  Feather,
  Flame,
  Gem,
  Gift,
  Heart,
  Hourglass,
  Layers,
  LogIn,
  Mountain,
  Orbit,
  Package,
  Radio,
  Repeat,
  Shield,
  Ship,
  Skull,
  Snowflake,
  Sparkles,
  Store,
  Swords,
  Trophy,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { Cadence, ResetRule } from "@/lib/periods";

export type GroupId = "shards" | "rewards" | "duviri" | "kuva" | "standing" | "other" | "daily";

export type ChecklistTask = {
  id: string;
  title: string;
  detail: string;
  /** Where in the game to do it / find the vendor. */
  where: string;
  cadence: Cadence;
  /** Only for daily tasks that do not reset at 00:00 UTC (the Sortie). */
  rule?: ResetRule;
  group: GroupId;
  icon: LucideIcon;
  /** Short reward chip, e.g. "35K Kuva". */
  reward?: string;
  /** Extra chip, e.g. "Bi-weekly". */
  tag?: string;
  /** Full reward list, shown when the row is expanded. */
  itemsLabel?: string;
  items?: string[];
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
    blurb: "Weekly Archon Shard sources — some are guaranteed, some are a chance.",
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
    id: "duviri",
    title: "Duviri",
    kicker: "Weekly",
    blurb: "The Circuit (normal and Steel Path) and Acrithis.",
    cadence: "weekly",
  },
  {
    id: "kuva",
    title: "Kuva & Rivens",
    kicker: "Weekly",
    blurb: "Weekly Kuva trades and Veiled Riven purchases.",
    cadence: "weekly",
  },
  {
    id: "standing",
    title: "Nightwave",
    kicker: "Weekly",
    blurb: "Weekly acts and the Cred shop.",
    cadence: "weekly",
  },
  {
    id: "other",
    title: "Other tasks",
    kicker: "Rotating",
    blurb: "Shops that rotate during the week. Tick once you've checked this rotation.",
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

const NIGHTWAVE_WHERE =
  "Open Nightwave from the Orbiter's Navigation console, the banner at the lower right of the Main Menu, or the Radio Scanner in the Orbiter.";

/**
 * Task list based on the "Warframe Weekly Checklist" picture, with reward
 * and location details from the Warframe wiki and community weekly-reset guides.
 * Anything not shown in the picture (the Daily group) is clearly separate.
 */
export const TASKS: ChecklistTask[] = [
  // ── Archon Shards ──
  {
    id: "calendar-1999",
    title: "1999 Calendar",
    detail:
      "Work through the Calendar; each Prize event lets you pick 1 of 2 random rewards. Kaya also offers weekly Arcane Enhancements.",
    where:
      "Interact with Pom-2 in your Orbiter or in Höllvania Central Mall (after The Hex quest). Weekly tasks are on the clipboard icon.",
    cadence: "weekly",
    group: "shards",
    icon: CalendarDays,
    reward: "Pick 1 of 2 prizes",
    itemsLabel: "possible prizes",
    items: [
      "Arcanes: Bellicose, Truculence, Impetus, Crepuscular, Camisado, Primary Crux, Second Enervate, Melee Doughty",
      "Archon Shards: Crimson, Amber, Azure, Topaz, Violet, Emerald",
      "Exilus Adapter (Weapon or Warframe)",
      "Arcane Adapter (Primary, Secondary or Melee)",
      "Auro Forma",
      "Forma (Blueprint or Built)",
      "Orokin Catalyst Blueprint",
      "Orokin Reactor Blueprint",
      "Riven Mods: Rifle, Shotgun, Melee, Pistol, Zaw, Kitgun, Companion",
      "Hollvania resources: Argon Burger Meal, 35mm Films, Cheddar Crowns Cereal, Mood Crystal, Sixpack, On-lyne CD, The Countessa Comic",
      "Boosters: Affinity, Mod Drop Chance or Resource Drop Chance",
      "Kuva",
      "Vosfor",
      "Endo",
    ],
  },
  {
    id: "temporal-archimedea",
    title: "Temporal Archimedea",
    detail:
      "Run this week's Temporal Archimedea. Uses Search Pulses (5 per week, shared with Netracells and Deep Archimedea).",
    where:
      "Höllvania Central Mall: talk to Kaya Velasco (often outside the Round Table Pub) and pick Temporal Archimedea.",
    cadence: "weekly",
    group: "shards",
    icon: Hourglass,
    reward: "Shards + Arcanes",
    itemsLabel: "rewards",
    items: [
      "Silver, Gold and Arcane reward tables",
      "Archon Shards and Tauforged Shards",
      "Arcanes",
      "Elemental Vice",
      "Omni Forma",
      "Research Point rewards (based on your points at the end): mainly Archon Shards, Arcanes and Tauforged Shards",
    ],
  },
  {
    id: "deep-archimedea",
    title: "Deep Archimedea",
    detail:
      "Clear all 3 missions (3 Research Points); the third also pays 15,000 Cavia Standing. Unlocking the week costs 2 Search Pulses (5 per week, shared with Netracells and Temporal Archimedea).",
    where:
      "Sanctum Anatomica on Deimos: talk to the Necraloid. Needs Whispers in the Walls, one Netracells mission and Cavia rank 5.",
    cadence: "weekly",
    group: "shards",
    icon: Layers,
    reward: "Shards + Arcanes",
    itemsLabel: "reward tiers",
    items: [
      "Main rewards: Archon Shards (Crimson, Amber or Azure Tauforged), Legendary Melee Arcane Enhancement, Melee Arcane Adapter",
      "5 and 10 Research Points: Uncommon reward pool",
      "15 points: Entrati Lanthorn x3",
      "20 points: Rare reward pool",
      "25 points: permanently unlocks Elite Archimedea",
      "Elite only — 28 points: Vosfor x20",
      "Elite only — 31 points: Rare reward pool",
      "Elite only — 34 points: Legendary reward pool",
      "Elite only — 37 points: Vosfor x50",
    ],
  },
  {
    id: "netracells",
    title: "Netracells",
    detail:
      "Spend Search Pulses (5 per week, shared with both Archimedeas) for a high chance at Archon Shards and exclusive Arcanes.",
    where: "Sanctum Anatomica on Deimos (the Cavia hub).",
    cadence: "weekly",
    group: "shards",
    icon: Cog,
    reward: "Shards + Arcanes",
  },
  {
    id: "archon-hunt",
    title: "Archon Hunt",
    detail: "Three missions, then the Archon fight.",
    where: "Open the Navigation menu to start it (needs the Veilbreaker quest).",
    cadence: "weekly",
    group: "shards",
    icon: Skull,
    reward: "Archon Shard",
  },
  {
    id: "bird-3",
    title: "Bird 3",
    detail: "Buy this week's rotating Archon Shard with Cavia Standing (1 per week).",
    where: "Sanctum Anatomica on Deimos.",
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
    where: "Maroo's Bazaar on Mars (needs the Stolen Dreams quest).",
    cadence: "weekly",
    group: "rewards",
    icon: Gift,
    reward: "Ayatan Sculpture",
  },
  {
    id: "teshin",
    title: "Teshin",
    detail:
      "Steel Path Honors — this week's rotating offer (8-week cycle), plus the Veiled Riven Cipher.",
    where: "In any Relay: talk to Teshin and open Steel Path Honors.",
    cadence: "weekly",
    group: "rewards",
    icon: Shield,
    reward: "Steel Essence",
  },
  {
    id: "clem",
    title: "Clem",
    detail:
      "A 10-minute Survival mission. It can also count as a Nightwave weekly act when Clem's challenge is active.",
    where:
      "Navigation console → Alerts tab → find the “Help Clem” alert on a Relay and travel there → fast travel to Darvo's Deal → talk to Darvo (“Does Clem need my help?”).",
    cadence: "weekly",
    group: "rewards",
    icon: Swords,
    reward: "Clem Clone blueprint",
  },
  {
    id: "circuit",
    title: "The Circuit — Normal",
    detail:
      "Weekly Circuit run. You choose your reward from this week's rotation of Warframes — each one is a set of Warframe component rewards.",
    where:
      "Duviri: select Duviri in the Navigation console (or the Dormizone) and start The Circuit.",
    cadence: "weekly",
    group: "duviri",
    icon: Repeat,
    reward: "Warframe components",
  },
  {
    id: "circuit-steel-path",
    title: "The Circuit — Steel Path",
    detail:
      "Same Circuit on the Steel Path (needs Steel Path unlocked). This week's rotation pays Incarnon Genesis adapters for the weapons shown below.",
    where:
      "Duviri: select Duviri in the Navigation console, then switch The Circuit to Steel Path before you start.",
    cadence: "weekly",
    group: "duviri",
    icon: Flame,
    reward: "Incarnon Genesis",
  },
  {
    id: "acrithis",
    title: "Acrithis",
    detail:
      "Duviri weekly rotation: 5 items from a pool, resets Sunday 00:00 UTC. The stock changes every week, so check in game.",
    where:
      "Dormizone (aboard the Zariman Ten Zero): go through the Void doorway in the bedroom to the Duviri room. Reach the Dormizone via Navigation → Duviri.",
    cadence: "weekly",
    group: "duviri",
    icon: Sparkles,
    reward: "5 weekly items",
    itemsLabel: "items seen recently",
    items: [
      "Last wiki report was 28 Sep, so this is not necessarily this week's stock:",
      "5000 Kuva",
      "Shotgun Riven Mod",
      "Rifle Riven Mod",
      "Secondary Arcane Adapter",
      "Forma",
      "Orokin Catalysts, Reactors and Arcanes also appear in the pool (per weekly guides)",
    ],
  },
  {
    id: "break-narmer",
    title: "Break Narmer",
    detail:
      "Complete Kahl's weekly mission to earn Stock, the currency you spend with Kahl and Chipper.",
    where:
      "Drifter's Camp (Veilbreaker quest needed): talk to Kahl-175 in Kahl's Garrison and pick the weekly Break Narmer mission. Resets Monday 00:00 UTC.",
    cadence: "weekly",
    group: "rewards",
    icon: Swords,
    reward: "Stock",
  },
  {
    id: "cryobells",
    title: "Cryobells",
    detail:
      "Harvest 3 Cryobells from the ice pillar (3 per weekly reset, you can hold up to 6). You need them to run Icebind missions.",
    where: "Yuvan Peak (Zariman): the ice pillar is at the top of the relay area.",
    cadence: "weekly",
    group: "rewards",
    icon: Snowflake,
    reward: "3 Cryobells",
  },
  {
    id: "icebind",
    title: "The Icebind",
    detail: "Spend Cryobells to run six-player Icebind missions (up to 3 clears per week).",
    where: "Yuvan Peak (Zariman): talk to Cephalon Melica.",
    cadence: "weekly",
    group: "rewards",
    icon: Users,
    reward: "Riven Splicer + Kuva",
    itemsLabel: "rewards",
    items: ["Riven Splicer", "A Kuva roll", "A Crested Frozen Chest item"],
  },
  {
    id: "descendia",
    title: "The Descendia — Normal",
    detail:
      "The Tower game mode: climb Infernums for rewards. Floor modifiers (Penances) and the Blessings you get rotate weekly.",
    where:
      "Orbiter: open the Navigation console, switch to the Dark Refractory and choose The Descendia. Unlocked by The Old Peace.",
    cadence: "weekly",
    group: "rewards",
    icon: Mountain,
    reward: "Arcanes + resources",
    itemsLabel: "rewards by Infernum",
    items: [
      "Infernums 2, 4, 9, 11, 16, 18: Credits cache, Endo, Vosfor, Ignia, Maphica",
      "Infernums 6, 13, 20: Arcanes (some of the rarest, from the Eidolons)",
      "Infernum 21: Forma Blueprint, Primary, Secondary, Melee and Amp Arcane Adapters",
    ],
  },
  {
    id: "descendia-steel-path",
    title: "The Descendia — Steel Path",
    detail: "The same Tower on the Steel Path, with tougher enemies and better payouts.",
    where:
      "Orbiter: Navigation console → Dark Refractory → The Descendia, then pick the Steel Path version.",
    cadence: "weekly",
    group: "rewards",
    icon: Mountain,
    reward: "Exclusive Arcanes",
    itemsLabel: "rewards by Infernum",
    items: [
      "Infernums 2, 9, 16: Ignia, Maphica",
      "Infernums 4, 11: Forma Blueprint, Riven Mods, Arcane Adapters, 3-day boosters",
      "Infernums 6, 13, 20: Descendia-exclusive Arcanes",
      "Infernum 18: Steel Essence",
      "Infernum 21: Orokin Catalyst and Reactor Blueprints, Omni Forma Blueprint, Eidolon Lens Blueprints, Archon Shards",
    ],
  },
  {
    id: "kaya-pix",
    title: "Kaya — Pix Chips",
    detail:
      "Trade Pix Chips for one Arcane per week (5 Pix Chips each): Universal Fallout, Hot Shot or Escapist.",
    where: "Höllvania Central Mall: talk to Kaya Velasco.",
    cadence: "weekly",
    group: "rewards",
    icon: Store,
    reward: "1 Arcane",
  },
  {
    id: "baro",
    title: "Baro Ki'Teer",
    detail: "Arrives every 2 weeks on Friday 00:00 UTC and stays for 48 hours.",
    where: "At a Relay — his current Relay and full stock show below while he's docked.",
    cadence: "weekly",
    group: "rewards",
    icon: Orbit,
    tag: "Bi-weekly",
  },

  // ── Kuva & Rivens (the red droplet "35K" cards in the picture) ──
  {
    id: "ironwake",
    title: "Ironwake — Palladino",
    detail:
      "Weekly Kuva purchase (35K on your checklist). Palladino also trades Riven Slivers for Veiled Riven Mods.",
    where:
      "Iron Wake, an outpost on Earth (select Earth in Navigation; needs Chains of Harrow). Palladino is at the far back right.",
    cadence: "weekly",
    group: "kuva",
    icon: Droplet,
    reward: "35K Kuva",
  },
  {
    id: "archimedian-yonta",
    title: "Archimedean Yonta",
    detail: "Trade 5 Voidplume Pinion for 35,000 Kuva — once per week.",
    where:
      "Chrysalith (the Zariman hub): fast travel to Archimedean Yonta, or find her with the map Legend (press L).",
    cadence: "weekly",
    group: "kuva",
    icon: Droplet,
    reward: "35K Kuva",
  },
  {
    id: "nightcap",
    title: "Nightcap",
    detail: "Trade Fergolyte for Kuva and Ayatan Sculptures.",
    where: "Fortuna, Venus: find Nightcap in the settlement (needs The New War).",
    cadence: "weekly",
    group: "kuva",
    icon: Droplet,
    reward: "Kuva + Ayatan",
  },
  {
    id: "aspirant-zorba",
    title: "Aspirant Zorba",
    detail: "Trade Atramentum for Kuva.",
    where: "In any Relay: find Aspirant Zorba (needs The Chains of Harrow).",
    cadence: "weekly",
    group: "kuva",
    icon: Droplet,
    reward: "Kuva",
  },
  {
    id: "hunhow",
    title: "Hunhow",
    detail: "Trade Emerald and Crimson Talents for Kuva.",
    where: "Pontis Tower, Uranus: talk to Hunhow (needs Jade Shadows: Constellations).",
    cadence: "weekly",
    group: "kuva",
    icon: Droplet,
    reward: "Kuva",
  },
  {
    id: "cephalon-melica",
    title: "Cephalon Melica",
    detail:
      "Trade Entropic Kuva for Kuva. Entropic Kuva drops from Entropic Eximus enemies in Zariman missions.",
    where: "Chrysalith (Zariman): the console past the docking bays.",
    cadence: "weekly",
    group: "kuva",
    icon: Droplet,
    reward: "Kuva",
  },

  // ── Nightwave ──
  {
    id: "nightwave-weekly",
    title: "Nightwave weekly acts",
    detail: "Five weekly acts, 4,500 standing each.",
    where: NIGHTWAVE_WHERE,
    cadence: "weekly",
    group: "standing",
    icon: Waves,
    reward: "22.5K standing",
  },
  {
    id: "nightwave-elite",
    title: "Nightwave elite weekly acts",
    detail: "Two harder acts, 7,000 standing each.",
    where: NIGHTWAVE_WHERE,
    cadence: "weekly",
    group: "standing",
    icon: Waves,
    reward: "14K standing",
  },
  {
    id: "nightwave-creds",
    title: "Nightwave Cred offerings",
    detail: "Spend Creds in this week's refreshed shop (mods, cosmetics, weapons and more).",
    where: `${NIGHTWAVE_WHERE} Creds only work during their own series.`,
    cadence: "weekly",
    group: "standing",
    icon: Gem,
  },

  // ── Other tasks ──
  {
    id: "mend-family",
    title: "Mend the Family",
    detail:
      "Buy Entrati Family Tokens from Grandmother's brews and medicines (she asks for Deimos resources). The offers are randomised and change every few hours.",
    where: "Necralisk, Deimos: inside the infested flower to the right of the entrance.",
    cadence: "weekly",
    group: "other",
    icon: Heart,
    reward: "Family Tokens",
    tag: "Rotates",
  },
  {
    id: "voidplumes",
    title: "Trade for Voidplumes",
    detail:
      "Buy Voidplume Pinions from Archimedean Yonta. Her trades rotate every 8 hours. Pinions go back to her for 35K Kuva.",
    where: "Chrysalith (Zariman): fast travel to Archimedean Yonta, or press L to find her.",
    cadence: "weekly",
    group: "other",
    icon: Feather,
    tag: "8-hour rotation",
  },
  {
    id: "voca",
    title: "Trade for Voca",
    detail: "Check Loid's trades for Voca. His offers rotate every 8 hours.",
    where: "Sanctum Anatomica, Deimos: talk to Loid.",
    cadence: "weekly",
    group: "other",
    icon: Package,
    tag: "8-hour rotation",
  },
  {
    id: "tenet-shop",
    title: "Tenet weapons",
    detail:
      "Check Ergo Glast's shop for a good Valence bonus (40 Corrupted Holokeys each). The shop and its random bonuses change every 4 days at 00:00 UTC.",
    where: "In any Relay: talk to Ergo Glast.",
    cadence: "weekly",
    group: "other",
    icon: Crosshair,
    tag: "4-day rotation",
    itemsLabel: "weapons include",
    items: ["Tenet Agendus", "Tenet Exec", "Tenet Livia", "Tenet Grigori", "Tenet Ferrox"],
  },
  {
    id: "coda-shop",
    title: "Coda weapons",
    detail:
      "Check Eleanor's shop for a good Valence bonus (10 Live Heartcells each). Two sets of Coda weapons alternate every 4 days. Her current stock isn't in the live data feed, so check it in game.",
    where: "Höllvania Central Mall: talk to Eleanor Nightingale.",
    cadence: "weekly",
    group: "other",
    icon: Ship,
    tag: "4-day rotation",
  },

  // ── Daily ──
  {
    id: "daily-tribute",
    title: "Daily Tribute",
    detail: "Log in and claim your daily reward.",
    where: "Shown when you log in.",
    cadence: "daily",
    group: "daily",
    icon: LogIn,
  },
  {
    id: "daily-standing",
    title: "Daily standing",
    detail: "Spend your daily syndicate standing cap (resets 00:00 UTC).",
    where: "Any syndicate you're pledged to (their offices are in the Relays).",
    cadence: "daily",
    group: "daily",
    icon: Trophy,
  },
  {
    id: "daily-sortie",
    title: "Sortie",
    detail:
      "Three missions, then the reward. It changes at 12:00 New York time (16:00 UTC in US summer, otherwise 17:00 UTC), so your tick resets then.",
    where: "Open the Navigation menu and pick Sortie.",
    cadence: "daily",
    rule: "sortie",
    group: "daily",
    icon: Skull,
  },
  {
    id: "daily-acrithis",
    title: "Acrithis — daily offers",
    detail: "Check the daily Arcane and Captura offering in Acrithis's shop.",
    where:
      "Dormizone (aboard the Zariman Ten Zero): through the Void doorway in the bedroom to the Duviri room.",
    cadence: "daily",
    group: "daily",
    icon: Sparkles,
  },
  {
    id: "daily-drifter",
    title: "Drifter Intrinsics",
    detail:
      "Opportunity rank 9 (High Value Vendor) puts one Arcane per day in Acrithis's stock. Keep spending Opportunity points on it.",
    where: "Dormizone, Duviri room: use the well of golden rings in Teshin's Cave.",
    cadence: "daily",
    group: "daily",
    icon: Layers,
  },
  {
    id: "daily-ticker",
    title: "Ticker — railjack crew",
    detail: "Check the Railjack crew available to hire. The recruits refresh every day.",
    where:
      "Fortuna, Venus: the raised platform above The Business's shop. Needs Rising Tide and Command Intrinsics rank 1.",
    cadence: "daily",
    group: "daily",
    icon: Users,
  },
  {
    id: "daily-marie",
    title: "Marie",
    detail:
      "Buy Tektolyst mods and arcanes, and Perita and Descendia resources. Her stock includes a daily Ren Hypercore and Operator mods.",
    where: "Sanctum Anatomica, Deimos: talk to Marie.",
    cadence: "daily",
    group: "daily",
    icon: Store,
  },
  {
    id: "daily-nightwave",
    title: "Nightwave daily act",
    detail: "Finish today's daily act.",
    where: NIGHTWAVE_WHERE,
    cadence: "daily",
    group: "daily",
    icon: Radio,
  },
];
