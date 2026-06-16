import { z } from "zod";
import { db } from "../../../db";
import { orders } from "../../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

const assignSchema = z.object({
  routeId: z.string().uuid(),
});

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing order id" });

  const body = await readBody(event);
  const parseResult = assignSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  await db
    .update(orders)
    .set({ routeId: parseResult.data.routeId, status: "asignada", updatedAt: new Date() })
    .where(and(eq(orders.id, id), isNull(orders.deletedAt)));

  return { success: true, message: "Order assigned to route" };
});
