import { z } from "zod";
import { db } from "../../db";
import { dispatchZones } from "../../db/schema";
import { requireDispatcher, sanitizeZodError } from "../../utils/guards";
import { invalidateZonesCache } from "../../utils/zonesCache";

const zoneSchema = z.object({
  name: z.string().min(1, "Zone name is required"),
  geometryJson: z.string().min(10, "Valid GeoJSON polygon is required"),
});

export default defineEventHandler(async (event) => {
  console.log("[API /zones POST] Request received");

  try {
    const body = await readBody(event);
    console.log("[API /zones POST] Body:", body?.name);

    await requireDispatcher(event);

    const parseResult = zoneSchema.safeParse(body);
    if (!parseResult.success) {
      const sanitized = sanitizeZodError(parseResult.error);
      throw createError({ statusCode: 400, statusMessage: sanitized.message });
    }

    let geoData: any;
    try {
      geoData = JSON.parse(parseResult.data.geometryJson);
    } catch {
      throw createError({ statusCode: 400, statusMessage: "GeoJSON no es JSON válido" });
    }

    let geometry = geoData;
    if (geoData?.type === "Feature" && geoData.geometry) {
      geometry = geoData.geometry;
    }
    if (geoData?.type === "FeatureCollection" && geoData.features?.length > 0) {
      geometry = geoData.features[0].geometry || geoData.features[0];
    }

    if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) {
      throw createError({ statusCode: 400, statusMessage: "GeoJSON debe ser Polygon o MultiPolygon" });
    }

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(dispatchZones).values({
      id,
      name: parseResult.data.name,
      geometryJson: parseResult.data.geometryJson,
      createdAt: now,
      updatedAt: now,
    });

    console.log("[API /zones POST] Success. ID:", id);
    invalidateZonesCache();
    return { success: true, data: { id } };
  } catch (err: any) {
    console.error("[API /zones POST] ERROR:", err?.statusCode, err?.statusMessage);
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || "Error interno al guardar la zona",
    });
  }
});
