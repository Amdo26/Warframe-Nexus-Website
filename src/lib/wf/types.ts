export const PLATFORMS = ["pc", "ps4", "xbox", "switch"] as const;
export type Platform = (typeof PLATFORMS)[number];

export type CycleSnapshot = {
  id: string;
  label: string;
  state: string;
  stateLabel: string;
  expiry: string;
  activation: string;
};

export type NewsItem = {
  id: string;
  message: string;
  link: string;
  image: string;
  date: string;
  update: boolean;
  primeAccess: boolean;
  stream: boolean;
};

export type MissionStep = {
  node: string;
  type: string;
  modifier?: string;
  modifierDescription?: string;
};

export type SortieSnapshot = {
  id: string;
  boss: string;
  faction: string;
  expiry: string;
  missions: MissionStep[];
};

export type TraderSnapshot = {
  character: string;
  location: string;
  activation: string;
  expiry: string;
  active: boolean;
  inventory: { item: string; ducats: number; credits: number }[];
};

export type FissureSnapshot = {
  id: string;
  node: string;
  missionType: string;
  enemy: string;
  tier: string;
  tierNum: number;
  expiry: string;
  isHard: boolean;
  isStorm: boolean;
};

export type InvasionSnapshot = {
  id: string;
  node: string;
  desc: string;
  vsInfestation: boolean;
  completion: number;
  attacker: { faction: string; reward: string };
  defender: { faction: string; reward: string };
};

export type NightwaveChallenge = {
  id: string;
  title: string;
  desc: string;
  reputation: number;
  isDaily: boolean;
  isElite: boolean;
  expiry: string;
};

export type DealSnapshot = {
  id: string;
  item: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  total: number;
  sold: number;
  expiry: string;
};

export type EventSnapshot = {
  id: string;
  description: string;
  node: string;
  expiry: string;
  health?: number;
  faction?: string;
};

export type BountyJob = {
  type: string;
  minMR: number;
  enemyLevels: number[];
  standing: number[];
  rewards: string[];
};

export type SyndicateSnapshot = {
  syndicate: string;
  jobs: BountyJob[];
};

export type WorldSnapshot = {
  timestamp: string;
  platform: Platform;
  cycles: CycleSnapshot[];
  news: NewsItem[];
  sortie: SortieSnapshot | null;
  archonHunt: SortieSnapshot | null;
  trader: TraderSnapshot | null;
  fissures: FissureSnapshot[];
  invasions: InvasionSnapshot[];
  nightwave: {
    season: number;
    tag: string;
    expiry: string;
    challenges: NightwaveChallenge[];
  } | null;
  deals: DealSnapshot[];
  events: EventSnapshot[];
  steelPath: { name: string; cost: number; expiry: string } | null;
  syndicates: SyndicateSnapshot[];
  construction: { fomorian: number; razorback: number };
  duviriChoices: { normal: string[]; hard: string[] };
};

export type DropSource = {
  part: string;
  location: string;
  chance?: number;
  rarity?: string;
};

export type Acquisition = {
  introduced?: string;
  releaseDate?: string;
  vaulted: boolean;
  marketCost?: number;
  bpCost?: number;
  sources: DropSource[];
  summary: string;
};

export type Ability = {
  name: string;
  description: string;
};

export type WarframeItem = {
  kind: "warframe";
  name: string;
  slug: string;
  uniqueName: string;
  description: string;
  health: number;
  shield: number;
  armor: number;
  power: number;
  sprint: number;
  masteryReq: number;
  polarities: string[];
  aura?: string;
  isPrime: boolean;
  imageName: string;
  abilities: Ability[];
  passive?: string;
  type: string;
  acquisition: Acquisition;
};

export type WeaponItem = {
  kind: "weapon";
  name: string;
  slug: string;
  uniqueName: string;
  description: string;
  type: string;
  category: string;
  productCategory: string;
  masteryReq: number;
  totalDamage: number;
  critChance: number;
  critMult: number;
  status: number;
  fireRate: number;
  riven: number;
  mag?: number;
  reload?: number;
  trigger?: string;
  isPrime: boolean;
  imageName: string;
  damage: Record<string, number>;
  acquisition: Acquisition;
};

export type CodexItem = WarframeItem | WeaponItem;

export type MarketItem = {
  id: string;
  slug: string;
  name: string;
  tags: string[];
  thumb: string;
  icon: string;
  ducats?: number;
  maxRank?: number;
};

export type MarketOrder = {
  id: string;
  type: "buy" | "sell";
  platinum: number;
  quantity: number;
  rank?: number;
  user: string;
  status: string;
  reputation: number;
  updatedAt: string;
};

export type RecentOrder = MarketOrder & {
  itemId: string;
  item: { slug: string; name: string; thumb: string } | null;
};

export type RelicReward = {
  itemName: string;
  rarity: string;
  intact: number;
  exceptional: number;
  flawless: number;
  radiant: number;
};

export type RelicItem = {
  key: string;
  tier: string;
  name: string;
  rewards: RelicReward[];
};
