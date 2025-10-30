import { actions, dashboardState, subscribe } from '../state';
import type { DashboardSubscriber } from '../types';

const containerId = 'configProgressIndicator';

const getContainer = (): HTMLElement | null => document.getElementById(containerId);

const render = (loading: boolean, progress?: string): void => {
  const container = getContainer();
  if (!container) {
    return;
  }

  if (!loading) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="gf-progress" role="status" aria-live="polite">
      <div class="gf-progress__bar">
        <div class="gf-progress__fill" style="animation: progress-indeterminate 1.5s ease-in-out infinite;"></div>
      </div>
      ${progress ? `<p class="gf-progress__text">${progress}</p>` : ''}
    </div>
  `;
};

const onState: DashboardSubscriber['notify'] = (snapshot) => {
  render(snapshot.loading);
};

export const initializeProgressIndicator = (): void => {
  const sub: DashboardSubscriber = { id: 'progress-indicator', notify: onState };
  subscribe(sub);
  render(dashboardState.loading);
};

