import { z } from "zod";
import { db } from "../../db";
import { drivers } from "../../db/schema";
import { sanitizeZodError } from "../../utils/guards";
import { eq } from "drizzle-orm";

const registerSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  vehiclePlate: z.string().min(1, "Vehicle plate is required"),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parseResult = registerSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const { userId, vehiclePlate } = parseResult.data;

  const existing = await db.query.drivers.findFirst({
    where: eq(drivers.userId, userId),
  });

  if (existing) {
    return { success: true, data: existing, message: "Driver profile already exists" };
  }

  const id = crypto.randomUUID();

  await db.insert(drivers).values({
    id,
    userId,
    vehiclePlate,
    status: "idle",
    updatedAt: new Date(),
  });

  return { success: true, data: { id }, message: "Driver profile created" };
});
