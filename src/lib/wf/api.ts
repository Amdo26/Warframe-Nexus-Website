import { createServerFn } from "@tanstack/react-start";
import type {
  Acquisition,
  CodexItem,
  DropSource,
  MarketItem,
  MarketOrder,
  Platform,
  RecentOrder,
  RelicItem,
  RelicReward,
  WarframeItem,
  WeaponItem,
  WorldSnapshot,
} from "./types";
import { marketNameToSlug, normalizePlatform, slugify, worldPath } from "./format";

type CacheEntry<T> = { at: number; data: T };
const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
  maxStale = Infinity,
): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < ttl) return hit.data;
  try {
    const data = await fn();
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch (err) {
    // Serve old data during a short outage, but not forever: too-old data must show an error
    if (hit && Date.now() - hit.at < maxStale) return hit.data;
    throw err;
  }
}

async function getJson(url: string, headers?: Record<string, string>) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Upstream ${res.status} for ${url}`);
  return res.json() as Promise<unknown>;
}

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function str(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function bool(v: unknown, fallback = false) {
  return typeof v === "boolean" ? v : fallback;
}

function rewardLabel(raw: unknown) {
  const r = rec(raw);
  if (!r) return "";
  const counted = arr(r.countedItems)
    .map((item) => {
      const it = rec(item);
      if (!it) return "";
      const count = num(it.count, 1);
      const name = str(it.type) || str(it.key);
      return count > 1 ? `${count} ${name}` : name;
    })
    .filter(Boolean);
  const items = arr(r.items).map((item) => str(item)).filter(Boolean);
  const credits = num(r.credits);
  const bits = [...counted, ...items];
  if (credits) bits.push(`${credits.toLocaleString()} cr`);
  return bits.join(" · ") || "—";
}

function parseCycle(
  id: string,
  label: string,
  raw: unknown,
  stateOf: (o: Record<string, unknown>) => { state: string; stateLabel: string },
) {
  const o = rec(raw);
  if (!o) return null;
  const { state, stateLabel } = stateOf(o);
  return {
    id,
    label,
    state,
    stateLabel,
    expiry: str(o.expiry),
    activation: str(o.activation),
  };
}

function slimWorld(raw: unknown, platform: Platform): WorldSnapshot {
  const d = rec(raw) ?? {};
  const now = Date.now();

  const cycles = [
    parseCycle("cetus", "Cetus", d.cetusCycle, (o) => {
      const day = bool(o.isDay, str(o.state) === "day");
      return { state: day ? "day" : "night", stateLabel: day ? "Day" : "Night" };
    }),
    parseCycle("vallis", "Orb Vallis", d.vallisCycle, (o) => {
      const warm = bool(o.isWarm, str(o.state) === "warm");
      return { state: warm ? "warm" : "cold", stateLabel: warm ? "Warm" : "Cold" };
    }),
    parseCycle("cambion", "Cambion Drift", d.cambionCycle, (o) => {
      const state = str(o.state, "fass").toLowerCase();
      return { state, stateLabel: state === "vome" ? "Vome" : "Fass" };
    }),
    parseCycle("zariman", "Zariman", d.zarimanCycle, (o) => {
      const corpus = bool(o.isCorpus, str(o.state).toLowerCase() === "corpus");
      return {
        state: corpus ? "corpus" : "grineer",
        stateLabel: corpus ? "Corpus" : "Grineer",
      };
    }),
    parseCycle("duviri", "Duviri", d.duviriCycle, (o) => {
      const state = str(o.state, "joy");
      return { state, stateLabel: state.replace(/^\w/, (c) => c.toUpperCase()) };
    }),
    parseCycle("earth", "Earth", d.earthCycle, (o) => {
      const day = bool(o.isDay, str(o.state) === "day");
      return { state: day ? "day" : "night", stateLabel: day ? "Day" : "Night" };
    }),
  ].filter((c): c is NonNullable<typeof c> => Boolean(c && c.expiry));

  const news = arr(d.news)
    .map((item) => {
      const n = rec(item);
      if (!n || bool(n.mobileOnly)) return null;
      return {
        id: str(n.id),
        message: str(n.message),
        link: str(n.link),
        image: str(n.imageLink),
        date: str(n.date),
        update: bool(n.update),
        primeAccess: bool(n.primeAccess),
        stream: bool(n.stream),
      };
    })
    .filter((n): n is NonNullable<typeof n> => Boolean(n?.message))
    .slice(0, 14);

  const parseSortie = (rawS: unknown): WorldSnapshot["sortie"] => {
    const s = rec(rawS);
    if (!s) return null;
    const missions = [
      ...arr(s.variants).map((v) => {
        const m = rec(v) ?? {};
        return {
          node: str(m.node),
          type: str(m.missionType) || str(m.type),
          modifier: str(m.modifier) || undefined,
          modifierDescription: str(m.modifierDescription) || undefined,
        };
      }),
      ...arr(s.missions).map((v) => {
        const m = rec(v) ?? {};
        return {
          node: str(m.node),
          type: str(m.type) || str(m.missionType),
          modifier: str(m.modifier) || undefined,
        };
      }),
    ].filter((m) => m.node || m.type);
    if (!missions.length && !str(s.boss)) return null;
    return {
      id: str(s.id),
      boss: str(s.boss),
      faction: str(s.faction),
      expiry: str(s.expiry),
      missions,
    };
  };

  const traders = arr(d.voidTraders).length ? arr(d.voidTraders) : [d.voidTrader];
  const traderRaw = rec(traders[0]);
  const trader: WorldSnapshot["trader"] = traderRaw
    ? {
        character: str(traderRaw.character, "Baro Ki'Teer"),
        location: str(traderRaw.location),
        activation: str(traderRaw.activation),
        expiry: str(traderRaw.expiry),
        active:
          remainingLive(str(traderRaw.activation), str(traderRaw.expiry), now) &&
          now >= new Date(str(traderRaw.activation)).getTime(),
        inventory: arr(traderRaw.inventory).map((it) => {
          const o = rec(it) ?? {};
          return {
            item: str(o.item) || str(o.uniqueName),
            ducats: num(o.ducats),
            credits: num(o.credits),
          };
        }),
      }
    : null;

  const fissures = arr(d.fissures)
    .map((item) => {
      const f = rec(item) ?? {};
      const expiry = str(f.expiry);
      if (expiry && new Date(expiry).getTime() < now) return null;
      return {
        id: str(f.id),
        node: str(f.node),
        missionType: str(f.missionType),
        enemy: str(f.enemy),
        tier: str(f.tier),
        tierNum: num(f.tierNum),
        expiry,
        isHard: bool(f.isHard),
        isStorm: bool(f.isStorm),
      };
    })
    .filter((f): f is NonNullable<typeof f> => Boolean(f?.node));

  const invasions = arr(d.invasions)
    .map((item) => {
      const i = rec(item) ?? {};
      if (bool(i.completed)) return null;
      const attacker = rec(i.attacker) ?? {};
      const defender = rec(i.defender) ?? {};
      return {
        id: str(i.id),
        node: str(i.node),
        desc: str(i.desc),
        vsInfestation: bool(i.vsInfestation),
        completion: num(i.completion),
        attacker: {
          faction: str(attacker.faction),
          reward: rewardLabel(attacker.reward),
        },
        defender: {
          faction: str(defender.faction),
          reward: rewardLabel(defender.reward),
        },
      };
    })
    .filter((i): i is NonNullable<typeof i> => Boolean(i?.node));

  const nw = rec(d.nightwave);
  const nightwave = nw
    ? {
        season: num(nw.season),
        tag: str(nw.tag),
        expiry: str(nw.expiry),
        challenges: arr(nw.activeChallenges).map((c) => {
          const o = rec(c) ?? {};
          return {
            id: str(o.id),
            title: str(o.title),
            desc: str(o.desc),
            reputation: num(o.reputation),
            isDaily: bool(o.isDaily),
            isElite: bool(o.isElite),
            expiry: str(o.expiry),
          };
        }),
      }
    : null;

  const deals = arr(d.dailyDeals).map((item) => {
    const o = rec(item) ?? {};
    return {
      id: str(o.id),
      item: str(o.item),
      originalPrice: num(o.originalPrice),
      salePrice: num(o.salePrice),
      discount: num(o.discount),
      total: num(o.total),
      sold: num(o.sold),
      expiry: str(o.expiry),
    };
  });

  const events = arr(d.events)
    .map((item) => {
      const o = rec(item) ?? {};
      const expiry = str(o.expiry);
      if (expiry && new Date(expiry).getTime() < now) return null;
      return {
        id: str(o.id),
        description: str(o.description),
        node: str(o.node) || str(o.victimNode),
        expiry,
        health: typeof o.health === "number" ? o.health : undefined,
        faction: str(o.faction) || undefined,
      };
    })
    .filter((e): e is NonNullable<typeof e> => Boolean(e?.description));

  const sp = rec(d.steelPath);
  const reward = rec(sp?.currentReward);
  const steelPath =
    sp && reward
      ? { name: str(reward.name), cost: num(reward.cost), expiry: str(sp.expiry) }
      : null;

  const wanted = ["ostrons", "solaris united", "entrati", "the holdfasts", "cavia", "hex"];
  const syndicates = arr(d.syndicateMissions)
    .map((item) => {
      const o = rec(item) ?? {};
      const name = str(o.syndicate);
      if (!wanted.some((w) => name.toLowerCase().includes(w))) return null;
      const jobs = arr(o.jobs).map((j) => {
        const job = rec(j) ?? {};
        return {
          type: str(job.type),
          minMR: num(job.minMR ?? job.masteryReq),
          enemyLevels: arr(job.enemyLevels).map((n) => num(n)),
          standing: arr(job.standingStages).map((n) => num(n)),
          rewards: arr(job.rewardPool).map((n) => str(n)).filter(Boolean).slice(0, 8),
        };
      });
      return { syndicate: name, jobs };
    })
    .filter((s): s is NonNullable<typeof s> => Boolean(s?.jobs.length));

  const cons = rec(d.constructionProgress) ?? {};
  const duviri = rec(d.duviriCycle) ?? {};
  const choices = arr(duviri.choices);
  const pick = (key: string) => {
    const found = choices.map(rec).find((c) => str(c?.categoryKey).includes(key) || str(c?.category) === key);
    return arr(found?.choices).map((c) => str(c));
  };

  return {
    timestamp: str(d.timestamp),
    platform,
    cycles,
    news,
    sortie: parseSortie(d.sortie),
    archonHunt: parseSortie(d.archonHunt),
    trader,
    fissures,
    invasions,
    nightwave,
    deals,
    events,
    steelPath,
    syndicates,
    construction: {
      fomorian: num(parseFloat(str(cons.fomorianProgress) || "0")),
      razorback: num(parseFloat(str(cons.razorbackProgress) || "0")),
    },
    duviriChoices: { normal: pick("NORMAL"), hard: pick("HARD") },
  };
}

function remainingLive(activation: string, expiry: string, now: number) {
  const end = new Date(expiry).getTime();
  const start = new Date(activation).getTime();
  if (!Number.isFinite(end)) return false;
  if (Number.isFinite(start) && now < start) return false;
  return end > now;
}

const SKIP_PARTS =
  /^(orokin cell|alloy plate|ferrite|nano spores|salvage|polymer bundle|rubedo|argon crystal|control module|neural sensors|morphics|gallium|plastids|neurodes|oxium|cryotic|tellurium|nitain extract|kuva|forma|circuits|hexenon|credits|detonite ampule|fieldron sample|mutagen sample|grokdrul|coprun|lucent teroglobe|voidgel orb|entrati lanthorn|plastid|salvage)$/i;

function slimLocation(loc: string) {
  return loc.replace(/\s*\((Radiant|Exceptional|Flawless|Intact)\)/gi, "").trim();
}

function scoreLocation(loc: string) {
  if (/relic/i.test(loc)) return 6;
  if (/bounty/i.test(loc)) return 5;
  if (/quest|simaris|chipper|kahl|saya/i.test(loc)) return 5;
  if (/assassination|onslaught|circuit|duviri/i.test(loc)) return 4;
  if (/lab|dojo|research/i.test(loc)) return 3;
  if (/skirmish|railjack|conclave/i.test(loc)) return 0;
  return 2;
}

function parseAcquisition(o: Record<string, unknown>, itemName: string): Acquisition {
  const intro = rec(o.introduced);
  const sources: DropSource[] = [];
  const seen = new Set<string>();

  for (const raw of arr(o.components)) {
    const c = rec(raw);
    if (!c) continue;
    const part = str(c.name);
    if (!part || SKIP_PARTS.test(part)) continue;
    const byLoc = new Map<string, { chance: number; rarity: string }>();
    for (const d of arr(c.drops)) {
      const dr = rec(d);
      if (!dr) continue;
      const loc = slimLocation(str(dr.location));
      if (!loc || /conclave/i.test(loc)) continue;
      const chance = num(dr.chance);
      const prev = byLoc.get(loc);
      if (!prev || chance > prev.chance) byLoc.set(loc, { chance, rarity: str(dr.rarity) });
    }
    const ranked = [...byLoc.entries()]
      .sort((a, b) => b[1].chance - a[1].chance)
      .slice(0, 4);
    for (const [location, v] of ranked) {
      const key = `${part}|${location}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sources.push({
        part,
        location,
        chance: v.chance || undefined,
        rarity: v.rarity || undefined,
      });
    }
    if (sources.length >= 18) break;
  }

  const vaulted = bool(o.vaulted);
  const marketCost = typeof o.marketCost === "number" ? o.marketCost : undefined;
  const bpCost = typeof o.bpCost === "number" ? o.bpCost : undefined;
  const introduced = str(intro?.name) || undefined;
  const releaseDate = str(intro?.date) || str(o.releaseDate) || undefined;
  const preferred = sources.filter((s) => scoreLocation(s.location) > 0);
  const listed = preferred.length ? preferred : sources;

  let summary = "";
  const best = listed.slice().sort((a, b) => scoreLocation(b.location) - scoreLocation(a.location))[0];
  if (listed.some((s) => /relic/i.test(s.location))) summary = vaulted ? "Vaulted · Relics" : "Relics";
  else if (listed.some((s) => /bounty/i.test(s.location))) summary = "Bounties";
  else if (best && scoreLocation(best.location) >= 3) {
    summary = best.location.length > 42 ? `${best.location.slice(0, 40)}…` : best.location;
  } else if (marketCost) summary = `Market · ${marketCost}p`;
  else if (listed.length && best) {
    const loc = best.location;
    summary = loc.length > 42 ? `${loc.slice(0, 40)}…` : loc;
  } else if (/umbra/i.test(itemName)) summary = "The Sacrifice quest";
  else summary = "Clan lab / quest";

  return { introduced, releaseDate, vaulted, marketCost, bpCost, sources: listed, summary };
}

