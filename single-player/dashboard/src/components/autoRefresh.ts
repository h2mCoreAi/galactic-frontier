import { subscribe } from '../state';
import { loadDashboardConfig } from '../configLoader';
import { showToast } from '../toast';
import type { DashboardSubscriber } from '../types';

let refreshTimer: number | null = null;

const clearTimer = (): void => {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

const scheduleRefresh = (intervalSeconds: number): void => {
  clearTimer();
  if (intervalSeconds <= 0) {
    return;
  }
  refreshTimer = window.setInterval(async () => {
    await loadDashboardConfig();
    showToast({ title: 'Auto refreshed configuration', variant: 'info', durationMs: 2500 });
  }, intervalSeconds * 1000);
};

const updateAutoRefresh: DashboardSubscriber['notify'] = (snapshot) => {
  scheduleRefresh(snapshot.preferences.autoRefreshInterval);
};

export const initializeAutoRefresh = (): void => {
  const subscriber: DashboardSubscriber = {
    id: 'dashboard-auto-refresh',
    notify: updateAutoRefresh,
  };
  subscribe(subscriber);
};

