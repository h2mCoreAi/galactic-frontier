import { dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, DashboardMetrics, GalacticFrontierConfig } from '../types';

const containerId = 'performanceComparison';

interface PerformanceSnapshot {
  readonly id: string;
  readonly timestamp: number;
  readonly configHash: string;
  readonly metrics: {
    readonly avgFPS: number;
    readonly minFPS: number;
    readonly maxFPS: number;
    readonly avgMemory?: number;
    readonly maxMemory?: number;
    readonly sampleCount: number;
  };
  readonly configVersion?: string;
}

const snapshots: PerformanceSnapshot[] = [];
const MAX_SNAPSHOTS = 10;
let currentSnapshotMetrics: DashboardMetrics[] = [];
let isRecording = false;
let recordingStartTime: number | null = null;

const calculateSnapshotMetrics = (metricsArray: DashboardMetrics[]): PerformanceSnapshot['metrics'] => {
  if (metricsArray.length === 0) {
    return {
      avgFPS: 0,
      minFPS: 0,
      maxFPS: 0,
      sampleCount: 0,
    };
  }

  const fpsValues = metricsArray.map(m => m.fps);
  const memoryValues = metricsArray.filter(m => m.memoryUsage !== undefined).map(m => m.memoryUsage!);

  return {
    avgFPS: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length,
    minFPS: Math.min(...fpsValues),
    maxFPS: Math.max(...fpsValues),
    avgMemory: memoryValues.length > 0 ? memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length : undefined,
    maxMemory: memoryValues.length > 0 ? Math.max(...memoryValues) : undefined,
    sampleCount: metricsArray.length,
  };
};

const createSnapshot = (config: GalacticFrontierConfig | null): PerformanceSnapshot | null => {
  if (currentSnapshotMetrics.length === 0) {
    return null;
  }

  const configHash = config ? JSON.stringify(config) : 'no-config';
  const metrics = calculateSnapshotMetrics(currentSnapshotMetrics);

  return {
    id: `snapshot-${Date.now()}`,
    timestamp: recordingStartTime || Date.now(),
    configHash,
    metrics,
    configVersion: config?.version,
  };
};

const saveSnapshot = (snapshot: PerformanceSnapshot): void => {
  snapshots.push(snapshot);
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.shift();
  }
  renderComparison();
};

