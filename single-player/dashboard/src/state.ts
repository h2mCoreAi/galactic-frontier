import { loadPersistedState, persistState } from './storage';
import type {
  DashboardActions,
  DashboardStateSnapshot,
  DashboardSubscriber,
  GalacticFrontierConfig,
  TabKey,
} from './types';

const createSnapshot = (): DashboardStateSnapshot => {
  const persisted = loadPersistedState();

  return {
    tab: persisted.tab,
    theme: persisted.theme,
    preferences: persisted.preferences ?? {
      defaultTab: 'overview',
      autoRefreshInterval: 0,
    },
    breadcrumbs: {
      primary: 'Overview',
    },
    connectivity: {
      backendAvailable: true,
      lastChecked: null,
    },
    config: null,
    originalConfig: null,
    backups: [],
    metrics: null,
    authenticated: false,
    loading: false,
    error: null,
    lastSavedAt: persisted.lastSavedAt,
    hasUnsavedChanges: false,
  };
};

const snapshot: DashboardStateSnapshot = createSnapshot();
const subscribers: DashboardSubscriber[] = [];

const notifySubscribers = (): void => {
  persistState(snapshot);
  subscribers.forEach((subscriber) => {
    try {
      subscriber.notify(snapshot);
    } catch (error) {
      console.error('[GF Dashboard] Subscriber notification failed', error);
    }
  });
};

const updateTab = (tab: TabKey): void => {
  if (snapshot.tab === tab) {
    return;
  }
  snapshot.tab = tab;
  notifySubscribers();
};

const updateTheme = (theme: 'light' | 'dark'): void => {
  if (snapshot.theme === theme) {
    return;
  }
  snapshot.theme = theme;
  notifySubscribers();
};

const updatePreferences: DashboardActions['updatePreferences'] = (preferences) => {
  snapshot.preferences = {
    ...snapshot.preferences,
    ...preferences,
  };
  notifySubscribers();
};

const updateBreadcrumbs: DashboardActions['setBreadcrumbs'] = (breadcrumbs) => {
  snapshot.breadcrumbs = {
    ...snapshot.breadcrumbs,
    ...breadcrumbs,
  };
  notifySubscribers();
};

const updateConnectivity: DashboardActions['setConnectivity'] = (connectivity) => {
  snapshot.connectivity = {
    ...snapshot.connectivity,
    ...connectivity,
  };
  notifySubscribers();
};

const updateConfig = (config: GalacticFrontierConfig, markDirty = true): void => {
  snapshot.config = structuredClone(config);
  if (!snapshot.originalConfig) {
    snapshot.originalConfig = structuredClone(config);
    snapshot.hasUnsavedChanges = false;
  } else {
    snapshot.hasUnsavedChanges = markDirty && JSON.stringify(snapshot.originalConfig) !== JSON.stringify(snapshot.config);
  }
  notifySubscribers();
};

const markSaved = (): void => {
  if (!snapshot.config) {
    return;
  }
  snapshot.originalConfig = structuredClone(snapshot.config);
  snapshot.hasUnsavedChanges = false;
  snapshot.lastSavedAt = new Date().toISOString();
  notifySubscribers();
};

const updateBackups: DashboardActions['setBackups'] = (backups) => {
  snapshot.backups = [...backups];
  notifySubscribers();
};

const updateMetrics: DashboardActions['setMetrics'] = (metrics) => {
  snapshot.metrics = metrics ? { ...metrics } : null;
  notifySubscribers();
};

const updateAuthentication: DashboardActions['setAuthentication'] = (authenticated) => {
  snapshot.authenticated = authenticated;
  notifySubscribers();
};

const updateLoading: DashboardActions['setLoading'] = (loading) => {
  snapshot.loading = loading;
  notifySubscribers();
};

const updateError: DashboardActions['setError'] = (error) => {
  snapshot.error = error;
  notifySubscribers();
};

export const dashboardState: DashboardStateSnapshot = snapshot;

export const actions: DashboardActions = {
  setTab: updateTab,
  setTheme: updateTheme,
  updatePreferences,
  setBreadcrumbs: updateBreadcrumbs,
  setConnectivity: updateConnectivity,
  setConfig: updateConfig,
  markSaved,
  setBackups: updateBackups,
  setMetrics: updateMetrics,
  setAuthentication: updateAuthentication,
  setLoading: updateLoading,
  setError: updateError,
};

export const subscribe = (subscriber: DashboardSubscriber): (() => void) => {
  subscribers.push(subscriber);
  subscriber.notify(snapshot);

  return () => {
    const index = subscribers.findIndex((item) => item.id === subscriber.id);
    if (index >= 0) {
      subscribers.splice(index, 1);
    }
  };
};
