-- Galactic Frontier Database Schema
-- Initial migration for Phase 4 Backend Integration

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    discord_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar VARCHAR(255),
    auth_provider VARCHAR(50) DEFAULT 'discord',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    total_score INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Single Player Highscores table
CREATE TABLE IF NOT EXISTS sp_highscores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    level_reached INTEGER DEFAULT 1,
    play_time INTEGER NOT NULL, -- in seconds
    accuracy DECIMAL(5,2) DEFAULT 0.00, -- percentage
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Single Player Sessions table
CREATE TABLE IF NOT EXISTS sp_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    score INTEGER DEFAULT 0,
    level_reached INTEGER DEFAULT 1,
    play_time INTEGER DEFAULT 0, -- in seconds
    accuracy DECIMAL(5,2) DEFAULT 0.00, -- percentage
    enemies_defeated INTEGER DEFAULT 0,
    powerups_collected INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sp_highscores_user_id ON sp_highscores(user_id);
CREATE INDEX IF NOT EXISTS idx_sp_highscores_score ON sp_highscores(score DESC);
CREATE INDEX IF NOT EXISTS idx_sp_highscores_created_at ON sp_highscores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sp_sessions_user_id ON sp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sp_sessions_session_id ON sp_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sp_sessions_created_at ON sp_sessions(created_at DESC);

-- Insert some test data for development
INSERT INTO users (discord_id, username, email, avatar, auth_provider) VALUES
('123456789012345678', 'TestPlayer1', 'test1@example.com', 'default_avatar', 'discord'),
('123456789012345679', 'TestPlayer2', 'test2@example.com', 'default_avatar', 'discord')
ON CONFLICT (discord_id) DO NOTHING;

-- Insert corresponding profiles
INSERT INTO profiles (user_id, avatar_url, bio, total_score, level)
SELECT
    u.id,
    CASE WHEN u.avatar IS NOT NULL THEN 'https://cdn.discordapp.com/avatars/' || u.discord_id || '/' || u.avatar || '.png' ELSE NULL END,
    'Test player profile for Galactic Frontier',
    CASE WHEN u.username = 'TestPlayer1' THEN 1250 ELSE 750 END,
    CASE WHEN u.username = 'TestPlayer1' THEN 6 ELSE 4 END
FROM users u
WHERE u.username IN ('TestPlayer1', 'TestPlayer2')
ON CONFLICT (user_id) DO NOTHING;

-- Insert some test highscores
INSERT INTO sp_highscores (user_id, score, level_reached, play_time, accuracy, session_id)
SELECT
    u.id,
    CASE WHEN u.username = 'TestPlayer1' THEN 500 ELSE 300 END,
    CASE WHEN u.username = 'TestPlayer1' THEN 3 ELSE 2 END,
    CASE WHEN u.username = 'TestPlayer1' THEN 180 ELSE 120 END,
    CASE WHEN u.username = 'TestPlayer1' THEN 85.50 ELSE 72.30 END,
    'test-session-' || LOWER(u.username)
FROM users u
WHERE u.username IN ('TestPlayer1', 'TestPlayer2');



