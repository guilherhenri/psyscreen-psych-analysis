import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import {
  type CandidateProfileCreatedEvent,
  CandidateTopics,
} from '@psyscreen/contracts'

import { StartPsychAnalysis } from '@/domain/application/use-cases/start-psych-analysis'

@Controller()
export class CandidateProfileCreatedEventHandler {
  constructor(private readonly startPsychAnalysis: StartPsychAnalysis) {}

  @MessagePattern(CandidateTopics.CANDIDATE_PROFILE_CREATED)
  async handle(@Payload() event: CandidateProfileCreatedEvent): Promise<void> {
    try {
      await this.startPsychAnalysis.execute({
        candidateId: event.candidateId,
        profileId: event.profileId,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      console.warn(`CandidateProfileCreated handler failed: ${message}`)
    }
  }
}
