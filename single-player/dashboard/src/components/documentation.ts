import { dashboardState, subscribe } from '../state';
import type { DashboardSubscriber } from '../types';

const containerId = 'documentationView';

interface ParameterDoc {
  readonly path: string;
  readonly name: string;
  readonly category: 'ship' | 'projectile' | 'enemy' | 'game';
  readonly type: string;
  readonly default?: string;
  readonly range?: string;
  readonly description: string;
  readonly effect: string;
  readonly recommendedRange?: string;
}

const PARAMETERS: readonly ParameterDoc[] = [
  // Ship parameters
  { path: 'ship.maxSpeed', name: 'maxSpeed', category: 'ship', type: 'number', default: '6', range: '> 0', description: 'Maximum velocity of the player ship in pixels per frame', effect: 'Higher values make the ship move faster, improving maneuverability but potentially making control more difficult', recommendedRange: '4-10' },
  { path: 'ship.thrust', name: 'thrust', category: 'ship', type: 'number', default: '0.1', range: '> 0', description: 'Acceleration per frame applied when moving', effect: 'Higher values allow the ship to reach max speed faster. Lower values create more gradual acceleration', recommendedRange: '0.05-0.2' },
  { path: 'ship.size', name: 'size', category: 'ship', type: 'number', default: '20', range: '> 0', description: 'Collision radius in pixels', effect: 'Larger size makes the ship easier to hit by enemies and projectiles, but also easier to hit enemies', recommendedRange: '15-30' },
  { path: 'ship.maxHealth', name: 'maxHealth', category: 'ship', type: 'number', default: '100', range: '> 0', description: 'Maximum hit points before game over', effect: 'Higher values increase survivability and allow more mistakes', recommendedRange: '50-200' },
  { path: 'ship.afterburnerBoost', name: 'afterburnerBoost', category: 'ship', type: 'number (optional)', default: '2', range: '> 1', description: 'Speed multiplier applied when afterburner is active', effect: 'Higher values provide greater speed boost during boost, consuming energy faster', recommendedRange: '1.5-3' },
  { path: 'ship.afterburnerMax', name: 'afterburnerMax', category: 'ship', type: 'number', default: '100', range: '> 0', description: 'Maximum afterburner energy capacity', effect: 'Higher values allow longer boost duration before depletion', recommendedRange: '50-200' },
  { path: 'ship.afterburnerDepleteRate', name: 'afterburnerDepleteRate', category: 'ship', type: 'number', default: '1', range: '> 0', description: 'Energy consumed per frame when boosting', effect: 'Higher values deplete boost faster, limiting boost duration', recommendedRange: '0.5-2' },
  { path: 'ship.afterburnerRegenRate', name: 'afterburnerRegenRate', category: 'ship', type: 'number', default: '0.5', range: '> 0', description: 'Energy recovered per frame when not boosting', effect: 'Higher values allow faster recovery between boosts', recommendedRange: '0.25-1' },
  
  // Projectile parameters
  { path: 'projectiles.speed', name: 'speed', category: 'projectile', type: 'number', default: '10', range: '> 0', description: 'Projectile velocity in pixels per frame', effect: 'Higher values make projectiles travel faster, improving hit rate but potentially making aim more difficult', recommendedRange: '8-15' },
  { path: 'projectiles.life', name: 'life', category: 'projectile', type: 'number', default: '100', range: '> 0', description: 'Lifetime of projectiles in frames before despawning', effect: 'Higher values allow projectiles to travel further, improving long-range accuracy', recommendedRange: '60-150' },
  { path: 'projectiles.cooldown', name: 'cooldown', category: 'projectile', type: 'number', default: '10', range: '> 0', description: 'Frames between allowed shots', effect: 'Lower values increase fire rate, improving DPS but potentially overwhelming the player', recommendedRange: '5-20' },
  { path: 'projectiles.fanShotCount', name: 'fanShotCount', category: 'projectile', type: 'number', default: '10', range: '> 0', description: 'Number of projectiles fired simultaneously in fan-shot mode', effect: 'Higher values create wider spread, improving area coverage but reducing single-target damage', recommendedRange: '5-15' },
  { path: 'projectiles.fanShotAngle', name: 'fanShotAngle', category: 'projectile', type: 'number', default: '0.1047 (~6 degrees)', range: '> 0', description: 'Spread angle in radians for fan-shot mode', effect: 'Larger angles create wider spread pattern', recommendedRange: '0.05-0.2 (3-12 degrees)' },
  
  // Enemy parameters
  { path: 'enemies[].type', name: 'type', category: 'enemy', type: 'string', description: 'Unique identifier for the enemy type (e.g., "small", "medium", "large")', effect: 'Must be unique across all enemy definitions' },
  { path: 'enemies[].speed', name: 'speed', category: 'enemy', type: 'number', range: '> 0', description: 'Movement speed in pixels per frame', effect: 'Higher values make enemies move faster, increasing difficulty' },
  { path: 'enemies[].size', name: 'size', category: 'enemy', type: 'number', range: '> 0', description: 'Collision radius in pixels', effect: 'Larger enemies are easier to hit but harder to avoid' },
  { path: 'enemies[].hitboxSize', name: 'hitboxSize', category: 'enemy', type: 'number (optional)', range: '> 0', description: 'Separate hitbox radius if different from visual size', effect: 'Allows fine-tuning collision detection independent of visual representation' },
  { path: 'enemies[].points', name: 'points', category: 'enemy', type: 'number', range: '> 0', description: 'Score awarded when enemy is destroyed', effect: 'Higher values make enemies more valuable targets' },
  { path: 'enemies[].shootInterval', name: 'shootInterval', category: 'enemy', type: 'number', range: '> 0', description: 'Frames between enemy shots', effect: 'Lower values make enemies shoot more frequently, increasing threat level', recommendedRange: '30-120' },
  { path: 'enemies[].projectileDamage', name: 'projectileDamage', category: 'enemy', type: 'number', range: '> 0', description: 'Damage dealt by enemy projectiles', effect: 'Higher values make enemy shots more dangerous' },
  { path: 'enemies[].collisionDamage', name: 'collisionDamage', category: 'enemy', type: 'number', range: '> 0', description: 'Damage dealt when colliding with player ship', effect: 'Higher values punish collisions more severely' },
  
  // Game parameters
  { path: 'game.scoreToLevelUp', name: 'scoreToLevelUp', category: 'game', type: 'number', default: '250', range: '> 0', description: 'Score required to advance to next level', effect: 'Higher values slow progression, lower values speed it up', recommendedRange: '200-500' },
  { path: 'game.minSpawnInterval', name: 'minSpawnInterval', category: 'game', type: 'number', default: '60', range: '> 0', description: 'Minimum frames between enemy spawns', effect: 'Lower values spawn enemies more frequently, increasing difficulty', recommendedRange: '40-400' },
  { path: 'game.maxSpawnInterval', name: 'maxSpawnInterval', category: 'game', type: 'number', default: '300', range: '> 0', description: 'Maximum frames between enemy spawns', effect: 'Lower values spawn enemies more frequently, increasing difficulty', recommendedRange: '40-400' },
  { path: 'game.minHealthSpawnInterval', name: 'minHealthSpawnInterval', category: 'game', type: 'number', default: '300', range: '> 0', description: 'Minimum frames between health power-up spawns', effect: 'Controls how often players can recover health', recommendedRange: '200-800' },
  { path: 'game.maxHealthSpawnInterval', name: 'maxHealthSpawnInterval', category: 'game', type: 'number', default: '600', range: '> 0', description: 'Maximum frames between health power-up spawns', effect: 'Controls how often players can recover health', recommendedRange: '200-800' },
  { path: 'game.healthPowerUpValue', name: 'healthPowerUpValue', category: 'game', type: 'number', default: '10', range: '> 0', description: 'Health restored when collecting health power-up', effect: 'Higher values provide more recovery per pickup' },
  { path: 'game.minFanShotSpawnInterval', name: 'minFanShotSpawnInterval', category: 'game', type: 'number', default: '600', range: '> 0', description: 'Minimum frames between fan-shot power-up spawns', effect: 'Controls frequency of powerful fan-shot mode availability', recommendedRange: '400-1600' },
  { path: 'game.maxFanShotSpawnInterval', name: 'maxFanShotSpawnInterval', category: 'game', type: 'number', default: '1200', range: '> 0', description: 'Maximum frames between fan-shot power-up spawns', effect: 'Controls frequency of powerful fan-shot mode availability', recommendedRange: '400-1600' },
  { path: 'game.fanShotDuration', name: 'fanShotDuration', category: 'game', type: 'number', default: '600', range: '> 0', description: 'Duration of fan-shot power-up in frames', effect: 'Longer duration provides more time to clear enemies', recommendedRange: '300-900' },
  { path: 'game.maxEnemies', name: 'maxEnemies', category: 'game', type: 'number (optional)', default: '50', range: '> 0', description: 'Maximum number of enemies active simultaneously', effect: 'Caps enemy count to prevent performance issues and overwhelming gameplay', recommendedRange: '30-100' },
  { path: 'game.enemyTypeWeights', name: 'enemyTypeWeights', category: 'game', type: 'object (optional)', default: '{ small: 0.5, medium: 0.3, large: 0.2 }', description: 'Relative spawn probability weights for each enemy type', effect: 'Controls enemy variety - higher weights = more frequent spawns' },
  { path: 'game.spawnRatePerLevelFactor', name: 'spawnRatePerLevelFactor', category: 'game', type: 'number (optional)', default: '0.9', range: '0 < value <= 1', description: 'Multiplier applied to spawn intervals per level', effect: 'Values < 1 make enemies spawn faster as levels increase' },
  { path: 'game.minSpawnRateClamp', name: 'minSpawnRateClamp', category: 'game', type: 'number (optional)', default: '0.3', range: '0 < value <= 1', description: 'Minimum spawn rate factor (prevents spawn rate from becoming too fast)', effect: 'Caps maximum spawn frequency increase from level scaling' },
  { path: 'game.levelScaling.enemySpeedPerLevel', name: 'enemySpeedPerLevel', category: 'game', type: 'number (optional)', default: '1.05', range: '> 0', description: 'Multiplier for enemy speed per level', effect: 'Values > 1 make enemies faster each level (5% increase per level)' },
  { path: 'game.levelScaling.projectileDamagePerLevel', name: 'projectileDamagePerLevel', category: 'game', type: 'number (optional)', default: '1.1', range: '> 0', description: 'Multiplier for enemy projectile damage per level', effect: 'Values > 1 make enemy shots more dangerous each level (10% increase)' },
  { path: 'game.levelScaling.collisionDamagePerLevel', name: 'collisionDamagePerLevel', category: 'game', type: 'number (optional)', default: '1.15', range: '> 0', description: 'Multiplier for collision damage per level', effect: 'Values > 1 make collisions more punishing each level (15% increase)' },
] as const;

