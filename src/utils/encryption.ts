import { AIProvider } from '@/types';

/**
 * API Key Obfuscation Utility
 *
 * SECURITY NOTE: This is NOT encryption, it's simple obfuscation to prevent
 * casual viewing of API keys in storage. The SALT is static and publicly visible
 * in the source code, so this provides minimal security.
 *
 * For Chrome extensions:
 * - chrome.storage.local is already reasonably secure (sandboxed per-extension)
 * - This obfuscation adds a small layer to prevent accidental exposure
 * - For production use, consider chrome.storage.sync or proper encryption libraries
 *
 * If you need real security:
 * - Use the Web Crypto API for proper encryption
 * - Store encryption keys securely (not in source code)
 * - Consider using a backend service to proxy API requests
 */
export class EncryptionUtil {
  private static readonly SALT = 'prefiller-salt-2024';

  /**
   * Obfuscate text with base64 encoding and static salt
   * @param text - Plain text to obfuscate
   * @returns Base64 encoded text (or original if encoding fails)
   */
  static encode(text: string): string {
    try {
      return btoa(unescape(encodeURIComponent(text + this.SALT)));
    } catch (error) {
      return text; // Return original if encoding fails
    }
  }

  /**
   * Decode obfuscated text
   * @param encodedText - Base64 encoded text
   * @returns Decoded text (or original if decoding fails)
   */
  static decode(encodedText: string): string {
    try {
      const decoded = decodeURIComponent(escape(atob(encodedText)));
      return decoded.replace(this.SALT, '');
    } catch (error) {
      return encodedText; // Return original if decoding fails
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