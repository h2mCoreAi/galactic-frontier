import { showToast } from '../toast';

const containerId = 'scenarioControls';
const iframeId = 'gamePreviewFrame';

type SpawnCommand = 'spawn-enemy';

const postCommand = (command: SpawnCommand): void => {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
  if (!iframe?.contentWindow) {
    showToast({ title: 'Preview not ready', message: 'Start the live preview before running scenarios.', variant: 'error' });
    return;
  }
  iframe.contentWindow.postMessage({ type: command }, '*');
};

const spawnSingle = (): void => {
  postCommand('spawn-enemy');
};

const spawnWave = (count: number): void => {
  for (let i = 0; i < count; i += 1) {
    window.setTimeout(() => postCommand('spawn-enemy'), i * 200);
  }
  showToast({ title: 'Wave spawned', message: `${count} enemies queued.`, variant: 'info', durationMs: 2000 });
};

const renderControls = (): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="gf-scenarios__group">
      <span class="gf-scenarios__title">Manual Controls</span>
      <div class="gf-scenarios__controls">
        <button type="button" class="gf-scenarios__button" data-action="spawn-one">Spawn Enemy</button>
      </div>
    </div>
    <div class="gf-scenarios__group">
      <span class="gf-scenarios__title">Presets</span>
      <div class="gf-scenarios__controls">
        <button type="button" class="gf-scenarios__button" data-action="spawn-wave" data-count="5">Small Wave (5)</button>
        <button type="button" class="gf-scenarios__button" data-action="spawn-wave" data-count="10">Medium Wave (10)</button>
        <button type="button" class="gf-scenarios__button gf-scenarios__button--danger" data-action="spawn-wave" data-count="20">Stress Wave (20)</button>
      </div>
    </div>
  `;

  container.addEventListener('click', (event) => {
    const target = event.target as HTMLButtonElement | null;
    if (!target || !target.dataset.action) {
      return;
    }

    if (target.dataset.action === 'spawn-one') {
      spawnSingle();
    } else if (target.dataset.action === 'spawn-wave') {
      const count = Number(target.dataset.count ?? '5');
      spawnWave(count);
    }
  });
};

export const initializeSpawnControls = (): void => {
  renderControls();
};

