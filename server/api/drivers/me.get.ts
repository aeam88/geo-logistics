import { eq } from "drizzle-orm";
import { db } from "../../db";
import { drivers } from "../../db/schema";
import { requireDriver } from "../../utils/guards";

export default defineEventHandler(async (event) => {
  const session = await requireDriver(event);

  const driver = await db.query.drivers.findFirst({
    where: eq(drivers.userId, session.userId),
  });

  if (!driver) {
    throw createError({ statusCode: 404, statusMessage: "Driver profile not found" });
  }

  return {
    success: true,
    data: driver,
  };
});
