const Redis = require('ioredis');
const pino = require('pino');

const log = pino({ name: 'redis' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const redis = new Redis(REDIS_URL, {
  password: REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: true,
  connectTimeout: 5000,
  keepAlive: 30000,
  keyPrefix: 'gpa:',
});

redis.on('connect', () => log.info('Redis connected'));
redis.on('ready', () => log.info('Redis ready'));
redis.on('error', (err) => log.error({ err: err.message }, 'Redis error'));
redis.on('close', () => log.warn('Redis connection closed'));

// Cache helpers
const cache = {
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch { /* cache write failure is non-fatal */ }
  },

  async del(key) {
    try {
      await redis.del(key);
    } catch { /* ignore */ }
  },

  async delPattern(pattern) {
    try {
      const keys = await redis.keys(`gpa:${pattern}`);
      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach(k => pipeline.del(k.replace('gpa:', '')));
        await pipeline.exec();
      }
    } catch { /* ignore */ }
  },

  async incr(key, ttlSeconds = 60) {
    try {
      const val = await redis.incr(key);
      if (val === 1) await redis.expire(key, ttlSeconds);
      return val;
    } catch {
      return 0;
    }
  },

  async getHash(key) {
    try {
      return await redis.hgetall(key);
    } catch {
      return {};
    }
  },

  async setHash(key, data, ttlSeconds = 300) {
    try {
      await redis.hset(key, data);
      if (ttlSeconds > 0) await redis.expire(key, ttlSeconds);
    } catch { /* ignore */ }
  },
};

// Cache middleware factory
function cacheMiddleware(keyFn, ttlSeconds = 300) {
  return async (req, res, next) => {
    const key = typeof keyFn === 'function' ? keyFn(req) : keyFn;
    try {
      const cached = await cache.get(key);
      if (cached) {
        return res.json(cached);
      }
    } catch { /* ignore cache errors, proceed to handler */ }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, data, ttlSeconds).catch(() => {});
      return originalJson(data);
    };
    next();
  };
}

// Session store using Redis
const session = {
  async create(userId, data, ttlSeconds = 2592000) { // 30 days
    const key = `session:${userId}`;
    await cache.set(key, { ...data, userId, createdAt: Date.now() }, ttlSeconds);
  },

  async get(userId) {
    return await cache.get(`session:${userId}`);
  },

  async destroy(userId) {
    await cache.del(`session:${userId}`);
  },

  async refresh(userId, ttlSeconds = 2592000) {
    const data = await cache.get(`session:${userId}`);
    if (data) {
      await cache.set(`session:${userId}`, data, ttlSeconds);
    }
  },
};

module.exports = { redis, cache, cacheMiddleware, session };
