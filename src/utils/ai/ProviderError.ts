/**
 * Standardized error types for AI providers
 * Provides consistent error handling across all AI services
 */

export enum ProviderErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  AUTH_ERROR = 'AUTH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAVAILABLE = 'UNAVAILABLE',
  UNKNOWN = 'UNKNOWN'
}

export class ProviderError extends Error {
  constructor(
    public code: ProviderErrorCode,
    message: string,
    public provider: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ProviderError';
  }

  /**
   * Create a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case ProviderErrorCode.INVALID_API_KEY:
        return `Invalid API key for ${this.provider}. Please check your API key in settings.`;
      case ProviderErrorCode.RATE_LIMITED:
        return `Rate limit exceeded for ${this.provider}. Please wait a moment and try again.`;
      case ProviderErrorCode.QUOTA_EXCEEDED:
        return `Quota exceeded for ${this.provider}. Please check your account or try a different provider.`;
      case ProviderErrorCode.AUTH_ERROR:
        return `Authentication failed for ${this.provider}. Please verify your API key.`;
      case ProviderErrorCode.NETWORK_ERROR:
        return `Network error connecting to ${this.provider}. Please check your internet connection.`;
      case ProviderErrorCode.UNAVAILABLE:
        return `${this.provider} is currently unavailable. Please try again later.`;
      default:
        return `An error occurred with ${this.provider}: ${this.message}`;
    }
  }

  /**
   * Determine if this error should be retried
   * Non-retryable: INVALID_API_KEY, AUTH_ERROR, QUOTA_EXCEEDED
   * Retryable: NETWORK_ERROR, RATE_LIMITED, UNAVAILABLE, UNKNOWN
   */
  isRetryable(): boolean {
    switch (this.code) {
      case ProviderErrorCode.INVALID_API_KEY:
      case ProviderErrorCode.AUTH_ERROR:
      case ProviderErrorCode.QUOTA_EXCEEDED:
        return false;

      case ProviderErrorCode.NETWORK_ERROR:
      case ProviderErrorCode.RATE_LIMITED:
      case ProviderErrorCode.UNAVAILABLE:
      case ProviderErrorCode.UNKNOWN:
        return true;

      default:
        return true;
    }
  }
}
