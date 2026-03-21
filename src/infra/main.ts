import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'

import { AppModule } from './app.module'

const logger = new Logger('Bootstrap')

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('KAFKA_CLIENT_ID', 'psych-analysis'),
        brokers: [configService.get('KAFKA_BROKER', 'localhost:9092')],
        retry: {
          retries: configService.get('KAFKA_RETRY_COUNT', 8),
          initialRetryTime: 300,
          maxRetryTime: 30000,
        },
      },
      consumer: {
        groupId: configService.get(
          'KAFKA_CONSUMER_GROUP',
          'psych-analysis-consumer'
        ),
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        allowAutoTopicCreation: true,
      },
    },
  })

  await app.startAllMicroservices()
  await app.init()

  logger.log('PsychAnalysis microservice started successfully')
}

bootstrap().catch((error) => {
  logger.error('Failed to bootstrap application', error)
  process.exit(1)
})
