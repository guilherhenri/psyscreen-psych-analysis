import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  PsychAnalysis,
  PsychAnalysisStatus,
} from '@/domain/enterprise/entities/psych-analysis'

import type { PsychAnalysis as TypeOrmPsychAnalysis } from '../entities/psych-analysis.entity'

export class TypeOrmPsychAnalysisMapper {
  static toDomain(raw: TypeOrmPsychAnalysis): PsychAnalysis {
    return PsychAnalysis.create(
      {
        candidateId: raw.candidateId,
        profileId: raw.profileId,
        status: PsychAnalysisStatus[raw.status],
        score: raw.score,
        report: raw.report,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id)
    )
  }

  static toTypeOrm(analysis: PsychAnalysis): TypeOrmPsychAnalysis {
    return {
      id: analysis.id.toString(),
      candidateId: analysis.candidateId,
      profileId: analysis.profileId,
      status: analysis.status,
      score: analysis.score ?? null,
      report: analysis.report ?? null,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt ?? null,
    }
  }
}
