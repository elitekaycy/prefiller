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
        background: '#ffffff',
        color: '#1f2937',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        borderBottom: '3px solid #10b981',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
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
        background: '#ffffff',
        color: '#1f2937',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        borderBottom: '3px solid #ef4444',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
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
        background: '#ffffff',
        color: '#1f2937',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        borderBottom: '3px solid #3b82f6',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      iconTheme: {
        primary: '#3b82f6',
        secondary: '#fff',
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
        background: '#ffffff',
        color: '#1f2937',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        borderBottom: '3px solid #3b82f6',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
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
        background: '#ffffff',
        color: '#1f2937',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        borderBottom: '3px solid #f59e0b',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
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
