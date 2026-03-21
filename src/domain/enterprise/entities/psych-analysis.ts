import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

import { PsychAnalysisCompletedEvent } from '../events/psych-analysis-completed'

export enum PsychAnalysisStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

interface PsychAnalysisProps {
  candidateId: string
  profileId: string
  status: PsychAnalysisStatus
  score?: number | null
  report?: string | null
  createdAt: Date
  updatedAt?: Date | null
}

export class PsychAnalysis extends AggregateRoot<PsychAnalysisProps> {
  get candidateId() {
    return this.props.candidateId
  }

  get profileId() {
    return this.props.profileId
  }

  get status() {
    return this.props.status
  }

  get score() {
    return this.props.score
  }

  get report() {
    return this.props.report
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  updateResult(params: {
    status: PsychAnalysisStatus
    score?: number | null
    report?: string | null
  }) {
    const previousStatus = this.props.status
    this.props.status = params.status
    this.props.score = params.score ?? this.props.score
    this.props.report = params.report ?? this.props.report
    this.touch()

    if (
      previousStatus !== PsychAnalysisStatus.COMPLETED &&
      params.status === PsychAnalysisStatus.COMPLETED
    ) {
      this.addDomainEvent(new PsychAnalysisCompletedEvent(this))
    }
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<PsychAnalysisProps, 'createdAt'>,
    id?: UniqueEntityID
  ) {
    return new PsychAnalysis(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    )
  }
}
