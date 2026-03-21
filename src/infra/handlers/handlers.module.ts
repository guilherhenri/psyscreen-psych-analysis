import { Module } from '@nestjs/common'

import { PsychAnalysisModel } from '@/domain/application/services/psych-analysis-model'
import { PsychAnalysisPromptBuilder } from '@/domain/application/services/psych-analysis-prompt-builder'
import { RunPsychAnalysis } from '@/domain/application/use-cases/run-psych-analysis'

import { DatabaseModule } from '../database/database.module'
import { MessagingModule } from '../messaging/messaging.module'
import { DefaultPsychAnalysisPromptBuilderService } from '../services/default-psych-analysis-prompt-builder.service'
import { GeminiPsychAnalysisService } from '../services/gemini-psych-analysis.service'
import { CandidateProfileCreatedEventHandler } from './candidate-profile-created-event.handler'

@Module({
  imports: [DatabaseModule, MessagingModule],
  controllers: [CandidateProfileCreatedEventHandler],
  providers: [
    RunPsychAnalysis,
    {
      provide: PsychAnalysisPromptBuilder,
      useClass: DefaultPsychAnalysisPromptBuilderService,
    },
    {
      provide: PsychAnalysisModel,
      useClass: GeminiPsychAnalysisService,
    },
  ],
})
export class HandlersModule {}
