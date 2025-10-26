import './index.html';

window.addEventListener('DOMContentLoaded', () => {
  window.parent.postMessage({ type: 'game-ready' }, '*');
});

