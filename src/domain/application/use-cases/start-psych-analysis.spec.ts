import { InMemoryPsychAnalysesRepository } from '@test/repositories/in-memory-psych-analyses-repository'

import { PsychAnalysisStatus } from '@/domain/enterprise/entities/psych-analysis'

import { StartPsychAnalysis } from './start-psych-analysis'

let inMemoryPsychAnalysesRepository: InMemoryPsychAnalysesRepository
let sut: StartPsychAnalysis

describe('Start Psych Analysis Use-case', () => {
  beforeEach(() => {
    inMemoryPsychAnalysesRepository = new InMemoryPsychAnalysesRepository()
    sut = new StartPsychAnalysis(inMemoryPsychAnalysesRepository)
  })

  it('should create a pending psych analysis when none exists', async () => {
    const response = await sut.execute({
      candidateId: 'candidate-1',
      profileId: 'profile-1',
    })

    expect(response.isRight()).toBeTruthy()
    expect(inMemoryPsychAnalysesRepository.items).toHaveLength(1)
    expect(inMemoryPsychAnalysesRepository.items[0]).toMatchObject({
      props: {
        candidateId: 'candidate-1',
        profileId: 'profile-1',
        status: PsychAnalysisStatus.PENDING,
      },
    })
  })

  it('should not create a new analysis when profile already exists', async () => {
    await sut.execute({
      candidateId: 'candidate-1',
      profileId: 'profile-1',
    })

    const response = await sut.execute({
      candidateId: 'candidate-1',
      profileId: 'profile-1',
    })

    expect(response.isRight()).toBeTruthy()
    expect(inMemoryPsychAnalysesRepository.items).toHaveLength(1)
  })
})
