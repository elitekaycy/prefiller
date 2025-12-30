/**
 * Accessibility utility functions for WCAG 2.1 AA compliance
 */

// Keyboard event helpers
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
} as const;

// Check if event is activation key (Enter/Space)
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === KEYS.ENTER || event.key === KEYS.SPACE;
}

// Prevent default for Space key to avoid scrolling
export function handleSpaceKey(event: KeyboardEvent, callback: () => void): void {
  if (event.key === KEYS.SPACE) {
    event.preventDefault();
    callback();
  }
}

// Focus trap for modals/dialogs
export function createFocusTrap(containerRef: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function getFocusableElements(): HTMLElement[] {
    return Array.from(containerRef.querySelectorAll(focusableSelectors));
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key !== KEYS.TAB) return;

    const focusable = getFocusableElements();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }

  return {
    activate: () => {
      document.addEventListener('keydown', handleKeyDown);
      getFocusableElements()[0]?.focus();
    },
    deactivate: () => {
      document.removeEventListener('keydown', handleKeyDown);
    },
  };
}

// Announce to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
