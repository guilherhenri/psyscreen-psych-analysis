import { Injectable } from '@nestjs/common'

import { type Either, right } from '@/core/either'
import {
  PsychAnalysis,
  type PsychAnalysisProfileSnapshot,
  PsychAnalysisStatus,
} from '@/domain/enterprise/entities/psych-analysis'

import { PsychAnalysesRepository } from '../repositories/psych-analyses-repository'
import { PsychAnalysisModel } from '../services/psych-analysis-model'
import { PsychAnalysisPromptBuilder } from '../services/psych-analysis-prompt-builder'

interface RunPsychAnalysisRequest {
  candidateId: string
  profileId: string
  vacancyId?: string | null
  criteriaVersion?: number | null
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

    const profileSnapshot: PsychAnalysisProfileSnapshot = {
      summary: request.summary,
      experiences: request.experiences,
      education: request.education,
      skills: request.skills,
      languages: request.languages,
      certifications: request.certifications,
      rawText: request.rawText,
    }

    const shouldReprocessForCriteria =
      request.criteriaVersion !== undefined &&
      (existing?.criteriaVersion ?? null) !== request.criteriaVersion

    if (!shouldReprocessForCriteria) {
      if (existing && existing.status === PsychAnalysisStatus.COMPLETED) {
        existing.updateContext({
          vacancyId: request.vacancyId,
          criteriaVersion: request.criteriaVersion,
        })
        existing.updateProfileSnapshot(profileSnapshot)

        await this.repository.save(existing)

        return right(null)
      }

      if (existing && existing.status === PsychAnalysisStatus.PENDING) {
        existing.updateContext({
          vacancyId: request.vacancyId,
          criteriaVersion: request.criteriaVersion,
        })
        existing.updateProfileSnapshot(profileSnapshot)

        await this.repository.save(existing)

        return right(null)
      }
    }

    const analysis =
      existing ??
      PsychAnalysis.create({
        candidateId: request.candidateId,
        profileId: request.profileId,
        vacancyId: request.vacancyId ?? null,
        criteriaVersion: request.criteriaVersion ?? null,
        profileSnapshot,
        status: PsychAnalysisStatus.PENDING,
        score: null,
        report: null,
      })

    if (!existing) {
      await this.repository.create(analysis)
    } else if (
      request.vacancyId !== undefined ||
      request.criteriaVersion !== undefined
    ) {
      analysis.updateContext({
        vacancyId: request.vacancyId,
        criteriaVersion: request.criteriaVersion,
      })
      analysis.updateProfileSnapshot(profileSnapshot)
      await this.repository.save(analysis)
    } else {
      analysis.updateProfileSnapshot(profileSnapshot)
      await this.repository.save(analysis)
    }

    if (analysis.status !== PsychAnalysisStatus.PENDING) {
      analysis.updateResult({ status: PsychAnalysisStatus.PENDING })

      await this.repository.save(analysis)
    }

    try {
      const prompt = this.promptBuilder.build({
        summary: profileSnapshot.summary,
        experiences: profileSnapshot.experiences,
        education: profileSnapshot.education,
        skills: profileSnapshot.skills,
        languages: profileSnapshot.languages,
        certifications: profileSnapshot.certifications,
        rawText: profileSnapshot.rawText,
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
