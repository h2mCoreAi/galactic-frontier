module.exports = {
  apps: [
    {
      name: 'gf.frontend',
      script: 'npm run dev',
      cwd: '/srv/galactic-frontier',
      env: {
        NODE_ENV: 'development'
      },
      watch: ['single-player/src', 'vite.config.js'],
      ignore_watch: ['node_modules', 'dist', 'logs'],
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'gf.backend',
      script: 'server.js', // This will need to be created later
      cwd: '/srv/galactic-frontier',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      watch: ['server.js', 'api'],
      ignore_watch: ['node_modules', 'dist', 'logs'],
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
}
