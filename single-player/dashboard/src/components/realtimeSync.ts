import { actions, dashboardState, subscribe } from '../state';
import { fetchConfig } from '../api';
import { setCachedConfig } from '../cache';
import type { DashboardSubscriber } from '../types';

const SYNC_INTERVAL_MS = 60000; // 60 seconds - increased to reduce rate limiting
let syncTimer: number | null = null;
let lastSyncTime: number | null = null;

const clearTimer = (): void => {
  if (syncTimer !== null) {
    window.clearInterval(syncTimer);
    syncTimer = null;
  }
};

let isSyncing = false; // Prevent concurrent syncs
let lastSyncError: number | null = null;
const SYNC_ERROR_BACKOFF_MS = 300000; // 5 minutes backoff after rate limit error

const performSync = async (): Promise<void> => {
  // Prevent concurrent sync operations
  if (isSyncing) {
    return;
  }
  
  // If we hit a rate limit recently, wait longer before retrying
  if (lastSyncError && Date.now() - lastSyncError < SYNC_ERROR_BACKOFF_MS) {
    return;
  }
  
  try {
    isSyncing = true;
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
        lastSyncError = null; // Reset error on success
        // Only update connectivity if lastSynced actually changed to prevent loops
        const newLastSynced = new Date().toISOString();
        if (dashboardState.connectivity.lastSynced !== newLastSynced) {
          actions.setConnectivity({
            ...dashboardState.connectivity,
            lastSynced: newLastSynced,
          });
        }
      }
    } else if (!currentConfig) {
      // If no config loaded, set it
      actions.setConfig(config, false);
      setCachedConfig(config);
      lastSyncTime = Date.now();
      lastSyncError = null; // Reset error on success
      const newLastSynced = new Date().toISOString();
      if (dashboardState.connectivity.lastSynced !== newLastSynced) {
        actions.setConnectivity({
          ...dashboardState.connectivity,
          lastSynced: newLastSynced,
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Only log if it's not a rate limit error to avoid spam
    if (!errorMessage.includes('429') && !errorMessage.includes('Too Many Requests')) {
      console.warn('[GF Dashboard] Real-time sync failed', error);
    }
    
    // Track rate limit errors for backoff
    if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      lastSyncError = Date.now();
    }
    // Don't update lastSyncTime on error to prevent false positives
  } finally {
    isSyncing = false;
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

let lastUnsavedChanges = false;

const updateSyncState: DashboardSubscriber['notify'] = (snapshot) => {
  // Only react to changes in hasUnsavedChanges to prevent unnecessary checks
  if (snapshot.hasUnsavedChanges !== lastUnsavedChanges) {
    lastUnsavedChanges = snapshot.hasUnsavedChanges;
    
    // Stop sync if user has unsaved changes to prevent overwriting
    if (snapshot.hasUnsavedChanges) {
      stopSync();
    } else if (!syncTimer) {
      startSync();
    }
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

