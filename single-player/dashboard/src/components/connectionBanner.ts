import { actions, dashboardState, subscribe } from '../state';
import { checkHealth } from '../api';
import type { DashboardSubscriber } from '../types';

const bannerId = 'gf-connection-banner';

const ensureBanner = (): HTMLElement | null => {
  let banner = document.getElementById(bannerId);
  if (banner) {
    return banner;
  }

  const header = document.querySelector('.gf-header');
  if (!header) {
    return null;
  }

  banner = document.createElement('div');
  banner.id = bannerId;
  banner.className = 'gf-connection-banner';
  header.insertAdjacentElement('afterend', banner);
  return banner;
};

const renderBanner = (backendAvailable: boolean, lastSynced: string | null): void => {
  const banner = ensureBanner();
  if (!banner) {
    return;
  }

  if (backendAvailable) {
    banner.hidden = false;
    if (lastSynced) {
      const syncDate = new Date(lastSynced);
      const secondsAgo = Math.floor((Date.now() - syncDate.getTime()) / 1000);
      const syncText = secondsAgo < 60 
        ? `Synced ${secondsAgo}s ago` 
        : `Synced ${Math.floor(secondsAgo / 60)}m ago`;
      banner.className = 'gf-connection-banner gf-connection-banner--success';
      banner.textContent = `✓ Backend connected. ${syncText}`;
    } else {
      banner.className = 'gf-connection-banner gf-connection-banner--info';
      banner.textContent = 'Backend connected. Waiting for sync...';
    }
  } else {
    banner.hidden = false;
    banner.className = 'gf-connection-banner';
    banner.textContent = 'Backend unavailable. Operating in offline mode with local data only.';
  }
};

const updateBanner: DashboardSubscriber['notify'] = (snapshot) => {
  renderBanner(snapshot.connectivity.backendAvailable, snapshot.connectivity.lastSynced);
};

const checkBackend = async (): Promise<void> => {
  const available = await checkHealth().catch(() => false);
  actions.setConnectivity({ backendAvailable: available, lastChecked: new Date().toISOString() });
};

export const initializeConnectionBanner = (): void => {
  const subscriber: DashboardSubscriber = {
    id: 'connection-banner',
    notify: updateBanner,
  };
  subscribe(subscriber);

  checkBackend().catch((error) => {
    console.warn('[GF Dashboard] Backend availability check failed', error);
    actions.setConnectivity({ backendAvailable: false, lastChecked: new Date().toISOString() });
  });

  window.setInterval(() => {
    checkBackend().catch((error) => {
      console.warn('[GF Dashboard] Backend availability check failed', error);
    });
  }, 30000);
};

