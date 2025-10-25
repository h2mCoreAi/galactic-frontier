import { actions, dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, EnemyConfig } from '../types';

interface EnemyEditorElements {
  readonly container: HTMLElement;
  readonly list: HTMLElement;
  readonly form: HTMLFormElement;
  readonly typeInput: HTMLInputElement;
  readonly speedInput: HTMLInputElement;
  readonly sizeInput: HTMLInputElement;
  readonly pointsInput: HTMLInputElement;
  readonly shootIntervalInput: HTMLInputElement;
  readonly projectileDamageInput: HTMLInputElement;
  readonly collisionDamageInput: HTMLInputElement;
  readonly submitButton: HTMLButtonElement;
  readonly deleteButton: HTMLButtonElement;
}

const createElements = (): EnemyEditorElements | null => {
  const container = document.getElementById('enemyEditor');
  if (!container) {
    return null;
  }

  container.innerHTML = `
    <div class="gf-list-panel">
      <div class="gf-list-panel__header">
        <h3>Enemy Types</h3>
        <button type="button" class="gf-button gf-button--secondary" id="enemyAdd">New Enemy Type</button>
      </div>
      <div id="enemyList" class="gf-list-panel__list" role="list"></div>
    </div>
    <form id="enemyForm" class="gf-form" autocomplete="off">
      <div class="gf-form__row">
        <label class="gf-form__field">
          <span>Type</span>
          <input id="enemyType" name="type" required />
        </label>
        <label class="gf-form__field">
          <span>Speed</span>
          <input id="enemySpeed" name="speed" type="number" step="0.1" required />
        </label>
        <label class="gf-form__field">
          <span>Size</span>
          <input id="enemySize" name="size" type="number" step="1" required />
        </label>
      </div>
      <div class="gf-form__row">
        <label class="gf-form__field">
          <span>Points</span>
          <input id="enemyPoints" name="points" type="number" step="1" required />
        </label>
        <label class="gf-form__field">
          <span>Shoot Interval (frames)</span>
          <input id="enemyShootInterval" name="shootInterval" type="number" step="1" required />
        </label>
      </div>
      <div class="gf-form__row">
        <label class="gf-form__field">
          <span>Projectile Damage</span>
          <input id="enemyProjectileDamage" name="projectileDamage" type="number" step="0.1" required />
        </label>
        <label class="gf-form__field">
          <span>Collision Damage</span>
          <input id="enemyCollisionDamage" name="collisionDamage" type="number" step="0.1" required />
        </label>
      </div>
      <div class="gf-form__actions">
        <button type="submit" class="gf-button gf-button--primary" id="enemySubmit">Save Enemy</button>
        <button type="button" class="gf-button gf-button--danger" id="enemyDelete">Delete Enemy</button>
      </div>
    </form>
  `;

  return {
    container,
    list: container.querySelector('#enemyList') as HTMLElement,
    form: container.querySelector('#enemyForm') as HTMLFormElement,
    typeInput: container.querySelector('#enemyType') as HTMLInputElement,
    speedInput: container.querySelector('#enemySpeed') as HTMLInputElement,
    sizeInput: container.querySelector('#enemySize') as HTMLInputElement,
    pointsInput: container.querySelector('#enemyPoints') as HTMLInputElement,
    shootIntervalInput: container.querySelector('#enemyShootInterval') as HTMLInputElement,
    projectileDamageInput: container.querySelector('#enemyProjectileDamage') as HTMLInputElement,
    collisionDamageInput: container.querySelector('#enemyCollisionDamage') as HTMLInputElement,
    submitButton: container.querySelector('#enemySubmit') as HTMLButtonElement,
    deleteButton: container.querySelector('#enemyDelete') as HTMLButtonElement,
  };
};

let elements: EnemyEditorElements | null = null;
let selectedType: string | null = null;

const renderEnemyList = (enemies: EnemyConfig[]): void => {
  if (!elements) {
    return;
  }
  elements.list.innerHTML = '';
  enemies.forEach((enemy) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'gf-list-item';
    item.dataset.type = enemy.type;
    item.textContent = `${enemy.type} (${enemy.points} pts)`;
    if (enemy.type === selectedType) {
      item.classList.add('gf-list-item--active');
    }
    item.addEventListener('click', () => {
      selectedType = enemy.type;
      populateForm(enemy);
      renderEnemyList(enemies);
    });
    elements?.list.appendChild(item);
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

const handleSubmit = (event: Event): void => {
  event.preventDefault();
  const enemy = readForm();
  if (!enemy) {
    return;
  }
  const config = dashboardState.config;
  if (!config) {
    return;
  }

  const updatedEnemies = config.enemies.some((e) => e.type === enemy.type)
    ? config.enemies.map((existing) => (existing.type === enemy.type ? enemy : existing))
    : [...config.enemies, enemy];

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
  elements.form.addEventListener('submit', handleSubmit);
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

  renderEnemyList(snapshot.config.enemies);
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
    renderEnemyList(config.enemies);
    populateForm(config.enemies[0]);
  }
};
