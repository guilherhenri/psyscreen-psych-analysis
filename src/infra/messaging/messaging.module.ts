import { Global, Module } from '@nestjs/common'

import { DomainEvents } from '@/core/events/domain-events'
import { EventPublisher } from '@/core/ports/event-publisher'

import { ServicesModule } from '../services/services.module'
import { KafkaEventPublisher } from './kafka-event-publisher'

@Global()
@Module({
  imports: [ServicesModule],
  providers: [
    {
      provide: EventPublisher,
      useClass: KafkaEventPublisher,
    },
  ],
  exports: [EventPublisher],
})
export class MessagingModule {
  constructor(private eventPublisher: EventPublisher) {
    DomainEvents.setEventPublisher(this.eventPublisher)
  }
}
