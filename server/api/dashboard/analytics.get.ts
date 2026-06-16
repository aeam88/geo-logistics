import { db } from "../../db";
import { routes, deliveryStops, drivers, locationHistory } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { eq, and, isNull, gte, lte, count as drizzleCount, sql, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const query = getQuery(event);
  const dateFrom = (query.from as string) || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const dateTo = (query.to as string) || new Date().toISOString().split("T")[0]!;
  const driverId = query.driverId as string | undefined;

  const routeConditions = [
    isNull(routes.deletedAt),
    gte(routes.date, dateFrom),
    lte(routes.date, dateTo),
  ];

  if (driverId) routeConditions.push(eq(routes.driverId, driverId));

  const [totalRoutes, completedRoutes, pendingRoutes, dispatchedRoutes] = await Promise.all([
    db.select({ total: drizzleCount() }).from(routes).where(and(...routeConditions)),
    db.select({ total: drizzleCount() }).from(routes).where(and(...routeConditions, eq(routes.status, "completada"))),
    db.select({ total: drizzleCount() }).from(routes).where(and(...routeConditions, eq(routes.status, "pendiente"))),
    db.select({ total: drizzleCount() }).from(routes).where(and(...routeConditions, eq(routes.status, "despachada"))),
  ]);

  const routeIds = await db.select({ id: routes.id }).from(routes).where(and(...routeConditions));

  const stopConditions = [isNull(deliveryStops.deletedAt)];
  if (routeIds.length > 0) {
    stopConditions.push(sql`${deliveryStops.routeId} IN ${routeIds.map(r => r.id)}`);
  }

  const [totalStops, deliveredStops, failedStops] = await Promise.all([
    db.select({ total: drizzleCount() }).from(deliveryStops).where(and(...stopConditions)),
    db.select({ total: drizzleCount() }).from(deliveryStops).where(and(...stopConditions, eq(deliveryStops.status, "entregado"))),
    db.select({ total: drizzleCount() }).from(deliveryStops).where(and(...stopConditions, eq(deliveryStops.status, "fallido"))),
  ]);

  const routeStats = await db
    .select({
      avgDistance: sql<number>`AVG(${routes.optimizedDistanceKm})`,
      avgDuration: sql<number>`AVG(${routes.estimatedDurationMins})`,
      totalDistance: sql<number>`SUM(${routes.optimizedDistanceKm})`,
      totalDuration: sql<number>`SUM(${routes.estimatedDurationMins})`,
    })
    .from(routes)
    .where(and(...routeConditions));

  const topDrivers = await db
    .select({
      driverId: deliveryStops.routeId,
      routeDriverId: routes.driverId,
      delivered: drizzleCount(),
    })
    .from(deliveryStops)
    .innerJoin(routes, eq(deliveryStops.routeId, routes.id))
    .where(and(
      isNull(deliveryStops.deletedAt),
      eq(deliveryStops.status, "entregado"),
      gte(routes.date, dateFrom),
      lte(routes.date, dateTo)
    ))
    .groupBy(deliveryStops.routeId)
    .orderBy(desc(drizzleCount()))
    .limit(10);

  const routesByDay = await db
    .select({
      date: routes.date,
      total: drizzleCount(),
      completed: sql<number>`SUM(CASE WHEN ${routes.status} = 'completada' THEN 1 ELSE 0 END)`,
    })
    .from(routes)
    .where(and(isNull(routes.deletedAt), gte(routes.date, dateFrom), lte(routes.date, dateTo)))
    .groupBy(routes.date)
    .orderBy(routes.date);

  const activeDrivers = await db
    .select({ total: drizzleCount() })
    .from(drivers)
    .where(and(isNull(drivers.deletedAt), eq(drivers.status, "en_ruta")));

  const totalDriversCount = await db
    .select({ total: drizzleCount() })
    .from(drivers)
    .where(isNull(drivers.deletedAt));

  return {
    success: true,
    data: {
      period: { from: dateFrom, to: dateTo },
      routes: {
        total: totalRoutes[0]?.total ?? 0,
        completed: completedRoutes[0]?.total ?? 0,
        pending: pendingRoutes[0]?.total ?? 0,
        dispatched: dispatchedRoutes[0]?.total ?? 0,
        completionRate: totalRoutes[0]?.total ? Math.round(((completedRoutes[0]?.total ?? 0) / totalRoutes[0].total) * 100) : 0,
      },
      deliveries: {
        total: totalStops[0]?.total ?? 0,
        delivered: deliveredStops[0]?.total ?? 0,
        failed: failedStops[0]?.total ?? 0,
        successRate: totalStops[0]?.total ? Math.round(((deliveredStops[0]?.total ?? 0) / totalStops[0].total) * 100) : 0,
      },
      performance: {
        avgDistanceKm: Math.round((routeStats[0]?.avgDistance ?? 0) * 10) / 10,
        avgDurationMins: Math.round(routeStats[0]?.avgDuration ?? 0),
        totalDistanceKm: Math.round((routeStats[0]?.totalDistance ?? 0) * 10) / 10,
        totalDurationMins: Math.round(routeStats[0]?.totalDuration ?? 0),
      },
      drivers: {
        active: activeDrivers[0]?.total ?? 0,
        total: totalDriversCount[0]?.total ?? 0,
      },
      routesByDay,
    },
  };
});
