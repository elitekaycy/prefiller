/**
 * Secure Encryption Utility using Web Crypto API
 *
 * Uses AES-256-GCM encryption for secure API key storage.
 * Each encryption uses a random IV (Initialization Vector) for added security.
 *
 * Architecture:
 * - Master key is generated once and stored in browser storage
 * - Each encrypted value stores: [IV (12 bytes) + encrypted data]
 * - AES-256-GCM provides both encryption and authentication
 */

import { BrowserAPI } from './browserApi';

interface EncryptedData {
  iv: string; // Base64 encoded IV
  data: string; // Base64 encoded encrypted data
}

/**
 * Get the crypto object (works in both window and service worker contexts)
 */
const getCrypto = (): Crypto => {
  if (typeof self !== 'undefined' && self.crypto) {
    return self.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API not available');
};

export class SecureEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 12 bytes for GCM
  private static readonly MASTER_KEY_STORAGE_KEY = '__master_encryption_key__';

  private static masterKey: CryptoKey | null = null;

  /**
   * Initialize or retrieve the master encryption key
   */
  private static async getMasterKey(): Promise<CryptoKey> {
    if (this.masterKey) {
      return this.masterKey;
    }

    try {
      const cryptoApi = getCrypto();

      // Try to load existing master key from storage
      const stored = await BrowserAPI.storage.local.get(this.MASTER_KEY_STORAGE_KEY);

      if (stored[this.MASTER_KEY_STORAGE_KEY]) {
        // Import existing key
        const keyData = this.base64ToArrayBuffer(stored[this.MASTER_KEY_STORAGE_KEY]);
        this.masterKey = await cryptoApi.subtle.importKey(
          'raw',
          keyData,
          { name: this.ALGORITHM, length: this.KEY_LENGTH },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new master key
        this.masterKey = await cryptoApi.subtle.generateKey(
          { name: this.ALGORITHM, length: this.KEY_LENGTH },
          true,
          ['encrypt', 'decrypt']
        );

        // Export and store the key
        const exportedKey = await cryptoApi.subtle.exportKey('raw', this.masterKey);
        const keyBase64 = this.arrayBufferToBase64(exportedKey);
        await BrowserAPI.storage.local.set({ [this.MASTER_KEY_STORAGE_KEY]: keyBase64 });
      }

      return this.masterKey;
    } catch (error) {
      throw new Error(`Failed to initialize encryption key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt a string using AES-256-GCM
   * @param plaintext - Text to encrypt
   * @returns Encrypted data with IV
   */
  static async encrypt(plaintext: string): Promise<string> {
    try {
      const cryptoApi = getCrypto();
      const key = await this.getMasterKey();

      // Generate random IV
      const iv = cryptoApi.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Convert plaintext to ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // Encrypt
      const encryptedData = await cryptoApi.subtle.encrypt(
        { name: this.ALGORITHM, iv },
        key,
        data
      );

      // Combine IV and encrypted data
      const result: EncryptedData = {
        iv: this.arrayBufferToBase64(iv),
        data: this.arrayBufferToBase64(encryptedData),
      };

      return JSON.stringify(result);
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt an encrypted string
   * @param encryptedString - Encrypted data string
   * @returns Decrypted plaintext
   */
  static async decrypt(encryptedString: string): Promise<string> {
    try {
      const cryptoApi = getCrypto();
      const key = await this.getMasterKey();

      // Parse encrypted data
      const { iv, data }: EncryptedData = JSON.parse(encryptedString);

      // Convert from base64
      const ivBuffer = this.base64ToArrayBuffer(iv);
      const dataBuffer = this.base64ToArrayBuffer(data);

      // Decrypt
      const decryptedData = await cryptoApi.subtle.decrypt(
        { name: this.ALGORITHM, iv: ivBuffer },
        key,
        dataBuffer
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a string appears to be encrypted with this utility
   */
  static isEncrypted(value: string): boolean {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && 'iv' in parsed && 'data' in parsed;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Convert ArrayBuffer to Base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: Convert Base64 to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Clear the master key (useful for testing or security reset)
   */
  static async clearMasterKey(): Promise<void> {
    this.masterKey = null;
    await BrowserAPI.storage.local.remove(this.MASTER_KEY_STORAGE_KEY);
  }
}
