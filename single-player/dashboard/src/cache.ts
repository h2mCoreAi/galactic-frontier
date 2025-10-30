import type { GalacticFrontierConfig } from './types';

const CONFIG_CACHE_KEY = 'gf_config_cache_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedConfig {
  config: GalacticFrontierConfig;
  timestamp: number;
  version: string;
}

export const getCachedConfig = (): GalacticFrontierConfig | null => {
  try {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as CachedConfig;
    const age = Date.now() - parsed.timestamp;

    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(CONFIG_CACHE_KEY);
      return null;
    }

    return parsed.config;
  } catch (error) {
    console.warn('[GF Dashboard] Failed to read config cache', error);
    return null;
  }
};

export const setCachedConfig = (config: GalacticFrontierConfig): void => {
  try {
    const cached: CachedConfig = {
      config,
      timestamp: Date.now(),
      version: config.version || 'unknown',
    };
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.warn('[GF Dashboard] Failed to cache config', error);
  }
};

export const invalidateConfigCache = (): void => {
  try {
    localStorage.removeItem(CONFIG_CACHE_KEY);
  } catch (error) {
    console.warn('[GF Dashboard] Failed to invalidate config cache', error);
  }
};

export const isCacheValid = (expectedVersion?: string): boolean => {
  try {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
    if (!cached) {
      return false;
    }

    const parsed = JSON.parse(cached) as CachedConfig;
    const age = Date.now() - parsed.timestamp;

    if (age > CACHE_TTL_MS) {
      return false;
    }

    if (expectedVersion && parsed.version !== expectedVersion) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

