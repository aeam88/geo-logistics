import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db";
import { drivers } from "../../db/schema";
import { requireDriver, sanitizeZodError } from "../../utils/guards";
import { applyRateLimit } from "../../utils/rateLimit";
import { emitTelemetry } from "../../utils/telemetry";

const updateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  status: z.enum(["idle", "en_ruta", "offline"]).optional(),
});

export default defineEventHandler(async (event) => {
  applyRateLimit(event, { maxRequests: 60, windowMs: 60000, keyPrefix: "telemetry" });

  const session = await requireDriver(event);

  const body = await readBody(event);
  const parseResult = updateSchema.safeParse(body);
  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const { lat, lng, status } = parseResult.data;

  const driverRecord = await db.query.drivers.findFirst({
    where: eq(drivers.userId, session.userId),
  });

  if (!driverRecord) {
    throw createError({ statusCode: 404, statusMessage: "Driver profile not found" });
  }

  const newStatus = status || driverRecord.status;
  const now = new Date();

  await db.update(drivers).set({
    currentLat: lat,
    currentLng: lng,
    status: newStatus,
    updatedAt: now,
  }).where(eq(drivers.id, driverRecord.id));

  emitTelemetry({
    driverId: driverRecord.id,
    lat,
    lng,
    status: newStatus,
    vehiclePlate: driverRecord.vehiclePlate,
  });

  return {
    success: true,
    data: { driverId: driverRecord.id, vehiclePlate: driverRecord.vehiclePlate, lat, lng, status: newStatus },
  };
});
