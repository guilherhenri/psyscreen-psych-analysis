import { GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'

import {
  PsychAnalysisModel,
  type PsychAnalysisModelResponse,
} from '@/domain/application/services/psych-analysis-model'

import { EnvService } from '../env/env.service'

@Injectable()
export class GeminiPsychAnalysisService implements PsychAnalysisModel {
  private client: GoogleGenerativeAI
  private modelName: string
  private temperature: number
  private maxOutputTokens: number

  constructor(private readonly envService: EnvService) {
    const apiKey = this.envService.get('GEMINI_API_KEY')
    this.client = new GoogleGenerativeAI(apiKey)
    this.modelName = this.envService.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
    this.temperature = this.envService.get('GEMINI_TEMPERATURE') ?? 0.4
    this.maxOutputTokens =
      this.envService.get('GEMINI_MAX_OUTPUT_TOKENS') ?? 1024
  }

  async generate(prompt: string): Promise<PsychAnalysisModelResponse> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: this.maxOutputTokens,
        responseMimeType: 'application/json',
      },
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const payload = this.parseJson(text)

    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid Gemini response payload')
    }

    const score = this.normalizeScore(payload.score)
    const report = typeof payload.report === 'string' ? payload.report : ''

    if (!report) {
      throw new Error('Missing report in Gemini response')
    }

    return { score, report }
  }

  private parseJson(text: string): Record<string, unknown> {
    try {
      return JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)

      if (!match) {
        throw new Error('Gemini response is not valid JSON')
      }

      return JSON.parse(match[0])
    }
  }

  private normalizeScore(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new Error('Score is not a number')
    }

    const rounded = Math.round(value)

    if (rounded < 0) {
      return 0
    }

    if (rounded > 100) {
      return 100
    }

    return rounded
  }
}
