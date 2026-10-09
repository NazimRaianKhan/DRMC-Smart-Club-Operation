import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
  DEMO_MODE: z.enum(['true', 'false']).default('false'),
  ALLOW_SEED: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

type Env = z.infer<typeof envSchema>;

let env: Env | undefined;

export function getEnv(): Env {
  if (env) {
    return env;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const missingVars = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${missingVars}. Please check your .env file.`);
  }

  env = parsed.data;
  return env;
}
