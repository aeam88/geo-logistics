import { db } from "../../../db";
import { organizations } from "../../../db/schema";
import { requireAdmin } from "../../../utils/guards";
import { isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const list = await db
    .select()
    .from(organizations)
    .where(isNull(organizations.deletedAt));

  return { success: true, data: list };
});
