import { actions, dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, DashboardMetrics, GalacticFrontierConfig } from '../types';
import { showToast } from '../toast';

const PREVIEW_IFRAME_ID = 'gamePreviewFrame';
const PREVIEW_CONTAINER_ID = 'gamePreviewContainer';
// Game preview runs on the frontend server (port 5174)
// Frontend Vite root is 'single-player/src', so game-preview.html is at root
const GAME_URL = 'http://192.168.1.50:5174/game-preview.html';

type GameMessage =
  | { type: 'game-ready' }
  | { type: 'metrics'; payload: DashboardMetrics }
  | { type: 'log'; payload: string }
  | { type: 'error'; payload: string };

let lastConfigHash: string | null = null;

const postConfig = (iframe: HTMLIFrameElement, config: GalacticFrontierConfig): void => {
  if (!iframe.contentWindow) {
    return;
  }
  
  // Prevent sending the same config repeatedly to avoid loops
  const configHash = JSON.stringify(config);
  if (configHash === lastConfigHash) {
    return;
  }
  lastConfigHash = configHash;
  
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
  // Use allow attribute - autoplay and fullscreen are supported
  // The warnings are harmless - browser still applies the policy
  iframe.setAttribute('allow', 'autoplay fullscreen');
  iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-pointer-lock');
  
  // Check if testing tab is visible before creating iframe
  const testingTab = document.getElementById('testingTab');
  const shouldStartPaused = !testingTab || testingTab.hidden;
  
  // Reset config hash when iframe loads to allow initial config
  iframe.addEventListener('load', () => {
    lastConfigHash = null;
    lastPreviewConfigHash = null;
    
    // Immediately pause if tab is hidden, before game starts drawing
    if (shouldStartPaused && iframe.contentWindow) {
      window.setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'toggle-pause', payload: true }, '*');
        }
      }, 10);
    }
  });
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
      // Event logger will pick this up via console.log override
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

let lastPreviewConfigHash: string | null = null;

const updatePreview: DashboardSubscriber['notify'] = (snapshot) => {
  const iframe = ensureIFrame();
  if (!iframe || !snapshot.config) {
    return;
  }
  
  // Only update if config actually changed
  const configHash = JSON.stringify(snapshot.config);
  if (configHash === lastPreviewConfigHash) {
    return;
  }
  lastPreviewConfigHash = configHash;
  
  postConfig(iframe, snapshot.config);
};

const pauseGame = (iframe: HTMLIFrameElement, paused: boolean): void => {
  if (!iframe.contentWindow) {
    return;
  }
  // Send pause message - ensure boolean is explicitly sent
  iframe.contentWindow.postMessage({ type: 'toggle-pause', payload: Boolean(paused) }, '*');
  
  // Send again after a short delay to ensure it's received
  window.setTimeout(() => {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'toggle-pause', payload: Boolean(paused) }, '*');
    }
  }, 50);
};

const handleTabVisibility = (): void => {
  const testingTab = document.getElementById('testingTab');
  const iframe = document.getElementById(PREVIEW_IFRAME_ID) as HTMLIFrameElement | null;
  
  if (!iframe || !testingTab) {
    return;
  }
  
  // Pause game when testing tab is hidden, resume when visible
  const isVisible = !testingTab.hidden;
  pauseGame(iframe, !isVisible);
  
  // Also check immediately after a short delay to catch DOM updates
  window.setTimeout(() => {
    const stillVisible = !testingTab.hidden;
    pauseGame(iframe, !stillVisible);
  }, 100);
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
    // Send initial pause state when iframe loads
    window.setTimeout(() => {
      handleTabVisibility();
    }, 100);
  });
  
  // Watch for tab visibility changes
  const observer = new MutationObserver(() => {
    handleTabVisibility();
  });
  
  const testingTab = document.getElementById('testingTab');
  if (testingTab) {
    observer.observe(testingTab, { attributes: true, attributeFilter: ['hidden'] });
    // Initial check - delay to ensure iframe is ready
    window.setTimeout(() => {
      handleTabVisibility();
    }, 200);
  }
};