const formatNumber = (value: number, decimals = 1): string => value.toFixed(decimals);
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const renderComparison = (): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  const snapshotCards = snapshots.map((snapshot, index) => {
    const isBaseline = index === 0;
    const baseline = snapshots[0];
    const diff = baseline ? {
      avgFPS: snapshot.metrics.avgFPS - baseline.metrics.avgFPS,
      minFPS: snapshot.metrics.minFPS - baseline.metrics.minFPS,
      maxFPS: snapshot.metrics.maxFPS - baseline.metrics.maxFPS,
      avgMemory: snapshot.metrics.avgMemory && baseline.metrics.avgMemory
        ? snapshot.metrics.avgMemory - baseline.metrics.avgMemory
        : undefined,
    } : null;

    return `
      <div class="gf-perf-snapshot ${isBaseline ? 'gf-perf-snapshot--baseline' : ''}">
        <div class="gf-perf-snapshot__header">
          <h4>${isBaseline ? 'Baseline' : `Snapshot ${index}`}</h4>
          <span class="gf-perf-snapshot__time">${formatTimestamp(snapshot.timestamp)}</span>
          ${!isBaseline && diff ? `
            <button class="gf-button gf-button--danger gf-button--small" data-snapshot-delete="${snapshot.id}" type="button">Delete</button>
          ` : ''}
        </div>
        <div class="gf-perf-snapshot__metrics">
          <div class="gf-perf-snapshot__metric">
            <span class="gf-perf-snapshot__label">Avg FPS</span>
            <span class="gf-perf-snapshot__value">${formatNumber(snapshot.metrics.avgFPS)}</span>
            ${diff ? `
              <span class="gf-perf-snapshot__diff ${diff.avgFPS >= 0 ? 'gf-perf-snapshot__diff--positive' : 'gf-perf-snapshot__diff--negative'}">
                ${diff.avgFPS >= 0 ? '+' : ''}${formatNumber(diff.avgFPS)}
              </span>
            ` : ''}
          </div>
          <div class="gf-perf-snapshot__metric">
            <span class="gf-perf-snapshot__label">Min FPS</span>
            <span class="gf-perf-snapshot__value">${formatNumber(snapshot.metrics.minFPS)}</span>
            ${diff ? `
              <span class="gf-perf-snapshot__diff ${diff.minFPS >= 0 ? 'gf-perf-snapshot__diff--positive' : 'gf-perf-snapshot__diff--negative'}">
                ${diff.minFPS >= 0 ? '+' : ''}${formatNumber(diff.minFPS)}
              </span>
            ` : ''}
          </div>
          <div class="gf-perf-snapshot__metric">
            <span class="gf-perf-snapshot__label">Max FPS</span>
            <span class="gf-perf-snapshot__value">${formatNumber(snapshot.metrics.maxFPS)}</span>
            ${diff ? `
              <span class="gf-perf-snapshot__diff ${diff.maxFPS >= 0 ? 'gf-perf-snapshot__diff--positive' : 'gf-perf-snapshot__diff--negative'}">
                ${diff.maxFPS >= 0 ? '+' : ''}${formatNumber(diff.maxFPS)}
              </span>
            ` : ''}
          </div>
          ${snapshot.metrics.avgMemory !== undefined ? `
            <div class="gf-perf-snapshot__metric">
              <span class="gf-perf-snapshot__label">Avg Memory</span>
              <span class="gf-perf-snapshot__value">${formatNumber(snapshot.metrics.avgMemory, 0)} MB</span>
              ${diff?.avgMemory !== undefined ? `
                <span class="gf-perf-snapshot__diff ${diff.avgMemory <= 0 ? 'gf-perf-snapshot__diff--positive' : 'gf-perf-snapshot__diff--negative'}">
                  ${diff.avgMemory >= 0 ? '+' : ''}${formatNumber(diff.avgMemory, 0)} MB
                </span>
              ` : ''}
            </div>
          ` : ''}
          <div class="gf-perf-snapshot__metric">
            <span class="gf-perf-snapshot__label">Samples</span>
            <span class="gf-perf-snapshot__value">${snapshot.metrics.sampleCount}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="gf-perf-comparison">
      <div class="gf-perf-comparison__header">
        <h3>Performance Comparison</h3>
        <p>Record performance snapshots to compare metrics across configuration changes.</p>
      </div>
      
      <div class="gf-perf-comparison__controls">
        <button 
          id="perfRecordBtn" 
          class="gf-button ${isRecording ? 'gf-button--danger' : 'gf-button--primary'}" 
          type="button"
        >
          ${isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
        </button>
        <button 
          id="perfSnapshotBtn" 
          class="gf-button ${isRecording ? '' : 'gf-button--secondary'}" 
          type="button"
          ${!isRecording ? 'disabled' : ''}
        >
          📸 Take Snapshot
        </button>
        <button 
          id="perfClearBtn" 
          class="gf-button gf-button--secondary" 
          type="button"
          ${snapshots.length === 0 ? 'disabled' : ''}
        >
          🗑 Clear All
        </button>
        <button 
          id="perfExportBtn" 
          class="gf-button gf-button--secondary" 
          type="button"
          ${snapshots.length === 0 ? 'disabled' : ''}
        >
          📥 Export Data
        </button>
      </div>

      ${isRecording ? `
        <div class="gf-perf-comparison__recording">
          <span class="gf-perf-comparison__recording-indicator">●</span>
          <span>Recording... ${currentSnapshotMetrics.length} samples collected</span>
        </div>
      ` : ''}

      <div class="gf-perf-comparison__snapshots">
        ${snapshots.length === 0 
          ? '<p class="gf-perf-comparison__empty">No snapshots yet. Start recording and take a snapshot to begin comparing performance.</p>'
          : snapshotCards
        }
      </div>
    </div>
  `;

  // Attach event listeners
  const recordBtn = container.querySelector('#perfRecordBtn');
  const snapshotBtn = container.querySelector('#perfSnapshotBtn');
  const clearBtn = container.querySelector('#perfClearBtn');
  const exportBtn = container.querySelector('#perfExportBtn');

  recordBtn?.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    renderComparison();
  });

  snapshotBtn?.addEventListener('click', () => {
    if (isRecording && currentSnapshotMetrics.length > 0) {
      const snapshot = createSnapshot(dashboardState.config);
      if (snapshot) {
        saveSnapshot(snapshot);
        // Continue recording after snapshot
        currentSnapshotMetrics = [];
        recordingStartTime = Date.now();
      }
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (confirm('Clear all performance snapshots?')) {
      snapshots.length = 0;
      currentSnapshotMetrics = [];
      isRecording = false;
      recordingStartTime = null;
      renderComparison();
    }
  });

  exportBtn?.addEventListener('click', () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      snapshots: snapshots.map(s => ({
        ...s,
        timestamp: new Date(s.timestamp).toISOString(),
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-comparison-${new Date().toISOString().replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Attach delete handlers
  container.querySelectorAll('[data-snapshot-delete]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const snapshotId = (e.target as HTMLElement).getAttribute('data-snapshot-delete');
      if (snapshotId) {
        const index = snapshots.findIndex(s => s.id === snapshotId);
        if (index > 0) { // Don't allow deleting baseline
          snapshots.splice(index, 1);
          renderComparison();
        }
      }
    });
  });
};

const startRecording = (): void => {
  isRecording = true;
  currentSnapshotMetrics = [];
  recordingStartTime = Date.now();
};

const stopRecording = (): void => {
  isRecording = false;
  // Save final snapshot if we have data
  if (currentSnapshotMetrics.length > 0) {
    const snapshot = createSnapshot(dashboardState.config);
    if (snapshot) {
      saveSnapshot(snapshot);
    }
  }
  currentSnapshotMetrics = [];
  recordingStartTime = null;
};

const updateComparison: DashboardSubscriber['notify'] = (snapshot) => {
  // Collect metrics while recording
  if (isRecording && snapshot.metrics) {
    currentSnapshotMetrics.push({ ...snapshot.metrics });
    // Limit in-memory collection to prevent memory issues
    if (currentSnapshotMetrics.length > 1000) {
      currentSnapshotMetrics.shift();
    }
    // Update recording indicator
    const recordingIndicator = document.querySelector('.gf-perf-comparison__recording');
    if (recordingIndicator) {
      const countEl = recordingIndicator.querySelector('span:last-child');
      if (countEl) {
        countEl.textContent = `Recording... ${currentSnapshotMetrics.length} samples collected`;
      }
    }
  }
};

export const initializePerformanceComparison = (): void => {
  // Create container if it doesn't exist
  const metricsSection = document.querySelector('[aria-labelledby="testing-metrics-heading"]');
  if (metricsSection && !document.getElementById(containerId)) {
    const comparisonDiv = document.createElement('div');
    comparisonDiv.id = containerId;
    comparisonDiv.className = 'gf-perf-comparison-container';
    const fpsMonitor = document.getElementById('fpsMonitor');
    if (fpsMonitor) {
      fpsMonitor.insertAdjacentElement('afterend', comparisonDiv);
    } else {
      metricsSection.appendChild(comparisonDiv);
    }
  }

  const subscriber: DashboardSubscriber = {
    id: 'performance-comparison',
    notify: updateComparison,
  };
  subscribe(subscriber);
  renderComparison();
};

