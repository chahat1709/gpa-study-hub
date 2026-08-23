const pino = require('pino');
const log = pino({ name: 'saas' });

// SaaS Tenant Management
class TenantManager {
  constructor(db) {
    this.db = db;
  }

  // Create new institution (tenant)
  async createTenant({ name, code, domain, plan = 'free', adminEmail, maxUsers = 500 }) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();

    this.db
      .prepare(
        `
      INSERT INTO institutions (id, name, code, domain, plan, max_users)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(id, name, code, domain || '', plan, maxUsers);

    log.info({ tenantId: id, name, code }, 'Tenant created');
    return { id, name, code, plan };
  }

  // Get tenant by code
  getTenant(code) {
    return this.db.prepare('SELECT * FROM institutions WHERE code = ?').get(code);
  }

  // List all tenants
  listTenants() {
    return this.db.prepare('SELECT * FROM institutions ORDER BY created_at DESC').all();
  }

  // Update tenant plan
  updatePlan(tenantId, plan) {
    const plans = {
      free: { maxUsers: 500 },
      basic: { maxUsers: 2000 },
      pro: { maxUsers: 10000 },
      enterprise: { maxUsers: 100000 },
    };
    const limits = plans[plan] || plans.free;

    this.db
      .prepare('UPDATE institutions SET plan = ?, max_users = ? WHERE id = ?')
      .run(plan, limits.maxUsers, tenantId);
    log.info({ tenantId, plan }, 'Tenant plan updated');
    return { plan, maxUsers: limits.maxUsers };
  }

  // Check tenant capacity
  checkCapacity(tenantId) {
    const tenant = this.db.prepare('SELECT max_users FROM institutions WHERE id = ?').get(tenantId);
    if (!tenant) return { allowed: false, error: 'Tenant not found' };

    const userCount = this.db
      .prepare('SELECT COUNT(*) as count FROM users WHERE institution_id = ?')
      .get(tenantId).count;
    return {
      allowed: userCount < tenant.maxUsers,
      current: userCount,
      max: tenant.maxUsers,
      usage: `${((userCount / tenant.maxUsers) * 100).toFixed(1)}%`,
    };
  }

  // Tenant stats
  getTenantStats(tenantId) {
    const users = this.db
      .prepare('SELECT COUNT(*) as count FROM users WHERE institution_id = ?')
      .get(tenantId).count;
    const attendance = this.db
      .prepare('SELECT COUNT(*) as count FROM attendance_records WHERE institution_id = ?')
      .get(tenantId).count;
    const resources = this.db
      .prepare('SELECT COUNT(*) as count FROM resources WHERE institution_id = ?')
      .get(tenantId).count;
    const exams = this.db
      .prepare('SELECT COUNT(*) as count FROM exams WHERE institution_id = ?')
      .get(tenantId).count;
    const messages = this.db
      .prepare(
        `
      SELECT COUNT(*) as count FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE c.institution_id = ?
    `
      )
      .get(tenantId).count;

    return { users, attendance, resources, exams, messages };
  }
}

module.exports = { TenantManager };
