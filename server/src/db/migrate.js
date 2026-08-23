const fs = require('fs');
const path = require('path');

/**
 * Simple migration runner — single source of truth for DB.
 * Uses SQLite `migrations` table to track applied versions.
 * For Postgres (when DATABASE_URL is set), use `pg` + same files via `server/config/init.sql` legacy.
 */
function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    db
      .prepare('SELECT id FROM migrations')
      .all()
      .map(r => r.id)
  );
  const dir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(dir)) return;

  const files = fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.js'))
    .sort();
  for (const file of files) {
    const id = path.basename(file, '.js');
    if (applied.has(id)) continue;
    const mod = require(path.join(dir, file));
    console.log(`[migrate] applying ${id}...`);
    db.transaction(() => {
      mod.up(db);
      db.prepare('INSERT INTO migrations (id) VALUES (?)').run(id);
    })();
    console.log(`[migrate] ✓ ${id}`);
  }
}

module.exports = { runMigrations };
