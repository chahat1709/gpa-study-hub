/**
 * PM2 ecosystem — GPA Study Hub
 * Single instance for SQLite (WAL still serializes writes). Use cluster only with Postgres.
 * Logs rotated via pm2-logrotate (pm2 install pm2-logrotate).
 */
module.exports = {
  apps: [
    {
      name: 'gpa-study-hub-server',
      script: 'server/server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      exp_backoff_restart_delay: 100,
      // Health check via PM2
      health_check_grace_period: 3000,
    },
  ],
};
