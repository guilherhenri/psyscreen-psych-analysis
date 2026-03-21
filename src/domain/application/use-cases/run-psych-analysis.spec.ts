import { InMemoryPsychAnalysesRepository } from '@test/repositories/in-memory-psych-analyses-repository'

import { PsychAnalysisStatus } from '@/domain/enterprise/entities/psych-analysis'

import { PsychAnalysisModel } from '../services/psych-analysis-model'
import {
  PsychAnalysisPromptBuilder,
  type PsychAnalysisPromptInput,
} from '../services/psych-analysis-prompt-builder'
import { RunPsychAnalysis } from './run-psych-analysis'

let inMemoryPsychAnalysesRepository: InMemoryPsychAnalysesRepository
let promptBuilder: PsychAnalysisPromptBuilder
let model: PsychAnalysisModel
let sut: RunPsychAnalysis

describe('Run Psych Analysis Use-case', () => {
  beforeEach(() => {
    inMemoryPsychAnalysesRepository = new InMemoryPsychAnalysesRepository()
    promptBuilder = {
      build: (input: PsychAnalysisPromptInput) => JSON.stringify(input),
    }
    model = {
      generate: jest.fn().mockResolvedValue({
        score: 75,
        report: 'Solid profile with growth potential.',
      }),
    }
    sut = new RunPsychAnalysis(
      inMemoryPsychAnalysesRepository,
      model,
      promptBuilder
    )
  })

  it('should create and complete a psych analysis', async () => {
    const response = await sut.execute({
      candidateId: 'candidate-1',
      profileId: 'profile-1',
      summary: 'summary',
      experiences: ['exp'],
      education: ['edu'],
      skills: ['skill'],
      languages: [],
      certifications: [],
      rawText: 'raw text',
    })

    expect(response.isRight()).toBeTruthy()
    expect(inMemoryPsychAnalysesRepository.items).toHaveLength(1)
    expect(inMemoryPsychAnalysesRepository.items[0]).toMatchObject({
      props: {
        status: PsychAnalysisStatus.COMPLETED,
        score: 75,
        report: 'Solid profile with growth potential.',
      },
    })
  })

  it('should skip generation when analysis is already completed', async () => {
    await sut.execute({
      candidateId: 'candidate-1',
      profileId: 'profile-1',
      summary: 'summary',
      experiences: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      rawText: 'raw text',
    })

    const response = await sut.execute({
      candidateId: 'candidate-1',
      profileId: 'profile-1',
      summary: 'summary',
      experiences: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      rawText: 'raw text',
    })

    expect(response.isRight()).toBeTruthy()
    expect(inMemoryPsychAnalysesRepository.items).toHaveLength(1)
    expect(model.generate).toHaveBeenCalledTimes(1)
  })
})
