import { db } from "../../db";
import { dispatchZones } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";
import { invalidateZonesCache } from "../../utils/zonesCache";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing zone id" });

  await db
    .update(dispatchZones)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(dispatchZones.id, id), isNull(dispatchZones.deletedAt)));

  invalidateZonesCache();
  return { success: true, message: "Zone soft-deleted" };
});
