import { dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, DashboardMetrics, FPSHistory } from '../types';

const FPS_HISTORY_LENGTH = 60; // Track last 60 data points (~1 second at 60fps)
const fpsHistory: FPSHistory = {
  values: [],
  timestamps: [],
  maxLength: FPS_HISTORY_LENGTH,
};

const addFPSValue = (fps: number): void => {
  fpsHistory.values.push(fps);
  fpsHistory.timestamps.push(Date.now());
  
  if (fpsHistory.values.length > fpsHistory.maxLength) {
    fpsHistory.values.shift();
    fpsHistory.timestamps.shift();
  }
};

const getAverageFPS = (): number => {
  if (fpsHistory.values.length === 0) {
    return 0;
  }
  const sum = fpsHistory.values.reduce((a, b) => a + b, 0);
  return sum / fpsHistory.values.length;
};

const getMinFPS = (): number => {
  if (fpsHistory.values.length === 0) {
    return 0;
  }
  return Math.min(...fpsHistory.values);
};

const getMaxFPS = (): number => {
  if (fpsHistory.values.length === 0) {
    return 0;
  }
  return Math.max(...fpsHistory.values);
};

const renderFPSDisplay = (metrics: DashboardMetrics | null): void => {
  const container = document.getElementById('fpsMonitor');
  if (!container) {
    return;
  }

  if (!metrics) {
    container.innerHTML = '<p>Waiting for game preview to start...</p>';
    return;
  }

  addFPSValue(metrics.fps);
  const avgFPS = getAverageFPS();
  const minFPS = getMinFPS();
  const maxFPS = getMaxFPS();

  const fpsColor = metrics.fps >= 55 ? 'var(--gf-success)' : metrics.fps >= 30 ? 'var(--gf-warning)' : 'var(--gf-danger)';

  container.innerHTML = `
    <div class="gf-fps-monitor">
      <div class="gf-fps-monitor__current">
        <span class="gf-fps-monitor__label">Current FPS</span>
        <span class="gf-fps-monitor__value" style="color: ${fpsColor}">${metrics.fps.toFixed(1)}</span>
      </div>
      <div class="gf-fps-monitor__stats">
        <div class="gf-fps-monitor__stat">
          <span class="gf-fps-monitor__stat-label">Avg</span>
          <span class="gf-fps-monitor__stat-value">${avgFPS.toFixed(1)}</span>
        </div>
        <div class="gf-fps-monitor__stat">
          <span class="gf-fps-monitor__stat-label">Min</span>
          <span class="gf-fps-monitor__stat-value">${minFPS.toFixed(1)}</span>
        </div>
        <div class="gf-fps-monitor__stat">
          <span class="gf-fps-monitor__stat-label">Max</span>
          <span class="gf-fps-monitor__stat-value">${maxFPS.toFixed(1)}</span>
        </div>
      </div>
      <canvas id="fpsChart" class="gf-fps-monitor__chart" width="400" height="100"></canvas>
    </div>
  `;

  // Draw FPS chart
  const canvas = document.getElementById('fpsChart') as HTMLCanvasElement | null;
  if (canvas && fpsHistory.values.length > 1) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFPSChart(ctx, canvas.width, canvas.height);
    }
  }
};

const drawFPSChart = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  ctx.clearRect(0, 0, width, height);
  
  const values = fpsHistory.values;
  const maxValue = Math.max(60, Math.max(...values, 60));
  const minValue = Math.min(0, Math.min(...values, 0));
  const range = maxValue - minValue || 1;
  
  // Draw grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Draw 60 FPS reference line
  ctx.strokeStyle = 'rgba(46, 204, 113, 0.3)';
  ctx.lineWidth = 1;
  const fps60Y = height - ((60 - minValue) / range) * height;
  ctx.beginPath();
  ctx.moveTo(0, fps60Y);
  ctx.lineTo(width, fps60Y);
  ctx.stroke();
  
  // Draw FPS line
  ctx.strokeStyle = 'var(--gf-accent)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  values.forEach((value, index) => {
    const x = (width / (values.length - 1)) * index;
    const y = height - ((value - minValue) / range) * height;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Draw points
  ctx.fillStyle = 'var(--gf-accent)';
  values.forEach((value, index) => {
    const x = (width / (values.length - 1)) * index;
    const y = height - ((value - minValue) / range) * height;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
};

const updateFPSMonitor: DashboardSubscriber['notify'] = (snapshot) => {
  renderFPSDisplay(snapshot.metrics);
};

export const initializeFPSMonitor = (): void => {
  // Create FPS monitor container if it doesn't exist
  const metricsSection = document.querySelector('[aria-labelledby="testing-metrics-heading"]');
  if (metricsSection && !document.getElementById('fpsMonitor')) {
    const fpsDiv = document.createElement('div');
    fpsDiv.id = 'fpsMonitor';
    fpsDiv.className = 'gf-fps-monitor-container';
    const metricsPanel = document.getElementById('metricsPanel');
    if (metricsPanel) {
      metricsPanel.insertAdjacentElement('afterend', fpsDiv);
    } else {
      metricsSection.appendChild(fpsDiv);
    }
  }

  const subscriber: DashboardSubscriber = {
    id: 'fps-monitor',
    notify: updateFPSMonitor,
  };
  subscribe(subscriber);
  renderFPSDisplay(dashboardState.metrics);
};

