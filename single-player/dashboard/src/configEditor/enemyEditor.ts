import { actions, dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, EnemyConfig } from '../types';

interface EnemyEditorElements {
  readonly container: HTMLElement;
  readonly cards: HTMLElement;
  readonly form: HTMLFormElement;
  readonly typeInput: HTMLInputElement;
  readonly speedInput: HTMLInputElement;
  readonly sizeInput: HTMLInputElement;
  readonly pointsInput: HTMLInputElement;
  readonly shootIntervalInput: HTMLInputElement;
  readonly projectileDamageInput: HTMLInputElement;
  readonly collisionDamageInput: HTMLInputElement;
  readonly deleteButton: HTMLButtonElement;
}

const createElements = (): EnemyEditorElements | null => {
  const container = document.getElementById('enemyEditor');
  if (!container) {
    return null;
  }

  container.innerHTML = `
    <div class="gf-card-panel">
      <div class="gf-card-panel__header">
        <h3>Enemy Types</h3>
        <button type="button" class="gf-button gf-button--secondary" id="enemyAdd">New Enemy Type</button>
      </div>
      <div id="enemyCards" class="gf-card-grid" role="list"></div>
    </div>
    <form id="enemyForm" class="gf-form" autocomplete="off">
      <div class="gf-group">
        <div class="gf-group__title">Enemy Details</div>
        <div class="gf-group__desc">Manage enemy type, stats, and damage.</div>
        <div class="gf-group__grid">
          <label class="gf-form__field">
            <span>Type</span>
            <input id="enemyType" name="type" required />
            <small class="gf-help">Unique identifier (e.g., small, medium, large).</small>
          </label>
          <label class="gf-form__field">
            <span>Speed</span>
            <input id="enemySpeed" name="speed" type="number" step="0.1" required />
            <small class="gf-help">Movement speed per frame.</small>
          </label>
          <label class="gf-form__field">
            <span>Size</span>
            <input id="enemySize" name="size" type="number" step="1" required />
            <small class="gf-help">Collision radius; larger is easier to hit.</small>
          </label>
          <label class="gf-form__field">
            <span>Points</span>
            <input id="enemyPoints" name="points" type="number" step="1" required />
            <small class="gf-help">Score awarded for destroying this enemy.</small>
          </label>
          <label class="gf-form__field">
            <span>Shoot Interval (frames)</span>
            <input id="enemyShootInterval" name="shootInterval" type="number" step="1" required />
            <small class="gf-help">Lower = shoots more often (frame-based).</small>
          </label>
          <label class="gf-form__field">
            <span>Projectile Damage</span>
            <input id="enemyProjectileDamage" name="projectileDamage" type="number" step="0.1" required />
            <small class="gf-help">Damage dealt by enemy bullets.</small>
          </label>
          <label class="gf-form__field">
            <span>Collision Damage</span>
            <input id="enemyCollisionDamage" name="collisionDamage" type="number" step="0.1" required />
            <small class="gf-help">Damage when colliding with the player.</small>
          </label>
        </div>
      </div>
      <div class="gf-form__actions">
        <button type="button" class="gf-button gf-button--danger" id="enemyDelete">Delete Enemy</button>
      </div>
    </form>
  `;

  return {
    container,
    cards: container.querySelector('#enemyCards') as HTMLElement,
    form: container.querySelector('#enemyForm') as HTMLFormElement,
    typeInput: container.querySelector('#enemyType') as HTMLInputElement,
    speedInput: container.querySelector('#enemySpeed') as HTMLInputElement,
    sizeInput: container.querySelector('#enemySize') as HTMLInputElement,
    pointsInput: container.querySelector('#enemyPoints') as HTMLInputElement,
    shootIntervalInput: container.querySelector('#enemyShootInterval') as HTMLInputElement,
    projectileDamageInput: container.querySelector('#enemyProjectileDamage') as HTMLInputElement,
    collisionDamageInput: container.querySelector('#enemyCollisionDamage') as HTMLInputElement,
    deleteButton: container.querySelector('#enemyDelete') as HTMLButtonElement,
  };
};

let elements: EnemyEditorElements | null = null;
let selectedType: string | null = null;

