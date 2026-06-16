import { z } from "zod";
import { db } from "../../../db";
import { deliveryEvidences, deliveryStops, orders } from "../../../db/schema";
import { requireDriver, sanitizeZodError } from "../../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

const evidenceSchema = z.object({
  photoBase64: z.string().optional(),
  signatureData: z.string().optional(),
  recipientName: z.string().optional(),
  notes: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  await requireDriver(event);

  const stopId = getRouterParam(event, "id");
  if (!stopId) throw createError({ statusCode: 400, statusMessage: "Missing stop id" });

  const body = await readBody(event);
  const parseResult = evidenceSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const now = new Date();

  await db
    .update(deliveryStops)
    .set({
      status: "entregado",
      deliveredAt: now,
      updatedAt: now,
    })
    .where(and(eq(deliveryStops.id, stopId), isNull(deliveryStops.deletedAt)));

  const stop = await db.query.deliveryStops.findFirst({
    where: eq(deliveryStops.id, stopId),
  });

  if (stop?.orderId) {
    await db
      .update(orders)
      .set({ status: "entregada", updatedAt: now })
      .where(eq(orders.id, stop.orderId));
  }

  await db.insert(deliveryEvidences).values({
    id: crypto.randomUUID(),
    stopId,
    photoUrl: parseResult.data.photoBase64 || null,
    signatureData: parseResult.data.signatureData || null,
    recipientName: parseResult.data.recipientName || null,
    notes: parseResult.data.notes || null,
    createdAt: now,
  });

  return {
    success: true,
    message: "Delivery completed and evidence saved",
    data: { deliveredAt: now.toISOString() },
  };
});
