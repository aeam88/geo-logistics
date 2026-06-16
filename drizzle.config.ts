import "dotenv/config";
import { defineConfig } from "drizzle-kit";

import env from "./server/utils/env";

export default defineConfig({
    out: './server/db/migrations',
    schema: './server/db/schema.ts',
    dialect: 'turso',
    dbCredentials: {
        url: env.DATABASE_URL,
        authToken: env.NODE_ENV === "development" ? undefined : env.DATABASE_AUTH_TOKEN
    }
})