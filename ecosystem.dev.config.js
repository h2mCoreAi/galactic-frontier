module.exports = {
  apps: [
    {
      name: 'gf.backend',
      script: 'server.js',
      cwd: '/srv/galactic-frontier',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        AUTH_BYPASS: 'true'
      },
      watch: ['server.js', 'api'],
      ignore_watch: ['node_modules', 'dist', 'logs'],
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'gf.frontend',
      script: 'npm',
      args: 'run dev -- --host --port 5174',
      cwd: '/srv/galactic-frontier',
      env: { NODE_ENV: 'development' },
      watch: false,
      autorestart: true,
      max_memory_restart: '512M'
    },
    {
      name: 'gf.dashboard',
      script: 'npm',
      args: 'run dev:dashboard -- --host --port 5176',
      cwd: '/srv/galactic-frontier',
      env: { NODE_ENV: 'development' },
      watch: false,
      autorestart: true,
      max_memory_restart: '512M'
    }
  ]
}
