import {
  PsychAnalysisModel,
  type PsychAnalysisModelResponse,
} from '@/domain/application/services/psych-analysis-model'

export class FakePsychAnalysisModel implements PsychAnalysisModel {
  async generate(): Promise<PsychAnalysisModelResponse> {
    return {
      score: 82,
      report: 'Strong communication and leadership signals.',
    }
  }
}
