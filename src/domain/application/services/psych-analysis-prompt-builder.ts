export interface PsychAnalysisPromptInput {
  summary: string | null
  experiences: string[]
  education: string[]
  skills: string[]
  languages: string[]
  certifications: string[]
  rawText: string
}

export abstract class PsychAnalysisPromptBuilder {
  abstract build(input: PsychAnalysisPromptInput): string
}
