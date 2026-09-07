/* One-off schema script: creates the added tables (refunds, evaluation_criteria,
   evaluation_periods, course_evaluations) that the app adds via TypeORM entities.
   Column names match the entities exactly (TypeORM default naming: property name,
   unless @Column({ name }) is set — callers in the app use quotes, camelCase like
   the repo's initial migration).
   Run: node scripts/apply-extras.js  (from backend dir) */
const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'usms',
});

const statements = [
  `DROP TABLE IF EXISTS refunds, course_evaluations, evaluation_periods, evaluation_criteria;`,
  `CREATE TABLE refunds (
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
  `CREATE TABLE evaluation_criteria (
    id SERIAL PRIMARY KEY,
    name varchar(150) NOT NULL,
    description text,
    order_index integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    "createdAt" timestamp NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE evaluation_periods (
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
  `CREATE TABLE course_evaluations (
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
  `CREATE UNIQUE INDEX uq_course_evaluations_entry
   ON course_evaluations (period_id, student_id, course_id, coalesce(lecturer_id, 0));`,
];

(async () => {
  try {
    await client.connect();
    for (const sql of statements) {
      await client.query(sql);
    }
    const check = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('refunds','evaluation_criteria','evaluation_periods','course_evaluations')
       ORDER BY table_name;`,
    );
    console.log('Tables ensured:', check.rows.map((r) => r.table_name).join(', '));
  } catch (err) {
    console.error('Schema script failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();