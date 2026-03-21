import { AggregateRoot } from '../entities/aggregate-root'
import { UniqueEntityID } from '../entities/unique-entity-id'
import { EventPublisher } from '../ports/event-publisher'

export class DomainEvents {
  private static markedAggregates: AggregateRoot<unknown>[] = []
  private static eventPublisher: EventPublisher | null = null
  public static shouldRun = true

  public static setEventPublisher(publisher: EventPublisher) {
    this.eventPublisher = publisher
  }

  public static markAggregateForDispatch(aggregate: AggregateRoot<unknown>) {
    const existingAggregateIndex = this.findMarkedAggregateIndexByID(
      aggregate.id
    )

    if (existingAggregateIndex !== -1) {
      const existing = this.markedAggregates[existingAggregateIndex]

      const mergedEvents = [
        ...existing.domainEvents,
        ...aggregate.domainEvents.filter(
          (newEvent) =>
            !existing.domainEvents.some(
              (existingEvent) =>
                existingEvent.constructor.name === newEvent.constructor.name
            )
        ),
      ]

      aggregate._mergeEvents(mergedEvents)
      this.markedAggregates[existingAggregateIndex] = aggregate
    } else {
      this.markedAggregates.push(aggregate)
    }
  }

  private static async dispatchAggregateEvents(
    aggregate: AggregateRoot<unknown>
  ) {
    if (!this.eventPublisher) {
      throw new Error('EventPublisher not configured')
    }

    await this.eventPublisher.publishBatch(aggregate.domainEvents)
  }

  private static removeAggregateFromMarkedDispatchList(
    aggregate: AggregateRoot<unknown>
  ) {
    const index = this.markedAggregates.findIndex((a) => a.equals(aggregate))

    this.markedAggregates.splice(index, 1)
  }

  private static findMarkedAggregateByID(
    id: UniqueEntityID
  ): AggregateRoot<unknown> | undefined {
    return this.markedAggregates.find((aggregate) => aggregate.id.equals(id))
  }

  private static findMarkedAggregateIndexByID(id: UniqueEntityID): number {
    return this.markedAggregates.findIndex((a) => a.id.equals(id))
  }

  public static async dispatchEventsForAggregate(id: UniqueEntityID) {
    const aggregate = this.findMarkedAggregateByID(id)

    if (aggregate && this.shouldRun) {
      await this.dispatchAggregateEvents(aggregate)
      aggregate.clearEvents()
      this.removeAggregateFromMarkedDispatchList(aggregate)
    }
  }

  public static clearMarkedAggregates() {
    this.markedAggregates = []
  }
}
