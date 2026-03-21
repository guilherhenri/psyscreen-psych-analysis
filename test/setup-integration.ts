import 'dotenv/config'

import { randomUUID } from 'node:crypto'

import { DataSource } from 'typeorm'

import { getDataSourceOptions } from '@/infra/database/data-source'
import { envSchema } from '@/infra/env/env'

process.env.NODE_ENV = 'test'
process.env.DATABASE_SCHEMA = randomUUID()
process.env.KAFKA_RETRY_COUNT = '0'

const env = envSchema.parse(process.env)

jest.setTimeout(60000)

const dataSource = new DataSource(getDataSourceOptions())

beforeAll(async () => {
  await dataSource.initialize()

  await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${env.DATABASE_SCHEMA}"`)
  await dataSource.query(
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "${env.DATABASE_SCHEMA}"`
  )
  await dataSource.query(`SET search_path TO "${env.DATABASE_SCHEMA}", public`)
  await dataSource.runMigrations()
})

afterAll(async () => {
  await dataSource.query(
    `DROP SCHEMA IF EXISTS "${env.DATABASE_SCHEMA}" CASCADE`
  )
  await dataSource.destroy()
})
