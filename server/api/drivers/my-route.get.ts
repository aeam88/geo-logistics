import { eq, and, isNull, gte, lte } from "drizzle-orm";
import { db } from "../../db";
import { drivers, routes, deliveryStops, orders, clients } from "../../db/schema";
import { requireDriver } from "../../utils/guards";

export default defineEventHandler(async (event) => {
  const session = await requireDriver(event);

  const driver = await db.query.drivers.findFirst({
    where: eq(drivers.userId, session.userId),
  });

  if (!driver) {
    throw createError({ statusCode: 404, statusMessage: "Driver profile not found" });
  }

  const todayStr = new Date().toISOString().split("T")[0]!;

  const route = await db
    .select()
    .from(routes)
    .where(
      and(
        eq(routes.driverId, driver.id),
        eq(routes.date, todayStr),
        isNull(routes.deletedAt)
      )
    )
    .get();

  if (!route) {
    return {
      success: true,
      data: null,
      message: "No active route assigned for today",
    };
  }

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
      orderNotes: orders.notes,
      orderWeight: orders.weightKg,
      orderItems: orders.itemsCount,
      clientPhone: clients.contactPhone,
    })
    .from(deliveryStops)
    .leftJoin(orders, eq(deliveryStops.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(and(eq(deliveryStops.routeId, route.id), isNull(deliveryStops.deletedAt)))
    .orderBy(deliveryStops.stopOrder)
    .all();

  return {
    success: true,
    data: {
      route,
      stops,
      driver: {
        id: driver.id,
        vehiclePlate: driver.vehiclePlate,
        status: driver.status,
      },
    },
  };
});
