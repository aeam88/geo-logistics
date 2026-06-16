import { z } from "zod";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../../db";
import { deliveryStops, orders } from "../../../db/schema";
import { requireDriver, sanitizeZodError } from "../../../utils/guards";

const failSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export default defineEventHandler(async (event) => {
  const session = await requireDriver(event);

  const stopId = getRouterParam(event, "id");
  if (!stopId) throw createError({ statusCode: 400, statusMessage: "Missing stop id" });

  const body = await readBody(event);
  const parseResult = failSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const now = new Date();

  await db
    .update(deliveryStops)
    .set({
      status: "fallido",
      updatedAt: now,
    })
    .where(and(eq(deliveryStops.id, stopId), isNull(deliveryStops.deletedAt)));
  const stop = await db.query.deliveryStops.findFirst({
    where: eq(deliveryStops.id, stopId),
  });

  if (stop?.orderId) {
    await db
      .update(orders)
      .set({ status: "fallida", updatedAt: now })
      .where(eq(orders.id, stop.orderId));
  }

  return {
    success: true,
    message: "Delivery marked as failed",
    data: { reason: parseResult.data.reason },
  };
});
