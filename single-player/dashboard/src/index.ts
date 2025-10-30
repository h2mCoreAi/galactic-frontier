import { actions, dashboardState, subscribe } from './state';
import { loadPersistedState } from './storage';
import { loadDashboardConfig } from './configLoader';
import { requestAuthentication, verifyAuthentication } from './api';
import { showToast } from './toast';
import { initializeConfigEditor } from './configEditor';
import { initializeBreadcrumbs } from './components/breadcrumbs';
import { initializeSettings } from './components/settings';
import { initializeOverview } from './components/overview';
import { initializeDocumentation } from './components/documentation';
import { initializeAutoRefresh } from './components/autoRefresh';
import { initializeConnectionBanner } from './components/connectionBanner';
import { initializeProgressIndicator } from './components/progressIndicator';
import { initializeRealtimeSync } from './components/realtimeSync';
import { initializeLivePreview } from './testing/livePreview';
import { initializeTelemetryPanel } from './testing/telemetryPanel';
import { initializeFPSMonitor } from './testing/fpsMonitor';
import { initializeScenarioControls } from './testing/scenarioControls';
import type { DashboardSubscriber, TabKey } from './types';
// Import all CSS files from main entry point
import './configEditor/styles.css';
import './testing/styles.css';

const TAB_TO_ELEMENT: Record<TabKey, string> = {
  overview: 'overviewTab',
  config: 'configTab',
  testing: 'testingTab',
  documentation: 'documentationTab',
  settings: 'settingsTab',
};

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  config: 'Configuration Editor',
  testing: 'Testing Tools',
  documentation: 'Documentation',
  settings: 'Settings',
};

const NAV_BUTTON_SELECTOR = '[data-tab]';

const getNavButtons = (): HTMLButtonElement[] => Array.from(
  document.querySelectorAll<HTMLButtonElement>(`.gf-nav ${NAV_BUTTON_SELECTOR}`),
);

const applyTheme = (theme: 'light' | 'dark'): void => {
  document.documentElement.dataset.theme = theme;
};

