import { requireAdmin } from "../../utils/guards";
import { archiveOldHistory, countOldRecords } from "../../utils/gpsArchive";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);

  if (query.action === "count") {
    const count = await countOldRecords();
    return { success: true, data: { oldRecords: count, daysToKeep: 90 } };
  }

  const result = await archiveOldHistory();

  return {
    success: true,
    message: `Archived ${result.archived} records. ${result.remaining} remaining in DB.`,
    data: result,
  };
});
