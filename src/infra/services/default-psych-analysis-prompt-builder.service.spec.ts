import { DefaultPsychAnalysisPromptBuilderService } from './default-psych-analysis-prompt-builder.service'

describe('DefaultPsychAnalysisPromptBuilderService', () => {
  it('should build a JSON-only prompt with profile data', () => {
    const builder = new DefaultPsychAnalysisPromptBuilderService()

    const prompt = builder.build({
      summary: 'summary',
      experiences: ['exp'],
      education: ['edu'],
      skills: ['skill'],
      languages: ['pt-BR'],
      certifications: ['cert'],
      rawText: 'raw text',
    })

    expect(prompt).toContain('JSON object only')
    expect(prompt).toContain('"score"')
    expect(prompt).toContain('"report"')
    expect(prompt).toContain('summary')
    expect(prompt).toContain('raw text')
  })
})
