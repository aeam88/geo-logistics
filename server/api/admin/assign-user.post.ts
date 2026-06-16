import { z } from "zod";
import { db } from "../../db";
import { user } from "../../db/schema";
import { requireAdmin, sanitizeZodError } from "../../utils/guards";
import { eq } from "drizzle-orm";

const assignSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  role: z.enum(["admin", "dispatcher", "driver", "viewer", "fleet_manager"]).optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await requireAdmin(event);

  const parseResult = assignSchema.safeParse(body);
  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const { userId, organizationId, role } = parseResult.data;

  const targetUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  const org = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.id, organizationId),
  });

  if (!org) {
    throw createError({ statusCode: 404, statusMessage: "Organization not found" });
  }

  const updates: any = { organizationId, updatedAt: new Date() };
  if (role) updates.role = role;

  await db.update(user).set(updates).where(eq(user.id, userId));

  return { success: true, message: "User assigned to organization" };
});
