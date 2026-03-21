import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { Partitioners } from 'kafkajs'

import { EnvService } from '../env/env.service'
import { KafkaService } from './kafka.service'

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'PSYCH_ANALYSIS_SERVICE',
        inject: [EnvService],
        useFactory: (envService: EnvService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: envService.get('KAFKA_CLIENT_ID') ?? 'psych-analysis',
              brokers: [envService.get('KAFKA_BROKER') ?? 'localhost:9092'],
            },
            producer: {
              allowAutoTopicCreation: false,
              idempotent: true,
              maxInFlightRequests: 5,
              createPartitioner: Partitioners.DefaultPartitioner,
            },
            producerOnlyMode: true,
          },
        }),
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class ServicesModule {}
