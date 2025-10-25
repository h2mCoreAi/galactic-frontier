import { actions, dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, GalacticFrontierConfig } from '../types';

interface ProjectileEditorElements {
  readonly container: HTMLElement;
  readonly projectileForm: HTMLFormElement;
  readonly gameForm: HTMLFormElement;
}

const createElements = (): ProjectileEditorElements | null => {
  const container = document.getElementById('projectileEditor');
  if (!container) {
    return null;
  }

  container.innerHTML = `
    <div class="gf-config-layout">
      <form id="projectileForm" class="gf-form" autocomplete="off">
        <header class="gf-config-panel__header">
          <h3>Projectile Settings</h3>
          <p>Adjust projectile speeds, life, cooldown, and fan-shot behaviour.</p>
        </header>
        <div class="gf-form__row">
          <label class="gf-form__field">
            <span>Speed</span>
            <input id="projectileSpeed" name="speed" type="number" step="0.1" required />
          </label>
          <label class="gf-form__field">
            <span>Life (frames)</span>
            <input id="projectileLife" name="life" type="number" step="1" required />
          </label>
        </div>
        <div class="gf-form__row">
          <label class="gf-form__field">
            <span>Cooldown (frames)</span>
            <input id="projectileCooldown" name="cooldown" type="number" step="1" required />
          </label>
          <label class="gf-form__field">
            <span>Fan Shot Count</span>
            <input id="projectileFanShotCount" name="fanShotCount" type="number" step="1" required />
          </label>
          <label class="gf-form__field">
            <span>Fan Shot Angle (radians)</span>
            <input id="projectileFanShotAngle" name="fanShotAngle" type="number" step="0.001" required />
          </label>
        </div>
        <div class="gf-form__actions">
          <button type="submit" class="gf-button gf-button--primary">Save Projectile Settings</button>
        </div>
      </form>
      <form id="gameForm" class="gf-form" autocomplete="off">
        <header class="gf-config-panel__header">
          <h3>Game Settings</h3>
          <p>Control spawn intervals, power-ups, and level progression parameters.</p>
        </header>
        <div class="gf-form__row">
          <label class="gf-form__field">
            <span>Score to Level Up</span>
            <input id="gameScoreToLevelUp" name="scoreToLevelUp" type="number" step="1" required />
          </label>
          <label class="gf-form__field">
            <span>Enemy Spawn Min (frames)</span>
            <input id="gameMinSpawn" name="minSpawnInterval" type="number" step="1" required />
          </label>
          <label class="gf-form__field">
            <span>Enemy Spawn Max (frames)</span>
            <input id="gameMaxSpawn" name="maxSpawnInterval" type="number" step="1" required />
          </label>
        </div>
        <div class="gf-form__row">
          <label class="gf-form__field">
            <span>Health Power-Up Min</span>
            <input id="gameHealthMin" name="minHealthSpawnInterval" type="number" step="1" required />
          </label>
          <label class="gf-form__field">
            <span>Health Power-Up Max</span>
            <input id="gameHealthMax" name="maxHealthSpawnInterval" type="number" step="1" required />
          </label>
          <label class="gf-form__field">
            <span>Health Power-Up Value</span>
            <input id="gameHealthValue" name="healthPowerUpValue" type="number" step="1" required />
          </label>
        </div>
        <div class="gf-form__row">
          <label class="gf-form__field">
            <span>Fan Shot Spawn Min</span>
            <input id="gameFanMin" name="minFanShotSpawnInterval" type="number" step="1" required />
          </label>
          <label class="gf-form__field">
            <span>Fan Shot Spawn Max</span>
            <input id="gameFanMax" name="maxFanShotSpawnInterval" type="number" step="1" required />
          </label>
          <label class="gf-form__field">
            <span>Fan Shot Duration (frames)</span>
            <input id="gameFanDuration" name="fanShotDuration" type="number" step="1" required />
          </label>
        </div>
        <div class="gf-form__actions">
          <button type="submit" class="gf-button gf-button--primary">Save Game Settings</button>
        </div>
      </form>
    </div>
  `;

  return {
    container,
    projectileForm: container.querySelector('#projectileForm') as HTMLFormElement,
    gameForm: container.querySelector('#gameForm') as HTMLFormElement,
  };
};

let elements: ProjectileEditorElements | null = null;

const getProjectileInputs = () => ({
  speed: document.getElementById('projectileSpeed') as HTMLInputElement,
  life: document.getElementById('projectileLife') as HTMLInputElement,
  cooldown: document.getElementById('projectileCooldown') as HTMLInputElement,
  fanShotCount: document.getElementById('projectileFanShotCount') as HTMLInputElement,
  fanShotAngle: document.getElementById('projectileFanShotAngle') as HTMLInputElement,
});

