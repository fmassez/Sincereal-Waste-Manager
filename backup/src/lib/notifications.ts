/**
 * Notification utilities with custom styling
 */

import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  duration?: number;
  description?: string;
}

/**
 * Show a success toast notification
 */
export function toastSuccess(title: string, options?: ToastOptions) {
  return sonnerToast.success(title, {
    ...options,
    style: {
      borderLeftColor: '#10b981',
    },
  });
}

/**
 * Show an error toast notification
 */
export function toastError(title: string, options?: ToastOptions) {
  return sonnerToast.error(title, {
    ...options,
    style: {
      borderLeftColor: '#ef4444',
    },
  });
}

/**
 * Show a warning toast notification
 */
export function toastWarning(title: string, options?: ToastOptions) {
  return sonnerToast.warning(title, {
    ...options,
    style: {
      borderLeftColor: '#f59e0b',
    },
  });
}

/**
 * Show an info toast notification
 */
export function toastInfo(title: string, options?: ToastOptions) {
  return sonnerToast.info(title, {
    ...options,
    style: {
      borderLeftColor: '#3b82f6',
    },
  });
}

/**
 * Show a default toast notification
 */
export function toastDefault(title: string, options?: ToastOptions) {
  return sonnerToast(title, {
    ...options,
    style: {
      borderLeftColor: '#64748b',
    },
  });
}

// Re-export sonner toast for backward compatibility
export { sonnerToast };
