import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
config();

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const migrationsDir = join(process.cwd(), "server/db/migrations");

const migrationFiles = [
  "0000_lean_komodo.sql",
  "0001_lazy_vertigo.sql",
  "0002_wet_sister_grimm.sql",
  "0003_clumsy_lester.sql",
  "0004_sparkling_jasper_sitwell.sql",
  "0005_tan_sally_floyd.sql",
];

async function main() {
  console.log("Applying migrations to cloud DB...");

  for (const file of migrationFiles) {
    const path = join(migrationsDir, file);
    const sql = readFileSync(path, "utf-8");

    const statements = sql
      .split("--> statement-breakpoint")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    console.log(`Applying ${file} (${statements.length} statements)...`);

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (err: any) {
        if (err.message?.includes("already exists")) {
          console.log(`  (skipped: ${err.message.substring(0, 50)})`);
        } else {
          console.error(`  ERROR: ${err.message}`);
        }
      }
    }

    console.log(`  ✓ ${file} done`);
  }

  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log("\nFinal tables:", tables.rows.map((r: any) => r.name).join(", "));
}

main().catch(console.error);
