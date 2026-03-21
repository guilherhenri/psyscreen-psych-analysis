import { Injectable } from '@nestjs/common'

import { type Either, right } from '@/core/either'
import {
  PsychAnalysis,
  PsychAnalysisStatus,
} from '@/domain/enterprise/entities/psych-analysis'

import { PsychAnalysesRepository } from '../repositories/psych-analyses-repository'

interface StartPsychAnalysisRequest {
  candidateId: string
  profileId: string
}

type StartPsychAnalysisResponse = Either<null, null>

@Injectable()
export class StartPsychAnalysis {
  constructor(private repository: PsychAnalysesRepository) {}

  async execute({
    candidateId,
    profileId,
  }: StartPsychAnalysisRequest): Promise<StartPsychAnalysisResponse> {
    const profileAlreadyExists =
      await this.repository.findByProfileId(profileId)

    if (profileAlreadyExists) {
      return right(null)
    }

    const analysis = PsychAnalysis.create({
      candidateId,
      profileId,
      status: PsychAnalysisStatus.PENDING,
      score: null,
      report: null,
    })

    await this.repository.create(analysis)

    return right(null)
  }
}
