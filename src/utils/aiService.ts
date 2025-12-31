import { IAIProvider } from './ai/IAIProvider';
import { AIProvider, AIFormResponse } from '@/types';
import { PROVIDER_NAMES, PROVIDER_DESCRIPTIONS, API_KEY_URLS } from '@/config/constants';

export class AIService {
  private provider!: IAIProvider;
  private providerType: AIProvider;
  private initPromise: Promise<void>;

  constructor(providerType: AIProvider, apiKey: string) {
    this.providerType = providerType;
    this.initPromise = this.loadProvider(providerType, apiKey);
  }

  /**
   * Dynamically load AI provider implementation to reduce initial bundle size
   */
  private async loadProvider(providerType: AIProvider, apiKey: string): Promise<void> {
    switch (providerType) {
      case 'gemini': {
        const { GeminiAPI } = await import('./gemini');
        this.provider = new GeminiAPI(apiKey);
        break;
      }
      case 'claude': {
        const { ClaudeAPI } = await import('./claude');
        this.provider = new ClaudeAPI(apiKey);
        break;
      }
      case 'chromeai': {
        const { ChromeAI } = await import('./chromeai');
        this.provider = new ChromeAI();
        break;
      }
      case 'groq': {
        const { GroqAPI } = await import('./groq');
        this.provider = new GroqAPI(apiKey);
        break;
      }
      default:
        throw new Error(`Unsupported AI provider: ${providerType}`);
    }
  }

  /**
   * Ensure provider is loaded before calling methods
   */
  private async ensureReady(): Promise<void> {
    await this.initPromise;
  }

  async generateContent(prompt: string): Promise<string> {
    await this.ensureReady();
    return this.provider.generateContent(prompt);
  }

  async generateFormResponses(context: string, fields: Array<any>): Promise<AIFormResponse> {
    await this.ensureReady();
    return this.provider.generateFormResponses(context, fields);
  }

  async testConnection(): Promise<boolean> {
    await this.ensureReady();
    return this.provider.testConnection();
  }

  getProviderType(): AIProvider {
    return this.providerType;
  }

  static getProviderName(provider: AIProvider): string {
    return PROVIDER_NAMES[provider] || 'Unknown';
  }

  static getProviderDescription(provider: AIProvider): string {
    return PROVIDER_DESCRIPTIONS[provider] || '';
  }

  static getApiKeyUrl(provider: AIProvider): string {
    const urlMap: Record<AIProvider, string> = {
      gemini: API_KEY_URLS.GEMINI,
      claude: API_KEY_URLS.CLAUDE,
      chromeai: API_KEY_URLS.CHROME_AI,
      groq: API_KEY_URLS.GROQ,
    };
    return urlMap[provider] || '';
  }

  static validateApiKeyFormat(provider: AIProvider, apiKey: string): boolean {
    switch (provider) {
      case 'gemini':
        return /^AIzaSy[a-zA-Z0-9_-]{33}$/.test(apiKey);
      case 'claude':
        // Claude API keys can have different formats:
        // - sk-ant-api03-... (newer format)
        // - sk-ant-... (other formats)
        // Just check it starts with sk-ant and has reasonable length
        return apiKey.startsWith('sk-ant-') && apiKey.length >= 40;
      case 'chromeai':
        // Chrome AI doesn't need an API key
        return true;
      case 'groq':
        // Groq API keys start with 'gsk_'
        return apiKey.startsWith('gsk_') && apiKey.length >= 40;
      default:
        return false;
    }
  }

  static requiresApiKey(provider: AIProvider): boolean {
    return provider !== 'chromeai';
  }
}