import { z } from "zod";
import { db } from "../../db";
import { clients } from "../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../utils/guards";
import { eq, and, isNull } from "drizzle-orm";

const clientUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export default defineEventHandler(async (event) => {
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing client id" });

  const body = await readBody(event);
  const parseResult = clientUpdateSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const updates = Object.fromEntries(
    Object.entries(parseResult.data).filter(([_, v]) => v !== undefined)
  );

  await db
    .update(clients)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)));

  return { success: true, message: "Client updated" };
});
