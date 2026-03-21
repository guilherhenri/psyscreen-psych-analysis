import { ClientKafka } from '@nestjs/microservices'

import { KAFKA_TEST_CONFIG } from './kafka.config'

export const createPsychAnalysisTestClient = (
  brokers: Array<string>
): ClientKafka => {
  return new ClientKafka({
    client: {
      clientId: KAFKA_TEST_CONFIG.clientId,
      brokers,
    },
    consumer: {
      groupId: KAFKA_TEST_CONFIG.groupId,
    },
  })
}