const CATEGORY_LABELS: Record<ParameterDoc['category'], string> = {
  ship: 'Ship',
  projectile: 'Projectile',
  enemy: 'Enemy',
  game: 'Game',
};

const renderParameterCard = (param: ParameterDoc): string => `
  <div class="gf-docs-param" data-category="${param.category}" data-path="${param.path}">
    <div class="gf-docs-param__header">
      <h4 class="gf-docs-param__name">${param.path}</h4>
      <span class="gf-docs-param__category">${CATEGORY_LABELS[param.category]}</span>
    </div>
    <div class="gf-docs-param__body">
      <div class="gf-docs-param__meta">
        <span class="gf-docs-param__type">Type: <code>${param.type}</code></span>
        ${param.default ? `<span class="gf-docs-param__default">Default: <code>${param.default}</code></span>` : ''}
        ${param.range ? `<span class="gf-docs-param__range">Range: <code>${param.range}</code></span>` : ''}
        ${param.recommendedRange ? `<span class="gf-docs-param__recommended">Recommended: <code>${param.recommendedRange}</code></span>` : ''}
      </div>
      <div class="gf-docs-param__description">
        <p><strong>Description:</strong> ${param.description}</p>
        <p><strong>Effect:</strong> ${param.effect}</p>
      </div>
    </div>
  </div>
`;

