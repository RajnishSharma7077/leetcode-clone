import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'lcuser',
  password: process.env.PGPASSWORD || 'lcpass',
  database: process.env.PGDATABASE || 'lcdb'
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

export default { query };
