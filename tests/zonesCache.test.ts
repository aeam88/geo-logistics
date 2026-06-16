import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCachedZones, invalidateZonesCache } from "../server/utils/zonesCache";

vi.mock("../server/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
}));

describe("Zones Cache", () => {
  beforeEach(() => {
    invalidateZonesCache();
    vi.clearAllMocks();
  });

  it("returns empty array when no zones exist", async () => {
    const result = await getCachedZones();
    expect(result).toEqual([]);
  });

  it("caches results and returns cached data on second call", async () => {
    const { db } = await import("../server/db");

    const result1 = await getCachedZones();
    expect(db.select).toHaveBeenCalled();

    vi.clearAllMocks();
    const result2 = await getCachedZones();
    expect(db.select).not.toHaveBeenCalled();
    expect(result2).toEqual(result1);
  });

  it("refreshes cache after invalidation", async () => {
    const { db } = await import("../server/db");

    await getCachedZones();
    vi.clearAllMocks();

    invalidateZonesCache();

    await getCachedZones();
    expect(db.select).toHaveBeenCalled();
  });
});
