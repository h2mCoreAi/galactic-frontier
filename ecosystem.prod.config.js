/**
 * Production PM2 ecosystem file
 * Use pm2 startOrReload ecosystem.prod.config.js --env production
 *
 * pm2-logrotate hints (if using pm2-logrotate module):
 *   # pm2 install pm2-logrotate
 *   # pm2 set pm2-logrotate:max_size 10M
 *   # pm2 set pm2-logrotate:retain 7
 */

module.exports = {
  apps: [
    {
      name: 'gf.backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      merge_logs: true,
      out_file: './logs/pm2.out.log',
      error_file: './logs/pm2.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3001,
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        CORS_ORIGINS: process.env.CORS_ORIGINS || '',
        SUBSCRIPTIONS_ENABLED: process.env.SUBSCRIPTIONS_ENABLED || 'false'
      }
    }
  ]
}