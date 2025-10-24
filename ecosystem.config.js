module.exports = {
  apps: [
    {
      name: 'gf.frontend',
      script: 'npx',
      args: 'serve dist -s -l 5174',
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
        PORT: 3001
      }
    }
  ]
}
