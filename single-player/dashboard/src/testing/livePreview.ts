import { actions, dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, DashboardMetrics, GalacticFrontierConfig } from '../types';
import { showToast } from '../toast';

const PREVIEW_IFRAME_ID = 'gamePreviewFrame';
const PREVIEW_CONTAINER_ID = 'gamePreviewContainer';
const GAME_URL = '/game-preview.html';

type GameMessage =
  | { type: 'game-ready' }
  | { type: 'metrics'; payload: DashboardMetrics }
  | { type: 'log'; payload: string }
  | { type: 'error'; payload: string };

const postConfig = (iframe: HTMLIFrameElement, config: GalacticFrontierConfig): void => {
  if (!iframe.contentWindow) {
    return;
  }
  iframe.contentWindow.postMessage({ type: 'config-update', payload: config }, '*');
};

const ensureIFrame = (): HTMLIFrameElement | null => {
  let iframe = document.getElementById(PREVIEW_IFRAME_ID) as HTMLIFrameElement | null;
  if (iframe) {
    return iframe;
  }

  const container = document.getElementById(PREVIEW_CONTAINER_ID);
  if (!container) {
    return null;
  }

  iframe = document.createElement('iframe');
  iframe.id = PREVIEW_IFRAME_ID;
  iframe.className = 'gf-preview__iframe';
  iframe.src = GAME_URL;
  iframe.title = 'Galactic Frontier Live Preview';
  iframe.allow = 'autoplay; clipboard-read; clipboard-write;';
  iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-pointer-lock');
  container.appendChild(iframe);

  return iframe;
};

const handleMessage = (event: MessageEvent<GameMessage>): void => {
  const message = event.data;
  if (!message || typeof message !== 'object') {
    return;
  }

  switch (message.type) {
    case 'game-ready': {
      if (dashboardState.config) {
        const iframe = ensureIFrame();
        if (iframe) {
          postConfig(iframe, dashboardState.config);
        }
      }
      break;
    }
    case 'metrics': {
      actions.setMetrics(message.payload);
      break;
    }
    case 'log': {
      console.log('[GF Game]', message.payload);
      break;
    }
    case 'error': {
      showToast({ title: 'Game Error', message: message.payload, variant: 'error' });
      break;
    }
    default:
      break;
  }
};

const updatePreview: DashboardSubscriber['notify'] = (snapshot) => {
  const iframe = ensureIFrame();
  if (!iframe || !snapshot.config) {
    return;
  }
  postConfig(iframe, snapshot.config);
};

export const initializeLivePreview = (): void => {
  window.addEventListener('message', handleMessage);

  const subscriber: DashboardSubscriber = {
    id: 'live-preview-config',
    notify: updatePreview,
  };
  subscribe(subscriber);

  const iframe = ensureIFrame();
  iframe?.addEventListener('load', () => {
    if (dashboardState.config && iframe) {
      postConfig(iframe, dashboardState.config);
    }
  });
};

