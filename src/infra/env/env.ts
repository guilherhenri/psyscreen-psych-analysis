import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  DATABASE_HOST: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string(),
  DATABASE_PORT: z.coerce.number(),
  DATABASE_SCHEMA: z.string().optional().default('public'),

  KAFKA_BROKER: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().default('psych-analysis'),
  KAFKA_CONSUMER_GROUP: z.string().default('psych-analysis-consumer'),
  KAFKA_RETRY_COUNT: z.coerce.number().default(8),

  GEMINI_API_KEY: z.string(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_TEMPERATURE: z.coerce.number().default(0.4),
  GEMINI_MAX_OUTPUT_TOKENS: z.coerce.number().default(1024),
})

export type Env = z.infer<typeof envSchema>
