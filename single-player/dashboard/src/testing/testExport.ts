import { dashboardState } from '../state';
import type { DashboardMetrics } from '../types';

interface TestExportData {
  readonly exportedAt: string;
  readonly config: {
    readonly version?: string;
    readonly ship?: unknown;
    readonly projectiles?: unknown;
    readonly enemies?: unknown;
    readonly game?: unknown;
  };
  readonly metrics?: {
    readonly current?: DashboardMetrics;
    readonly history?: DashboardMetrics[];
  };
  readonly performanceSnapshots?: unknown[];
  readonly eventLogs?: unknown[];
}

const exportAllTestData = (): void => {
  const exportData: TestExportData = {
    exportedAt: new Date().toISOString(),
    config: dashboardState.config ? {
      version: dashboardState.config.version,
      ship: dashboardState.config.ship,
      projectiles: dashboardState.config.projectiles,
      enemies: dashboardState.config.enemies,
      game: dashboardState.config.game,
    } : {},
    metrics: dashboardState.metrics ? {
      current: dashboardState.metrics,
    } : undefined,
  };

  // Get performance snapshots if available
  const perfComparison = document.getElementById('performanceComparison');
  if (perfComparison) {
    // Performance comparison component manages its own snapshots
    // We'll export what we can from state
  }

  // Get event logs if available
  const eventLogger = document.getElementById('eventLogger');
  if (eventLogger) {
    // Event logger manages its own logs
    // We'll export what we can from state
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `test-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportMetricsCSV = (metrics: DashboardMetrics[]): void => {
  if (metrics.length === 0) {
    return;
  }

  const headers = ['Timestamp', 'FPS', 'Enemies', 'Projectiles', 'Score', 'Level', 'Health', 'Afterburner', 'Memory (MB)'];
  const rows = metrics.map(m => [
    new Date(m.timestamp).toISOString(),
    m.fps.toString(),
    m.enemies.toString(),
    m.projectiles.toString(),
    m.score.toString(),
    m.level.toString(),
    m.shipsHealth.toString(),
    m.afterburner.toString(),
    m.memoryUsage?.toString() || '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metrics-${new Date().toISOString().replace(/:/g, '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export { exportAllTestData, exportMetricsCSV };

