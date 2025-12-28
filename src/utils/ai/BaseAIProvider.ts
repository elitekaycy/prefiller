/**
 * Abstract base class for AI providers
 * Implements shared logic and enforces interface compliance
 */

import { IAIProvider, ProviderConfig } from './IAIProvider';
import { PromptBuilder } from './PromptBuilder';
import { FieldMetadata } from '@/types';
import { AI_CONFIG } from '@/config/constants';

export abstract class BaseAIProvider implements IAIProvider {
  protected apiKey?: string;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig = {}) {
    this.config = {
      temperature: config.temperature ?? AI_CONFIG.DEFAULT_TEMPERATURE,
      maxTokens: config.maxTokens ?? AI_CONFIG.DEFAULT_MAX_TOKENS,
      topK: config.topK ?? AI_CONFIG.DEFAULT_TOP_K,
      topP: config.topP ?? AI_CONFIG.DEFAULT_TOP_P,
    };
  }

  /**
   * Generate form responses using shared prompt building logic
   * This method is shared across all providers
   */
  async generateFormResponses(context: string, fields: FieldMetadata[]): Promise<string[]> {
    const prompt = PromptBuilder.buildFormPrompt(context, fields);
    const response = await this.generateContent(prompt);
    return PromptBuilder.parseFormResponse(response, fields.length);
  }

  /**
   * Abstract methods that each provider must implement
   */
  abstract generateContent(prompt: string): Promise<string>;
  abstract testConnection(): Promise<boolean>;
  abstract getName(): string;
  abstract requiresApiKey(): boolean;
}
