import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ClientKafka } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('PSYCH_ANALYSIS_SERVICE') private readonly kafka: ClientKafka
  ) {}

  async emit<TPayload = unknown>(
    topic: string,
    payload: TPayload
  ): Promise<void> {
    await firstValueFrom(this.kafka.emit(topic, payload))
  }

  async onModuleInit() {
    await this.kafka.connect()
  }

  async onModuleDestroy() {
    await this.kafka.close()
  }
}
