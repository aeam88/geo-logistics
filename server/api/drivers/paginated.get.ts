import { db } from "../../db";
import { drivers } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { isNull, count as drizzleCount } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const query = getQuery(event);
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const whereClause = isNull(drivers.deletedAt);

  const [driversList, countResult] = await Promise.all([
    db.select().from(drivers).where(whereClause).limit(limit).offset(offset),
    db.select({ total: drizzleCount() }).from(drivers).where(whereClause),
  ]);

  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data: {
      drivers: driversList.map(d => ({
        id: d.id,
        userId: d.userId,
        vehiclePlate: d.vehiclePlate,
        status: d.status,
        currentLat: d.currentLat,
        currentLng: d.currentLng,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
      },
    },
  };
});
