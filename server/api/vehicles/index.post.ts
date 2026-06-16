import { z } from "zod";
import { db } from "../../db";
import { vehicles } from "../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../utils/guards";

const vehicleSchema = z.object({
  plate: z.string().min(1, "Plate is required"),
  type: z.enum(["camion", "furgon", "moto", "camioneta"]).default("furgon"),
  capacityKg: z.number().optional(),
  status: z.enum(["active", "maintenance", "retired"]).default("active"),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await requireDispatcher(event);
  const parseResult = vehicleSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(vehicles).values({
    id,
    plate: parseResult.data.plate,
    type: parseResult.data.type,
    capacityKg: parseResult.data.capacityKg ?? null,
    status: parseResult.data.status,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true, data: { id } };
});
