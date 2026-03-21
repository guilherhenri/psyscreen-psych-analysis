export interface PsychAnalysisModelResponse {
  score: number
  report: string
}

export abstract class PsychAnalysisModel {
  abstract generate(prompt: string): Promise<PsychAnalysisModelResponse>
}
