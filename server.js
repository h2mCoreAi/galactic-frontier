const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { promises: fsPromises } = fs;
require('dotenv').config();

// Environment variables
const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://galactic_frontier:galactic_frontier@localhost:5433/galactic_frontier';
const JWT_SECRET = process.env.JWT_SECRET || 'galactic_frontier_jwt_secret_key_for_development_only_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'galactic_frontier_refresh_secret_key_for_development_only_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'placeholder';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'placeholder';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5174';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000;
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
const CONFIG_PATH = path.join(__dirname, 'config', 'config.json');
const CONFIG_BACKUP_DIR = process.env.CONFIG_BACKUP_DIR || path.join(__dirname, 'config', 'backups');
const CONFIG_BACKUP_RETENTION = parseInt(process.env.CONFIG_BACKUP_RETENTION || '10', 10);

// Initialize Express app
const app = express();

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'galactic-frontier-backend' },
  transports: [
    new winston.transports.File({ filename: '/srv/galactic-frontier/logs/backend-error.log', level: 'error' }),
    new winston.transports.File({ filename: '/srv/galactic-frontier/logs/backend-out.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Database connection
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const ensureDirectory = async (directoryPath) => {
  try {
    await fsPromises.mkdir(directoryPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

const readConfigFile = async () => {
  const data = await fsPromises.readFile(CONFIG_PATH, 'utf8');
  return JSON.parse(data);
};

const writeConfigFile = async (config) => {
  await ensureDirectory(path.dirname(CONFIG_PATH));
  await fsPromises.writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
};

const getBackupPath = (backupId) => path.join(CONFIG_BACKUP_DIR, `${backupId}.json`);

const listConfigBackupFiles = async () => {
  await ensureDirectory(CONFIG_BACKUP_DIR);
  const entries = await fsPromises.readdir(CONFIG_BACKUP_DIR, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));

  const backups = await Promise.all(files.map(async (file) => {
    const filePath = path.join(CONFIG_BACKUP_DIR, file.name);
    const stats = await fsPromises.stat(filePath);
    return {
      id: path.basename(file.name, '.json'),
      createdAt: stats.mtime.toISOString(),
      size: stats.size,
      path: filePath,
    };
  }));

  backups.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return backups;
};

const listConfigBackups = async () => {
  const backups = await listConfigBackupFiles();
  return backups
    .slice(0, CONFIG_BACKUP_RETENTION)
    .map(({ path: backupPath, ...rest }) => rest);
};

const createConfigBackup = async (config) => {
  await ensureDirectory(CONFIG_BACKUP_DIR);
  const backupId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`;
  const backupPath = path.join(CONFIG_BACKUP_DIR, `${backupId}.json`);
  await fsPromises.writeFile(backupPath, `${JSON.stringify(config, null, 2)}\n`);
  await pruneConfigBackups();
  return backupId;
};

const restoreConfigBackup = async (backupId) => {
  const backupPath = getBackupPath(backupId);
  const data = await fsPromises.readFile(backupPath, 'utf8');
  const config = JSON.parse(data);
  await writeConfigFile(config);
  return config;
};

const pruneConfigBackups = async () => {
  const backups = await listConfigBackupFiles();
  const excess = backups.slice(CONFIG_BACKUP_RETENTION);
  await Promise.all(excess.map(async (backup) => {
    try {
      await fsPromises.unlink(backup.path);
    } catch (error) {
      logger.warn('Failed to prune backup', { path: backup.path, error: error.message });
    }
  }));
};

// Test database connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport Discord OAuth setup
passport.use(new DiscordStrategy({
  clientID: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  callbackURL: `${process.env.NODE_ENV === 'production' ? 'https://galacticfrontier.h2mcore.ai' : 'http://localhost:3001'}/auth/discord/callback`,
  scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, discord_id, username FROM users WHERE discord_id = $1',
      [profile.id]
    );

    let user;
    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
      // Update user info if needed
      await pool.query(
        'UPDATE users SET username = $1 WHERE discord_id = $2',
        [profile.username, profile.id]
      );
    } else {
      // Create new user
      const newUserResult = await pool.query(
        'INSERT INTO users (discord_id, username, auth_provider, email) VALUES ($1, $2, $3, $4) RETURNING id, discord_id, username',
        [profile.id, profile.username, 'discord', profile.email]
      );
      user = newUserResult.rows[0];

      // Create default profile
      await pool.query(
        'INSERT INTO profiles (user_id, avatar_url, bio) VALUES ($1, $2, $3)',
        [user.id, profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null, 'Welcome to Galactic Frontier!']
      );
    }

    return done(null, user);
  } catch (error) {
    logger.error('Discord OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT id, discord_id, username FROM users WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(null, null);
    }
  } catch (error) {
    done(error, null);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Basic routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'galactic-frontier-backend'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'galactic-frontier-backend'
  });
});

// API Routes

// Authentication routes
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: `${FRONTEND_URL}?error=auth_failed` }),
  (req, res) => {
    // Successful authentication - generate JWT token
    const token = jwt.sign(
      { userId: req.user.id, username: req.user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store token in localStorage via a simple HTML page that sets it and redirects
    const redirectHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating...</title>
          <script>
            localStorage.setItem('gf_auth_token', '${token}');
            window.location.href = '${FRONTEND_URL}?auth_success=true';
          </script>
        </head>
        <body>
          <p>Authentication successful, redirecting...</p>
        </body>
      </html>
    `;

    res.send(redirectHtml);
  }
);

// Profile routes
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const profileResult = await pool.query(`
      SELECT p.*, u.username, u.email
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `, [req.user.userId]);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profileResult.rows[0]);
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/profile', verifyToken, async (req, res) => {
  try {
    const { bio, avatar_url } = req.body;

    await pool.query(
      'UPDATE profiles SET bio = $1, avatar_url = $2, updated_at = NOW() WHERE user_id = $3',
      [bio, avatar_url, req.user.userId]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Leaderboard routes
app.get('/api/highscores', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const highscoresResult = await pool.query(`
      SELECT
        h.id,
        h.score,
        h.level_reached,
        EXTRACT(EPOCH FROM h.play_time) as play_time_seconds,
        h.timestamp,
        u.username,
        p.avatar_url
      FROM sp_highscores h
      JOIN users u ON h.user_id = u.id
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY h.score DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      highscores: highscoresResult.rows,
      total: highscoresResult.rowCount
    });
  } catch (error) {
    logger.error('Highscores fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch highscores' });
  }
});

app.post('/api/highscores', verifyToken, async (req, res) => {
  try {
    const { score, level_reached, play_time, accuracy, session_id } = req.body;

    // Validate input
    if (!score || !level_reached || !play_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert play_time from seconds to PostgreSQL interval
    const playTimeInterval = `${Math.floor(play_time)} seconds`;

    await pool.query(
      'INSERT INTO sp_highscores (user_id, score, level_reached, play_time, timestamp, session_id) VALUES ($1, $2, $3, $4, NOW(), $5)',
      [req.user.userId, score, level_reached, playTimeInterval, session_id]
    );

    // Update user profile total score and level
    const profileResult = await pool.query(
      'SELECT total_score FROM profiles WHERE user_id = $1',
      [req.user.userId]
    );

    if (profileResult.rows.length > 0) {
      const currentTotalScore = profileResult.rows[0].total_score || 0;
      const newTotalScore = Math.max(currentTotalScore, score);
      const newLevel = Math.floor(newTotalScore / 250) + 1;

      await pool.query(
        'UPDATE profiles SET total_score = $1, level = $2, updated_at = NOW() WHERE user_id = $3',
        [newTotalScore, newLevel, req.user.userId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Highscore submission error:', error);
    res.status(500).json({ error: 'Failed to submit highscore' });
  }
});

// Session routes
app.post('/api/sessions/start', verifyToken, async (req, res) => {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await pool.query(
      'INSERT INTO sp_sessions (user_id, session_id, start_time) VALUES ($1, $2, NOW())',
      [req.user.userId, sessionId]
    );

    res.json({ session_id: sessionId });
  } catch (error) {
    logger.error('Session start error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

app.put('/api/sessions/:sessionId/end', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { score, level_reached, play_time, accuracy, enemies_defeated } = req.body;

    await pool.query(
      'UPDATE sp_sessions SET end_time = NOW(), score = $1, level_reached = $2, play_time = $3 WHERE session_id = $4 AND user_id = $5',
      [score, level_reached, play_time, sessionId, req.user.userId]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Session end error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// JWT verification middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded; // Add user info to request
    next();
  });
}

// Middleware to check authentication for protected routes (legacy passport)
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Apply authentication middleware to protected routes
app.use('/api/profile', verifyToken);
app.use('/api/highscores', (req, res, next) => {
  // GET requests are public, POST requires auth
  if (req.method === 'POST') {
    verifyToken(req, res, next);
  } else {
    next();
  }
});

// Serve config.json for frontend
app.get('/api/config.json', async (req, res) => {
  try {
    const config = await readConfigFile();
    res.json(config);
  } catch (error) {
    logger.error('Error reading config.json:', error);
    res.status(500).json({ error: 'Failed to read configuration' });
  }
});

app.put('/api/config.json', verifyToken, async (req, res) => {
  try {
    const config = req.body;
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Invalid configuration payload' });
    }

    await createConfigBackup(await readConfigFile());
    await writeConfigFile(config);

    logger.info('Configuration updated by user', { userId: req.user.userId });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating configuration:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

app.get('/api/config/backups', verifyToken, async (req, res) => {
  try {
    const backups = await listConfigBackups();
    res.json({ backups });
  } catch (error) {
    logger.error('Error retrieving config backups:', error);
    res.status(500).json({ error: 'Failed to list configuration backups' });
  }
});

app.post('/api/config/backups/:backupId/restore', verifyToken, async (req, res) => {
  try {
    const { backupId } = req.params;
    const download = req.query.download === '1';
    if (download) {
      const backupPath = path.join(CONFIG_BACKUP_DIR, `${backupId}.json`);
      return res.download(backupPath, `config-backup-${backupId}.json`);
    }

    const restoredConfig = await restoreConfigBackup(backupId);
    logger.warn('Configuration restored from backup', { userId: req.user.userId, backupId });
    res.json(restoredConfig);
  } catch (error) {
    logger.error('Error restoring config backup:', error);
    res.status(500).json({ error: 'Failed to restore configuration backup' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    logger.info('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  pool.end(() => {
    logger.info('Database pool closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Galactic Frontier Backend server running on port ${PORT}`);
  logger.info(`Frontend URL: ${FRONTEND_URL}`);
  logger.info(`CORS Origin: ${CORS_ORIGIN}`);
});
