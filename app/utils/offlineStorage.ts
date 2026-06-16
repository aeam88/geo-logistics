const DB_NAME = "geologistics-offline";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("route")) {
        db.createObjectStore("route", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("stops")) {
        const stopsStore = db.createObjectStore("stops", { keyPath: "id" });
        stopsStore.createIndex("routeId", "routeId", { unique: false });
      }
      if (!db.objectStoreNames.contains("offlineQueue")) {
        db.createObjectStore("offlineQueue", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

export async function saveRouteOffline(route: any, stops: any[]) {
  const db = await openDB();

  const routeTx = db.transaction("route", "readwrite");
  routeTx.objectStore("route").put({ ...route, savedAt: Date.now() });
  await new Promise<void>((resolve, reject) => {
    routeTx.oncomplete = () => resolve();
    routeTx.onerror = () => reject(routeTx.error);
  });

  const stopsTx = db.transaction("stops", "readwrite");
  const stopsStore = stopsTx.objectStore("stops");
  stops.forEach((stop) => stopsStore.put({ ...stop, savedAt: Date.now() }));
  await new Promise<void>((resolve, reject) => {
    stopsTx.oncomplete = () => resolve();
    stopsTx.onerror = () => reject(stopsTx.error);
  });

  console.log("[Offline] Route saved:", route.id, stops.length, "stops");
}

export async function getRouteOffline(): Promise<{ route: any; stops: any[] } | null> {
  const db = await openDB();

  const route = await new Promise<any>((resolve, reject) => {
    const tx = db.transaction("route", "readonly");
    const req = tx.objectStore("route").getAll();
    req.onsuccess = () => resolve(req.result[0] || null);
    req.onerror = () => reject(req.error);
  });

  if (!route) return null;

  const stops = await new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction("stops", "readonly");
    const idx = tx.objectStore("stops").index("routeId");
    const req = idx.getAll(route.id);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  return { route, stops };
}

export async function addToOfflineQueue(action: { type: string; data: any }) {
  const db = await openDB();
  const tx = db.transaction("offlineQueue", "readwrite");
  tx.objectStore("offlineQueue").add({ ...action, timestamp: Date.now() });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  console.log("[Offline] Added to queue:", action.type);
}

export async function flushOfflineQueue(): Promise<Array<{ type: string; data: any; timestamp: number }>> {
  const db = await openDB();

  const items = await new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction("offlineQueue", "readonly");
    const req = tx.objectStore("offlineQueue").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  if (items.length > 0) {
    const clearTx = db.transaction("offlineQueue", "readwrite");
    clearTx.objectStore("offlineQueue").clear();
    await new Promise<void>((resolve, reject) => {
      clearTx.oncomplete = () => resolve();
      clearTx.onerror = () => reject(clearTx.error);
    });
  }

  return items;
}

export async function clearOfflineData() {
  const db = await openDB();
  const tx = db.transaction(["route", "stops", "offlineQueue"], "readwrite");
  tx.objectStore("route").clear();
  tx.objectStore("stops").clear();
  tx.objectStore("offlineQueue").clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  console.log("[Offline] All data cleared");
}
