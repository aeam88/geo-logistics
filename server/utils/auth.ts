import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db"; 
import { admin } from "better-auth/plugins"; 

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite", 
  }),
  emailAndPassword: {
    enabled: true, 
  },
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    admin({
      defaultRole: "driver", 
    }),
  ],
});