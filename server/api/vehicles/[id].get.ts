import { db } from "../../db";
import { vehicles } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing vehicle id" });

  const vehicle = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)))
    .get();

  if (!vehicle) throw createError({ statusCode: 404, statusMessage: "Vehicle not found" });

  return { success: true, data: vehicle };
});
