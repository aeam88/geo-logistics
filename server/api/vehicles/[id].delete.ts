import { db } from "../../db";
import { vehicles } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing vehicle id" });

  await db
    .update(vehicles)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)));

  return { success: true, message: "Vehicle soft-deleted" };
});
