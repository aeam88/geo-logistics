
import { db } from "../../db/index";
import { deliveryStops } from "../../db/schema";
import { sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const centerLat = parseFloat(query.lat as string);
  const centerLng = parseFloat(query.lng as string);
  const maxRadiusKm = parseFloat(query.radius as string) || 5;

  if (!centerLat || !centerLng) {
    throw createError({ statusCode: 400, message: "Missing latitude or longitude" });
  }

  const distanceSql = sql<number>`(
    6371 * acos(
      cos(radians(${centerLat})) * cos(radians(${deliveryStops.lat})) *
      cos(radians(${deliveryStops.lng}) - radians(${centerLng})) +
      sin(radians(${centerLat})) * sin(radians(${deliveryStops.lat}))
    )
  )`;

  const nearbyStops = await db
    .select({
      id: deliveryStops.id,
      clientName: deliveryStops.clientName,
      address: deliveryStops.address,
      lat: deliveryStops.lat,
      lng: deliveryStops.lng,
      distance: distanceSql,
    })
    .from(deliveryStops)
    .where(sql`${distanceSql} <= ${maxRadiusKm}`)
    .orderBy(distanceSql)
    .limit(50);

  return nearbyStops;
});