import { dashboardState, subscribe } from '../state';
import type { DashboardSubscriber } from '../types';

const containerId = 'overviewSummary';

const renderOverview = (): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  const config = dashboardState.config;
  const metrics = dashboardState.metrics;
  const backups = dashboardState.backups;
  const error = dashboardState.error;
  const loading = dashboardState.loading;

  if (loading) {
    container.innerHTML = '<p>Loading dashboard...</p>';
    return;
  }

  if (error) {
    container.innerHTML = `
      <div class="gf-overview__error">
        <h3>Error</h3>
        <p>${error}</p>
      </div>
    `;
    return;
  }

  if (!config) {
    container.innerHTML = `
      <div class="gf-overview__empty">
        <h3>No Configuration Loaded</h3>
        <p>Configuration will be loaded automatically, or you can upload a config file.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="gf-overview__grid">
      <div class="gf-overview__card">
        <h3>Configuration Status</h3>
        <div class="gf-overview__stat">
          <span class="gf-overview__label">Version:</span>
          <span class="gf-overview__value">${config.version || '1.0.0'}</span>
        </div>
        <div class="gf-overview__stat">
          <span class="gf-overview__label">Last Saved:</span>
          <span class="gf-overview__value">${dashboardState.lastSavedAt ? new Date(dashboardState.lastSavedAt).toLocaleString() : 'Never'}</span>
        </div>
        <div class="gf-overview__stat">
          <span class="gf-overview__label">Unsaved Changes:</span>
          <span class="gf-overview__value">${dashboardState.hasUnsavedChanges ? 'Yes' : 'No'}</span>
        </div>
      </div>
      
      <div class="gf-overview__card">
        <h3>Game Configuration</h3>
        <div class="gf-overview__stat">
          <span class="gf-overview__label">Ship Max Speed:</span>
          <span class="gf-overview__value">${config.ship.maxSpeed}</span>
        </div>
        <div class="gf-overview__stat">
          <span class="gf-overview__label">Ship Max Health:</span>
          <span class="gf-overview__value">${config.ship.maxHealth}</span>
        </div>
        <div class="gf-overview__stat">
          <span class="gf-overview__label">Enemy Types:</span>
          <span class="gf-overview__value">${config.enemies.length}</span>
        </div>
        <div class="gf-overview__stat">
          <span class="gf-overview__label">Projectile Speed:</span>
          <span class="gf-overview__value">${config.projectiles.speed}</span>
        </div>
      </div>
      
      <div class="gf-overview__card">
        <h3>Backups</h3>
        <div class="gf-overview__stat">
          <span class="gf-overview__label">Total Backups:</span>
          <span class="gf-overview__value">${backups.length}</span>
        </div>
        ${backups.length > 0 ? `
          <div class="gf-overview__stat">
            <span class="gf-overview__label">Latest Backup:</span>
            <span class="gf-overview__value">${new Date(backups[0].createdAt).toLocaleString()}</span>
          </div>
        ` : ''}
      </div>
      
      ${metrics ? `
        <div class="gf-overview__card">
          <h3>Live Metrics</h3>
          <div class="gf-overview__stat">
            <span class="gf-overview__label">FPS:</span>
            <span class="gf-overview__value">${metrics.fps}</span>
          </div>
          <div class="gf-overview__stat">
            <span class="gf-overview__label">Enemies:</span>
            <span class="gf-overview__value">${metrics.enemies}</span>
          </div>
          <div class="gf-overview__stat">
            <span class="gf-overview__label">Projectiles:</span>
            <span class="gf-overview__value">${metrics.projectiles}</span>
          </div>
          <div class="gf-overview__stat">
            <span class="gf-overview__label">Score:</span>
            <span class="gf-overview__value">${metrics.score.toLocaleString()}</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

const updateOverview: DashboardSubscriber['notify'] = (snapshot) => {
  renderOverview();
};

export const initializeOverview = (): void => {
  const subscriber: DashboardSubscriber = {
    id: 'overview',
    notify: updateOverview,
  };
  subscribe(subscriber);
  renderOverview();
};

