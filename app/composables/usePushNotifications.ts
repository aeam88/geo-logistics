import { ref, onMounted } from "vue";

export const usePushNotifications = () => {
  const isSupported = ref(false);
  const isSubscribed = ref(false);
  const permission = ref<NotificationPermission>("default");

  if (import.meta.client) {
    isSupported.value = "Notification" in window && "serviceWorker" in navigator;
  }

  const subscribe = async () => {
    if (!isSupported.value) return;

    permission.value = await Notification.requestPermission();
    if (permission.value !== "granted") {
      console.warn("[Push] Notification permission denied");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const { publicKey } = await $fetch<{ publicKey: string }>("/api/push/vapid-key");

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

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

  const checkSubscription = async () => {
    if (!isSupported.value) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      isSubscribed.value = !!subscription;
    } catch {
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

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