function asWarframe(raw: unknown): WarframeItem | null {
  const o = rec(raw);
  if (!o) return null;
  const name = str(o.name);
  if (!name) return null;
  const type = str(o.type);
  if (type && type !== "Warframe") return null;
  if (/helminth/i.test(name) || /&/.test(name)) return null;
  const abilities = arr(o.abilities).map((a) => {
    if (typeof a === "string") return { name: a, description: "" };
    const ab = rec(a) ?? {};
    return { name: str(ab.name), description: str(ab.description).slice(0, 280) };
  });
  return {
    kind: "warframe",
    name,
    slug: slugify(name),
    uniqueName: str(o.uniqueName),
    description: str(o.description).slice(0, 400),
    health: num(o.health),
    shield: num(o.shield),
    armor: num(o.armor),
    power: num(o.power),
    sprint: num(o.sprintSpeed ?? o.sprint),
    masteryReq: num(o.masteryReq),
    polarities: arr(o.polarities).map((p) => str(p)).filter(Boolean),
    aura: str(o.aura) || undefined,
    isPrime: bool(o.isPrime) || /prime/i.test(name),
    imageName: str(o.imageName),
    abilities,
    passive: str(o.passiveDescription) || undefined,
    type: type || "Warframe",
    acquisition: parseAcquisition(o, name),
  };
}

