import { z } from "zod";
import { db } from "../../db";
import { routes, deliveryStops, drivers } from "../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../utils/guards";
import { eq, and, isNull, count as drizzleCount } from "drizzle-orm";
import { sendPushNotification } from "../../utils/pushNotifications";

const routeUpdateSchema = z.object({
  driverId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  optimizedDistanceKm: z.number().optional(),
  estimatedDurationMins: z.number().int().optional(),
  status: z.enum(["pendiente", "despachada", "completada"]).optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await requireDispatcher(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing route id" });

  const parseResult = routeUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    const sanitized = sanitizeZodError(parseResult.error);
    throw createError({ statusCode: 400, statusMessage: sanitized.message, data: sanitized.details });
  }

  const currentRoute = await db.query.routes.findFirst({
    where: and(eq(routes.id, id), isNull(routes.deletedAt)),
  });

  if (!currentRoute) {
    throw createError({ statusCode: 404, statusMessage: "Route not found" });
  }

  if (parseResult.data.status === "despachada") {
    const driverId = parseResult.data.driverId || currentRoute.driverId;
    if (!driverId) {
      throw createError({ statusCode: 400, statusMessage: "No se puede despachar: ruta sin conductor asignado" });
    }

    const [stopsCount] = await db
      .select({ total: drizzleCount() })
      .from(deliveryStops)
      .where(and(eq(deliveryStops.routeId, id), isNull(deliveryStops.deletedAt)));

    if (!stopsCount || stopsCount.total === 0) {
      throw createError({ statusCode: 400, statusMessage: "No se puede despachar: ruta sin paradas asignadas" });
    }

    if (currentRoute.status === "despachada" || currentRoute.status === "completada") {
      throw createError({ statusCode: 400, statusMessage: `No se puede despachar: ruta ya está "${currentRoute.status}"` });
    }
  }

  const updates = Object.fromEntries(
    Object.entries(parseResult.data).filter(([_, v]) => v !== undefined)
  );

  await db
    .update(routes)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(routes.id, id), isNull(routes.deletedAt)));

  if (parseResult.data.status === "despachada") {
    const driverId = parseResult.data.driverId || currentRoute.driverId;
    if (driverId) {
      const driverRecord = await db.query.drivers.findFirst({
        where: eq(drivers.id, driverId),
      });

      if (driverRecord) {
        await sendPushNotification(driverRecord.userId, {
          title: "Nueva ruta asignada",
          body: `Se te ha asignado una ruta para el ${currentRoute.date}. Revisa tu app.`,
          icon: "/icon-192.png",
          data: { routeId: id, type: "route_assigned" },
        });
      }
    }
  }

  return { success: true, message: "Route updated" };
});
