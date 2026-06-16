import { db } from "../../db";
import { deliveryStops } from "../../db/schema";
import { isNull, and, gte, lte } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const swLat = parseFloat(query.sw_lat as string);
  const swLng = parseFloat(query.sw_lng as string);
  const neLat = parseFloat(query.ne_lat as string);
  const neLng = parseFloat(query.ne_lng as string);

  if (isNaN(swLat) || isNaN(swLng) || isNaN(neLat) || isNaN(neLng)) {
    throw createError({ statusCode: 400, statusMessage: "Missing viewport bounds (sw_lat, sw_lng, ne_lat, ne_lng)" });
  }

  const limit = Math.min(parseInt(query.limit as string) || 200, 500);

  const stops = await db
    .select({
      id: deliveryStops.id,
      lat: deliveryStops.lat,
      lng: deliveryStops.lng,
      clientName: deliveryStops.clientName,
      stopOrder: deliveryStops.stopOrder,
      status: deliveryStops.status,
    })
    .from(deliveryStops)
    .where(
      and(
        isNull(deliveryStops.deletedAt),
        gte(deliveryStops.lat, swLat),
        lte(deliveryStops.lat, neLat),
        gte(deliveryStops.lng, swLng),
        lte(deliveryStops.lng, neLng)
      )
    )
    .limit(limit);

  return {
    success: true,
    data: stops,
    count: stops.length,
  };
});
