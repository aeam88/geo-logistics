import { z } from "zod";
import { db } from "../../../db";
import { locationHistory, drivers } from "../../../db/schema";
import { requireDriver, sanitizeZodError } from "../../../utils/guards";
import { applyRateLimit } from "../../../utils/rateLimit";
import { eq } from "drizzle-orm";

const batchSchema = z.object({
  points: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().optional(),
    speed: z.number().optional(),
    recordedAt: z.string(),
  })).min(1).max(50),
});

export default defineEventHandler(async (event) => {
  applyRateLimit(event, { maxRequests: 30, windowMs: 60000, keyPrefix: "history-batch" });

  const session = await requireDriver(event);

  const body = await readBody(event);
  const parseResult = batchSchema.safeParse(body);
  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const driverRecord = await db.query.drivers.findFirst({
    where: eq(drivers.userId, session.userId),
  });

  if (!driverRecord) {
    throw createError({ statusCode: 404, statusMessage: "Driver profile not found" });
  }

  const values = parseResult.data.points.map(p => ({
    id: crypto.randomUUID(),
    driverId: driverRecord.id,
    lat: p.lat,
    lng: p.lng,
    accuracy: p.accuracy ?? null,
    speed: p.speed ?? null,
    recordedAt: new Date(p.recordedAt),
  }));

  await db.insert(locationHistory).values(values);

  return {
    success: true,
    message: `Batch insert OK: ${values.length} points`,
    data: { inserted: values.length },
  };
});
