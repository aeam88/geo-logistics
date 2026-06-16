import { db } from "../../db";
import { vehicles } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const list = await db
    .select()
    .from(vehicles)
    .where(isNull(vehicles.deletedAt));

  return { success: true, data: list };
});
