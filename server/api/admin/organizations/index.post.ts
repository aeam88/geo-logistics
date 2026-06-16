import { z } from "zod";
import { db } from "../../../db";
import { organizations } from "../../../db/schema";
import { requireAdmin, sanitizeZodError } from "../../../utils/guards";

const orgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await requireAdmin(event);

  const parseResult = orgSchema.safeParse(body);
  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const existing = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.slug, parseResult.data.slug),
  });

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "Organization slug already exists" });
  }

  const id = crypto.randomUUID();

  await db.insert(organizations).values({
    id,
    name: parseResult.data.name,
    slug: parseResult.data.slug,
    address: parseResult.data.address || null,
    phone: parseResult.data.phone || null,
    email: parseResult.data.email || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { success: true, data: { id } };
});
