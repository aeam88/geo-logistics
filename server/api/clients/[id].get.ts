import { db } from "../../db";
import { clients } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing client id" });

  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
    .get();

  if (!client) throw createError({ statusCode: 404, statusMessage: "Client not found" });

  return { success: true, data: client };
});
