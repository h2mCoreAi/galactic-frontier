import { actions, dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, GalacticFrontierConfig } from '../types';

interface ProjectileEditorElements {
  readonly projectileContainer?: HTMLElement | null;
  readonly gameContainer?: HTMLElement | null;
  readonly projectileForm?: HTMLFormElement | null;
  readonly gameForm?: HTMLFormElement | null;
}

const createElements = (): ProjectileEditorElements => {
  const projectileContainer = document.getElementById('projectileEditor');
  const gameContainer = document.getElementById('gameEditor');

  if (projectileContainer) {
    projectileContainer.innerHTML = `
    <div class="gf-config-layout">
      <form id="projectileForm" class="gf-form" autocomplete="off">
        <div class="gf-group">
          <div class="gf-group__title">Projectile Settings</div>
          <div class="gf-group__desc">Adjust projectile speeds, life, cooldown, and fan-shot behaviour.</div>
          <div class="gf-group__grid">
          <label class="gf-form__field">
            <span>Speed</span>
            <input id="projectileSpeed" name="speed" type="text"  pattern="[0-9]*.?[0-9]*" required />
            <small class="gf-help">Pixels per frame for bullets.</small>
          </label>
          <label class="gf-form__field">
            <span>Life (frames)</span>
            <input id="projectileLife" name="life" type="text"  pattern="[0-9]*.?[0-9]*" required />
            <small class="gf-help">How long bullets persist before despawning.</small>
          </label>
            <label class="gf-form__field">
              <span>Cooldown (frames)</span>
              <input id="projectileCooldown" name="cooldown" type="text"  pattern="[0-9]*.?[0-9]*" required />
              <small class="gf-help">Frames between shots; lower = faster fire rate.</small>
            </label>
            <label class="gf-form__field">
              <span>Fan Shot Count</span>
              <input id="projectileFanShotCount" name="fanShotCount" type="text"  pattern="[0-9]*.?[0-9]*" required />
              <small class="gf-help">Number of bullets fired in spread mode.</small>
            </label>
          <label class="gf-form__field">
            <span>Fan Shot Angle (radians)</span>
            <input id="projectileFanShotAngle" name="fanShotAngle" type="text"  pattern="[0-9]*.?[0-9]*" required />
            <small class="gf-help">Spread angle (in radians) across fan-shot.</small>
          </label>
          </div>
        </div>
        <div class="gf-form__actions">
          <button type="submit" class="gf-button gf-button--primary">Save Projectile Settings</button>
        </div>
      </form>
    </div>
  `;
  }

  if (gameContainer) {
    gameContainer.innerHTML = `
    <div class="gf-subtabs">
      <div class="gf-subtabs__nav" role="tablist" aria-label="Game sub-sections">
        <button class="gf-subtabs__tab" role="tab" aria-selected="true" data-gametab="settings">Game Settings</button>
        <button class="gf-subtabs__tab" role="tab" aria-selected="false" data-gametab="spawn">Spawn & Limits</button>
        <button class="gf-subtabs__tab" role="tab" aria-selected="false" data-gametab="scaling">Level Scaling</button>
      </div>
      <form id="gameForm" class="gf-form" autocomplete="off">
        <section class="gf-subpanel" data-gametab-panel="settings">
          <div class="gf-group__title">Game Settings</div>
          <div class="gf-group__desc">Control spawn intervals, power-ups, and level progression parameters.</div>
          <div class="gf-group__grid">
            <label class="gf-form__field">
              <span>Score to Level Up</span>
              <input id="gameScoreToLevelUp" name="scoreToLevelUp" type="text" step="1" required />
              <small class="gf-help">Points required to increment the level.</small>
            </label>
            <label class="gf-form__field">
              <span>Enemy Spawn Min (frames)</span>
              <input id="gameMinSpawn" name="minSpawnInterval" type="text" step="1" required />
              <small class="gf-help">Minimum frames between spawns.</small>
            </label>
            <label class="gf-form__field">
              <span>Enemy Spawn Max (frames)</span>
              <input id="gameMaxSpawn" name="maxSpawnInterval" type="text" step="1" required />
              <small class="gf-help">Maximum frames between spawns.</small>
            </label>
            <label class="gf-form__field">
              <span>Health Power-Up Min</span>
              <input id="gameHealthMin" name="minHealthSpawnInterval" type="text" step="1" required />
              <small class="gf-help">Earliest interval (frames) for health power-ups.</small>
            </label>
            <label class="gf-form__field">
              <span>Health Power-Up Max</span>
              <input id="gameHealthMax" name="maxHealthSpawnInterval" type="text" step="1" required />
              <small class="gf-help">Latest interval (frames) for health power-ups.</small>
            </label>
            <label class="gf-form__field">
              <span>Health Power-Up Value</span>
              <input id="gameHealthValue" name="healthPowerUpValue" type="text" step="1" required />
              <small class="gf-help">HP restored when collected.</small>
            </label>
            <label class="gf-form__field">
              <span>Fan Shot Spawn Min</span>
              <input id="gameFanMin" name="minFanShotSpawnInterval" type="text" step="1" required />
              <small class="gf-help">Earliest interval (frames) for fan-shot power-ups.</small>
            </label>
            <label class="gf-form__field">
              <span>Fan Shot Spawn Max</span>
              <input id="gameFanMax" name="maxFanShotSpawnInterval" type="text" step="1" required />
              <small class="gf-help">Latest interval (frames) for fan-shot power-ups.</small>
            </label>
            <label class="gf-form__field">
              <span>Fan Shot Duration (frames)</span>
              <input id="gameFanDuration" name="fanShotDuration" type="text" step="1" required />
              <small class="gf-help">Duration of spread mode (frames).</small>
            </label>
          </div>
        </section>
        <section class="gf-subpanel" data-gametab-panel="spawn" hidden>
          <div class="gf-group__title">Spawn & Limits</div>
          <div class="gf-group__desc">Weight enemy types, cap enemies, and tune per-level spawn rate.</div>
          <div class="gf-group__grid">
            <label class="gf-form__field">
              <span>Max Enemies</span>
              <input id="gameMaxEnemies" name="maxEnemies" type="text" step="1" />
              <small class="gf-help">Cap the number of active enemies.</small>
            </label>
            <label class="gf-form__field">
              <span>Spawn Rate Factor / Level</span>
              <input id="gameSpawnRateFactor" name="spawnRatePerLevelFactor" type="text" step="0.01" />
              <small class="gf-help">Per-level multiplier for spawn intervals (e.g., 0.9).</small>
            </label>
            <label class="gf-form__field">
              <span>Min Spawn Rate Clamp</span>
              <input id="gameMinSpawnClamp" name="minSpawnRateClamp" type="text" step="0.01" />
              <small class="gf-help">Lowest allowed spawn-rate factor (e.g., 0.3).</small>
            </label>
            <label class="gf-form__field">
              <span>Weight: Small</span>
              <input id="gameWeightSmall" type="text" step="0.01" />
              <small class="gf-help">Spawn weight for small enemies.</small>
            </label>
            <label class="gf-form__field">
              <span>Weight: Medium</span>
              <input id="gameWeightMedium" type="text" step="0.01" />
              <small class="gf-help">Spawn weight for medium enemies.</small>
            </label>
            <label class="gf-form__field">
              <span>Weight: Large</span>
              <input id="gameWeightLarge" type="text" step="0.01" />
              <small class="gf-help">Spawn weight for large enemies.</small>
            </label>
          </div>
        </section>
        <section class="gf-subpanel" data-gametab-panel="scaling" hidden>
          <div class="gf-group__title">Level Scaling</div>
          <div class="gf-group__desc">Per-level multipliers applied to enemies.</div>
          <div class="gf-group__grid">
            <label class="gf-form__field">
              <span>Enemy Speed / Level</span>
              <input id="gameScaleEnemySpeed" type="text" step="0.01" />
              <small class="gf-help">Per-level multiplier for enemy speed (e.g., 1.05).</small>
            </label>
            <label class="gf-form__field">
              <span>Projectile Damage / Level</span>
              <input id="gameScaleProjDamage" type="text" step="0.01" />
              <small class="gf-help">Per-level multiplier for enemy bullet damage (e.g., 1.1).</small>
            </label>
            <label class="gf-form__field">
              <span>Collision Damage / Level</span>
              <input id="gameScaleCollDamage" type="text" step="0.01" />
              <small class="gf-help">Per-level multiplier for collision damage (e.g., 1.15).</small>
            </label>
          </div>
        </section>
        <div class="gf-form__actions">
          <button type="submit" class="gf-button gf-button--primary">Save Game Settings</button>
        </div>
      </form>
    </div>
  `;
  }

  return {
    projectileContainer,
    gameContainer,
    projectileForm: document.getElementById('projectileForm') as HTMLFormElement | null,
    gameForm: document.getElementById('gameForm') as HTMLFormElement | null,
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
  maxEnemies: document.getElementById('gameMaxEnemies') as HTMLInputElement,
  spawnRatePerLevelFactor: document.getElementById('gameSpawnRateFactor') as HTMLInputElement,
  minSpawnRateClamp: document.getElementById('gameMinSpawnClamp') as HTMLInputElement,
  weightSmall: document.getElementById('gameWeightSmall') as HTMLInputElement,
  weightMedium: document.getElementById('gameWeightMedium') as HTMLInputElement,
  weightLarge: document.getElementById('gameWeightLarge') as HTMLInputElement,
  scaleEnemySpeed: document.getElementById('gameScaleEnemySpeed') as HTMLInputElement,
  scaleProjDamage: document.getElementById('gameScaleProjDamage') as HTMLInputElement,
  scaleCollDamage: document.getElementById('gameScaleCollDamage') as HTMLInputElement,
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
  inputs.maxEnemies.value = String(config.maxEnemies ?? 50);
  inputs.spawnRatePerLevelFactor.value = String(config.spawnRatePerLevelFactor ?? 0.9);
  inputs.minSpawnRateClamp.value = String(config.minSpawnRateClamp ?? 0.3);
  const weights = config.enemyTypeWeights ?? { small: 0.5, medium: 0.3, large: 0.2 };
  inputs.weightSmall.value = String(weights.small);
  inputs.weightMedium.value = String(weights.medium);
  inputs.weightLarge.value = String(weights.large);
  const scale = config.levelScaling ?? { enemySpeedPerLevel: 1.05, projectileDamagePerLevel: 1.1, collisionDamagePerLevel: 1.15 };
  inputs.scaleEnemySpeed.value = String(scale.enemySpeedPerLevel ?? 1.05);
  inputs.scaleProjDamage.value = String(scale.projectileDamagePerLevel ?? 1.1);
  inputs.scaleCollDamage.value = String(scale.collisionDamagePerLevel ?? 1.15);
};

const applyProjectileInputs = (): void => {
  const config = dashboardState.config;
  if (!config) return;
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

const applyGameInputs = (): void => {
  const config = dashboardState.config;
  if (!config) return;
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
      maxEnemies: Number(inputs.maxEnemies.value),
      enemyTypeWeights: {
        small: Number(inputs.weightSmall.value),
        medium: Number(inputs.weightMedium.value),
        large: Number(inputs.weightLarge.value),
      },
      spawnRatePerLevelFactor: Number(inputs.spawnRatePerLevelFactor.value),
      minSpawnRateClamp: Number(inputs.minSpawnRateClamp.value),
      levelScaling: {
        enemySpeedPerLevel: Number(inputs.scaleEnemySpeed.value),
        projectileDamagePerLevel: Number(inputs.scaleProjDamage.value),
        collisionDamagePerLevel: Number(inputs.scaleCollDamage.value),
      },
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

  // convert explicit submit buttons into immediate apply for consistency with Ship
  elements.projectileForm?.addEventListener('input', applyProjectileInputs);
  elements.projectileForm?.addEventListener('change', applyProjectileInputs);
  elements.gameForm?.addEventListener('input', applyGameInputs);
  elements.gameForm?.addEventListener('change', applyGameInputs);

  // wire sub-tab switching
  const subnav = document.querySelector('.gf-subtabs__nav');
  if (subnav) {
    const show = (name: string) => {
      document.querySelectorAll<HTMLButtonElement>('.gf-subtabs__tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.gametab === name)));
      document.querySelectorAll<HTMLElement>('[data-gametab-panel]').forEach((p) => { p.hidden = p.dataset.gametabPanel !== name; });
    };
    subnav.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.gf-subtabs__tab') as HTMLButtonElement | null;
      if (!btn) return;
      show(btn.dataset.gametab || 'settings');
    });
    show('settings');
  }

  const subscriber: DashboardSubscriber = {
    id: 'projectile-editor',
    notify: updateEditor,
  };
  subscribe(subscriber);

  if (dashboardState.config) {
    populateProjectile(dashboardState.config.projectiles);
    populateGame(dashboardState.config.game);
  }

  // Prevent page navigation on form submit and apply changes instead
  elements.projectileForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyProjectileInputs();
  });
  elements.gameForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyGameInputs();
  });
};
