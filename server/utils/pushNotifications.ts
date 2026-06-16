import webPush from "web-push";
import { db } from "../db";
import { pushSubscriptions } from "../db/schema";
import { eq } from "drizzle-orm";

// VAPID keys - en producción, generar con: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    "mailto:admin@geologistics.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
}

/**
 * Envía push notification a un usuario específico.
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[Push] VAPID keys not configured. Skipping notification.");
    return;
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subscriptions.length === 0) {
    console.log("[Push] No subscriptions for user:", userId);
    return;
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    data: payload.data || {},
  });

  const failedSubscriptions: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload
      );
    } catch (err: any) {
      console.error("[Push] Failed to send to subscription:", sub.id, err.message);
      // Si el endpoint ya no es válido (410 Gone), eliminar la suscripción
      if (err.statusCode === 410 || err.statusCode === 404) {
        failedSubscriptions.push(sub.id);
      }
    }
  }

  // Limpiar suscripciones inválidas
  for (const subId of failedSubscriptions) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subId));
  }
}

/**
 * Registra una suscripción push para un usuario.
 */
export async function registerPushSubscription(
  userId: string,
  subscription: { endpoint: string; p256dh: string; auth: string }
) {
  // Verificar si ya existe esta suscripción
  const existing = await db.query.pushSubscriptions.findFirst({
    where: (s, { eq }) => eq(s.endpoint, subscription.endpoint),
  });

  if (existing) {
    // Actualizar si ya existe
    await db
      .update(pushSubscriptions)
      .set({ userId, updatedAt: new Date() })
      .where(eq(pushSubscriptions.id, existing.id));
    return existing.id;
  }

  // Crear nueva suscripción
  const id = crypto.randomUUID();
  await db.insert(pushSubscriptions).values({
    id,
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.p256dh,
    auth: subscription.auth,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return id;
}
