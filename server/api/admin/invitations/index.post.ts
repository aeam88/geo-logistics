import { z } from "zod";
import { db } from "../../../db";
import { invitations } from "../../../db/schema";
import { requireAdmin, sanitizeZodError } from "../../../utils/guards";

const inviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["admin", "dispatcher", "driver", "viewer", "fleet_manager"]),
  organizationId: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const session = await requireAdmin(event);

  const parseResult = inviteSchema.safeParse(body);
  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const { email, role, organizationId } = parseResult.data;

  const existingInvite = await db.query.invitations.findFirst({
    where: (i, { eq, and, isNull }) =>
      and(
        eq(i.email, email),
        eq(i.organizationId, organizationId),
        isNull(i.acceptedAt)
      ),
  });

  if (existingInvite) {
    throw createError({ statusCode: 409, statusMessage: "Invitation already pending for this email" });
  }

  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(invitations).values({
    id,
    organizationId,
    email,
    role,
    token,
    invitedBy: session.userId,
    expiresAt,
    createdAt: new Date(),
  });


  return {
    success: true,
    data: { invitationId: id, token },
    message: "Invitation created. Share the token with the user.",
  };
});
