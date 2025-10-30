import { actions, dashboardState, subscribe } from '../state';
import { fetchConfig } from '../api';
import { setCachedConfig } from '../cache';
import type { DashboardSubscriber } from '../types';

const SYNC_INTERVAL_MS = 30000; // 30 seconds
let syncTimer: number | null = null;
let lastSyncTime: number | null = null;

const clearTimer = (): void => {
  if (syncTimer !== null) {
    window.clearInterval(syncTimer);
    syncTimer = null;
  }
};

const performSync = async (): Promise<void> => {
  try {
    const config = await fetchConfig();
    const currentConfig = dashboardState.config;
    
    // Only update if config has changed and user doesn't have unsaved changes
    if (currentConfig && !dashboardState.hasUnsavedChanges) {
      const currentStr = JSON.stringify(currentConfig);
      const newStr = JSON.stringify(config);
      
      if (currentStr !== newStr) {
        actions.setConfig(config, false);
        setCachedConfig(config);
        lastSyncTime = Date.now();
        actions.setConnectivity({
          ...dashboardState.connectivity,
          lastSynced: new Date().toISOString(),
        });
      }
    } else if (!currentConfig) {
      // If no config loaded, set it
      actions.setConfig(config, false);
      setCachedConfig(config);
      lastSyncTime = Date.now();
      actions.setConnectivity({
        ...dashboardState.connectivity,
        lastSynced: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn('[GF Dashboard] Real-time sync failed', error);
  }
};

const startSync = (): void => {
  clearTimer();
  syncTimer = window.setInterval(performSync, SYNC_INTERVAL_MS);
  // Perform initial sync
  performSync();
};

const stopSync = (): void => {
  clearTimer();
};

const updateSyncState: DashboardSubscriber['notify'] = (snapshot) => {
  // Stop sync if user has unsaved changes to prevent overwriting
  if (snapshot.hasUnsavedChanges) {
    stopSync();
  } else if (!syncTimer) {
    startSync();
  }
};

export const initializeRealtimeSync = (): void => {
  const subscriber: DashboardSubscriber = {
    id: 'realtime-sync',
    notify: updateSyncState,
  };
  subscribe(subscriber);
  
  // Start sync if no unsaved changes
  if (!dashboardState.hasUnsavedChanges) {
    startSync();
  }
};

export const getLastSyncTime = (): number | null => lastSyncTime;

export const forceSync = async (): Promise<void> => {
  await performSync();
};

