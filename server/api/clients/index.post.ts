import { z } from "zod";
import { db } from "../../db";
import { clients } from "../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../utils/guards";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await requireDispatcher(event);


  const parseResult = clientSchema.safeParse(body);

  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const { name, address, contactPhone, taxId, email } = parseResult.data;

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(clients).values({
    id,
    name,
    address: address || null,
    contactPhone: contactPhone || null,
    taxId: taxId || null,
    email: email || null,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true, data: { id } };
});
