import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddVacancyContextToPsychAnalyses1774197571000 implements MigrationInterface {
  name = 'AddVacancyContextToPsychAnalyses1774197571000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "psych_analyses" ADD "vacancy_id" uuid`
    )
    await queryRunner.query(
      `ALTER TABLE "psych_analyses" ADD "criteria_version" integer`
    )
    await queryRunner.query(
      `ALTER TABLE "psych_analyses" ADD "profile_snapshot" jsonb`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "psych_analyses" DROP COLUMN "profile_snapshot"`
    )
    await queryRunner.query(
      `ALTER TABLE "psych_analyses" DROP COLUMN "criteria_version"`
    )
    await queryRunner.query(
      `ALTER TABLE "psych_analyses" DROP COLUMN "vacancy_id"`
    )
  }
}