const setActiveTab = (tab: TabKey): void => {
  Object.entries(TAB_TO_ELEMENT).forEach(([key, elementId]) => {
    const section = document.getElementById(elementId);
    if (!section) {
      return;
    }
    const isActive = key === tab;
    section.hidden = !isActive;
  });

  getNavButtons().forEach((button) => {
    const isActive = button.dataset.tab === tab;
    button.classList.toggle('gf-nav__item--active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  const primary = TAB_LABELS[tab];
  actions.setBreadcrumbs({ primary, secondary: undefined });
};

const handleNavClick = (event: Event): void => {
  const target = event.target as HTMLButtonElement | null;
  if (!target || !target.matches(NAV_BUTTON_SELECTOR)) {
    return;
  }
  const tab = target.dataset.tab as TabKey | undefined;
  if (!tab) {
    return;
  }
  actions.setTab(tab);
};

const handleThemeToggle = (): void => {
  const nextTheme = dashboardState.theme === 'dark' ? 'light' : 'dark';
  actions.setTheme(nextTheme);
};

const handleAuthClick = async (): Promise<void> => {
  const authenticated = await verifyAuthentication();
  if (!authenticated) {
    showToast({ title: 'Redirecting to Discord', message: 'Complete authentication to manage configuration.', variant: 'info' });
    requestAuthentication();
  } else {
    showToast({ title: 'Already authenticated', variant: 'success' });
  }
};

const handleRefreshClick = async (): Promise<void> => {
  await loadDashboardConfig();
  if (dashboardState.error) {
    showToast({ title: 'Failed to reload configuration', message: dashboardState.error, variant: 'error' });
  } else {
    showToast({ title: 'Configuration reloaded', variant: 'success' });
  }
};

const hydrateSidebarSession = (): void => {
  const statusElement = document.getElementById('sessionStatus');
  if (statusElement) {
    statusElement.textContent = dashboardState.authenticated ? 'Authenticated' : 'Not authenticated';
  }
};

const hydrateSaveButton = (): void => {
  const saveButton = document.getElementById('saveConfig') as HTMLButtonElement | null;
  if (!saveButton) {
    return;
  }
  saveButton.disabled = !dashboardState.hasUnsavedChanges;
  saveButton.textContent = dashboardState.hasUnsavedChanges ? 'Save Changes*' : 'Save Changes';
};

const setupEventListeners = (): void => {
  const nav = document.querySelector('.gf-nav');
  nav?.addEventListener('click', handleNavClick);

  const themeToggle = document.getElementById('themeToggle');
  themeToggle?.addEventListener('click', handleThemeToggle);

  const authButton = document.getElementById('authButton');
  authButton?.addEventListener('click', handleAuthClick);

  const refreshButton = document.getElementById('refreshConfig');
  refreshButton?.addEventListener('click', handleRefreshClick);
};

const updateFromState: DashboardSubscriber['notify'] = (snapshot) => {
  applyTheme(snapshot.theme);
  setActiveTab(snapshot.tab);
  applyHashRouting(snapshot.tab);
  hydrateSidebarSession();
  hydrateSaveButton();

  if (snapshot.error) {
    showToast({ title: 'Error', message: snapshot.error, variant: 'error' });
  }
};

const bootstrapAuthentication = async (): Promise<void> => {
  const authenticated = await verifyAuthentication();
  actions.setAuthentication(authenticated);
};

const applyHashRouting = (tab: TabKey): void => {
  const desiredHash = `#${tab}`;
  if (window.location.hash !== desiredHash) {
    window.history.replaceState(null, '', desiredHash);
  }
};

const resolveTabFromHash = (): TabKey | undefined => {
  const hash = window.location.hash.replace('#', '').trim();
  if (!hash) {
    return undefined;
  }
  return Object.keys(TAB_TO_ELEMENT).includes(hash) ? (hash as TabKey) : undefined;
};

const handleHashChange = (): void => {
  const tab = resolveTabFromHash();
  if (tab) {
    actions.setTab(tab);
  }
};

const initialize = (): void => {
  console.log('[GF Dashboard] Initializing...');
  
  const persisted = loadPersistedState();
  const initialTab = resolveTabFromHash() ?? persisted.tab;
  applyTheme(persisted.theme);
  setActiveTab(initialTab);
  applyHashRouting(initialTab);
  setupEventListeners();

  const subscriber: DashboardSubscriber = {
    id: 'dashboard-bootstrap',
    notify: updateFromState,
  };
  subscribe(subscriber);

  window.addEventListener('hashchange', handleHashChange);

  // Delay auth check to avoid immediate rate limiting
  window.setTimeout(() => {
    bootstrapAuthentication().catch((error) => {
      console.warn('[GF Dashboard] Failed to initialize authentication', error);
    });
  }, 500);

  // Delay config load slightly to avoid immediate rate limiting  
  window.setTimeout(() => {
    loadDashboardConfig().catch((error) => {
      console.error('[GF Dashboard] Initial config load failed', error);
    });
  }, 1000);

  // Re-enabling features incrementally - TEST ONE AT A TIME
  initializeOverview();
  initializeDocumentation();
  initializeConfigEditor();
  initializeBreadcrumbs();
  initializeSettings();
  initializeProgressIndicator();
  
  // Core features enabled
  initializeTelemetryPanel();
  initializeOverview();
  initializeDocumentation();
  
  // Re-enabling features with guards in place
  initializeAutoRefresh();
  initializeConnectionBanner();
  
  // Testing tools - enable incrementally
  initializeLivePreview();
  initializeFPSMonitor();
  initializeScenarioControls();
  
  // Real-time sync - enable last as it can cause loops if not careful
  initializeRealtimeSync();
};

document.addEventListener('DOMContentLoaded', initialize);
