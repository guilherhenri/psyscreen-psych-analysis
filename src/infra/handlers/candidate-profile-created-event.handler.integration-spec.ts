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
import type { StartedRedpandaContainer } from '@testcontainers/redpanda'
import { firstValueFrom } from 'rxjs'
import type { Repository } from 'typeorm'

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

  beforeAll(async () => {
    const { container, brokers } = await kafkaSetup()
    kafkaContainer = container

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
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

  it('should create a pending psych analysis record', async () => {
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
      '6c6c2f4d-6e2c-4f6b-9f6a-1a0b1b7d6cfe'
    )

    expect(record).toBeDefined()
    expect(record?.candidateId).toBe('9b7b7b2e-31d5-4c47-8cc1-642a0c72d8a1')
    expect(record?.profileId).toBe('6c6c2f4d-6e2c-4f6b-9f6a-1a0b1b7d6cfe')
    expect(record?.status).toBe('pending')
  })
})

async function waitForAnalysis(
  repository: Repository<PsychAnalysis>,
  profileId: string
): Promise<PsychAnalysis | null> {
  const deadline = Date.now() + 5000

  while (Date.now() < deadline) {
    const record = await repository.findOne({ where: { profileId } })

    if (record) {
      return record
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return null
}
