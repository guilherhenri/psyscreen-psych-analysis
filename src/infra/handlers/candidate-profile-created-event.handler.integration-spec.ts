import type { INestApplication } from '@nestjs/common'
import type { ClientKafka } from '@nestjs/microservices'
import { Test } from '@nestjs/testing'
import {
  type CandidateProfileCreatedEvent,
  CandidateTopics,
} from '@psyscreen/contracts'
import { createPsychAnalysisTestClient } from '@test/config/clients.config'
import { getMicroserviceConfig } from '@test/config/microservice.config'
import { kafkaSetup } from '@test/helpers/kafka-setup'
import { FakePsychAnalysisModel } from '@test/services/fake-psych-analysis-model'
import type { StartedRedpandaContainer } from '@testcontainers/redpanda'
import { firstValueFrom } from 'rxjs'
import type { Repository } from 'typeorm'

import { EventPublisher } from '@/core/ports/event-publisher'
import { PsychAnalysisModel } from '@/domain/application/services/psych-analysis-model'
import { PsychAnalysisStatus } from '@/domain/enterprise/entities/psych-analysis'
import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PsychAnalysis } from '@/infra/database/entities/psych-analysis.entity'
import { TypeOrmService } from '@/infra/database/typeorm.service'

describe('CandidateProfileCreatedEventHandler (Integration)', () => {
  let app: INestApplication
  let client: ClientKafka
  let typeorm: TypeOrmService
  let analysesRepository: Repository<PsychAnalysis>
  let kafkaContainer: StartedRedpandaContainer
  let publishBatchSpy: jest.Mock

  beforeAll(async () => {
    const { container, brokers } = await kafkaSetup()
    kafkaContainer = container

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    })
      .overrideProvider(PsychAnalysisModel)
      .useClass(FakePsychAnalysisModel)
      .overrideProvider(EventPublisher)
      .useValue({
        publish: jest.fn(),
        publishBatch: jest.fn(),
      })
      .overrideProvider('PSYCH_ANALYSIS_SERVICE')
      .useFactory({
        factory: () => createPsychAnalysisTestClient(brokers),
      })
      .compile()

    app = moduleRef.createNestApplication()

    app.connectMicroservice(getMicroserviceConfig(brokers))

    typeorm = moduleRef.get(TypeOrmService)
    client = moduleRef.get('PSYCH_ANALYSIS_SERVICE')
    publishBatchSpy = moduleRef.get(EventPublisher).publishBatch as jest.Mock

    analysesRepository = typeorm.getRepository(PsychAnalysis)

    await client.connect()

    await app.startAllMicroservices()
    await app.init()
  })

  afterAll(async () => {
    await Promise.all([client.close(), typeorm.destroy()])
    await app.close()

    if (kafkaContainer) {
      await kafkaContainer.stop()
    }
  })

  afterEach(async () => {
    await analysesRepository.clear()
  })

  it('should create a completed psych analysis record', async () => {
    const event: CandidateProfileCreatedEvent = {
      candidateId: '9b7b7b2e-31d5-4c47-8cc1-642a0c72d8a1',
      profileId: '6c6c2f4d-6e2c-4f6b-9f6a-1a0b1b7d6cfe',
      summary: 'summary',
      experiences: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      rawText: 'raw text',
    }

    await firstValueFrom(
      client.emit(CandidateTopics.CANDIDATE_PROFILE_CREATED, event)
    )

    const record = await waitForAnalysis(
      analysesRepository,
      '6c6c2f4d-6e2c-4f6b-9f6a-1a0b1b7d6cfe',
      PsychAnalysisStatus.COMPLETED
    )

    expect(record).toBeDefined()
    expect(record?.candidateId).toBe('9b7b7b2e-31d5-4c47-8cc1-642a0c72d8a1')
    expect(record?.profileId).toBe('6c6c2f4d-6e2c-4f6b-9f6a-1a0b1b7d6cfe')
    expect(record?.status).toBe('completed')
    expect(record?.score).toBe(82)
    expect(record?.report).toBe('Strong communication and leadership signals.')
    expect(publishBatchSpy).toHaveBeenCalledTimes(1)
  })
})

async function waitForAnalysis(
  repository: Repository<PsychAnalysis>,
  profileId: string,
  status?: PsychAnalysis['status']
): Promise<PsychAnalysis | null> {
  const deadline = Date.now() + 5000

  while (Date.now() < deadline) {
    const record = await repository.findOne({ where: { profileId } })

    if (record && (!status || record.status === status)) {
      return record
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return null
}
