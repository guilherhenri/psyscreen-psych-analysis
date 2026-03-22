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

  it('should skip generation when analysis is pending', async () => {
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

    const pending = inMemoryPsychAnalysesRepository.items[0]
    pending.updateResult({ status: PsychAnalysisStatus.PENDING })

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

  it('should reprocess when criteria version changes', async () => {
    await sut.execute({
      candidateId: 'candidate-1',
      profileId: 'profile-1',
      vacancyId: 'vacancy-1',
      criteriaVersion: 1,
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
      vacancyId: 'vacancy-1',
      criteriaVersion: 2,
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
    expect(inMemoryPsychAnalysesRepository.items[0]).toMatchObject({
      props: {
        criteriaVersion: 2,
        vacancyId: 'vacancy-1',
      },
    })
    expect(model.generate).toHaveBeenCalledTimes(2)
  })

  it('should retry when analysis failed', async () => {
    model = {
      generate: jest
        .fn()
        .mockRejectedValueOnce(new Error('Gemini error'))
        .mockResolvedValueOnce({
          score: 70,
          report: 'Recovered after retry.',
        }),
    }
    sut = new RunPsychAnalysis(
      inMemoryPsychAnalysesRepository,
      model,
      promptBuilder
    )

    await sut.execute({
      candidateId: 'candidate-1',
      profileId: 'profile-2',
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
      profileId: 'profile-2',
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
    expect(inMemoryPsychAnalysesRepository.items[0]).toMatchObject({
      props: {
        status: PsychAnalysisStatus.COMPLETED,
        score: 70,
        report: 'Recovered after retry.',
      },
    })
    expect(model.generate).toHaveBeenCalledTimes(2)
  })

  it('should mark analysis as failed when model throws', async () => {
    model = {
      generate: jest.fn().mockRejectedValue(new Error('Gemini error')),
    }
    sut = new RunPsychAnalysis(
      inMemoryPsychAnalysesRepository,
      model,
      promptBuilder
    )

    const response = await sut.execute({
      candidateId: 'candidate-1',
      profileId: 'profile-2',
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
    expect(inMemoryPsychAnalysesRepository.items[0]).toMatchObject({
      props: {
        status: PsychAnalysisStatus.FAILED,
      },
    })
  })
})
