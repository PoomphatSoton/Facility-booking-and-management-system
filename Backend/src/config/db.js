const { Pool } = require('pg');

const sslConfig =
  process.env.DB_SSL === 'true'
    ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      }
    : false;

const buildPoolConfig = () => {
  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: sslConfig,
  };
};

const pool = new Pool(buildPoolConfig());

const logConnectionInfo = async () => {
  const { rows } = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      current_user AS user_name
  `);

  const info = rows[0];
  console.log(
    `[db] connected database=${info.database_name} schema=${info.schema_name} user=${info.user_name}`
  );
};

const initDb = async () => {
  await logConnectionInfo();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      date_of_birth DATE,
      address TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE public.users
    ALTER COLUMN first_name DROP NOT NULL,
    ALTER COLUMN last_name DROP NOT NULL,
    ALTER COLUMN date_of_birth DROP NOT NULL,
    ALTER COLUMN address DROP NOT NULL
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.pending_registrations (
      registration_id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      otp TEXT NOT NULL,
      otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
};

module.exports = {
  pool,
  initDb,
};