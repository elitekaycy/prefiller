/**
 * Claude API Provider
 * Anthropic's Claude API for AI-powered form filling
 */

import { BaseAIProvider } from './ai/BaseAIProvider';
import { ProviderError, ProviderErrorCode } from './ai/ProviderError';
import { AI_CONFIG, API_ENDPOINTS } from '@/config/constants';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  id: string;
  model: string;
  role: 'assistant';
  stop_reason: string;
  stop_sequence: null;
  type: 'message';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeAPI extends BaseAIProvider {
  private baseUrl = API_ENDPOINTS.CLAUDE;
  private model = AI_CONFIG.CLAUDE_MODEL;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  getName(): string {
    return 'Claude';
  }

  requiresApiKey(): boolean {
    return true;
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.config.maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    const data: ClaudeResponse = await response.json();

    if (!data.content || data.content.length === 0) {
      throw new ProviderError(
        ProviderErrorCode.UNKNOWN,
        'No response from Claude API',
        this.getName()
      );
    }

    return data.content[0].text;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      const data = await response.json();
      return !!(data.content && data.content.length > 0);
    } catch (error) {
      throw error;
    }
  }

  private async handleError(response: Response): Promise<ProviderError> {
    const errorText = await response.text();

    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error) {
        const errorType = errorData.error.type;
        const errorMessage = errorData.error.message;

        if (errorType === 'invalid_request_error' && errorMessage?.includes('credit balance is too low')) {
          return new ProviderError(
            ProviderErrorCode.QUOTA_EXCEEDED,
            'Insufficient Claude API credits. Please add credits at https://console.anthropic.com/settings/billing',
            this.getName()
          );
        } else if (errorType === 'authentication_error') {
          return new ProviderError(
            ProviderErrorCode.INVALID_API_KEY,
            'Invalid Claude API key. Please verify your key at https://console.anthropic.com/account/keys',
            this.getName()
          );
        } else if (errorType === 'permission_error') {
          return new ProviderError(
            ProviderErrorCode.AUTH_ERROR,
            'Permission denied. Your API key may not have the required permissions.',
            this.getName()
          );
        } else if (errorType === 'rate_limit_error') {
          return new ProviderError(
            ProviderErrorCode.RATE_LIMITED,
            'Rate limit exceeded. Please try again in a moment.',
            this.getName()
          );
        } else if (errorMessage) {
          return new ProviderError(
            ProviderErrorCode.UNKNOWN,
            `Claude API Error: ${errorMessage}`,
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
          'Invalid API key. Please check your Claude API key at https://console.anthropic.com/account/keys',
          this.getName()
        );
      case 403:
        return new ProviderError(
          ProviderErrorCode.AUTH_ERROR,
          'Access forbidden. Your API key may not have the required permissions or sufficient credits.',
          this.getName()
        );
      case 429:
        return new ProviderError(
          ProviderErrorCode.RATE_LIMITED,
          'Rate limit exceeded. Please try again later.',
          this.getName()
        );
      case 400:
        return new ProviderError(
          ProviderErrorCode.UNKNOWN,
          'Bad request. Please check your API configuration.',
          this.getName()
        );
      case 500:
        return new ProviderError(
          ProviderErrorCode.UNAVAILABLE,
          'Claude API server error. Please try again later.',
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
