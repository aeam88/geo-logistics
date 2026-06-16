import { db } from "../../db";
import { routes } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing route id" });

  await db
    .update(routes)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(routes.id, id), isNull(routes.deletedAt)));

  return { success: true, message: "Route deleted" };
});
