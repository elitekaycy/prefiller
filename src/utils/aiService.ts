import { GeminiAPI } from './gemini';
import { ClaudeAPI } from './claude';
import { ChromeAI } from './chromeai';
import { GroqAPI } from './groq';
import { IAIProvider } from './ai/IAIProvider';
import { AIProvider } from '@/types';
import { PROVIDER_NAMES, PROVIDER_DESCRIPTIONS, API_KEY_URLS } from '@/config/constants';

export class AIService {
  private provider: IAIProvider;
  private providerType: AIProvider;

  constructor(providerType: AIProvider, apiKey: string) {
    this.providerType = providerType;

    switch (providerType) {
      case 'gemini':
        this.provider = new GeminiAPI(apiKey);
        break;
      case 'claude':
        this.provider = new ClaudeAPI(apiKey);
        break;
      case 'chromeai':
        this.provider = new ChromeAI();
        break;
      case 'groq':
        this.provider = new GroqAPI(apiKey);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${providerType}`);
    }
  }

  async generateContent(prompt: string): Promise<string> {
    return this.provider.generateContent(prompt);
  }

  async generateFormResponses(context: string, fields: Array<any>): Promise<string[]> {
    return this.provider.generateFormResponses(context, fields);
  }

  async testConnection(): Promise<boolean> {
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