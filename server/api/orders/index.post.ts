import { z } from "zod";
import { db } from "../../db";
import { orders } from "../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../utils/guards";

const orderSchema = z.object({
  clientId: z.string().uuid(),
  referenceCode: z.string().optional(),
  itemsCount: z.number().int().min(1).default(1),
  weightKg: z.number().optional(),
  priority: z.enum(["baja", "normal", "alta", "urgente"]).default("normal"),
  notes: z.string().optional(),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryLat: z.number().min(-90).max(90).optional(),
  deliveryLng: z.number().min(-180).max(180).optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await requireDispatcher(event);


  const parseResult = orderSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(orders).values({
    id,
    ...parseResult.data,
    status: "pendiente",
    createdAt: now,
    updatedAt: now,
  });

  return { success: true, data: { id } };
});
