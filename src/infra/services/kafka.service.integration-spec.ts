import { ConfigModule } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { kafkaSetup } from '@test/helpers/kafka-setup'
import type { StartedRedpandaContainer } from '@testcontainers/redpanda'
import { Kafka } from 'kafkajs'
import { throwError } from 'rxjs'

import { envSchema } from '@/infra/env/env'

import { EnvModule } from '../env/env.module'
import { KafkaService } from './kafka.service'
import { ServicesModule } from './services.module'

describe('KafkaService (Integration)', () => {
  let kafkaService: KafkaService
  let container: StartedRedpandaContainer
  let kafkaBroker: string

  beforeAll(async () => {
    const kafka = await kafkaSetup()
    container = kafka.container
    kafkaBroker = kafka.brokers[0]

    const admin = new Kafka({
      clientId: 'kafka-service-admin',
      brokers: [kafkaBroker],
    }).admin()

    await admin.connect()
    await admin.createTopics({
      topics: [{ topic: 'test-topic' }],
    })
    await admin.disconnect()

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          validate: (env) =>
            envSchema.parse({
              ...env,
              KAFKA_BROKER: kafkaBroker,
              KAFKA_CLIENT_ID: 'test-psych-analysis',
            }),
          isGlobal: true,
        }),
        EnvModule,
        ServicesModule,
      ],
    }).compile()

    kafkaService = moduleRef.get(KafkaService)
  })

  afterAll(async () => {
    if (container) {
      await container.stop()
    }
  })

  it('should have PSYCH_ANALYSIS_SERVICE client available', () => {
    expect(kafkaService['kafka']).toBeDefined()
  })

  describe('emit', () => {
    it('should emit message to topic', async () => {
      const topic = 'test-topic'
      const payload = { test: 'data' }
      const emitSpy = jest.spyOn(kafkaService['kafka'], 'emit')

      await kafkaService.emit(topic, payload)

      expect(emitSpy).toHaveBeenCalledWith(topic, payload)
    })

    it('should handle emit errors gracefully', async () => {
      const topic = 'test-topic'
      const payload = { test: 'data' }
      const error = new Error('Kafka connection error')
      const emitSpy = jest
        .spyOn(kafkaService['kafka'], 'emit')
        .mockImplementation(() => throwError(() => error))

      await expect(kafkaService.emit(topic, payload)).rejects.toThrow(error)
      expect(emitSpy).toHaveBeenCalledWith(topic, payload)
    })
  })
})
