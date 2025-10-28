module.exports = {
  apps: [
    {
      name: 'gf.frontend',
      script: 'npm',
      args: 'run preview',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'gf.backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: process.env.DATABASE_URL,
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
        DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        FRONTEND_URL: process.env.FRONTEND_URL || 'https://galacticfrontier.h2mcore.ai',
        CORS_ORIGINS: process.env.CORS_ORIGINS || 'https://galacticfrontier.h2mcore.ai',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        SUBSCRIPTIONS_ENABLED: process.env.SUBSCRIPTIONS_ENABLED || 'false'
      }
    }
  ]
}
