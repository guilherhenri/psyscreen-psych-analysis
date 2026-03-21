import { DomainEvent } from '../events/domain-event'

export abstract class EventPublisher {
  abstract publish(event: DomainEvent): Promise<void>
  abstract publishBatch(events: DomainEvent[]): Promise<void>
}
