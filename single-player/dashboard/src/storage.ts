import type { DashboardPreferences, DashboardStateSnapshot, TabKey } from './types';

const STORAGE_KEY = 'gf_dashboard_state_v1';

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as T;
    return parsed;
  } catch (error) {
    console.warn('[GF Dashboard] Failed to parse storage payload', error);
    return fallback;
  }
};

export interface PersistedState {
  readonly tab: TabKey;
  readonly theme: 'light' | 'dark';
  readonly lastSavedAt: string | null;
  readonly preferences?: DashboardPreferences;
}

const DEFAULT_PERSISTED_STATE: PersistedState = {
  tab: 'overview',
  theme: 'dark',
  lastSavedAt: null,
  preferences: {
    defaultTab: 'overview',
    autoRefreshInterval: 0,
  },
};

export const loadPersistedState = (): PersistedState => safeParse(
  localStorage.getItem(STORAGE_KEY),
  DEFAULT_PERSISTED_STATE,
);

export const persistState = (snapshot: DashboardStateSnapshot): void => {
  const payload: PersistedState = {
    tab: snapshot.tab,
    theme: snapshot.theme,
    lastSavedAt: snapshot.lastSavedAt,
    preferences: snapshot.preferences,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[GF Dashboard] Failed to persist state', error);
  }
};
