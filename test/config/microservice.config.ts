import { type MicroserviceOptions, Transport } from '@nestjs/microservices'

import { KAFKA_TEST_CONFIG } from './kafka.config'

export const getMicroserviceConfig = (
  brokers: Array<string>
): MicroserviceOptions => {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: KAFKA_TEST_CONFIG.groupId,
        brokers: brokers,
      },
      consumer: {
        groupId: KAFKA_TEST_CONFIG.microserviceConsumerGroupId,
      },
    },
  }
}
