import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  KEYS,
  isActivationKey,
  handleSpaceKey,
  announceToScreenReader,
  createFocusTrap
} from '../accessibility';

describe('Accessibility Utilities', () => {
  describe('KEYS constant', () => {
    it('should export all keyboard key constants', () => {
      expect(KEYS.ENTER).toBe('Enter');
      expect(KEYS.SPACE).toBe(' ');
      expect(KEYS.ESCAPE).toBe('Escape');
      expect(KEYS.TAB).toBe('Tab');
      expect(KEYS.ARROW_UP).toBe('ArrowUp');
      expect(KEYS.ARROW_DOWN).toBe('ArrowDown');
      expect(KEYS.ARROW_LEFT).toBe('ArrowLeft');
      expect(KEYS.ARROW_RIGHT).toBe('ArrowRight');
      expect(KEYS.DELETE).toBe('Delete');
      expect(KEYS.BACKSPACE).toBe('Backspace');
    });
  });

  describe('isActivationKey', () => {
    it('should return true for Enter key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      expect(isActivationKey(event)).toBe(true);
    });

    it('should return true for Space key', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      expect(isActivationKey(event)).toBe(true);
    });

    it('should return false for other keys', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(isActivationKey(escapeEvent)).toBe(false);

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      expect(isActivationKey(tabEvent)).toBe(false);

      const aEvent = new KeyboardEvent('keydown', { key: 'a' });
      expect(isActivationKey(aEvent)).toBe(false);
    });
  });

  describe('handleSpaceKey', () => {
    it('should call callback and prevent default for Space key', () => {
      const callback = vi.fn();
      const event = new KeyboardEvent('keydown', { key: ' ' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      handleSpaceKey(event, callback);

      expect(callback).toHaveBeenCalledOnce();
      expect(preventDefaultSpy).toHaveBeenCalledOnce();
    });

    it('should not call callback for non-Space keys', () => {
      const callback = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });

      handleSpaceKey(event, callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('announceToScreenReader', () => {
    beforeEach(() => {
      // Clear document body before each test
      document.body.innerHTML = '';
    });

    it('should create announcement element with correct attributes', () => {
      announceToScreenReader('Test message', 'polite');

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
      expect(announcement).toHaveClass('sr-only');
      expect(announcement).toHaveTextContent('Test message');
    });

    it('should use assertive priority when specified', () => {
      announceToScreenReader('Error message', 'assertive');

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toHaveAttribute('aria-live', 'assertive');
    });

    it('should default to polite priority', () => {
      announceToScreenReader('Info message');

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });

    it('should remove announcement after timeout', async () => {
      vi.useFakeTimers();

      announceToScreenReader('Temporary message');

      let announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeInTheDocument();

      // Fast-forward past the 1000ms timeout
      vi.advanceTimersByTime(1001);

      announcement = document.querySelector('[role="status"]');
      expect(announcement).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('createFocusTrap', () => {
    let container: HTMLElement;

    beforeEach(() => {
      // Create a container with focusable elements
      container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <a href="#" id="link1">Link 1</a>
        <input type="text" id="input1" />
        <button id="btn2">Button 2</button>
      `;
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should focus first element on activate', () => {
      const trap = createFocusTrap(container);
      const firstButton = container.querySelector('#btn1') as HTMLElement;
      const focusSpy = vi.spyOn(firstButton, 'focus');

      trap.activate();

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should trap Tab at last element', () => {
      const trap = createFocusTrap(container);
      trap.activate();

      const firstButton = container.querySelector('#btn1') as HTMLElement;
      const lastButton = container.querySelector('#btn2') as HTMLElement;

      // Simulate Tab on last element
      lastButton.focus();
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      // Note: In actual implementation, focus would move to first element
      // This test verifies preventDefault was called
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should trap Shift+Tab at first element', () => {
      const trap = createFocusTrap(container);
      trap.activate();

      const firstButton = container.querySelector('#btn1') as HTMLElement;

      // Simulate Shift+Tab on first element
      firstButton.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should remove event listener on deactivate', () => {
      const trap = createFocusTrap(container);
      trap.activate();
      trap.deactivate();

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      // After deactivation, preventDefault should not be called
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should handle container with no focusable elements', () => {
      const emptyContainer = document.createElement('div');
      emptyContainer.innerHTML = '<p>No buttons here</p>';
      document.body.appendChild(emptyContainer);

      const trap = createFocusTrap(emptyContainer);

      // Should not throw error
      expect(() => trap.activate()).not.toThrow();

      document.body.removeChild(emptyContainer);
    });
  });
});
