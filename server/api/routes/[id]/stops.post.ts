import { z } from "zod";
import { db } from "../../../db";
import { deliveryStops } from "../../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../../utils/guards";
import { eq } from "drizzle-orm";

const stopSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  address: z.string().min(1, "Address is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timeWindowStart: z.string().optional(),
  timeWindowEnd: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await requireDispatcher(event);

  const routeId = getRouterParam(event, "id");
  if (!routeId) throw createError({ statusCode: 400, statusMessage: "Missing route id" });

  const parseResult = stopSchema.safeParse(body);
  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const existingStops = await db
    .select({ stopOrder: deliveryStops.stopOrder })
    .from(deliveryStops)
    .where(eq(deliveryStops.routeId, routeId));

  const maxOrder = existingStops.reduce((max, s) => Math.max(max, s.stopOrder), 0);
  const id = crypto.randomUUID();

  await db.insert(deliveryStops).values({
    id,
    routeId,
    clientName: parseResult.data.clientName,
    address: parseResult.data.address,
    lat: parseResult.data.lat,
    lng: parseResult.data.lng,
    stopOrder: maxOrder + 1,
    status: "pendiente",
    timeWindowStart: parseResult.data.timeWindowStart || null,
    timeWindowEnd: parseResult.data.timeWindowEnd || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { success: true, data: { id, stopOrder: maxOrder + 1 } };
});
