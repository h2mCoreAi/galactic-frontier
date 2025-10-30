import { dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, EnemyConfig } from '../types';

const previewContainerId = 'enemyPreview';

const getContainer = (): HTMLElement | null => document.getElementById(previewContainerId);

const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const drawEnemy = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  speed: number,
): void => {
  // Draw enemy circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw speed indicator (arrows)
  const arrowCount = Math.min(Math.max(Math.floor(speed), 1), 5);
  for (let i = 0; i < arrowCount; i++) {
    const angle = (i / arrowCount) * Math.PI * 2;
    const arrowX = x + Math.cos(angle) * (size + 8);
    const arrowY = y + Math.sin(angle) * (size + 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 3, arrowY - 3);
    ctx.lineTo(arrowX + 3, arrowY - 3);
    ctx.closePath();
    ctx.fill();
  }
};

const renderEnemyPreview = (enemy: EnemyConfig, container: HTMLElement): void => {
  const canvas = createCanvas(200, 180);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  // Set up canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw enemy in center
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 - 20;
  const color = enemy.type === 'small' ? '#3f8cff' : enemy.type === 'medium' ? '#ffa502' : '#ff4757';
  
  drawEnemy(ctx, centerX, centerY, Math.min(enemy.size * 2, 40), color, enemy.speed);

  // Draw stats below
  ctx.fillStyle = 'rgba(230, 241, 255, 0.9)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  
  const stats = [
    `Points: ${enemy.points}`,
    `Dmg: ${enemy.projectileDamage.toFixed(1)}`,
    `Collision: ${enemy.collisionDamage.toFixed(1)}`,
    `Fire: ${enemy.shootInterval}f`,
  ];
  
  stats.forEach((stat, i) => {
    ctx.fillText(stat, centerX, centerY + enemy.size + 30 + (i * 14));
  });

  container.appendChild(canvas);
};

const renderComparison = (enemies: EnemyConfig[], container: HTMLElement): void => {
  container.innerHTML = '';
  
  const canvas = createCanvas(600, 200);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw all enemies side by side
  const enemyCount = enemies.length;
  const spacing = canvas.width / (enemyCount + 1);
  const baseY = canvas.height / 2;

  enemies.forEach((enemy, index) => {
    const x = spacing * (index + 1);
    const color = enemy.type === 'small' ? '#3f8cff' : enemy.type === 'medium' ? '#ffa502' : '#ff4757';
    const scale = Math.min(Math.max(enemy.size, 5), 30);
    
    drawEnemy(ctx, x, baseY, scale, color, enemy.speed);
    
    // Label
    ctx.fillStyle = 'rgba(230, 241, 255, 0.9)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.type.toUpperCase(), x, baseY + scale + 25);
    
    // Stats
    ctx.font = '10px sans-serif';
    ctx.fillText(`${enemy.points}p`, x, baseY + scale + 40);
    ctx.fillText(`Size: ${enemy.size}`, x, baseY + scale + 54);
  });

  container.appendChild(canvas);
};

const render = (enemies: EnemyConfig[]): void => {
  const container = getContainer();
  if (!container) {
    return;
  }

  if (enemies.length === 0) {
    container.innerHTML = '<p>No enemies configured. Add an enemy type to see preview.</p>';
    return;
  }

  container.innerHTML = `
    <div class="gf-enemy-preview">
      <h4>Enemy Preview</h4>
      <div class="gf-enemy-preview__grid">
        ${enemies.map((enemy) => `
          <div class="gf-enemy-preview__item">
            <div class="gf-enemy-preview__canvas" data-enemy-type="${enemy.type}"></div>
            <div class="gf-enemy-preview__info">
              <strong>${enemy.type}</strong>
              <div class="gf-enemy-preview__stats">
                <span>Size: ${enemy.size}</span>
                <span>Speed: ${enemy.speed}</span>
                <span>Points: ${enemy.points}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="gf-enemy-preview__comparison">
        <h4>Size Comparison</h4>
        <div id="enemyComparisonCanvas"></div>
      </div>
    </div>
  `;

  // Render individual previews
  enemies.forEach((enemy) => {
    const canvasContainer = container.querySelector(`[data-enemy-type="${enemy.type}"]`);
    if (canvasContainer) {
      renderEnemyPreview(enemy, canvasContainer as HTMLElement);
    }
  });

  // Render comparison
  const comparisonContainer = container.querySelector('#enemyComparisonCanvas');
  if (comparisonContainer) {
    renderComparison(enemies, comparisonContainer as HTMLElement);
  }
};

const onState: DashboardSubscriber['notify'] = (snapshot) => {
  if (snapshot.config?.enemies) {
    render(snapshot.config.enemies);
  }
};

export const initializeEnemyPreview = (): void => {
  // Add preview container to enemy editor
  const enemyEditor = document.getElementById('enemyEditor');
  if (enemyEditor && !document.getElementById(previewContainerId)) {
    const previewDiv = document.createElement('div');
    previewDiv.id = previewContainerId;
    previewDiv.className = 'gf-enemy-preview-container';
    enemyEditor.appendChild(previewDiv);
  }

  const sub: DashboardSubscriber = { id: 'enemy-preview', notify: onState };
  subscribe(sub);
  
  if (dashboardState.config?.enemies) {
    render(dashboardState.config.enemies);
  }
};

