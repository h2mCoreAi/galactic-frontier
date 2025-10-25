import { actions } from '../state';
import { showToast } from '../toast';
import type { GalacticFrontierConfig } from '../types';

const uploadInputId = 'configUpload';
const dropZoneId = 'configEditor';

const readFileAsText = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
  reader.readAsText(file);
});

const handleFile = async (file: File): Promise<void> => {
  try {
    if (!file.name.endsWith('.json')) {
      throw new Error('Only JSON files are supported.');
    }
    const contents = await readFileAsText(file);
    const parsed = JSON.parse(contents) as GalacticFrontierConfig;
    actions.setConfig(parsed);
    actions.setError(null);
    showToast({ title: 'Config loaded', message: `Imported ${file.name}`, variant: 'success' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid configuration file.';
    actions.setError(message);
    showToast({ title: 'Import failed', message, variant: 'error' });
  }
};

const bindUploadInput = (): void => {
  const input = document.getElementById(uploadInputId) as HTMLInputElement | null;
  if (!input) {
    return;
  }
  input.addEventListener('change', async (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target?.files?.length) {
      return;
    }
    const file = target.files[0];
    await handleFile(file);
    target.value = '';
  });
};

const bindDragAndDrop = (): void => {
  const zone = document.getElementById(dropZoneId);
  if (!zone) {
    return;
  }

  const toggleDragClass = (active: boolean) => {
    zone.classList.toggle('gf-config--drag-active', active);
  };

  ['dragenter', 'dragover'].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      toggleDragClass(true);
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      toggleDragClass(false);
    });
  });

  zone.addEventListener('drop', async (event) => {
    const dt = event.dataTransfer;
    if (!dt?.files?.length) {
      return;
    }
    const file = dt.files[0];
    await handleFile(file);
  });
};

export const initializeImportControls = (): void => {
  bindUploadInput();
  bindDragAndDrop();
};

