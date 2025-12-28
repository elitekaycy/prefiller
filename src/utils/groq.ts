/**
 * Groq API Provider - Ultra-fast free AI inference
 * See: https://console.groq.com/docs/quickstart
 */

import { BaseAIProvider } from './ai/BaseAIProvider';
import { ProviderError, ProviderErrorCode } from './ai/ProviderError';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;
  id: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqAPI extends BaseAIProvider {
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private model = 'llama-3.3-70b-versatile';

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  getName(): string {
    return 'Groq';
  }

  requiresApiKey(): boolean {
    return true;
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          top_p: this.config.topP,
          stream: false
        })
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      const data: GroqResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new ProviderError(
          ProviderErrorCode.UNKNOWN,
          'No response from Groq API',
          this.getName()
        );
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        ProviderErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : 'Unknown error',
        this.getName(),
        error instanceof Error ? error : undefined
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Say "OK"' }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      const data = await response.json();
      return !!(data.choices && data.choices.length > 0);
    } catch (error) {
      throw error;
    }
  }

  private async handleError(response: Response): Promise<ProviderError> {
    const errorText = await response.text();

    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error?.message) {
        const errorMessage = errorData.error.message;

        if (errorMessage.includes('Invalid API Key') || errorMessage.includes('Unauthorized')) {
          return new ProviderError(
            ProviderErrorCode.INVALID_API_KEY,
            'Invalid Groq API key. Please verify your key at https://console.groq.com/keys',
            this.getName()
          );
        } else if (errorMessage.includes('rate_limit')) {
          return new ProviderError(
            ProviderErrorCode.RATE_LIMITED,
            'Rate limit exceeded. Please try again in a moment.',
            this.getName()
          );
        } else {
          return new ProviderError(
            ProviderErrorCode.UNKNOWN,
            `Groq API Error: ${errorMessage}`,
            this.getName()
          );
        }
      }
    } catch (parseError) {
      // Fall through to status code handling
    }

    // Handle by status code
    switch (response.status) {
      case 401:
        return new ProviderError(
          ProviderErrorCode.INVALID_API_KEY,
          'Invalid API key. Please check your Groq API key at https://console.groq.com/keys',
          this.getName()
        );
      case 403:
        return new ProviderError(
          ProviderErrorCode.AUTH_ERROR,
          'Access forbidden. Your API key may not have the required permissions.',
          this.getName()
        );
      case 429:
        return new ProviderError(
          ProviderErrorCode.RATE_LIMITED,
          'Rate limit exceeded. Please try again later.',
          this.getName()
        );
      default:
        return new ProviderError(
          ProviderErrorCode.UNKNOWN,
          `API request failed with status ${response.status}`,
          this.getName()
        );
    }
  }
}
