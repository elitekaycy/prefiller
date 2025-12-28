import { AIProvider } from '@/types';

export class EncryptionUtil {
  private static readonly SALT = 'prefiller-salt-2024';

  static encode(text: string): string {
    try {
      return btoa(unescape(encodeURIComponent(text + this.SALT)));
    } catch (error) {
      console.error('Encoding failed:', error);
      return text;
    }
  }

  static decode(encodedText: string): string {
    try {
      const decoded = decodeURIComponent(escape(atob(encodedText)));
      return decoded.replace(this.SALT, '');
    } catch (error) {
      console.error('Decoding failed:', error);
      return encodedText;
    }
  }

  static isValidApiKey(apiKey: string, provider?: AIProvider): boolean {
    if (!provider) {
      // Legacy check - assume Claude if no provider specified
      return /^sk-ant-api03-[a-zA-Z0-9_-]+$/.test(apiKey) && apiKey.length >= 100;
    }

    switch (provider) {
      case 'gemini':
        return /^AIzaSy[a-zA-Z0-9_-]{33}$/.test(apiKey);
      case 'claude':
        // Claude API keys format: sk-ant-api03-[base64-like string]
        // They are typically around 108-120 characters long
        return /^sk-ant-api03-[a-zA-Z0-9_-]+$/.test(apiKey) && apiKey.length >= 100;
      default:
        return false;
    }
  }
}