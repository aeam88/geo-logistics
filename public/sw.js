const CACHE_NAME = "geologistics-v1";
const STATIC_ASSETS = [
  "/",
  "/chofer",
  "/login",
  "/manifest.json",
];

// Install: cachear assets estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignorar errores de cache en dev
        console.log("[SW] Some assets failed to cache");
      });
    })
  );
  self.skipWaiting();
});

// Activate: limpiar caches antiguos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first para API, Cache-first para assets estáticos
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API requests: network-first con fallback a cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cachear respuestas GET exitosas de ciertas APIs
          if (event.request.method === "GET" && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback a cache si hay red
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Cachear assets nuevos
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Push notifications (ya implementado antes)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || "GeoLogistics", {
      body: data.body || "Nueva notificación",
      icon: data.icon || "/icon-192.svg",
      badge: "/icon-192.svg",
      data: data.data || {},
      vibrate: [200, 100, 200],
      tag: data.data?.type || "default",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/chofer") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(data?.routeId ? "/chofer" : "/chofer");
      }
    })
  );
});

// Background Sync: sincronizar cola offline cuando vuelva la conexión
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-queue") {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  // Notificar al cliente que sincronice
  const clientList = await clients.matchAll({ type: "window" });
  for (const client of clientList) {
    client.postMessage({ type: "SYNC_OFFLINE_QUEUE" });
  }
}