const KEEP_DAMAGE = [
  "impact",
  "puncture",
  "slash",
  "heat",
  "cold",
  "electricity",
  "toxin",
  "blast",
  "radiation",
  "gas",
  "magnetic",
  "viral",
  "corrosive",
  "void",
  "tau",
  "true",
];

function asWeapon(raw: unknown): WeaponItem | null {
  const o = rec(raw);
  if (!o) return null;
  const name = str(o.name);
  if (!name) return null;
  const category = str(o.category);
  if (["Arch-Gun", "Arch-Melee", "Pets", "Sentinels"].includes(category)) return null;
  const dmgRaw = rec(o.damage) ?? {};
  const damage: Record<string, number> = {};
  for (const key of KEEP_DAMAGE) {
    const n = num(dmgRaw[key]);
    if (n > 0.01) damage[key] = Math.round(n * 10) / 10;
  }
  return {
    kind: "weapon",
    name,
    slug: slugify(name),
    uniqueName: str(o.uniqueName),
    description: str(o.description).slice(0, 280),
    type: str(o.type),
    category,
    productCategory: str(o.productCategory),
    masteryReq: num(o.masteryReq),
    totalDamage: Math.round(num(o.totalDamage) * 10) / 10,
    critChance: num(o.criticalChance),
    critMult: num(o.criticalMultiplier),
    status: num(o.procChance),
    fireRate: num(o.fireRate),
    riven: num(o.omegaAttenuation),
    mag: typeof o.magazineSize === "number" ? o.magazineSize : undefined,
    reload: typeof o.reloadTime === "number" ? o.reloadTime : undefined,
    trigger: str(o.trigger) || undefined,
    isPrime: bool(o.isPrime) || /prime/i.test(name),
    imageName: str(o.imageName),
    damage,
    acquisition: parseAcquisition(o, name),
  };
}

