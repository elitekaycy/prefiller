/**
 * Chrome Built-in AI Provider (Gemini Nano)
 * Uses the Prompt API for local, free AI inference
 * See: https://developer.chrome.com/docs/ai/built-in-apis
 */

import { BaseAIProvider } from './ai/BaseAIProvider';
import { ProviderError, ProviderErrorCode } from './ai/ProviderError';

export interface AILanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

export interface AILanguageModel {
  prompt(input: string): Promise<string>;
  promptStreaming?(input: string): ReadableStream;
  destroy(): void;
}

export interface AILanguageModelFactory {
  capabilities(): Promise<AILanguageModelCapabilities>;
  create(options?: {
    systemPrompt?: string;
    temperature?: number;
    topK?: number;
  }): Promise<AILanguageModel>;
}

// Extend Window interface to include Chrome AI
declare global {
  interface Window {
    ai?: {
      languageModel?: AILanguageModelFactory;
    };
  }
}

export class ChromeAI extends BaseAIProvider {
  constructor() {
    super();
  }

  getName(): string {
    return 'Chrome AI';
  }

  requiresApiKey(): boolean {
    return false;
  }

  /**
   * Check if Chrome AI is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      if (!window.ai?.languageModel) {
        return false;
      }

      const capabilities = await window.ai.languageModel.capabilities();
      return capabilities.available !== 'no';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get availability status with details
   */
  static async getAvailabilityStatus(): Promise<{
    available: boolean;
    status: 'readily' | 'after-download' | 'no' | 'not-supported';
    message: string;
  }> {
    try {
      if (!window.ai?.languageModel) {
        return {
          available: false,
          status: 'not-supported',
          message: 'Chrome AI is not supported in this browser. Please use Chrome 127+ and enable the required flags.'
        };
      }

      const capabilities = await window.ai.languageModel.capabilities();

      if (capabilities.available === 'readily') {
        return {
          available: true,
          status: 'readily',
          message: 'Chrome AI is ready to use!'
        };
      } else if (capabilities.available === 'after-download') {
        return {
          available: true,
          status: 'after-download',
          message: 'Chrome AI will download on first use (may take a few minutes).'
        };
      } else {
        return {
          available: false,
          status: 'no',
          message: 'Chrome AI is not available. Please enable the required Chrome flags.'
        };
      }
    } catch (error) {
      return {
        available: false,
        status: 'not-supported',
        message: 'Unable to check Chrome AI status. Please ensure you are using Chrome 127+ with AI features enabled.'
      };
    }
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      if (!window.ai?.languageModel) {
        throw new ProviderError(
          ProviderErrorCode.UNAVAILABLE,
          'Chrome AI is not available. Please use Chrome 127+ and enable the Prompt API.',
          this.getName()
        );
      }

      const session = await window.ai.languageModel.create({
        temperature: this.config.temperature,
        topK: this.config.topK
      });

      const response = await session.prompt(prompt);

      // Clean up the session
      session.destroy();

      return response;
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('not available')) {
          throw new ProviderError(
            ProviderErrorCode.UNAVAILABLE,
            'Chrome AI is not available. Please enable it in chrome://flags or use another AI provider.',
            this.getName()
          );
        }
        throw new ProviderError(
          ProviderErrorCode.UNKNOWN,
          `Chrome AI Error: ${error.message}`,
          this.getName(),
          error
        );
      }

      throw new ProviderError(
        ProviderErrorCode.UNKNOWN,
        'Chrome AI request failed. Please try another AI provider.',
        this.getName()
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!window.ai?.languageModel) {
        throw new ProviderError(
          ProviderErrorCode.UNAVAILABLE,
          'Chrome AI is not available',
          this.getName()
        );
      }

      const capabilities = await window.ai.languageModel.capabilities();

      if (capabilities.available === 'no') {
        throw new ProviderError(
          ProviderErrorCode.UNAVAILABLE,
          'Chrome AI is not available. Please enable the Prompt API in chrome://flags',
          this.getName()
        );
      }

      // Try to create a session to test
      const session = await window.ai.languageModel.create();
      const testResponse = await session.prompt('Say "OK"');
      session.destroy();

      return testResponse.length > 0;
    } catch (error) {
      throw error;
    }
  }
}
