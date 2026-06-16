import { db } from "../../db";
import { orders, clients } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing order id" });

  const order = await db
    .select({
      id: orders.id,
      clientId: orders.clientId,
      clientName: clients.name,
      routeId: orders.routeId,
      referenceCode: orders.referenceCode,
      itemsCount: orders.itemsCount,
      weightKg: orders.weightKg,
      priority: orders.priority,
      notes: orders.notes,
      deliveryAddress: orders.deliveryAddress,
      deliveryLat: orders.deliveryLat,
      deliveryLng: orders.deliveryLng,
      status: orders.status,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
    .get();

  if (!order) throw createError({ statusCode: 404, statusMessage: "Order not found" });

  return { success: true, data: order };
});
