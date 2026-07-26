module.exports = {
  apps: [{
    name: 'gpa-study-hub',
    script: 'server/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
  }]
};
