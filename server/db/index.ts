import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

import * as schema from "./schema";

import env from "../utils/env"

const client = createClient({
  url: env.DATABASE_URL!,
  authToken: env.DATABASE_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, {schema});