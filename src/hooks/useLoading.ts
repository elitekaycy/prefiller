import { useState, useCallback } from 'preact/hooks';

/**
 * Simple loading state hook
 * Usage: const { isLoading, startLoading, stopLoading, withLoading } = useLoading();
 */
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  /**
   * Wraps an async function with loading state
   */
  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      setIsLoading(true);
      return await fn();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
};
