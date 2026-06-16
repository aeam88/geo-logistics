import { runSeed } from "../utils/seed";

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV !== "development") {
    throw createError({
      statusCode: 403,
      statusMessage: "Seed is only available in development environment",
    });
  }

  try {
    const result = await runSeed();
    return {
      success: true,
      message: "Development seed completed",
      data: result,
    };
  } catch (err: any) {
    console.error("[SEED] Error:", err);
    throw createError({
      statusCode: 500,
      statusMessage: "Seed failed",
      data: err?.message || "Unknown error",
    });
  }
});
