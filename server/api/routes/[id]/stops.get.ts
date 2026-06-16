import { db } from "../../../db";
import { deliveryStops, orders } from "../../../db/schema";
import { requireDispatcher } from "../../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing route id" });

  const stops = await db
    .select({
      id: deliveryStops.id,
      orderId: deliveryStops.orderId,
      clientName: deliveryStops.clientName,
      address: deliveryStops.address,
      lat: deliveryStops.lat,
      lng: deliveryStops.lng,
      stopOrder: deliveryStops.stopOrder,
      status: deliveryStops.status,
      timeWindowStart: deliveryStops.timeWindowStart,
      timeWindowEnd: deliveryStops.timeWindowEnd,
      deliveredAt: deliveryStops.deliveredAt,
      orderReference: orders.referenceCode,
      orderPriority: orders.priority,
    })
    .from(deliveryStops)
    .leftJoin(orders, eq(deliveryStops.orderId, orders.id))
    .where(and(eq(deliveryStops.routeId, id), isNull(deliveryStops.deletedAt)))
    .orderBy(deliveryStops.stopOrder)
    .all();

  return { success: true, data: stops };
});
