import { actions, dashboardState, subscribe } from '../state';
import { persistConfig, deployConfig } from '../api';
import { setCachedConfig, invalidateConfigCache } from '../cache';
import { showToast } from '../toast';
import { confirmDialog } from '../confirmDialog';
import type { DashboardSubscriber, GalacticFrontierConfig } from '../types';
import { initializeEnemyEditor } from './enemyEditor';
import { initializeProjectileEditor } from './projectileEditor';
import { initializeShipEditor } from './shipEditor';
import { initializeImportControls } from './importer';
import { validateConfigSchema, migrateConfig } from './schema';

const editorContainer = (): HTMLElement | null => document.getElementById('configEditor');
const jsonTextareaId = 'gf-config-json-editor';

const getTextarea = (): HTMLTextAreaElement | null => document.getElementById(jsonTextareaId) as HTMLTextAreaElement | null;

const renderShell = (config: GalacticFrontierConfig): void => {
  const container = editorContainer();
  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="gf-config-tabs">
      <div class="gf-config-tabs__nav" role="tablist" aria-label="Configuration editor sections">
        <button class="gf-config-tabs__tab" role="tab" aria-selected="true" data-configtab="raw">Raw JSON</button>
        <button class="gf-config-tabs__tab" role="tab" aria-selected="false" data-configtab="ship">Ship</button>
        <button class="gf-config-tabs__tab" role="tab" aria-selected="false" data-configtab="enemy">Enemy</button>
        <button class="gf-config-tabs__tab" role="tab" aria-selected="false" data-configtab="projectile">Projectiles</button>
        <button class="gf-config-tabs__tab" role="tab" aria-selected="false" data-configtab="game">Game Settings</button>
      </div>
      <div class="gf-config-tabs__panels">
        <section class="gf-config-tabs__panel" data-configtab-panel="raw" aria-labelledby="config-json-heading" style="display: flex;">
          <div class="gf-config-panel">
            <header class="gf-config-panel__header">
              <h3 id="config-json-heading">Raw Configuration</h3>
              <p>Direct JSON editing with validation.</p>
            </header>
            <textarea id="gf-config-json-editor" class="gf-config-editor__textarea" rows="28" spellcheck="false"></textarea>
          </div>
        </section>
        <section class="gf-config-tabs__panel" data-configtab-panel="ship" aria-labelledby="config-ship-heading" style="display: none;" hidden>
          <div class="gf-config-panel">
            <header class="gf-config-panel__header">
              <h3 id="config-ship-heading">Ship Configuration</h3>
              <p>Edit ship movement, health, and afterburner settings.</p>
            </header>
            <div id="shipEditor"></div>
          </div>
        </section>
        <section class="gf-config-tabs__panel" data-configtab-panel="enemy" aria-labelledby="config-enemy-heading" style="display: none;" hidden>
          <div class="gf-config-panel">
            <header class="gf-config-panel__header">
              <h3 id="config-enemy-heading">Enemy Editor</h3>
              <p>Manage enemy types, damage, and spawn behaviour.</p>
            </header>
            <div id="enemyEditor"></div>
          </div>
        </section>
        <section class="gf-config-tabs__panel" data-configtab-panel="projectile" aria-labelledby="config-projectile-heading" style="display: none;" hidden>
          <div class="gf-config-panel">
            <header class="gf-config-panel__header">
              <h3 id="config-projectile-heading">Projectile Settings</h3>
              <p>Tune projectile speeds, life, cooldown, and fan-shot behaviour.</p>
            </header>
            <div id="projectileEditor"></div>
          </div>
        </section>
        <section class="gf-config-tabs__panel" data-configtab-panel="game" aria-labelledby="config-game-heading" style="display: none;" hidden>
          <div class="gf-config-panel">
            <header class="gf-config-panel__header">
              <h3 id="config-game-heading">Game Settings</h3>
              <p>Control spawn intervals, power-ups, level progression, and scaling parameters.</p>
            </header>
            <div id="gameEditor"></div>
          </div>
        </section>
      </div>
    </div>
  `;

  const textarea = getTextarea();
  if (textarea) {
    textarea.value = `${JSON.stringify(config, null, 2)}\n`;
    let inputTimeout: number | null = null;
    textarea.addEventListener('input', () => {
      // Debounce rapid input changes to prevent cascading updates
      if (inputTimeout !== null) {
        window.clearTimeout(inputTimeout);
      }
      inputTimeout = window.setTimeout(() => {
        try {
          const parsed = JSON.parse(textarea.value) as GalacticFrontierConfig;
          actions.setConfig(parsed);
          actions.setError(null);
        } catch (error) {
          actions.setError('Invalid JSON detected. Fix errors before saving.');
        }
        inputTimeout = null;
      }, 300); // 300ms debounce
    });
  }

  initializeShipEditor();
  initializeEnemyEditor();
  initializeProjectileEditor();
  initializeImportControls();

  // Wire up tab switching
  const tabNav = container.querySelector('.gf-config-tabs__nav');
  if (tabNav) {
    const showTab = (tabName: string) => {
      // Update tab buttons
      document.querySelectorAll<HTMLButtonElement>('.gf-config-tabs__tab').forEach((btn) => {
        const isSelected = btn.dataset.configtab === tabName;
        btn.setAttribute('aria-selected', String(isSelected));
      });
      // Show/hide panels
      document.querySelectorAll<HTMLElement>('[data-configtab-panel]').forEach((panel) => {
        const shouldShow = panel.dataset.configtabPanel === tabName;
        panel.hidden = !shouldShow;
        panel.style.display = shouldShow ? 'flex' : 'none';
      });
    };
    tabNav.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.gf-config-tabs__tab') as HTMLButtonElement | null;
      if (!btn) return;
      showTab(btn.dataset.configtab || 'raw');
    });
    showTab('raw'); // Start with raw JSON tab
  }
};

const renderJsonEditor = (config: GalacticFrontierConfig): void => {
  const textarea = getTextarea();
  // If textarea doesn't exist, render the full shell with all editors
  if (!textarea) {
    renderShell(config);
    return;
  }

  // Just update the textarea value if it already exists
  textarea.value = `${JSON.stringify(config, null, 2)}\n`;
};


const handleSaveClick = async (): Promise<void> => {
  const textarea = getTextarea();
  if (!textarea) {
    showToast({ title: 'Unable to save', message: 'Editor not initialized.', variant: 'error' });
    return;
  }

  if (dashboardState.hasUnsavedChanges) {
    const confirmed = await confirmDialog({
      title: 'Save Configuration',
      message: 'Save configuration changes? This will overwrite the current saved configuration.',
      confirmText: 'Save',
      cancelText: 'Cancel',
      variant: 'info',
    });
    if (!confirmed) {
      return;
    }
  }

  try {
    let parsed = JSON.parse(textarea.value) as GalacticFrontierConfig;
    parsed = migrateConfig(parsed);
    const schemaIssues = validateConfigSchema(parsed);
    if (schemaIssues.length > 0) {
      throw new Error(`Schema validation failed: ${schemaIssues.join(', ')}`);
    }
    await persistConfig(parsed);
    actions.setConfig(parsed, false);
    actions.markSaved();
    setCachedConfig(parsed);
    showToast({ title: 'Configuration saved', variant: 'success' });
  } catch (error) {
    console.error('[GF Dashboard] Save failed', error);
    showToast({ title: 'Save failed', message: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
  }
};

const handleDeployClick = async (): Promise<void> => {
  if (dashboardState.hasUnsavedChanges) {
    const confirmed = await confirmDialog({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Deploy the current saved configuration, or cancel to save changes first.',
      confirmText: 'Deploy Saved Config',
      cancelText: 'Cancel',
      variant: 'warning',
    });
    if (!confirmed) {
      return;
    }
  }

  const confirmed = await confirmDialog({
    title: 'Deploy Configuration',
    message: 'Deploy configuration to game directory? This will copy the saved configuration to the game\'s public config folder.',
    confirmText: 'Deploy',
    cancelText: 'Cancel',
    variant: 'info',
  });
  if (!confirmed) {
    return;
  }

  try {
    await deployConfig();
    showToast({ title: 'Configuration deployed', message: 'Configuration has been deployed to the game directory.', variant: 'success' });
  } catch (error) {
    console.error('[GF Dashboard] Deploy failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's an authentication error
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Access token')) {
      showToast({ 
        title: 'Authentication Required', 
        message: 'Please authenticate with Discord to deploy configurations.', 
        variant: 'error',
        durationMs: 6000,
      });
    } else {
      showToast({ title: 'Deploy failed', message: errorMessage, variant: 'error' });
    }
  }
};

const bindSaveButton = (): void => {
  const button = document.getElementById('saveConfig');
  if (!button) {
    return;
  }
  button.addEventListener('click', handleSaveClick);
};

const bindDeployButton = (): void => {
  const button = document.getElementById('deployConfig');
  if (!button) {
    return;
  }
  button.addEventListener('click', handleDeployClick);
};

let hasRenderedShell = false;

const updateEditor: DashboardSubscriber['notify'] = (snapshot) => {
  if (!snapshot.config) {
    return;
  }
  
  // If shell hasn't been rendered yet, render it now
  if (!hasRenderedShell) {
    renderShell(snapshot.config);
    hasRenderedShell = true;
  } else {
    // Otherwise just update the JSON editor
    renderJsonEditor(snapshot.config);
  }
};

export const initializeConfigEditor = (): void => {
  bindSaveButton();
  bindDeployButton();
  const subscriber: DashboardSubscriber = {
    id: 'config-editor',
    notify: updateEditor,
  };
  subscribe(subscriber);

  // If config already exists, render the shell immediately
  if (dashboardState.config) {
    renderShell(dashboardState.config);
    hasRenderedShell = true;
  }
};
