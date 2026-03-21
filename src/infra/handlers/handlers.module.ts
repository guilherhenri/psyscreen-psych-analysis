import { Module } from '@nestjs/common'

import { StartPsychAnalysis } from '@/domain/application/use-cases/start-psych-analysis'

import { DatabaseModule } from '../database/database.module'
import { ServicesModule } from '../services/services.module'
import { CandidateProfileCreatedEventHandler } from './candidate-profile-created-event.handler'

@Module({
  imports: [DatabaseModule, ServicesModule],
  controllers: [CandidateProfileCreatedEventHandler],
  providers: [StartPsychAnalysis],
})
export class HandlersModule {}
