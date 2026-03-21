import { Injectable } from '@nestjs/common'

import { type Either, right } from '@/core/either'
import {
  PsychAnalysis,
  PsychAnalysisStatus,
} from '@/domain/enterprise/entities/psych-analysis'

import { PsychAnalysesRepository } from '../repositories/psych-analyses-repository'
import { PsychAnalysisModel } from '../services/psych-analysis-model'
import { PsychAnalysisPromptBuilder } from '../services/psych-analysis-prompt-builder'

interface RunPsychAnalysisRequest {
  candidateId: string
  profileId: string
  summary: string | null
  experiences: string[]
  education: string[]
  skills: string[]
  languages: string[]
  certifications: string[]
  rawText: string
}

type RunPsychAnalysisResponse = Either<null, null>

@Injectable()
export class RunPsychAnalysis {
  constructor(
    private repository: PsychAnalysesRepository,
    private model: PsychAnalysisModel,
    private promptBuilder: PsychAnalysisPromptBuilder
  ) {}

  async execute(
    request: RunPsychAnalysisRequest
  ): Promise<RunPsychAnalysisResponse> {
    const existing = await this.repository.findByProfileId(request.profileId)

    if (existing && existing.status === PsychAnalysisStatus.COMPLETED) {
      return right(null)
    }

    const analysis =
      existing ??
      PsychAnalysis.create({
        candidateId: request.candidateId,
        profileId: request.profileId,
        status: PsychAnalysisStatus.PENDING,
        score: null,
        report: null,
      })

    if (!existing) {
      await this.repository.create(analysis)
    }

    try {
      const prompt = this.promptBuilder.build({
        summary: request.summary,
        experiences: request.experiences,
        education: request.education,
        skills: request.skills,
        languages: request.languages,
        certifications: request.certifications,
        rawText: request.rawText,
      })

      const result = await this.model.generate(prompt)

      analysis.updateResult({
        status: PsychAnalysisStatus.COMPLETED,
        score: result.score,
        report: result.report,
      })

      await this.repository.save(analysis)
    } catch {
      analysis.updateResult({
        status: PsychAnalysisStatus.FAILED,
      })

      await this.repository.save(analysis)
    }

    return right(null)
  }
}
