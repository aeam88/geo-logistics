import { z } from "zod";
import { db } from "../../db";
import { invitations, user } from "../../db/schema";
import { requireSession, sanitizeZodError } from "../../utils/guards";
import { eq } from "drizzle-orm";

const acceptSchema = z.object({
  token: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const session = await requireSession(event);

  const parseResult = acceptSchema.safeParse(body);
  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const { token } = parseResult.data;

  const now = new Date();
  const invitation = await db.query.invitations.findFirst({
    where: (i, { and, eq, isNull, gt }) =>
      and(
        eq(i.token, token),
        isNull(i.acceptedAt),
        gt(i.expiresAt, now)
      ),
  });

  if (!invitation) {
    throw createError({ statusCode: 400, statusMessage: "Invalid or expired invitation" });
  }

  if (invitation.email !== session.email) {
    throw createError({ statusCode: 403, statusMessage: "Invitation email does not match your account" });
  }

  await db
    .update(user)
    .set({
      organizationId: invitation.organizationId,
      role: invitation.role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.userId));

  await db
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.id, invitation.id));

  return {
    success: true,
    message: "Invitation accepted. You now belong to the organization.",
    data: {
      organizationId: invitation.organizationId,
      role: invitation.role,
    },
  };
});
