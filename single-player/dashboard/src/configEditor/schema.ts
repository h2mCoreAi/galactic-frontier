import type { ConfigSchemaVersion, GalacticFrontierConfig } from '../types';

const SCHEMAS: ConfigSchemaVersion[] = [
  {
    version: '1.0.0',
    schema: {
      type: 'object',
      required: ['ship', 'projectiles', 'enemies', 'game'],
      properties: {
        version: { type: 'string' },
        ship: {
          type: 'object',
          required: ['maxSpeed', 'thrust', 'afterburnerMax', 'afterburnerDepleteRate', 'afterburnerRegenRate', 'maxHealth', 'size'],
          properties: {
            maxSpeed: { type: 'number' },
            thrust: { type: 'number' },
            afterburnerBoost: { type: 'number' },
            afterburnerMax: { type: 'number' },
            afterburnerDepleteRate: { type: 'number' },
            afterburnerRegenRate: { type: 'number' },
            maxHealth: { type: 'number' },
            size: { type: 'number' },
          },
        },
        projectiles: {
          type: 'object',
          required: ['speed', 'life', 'cooldown', 'fanShotCount', 'fanShotAngle'],
          properties: {
            speed: { type: 'number' },
            life: { type: 'number' },
            fanShotCount: { type: 'number' },
            fanShotAngle: { type: 'number' },
            cooldown: { type: 'number' },
          },
        },
        enemies: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['type', 'size', 'speed', 'points', 'shootInterval', 'projectileDamage', 'collisionDamage'],
            properties: {
              type: { type: 'string' },
              size: { type: 'number' },
              speed: { type: 'number' },
              points: { type: 'number' },
              shootInterval: { type: 'number' },
              projectileDamage: { type: 'number' },
              collisionDamage: { type: 'number' },
            },
          },
        },
        game: {
          type: 'object',
          required: ['scoreToLevelUp', 'minSpawnInterval', 'maxSpawnInterval', 'minHealthSpawnInterval', 'maxHealthSpawnInterval', 'minFanShotSpawnInterval', 'maxFanShotSpawnInterval', 'healthPowerUpValue', 'fanShotDuration'],
          properties: {
            scoreToLevelUp: { type: 'number' },
            minSpawnInterval: { type: 'number' },
            maxSpawnInterval: { type: 'number' },
            minHealthSpawnInterval: { type: 'number' },
            maxHealthSpawnInterval: { type: 'number' },
            minFanShotSpawnInterval: { type: 'number' },
            maxFanShotSpawnInterval: { type: 'number' },
            healthPowerUpValue: { type: 'number' },
            fanShotDuration: { type: 'number' },
          },
        },
      },
    },
  },
];

const getSchemaByVersion = (version?: string): ConfigSchemaVersion => {
  if (version) {
    const match = SCHEMAS.find((schema) => schema.version === version);
    if (match) {
      return match;
    }
  }
  return SCHEMAS[0];
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const validateAgainstSchema = (config: unknown, schemaNode: unknown, path: string[] = []): string[] => {
  if (!isObject(schemaNode)) {
    return [];
  }

  const errors: string[] = [];
  const { type, required, properties, items, minItems } = schemaNode as Record<string, unknown>;

  if (type === 'object') {
    if (!isObject(config)) {
      errors.push(`${path.join('.')} expected object`);
      return errors;
    }
    if (Array.isArray(required)) {
      required.forEach((key) => {
        if (!(key in config)) {
          errors.push(`${[...path, key].join('.')} is required`);
        }
      });
    }
    if (isObject(properties)) {
      Object.entries(properties).forEach(([key, childSchema]) => {
        if (key in config) {
          errors.push(...validateAgainstSchema((config as Record<string, unknown>)[key], childSchema, [...path, key]));
        }
      });
    }
  } else if (type === 'array') {
    if (!Array.isArray(config)) {
      errors.push(`${path.join('.')} expected array`);
      return errors;
    }
    if (typeof minItems === 'number' && config.length < minItems) {
      errors.push(`${path.join('.')} requires at least ${minItems} items`);
    }
    if (items) {
      config.forEach((value, index) => {
        errors.push(...validateAgainstSchema(value, items, [...path, index.toString()]));
      });
    }
  } else if (type === 'number') {
    if (typeof config !== 'number' || Number.isNaN(config)) {
      errors.push(`${path.join('.')} expected number`);
    }
  } else if (type === 'string') {
    if (typeof config !== 'string') {
      errors.push(`${path.join('.')} expected string`);
    }
  }

  return errors;
};

export const validateConfigSchema = (config: GalacticFrontierConfig): string[] => {
  const schema = getSchemaByVersion(config.version);
  return validateAgainstSchema(config, schema.schema);
};

export const migrateConfig = (config: GalacticFrontierConfig): GalacticFrontierConfig => ({
  ...config,
  version: SCHEMAS[0].version,
});

