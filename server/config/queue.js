const pino = require('pino');

const log = pino({ name: 'queue' });

// In-memory job queue (replace with RabbitMQ/BullMQ in production)
class JobQueue {
  constructor() {
    this.queues = new Map();
    this.processors = new Map();
    this.isProcessing = new Map();
    this.stats = { processed: 0, failed: 0, pending: 0 };
  }

  createQueue(name) {
    if (!this.queues.has(name)) {
      this.queues.set(name, []);
      this.processors.set(name, null);
      this.isProcessing.set(name, false);
    }
    return this;
  }

  process(queueName, handler) {
    this.processors.set(queueName, handler);
    this._processNext(queueName);
    return this;
  }

  async add(queueName, jobData, options = {}) {
    this.createQueue(queueName);
    const job = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      data: jobData,
      attempts: options.attempts || 3,
      delay: options.delay || 0,
      createdAt: Date.now(),
      status: 'pending',
    };

    this.queues.get(queueName).push(job);
    this.stats.pending++;

    log.info({ queueName, jobId: job.id }, 'Job added');

    if (!this.isProcessing.get(queueName)) {
      this._processNext(queueName);
    }

    return job;
  }

  async _processNext(queueName) {
    if (this.isProcessing.get(queueName)) return;

    const queue = this.queues.get(queueName);
    const processor = this.processors.get(queueName);
    if (!queue || !processor || queue.length === 0) return;

    this.isProcessing.set(queueName, true);

    while (queue.length > 0) {
      const job = queue.shift();
      this.stats.pending--;

      try {
        if (job.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, job.delay));
        }
        await processor(job);
        this.stats.processed++;
        job.status = 'completed';
      } catch (err) {
        job.attempts--;
        if (job.attempts > 0) {
          queue.push(job);
          this.stats.pending++;
          log.warn({ jobId: job.id, attemptsLeft: job.attempts }, 'Job retry');
        } else {
          this.stats.failed++;
          job.status = 'failed';
          log.error({ jobId: job.id, err: err.message }, 'Job failed');
        }
      }
    }

    this.isProcessing.set(queueName, false);
  }

  getStats() {
    return { ...this.stats };
  }
}

const queue = new JobQueue();

// Email job processor (stub - integrate with nodemailer/SendGrid)
queue.createQueue('email');
queue.process('email', async (job) => {
  const { to, subject, body } = job.data;
  log.info({ to, subject }, 'Email job processed (stub)');
  // TODO: integrate real email service
});

// Report generation processor
queue.createQueue('reports');
queue.process('reports', async (job) => {
  const { type, userId, data } = job.data;
  log.info({ type, userId }, 'Report generation started');
  // TODO: generate PDF/Excel reports
});

// Notification processor
queue.createQueue('notifications');
queue.process('notifications', async (job) => {
  const { userId, message, type } = job.data;
  log.info({ userId, type }, 'Notification sent');
});

module.exports = { queue, JobQueue };