function i18nName(item: Record<string, unknown>) {
  const i18n = rec(item.i18n);
  const en = rec(i18n?.en) ?? rec(i18n?.en_US);
  return en;
}

function asMarketItem(raw: unknown): MarketItem | null {
  const o = rec(raw);
  if (!o) return null;
  const slug = str(o.slug) || str(o.url_name);
  const en = i18nName(o);
  const name = str(en?.name) || str(o.item_name) || slug.replace(/_/g, " ");
  if (!slug || !name) return null;
  return {
    id: str(o.id),
    slug,
    name,
    tags: arr(o.tags).map((t) => str(t)).filter(Boolean),
    thumb: str(en?.thumb),
    icon: str(en?.icon),
    ducats: typeof o.ducats === "number" ? o.ducats : undefined,
    maxRank: typeof o.maxRank === "number" ? o.maxRank : undefined,
  };
}

function presenceRank(status: string) {
  const s = status.toLowerCase().replace(/[\s_-]/g, "");
  if (s === "ingame") return 0;
  if (s === "online") return 1;
  return 2;
}

function takeByPresence(orders: MarketOrder[], priceDir: 1 | -1, perBucket = 24) {
  const buckets: MarketOrder[][] = [[], [], []];
  const ranked = [...orders].sort((a, b) => priceDir * (a.platinum - b.platinum));
  for (const order of ranked) {
    const bucket = buckets[presenceRank(order.status)];
    if (bucket.length < perBucket) bucket.push(order);
  }
  return buckets.flat();
}

