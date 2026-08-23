const path = require('path');

let db = null;
let pgPool = null;

function getDb() {
  if (db || pgPool) return db || pgPool;

  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    // Provide sqlite-compatible `prepare` shim for pg (minimal, for health check)
    console.log('[db] Using Postgres via DATABASE_URL');
    return pgPool;
  }

  const Database = require('better-sqlite3');
  const { runMigrations } = require('./migrate');
  db = new Database(path.join(__dirname, '..', '..', 'gpa_hub.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('busy_timeout = 5000');
  runMigrations(db);
  console.log('[db] Using SQLite');
  return db;
}

module.exports = { getDb };
