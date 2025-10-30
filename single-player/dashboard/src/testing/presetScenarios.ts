import { actions } from '../state';
import { showToast } from '../toast';
import type { GalacticFrontierConfig } from '../types';

const iframeId = 'gamePreviewFrame';

interface PresetScenario {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly actions: Array<{
    readonly type: 'set-level' | 'set-health' | 'set-score' | 'spawn-enemy' | 'spawn-wave' | 'clear-enemies' | 'pause' | 'resume';
    readonly payload?: number | { type?: string; count?: number };
  }>;
}

const PRESET_SCENARIOS: readonly PresetScenario[] = [
  {
    id: 'basic-test',
    name: 'Basic Test',
    description: 'Start with level 1, full health, clear enemies',
    actions: [
      { type: 'set-level', payload: 1 },
      { type: 'set-health', payload: 100 },
      { type: 'set-score', payload: 0 },
      { type: 'clear-enemies' },
      { type: 'resume' },
    ],
  },
  {
    id: 'stress-test',
    name: 'Stress Test',
    description: 'Spawn 20 enemies quickly to test performance',
    actions: [
      { type: 'clear-enemies' },
      { type: 'spawn-wave', payload: { count: 20 } },
    ],
  },
  {
    id: 'boss-fight',
    name: 'Boss Fight Simulation',
    description: 'Set to level 5, spawn 5 large enemies',
    actions: [
      { type: 'set-level', payload: 5 },
      { type: 'set-health', payload: 50 },
      { type: 'clear-enemies' },
      { type: 'spawn-wave', payload: { count: 5, type: 'large' } },
    ],
  },
  {
    id: 'accuracy-test',
    name: 'Accuracy Test',
    description: 'Spawn single enemies for aiming practice',
    actions: [
      { type: 'clear-enemies' },
      { type: 'spawn-enemy', payload: { type: 'small' } },
    ],
  },
];

const postCommand = (command: unknown): void => {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
  if (!iframe?.contentWindow) {
    showToast({ 
      title: 'Preview not ready', 
      message: 'Start the live preview before running scenarios.', 
      variant: 'error' 
    });
    return;
  }
  iframe.contentWindow.postMessage(command, '*');
};

const runScenario = (scenario: PresetScenario): void => {
  scenario.actions.forEach((action, index) => {
    window.setTimeout(() => {
      postCommand({ type: action.type, payload: action.payload });
    }, index * 100); // Stagger commands by 100ms
  });
  
  showToast({ 
    title: 'Scenario Started', 
    message: `Running: ${scenario.name}`, 
    variant: 'success' 
  });
};

const renderPresetScenarios = (): void => {
  const container = document.getElementById('presetScenarios');
  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="gf-preset-scenarios">
      <div class="gf-preset-scenarios__header">
        <h3>Preset Test Scenarios</h3>
        <p>Quick test configurations for common scenarios.</p>
      </div>
      <div class="gf-preset-scenarios__grid">
        ${PRESET_SCENARIOS.map(scenario => `
          <div class="gf-preset-scenario-card">
            <div class="gf-preset-scenario-card__header">
              <h4>${scenario.name}</h4>
            </div>
            <div class="gf-preset-scenario-card__body">
              <p>${scenario.description}</p>
              <button 
                class="gf-button gf-button--secondary gf-button--small" 
                data-scenario-id="${scenario.id}"
                type="button"
              >
                Run Scenario
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Attach event listeners
  container.querySelectorAll('[data-scenario-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const scenarioId = (e.target as HTMLElement).getAttribute('data-scenario-id');
      const scenario = PRESET_SCENARIOS.find(s => s.id === scenarioId);
      if (scenario) {
        runScenario(scenario);
      }
    });
  });
};

export const initializePresetScenarios = (): void => {
  // Create container if it doesn't exist
  const scenarioSection = document.querySelector('[aria-labelledby="testing-scenarios-heading"]');
  if (scenarioSection && !document.getElementById('presetScenarios')) {
    const presetDiv = document.createElement('div');
    presetDiv.id = 'presetScenarios';
    presetDiv.className = 'gf-preset-scenarios-container';
    const scenarioControls = document.getElementById('scenarioControls');
    if (scenarioControls) {
      scenarioControls.insertAdjacentElement('afterend', presetDiv);
    } else {
      scenarioSection.appendChild(presetDiv);
    }
  }
  
  renderPresetScenarios();
};

