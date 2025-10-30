import { dashboardState, subscribe } from '../state';
import type { DashboardSubscriber } from '../types';

const containerId = 'documentationView';

const renderDocumentation = (): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="gf-docs">
      <div class="gf-docs__section">
        <h3>Configuration Parameter Documentation</h3>
        <p>Complete documentation of all configuration parameters is available in the project documentation.</p>
        <p><strong>Location:</strong> <code>docs/dashboard/config-parameters.md</code></p>
        <p>This guide includes:</p>
        <ul>
          <li>All ship configuration parameters</li>
          <li>Projectile settings and effects</li>
          <li>Enemy type configurations</li>
          <li>Game settings and spawn rates</li>
          <li>Parameter relationships and best practices</li>
          <li>Configuration examples for different scenarios</li>
        </ul>
      </div>
      
      <div class="gf-docs__section">
        <h3>Quick Reference</h3>
        <div class="gf-docs__quickref">
          <h4>Ship Configuration</h4>
          <ul>
            <li><strong>maxSpeed</strong>: Maximum ship velocity (pixels per frame)</li>
            <li><strong>thrust</strong>: Acceleration per frame</li>
            <li><strong>maxHealth</strong>: Starting hit points</li>
            <li><strong>afterburnerBoost</strong>: Speed multiplier when boosting</li>
          </ul>
          
          <h4>Projectile Settings</h4>
          <ul>
            <li><strong>speed</strong>: Projectile velocity</li>
            <li><strong>life</strong>: Lifetime in frames</li>
            <li><strong>cooldown</strong>: Frames between shots</li>
            <li><strong>fanShotCount</strong>: Number of projectiles in spread</li>
          </ul>
          
          <h4>Game Settings</h4>
          <ul>
            <li><strong>scoreToLevelUp</strong>: Points needed per level</li>
            <li><strong>minSpawnInterval / maxSpawnInterval</strong>: Enemy spawn timing</li>
            <li><strong>spawnRatePerLevelFactor</strong>: Difficulty scaling per level</li>
          </ul>
        </div>
      </div>
      
      <div class="gf-docs__section">
        <h3>Testing Tools</h3>
        <p>The Testing Tools tab provides:</p>
        <ul>
          <li><strong>Live Game Preview</strong>: Embedded game instance for real-time testing</li>
          <li><strong>Scenario Controls</strong>: Spawn enemies and manipulate game state</li>
          <li><strong>Performance Metrics</strong>: Real-time FPS and object counts</li>
          <li><strong>Debug Overlays</strong>: Visual debugging tools</li>
        </ul>
      </div>
      
      <div class="gf-docs__section">
        <h3>Best Practices</h3>
        <ul>
          <li>Always test configuration changes in the preview before deploying</li>
          <li>Use backups before making major changes</li>
          <li>Adjust parameters incrementally to understand their effects</li>
          <li>Monitor performance metrics when changing spawn rates</li>
          <li>Validate configuration before saving or deploying</li>
        </ul>
      </div>
    </div>
  `;
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

