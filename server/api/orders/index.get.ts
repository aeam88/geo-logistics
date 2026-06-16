import { db } from "../../db";
import { orders, clients } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, isNull, and, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const query = getQuery(event);
  const statusFilter = query.status as "en_ruta" | "pendiente" | "asignada" | "entregada" | "fallida" | "cancelada" | undefined;

  const conditions = [isNull(orders.deletedAt)];
  if (statusFilter) {
    conditions.push(eq(orders.status, statusFilter));
  }

  const list = await db
    .select({
      id: orders.id,
      clientId: orders.clientId,
      clientName: clients.name,
      routeId: orders.routeId,
      referenceCode: orders.referenceCode,
      itemsCount: orders.itemsCount,
      weightKg: orders.weightKg,
      priority: orders.priority,
      deliveryAddress: orders.deliveryAddress,
      deliveryLat: orders.deliveryLat,
      deliveryLng: orders.deliveryLng,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .all();

  return { success: true, data: list };
});
