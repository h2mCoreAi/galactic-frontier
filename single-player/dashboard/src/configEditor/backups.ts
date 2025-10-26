import { actions, dashboardState, subscribe } from '../state';
import { fetchBackups, restoreBackup } from '../api';
import { showToast } from '../toast';
import type { DashboardBackup, DashboardSubscriber } from '../types';

const listElement = (): HTMLElement | null => document.getElementById('backupList');
const revertButton = (): HTMLButtonElement | null => document.getElementById('revertConfig') as HTMLButtonElement | null;
const downloadButton = (): HTMLButtonElement | null => document.getElementById('downloadConfig') as HTMLButtonElement | null;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const renderBackups = (backups: DashboardBackup[]): void => {
  const container = listElement();
  if (!container) {
    return;
  }

  if (backups.length === 0) {
    container.innerHTML = '<li>No backups available yet.</li>';
    return;
  }

  container.innerHTML = '';
  backups.forEach((backup) => {
    const item = document.createElement('li');
    item.className = 'gf-backup-item';
    const date = new Date(backup.createdAt);
    item.innerHTML = `
      <div class="gf-backup-item__meta">
        <span class="gf-backup-item__time">${date.toLocaleString()}</span>
        <span class="gf-backup-item__size">${formatBytes(backup.size)}</span>
      </div>
      <div class="gf-backup-item__actions">
        <button type="button" class="gf-button gf-button--secondary" data-backup="${backup.id}" data-action="restore">Restore</button>
        <button type="button" class="gf-button" data-backup="${backup.id}" data-action="download">Download</button>
      </div>
    `;
    container.appendChild(item);
  });
};

const handleListClick = async (event: Event): Promise<void> => {
  const target = event.target as HTMLButtonElement | null;
  if (!target || !target.dataset.backup) {
    return;
  }
  const { backup, action } = target.dataset;
  if (!backup || !action) {
    return;
  }

  if (action === 'restore') {
    try {
      actions.setLoading(true);
      const restoredConfig = await restoreBackup(backup);
      actions.setConfig(restoredConfig, false);
      actions.markSaved();
      showToast({ title: 'Backup restored', message: `Backup ${backup} applied.`, variant: 'info' });
    } catch (error) {
      console.error('[GF Dashboard] Restore failed', error);
      showToast({ title: 'Restore failed', message: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
    } finally {
      actions.setLoading(false);
    }
  } else if (action === 'download') {
    window.open(`/api/config/backups/${backup}/restore?download=1`, '_blank');
  }
};

const updateBackups: DashboardSubscriber['notify'] = (snapshot) => {
  renderBackups(snapshot.backups);
};

const refreshBackups = async (): Promise<void> => {
  try {
    actions.setLoading(true);
    const response = await fetchBackups();
    actions.setBackups(response);
  } catch (error) {
    console.error('[GF Dashboard] Failed to fetch backups', error);
  } finally {
    actions.setLoading(false);
  }
};

const downloadCurrent = (): void => {
  const config = dashboardState.config;
  if (!config) {
    showToast({ title: 'Download failed', message: 'No configuration loaded.', variant: 'error' });
    return;
  }
  const blob = new Blob([`${JSON.stringify(config, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `config-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const initializeBackupControls = (): void => {
  const container = listElement();
  container?.addEventListener('click', handleListClick);
  revertButton()?.addEventListener('click', refreshBackups);
  downloadButton()?.addEventListener('click', downloadCurrent);

  const subscriber: DashboardSubscriber = {
    id: 'config-backups',
    notify: updateBackups,
  };
  subscribe(subscriber);

  refreshBackups().catch((error) => {
    console.error('[GF Dashboard] Initial backup load failed', error);
  });
};
