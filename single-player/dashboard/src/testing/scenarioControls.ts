import { showToast } from '../toast';

const containerId = 'scenarioControls';
const iframeId = 'gamePreviewFrame';

type GameCommand = 
  | { type: 'set-level'; payload: number }
  | { type: 'set-health'; payload: number }
  | { type: 'set-score'; payload: number }
  | { type: 'spawn-enemy'; payload?: { type?: string } }
  | { type: 'clear-enemies' }
  | { type: 'toggle-pause' };

const postCommand = (command: GameCommand): void => {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
  if (!iframe?.contentWindow) {
    showToast({ title: 'Preview not ready', message: 'Start the live preview before running scenarios.', variant: 'error' });
    return;
  }
  iframe.contentWindow.postMessage(command, '*');
};

const spawnSingle = (enemyType?: string): void => {
  postCommand({ type: 'spawn-enemy', payload: { type: enemyType } });
};

const spawnWave = (count: number, enemyType?: string): void => {
  for (let i = 0; i < count; i += 1) {
    window.setTimeout(() => spawnSingle(enemyType), i * 200);
  }
  showToast({ title: 'Wave spawned', message: `${count} enemies queued.`, variant: 'info', durationMs: 2000 });
};

const setLevel = (level: number): void => {
  postCommand({ type: 'set-level', payload: level });
  showToast({ title: 'Level set', message: `Level set to ${level}`, variant: 'info' });
};

const setHealth = (health: number): void => {
  postCommand({ type: 'set-health', payload: health });
  showToast({ title: 'Health set', message: `Health set to ${health}`, variant: 'info' });
};

const setScore = (score: number): void => {
  postCommand({ type: 'set-score', payload: score });
  showToast({ title: 'Score set', message: `Score set to ${score}`, variant: 'info' });
};

const clearEnemies = (): void => {
  postCommand({ type: 'clear-enemies' });
  showToast({ title: 'Enemies cleared', variant: 'info' });
};

const togglePause = (): void => {
  postCommand({ type: 'toggle-pause' });
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
        <button type="button" class="gf-scenarios__button" data-action="clear-enemies">Clear All Enemies</button>
        <button type="button" class="gf-scenarios__button" data-action="toggle-pause">Pause/Resume</button>
      </div>
    </div>
    <div class="gf-scenarios__group">
      <span class="gf-scenarios__title">Spawn Presets</span>
      <div class="gf-scenarios__controls">
        <button type="button" class="gf-scenarios__button" data-action="spawn-wave" data-count="5">Small Wave (5)</button>
        <button type="button" class="gf-scenarios__button" data-action="spawn-wave" data-count="10">Medium Wave (10)</button>
        <button type="button" class="gf-scenarios__button gf-scenarios__button--danger" data-action="spawn-wave" data-count="20">Stress Wave (20)</button>
      </div>
    </div>
    <div class="gf-scenarios__group">
      <span class="gf-scenarios__title">Game State Controls</span>
      <div class="gf-scenarios__controls">
        <div class="gf-scenarios__input-group">
          <label>
            <span>Level:</span>
            <input type="number" id="scenarioLevel" min="1" max="100" value="1" />
            <button type="button" class="gf-scenarios__button" data-action="set-level">Set</button>
          </label>
        </div>
        <div class="gf-scenarios__input-group">
          <label>
            <span>Health:</span>
            <input type="number" id="scenarioHealth" min="0" max="1000" value="100" />
            <button type="button" class="gf-scenarios__button" data-action="set-health">Set</button>
          </label>
        </div>
        <div class="gf-scenarios__input-group">
          <label>
            <span>Score:</span>
            <input type="number" id="scenarioScore" min="0" value="0" />
            <button type="button" class="gf-scenarios__button" data-action="set-score">Set</button>
          </label>
        </div>
      </div>
    </div>
  `;

  container.addEventListener('click', (event) => {
    const target = event.target as HTMLButtonElement | null;
    if (!target || !target.dataset.action) {
      return;
    }

    const action = target.dataset.action;
    
    if (action === 'spawn-one') {
      spawnSingle();
    } else if (action === 'spawn-wave') {
      const count = Number(target.dataset.count ?? '5');
      spawnWave(count);
    } else if (action === 'clear-enemies') {
      clearEnemies();
    } else if (action === 'toggle-pause') {
      togglePause();
    } else if (action === 'set-level') {
      const input = document.getElementById('scenarioLevel') as HTMLInputElement | null;
      if (input) {
        setLevel(Number(input.value));
      }
    } else if (action === 'set-health') {
      const input = document.getElementById('scenarioHealth') as HTMLInputElement | null;
      if (input) {
        setHealth(Number(input.value));
      }
    } else if (action === 'set-score') {
      const input = document.getElementById('scenarioScore') as HTMLInputElement | null;
      if (input) {
        setScore(Number(input.value));
      }
    }
  });
};

export const initializeScenarioControls = (): void => {
  renderControls();
};