function asOrder(raw: unknown): MarketOrder | null {
  const o = rec(raw);
  if (!o) return null;
  const type = str(o.type) === "buy" ? "buy" : "sell";
  const user = rec(o.user) ?? {};
  return {
    id: str(o.id),
    type,
    platinum: num(o.platinum),
    quantity: num(o.quantity, 1),
    rank: typeof o.rank === "number" ? o.rank : undefined,
    user: str(user.ingameName) || str(user.ingame_name) || "Tenno",
    status: str(user.status, "offline"),
    reputation: num(user.reputation),
    updatedAt: str(o.updatedAt) || str(o.createdAt),
  };
}

const RELIC_STATES = ["Intact", "Exceptional", "Flawless", "Radiant"] as const;

function isRelicState(s: string): s is (typeof RELIC_STATES)[number] {
  return (RELIC_STATES as readonly string[]).includes(s);
}

async function loadCodex() {
  return cached("codex-v5", 1000 * 60 * 60 * 6, async () => {
    const [wfRaw, wpRaw] = await Promise.all([
      getJson("https://api.warframestat.us/warframes?remove=patchlogs,conclave,color,wikiaThumbnail,wikiaUrl"),
      getJson("https://api.warframestat.us/weapons?remove=patchlogs,attacks"),
    ]);
    const warframes = arr(wfRaw).map(asWarframe).filter((x): x is WarframeItem => Boolean(x));
    const weapons = arr(wpRaw).map(asWeapon).filter((x): x is WeaponItem => Boolean(x));
    return { warframes, weapons };
  });
}

async function loadMarket() {
  return cached("market-items", 1000 * 60 * 30, async () => {
    const raw = await getJson("https://api.warframe.market/v2/items", {
      Platform: "pc",
      Language: "en",
    });
    const data = rec(raw)?.data ?? rec(raw)?.payload;
    const list = Array.isArray(data) ? data : arr(rec(data)?.items);
    return list.map(asMarketItem).filter((x): x is MarketItem => Boolean(x));
  });
}

export const getWorldState = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const o = rec(data);
    return { platform: normalizePlatform(str(o?.platform, "pc")) };
  })
  .handler(async ({ data }): Promise<WorldSnapshot> => {
    const platform = data.platform;
    return cached(
      `world:${platform}`,
      20_000,
      async () => {
        const raw = await getJson(`https://api.warframestat.us/${worldPath(platform)}?language=en`);
        return slimWorld(raw, platform);
      },
      5 * 60_000,
    );
  });