const renderEnemyCards = (enemies: EnemyConfig[]): void => {
  if (!elements) {
    return;
  }
  elements.cards.innerHTML = '';
  enemies.forEach((enemy) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'gf-card';
    if (enemy.type === selectedType) card.classList.add('gf-card--active');
    card.innerHTML = `
      <div class="gf-card__header">
        <span class="gf-card__title">${enemy.type}</span>
        <span class="gf-card__tag">${enemy.points} pts</span>
      </div>
      <div class="gf-card__meta">
        <span>spd ${enemy.speed}</span>
        <span>sz ${enemy.size}</span>
        <span>int ${enemy.shootInterval}</span>
      </div>
    `;
    card.addEventListener('click', () => {
      selectedType = enemy.type;
      populateForm(enemy);
      renderEnemyCards(enemies);
    });
    elements?.cards.appendChild(card);
  });
};

const populateForm = (enemy: EnemyConfig): void => {
  if (!elements) {
    return;
  }
  elements.typeInput.value = enemy.type;
  elements.speedInput.value = String(enemy.speed);
  elements.sizeInput.value = String(enemy.size);
  elements.pointsInput.value = String(enemy.points);
  elements.shootIntervalInput.value = String(enemy.shootInterval);
  elements.projectileDamageInput.value = String(enemy.projectileDamage);
  elements.collisionDamageInput.value = String(enemy.collisionDamage);
};

const readForm = (): EnemyConfig | null => {
  if (!elements) {
    return null;
  }
  const type = elements.typeInput.value.trim();
  if (!type) {
    return null;
  }
  return {
    type,
    speed: Number(elements.speedInput.value),
    size: Number(elements.sizeInput.value),
    points: Number(elements.pointsInput.value),
    shootInterval: Number(elements.shootIntervalInput.value),
    projectileDamage: Number(elements.projectileDamageInput.value),
    collisionDamage: Number(elements.collisionDamageInput.value),
  };
};

const applyForm = (): void => {
  const enemy = readForm();
  if (!enemy) {
    return;
  }
  const config = dashboardState.config;
  if (!config) {
    return;
  }
  const others = config.enemies.filter((e) => e.type !== selectedType && e.type !== enemy.type);
  const updatedEnemies = [...others, enemy];
  actions.setConfig({ ...config, enemies: updatedEnemies });
  selectedType = enemy.type;
};

const handleDelete = (): void => {
  if (!elements || !selectedType) {
    return;
  }
  const config = dashboardState.config;
  if (!config) {
    return;
  }
  const remainingEnemies = config.enemies.filter((enemy) => enemy.type !== selectedType);
  actions.setConfig({ ...config, enemies: remainingEnemies });
  selectedType = remainingEnemies[0]?.type ?? null;
  if (selectedType) {
    const nextEnemy = remainingEnemies.find((enemy) => enemy.type === selectedType);
    if (nextEnemy) {
      populateForm(nextEnemy);
    }
  }
};

const bindEvents = (): void => {
  if (!elements) {
    return;
  }
  elements.form.addEventListener('input', applyForm);
  elements.form.addEventListener('change', applyForm);
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    applyForm();
  });
  elements.deleteButton.addEventListener('click', handleDelete);

  const addButton = document.getElementById('enemyAdd');
  addButton?.addEventListener('click', () => {
    selectedType = null;
    elements?.form.reset();
    elements?.typeInput.focus();
  });
};

const updateEditor: DashboardSubscriber['notify'] = (snapshot) => {
  if (!elements) {
    return;
  }
  if (!snapshot.config) {
    return;
  }
  if (!selectedType && snapshot.config.enemies.length > 0) {
    selectedType = snapshot.config.enemies[0].type;
  }

  renderEnemyCards(snapshot.config.enemies);
  if (selectedType) {
    const activeEnemy = snapshot.config.enemies.find((enemy) => enemy.type === selectedType);
    if (activeEnemy) {
      populateForm(activeEnemy);
    }
  }
};

export const initializeEnemyEditor = (): void => {
  elements = createElements();
  if (!elements) {
    return;
  }
  bindEvents();

  const subscriber: DashboardSubscriber = {
    id: 'enemy-editor',
    notify: updateEditor,
  };
  subscribe(subscriber);

  const config = dashboardState.config;
  if (config && config.enemies.length > 0) {
    selectedType = config.enemies[0].type;
    renderEnemyCards(config.enemies);
    populateForm(config.enemies[0]);
  }
};
