import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource, type DataSourceOptions } from 'typeorm'

import { PsychAnalysesRepository } from '@/domain/application/repositories/psych-analyses-repository'

import { getDataSourceOptions } from './data-source'
import { PsychAnalysis } from './entities/psych-analysis.entity'
import { TypeOrmPsychAnalysesRepository } from './repositories/typeorm-psych-analyses-repository'
import { TypeOrmService } from './typeorm.service'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (): DataSourceOptions => getDataSourceOptions(),
      dataSourceFactory: async (options: DataSourceOptions) => {
        const dataSource = new DataSource(options)

        return await dataSource.initialize()
      },
    }),
    TypeOrmModule.forFeature([PsychAnalysis]),
  ],
  providers: [
    TypeOrmService,
    {
      provide: PsychAnalysesRepository,
      useClass: TypeOrmPsychAnalysesRepository,
    },
  ],
  exports: [TypeOrmService, PsychAnalysesRepository],
})
export class DatabaseModule {}
