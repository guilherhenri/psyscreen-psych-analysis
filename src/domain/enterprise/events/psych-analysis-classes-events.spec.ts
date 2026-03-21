import { makePsychAnalysis } from '@test/factories/make-psych-analysis'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { DomainEvent } from '@/core/events/domain-event'

import { PsychAnalysisCompletedEvent } from './psych-analysis-completed'

const eventClasses: Array<{ name: string; instance: () => DomainEvent }> = [
  {
    name: PsychAnalysisCompletedEvent.name,
    instance: () => new PsychAnalysisCompletedEvent(makePsychAnalysis()),
  },
]

describe('Psych Analysis Domain Events', () => {
  eventClasses.forEach(({ name, instance }) => {
    it(`should implement getAggregateId correctly for ${name}`, () => {
      const event = instance()
      expect(event.getAggregateId()).toBeInstanceOf(UniqueEntityID)
    })
  })
})
