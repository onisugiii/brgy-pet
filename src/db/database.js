const { Pool } = require('pg');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
 ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('✔  PostgreSQL connected via Supabase');
    client.release();
    await initSchema();
  } catch (err) {
    console.error('✘  PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
}
async function query(text, params) {
  return pool.query(text, params);
}
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      barangay   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS owners (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      address    TEXT,
      contact    TEXT,
      barangay   TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS animals (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      breed         TEXT,
      species       TEXT NOT NULL,
      color         TEXT,
      sex           TEXT,
      age           TEXT,
      owner_id      INTEGER REFERENCES owners(id) ON DELETE SET NULL,
      owner_name    TEXT NOT NULL,
      vax_status    TEXT NOT NULL DEFAULT 'Unvaccinated',
      image         TEXT,
      notes         TEXT,
      registered_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vaccinations (
      id        SERIAL PRIMARY KEY,
      animal_id INTEGER NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
      vaccine   TEXT NOT NULL,
      given_by  TEXT,
      given_at  TIMESTAMP DEFAULT NOW(),
      next_due  TIMESTAMP,
      notes     TEXT
    );
    CREATE TABLE IF NOT EXISTS lost_found (
      id          SERIAL PRIMARY KEY,
      animal_id   INTEGER REFERENCES animals(id) ON DELETE SET NULL,
      type        TEXT NOT NULL,
      description TEXT,
      last_seen   TEXT,
      reporter    TEXT,
      contact     TEXT,
      status      TEXT NOT NULL DEFAULT 'active',
      reported_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS adoptions (
      id          SERIAL PRIMARY KEY,
      animal_id   INTEGER NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
      animal_name TEXT NOT NULL,
      species     TEXT,
      description TEXT,
      listed_by   TEXT,
      status      TEXT NOT NULL DEFAULT 'available',
      listed_at   TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS scan_reports (
      id         SERIAL PRIMARY KEY,
      animal_id  INTEGER REFERENCES animals(id) ON DELETE SET NULL,
      scanned_by TEXT NOT NULL,
      location   TEXT,
      notes      TEXT,
      scanned_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id        SERIAL PRIMARY KEY,
      color     TEXT NOT NULL DEFAULT 'blue',
      text      TEXT NOT NULL,
      actor     TEXT,
      logged_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      new_password TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✔  Tables ready');
}
module.exports = { connectDB, query };