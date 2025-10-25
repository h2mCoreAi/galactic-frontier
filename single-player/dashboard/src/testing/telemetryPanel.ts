import { dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, DashboardMetrics } from '../types';

const containerId = 'metricsPanel';

const formatValue = (value: number, decimals = 0): string => value.toFixed(decimals);

const renderMetrics = (metrics: DashboardMetrics | null): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  if (!metrics) {
    container.innerHTML = '<p>No telemetry yet. Interact with the preview to begin streaming data.</p>';
    return;
  }

  container.innerHTML = `
    <div class="gf-metrics__grid">
      <div class="gf-metrics__item">
        <span class="gf-metrics__label">FPS</span>
        <span class="gf-metrics__value">${formatValue(metrics.fps, 0)}</span>
      </div>
      <div class="gf-metrics__item">
        <span class="gf-metrics__label">Enemies</span>
        <span class="gf-metrics__value">${metrics.enemies}</span>
      </div>
      <div class="gf-metrics__item">
        <span class="gf-metrics__label">Projectiles</span>
        <span class="gf-metrics__value">${metrics.projectiles}</span>
      </div>
      <div class="gf-metrics__item">
        <span class="gf-metrics__label">Score</span>
        <span class="gf-metrics__value">${metrics.score}</span>
      </div>
      <div class="gf-metrics__item">
        <span class="gf-metrics__label">Level</span>
        <span class="gf-metrics__value">${metrics.level}</span>
      </div>
      <div class="gf-metrics__item">
        <span class="gf-metrics__label">Ship Health</span>
        <span class="gf-metrics__value">${formatValue(metrics.shipsHealth, 0)}</span>
      </div>
      <div class="gf-metrics__item">
        <span class="gf-metrics__label">Afterburner</span>
        <span class="gf-metrics__value">${formatValue(metrics.afterburner, 0)}</span>
      </div>
      <div class="gf-metrics__item">
        <span class="gf-metrics__label">Timestamp</span>
        <span class="gf-metrics__value">${new Date(metrics.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  `;
};

const updateMetricsPanel: DashboardSubscriber['notify'] = (snapshot) => {
  renderMetrics(snapshot.metrics);
};

export const initializeTelemetryPanel = (): void => {
  const subscriber: DashboardSubscriber = {
    id: 'telemetry-panel',
    notify: updateMetricsPanel,
  };
  subscribe(subscriber);
  renderMetrics(dashboardState.metrics);
};

