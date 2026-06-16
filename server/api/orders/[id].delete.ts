import { db } from "../../db";
import { orders } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing order id" });

  await db
    .update(orders)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(orders.id, id), isNull(orders.deletedAt)));

  return { success: true, message: "Order soft-deleted" };
});