const getGameInputs = () => ({
  scoreToLevelUp: document.getElementById('gameScoreToLevelUp') as HTMLInputElement,
  minSpawnInterval: document.getElementById('gameMinSpawn') as HTMLInputElement,
  maxSpawnInterval: document.getElementById('gameMaxSpawn') as HTMLInputElement,
  minHealthSpawnInterval: document.getElementById('gameHealthMin') as HTMLInputElement,
  maxHealthSpawnInterval: document.getElementById('gameHealthMax') as HTMLInputElement,
  healthPowerUpValue: document.getElementById('gameHealthValue') as HTMLInputElement,
  minFanShotSpawnInterval: document.getElementById('gameFanMin') as HTMLInputElement,
  maxFanShotSpawnInterval: document.getElementById('gameFanMax') as HTMLInputElement,
  fanShotDuration: document.getElementById('gameFanDuration') as HTMLInputElement,
});

const populateProjectile = (config: GalacticFrontierConfig['projectiles']): void => {
  const inputs = getProjectileInputs();
  inputs.speed.value = String(config.speed);
  inputs.life.value = String(config.life);
  inputs.cooldown.value = String(config.cooldown);
  inputs.fanShotCount.value = String(config.fanShotCount);
  inputs.fanShotAngle.value = String(config.fanShotAngle);
};

const populateGame = (config: GalacticFrontierConfig['game']): void => {
  const inputs = getGameInputs();
  inputs.scoreToLevelUp.value = String(config.scoreToLevelUp);
  inputs.minSpawnInterval.value = String(config.minSpawnInterval);
  inputs.maxSpawnInterval.value = String(config.maxSpawnInterval);
  inputs.minHealthSpawnInterval.value = String(config.minHealthSpawnInterval);
  inputs.maxHealthSpawnInterval.value = String(config.maxHealthSpawnInterval);
  inputs.healthPowerUpValue.value = String(config.healthPowerUpValue);
  inputs.minFanShotSpawnInterval.value = String(config.minFanShotSpawnInterval);
  inputs.maxFanShotSpawnInterval.value = String(config.maxFanShotSpawnInterval);
  inputs.fanShotDuration.value = String(config.fanShotDuration);
};

const handleProjectileSubmit = (event: Event): void => {
  event.preventDefault();
  const config = dashboardState.config;
  if (!config) {
    return;
  }
  const inputs = getProjectileInputs();
  actions.setConfig({
    ...config,
    projectiles: {
      speed: Number(inputs.speed.value),
      life: Number(inputs.life.value),
      cooldown: Number(inputs.cooldown.value),
      fanShotCount: Number(inputs.fanShotCount.value),
      fanShotAngle: Number(inputs.fanShotAngle.value),
    },
  });
};

const handleGameSubmit = (event: Event): void => {
  event.preventDefault();
  const config = dashboardState.config;
  if (!config) {
    return;
  }
  const inputs = getGameInputs();
  actions.setConfig({
    ...config,
    game: {
      scoreToLevelUp: Number(inputs.scoreToLevelUp.value),
      minSpawnInterval: Number(inputs.minSpawnInterval.value),
      maxSpawnInterval: Number(inputs.maxSpawnInterval.value),
      minHealthSpawnInterval: Number(inputs.minHealthSpawnInterval.value),
      maxHealthSpawnInterval: Number(inputs.maxHealthSpawnInterval.value),
      healthPowerUpValue: Number(inputs.healthPowerUpValue.value),
      minFanShotSpawnInterval: Number(inputs.minFanShotSpawnInterval.value),
      maxFanShotSpawnInterval: Number(inputs.maxFanShotSpawnInterval.value),
      fanShotDuration: Number(inputs.fanShotDuration.value),
    },
  });
};

const updateEditor: DashboardSubscriber['notify'] = (snapshot) => {
  if (!elements || !snapshot.config) {
    return;
  }
  populateProjectile(snapshot.config.projectiles);
  populateGame(snapshot.config.game);
};

export const initializeProjectileEditor = (): void => {
  elements = createElements();
  if (!elements) {
    return;
  }

  elements.projectileForm.addEventListener('submit', handleProjectileSubmit);
  elements.gameForm.addEventListener('submit', handleGameSubmit);

  const subscriber: DashboardSubscriber = {
    id: 'projectile-editor',
    notify: updateEditor,
  };
  subscribe(subscriber);

  if (dashboardState.config) {
    populateProjectile(dashboardState.config.projectiles);
    populateGame(dashboardState.config.game);
  }
};
