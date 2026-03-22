import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'

const VACANCY_CRITERIA_UPDATED_TOPIC = 'vacancies.event.criteria_updated'

type VacancyCriteriaUpdatedEvent = {
  vacancyId: string
  criteriaVersion: number
  criteria: Array<{
    key: string
    weight: number
  }>
}

import { PsychAnalysesRepository } from '@/domain/application/repositories/psych-analyses-repository'
import { RunPsychAnalysis } from '@/domain/application/use-cases/run-psych-analysis'

@Controller()
export class VacancyCriteriaUpdatedEventHandler {
  constructor(
    private readonly psychAnalysesRepository: PsychAnalysesRepository,
    private readonly runPsychAnalysis: RunPsychAnalysis
  ) {}

  @MessagePattern(VACANCY_CRITERIA_UPDATED_TOPIC)
  async handle(@Payload() event: VacancyCriteriaUpdatedEvent): Promise<void> {
    try {
      const analyses = await this.psychAnalysesRepository.findByVacancyId(
        event.vacancyId
      )

      if (analyses.length === 0) {
        return
      }

      await Promise.all(
        analyses.map(async (analysis) => {
          if (analysis.criteriaVersion === event.criteriaVersion) {
            return
          }

          const snapshot = analysis.profileSnapshot

          if (!snapshot) {
            console.warn(
              `VacancyCriteriaUpdated handler skipped analysis ${analysis.id.toString()} due to missing profile snapshot.`
            )
            return
          }

          await this.runPsychAnalysis.execute({
            candidateId: analysis.candidateId,
            profileId: analysis.profileId,
            vacancyId: event.vacancyId,
            criteriaVersion: event.criteriaVersion,
            summary: snapshot.summary,
            experiences: snapshot.experiences,
            education: snapshot.education,
            skills: snapshot.skills,
            languages: snapshot.languages,
            certifications: snapshot.certifications,
            rawText: snapshot.rawText,
          })
        })
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      console.warn(`VacancyCriteriaUpdated handler failed: ${message}`)
    }
  }
}
