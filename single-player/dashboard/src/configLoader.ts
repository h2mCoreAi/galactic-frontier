import { actions } from './state';
import { fetchConfig, fetchBackups } from './api';
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

export const loadDashboardConfig = async (): Promise<void> => {
  actions.setLoading(true);
  try {
    const [config, backups] = await Promise.all([
      fetchConfig(),
      fetchBackups().catch((error) => {
        console.warn('[GF Dashboard] Failed to load backups', error);
        return [];
      }),
    ]);
    validateConfig(config);
    actions.setConfig(config, false);
    actions.setBackups(backups);
    actions.setError(null);
  } catch (error) {
    console.error('[GF Dashboard] Failed to load configuration', error);
    actions.setError(error instanceof Error ? error.message : 'Failed to load configuration.');
  } finally {
    actions.setLoading(false);
  }
};
