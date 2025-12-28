/**
 * Interface for AI providers
 * All AI providers must implement this interface to ensure consistency
 */

import { FieldMetadata } from '@/types';

export interface IAIProvider {
  /**
   * Generate content based on a prompt
   */
  generateContent(prompt: string): Promise<string>;

  /**
   * Generate form responses based on context and field metadata
   */
  generateFormResponses(context: string, fields: FieldMetadata[]): Promise<string[]>;

  /**
   * Test the connection to the AI provider
   */
  testConnection(): Promise<boolean>;

  /**
   * Get the provider name
   */
  getName(): string;

  /**
   * Check if the provider requires an API key
   */
  requiresApiKey(): boolean;
}

/**
 * Configuration for AI provider behavior
 */
export interface ProviderConfig {
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  topP?: number;
}
