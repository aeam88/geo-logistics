import { requireSession, sanitizeZodError } from "../../utils/guards";
import { registerPushSubscription } from "../../utils/pushNotifications";
import { z } from "zod";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);
  const body = await readBody(event);

  const parseResult = subscriptionSchema.safeParse(body);
  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const subId = await registerPushSubscription(session.userId, parseResult.data);

  return { success: true, data: { subscriptionId: subId } };
});
