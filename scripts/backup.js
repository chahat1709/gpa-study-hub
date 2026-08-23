#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Database = require(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'server',
    'node_modules',
    'better-sqlite3'
  )
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'server', 'gpa_hub.db');
const DEST_DIR = process.argv[2] || path.join(__dirname, '..', 'backups');
const KEEP = 7;

if (!fs.existsSync(DB_PATH)) {
  console.error(`[backup] DB not found: ${DB_PATH}`);
  process.exit(1);
}
fs.mkdirSync(DEST_DIR, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const dest = path.join(DEST_DIR, `gpa_hub-${stamp}.db`);
const db = new Database(DB_PATH, { readonly: true });
try {
  db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
  console.log(`[backup] ✓ ${dest} (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
} finally {
  db.close();
}
const files = fs
  .readdirSync(DEST_DIR)
  .filter(f => f.startsWith('gpa_hub-') && f.endsWith('.db'))
  .sort()
  .reverse();
for (const f of files.slice(KEEP)) {
  fs.unlinkSync(path.join(DEST_DIR, f));
  console.log(`[backup] pruned ${f}`);
}
const v = new Database(dest, { readonly: true });
const count = v.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table'").get().c;
v.close();
console.log(`[backup] verified ${count} tables`);
