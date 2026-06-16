import { z } from "zod";
import { db } from "../../db";
import { orders } from "../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

const orderUpdateSchema = z.object({
  referenceCode: z.string().optional(),
  itemsCount: z.number().int().min(1).optional(),
  weightKg: z.number().optional(),
  priority: z.enum(["baja", "normal", "alta", "urgente"]).optional(),
  notes: z.string().optional(),
  deliveryAddress: z.string().min(1).optional(),
  deliveryLat: z.number().min(-90).max(90).optional(),
  deliveryLng: z.number().min(-180).max(180).optional(),
  status: z.enum(["pendiente", "asignada", "en_ruta", "entregada", "fallida", "cancelada"]).optional(),
});

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing order id" });

  const body = await readBody(event);
  const parseResult = orderUpdateSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const updates = Object.fromEntries(
    Object.entries(parseResult.data).filter(([_, v]) => v !== undefined)
  );

  await db
    .update(orders)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(orders.id, id), isNull(orders.deletedAt)));

  return { success: true, message: "Order updated" };
});