export const getCodex = createServerFn({ method: "POST" }).handler(async () => loadCodex());

export const getCodexItem = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const slug = str(rec(data)?.slug);
    if (!slug) throw new Error("Missing item");
    return { slug };
  })
  .handler(async ({ data }): Promise<CodexItem | null> => {
    const { warframes, weapons } = await loadCodex();
    return (
      warframes.find((f) => f.slug === data.slug) ??
      weapons.find((w) => w.slug === data.slug) ??
      null
    );
  });

export const getMarketCatalog = createServerFn({ method: "POST" }).handler(async () => loadMarket());

export const getMarketOrders = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const o = rec(data);
    const slug = str(o?.slug);
    if (!slug) throw new Error("Missing item");
    return { slug, platform: normalizePlatform(str(o?.platform, "pc")) };
  })
  .handler(async ({ data }) => {
    const raw = await getJson(`https://api.warframe.market/v2/orders/item/${encodeURIComponent(data.slug)}`, {
      Platform: data.platform,
      Language: "en",
      Crossplay: "true",
    });
    const list = arr(rec(raw)?.data).map(asOrder).filter((x): x is MarketOrder => Boolean(x));
    const sells = takeByPresence(
      list.filter((o) => o.type === "sell"),
      1,
    );
    const buys = takeByPresence(
      list.filter((o) => o.type === "buy"),
      -1,
    );
    const catalog = await loadMarket();
    const item = catalog.find((i) => i.slug === data.slug) ?? null;
    return { item, sells, buys };
  });

export const getRecentOrders = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const o = rec(data);
    return { platform: normalizePlatform(str(o?.platform, "pc")) };
  })
  .handler(async ({ data }) => {
    const raw = await getJson("https://api.warframe.market/v2/orders/recent", {
      Platform: data.platform,
      Language: "en",
      Crossplay: "true",
    });
    const catalog = await loadMarket();
    const byId = new Map(catalog.map((i) => [i.id, i]));
    const tape: RecentOrder[] = [];
    for (const row of arr(rec(raw)?.data).slice(0, 80)) {
      const order = asOrder(row);
      const o = rec(row) ?? {};
      if (!order) continue;
      const item = byId.get(str(o.itemId));
      tape.push({
        ...order,
        itemId: str(o.itemId),
        item: item ? { slug: item.slug, name: item.name, thumb: item.thumb } : null,
      });
    }
    return tape;
  });

export const getRelics = createServerFn({ method: "POST" }).handler(async () => {
  return cached("relics", 1000 * 60 * 60 * 12, async () => {
    const raw = await getJson("https://drops.warframestat.us/data/relics.json");
    const relics = arr(rec(raw)?.relics);
    const map = new Map<string, RelicItem>();
    for (const row of relics) {
      const o = rec(row) ?? {};
      const tier = str(o.tier);
      const name = str(o.relicName);
      const state = str(o.state);
      if (!tier || !name || !isRelicState(state)) continue;
      const key = `${tier} ${name}`;
      let relic = map.get(key);
      if (!relic) {
        relic = { key, tier, name, rewards: [] };
        map.set(key, relic);
      }
      for (const reward of arr(o.rewards)) {
        const r = rec(reward) ?? {};
        const itemName = str(r.itemName);
        const rarity = str(r.rarity);
        const chance = num(r.chance);
        if (!itemName) continue;
        let found = relic.rewards.find((x) => x.itemName === itemName);
        if (!found) {
          found = {
            itemName,
            rarity,
            intact: 0,
            exceptional: 0,
            flawless: 0,
            radiant: 0,
          };
          relic.rewards.push(found);
        }
        const field = state.toLowerCase() as keyof RelicReward;
        if (field in found && field !== "itemName" && field !== "rarity") {
          (found as unknown as Record<string, number | string>)[field] = chance;
        }
      }
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  });
});

export function lookupMarketItem(itemName: string, catalog: MarketItem[]) {
  const slug = marketNameToSlug(itemName);
  return (
    catalog.find((i) => i.slug === slug) ||
    catalog.find((i) => i.slug === `${slug}_blueprint`) ||
    catalog.find((i) => i.name.toLowerCase() === itemName.toLowerCase())
  );
}
