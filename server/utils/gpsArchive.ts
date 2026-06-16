import { db } from "../db";
import { locationHistory } from "../db/schema";
import { lt, eq, count as drizzleCount } from "drizzle-orm";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const ARCHIVE_DIR = join(process.cwd(), "archives", "gps-history");
const DAYS_TO_KEEP = 90;

function getRetentionCutoff(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_TO_KEEP);
  return cutoff;
}

export async function countOldRecords(): Promise<number> {
  const cutoff = getRetentionCutoff();
  const [result] = await db
    .select({ total: drizzleCount() })
    .from(locationHistory)
    .where(lt(locationHistory.recordedAt, cutoff));
  return result?.total ?? 0;
}

export async function archiveOldHistory(): Promise<{
  archived: number;
  remaining: number;
  archiveFile: string;
}> {
  const cutoff = getRetentionCutoff();
  const BATCH_SIZE = 1000;
  let totalArchived = 0;
  const allRecords: any[] = [];

  console.log(`[GPS Archive] Archiving records older than ${cutoff.toISOString()}`);

  while (true) {
    const batch = await db
      .select()
      .from(locationHistory)
      .where(lt(locationHistory.recordedAt, cutoff))
      .limit(BATCH_SIZE);

    if (batch.length === 0) break;

    allRecords.push(...batch);
    totalArchived += batch.length;

    for (const record of batch) {
      await db.delete(locationHistory).where(eq(locationHistory.id, record.id));
    }

    if (batch.length < BATCH_SIZE) break;
  }

  await mkdir(ARCHIVE_DIR, { recursive: true });

  const now = new Date();
  const filename = `gps-history-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.json`;
  const filepath = join(ARCHIVE_DIR, filename);

  const archiveData = {
    archivedAt: now.toISOString(),
    retentionCutoff: cutoff.toISOString(),
    recordCount: allRecords.length,
    records: allRecords,
  };

  await writeFile(filepath, JSON.stringify(archiveData, null, 2));

  const [remainingResult] = await db
    .select({ total: drizzleCount() })
    .from(locationHistory);
  const remaining = remainingResult?.total ?? 0;

  console.log(`[GPS Archive] Archived ${totalArchived} records to ${filename}. Remaining: ${remaining}`);

  return { archived: totalArchived, remaining, archiveFile: filename };
}
