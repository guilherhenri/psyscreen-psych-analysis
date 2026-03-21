import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { PsychAnalysisStatus } from '@/domain/enterprise/entities/psych-analysis'

@Entity('psych_analyses')
@Index(['profileId'], { unique: true })
export class PsychAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string

  @Column({ type: 'varchar' })
  status: PsychAnalysisStatus

  @Column({ type: 'integer', nullable: true })
  score: number | null

  @Column({ type: 'text', nullable: true })
  report: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null
}
