import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import {
  DataSource,
  type EntityTarget,
  type ObjectLiteral,
  type Repository,
} from 'typeorm'

@Injectable()
export class TypeOrmService implements Pick<
  DataSource,
  'getRepository' | 'query' | 'runMigrations' | 'destroy'
> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  getRepository<Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>
  ): Repository<Entity> {
    return this.dataSource.getRepository(target)
  }

  query(query: string, parameters?: unknown[]) {
    return this.dataSource.query(query, parameters)
  }

  async runMigrations() {
    return this.dataSource.runMigrations()
  }

  async destroy() {
    return this.dataSource.destroy()
  }
}
