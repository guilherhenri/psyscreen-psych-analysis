import { PsychAnalysesRepository } from '@/domain/application/repositories/psych-analyses-repository'
import { PsychAnalysis } from '@/domain/enterprise/entities/psych-analysis'

export class InMemoryPsychAnalysesRepository implements PsychAnalysesRepository {
  public items: PsychAnalysis[] = []

  async findByProfileId(profileId: string): Promise<PsychAnalysis | null> {
    const item = this.items.find((analysis) => analysis.profileId === profileId)

    return item ?? null
  }

  async findByVacancyId(vacancyId: string): Promise<PsychAnalysis[]> {
    return this.items.filter((analysis) => analysis.vacancyId === vacancyId)
  }

  async create(analysis: PsychAnalysis): Promise<void> {
    this.items.push(analysis)
  }

  async save(analysis: PsychAnalysis): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.profileId === analysis.profileId
    )

    if (index === -1) {
      this.items.push(analysis)
      return
    }

    this.items[index] = analysis
  }
}
