import { actions, dashboardState, subscribe } from '../state';
import { persistConfig } from '../api';
import { showToast } from '../toast';
import type { DashboardSubscriber, GalacticFrontierConfig } from '../types';
import { initializeEnemyEditor } from './enemyEditor';
import { initializeProjectileEditor } from './projectileEditor';
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
    <div class="gf-config-layout">
      <section class="gf-config-panel" aria-labelledby="config-json-heading">
        <header class="gf-config-panel__header">
          <h3 id="config-json-heading">Raw Configuration</h3>
          <p>Direct JSON editing with validation.</p>
        </header>
        <textarea id="gf-config-json-editor" class="gf-config-editor__textarea" rows="28" spellcheck="false"></textarea>
      </section>
      <section class="gf-config-panel" aria-labelledby="config-enemy-heading">
        <header class="gf-config-panel__header">
          <h3 id="config-enemy-heading">Enemy Editor</h3>
          <p>Manage enemy types, damage, and spawn behaviour.</p>
        </header>
        <div id="enemyEditor"></div>
      </section>
    </div>
    <section class="gf-config-panel" aria-labelledby="config-projectile-heading">
      <header class="gf-config-panel__header">
        <h3 id="config-projectile-heading">Projectiles & Game Settings</h3>
        <p>Tune projectile physics and overarching gameplay pacing.</p>
      </header>
      <div id="projectileEditor"></div>
    </section>
  `;

  const textarea = getTextarea();
  if (textarea) {
    textarea.value = `${JSON.stringify(config, null, 2)}\n`;
    textarea.addEventListener('input', () => {
      try {
        const parsed = JSON.parse(textarea.value) as GalacticFrontierConfig;
        actions.setConfig(parsed);
        actions.setError(null);
      } catch (error) {
        actions.setError('Invalid JSON detected. Fix errors before saving.');
      }
    });
  }

  initializeEnemyEditor();
  initializeProjectileEditor();
  initializeImportControls();
};

const renderJsonEditor = (config: GalacticFrontierConfig): void => {
  const textarea = getTextarea();
  if (!textarea) {
    renderShell(config);
    return;
  }

  textarea.value = `${JSON.stringify(config, null, 2)}\n`;
};

const handleSaveClick = async (): Promise<void> => {
  const textarea = getTextarea();
  if (!textarea) {
    showToast({ title: 'Unable to save', message: 'Editor not initialized.', variant: 'error' });
    return;
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
    showToast({ title: 'Configuration saved', variant: 'success' });
  } catch (error) {
    console.error('[GF Dashboard] Save failed', error);
    showToast({ title: 'Save failed', message: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
  }
};

const bindSaveButton = (): void => {
  const button = document.getElementById('saveConfig');
  if (!button) {
    return;
  }
  button.addEventListener('click', handleSaveClick);
};

const updateEditor: DashboardSubscriber['notify'] = (snapshot) => {
  if (!snapshot.config) {
    return;
  }
  renderJsonEditor(snapshot.config);
};

export const initializeConfigEditor = (): void => {
  bindSaveButton();
  const subscriber: DashboardSubscriber = {
    id: 'config-editor',
    notify: updateEditor,
  };
  subscribe(subscriber);

  if (dashboardState.config) {
    renderJsonEditor(dashboardState.config);
  }
};
