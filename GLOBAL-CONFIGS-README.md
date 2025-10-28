# Global Configuration Files

## 📁 Location
Global configuration files for all projects are stored in `/srv/global-configs/`

## 📄 Galactic Frontier Config
The comprehensive configuration file for Galactic Frontier has been moved to:
```
/srv/global-configs/galactic-frontier-configs.json
```

## 🔗 Purpose
This file serves as the "file of truth" containing:
- All resource usage (ports, database, environment variables)
- Network endpoints and API routes
- Database schema information
- Game mechanics and settings
- Security configurations
- Development settings
- Conflict prevention notes

## 📋 Contents
- **Ports**: Backend (3001), Frontend (5174), Database (5433)
- **Database**: PostgreSQL schema with 4 tables (users, profiles, sp_highscores, sp_sessions)
- **Environment Variables**: JWT secrets, Discord OAuth, rate limiting, etc.
- **File Paths**: Complete mono-repo structure mapping
- **API Routes**: Authentication, profiles, highscores, config access
- **Security**: CORS policies, rate limiting, authentication
- **Game Mechanics**: Phaser.js controls, enemy types, power-ups, scoring

## ⚠️ Important Notes
- **DO NOT** use ports [3001, 5174, 5433] for other projects
- **DO NOT** use database name "galactic_frontier"
- **DO NOT** use environment variable prefixes: JWT_, BCRYPT_, RATE_LIMIT_, ACCOUNT_LOCKOUT_, DISCORD_
- **DO NOT** use PM2 process names: gf.backend, gf.frontend

## 🔄 Updates
When updating the global config, please:
1. Update `/srv/global-configs/galactic-frontier-configs.json`
2. Update this README if paths or resources change
3. Update the memory graph if needed

## 📞 Contact
For questions about global configurations, check the memory graph or project documentation.
