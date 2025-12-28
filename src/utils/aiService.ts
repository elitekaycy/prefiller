import { GeminiAPI } from './gemini';
import { ClaudeAPI } from './claude';
import { ChromeAI } from './chromeai';
import { GroqAPI } from './groq';
import { IAIProvider } from './ai/IAIProvider';
import { AIProvider } from '@/types';

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
    switch (provider) {
      case 'gemini':
        return 'Google Gemini';
      case 'claude':
        return 'Anthropic Claude';
      case 'chromeai':
        return 'Chrome AI';
      case 'groq':
        return 'Groq';
      default:
        return 'Unknown';
    }
  }

  static getProviderDescription(provider: AIProvider): string {
    switch (provider) {
      case 'gemini':
        return 'Google\'s advanced AI model with strong reasoning capabilities';
      case 'claude':
        return 'Anthropic\'s helpful, harmless, and honest AI assistant';
      case 'chromeai':
        return 'Free built-in AI that runs locally in Chrome (Gemini Nano)';
      case 'groq':
        return 'Ultra-fast FREE AI powered by Llama 3.3 70B (30 req/min free tier)';
      default:
        return '';
    }
  }

  static getApiKeyUrl(provider: AIProvider): string {
    switch (provider) {
      case 'gemini':
        return 'https://aistudio.google.com/app/apikey';
      case 'claude':
        return 'https://console.anthropic.com/account/keys';
      case 'chromeai':
        return 'chrome://flags/#prompt-api-for-gemini-nano';
      case 'groq':
        return 'https://console.groq.com/keys';
      default:
        return '';
    }
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