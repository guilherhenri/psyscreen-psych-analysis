import { DataSource, type DataSourceOptions } from 'typeorm'

import { envSchema } from '../env/env'

export const getDataSourceOptions = (): DataSourceOptions => {
  const env = envSchema.parse(process.env)

  return {
    type: 'postgres',
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    schema: env.DATABASE_SCHEMA,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/**/*{.js,.ts}'],
    migrationsRun: false,
    synchronize: false,
    extra: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
      statement_timeout: 30000,
      query_timeout: 30000,
    },
    logging: env.NODE_ENV === 'development',
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  }
}

export default new DataSource(getDataSourceOptions())
