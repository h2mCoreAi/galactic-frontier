import { dashboardState, subscribe } from '../state';
import type { DashboardBreadcrumbs, DashboardSubscriber } from '../types';

const containerId = 'gf-breadcrumbs';

const ensureContainer = (): HTMLElement | null => {
  const container = document.getElementById(containerId);
  if (container) {
    return container;
  }
  const header = document.querySelector('.gf-header__branding');
  if (!header) {
    return null;
  }

  const wrapper = document.createElement('div');
  wrapper.id = containerId;
  wrapper.className = 'gf-breadcrumbs';
  header.appendChild(wrapper);
  return wrapper;
};

const renderBreadcrumbs = (breadcrumbs: DashboardBreadcrumbs): void => {
  const container = ensureContainer();
  if (!container) {
    return;
  }

  container.innerHTML = '';
  const primary = document.createElement('span');
  primary.className = 'gf-breadcrumbs__item gf-breadcrumbs__item--primary';
  primary.textContent = breadcrumbs.primary;
  container.appendChild(primary);

  if (breadcrumbs.secondary) {
    const divider = document.createElement('span');
    divider.className = 'gf-breadcrumbs__divider';
    divider.textContent = '›';
    container.appendChild(divider);

    const secondary = document.createElement('span');
    secondary.className = 'gf-breadcrumbs__item';
    secondary.textContent = breadcrumbs.secondary;
    container.appendChild(secondary);
  }
};

const updateBreadcrumbs: DashboardSubscriber['notify'] = (snapshot) => {
  renderBreadcrumbs(snapshot.breadcrumbs);
};

export const initializeBreadcrumbs = (): void => {
  const subscriber: DashboardSubscriber = {
    id: 'dashboard-breadcrumbs',
    notify: updateBreadcrumbs,
  };
  subscribe(subscriber);
  renderBreadcrumbs(dashboardState.breadcrumbs);
};

