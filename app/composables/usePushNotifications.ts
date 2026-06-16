import { ref, onMounted } from "vue";

export const usePushNotifications = () => {
  const isSupported = ref(false);
  const isSubscribed = ref(false);
  const permission = ref<NotificationPermission>("default");

  if (import.meta.client) {
    isSupported.value = "Notification" in window && "serviceWorker" in navigator;
  }

  /**
   * Registrar service worker y suscribirse a push notifications.
   */
  const subscribe = async () => {
    if (!isSupported.value) return;

    // Pedir permiso
    permission.value = await Notification.requestPermission();
    if (permission.value !== "granted") {
      console.warn("[Push] Notification permission denied");
      return;
    }

    try {
      // Registrar service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Obtener VAPID public key
      const { publicKey } = await $fetch<{ publicKey: string }>("/api/push/vapid-key");

      // Convertir key a Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Suscribirse a push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Ensuscripción al servidor
      const subJson = subscription.toJSON();
      await $fetch("/api/push/subscribe", {
        method: "POST",
        headers: import.meta.dev ? { "x-bypass-auth": "true" } : {},
        body: {
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
        },
      });

      isSubscribed.value = true;
      console.log("[Push] Subscribed successfully");
    } catch (err) {
      console.error("[Push] Subscription failed:", err);
    }
  };

  /**
   * Verificar si ya está suscrito.
   */
  const checkSubscription = async () => {
    if (!isSupported.value) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      isSubscribed.value = !!subscription;
    } catch {
      // Service worker no registrado aún
    }
  };

  onMounted(() => {
    checkSubscription();
  });

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
  };
};

/**
 * Convierte una VAPID public key de base64url a Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
