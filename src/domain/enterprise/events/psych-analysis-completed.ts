import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DomainEvent } from '@/core/events/domain-event'

import { PsychAnalysis } from '../entities/psych-analysis'

export class PsychAnalysisCompletedEvent implements DomainEvent {
  public readonly occurredAt: Date
  public readonly analysis: PsychAnalysis

  constructor(analysis: PsychAnalysis) {
    this.analysis = analysis
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.analysis.id
  }
}