const filterParameters = (searchTerm: string, categoryFilter: string): ParameterDoc[] => {
  const searchLower = searchTerm.toLowerCase().trim();
  const categoryLower = categoryFilter.toLowerCase();
  
  return PARAMETERS.filter((param) => {
    const matchesSearch = !searchLower || 
      param.path.toLowerCase().includes(searchLower) ||
      param.name.toLowerCase().includes(searchLower) ||
      param.description.toLowerCase().includes(searchLower) ||
      param.effect.toLowerCase().includes(searchLower) ||
      (param.type && param.type.toLowerCase().includes(searchLower));
    
    const matchesCategory = !categoryLower || categoryLower === 'all' || param.category === categoryLower;
    
    return matchesSearch && matchesCategory;
  });
};

let currentCategory: string = 'all';

const showCategoryTab = (category: string): void => {
  currentCategory = category;
  
  // Update tab buttons
  const tabs = document.querySelectorAll('.gf-docs-tabs__tab');
  tabs.forEach((tab) => {
    const tabCategory = tab.getAttribute('data-docs-category');
    const isActive = tabCategory === category;
    tab.setAttribute('aria-selected', String(isActive));
    tab.classList.toggle('gf-docs-tabs__tab--active', isActive);
  });
  
  // Re-render with new category
  renderDocumentation();
};

