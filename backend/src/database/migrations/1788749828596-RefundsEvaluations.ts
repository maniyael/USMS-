import { MigrationInterface, QueryRunner } from 'typeorm';

/* Additive migration for the refunds + evaluations tables added by the
   finance refund workflow and the evaluations module. Column names match the
   entities exactly (TypeORM default naming: property name, unless @Column({ name })
   is set) — camelCase columns are quoted. Uses IF NOT EXISTS so it is safe on
   databases that were already provisioned via scripts/apply-extras.js. */
export class RefundsEvaluations1788749828596 implements MigrationInterface {
  name = 'RefundsEvaluations1788749828596';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS refunds (
        id SERIAL PRIMARY KEY,
        payment_id integer NOT NULL,
        student_id integer NOT NULL,
        amount numeric(12,2) NOT NULL,
        reason text NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'requested',
        "refundReference" varchar(100) NOT NULL,
        requested_by integer, "requestedAt" timestamp,
        reviewed_by integer, "reviewedAt" timestamp, "reviewNote" text,
        processed_by integer, "processedAt" timestamp, "processedNote" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uq_refunds_reference UNIQUE ("refundReference")
      );`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS evaluation_criteria (
        id SERIAL PRIMARY KEY,
        name varchar(150) NOT NULL,
        description text,
        order_index integer NOT NULL DEFAULT 0,
        active boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS evaluation_periods (
        id SERIAL PRIMARY KEY,
        name varchar(150) NOT NULL,
        "academicYear" varchar(20) NOT NULL,
        semester integer NOT NULL,
        "startsAt" timestamp NOT NULL,
        "endsAt" timestamp NOT NULL,
        is_open boolean NOT NULL DEFAULT false,
        created_by integer,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS course_evaluations (
        id SERIAL PRIMARY KEY,
        period_id integer NOT NULL,
        student_id integer NOT NULL,
        course_id integer NOT NULL,
        lecturer_id integer,
        responses jsonb NOT NULL,
        overall_rating numeric(3,2) NOT NULL,
        written_feedback text,
        "submittedAt" timestamp NOT NULL DEFAULT now(),
        "createdAt" timestamp NOT NULL DEFAULT now()
      );`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_course_evaluations_entry
       ON course_evaluations (period_id, student_id, course_id, coalesce(lecturer_id, 0));`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS course_evaluations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS evaluation_periods;`);
    await queryRunner.query(`DROP TABLE IF EXISTS evaluation_criteria;`);
    await queryRunner.query(`DROP TABLE IF EXISTS refunds;`);
  }
}