/**
 * Toast Notification Utility
 * Wrapper around react-hot-toast for consistent notifications
 */

import toast from 'react-hot-toast';

export const Toast = {
  /**
   * Show success message
   */
  success(message: string, duration = 3000) {
    return toast.success(message, {
      duration,
      position: 'bottom-center',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    });
  },

  /**
   * Show error message
   */
  error(message: string, duration = 4000) {
    return toast.error(message, {
      duration,
      position: 'bottom-center',
      style: {
        background: '#ef4444',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    });
  },

  /**
   * Show loading message
   */
  loading(message: string) {
    return toast.loading(message, {
      position: 'bottom-center',
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
    });
  },

  /**
   * Show info message
   */
  info(message: string, duration = 3000) {
    return toast(message, {
      duration,
      position: 'bottom-center',
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
    });
  },

  /**
   * Show warning message
   */
  warning(message: string, duration = 4000) {
    return toast(message, {
      duration,
      position: 'bottom-center',
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
    });
  },

  /**
   * Dismiss a specific toast
   */
  dismiss(toastId?: string) {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    toast.dismiss();
  },

  /**
   * Update an existing toast (useful for loading states)
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(
      promise,
      messages,
      {
        style: {
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
        },
        position: 'bottom-center',
      }
    );
  },
};

// Export Toaster component for setup
export { Toaster } from 'react-hot-toast';
