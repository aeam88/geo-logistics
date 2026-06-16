import { z } from "zod";
import { db } from "../../db";
import { routes } from "../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../utils/guards";

const routeSchema = z.object({
  driverId: z.string().min(1, "Driver is required"),
  zoneId: z.string().min(1, "Zone is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  optimizedDistanceKm: z.number().nullable().optional(),
  estimatedDurationMins: z.number().int().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await requireDispatcher(event);
  const parseResult = routeSchema.safeParse(body);

  if (!parseResult.success) {
    console.error("ZOD VALIDATION ERROR:", parseResult.error.format());
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(routes).values({
    id,
    ...parseResult.data,
    status: "pendiente",
    createdAt: now,
    updatedAt: now,
  });

  return { success: true, data: { id } };
});
