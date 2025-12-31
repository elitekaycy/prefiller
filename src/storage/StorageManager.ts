/**
 * Storage Manager
 * High-level API for storage operations
 */

import { AIProvider, UploadedDocument, URLContext } from '@/types';
import { IStorageProvider } from './IStorageProvider';
import { BrowserStorageProvider } from './BrowserStorageProvider';
import { StorageKey, QuotaInfo, DocumentMetadata } from './StorageSchema';
import { SecureEncryption } from '@/utils/secureEncryption';

export class StorageManager {
  private static provider: IStorageProvider = new BrowserStorageProvider();

  /**
   * Set custom storage provider (for testing or different implementations)
   */
  static setProvider(provider: IStorageProvider): void {
    this.provider = provider;
  }

  // ========== API Keys ==========

  /**
   * Get API key for a provider (decrypts securely stored key)
   */
  static async getApiKey(provider: AIProvider): Promise<string | undefined> {
    const encryptedKey = await this.provider.get(`apiKeys.${provider}` as StorageKey);

    if (!encryptedKey) return undefined;

    try {
      const decrypted = await SecureEncryption.decrypt(encryptedKey);
      return decrypted;
    } catch (error) {
      console.error('[StorageManager] getApiKey decrypt error:', error);
      // If decryption fails, the key might be corrupted or from old format
      throw new Error(`Failed to decrypt API key for ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set API key for a provider (encrypts before storing)
   */
  static async setApiKey(provider: AIProvider, key: string): Promise<void> {
    const encryptedKey = await SecureEncryption.encrypt(key);
    await this.provider.set(`apiKeys.${provider}` as StorageKey, encryptedKey);
  }

  /**
   * Get all API keys (decrypted)
   */
  static async getAllApiKeys(): Promise<Partial<Record<AIProvider, string>>> {
    const providers: AIProvider[] = ['groq', 'claude', 'gemini', 'chromeai'];
    const keys: Partial<Record<AIProvider, string>> = {};

    const result = await this.provider.getMultiple(
      providers.map(p => `apiKeys.${p}` as StorageKey)
    );

    for (const provider of providers) {
      const encryptedKey = result[`apiKeys.${provider}`];
      if (encryptedKey) {
        try {
          keys[provider] = await SecureEncryption.decrypt(encryptedKey);
        } catch (error) {
          // Skip corrupted keys
          console.error(`Failed to decrypt API key for ${provider}:`, error);
        }
      }
    }

    return keys;
  }

  /**
   * Remove API key for a provider
   */
  static async removeApiKey(provider: AIProvider): Promise<void> {
    await this.provider.remove(`apiKeys.${provider}` as StorageKey);
  }

  // ========== Documents ==========

  /**
   * Get all documents
   */
  static async getDocuments(): Promise<UploadedDocument[]> {
    return (await this.provider.get('documents.list')) || [];
  }

  /**
   * Add a document
   */
  static async addDocument(doc: UploadedDocument): Promise<void> {
    const docs = await this.getDocuments();
    docs.push(doc);
    await this.provider.set('documents.list', docs);

    // Add metadata
    const metadata = await this.getDocumentsMetadata();
    metadata.push({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.content.length,
      uploadedAt: doc.uploadedAt,
      parsedAt: doc.parsedAt,
      parsedBy: doc.parsedBy,
    });
    await this.provider.set('documents.metadata', metadata);
  }

  /**
   * Update a document
   */
  static async updateDocument(id: string, updates: Partial<UploadedDocument>): Promise<void> {
    const docs = await this.getDocuments();
    const index = docs.findIndex(doc => doc.id === id);

    if (index === -1) {
      throw new Error(`Document with id ${id} not found`);
    }

    docs[index] = { ...docs[index], ...updates };
    await this.provider.set('documents.list', docs);

    // Update metadata if needed
    if (updates.parsedAt || updates.parsedBy) {
      const metadata = await this.getDocumentsMetadata();
      const metaIndex = metadata.findIndex(m => m.id === id);
      if (metaIndex !== -1) {
        if (updates.parsedAt) metadata[metaIndex].parsedAt = updates.parsedAt;
        if (updates.parsedBy) metadata[metaIndex].parsedBy = updates.parsedBy;
        await this.provider.set('documents.metadata', metadata);
      }
    }
  }

  /**
   * Remove a document
   */
  static async removeDocument(id: string): Promise<void> {
    const docs = await this.getDocuments();
    const filtered = docs.filter(doc => doc.id !== id);
    await this.provider.set('documents.list', filtered);

    // Remove metadata
    const metadata = await this.getDocumentsMetadata();
    const filteredMetadata = metadata.filter(m => m.id !== id);
    await this.provider.set('documents.metadata', filteredMetadata);

    // Remove cached parsed data (will be handled by CacheManager)
  }

  /**
   * Get document by ID
   */
  static async getDocument(id: string): Promise<UploadedDocument | undefined> {
    const docs = await this.getDocuments();
    return docs.find(doc => doc.id === id);
  }

  /**
   * Get documents metadata
   */
  static async getDocumentsMetadata(): Promise<DocumentMetadata[]> {
    return (await this.provider.get('documents.metadata')) || [];
  }

  // ========== URL Contexts ==========

  /**
   * Get all URL contexts
   */
  static async getUrlContexts(): Promise<URLContext[]> {
    return (await this.provider.get('urlContexts.list')) || [];
  }

  /**
   * Set URL contexts
   */
  static async setUrlContexts(urlContexts: URLContext[]): Promise<void> {
    await this.provider.set('urlContexts.list', urlContexts);
  }

  /**
   * Add a URL context
   */
  static async addUrlContext(urlContext: URLContext): Promise<void> {
    const contexts = await this.getUrlContexts();
    contexts.push(urlContext);
    await this.setUrlContexts(contexts);
  }

  /**
   * Remove a URL context
   */
  static async removeUrlContext(id: string): Promise<void> {
    const contexts = await this.getUrlContexts();
    const filtered = contexts.filter(ctx => ctx.id !== id);
    await this.setUrlContexts(filtered);
  }

  // ========== Settings ==========

  /**
   * Get a setting
   */
  static async getSetting<K extends StorageKey>(key: K): Promise<any> {
    return this.provider.get(key);
  }

  /**
   * Set a setting
   */
  static async setSetting<K extends StorageKey>(key: K, value: any): Promise<void> {
    await this.provider.set(key, value);
  }

  /**
   * Get AI provider setting
   */
  static async getAIProvider(): Promise<AIProvider | undefined> {
    return this.provider.get('settings.aiProvider');
  }

  /**
   * Set AI provider setting
   */
  static async setAIProvider(provider: AIProvider): Promise<void> {
    await this.provider.set('settings.aiProvider', provider);
  }

  /**
   * Get enabled setting
   */
  static async getIsEnabled(): Promise<boolean> {
    return (await this.provider.get('settings.isEnabled')) ?? true;
  }

  /**
   * Set enabled setting
   */
  static async setIsEnabled(enabled: boolean): Promise<void> {
    await this.provider.set('settings.isEnabled', enabled);
  }

  // ========== Storage Management ==========

  /**
   * Get storage quota information
   */
  static async getQuotaInfo(): Promise<QuotaInfo> {
    return this.provider.getQuota();
  }

  /**
   * Check storage quota and return warning if needed
   */
  static async checkQuota(): Promise<{ ok: boolean; message?: string }> {
    const quota = await this.getQuotaInfo();

    if (quota.percentage > 90) {
      return {
        ok: false,
        message: `Storage almost full (${quota.percentage.toFixed(1)}%). Please remove some documents.`,
      };
    }

    if (quota.percentage > 75) {
      return {
        ok: true,
        message: `Storage usage: ${quota.percentage.toFixed(1)}%`,
      };
    }

    return { ok: true };
  }

  /**
   * Get all storage keys
   */
  static async getAllKeys(): Promise<string[]> {
    return this.provider.getKeys();
  }

  /**
   * Clear all storage (use with caution!)
   */
  static async clearAll(): Promise<void> {
    await this.provider.clear();
  }
}
