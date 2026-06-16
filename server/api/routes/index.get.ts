import { db } from "../../db";
import { routes, drivers, dispatchZones } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, isNull, and, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const query = getQuery(event);
  const statusFilter = query.status as "pendiente" | "despachada" | "completada" | undefined;
  const dateFilter = query.date as string | undefined;

  const conditions = [isNull(routes.deletedAt)];
  if (statusFilter) conditions.push(eq(routes.status, statusFilter));
  if (dateFilter) conditions.push(eq(routes.date, dateFilter));

  const list = await db
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
    })
    .from(routes)
    .leftJoin(drivers, eq(routes.driverId, drivers.id))
    .leftJoin(dispatchZones, eq(routes.zoneId, dispatchZones.id))
    .where(and(...conditions))
    .orderBy(desc(routes.createdAt))
    .all();

  return { success: true, data: list };
});
