import type { INestApplication } from '@nestjs/common'
import type { ClientKafka } from '@nestjs/microservices'
import { Test } from '@nestjs/testing'
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

const VACANCY_CRITERIA_UPDATED_TOPIC = 'vacancies.event.criteria_updated'

type VacancyCriteriaUpdatedEvent = {
  vacancyId: string
  criteriaVersion: number
  criteria: Array<{
    key: string
    weight: number
  }>
}

describe('VacancyCriteriaUpdatedEventHandler (Integration)', () => {
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

  it('should reprocess analyses when criteria version changes', async () => {
    await analysesRepository.save({
      id: '8d4f0f8e-4e9f-4a8f-8b17-4b1c1ad7b6d1',
      candidateId: '9b7b7b2e-31d5-4c47-8cc1-642a0c72d8a1',
      profileId: '6c6c2f4d-6e2c-4f6b-9f6a-1a0b1b7d6cfe',
      vacancyId: 'f1d0d7b6-7c6f-4d9e-9f1f-4d1b2c3d4e5f',
      criteriaVersion: 1,
      profileSnapshot: {
        summary: 'summary',
        experiences: [],
        education: [],
        skills: [],
        languages: [],
        certifications: [],
        rawText: 'raw text',
      },
      status: PsychAnalysisStatus.COMPLETED,
      score: 70,
      report: 'Initial report',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const event: VacancyCriteriaUpdatedEvent = {
      vacancyId: 'f1d0d7b6-7c6f-4d9e-9f1f-4d1b2c3d4e5f',
      criteriaVersion: 2,
      criteria: [
        {
          key: 'communication',
          weight: 2,
        },
      ],
    }

    await firstValueFrom(client.emit(VACANCY_CRITERIA_UPDATED_TOPIC, event))

    const record = await waitForCriteriaVersion(
      analysesRepository,
      '6c6c2f4d-6e2c-4f6b-9f6a-1a0b1b7d6cfe',
      2
    )

    expect(record).toBeDefined()
    expect(record?.criteriaVersion).toBe(2)
    expect(record?.status).toBe('completed')
    expect(publishBatchSpy).toHaveBeenCalled()
  })
})

async function waitForCriteriaVersion(
  repository: Repository<PsychAnalysis>,
  profileId: string,
  criteriaVersion: number
): Promise<PsychAnalysis | null> {
  const deadline = Date.now() + 5000

  while (Date.now() < deadline) {
    const record = await repository.findOne({ where: { profileId } })

    if (record && record.criteriaVersion === criteriaVersion) {
      return record
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return null
}
