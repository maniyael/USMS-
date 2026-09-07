const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'usms',
});
(async () => {
  await client.connect();
  const res = await client.query(
    "select table_name, column_name from information_schema.columns where table_schema='public' and table_name in ('refunds','evaluation_criteria','evaluation_periods','course_evaluations') order by table_name, ordinal_position",
  );
  const grouped = {};
  for (const row of res.rows) {
    (grouped[row.table_name] = grouped[row.table_name] || []).push(row.column_name);
  }
  console.log(JSON.stringify(grouped, null, 1));
  await client.end();
})();