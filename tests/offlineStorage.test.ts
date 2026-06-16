import { describe, it, expect, vi, beforeEach } from "vitest";

const stores: Record<string, any[]> = {
  route: [],
  stops: [],
  offlineQueue: [],
};

vi.mock("../app/utils/offlineStorage", () => ({
  saveRouteOffline: vi.fn(async (route: any, stops: any[]) => {
    stores.route = [route];
    stores.stops = stops;
  }),

  getRouteOffline: vi.fn(async () => {
    if (stores.route.length === 0) return null;
    return { route: stores.route[0], stops: stores.stops };
  }),

  addToOfflineQueue: vi.fn(async (item: any) => {
    stores.offlineQueue.push({ ...item, id: stores.offlineQueue.length + 1, timestamp: Date.now() });
  }),

  flushOfflineQueue: vi.fn(async () => {
    const items = [...stores.offlineQueue];
    stores.offlineQueue = [];
    return items;
  }),

  clearOfflineData: vi.fn(async () => {
    stores.route = [];
    stores.stops = [];
    stores.offlineQueue = [];
  }),
}));

const {
  saveRouteOffline,
  getRouteOffline,
  addToOfflineQueue,
  flushOfflineQueue,
  clearOfflineData,
} = await import("../app/utils/offlineStorage");

describe("Offline Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stores.route = [];
    stores.stops = [];
    stores.offlineQueue = [];
  });

  it("saveRouteOffline stores route and stops", async () => {
    const route = { id: "route-1", date: "2026-01-15", status: "despachada" };
    const stops = [
      { id: "stop-1", clientName: "Client A" },
      { id: "stop-2", clientName: "Client B" },
    ];

    await saveRouteOffline(route, stops);
    expect(saveRouteOffline).toHaveBeenCalledWith(route, stops);
  });

  it("getRouteOffline returns null when no data", async () => {
    const result = await getRouteOffline();
    expect(result).toBeNull();
  });

  it("addToOfflineQueue adds items", async () => {
    await addToOfflineQueue({
      type: "gps_update",
      data: { lat: -33.456, lng: -70.648, status: "en_ruta" },
    });

    expect(addToOfflineQueue).toHaveBeenCalledWith({
      type: "gps_update",
      data: { lat: -33.456, lng: -70.648, status: "en_ruta" },
    });
  });

  it("flushOfflineQueue returns items", async () => {
    await addToOfflineQueue({ type: "gps_update", data: { lat: 1 } });
    await addToOfflineQueue({ type: "stop_update", data: { stopId: "s1" } });

    const items = await flushOfflineQueue();
    expect(items).toHaveLength(2);
  });

  it("clearOfflineData resets everything", async () => {
    await addToOfflineQueue({ type: "gps_update", data: { lat: 1 } });
    await clearOfflineData();
    const items = await flushOfflineQueue();
    expect(items).toHaveLength(0);
  });
});
