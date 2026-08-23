#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const REQUIRED = [
  { key: 'JWT_SECRET', minLen: 32, msg: 'JWT_SECRET must be 32+ random chars' },
  { key: 'ADMIN_CODE', minLen: 8, msg: 'ADMIN_CODE must be set and not default' },
];

function loadEnvFiles() {
  for (const p of ['.env', '.env.local', 'server/.env']) {
    const full = path.join(ROOT, p);
    if (fs.existsSync(full)) dotenv.config({ path: full, override: false });
  }
}

function validate() {
  loadEnvFiles();
  let ok = true;
  for (const { key, minLen, msg } of REQUIRED) {
    const v = process.env[key];
    if (!v || v.trim().length < minLen || /change[_-]?me/i.test(v) || /your-.*-here/i.test(v)) {
      console.error(`[env] ✗ ${key}: ${msg} (got: ${v ? v.slice(0, 6) + '...' : 'missing'})`);
      ok = false;
    } else {
      console.log(`[env] ✓ ${key}`);
    }
  }
  if (!ok) {
    console.error('\n[env] Fix .env / server/.env then retry. See .env.example');
    process.exit(1);
  }
  console.log('[env] All required vars present');
}

validate();
