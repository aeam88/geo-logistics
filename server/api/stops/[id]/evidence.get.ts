import { db } from "../../../db";
import { deliveryEvidences } from "../../../db/schema";
import { requireDispatcher } from "../../../utils/guards";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const stopId = getRouterParam(event, "id");
  if (!stopId) throw createError({ statusCode: 400, statusMessage: "Missing stop id" });

  const evidences = await db
    .select({
      id: deliveryEvidences.id,
      photoUrl: deliveryEvidences.photoUrl,
      signatureData: deliveryEvidences.signatureData,
      recipientName: deliveryEvidences.recipientName,
      notes: deliveryEvidences.notes,
      createdAt: deliveryEvidences.createdAt,
    })
    .from(deliveryEvidences)
    .where(eq(deliveryEvidences.stopId, stopId))
    .all();

  return { success: true, data: evidences };
});
