import { actions, dashboardState, subscribe } from '../state';
import type { DashboardPreferences, DashboardSubscriber } from '../types';

const containerId = 'settingsView';

const getContainer = (): HTMLElement | null => document.getElementById(containerId);

const createSettingsForm = (preferences: DashboardPreferences): HTMLElement | null => {
  const container = getContainer();
  if (!container) {
    return null;
  }

  container.innerHTML = `
    <form id="dashboardSettingsForm" class="gf-settings__form">
      <div class="gf-form__row">
        <label class="gf-form__field gf-form__field--compact">
          <span>Default Tab</span>
          <select id="prefDefaultTab" name="defaultTab">
            <option value="overview">Overview</option>
            <option value="config">Configuration Editor</option>
            <option value="testing">Testing Tools</option>
            <option value="documentation">Documentation</option>
            <option value="settings">Settings</option>
          </select>
        </label>
        <label class="gf-form__field gf-form__field--compact">
          <span>Auto Refresh (seconds, 0 = off)</span>
          <input id="prefAutoRefresh" name="autoRefreshInterval" type="number" min="0" step="5" />
        </label>
      </div>
      <div class="gf-form__actions">
        <button type="submit" class="gf-button gf-button--primary">Save Preferences</button>
      </div>
    </form>
  `;

  const select = container.querySelector<HTMLSelectElement>('#prefDefaultTab');
  const refreshInput = container.querySelector<HTMLInputElement>('#prefAutoRefresh');
  if (select) {
    select.value = preferences.defaultTab;
  }
  if (refreshInput) {
    refreshInput.value = String(preferences.autoRefreshInterval);
  }

  return container;
};

const handleSubmit = (event: Event): void => {
  event.preventDefault();
  const container = getContainer();
  if (!container) {
    return;
  }

  const select = container.querySelector<HTMLSelectElement>('#prefDefaultTab');
  const refreshInput = container.querySelector<HTMLInputElement>('#prefAutoRefresh');
  if (!select || !refreshInput) {
    return;
  }

  const autoRefreshInterval = Number(refreshInput.value);
  actions.updatePreferences({
    defaultTab: select.value as DashboardPreferences['defaultTab'],
    autoRefreshInterval: Number.isNaN(autoRefreshInterval) ? 0 : Math.max(0, autoRefreshInterval),
  });
};

const updateSettings: DashboardSubscriber['notify'] = (snapshot) => {
  const form = createSettingsForm(snapshot.preferences);
  const formElement = form?.querySelector<HTMLFormElement>('#dashboardSettingsForm');
  formElement?.addEventListener('submit', handleSubmit);
};

export const initializeSettings = (): void => {
  const subscriber: DashboardSubscriber = {
    id: 'dashboard-settings',
    notify: updateSettings,
  };
  subscribe(subscriber);
  updateSettings(dashboardState);
};

