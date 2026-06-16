import { z } from "zod";
import { db } from "../../../db";
import { deliveryStops } from "../../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../../utils/guards";
import { eq, and, inArray, isNull } from "drizzle-orm";

const reorderSchema = z.object({
  stopIds: z.array(z.string().uuid()).min(1, "At least one stop required"),
});

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const routeId = getRouterParam(event, "id");
  if (!routeId) throw createError({ statusCode: 400, statusMessage: "Missing route id" });

  const body = await readBody(event);
  const parseResult = reorderSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const { stopIds } = parseResult.data;

  const existingStops = await db
    .select({ id: deliveryStops.id })
    .from(deliveryStops)
    .where(
      and(
        eq(deliveryStops.routeId, routeId),
        inArray(deliveryStops.id, stopIds),
        isNull(deliveryStops.deletedAt)
      )
    )
    .all();

  if (existingStops.length !== stopIds.length) {
    throw createError({ statusCode: 400, statusMessage: "Some stops do not belong to this route" });
  }

  const now = new Date();
  for (let i = 0; i < stopIds.length; i++) {
    await db
      .update(deliveryStops)
      .set({ stopOrder: i + 1, updatedAt: now })
      .where(eq(deliveryStops.id, stopIds[i]!));
  }

  return { success: true, message: "Stops reordered successfully" };
});
