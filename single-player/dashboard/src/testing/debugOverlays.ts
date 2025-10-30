import { showToast } from '../toast';

const containerId = 'debugControls';
const iframeId = 'gamePreviewFrame';

type DebugOverlayType = 'hitboxes' | 'paths' | 'collisions' | 'velocity' | 'spawnZones';

interface DebugOverlayState {
  readonly hitboxes: boolean;
  readonly paths: boolean;
  readonly collisions: boolean;
  readonly velocity: boolean;
  readonly spawnZones: boolean;
}

let overlayState: DebugOverlayState = {
  hitboxes: false,
  paths: false,
  collisions: false,
  velocity: false,
  spawnZones: false,
};

type DebugCommand =
  | { type: 'toggle-overlay'; payload: { overlay: DebugOverlayType; enabled: boolean } }
  | { type: 'set-overlays'; payload: DebugOverlayState };

const postCommand = (command: DebugCommand): void => {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
  if (!iframe?.contentWindow) {
    showToast({ 
      title: 'Preview not ready', 
      message: 'Start the live preview before enabling debug overlays.', 
      variant: 'error' 
    });
    return;
  }
  iframe.contentWindow.postMessage(command, '*');
};

const toggleOverlay = (overlay: DebugOverlayType): void => {
  overlayState = {
    ...overlayState,
    [overlay]: !overlayState[overlay],
  };
  postCommand({ type: 'toggle-overlay', payload: { overlay, enabled: overlayState[overlay] } });
  renderControls();
};

const setAllOverlays = (enabled: boolean): void => {
  overlayState = {
    hitboxes: enabled,
    paths: enabled,
    collisions: enabled,
    velocity: enabled,
    spawnZones: enabled,
  };
  postCommand({ type: 'set-overlays', payload: overlayState });
  renderControls();
};

const renderControls = (): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  const allEnabled = Object.values(overlayState).every(v => v);
  const anyEnabled = Object.values(overlayState).some(v => v);

  container.innerHTML = `
    <div class="gf-debug-overlays">
      <div class="gf-debug-overlays__header">
        <div class="gf-debug-overlays__info">
          <p>Toggle visual debug overlays to inspect game state. Changes apply immediately to the preview.</p>
        </div>
        <div class="gf-debug-overlays__global">
          <button 
            id="debugAllBtn" 
            class="gf-button ${allEnabled ? 'gf-button--danger' : 'gf-button--secondary'}" 
            type="button"
          >
            ${allEnabled ? 'Disable All' : 'Enable All'}
          </button>
        </div>
      </div>
      
      <div class="gf-debug-overlays__grid">
        <label class="gf-debug-overlay-toggle">
          <input 
            type="checkbox" 
            id="debugHitboxes" 
            ${overlayState.hitboxes ? 'checked' : ''}
          />
          <span class="gf-debug-overlay-toggle__label">
            <strong>Hitboxes</strong>
            <small>Show collision boundaries for all game objects</small>
          </span>
        </label>
        
        <label class="gf-debug-overlay-toggle">
          <input 
            type="checkbox" 
            id="debugPaths" 
            ${overlayState.paths ? 'checked' : ''}
          />
          <span class="gf-debug-overlay-toggle__label">
            <strong>Movement Paths</strong>
            <small>Visualize enemy movement trajectories</small>
          </span>
        </label>
        
        <label class="gf-debug-overlay-toggle">
          <input 
            type="checkbox" 
            id="debugCollisions" 
            ${overlayState.collisions ? 'checked' : ''}
          />
          <span class="gf-debug-overlay-toggle__label">
            <strong>Collision Events</strong>
            <small>Highlight collision detection events</small>
          </span>
        </label>
        
        <label class="gf-debug-overlay-toggle">
          <input 
            type="checkbox" 
            id="debugVelocity" 
            ${overlayState.velocity ? 'checked' : ''}
          />
          <span class="gf-debug-overlay-toggle__label">
            <strong>Velocity Vectors</strong>
            <small>Show velocity and direction for moving objects</small>
          </span>
        </label>
        
        <label class="gf-debug-overlay-toggle">
          <input 
            type="checkbox" 
            id="debugSpawnZones" 
            ${overlayState.spawnZones ? 'checked' : ''}
          />
          <span class="gf-debug-overlay-toggle__label">
            <strong>Spawn Zones</strong>
            <small>Display enemy spawn areas and boundaries</small>
          </span>
        </label>
      </div>
      
      ${anyEnabled ? `
        <div class="gf-debug-overlays__footer">
          <small>Debug overlays active. Performance may be slightly impacted.</small>
        </div>
      ` : ''}
    </div>
  `;

  // Attach event listeners
  const hitboxesCheck = container.querySelector<HTMLInputElement>('#debugHitboxes');
  const pathsCheck = container.querySelector<HTMLInputElement>('#debugPaths');
  const collisionsCheck = container.querySelector<HTMLInputElement>('#debugCollisions');
  const velocityCheck = container.querySelector<HTMLInputElement>('#debugVelocity');
  const spawnZonesCheck = container.querySelector<HTMLInputElement>('#debugSpawnZones');
  const allBtn = container.querySelector('#debugAllBtn');

  hitboxesCheck?.addEventListener('change', () => toggleOverlay('hitboxes'));
  pathsCheck?.addEventListener('change', () => toggleOverlay('paths'));
  collisionsCheck?.addEventListener('change', () => toggleOverlay('collisions'));
  velocityCheck?.addEventListener('change', () => toggleOverlay('velocity'));
  spawnZonesCheck?.addEventListener('change', () => toggleOverlay('spawnZones'));
  allBtn?.addEventListener('click', () => setAllOverlays(!allEnabled));
};

export const initializeDebugOverlays = (): void => {
  renderControls();
};

