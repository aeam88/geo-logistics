import { db } from "../../db";
import { routes, drivers, dispatchZones } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing route id" });

  const route = await db
    .select({
      id: routes.id,
      date: routes.date,
      status: routes.status,
      optimizedDistanceKm: routes.optimizedDistanceKm,
      estimatedDurationMins: routes.estimatedDurationMins,
      driverId: routes.driverId,
      driverName: drivers.vehiclePlate,
      zoneId: routes.zoneId,
      zoneName: dispatchZones.name,
      createdAt: routes.createdAt,
      updatedAt: routes.updatedAt,
    })
    .from(routes)
    .leftJoin(drivers, eq(routes.driverId, drivers.id))
    .leftJoin(dispatchZones, eq(routes.zoneId, dispatchZones.id))
    .where(and(eq(routes.id, id), isNull(routes.deletedAt)))
    .get();

  if (!route) throw createError({ statusCode: 404, statusMessage: "Route not found" });

  return { success: true, data: route };
});
