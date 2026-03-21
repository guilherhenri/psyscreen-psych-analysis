import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePsychAnalysesTable1774093573283 implements MigrationInterface {
  name = 'CreatePsychAnalysesTable1774093573283'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "psych_analyses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "candidate_id" uuid NOT NULL, "profile_id" uuid NOT NULL, "status" character varying NOT NULL, "score" integer, "report" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_01a733924f1c78e0d45f53322d6" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_abfeb24bce628120039c98ebf8" ON "psych_analyses" ("profile_id") `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_abfeb24bce628120039c98ebf8"`
    )
    await queryRunner.query(`DROP TABLE "psych_analyses"`)
  }
}
