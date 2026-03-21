import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { PsychAnalysesRepository } from '@/domain/application/repositories/psych-analyses-repository'
import type { PsychAnalysis } from '@/domain/enterprise/entities/psych-analysis'
import { DomainEvents } from '@/core/events/domain-events'

import { PsychAnalysis as TypeOrmPsychAnalysis } from '../entities/psych-analysis.entity'
import { TypeOrmPsychAnalysisMapper } from '../mappers/typeorm-psych-analysis-mapper'

@Injectable()
export class TypeOrmPsychAnalysesRepository implements PsychAnalysesRepository {
  constructor(
    @InjectRepository(TypeOrmPsychAnalysis)
    private readonly repository: Repository<TypeOrmPsychAnalysis>
  ) {}

  async findByProfileId(profileId: string): Promise<PsychAnalysis | null> {
    const analysis = await this.repository.findOne({
      where: { profileId },
    })

    if (!analysis) {
      return null
    }

    return TypeOrmPsychAnalysisMapper.toDomain(analysis)
  }

  async create(analysis: PsychAnalysis): Promise<void> {
    await this.repository.save(TypeOrmPsychAnalysisMapper.toTypeOrm(analysis))
    await DomainEvents.dispatchEventsForAggregate(analysis.id)
  }

  async save(analysis: PsychAnalysis): Promise<void> {
    await this.repository.save(TypeOrmPsychAnalysisMapper.toTypeOrm(analysis))
    await DomainEvents.dispatchEventsForAggregate(analysis.id)
  }
}
