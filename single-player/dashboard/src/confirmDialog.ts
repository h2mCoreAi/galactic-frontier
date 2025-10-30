import { showToast } from './toast';

interface ConfirmDialogOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly variant?: 'info' | 'warning' | 'danger';
}

export const confirmDialog = (options: ConfirmDialogOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    const {
      title,
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'info',
    } = options;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'gf-confirm-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    `;

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'gf-confirm-dialog';
    dialog.style.cssText = `
      background: var(--gf-surface, #1a1f2e);
      border: 1px solid var(--gf-border, rgba(255, 255, 255, 0.1));
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      animation: slideUp 0.2s ease;
    `;

    // Title
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: rgba(230, 241, 255, 0.9);
    `;
    dialog.appendChild(titleEl);

    // Message
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      margin: 0 0 24px 0;
      font-size: 0.95rem;
      line-height: 1.5;
      color: rgba(230, 241, 255, 0.7);
    `;
    dialog.appendChild(messageEl);

    // Buttons container
    const buttonsEl = document.createElement('div');
    buttonsEl.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = cancelText;
    cancelBtn.className = 'gf-button gf-button--secondary';
    cancelBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 0.9rem;
    `;
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmText;
    confirmBtn.className = variant === 'danger' 
      ? 'gf-button gf-button--danger' 
      : 'gf-button gf-button--primary';
    confirmBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 0.9rem;
    `;
    confirmBtn.addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });

    buttonsEl.appendChild(cancelBtn);
    buttonsEl.appendChild(confirmBtn);
    dialog.appendChild(buttonsEl);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Close on overlay click (outside dialog)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    });

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handleEscape);
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Focus confirm button
    confirmBtn.focus();
  });
};

