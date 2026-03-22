import type { PsychAnalysis } from '@/domain/enterprise/entities/psych-analysis'

export abstract class PsychAnalysesRepository {
  abstract findByProfileId(profileId: string): Promise<PsychAnalysis | null>
  abstract findByVacancyId(vacancyId: string): Promise<PsychAnalysis[]>
  abstract create(analysis: PsychAnalysis): Promise<void>
  abstract save(analysis: PsychAnalysis): Promise<void>
}
