import { archiveOldHistory, countOldRecords } from "../utils/gpsArchive";

/**
 * Tarea programada: archivar historial GPS antiguo diariamente.
 * Se ejecuta a las 3:00 AM cada día.
 * 
 * En producción, esto se ejecutaría como un cron job real
 * o una Edge Function programada.
 */
export default defineTask({
  meta: {
    name: "archive-gps-history",
    description: "Archiva registros GPS de location_history con más de 90 días a un archivo JSON y los elimina de la DB.",
  },
  async run() {
    console.log("[Cron] Running GPS history archive task...");

    try {
      const oldCount = await countOldRecords();

      if (oldCount === 0) {
        console.log("[Cron] No old records to archive.");
        return { result: "no_records_to_archive", archived: 0 };
      }

      console.log(`[Cron] Found ${oldCount} old records. Archiving...`);
      const result = await archiveOldHistory();

      console.log(`[Cron] Archive complete: ${result.archived} archived, ${result.remaining} remaining.`);
      return {
        result: "success",
        archived: result.archived,
        remaining: result.remaining,
        archiveFile: result.archiveFile,
      };
    } catch (err) {
      console.error("[Cron] GPS archive task failed:", err);
      return { result: "error", error: String(err) };
    }
  },
});
