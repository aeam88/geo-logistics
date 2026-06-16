import { defineEventHandler, readBody, createError } from "h3";
import { emitTelemetry } from "../../utils/telemetry";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body) {
    throw createError({ statusCode: 400, statusMessage: "Empty body" });
  }

  try {
    console.log("[Webhook Turso] Payload received:", JSON.stringify(body));
    const data = body.new || body.data || body;

    if (!data.driverId || data.lat === undefined || data.lng === undefined) {
      const driverId = data.driverId || data.id;

      if (!driverId) {
        throw new Error("Payload missing driverId/id");
      }

      emitTelemetry({
        driverId,
        lat: Number(data.currentLat || data.lat),
        lng: Number(data.currentLng || data.lng),
        status: data.status || "idle",
        vehiclePlate: data.vehiclePlate || "N/A",
      });
    } else {
      emitTelemetry({
        driverId: data.driverId,
        lat: Number(data.lat),
        lng: Number(data.lng),
        status: data.status,
        vehiclePlate: data.vehiclePlate || "N/A",
      });
    }

    return { success: true, message: "Webhook processed and telemetry emitted" };
  } catch (err: any) {
    console.error("[Webhook Turso] Error processing payload:", err);
    throw createError({
      statusCode: 500,
      statusMessage: "Error processing webhook payload",
    });
  }
});
