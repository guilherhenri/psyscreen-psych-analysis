import {
  PsychAnalysisPromptBuilder,
  type PsychAnalysisPromptInput,
} from '@/domain/application/services/psych-analysis-prompt-builder'

export class DefaultPsychAnalysisPromptBuilderService implements PsychAnalysisPromptBuilder {
  build(input: PsychAnalysisPromptInput): string {
    const payload = {
      summary: input.summary,
      experiences: input.experiences,
      education: input.education,
      skills: input.skills,
      languages: input.languages,
      certifications: input.certifications,
      rawText: input.rawText,
    }

    return [
      'You are a psychologist recruiter assistant.',
      'Analyze the candidate profile and return a JSON object only.',
      'Schema: {"score": number, "report": string}',
      'Score must be an integer from 0 to 100.',
      'Report must be concise and actionable for recruiters.',
      'Do not include markdown or code fences.',
      'Candidate profile data:',
      JSON.stringify(payload),
    ].join('\n')
  }
}
