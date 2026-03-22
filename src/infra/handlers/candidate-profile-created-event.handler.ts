import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import {
  type CandidateProfileCreatedEvent,
  CandidateTopics,
} from '@psyscreen/contracts'

import { RunPsychAnalysis } from '@/domain/application/use-cases/run-psych-analysis'

@Controller()
export class CandidateProfileCreatedEventHandler {
  constructor(private readonly runPsychAnalysis: RunPsychAnalysis) {}

  @MessagePattern(CandidateTopics.CANDIDATE_PROFILE_CREATED)
  async handle(@Payload() event: CandidateProfileCreatedEvent): Promise<void> {
    try {
      await this.runPsychAnalysis.execute({
        candidateId: event.candidateId,
        profileId: event.profileId,
        vacancyId: event.vacancyId ?? null,
        summary: event.summary,
        experiences: event.experiences,
        education: event.education,
        skills: event.skills,
        languages: event.languages,
        certifications: event.certifications,
        rawText: event.rawText,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      console.warn(`CandidateProfileCreated handler failed: ${message}`)
    }
  }
}
