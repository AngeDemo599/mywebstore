import { prisma } from "@/lib/prisma";

export interface AppConfigData {
  subscriptionPrices: { monthly: number; yearly: number };
  tokenPacks: {
    small: { tokens: number; priceDA: number };
    medium: { tokens: number; priceDA: number };
    large: { tokens: number; priceDA: number };
  };
  tokenPacksPro: {
    small: { tokens: number };
    medium: { tokens: number };
    large: { tokens: number };
  };
  proBonusTokens: number;
  referralBonusTokens: number;
  orderUnlockCost: number;
  planLimits: { free: { maxProducts: number }; pro: { maxProducts: number } };
  adFreePacks: {
    week: { days: 7; cost: number };
    month: { days: 30; cost: number };
  };
}

export const DEFAULT_CONFIG: AppConfigData = {
  subscriptionPrices: { monthly: 5000, yearly: 50000 },
  tokenPacks: {
    small: { tokens: 100, priceDA: 1000 },
    medium: { tokens: 500, priceDA: 4500 },
    large: { tokens: 1000, priceDA: 8500 },
  },
  tokenPacksPro: {
    small: { tokens: 120 },
    medium: { tokens: 625 },
    large: { tokens: 1250 },
  },
  proBonusTokens: 200,
  referralBonusTokens: 50,
  orderUnlockCost: 10,
  planLimits: { free: { maxProducts: 5 }, pro: { maxProducts: 100 } },
  adFreePacks: {
    week: { days: 7, cost: 30 },
    month: { days: 30, cost: 100 },
  },
};

// In-memory cache
let cachedConfig: AppConfigData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

type JsonValue = string | number | boolean | null | JsonObj | JsonValue[];
type JsonObj = { [key: string]: JsonValue };

function deepMerge(defaults: JsonObj, overrides: JsonObj): JsonObj {
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    const ov = overrides[key];
    const dv = defaults[key];
    if (
      ov &&
      typeof ov === "object" &&
      !Array.isArray(ov) &&
      dv &&
      typeof dv === "object" &&
      !Array.isArray(dv)
    ) {
      result[key] = deepMerge(dv as JsonObj, ov as JsonObj);
    } else {
      result[key] = ov;
    }
  }
  return result;
}

export async function getAppConfig(): Promise<AppConfigData> {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }

  const row = await prisma.appConfig.findUnique({ where: { id: "singleton" } });
  const dbConfig = (row?.config as JsonObj) ?? {};
  const merged = deepMerge(DEFAULT_CONFIG as unknown as JsonObj, dbConfig) as unknown as AppConfigData;

  cachedConfig = merged;
  cacheTimestamp = now;
  return merged;
}

export async function updateAppConfig(partial: Partial<AppConfigData>): Promise<AppConfigData> {
  const current = await getAppConfig();
  const merged = deepMerge(current as unknown as JsonObj, partial as unknown as JsonObj);

  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", config: merged },
    update: { config: merged },
  });

  // Invalidate cache
  cachedConfig = merged as unknown as AppConfigData;
  cacheTimestamp = Date.now();

  return merged as unknown as AppConfigData;
}

export function buildTokenPacks(cfg: AppConfigData) {
  const TOKEN_PACKS = {
    small: { id: "small", name: "Small", tokens: cfg.tokenPacks.small.tokens, priceDA: cfg.tokenPacks.small.priceDA },
    medium: { id: "medium", name: "Medium", tokens: cfg.tokenPacks.medium.tokens, priceDA: cfg.tokenPacks.medium.priceDA },
    large: { id: "large", name: "Large", tokens: cfg.tokenPacks.large.tokens, priceDA: cfg.tokenPacks.large.priceDA },
  };

  const TOKEN_PACKS_PRO = {
    small: { ...TOKEN_PACKS.small, tokens: cfg.tokenPacksPro.small.tokens },
    medium: { ...TOKEN_PACKS.medium, tokens: cfg.tokenPacksPro.medium.tokens },
    large: { ...TOKEN_PACKS.large, tokens: cfg.tokenPacksPro.large.tokens },
  };

  return { TOKEN_PACKS, TOKEN_PACKS_PRO };
}