const renderDocumentation = (): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  const searchInput = container.querySelector<HTMLInputElement>('#docsSearch');
  const searchTerm = searchInput?.value || '';
  const categoryFilter = currentCategory;
  
  const filteredParams = filterParameters(searchTerm, categoryFilter);

  container.innerHTML = `
    <div class="gf-docs">
      <div class="gf-docs__header">
        <h2>Configuration Parameter Documentation</h2>
        <p>Complete reference for all config.json parameters. Search and filter to find what you need.</p>
      </div>
      
      <div class="gf-docs__filters">
        <div class="gf-docs__search">
          <label for="docsSearch" class="gf-form__field">
            <span>Search Parameters</span>
            <input 
              id="docsSearch" 
              type="text" 
              placeholder="Search by name, path, description..." 
              value="${searchTerm}"
              autocomplete="off"
            />
          </label>
        </div>
      </div>
      
      <div class="gf-docs-tabs">
        <nav class="gf-docs-tabs__nav" role="tablist" aria-label="Documentation categories">
          <button 
            class="gf-docs-tabs__tab ${categoryFilter === 'all' ? 'gf-docs-tabs__tab--active' : ''}" 
            role="tab" 
            aria-selected="${categoryFilter === 'all'}"
            data-docs-category="all"
            type="button"
          >
            All
          </button>
          <button 
            class="gf-docs-tabs__tab ${categoryFilter === 'ship' ? 'gf-docs-tabs__tab--active' : ''}" 
            role="tab" 
            aria-selected="${categoryFilter === 'ship'}"
            data-docs-category="ship"
            type="button"
          >
            Ship
          </button>
          <button 
            class="gf-docs-tabs__tab ${categoryFilter === 'projectile' ? 'gf-docs-tabs__tab--active' : ''}" 
            role="tab" 
            aria-selected="${categoryFilter === 'projectile'}"
            data-docs-category="projectile"
            type="button"
          >
            Projectile
          </button>
          <button 
            class="gf-docs-tabs__tab ${categoryFilter === 'enemy' ? 'gf-docs-tabs__tab--active' : ''}" 
            role="tab" 
            aria-selected="${categoryFilter === 'enemy'}"
            data-docs-category="enemy"
            type="button"
          >
            Enemy
          </button>
          <button 
            class="gf-docs-tabs__tab ${categoryFilter === 'game' ? 'gf-docs-tabs__tab--active' : ''}" 
            role="tab" 
            aria-selected="${categoryFilter === 'game'}"
            data-docs-category="game"
            type="button"
          >
            Game
          </button>
        </nav>
      </div>
      
      <div class="gf-docs__results">
        <div class="gf-docs__results-header">
          <span>Found ${filteredParams.length} parameter${filteredParams.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="gf-docs__params-grid">
          ${filteredParams.length > 0 
            ? filteredParams.map(renderParameterCard).join('')
            : '<p class="gf-docs__no-results">No parameters match your search criteria. Try different keywords or clear filters.</p>'
          }
        </div>
      </div>
      
      <div class="gf-docs__section">
        <h3>Parameter Relationships</h3>
        <div class="gf-docs__relationships">
          <h4>Difficulty Balance</h4>
          <ul>
            <li>Enemy speed vs. ship maxSpeed: Enemies should generally be slower or equal to ship speed for fair gameplay</li>
            <li>Enemy shootInterval vs. player cooldown: Enemy fire rate should be lower than player fire rate to maintain advantage</li>
            <li>Spawn intervals vs. enemy count: Faster spawns + high maxEnemies = intense gameplay</li>
          </ul>
          
          <h4>Performance Considerations</h4>
          <ul>
            <li>High projectile life + high projectile speed = more projectiles active simultaneously</li>
            <li>Low spawn intervals + high maxEnemies = more objects to render and update</li>
            <li>Level scaling factors compound quickly - moderate values (1.05-1.15) recommended</li>
          </ul>
          
          <h4>Gameplay Flow</h4>
          <ul>
            <li>scoreToLevelUp vs. enemy points: Controls how many enemies needed per level</li>
            <li>Power-up spawn rates vs. difficulty: More frequent power-ups = easier game</li>
            <li>Fan-shot duration vs. spawn intervals: Controls how many enemies can be cleared per power-up</li>
          </ul>
        </div>
      </div>
      
      <div class="gf-docs__section">
        <h3>Best Practices</h3>
        <ol>
          <li><strong>Start Conservative:</strong> Begin with defaults and adjust gradually</li>
          <li><strong>Test Incrementally:</strong> Change one parameter at a time to understand effects</li>
          <li><strong>Balance with Levels:</strong> Ensure level scaling doesn't make game too difficult too quickly</li>
          <li><strong>Consider Performance:</strong> Monitor FPS when increasing spawn rates or object counts</li>
          <li><strong>Player Feedback:</strong> Test with actual gameplay to ensure feel is right</li>
        </ol>
      </div>
    </div>
  `;
  
  // Attach event listeners
  const searchInputEl = container.querySelector<HTMLInputElement>('#docsSearch');
  const tabButtons = container.querySelectorAll('.gf-docs-tabs__tab');
  
  let searchTimeout: number | null = null;
  
  const updateSearch = (): void => {
    if (searchTimeout !== null) {
      window.clearTimeout(searchTimeout);
    }
    searchTimeout = window.setTimeout(() => {
      renderDocumentation();
    }, 300);
  };
  
  searchInputEl?.addEventListener('input', updateSearch);
  
  // Tab button click handlers
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.getAttribute('data-docs-category');
      if (category) {
        showCategoryTab(category);
      }
    });
  });
};

const updateDocumentation: DashboardSubscriber['notify'] = (snapshot) => {
  // Documentation is static, but we could update it based on current config if needed
  renderDocumentation();
};

export const initializeDocumentation = (): void => {
  const subscriber: DashboardSubscriber = {
    id: 'documentation',
    notify: updateDocumentation,
  };
  subscribe(subscriber);
  renderDocumentation();
};
