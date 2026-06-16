import { db } from "../db";
import { dispatchZones } from "../db/schema";
import { isNull } from "drizzle-orm";

interface CacheEntry {
  data: any[];
  expiry: number;
}

const zonesCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000;
const CACHE_KEY = "zones_list";

export async function getCachedZones() {
  const now = Date.now();
  const cached = zonesCache.get(CACHE_KEY);

  if (cached && now < cached.expiry) {
    return cached.data;
  }

  const zones = await db
    .select()
    .from(dispatchZones)
    .where(isNull(dispatchZones.deletedAt));

  zonesCache.set(CACHE_KEY, {
    data: zones,
    expiry: now + CACHE_TTL,
  });

  return zones;
}

export function invalidateZonesCache() {
  zonesCache.delete(CACHE_KEY);
}
