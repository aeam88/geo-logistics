import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function main() {
  const result = await client.execute("SELECT 1 as test");
  console.log("Connection OK:", result.rows);

  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  console.log(
    "Existing tables:",
    tables.rows.map((r: any) => r.name)
  );
}

main().catch(console.error);
