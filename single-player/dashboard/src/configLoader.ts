import { actions } from './state';
import { fetchConfig, fetchBackups } from './api';
import { getCachedConfig, setCachedConfig, invalidateConfigCache } from './cache';
import type { GalacticFrontierConfig } from './types';

const isValidNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isValidPositive = (value: unknown): value is number => isValidNumber(value) && value > 0;

const validateShip = (ship: GalacticFrontierConfig['ship']): void => {
  if (!isValidPositive(ship.maxSpeed) || !isValidPositive(ship.thrust)) {
    throw new Error('Ship configuration contains invalid speed or thrust values.');
  }
  if (!isValidPositive(ship.afterburnerMax) || !isValidPositive(ship.afterburnerDepleteRate) || !isValidPositive(ship.afterburnerRegenRate)) {
    throw new Error('Ship afterburner values must be positive numbers.');
  }
  if (!isValidPositive(ship.maxHealth)) {
    throw new Error('Ship maxHealth must be a positive number.');
  }
};

const validateProjectile = (projectiles: GalacticFrontierConfig['projectiles']): void => {
  if (!isValidPositive(projectiles.speed) || !isValidPositive(projectiles.life) || !isValidPositive(projectiles.cooldown)) {
    throw new Error('Projectile configuration requires positive speed, life, and cooldown values.');
  }
  if (!isValidPositive(projectiles.fanShotCount) || !isValidPositive(projectiles.fanShotAngle)) {
    throw new Error('Fan-shot configuration requires positive count and angle values.');
  }
};

const validateEnemies = (enemies: GalacticFrontierConfig['enemies']): void => {
  if (!Array.isArray(enemies) || enemies.length === 0) {
    throw new Error('At least one enemy configuration must be provided.');
  }
  enemies.forEach((enemy) => {
    if (!enemy.type) {
      throw new Error('Enemy type is required.');
    }
    const numericFields: Array<[number, string]> = [
      [enemy.size, 'size'],
      [enemy.hitboxSize ?? enemy.size, 'hitboxSize'],
      [enemy.speed, 'speed'],
      [enemy.points, 'points'],
      [enemy.shootInterval, 'shootInterval'],
      [enemy.projectileDamage, 'projectileDamage'],
      [enemy.collisionDamage, 'collisionDamage'],
    ];
    numericFields.forEach(([value, label]) => {
      if (!isValidPositive(value)) {
        throw new Error(`Enemy ${enemy.type} has invalid ${label} value.`);
      }
    });
  });
};

const validateGame = (game: GalacticFrontierConfig['game']): void => {
  if (!isValidPositive(game.scoreToLevelUp)) {
    throw new Error('scoreToLevelUp must be a positive number.');
  }
  const intervalPairs: Array<[number, number, string]> = [
    [game.minSpawnInterval, game.maxSpawnInterval, 'enemy spawn'],
    [game.minHealthSpawnInterval, game.maxHealthSpawnInterval, 'health power-up spawn'],
    [game.minFanShotSpawnInterval, game.maxFanShotSpawnInterval, 'fan-shot power-up spawn'],
  ];
  intervalPairs.forEach(([min, max, label]) => {
    if (!isValidPositive(min) || !isValidPositive(max) || min > max) {
      throw new Error(`Invalid ${label} interval. Minimum must be <= maximum and both positive.`);
    }
  });
  if (!isValidPositive(game.healthPowerUpValue) || !isValidPositive(game.fanShotDuration)) {
    throw new Error('Power-up values must be positive numbers.');
  }
};

export const validateConfig = (config: GalacticFrontierConfig): void => {
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration payload is invalid.');
  }
  validateShip(config.ship);
  validateProjectile(config.projectiles);
  validateEnemies(config.enemies);
  validateGame(config.game);
};

let isLoadingConfig = false; // Prevent concurrent config loads

export const loadDashboardConfig = async (): Promise<void> => {
  // Prevent concurrent config loads that cause rate limiting
  if (isLoadingConfig) {
    console.log('[GF Dashboard] Config load already in progress, skipping...');
    return;
  }
  
  try {
    isLoadingConfig = true;
    actions.setLoading(true);
    
    // Try cache first - use cached config if available to avoid API call
    const cached = getCachedConfig();
    if (cached) {
      try {
        validateConfig(cached);
        actions.setConfig(cached, false);
        actions.setError(null);
        // If we have valid cached config, defer fresh fetch to avoid rate limiting
        window.setTimeout(async () => {
          try {
            const freshConfig = await fetchConfig();
            try {
              validateConfig(freshConfig);
              actions.setConfig(freshConfig, false);
              setCachedConfig(freshConfig);
            } catch (validationError) {
              console.warn('[GF Dashboard] Fresh config validation failed', validationError);
            }
          } catch (error) {
            // Silently fail on rate limit - we already have cached config
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (!errorMessage.includes('429') && !errorMessage.includes('Too Many Requests')) {
              console.warn('[GF Dashboard] Failed to refresh config', error);
            }
          }
        }, 8000); // Wait 8 seconds before refreshing to avoid rate limits
        isLoadingConfig = false;
        actions.setLoading(false);
        return; // Exit early if we have cached config
      } catch (validationError) {
        console.warn('[GF Dashboard] Cached config validation failed, fetching fresh', validationError);
        invalidateConfigCache();
      }
    }

    // Only fetch fresh config if no cache available
    const config = await fetchConfig();
    try {
      validateConfig(config);
      actions.setConfig(config, false);
      actions.setError(null);
      setCachedConfig(config);
    } catch (validationError) {
      console.warn('[GF Dashboard] Validation failed, opening raw editor anyway', validationError);
      // Allow editing even if invalid; user can fix and save
      actions.setConfig(config, true);
      actions.setError(validationError instanceof Error ? validationError.message : 'Configuration validation failed.');
      setCachedConfig(config);
    }
    // Load backups in the background, don't block editor render
    fetchBackups()
      .then((list) => actions.setBackups(list))
      .catch((error) => {
        console.warn('[GF Dashboard] Failed to load backups', error);
      });
  } catch (error) {
    // Don't log rate limit errors - they're expected on initial load
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('429') && !errorMessage.includes('Too Many Requests')) {
      console.error('[GF Dashboard] Failed to load configuration', error);
      actions.setError(errorMessage);
    } else {
      // For rate limits, try to use cache if available, otherwise show a user-friendly message
      const cached = getCachedConfig();
      if (cached) {
        try {
          validateConfig(cached);
          actions.setConfig(cached, false);
          actions.setError(null);
        } catch {
          actions.setError('Rate limited - please wait a moment and refresh.');
        }
      } else {
        actions.setError('Rate limited - please wait a moment and refresh.');
      }
    }
  } finally {
    actions.setLoading(false);
    isLoadingConfig = false;
  }
};
