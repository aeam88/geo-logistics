import {z} from "zod"

const EnvSchema = z.object({
    NODE_ENV: z.string(),
    DATABASE_URL: z.string(),
    DATABASE_AUTH_TOKEN: z.string(),
    BETTER_AUTH_URL: z.string(),
    BETTER_AUTH_SECRET: z.string(),
});

export type EnvSchemaType = z.infer<typeof EnvSchema>;

export default EnvSchema.parse(process.env);