type ToastVariant = 'success' | 'error' | 'info';

interface ToastOptions {
  readonly title: string;
  readonly message?: string;
  readonly variant?: ToastVariant;
  readonly durationMs?: number;
}

const ID_PREFIX = 'gf-toast-';

const ensureContainer = (): HTMLElement => {
  const existing = document.getElementById('toastContainer');
  if (existing) {
    return existing;
  }
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'gf-toast-container';
  document.body.appendChild(container);
  return container;
};

const createToastElement = ({ title, message, variant = 'info' }: ToastOptions): HTMLElement => {
  const toast = document.createElement('div');
  toast.className = `gf-toast gf-toast--${variant}`;
  toast.id = `${ID_PREFIX}${crypto.randomUUID()}`;

  const toastTitle = document.createElement('div');
  toastTitle.className = 'gf-toast__title';
  toastTitle.textContent = title;
  toast.appendChild(toastTitle);

  if (message) {
    const toastMessage = document.createElement('div');
    toastMessage.className = 'gf-toast__message';
    toastMessage.textContent = message;
    toast.appendChild(toastMessage);
  }

  return toast;
};

const scheduleRemoval = (toast: HTMLElement, durationMs: number): void => {
  window.setTimeout(() => {
    toast.classList.add('gf-toast--dismiss');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    }, { once: true });
  }, durationMs);
};

export const showToast = (options: ToastOptions): void => {
  const durationMs = options.durationMs ?? 4500;
  const container = ensureContainer();
  const toast = createToastElement(options);
  container.appendChild(toast);
  scheduleRemoval(toast, durationMs);
};
