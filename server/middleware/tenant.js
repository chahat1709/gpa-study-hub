const Database = require('better-sqlite3');
const path = require('path');
const pino = require('pino');

const log = pino({ name: 'tenant' });

// Tenant database connections cache
const tenantDbs = new Map();

function getTenantDb(tenantId) {
  if (tenantDbs.has(tenantId)) {
    return tenantDbs.get(tenantId);
  }

  const dbPath = path.join(__dirname, '..', 'data', `tenant_${tenantId}.db`);
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('busy_timeout = 5000');

  tenantDbs.set(tenantId, db);
  log.info({ tenantId }, 'Tenant database connected');
  return db;
}

function closeAllTenantDbs() {
  for (const [tenantId, db] of tenantDbs) {
    try {
      db.close();
      log.info({ tenantId }, 'Tenant database closed');
    } catch (e) {
      log.error({ tenantId, err: e }, 'Error closing tenant database');
    }
  }
  tenantDbs.clear();
}

// Middleware: extract tenant from JWT or subdomain
function tenantMiddleware(req, res, next) {
  // For SaaS mode: tenant comes from JWT or subdomain
  // For single-college mode: default tenant
  const tenantId = req.user?.tenantId || process.env.DEFAULT_TENANT || 'default';

  req.tenantId = tenantId;
  req.tenantDb = getTenantDb(tenantId);
  next();
}

module.exports = { getTenantDb, closeAllTenantDbs, tenantMiddleware };
