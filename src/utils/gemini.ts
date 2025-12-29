/**
 * Gemini API Provider
 * Google's Gemini Pro API for AI-powered form filling
 */

import { BaseAIProvider } from './ai/BaseAIProvider';
import { ProviderError, ProviderErrorCode } from './ai/ProviderError';
import { GeminiResponse } from '@/types';
import { API_ENDPOINTS } from '@/config/constants';

export class GeminiAPI extends BaseAIProvider {
  private baseUrl = API_ENDPOINTS.GEMINI;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  getName(): string {
    return 'Gemini';
  }

  requiresApiKey(): boolean {
    return true;
  }

  async generateContent(prompt: string): Promise<string> {
    return this.executeWithRetry(async () => {
      try {
        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: this.config.temperature,
              topK: this.config.topK,
              topP: this.config.topP,
              maxOutputTokens: this.config.maxTokens,
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
            ]
          })
        });

        if (!response.ok) {
          throw await this.handleError(response);
        }

        const data: GeminiResponse = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
          throw new ProviderError(
            ProviderErrorCode.UNKNOWN,
            'No response from Gemini API',
            this.getName()
          );
        }

        return data.candidates[0].content.parts[0].text;
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
    });
  }

  async testConnection(): Promise<boolean> {
    return this.executeWithRetry(async () => {
      try {
        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Test' }]
            }],
            generationConfig: {
              maxOutputTokens: 5
            }
          })
        });

        if (!response.ok) {
          throw await this.handleError(response);
        }

        const data = await response.json();
        return !!(data.candidates && data.candidates.length > 0);
      } catch (error) {
        throw error;
      }
    });
  }

  private async handleError(response: Response): Promise<ProviderError> {
    const errorText = await response.text();

    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error?.message) {
        const errorMessage = errorData.error.message;

        if (errorMessage.includes('API_KEY_INVALID')) {
          return new ProviderError(
            ProviderErrorCode.INVALID_API_KEY,
            'Invalid Gemini API key. Please check your key at https://aistudio.google.com/app/apikey',
            this.getName()
          );
        } else if (errorMessage.includes('PERMISSION_DENIED')) {
          return new ProviderError(
            ProviderErrorCode.AUTH_ERROR,
            'Permission denied. Please ensure your Gemini API key has the correct permissions.',
            this.getName()
          );
        } else if (errorMessage.includes('RESOURCE_EXHAUSTED')) {
          return new ProviderError(
            ProviderErrorCode.QUOTA_EXCEEDED,
            'Gemini API quota exceeded. Please check your usage limits.',
            this.getName()
          );
        } else {
          return new ProviderError(
            ProviderErrorCode.UNKNOWN,
            `Gemini API Error: ${errorMessage}`,
            this.getName()
          );
        }
      }
    } catch (parseError) {
      // Fall through to status code handling
    }

    // Handle by status code
    switch (response.status) {
      case 400:
        return new ProviderError(
          ProviderErrorCode.INVALID_API_KEY,
          'Invalid API key. Please check your Gemini API key format.',
          this.getName()
        );
      case 403:
        return new ProviderError(
          ProviderErrorCode.AUTH_ERROR,
          'Access forbidden. Your API key may not have the required permissions or may be invalid.',
          this.getName()
        );
      case 404:
        return new ProviderError(
          ProviderErrorCode.INVALID_API_KEY,
          'API endpoint not found. This may indicate an API key issue.',
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
