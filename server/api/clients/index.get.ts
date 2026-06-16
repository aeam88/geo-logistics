import { db } from "../../db";
import { clients } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const list = await db
    .select()
    .from(clients)
    .where(isNull(clients.deletedAt));

  return { success: true, data: list };
});
