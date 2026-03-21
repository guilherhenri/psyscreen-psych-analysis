import { ConfigModule } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { PsychAnalysisTopics } from '@psyscreen/contracts'
import { kafkaSetup } from '@test/helpers/kafka-setup'
import type { StartedRedpandaContainer } from '@testcontainers/redpanda'
import { Kafka } from 'kafkajs'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { DomainEvent } from '@/core/events/domain-event'
import { envSchema } from '@/infra/env/env'

import { EnvModule } from '../env/env.module'
import { ServicesModule } from '../services/services.module'
import { KafkaEventPublisher } from './kafka-event-publisher'

interface MockDomainEvent extends DomainEvent {
  [key: string]: unknown
}

interface CreateMockEventOptions {
  eventName?: string
  aggregateId?: string
  payload?: Record<string, unknown>
}

function createMockEvent({
  eventName = 'MockDomainEvent',
  aggregateId,
  payload = {},
}: CreateMockEventOptions = {}): MockDomainEvent {
  return {
    occurredAt: new Date(),
    constructor: { name: eventName } as new () => MockDomainEvent,
    getAggregateId: () => new UniqueEntityID(aggregateId),
    ...payload,
  }
}

describe('KafkaEventPublisher (Integration)', () => {
  let kafkaEventPublisher: KafkaEventPublisher
  let container: StartedRedpandaContainer
  let kafkaBroker: string

  beforeAll(async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    const kafka = await kafkaSetup()
    container = kafka.container
    kafkaBroker = kafka.brokers[0]

    const admin = new Kafka({
      clientId: 'kafka-event-publisher-admin',
      brokers: [kafkaBroker],
    }).admin()

    await admin.connect()
    await admin.createTopics({
      topics: [
        { topic: PsychAnalysisTopics.PSYCH_ANALYSIS_COMPLETED },
        { topic: 'psych-analysis.event.unknown' },
        { topic: 'psych-analysis.event.unknown_domain' },
      ],
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
              KAFKA_RETRY_COUNT: 0,
            }),
          isGlobal: true,
        }),
        EnvModule,
        ServicesModule,
      ],
      providers: [KafkaEventPublisher],
    }).compile()

    kafkaEventPublisher = moduleRef.get(KafkaEventPublisher)
  })

  afterAll(async () => {
    if (container) {
      await container.stop()
    }

    jest.restoreAllMocks()
  })

  describe('publish', () => {
    it('should publish a single domain event', async () => {
      const mockEvent = createMockEvent({
        eventName: 'PsychAnalysisCompletedEvent',
        aggregateId: 'test-aggregate-id',
        payload: {
          analysis: {
            id: new UniqueEntityID('psych-analysis-id'),
            candidateId: 'candidate-1',
            profileId: 'profile-1',
            status: 'completed',
            score: 85,
            report:
              'Strong psychological profile with excellent leadership potential',
            createdAt: new Date(),
          },
        },
      })

      await expect(
        kafkaEventPublisher.publish(mockEvent)
      ).resolves.not.toThrow()
    })

    it('should handle events not in static mapping', async () => {
      const mockEvent = createMockEvent({
        eventName: 'UnknownEvent',
        aggregateId: 'test-aggregate-id',
        payload: {
          data: 'test',
        },
      })

      await expect(
        kafkaEventPublisher.publish(mockEvent)
      ).resolves.not.toThrow()
    })
  })

  describe('publishBatch', () => {
    it('should publish multiple events', async () => {
      const mockEvents: MockDomainEvent[] = [
        createMockEvent({
          eventName: 'PsychAnalysisCompletedEvent',
          aggregateId: 'aggregate-1',
          payload: {
            analysis: {
              id: new UniqueEntityID('analysis-1'),
              candidateId: 'candidate-1',
              profileId: 'profile-1',
              status: 'completed',
              score: 75,
              report: 'Good psychological profile',
              createdAt: new Date(),
            },
          },
        }),
        createMockEvent({
          eventName: 'PsychAnalysisCompletedEvent',
          aggregateId: 'aggregate-2',
          payload: {
            analysis: {
              id: new UniqueEntityID('analysis-2'),
              candidateId: 'candidate-2',
              profileId: 'profile-2',
              status: 'completed',
              score: 90,
              report: 'Excellent psychological profile',
              createdAt: new Date(),
            },
          },
        }),
      ]

      await expect(
        kafkaEventPublisher.publishBatch(mockEvents)
      ).resolves.not.toThrow()
    })

    it('should handle empty batch', async () => {
      await expect(kafkaEventPublisher.publishBatch([])).resolves.not.toThrow()
    })
  })

  describe('topic mapping', () => {
    it('should use correct topic for PsychAnalysisCompletedEvent', () => {
      const mockEvent = createMockEvent({
        eventName: 'PsychAnalysisCompletedEvent',
        aggregateId: 'test-id',
      })

      const topicName = (
        kafkaEventPublisher as unknown as {
          getTopicName: (event: DomainEvent) => string
        }
      ).getTopicName(mockEvent)

      expect(topicName).toBe(PsychAnalysisTopics.PSYCH_ANALYSIS_COMPLETED)
    })

    it('should generate dynamic topic for unknown events', () => {
      const mockEvent = createMockEvent({
        eventName: 'UnknownDomainEvent',
        aggregateId: 'test-id',
      })

      const topicName = (
        kafkaEventPublisher as unknown as {
          getTopicName: (event: DomainEvent) => string
        }
      ).getTopicName(mockEvent)

      expect(topicName).toBe('psych-analysis.event.unknown_domain')
    })
  })

  describe('event serialization', () => {
    it('should serialize events with toJSON method', () => {
      const mockEvent = createMockEvent({
        eventName: 'TestEvent',
        aggregateId: 'test-id',
        payload: {
          complexObject: {
            toJSON: () => ({ serialized: true, value: 'test' }),
          },
        },
      })

      const serialized = (
        kafkaEventPublisher as unknown as {
          serializeEvent: (event: DomainEvent) => Record<string, unknown>
        }
      ).serializeEvent(mockEvent)

      expect(serialized.complexObject).toEqual({
        serialized: true,
        value: 'test',
      })
    })

    it('should serialize objects with id property', () => {
      const mockEvent = createMockEvent({
        eventName: 'TestEvent',
        aggregateId: 'test-id',
        payload: {
          entity: {
            id: 'entity-id',
            name: 'test',
            value: 123,
          },
        },
      })

      const serialized = (
        kafkaEventPublisher as unknown as {
          serializeEvent: (event: DomainEvent) => Record<string, unknown>
        }
      ).serializeEvent(mockEvent)

      expect(serialized.entity).toEqual({
        id: 'entity-id',
        name: 'test',
        value: 123,
      })
    })

    it('should skip occurredAt property', () => {
      const mockEvent = createMockEvent({
        eventName: 'TestEvent',
        aggregateId: 'test-id',
        payload: {
          data: 'test',
        },
      })

      const serialized = (
        kafkaEventPublisher as unknown as {
          serializeEvent: (event: DomainEvent) => Record<string, unknown>
        }
      ).serializeEvent(mockEvent)

      expect(serialized.occurredAt).toBeUndefined()
      expect(serialized.data).toBe('test')
    })
  })
})
