import { GoogleGenerativeAI } from '@google/generative-ai'

import { GeminiPsychAnalysisService } from './gemini-psych-analysis.service'

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn(),
  }
})

describe('GeminiPsychAnalysisService', () => {
  const envService = {
    get: (key: string) => {
      const values: Record<string, string | number> = {
        GEMINI_API_KEY: 'test-key',
        GEMINI_MODEL: 'gemini-2.5-flash',
        GEMINI_TEMPERATURE: 0.2,
        GEMINI_MAX_OUTPUT_TOKENS: 512,
      }

      return values[key]
    },
  }

  it('should parse JSON response and normalize score', async () => {
    const generateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => '{"score": 120, "report": "ok"}',
      },
    })

    ;(GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => ({ generateContent }),
    }))

    const service = new GeminiPsychAnalysisService(envService as never)
    const result = await service.generate('prompt')

    expect(result).toEqual({ score: 100, report: 'ok' })
  })

  it('should throw when report is missing', async () => {
    const generateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => '{"score": 90}',
      },
    })

    ;(GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => ({ generateContent }),
    }))

    const service = new GeminiPsychAnalysisService(envService as never)

    await expect(service.generate('prompt')).rejects.toThrow(
      'Missing report in Gemini response'
    )
  })
})
