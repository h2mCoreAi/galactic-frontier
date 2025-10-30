import { loadPersistedState, persistState } from './storage';
import type {
  DashboardActions,
  DashboardStateSnapshot,
  DashboardSubscriber,
  GalacticFrontierConfig,
  TabKey,
} from './types';

type MutableSnapshot = {
  -readonly [K in keyof DashboardStateSnapshot]: DashboardStateSnapshot[K];
};

const createSnapshot = (): MutableSnapshot => {
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
      lastSynced: null,
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

const snapshot: MutableSnapshot = createSnapshot();
const subscribers: DashboardSubscriber[] = [];

let isNotifying = false; // Prevent recursive notifications

const notifySubscribers = (): void => {
  // Prevent recursive notification loops
  if (isNotifying) {
    console.warn('[GF Dashboard] Notification already in progress, skipping to prevent loop');
    return;
  }
  
  try {
    isNotifying = true;
    persistState(snapshot);
    subscribers.forEach((subscriber) => {
      try {
        subscriber.notify(snapshot);
      } catch (error) {
        console.error(`[GF Dashboard] Subscriber ${subscriber.id} notification failed:`, error);
      }
    });
  } finally {
    isNotifying = false;
  }
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
  // Check if anything actually changed before notifying
  const oldConn = snapshot.connectivity;
  const newConn = {
    ...oldConn,
    ...connectivity,
  };
  
  // Only notify if something actually changed
  if (
    oldConn.backendAvailable !== newConn.backendAvailable ||
    oldConn.lastChecked !== newConn.lastChecked ||
    oldConn.lastSynced !== newConn.lastSynced
  ) {
    snapshot.connectivity = newConn;
    notifySubscribers();
  }
};

let lastConfigHash: string | null = null;

const updateConfig = (config: GalacticFrontierConfig, markDirty = true): void => {
  // Prevent redundant updates by comparing config hash
  const configHash = JSON.stringify(config);
  if (lastConfigHash === configHash && snapshot.config !== null) {
    return; // Config hasn't changed, skip update
  }
  lastConfigHash = configHash;
  
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
  // Only update if metrics actually changed (compare timestamps)
  const currentTimestamp = snapshot.metrics?.timestamp;
  const newTimestamp = metrics?.timestamp;
  
  if (currentTimestamp !== newTimestamp) {
    snapshot.metrics = metrics ? { ...metrics } : null;
    notifySubscribers();
  }
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
