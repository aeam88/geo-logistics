import { z } from "zod";
import { db } from "../../db";
import { vehicles } from "../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

const vehicleUpdateSchema = z.object({
  plate: z.string().min(1).optional(),
  type: z.enum(["camion", "furgon", "moto", "camioneta"]).optional(),
  capacityKg: z.number().optional(),
  status: z.enum(["active", "maintenance", "retired"]).optional(),
});

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing vehicle id" });

  const body = await readBody(event);
  const parseResult = vehicleUpdateSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const updates = Object.fromEntries(
    Object.entries(parseResult.data).filter(([_, v]) => v !== undefined)
  );

  await db
    .update(vehicles)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)));

  return { success: true, message: "Vehicle updated" };
});
