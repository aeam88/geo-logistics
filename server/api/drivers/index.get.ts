import { db } from "../../db";
import { drivers, vehicles } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { isNull, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const list = await db
    .select({
      id: drivers.id,
      vehiclePlate: drivers.vehiclePlate,
      status: drivers.status,
      currentLat: drivers.currentLat,
      currentLng: drivers.currentLng,
      vehicleType: vehicles.type,
    })
    .from(drivers)
    .leftJoin(vehicles, eq(drivers.vehicleId, vehicles.id))
    .where(isNull(drivers.deletedAt))
    .all();

  return { success: true, data: list };
});
