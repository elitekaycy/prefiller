/**
 * Abstract base class for AI providers
 * Implements shared logic and enforces interface compliance
 */

import { IAIProvider, ProviderConfig } from './IAIProvider';
import { PromptBuilder } from './PromptBuilder';
import { FieldMetadata, AIFormResponse } from '@/types';
import { AI_CONFIG } from '@/config/constants';
import { withRetry, RetryConfig, DEFAULT_RETRY_CONFIG } from '../retry';
import { Toast } from '../toast';

export abstract class BaseAIProvider implements IAIProvider {
  protected apiKey?: string;
  protected config: ProviderConfig;
  protected retryConfig: RetryConfig;

  constructor(config: ProviderConfig = {}) {
    this.config = {
      temperature: config.temperature ?? AI_CONFIG.DEFAULT_TEMPERATURE,
      maxTokens: config.maxTokens ?? AI_CONFIG.DEFAULT_MAX_TOKENS,
      topK: config.topK ?? AI_CONFIG.DEFAULT_TOP_K,
      topP: config.topP ?? AI_CONFIG.DEFAULT_TOP_P,
    };

    // Default retry configuration with toast notifications
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      onRetry: (attempt: number, maxRetries: number, error: Error) => {
        Toast.loading(
          `Connection issue. Retrying (${attempt}/${maxRetries})...`,
          2000
        );
      },
    };
  }

  /**
   * Execute an operation with retry logic
   * Providers can use this to wrap API calls
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = customConfig ? { ...this.retryConfig, ...customConfig } : this.retryConfig;
    return withRetry(operation, config);
  }

  /**
   * Generate form responses using shared prompt building logic
   * This method is shared across all providers with automatic retry
   */
  async generateFormResponses(context: string, fields: FieldMetadata[]): Promise<AIFormResponse> {
    return this.executeWithRetry(async () => {
      const prompt = PromptBuilder.buildStructuredFormPrompt(context, fields);
      const response = await this.generateContent(prompt);
      return PromptBuilder.parseStructuredFormResponse(response, fields.length);
    });
  }

  /**
   * Abstract methods that each provider must implement
   */
  abstract generateContent(prompt: string): Promise<string>;
  abstract testConnection(): Promise<boolean>;
  abstract getName(): string;
  abstract requiresApiKey(): boolean;
}
