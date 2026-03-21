import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  PsychAnalysis,
  PsychAnalysisStatus,
} from '@/domain/enterprise/entities/psych-analysis'

export function makePsychAnalysis(
  override?: Partial<{
    candidateId: string
    profileId: string
    status: PsychAnalysisStatus
    score: number | null
    report: string | null
    createdAt: Date
    updatedAt?: Date | null
  }>,
  id?: UniqueEntityID
) {
  return PsychAnalysis.create(
    {
      candidateId: 'candidate-1',
      profileId: 'profile-1',
      status: PsychAnalysisStatus.COMPLETED,
      score: 85,
      report:
        'Strong psychological profile with excellent leadership potential',
      createdAt: new Date(),
      ...override,
    },
    id
  )
}
