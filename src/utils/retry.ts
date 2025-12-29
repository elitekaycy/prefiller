/**
 * Retry utility with exponential backoff for network operations
 */

import { ProviderError } from './ai/ProviderError';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  onRetry?: (attempt: number, maxRetries: number, error: Error) => void;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

export class RetryableError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

/**
 * Check if an error should be retried based on status code or error type
 */
export function isRetryableError(error: any): boolean {
  // Check for ProviderError first (highest priority)
  if (error instanceof ProviderError) {
    return error.isRetryable();
  }

  // Non-retryable HTTP status codes
  const nonRetryableStatuses = [
    400, // Bad Request
    401, // Unauthorized
    403, // Forbidden
    404, // Not Found
    405, // Method Not Allowed
    422, // Unprocessable Entity
  ];

  // Retryable HTTP status codes
  const retryableStatuses = [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ];

  // Check for HTTP status code in error
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;

    // Explicitly non-retryable
    if (nonRetryableStatuses.includes(status)) {
      return false;
    }

    // Explicitly retryable
    if (retryableStatuses.includes(status)) {
      return true;
    }
  }

  // Check for network errors (always retryable)
  if (
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('fetch') ||
    error.message?.toLowerCase().includes('timeout') ||
    error.name === 'NetworkError' ||
    error.name === 'TimeoutError'
  ) {
    return true;
  }

  // Check if error is explicitly marked as retryable
  if (error instanceof RetryableError) {
    return true;
  }

  // Check if error is explicitly marked as non-retryable
  if (error instanceof NonRetryableError) {
    return false;
  }

  // Default: retry on unknown errors (conservative approach)
  return true;
}

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);

  // Add jitter (random 0-25% variance) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * Math.random();
  const delayWithJitter = exponentialDelay + jitter;

  // Cap at maxDelay
  return Math.min(delayWithJitter, config.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @returns Promise resolving to function result
 * @throws Error if all retries exhausted or non-retryable error encountered
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // First attempt (attempt 0) runs immediately
      if (attempt > 0) {
        const delay = calculateDelay(attempt - 1, config);
        await sleep(delay);
      }

      // Try the operation
      return await fn();

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw new NonRetryableError(
          `Non-retryable error: ${lastError.message}`,
          lastError
        );
      }

      // If we've exhausted all retries, throw
      if (attempt === config.maxRetries) {
        throw new Error(
          `Operation failed after ${config.maxRetries} retries: ${lastError.message}`,
          { cause: lastError }
        );
      }

      // Notify about retry (if callback provided)
      if (config.onRetry) {
        config.onRetry(attempt + 1, config.maxRetries, lastError);
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Retry a function with exponential backoff and custom error handling
 *
 * @param fn - Async function to retry
 * @param options - Retry options with custom handlers
 */
export async function retryWithHandlers<T>(
  fn: () => Promise<T>,
  options: {
    config?: Partial<RetryConfig>;
    shouldRetry?: (error: any) => boolean;
    onRetry?: (attempt: number, maxRetries: number, error: Error) => void;
    onError?: (error: Error) => void;
  } = {}
): Promise<T> {
  const config: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...options.config,
    onRetry: options.onRetry,
  };

  const customShouldRetry = options.shouldRetry;

  try {
    return await withRetry(async () => {
      try {
        return await fn();
      } catch (error) {
        // Use custom retry logic if provided
        if (customShouldRetry && !customShouldRetry(error)) {
          throw new NonRetryableError(
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error : undefined
          );
        }
        throw error;
      }
    }, config);
  } catch (error) {
    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error(String(error)));
    }
    throw error;
  }
}
