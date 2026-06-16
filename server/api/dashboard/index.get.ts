import { db } from "../../db";
import { deliveryStops, drivers } from "../../db/schema";
import { requireDispatcher } from "../../utils/guards";
import { isNull } from "drizzle-orm";
import { getCachedZones } from "../../utils/zonesCache";

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const [zonesList, stopsList, driversList] = await Promise.all([
    getCachedZones(),
    db.select().from(deliveryStops).where(isNull(deliveryStops.deletedAt)),
    db.select().from(drivers).where(isNull(drivers.deletedAt)),
  ]);

  return {
    success: true,
    data: {
      zones: zonesList,
      stops: stopsList,
      drivers: driversList.map(d => ({
        id: d.id,
        userId: d.userId,
        vehiclePlate: d.vehiclePlate,
        status: d.status,
        currentLat: d.currentLat,
        currentLng: d.currentLng,
      })),
    },
  };
});
