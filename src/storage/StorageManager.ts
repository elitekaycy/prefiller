/**
 * Storage Manager
 * High-level API for storage operations
 */

import { AIProvider, UploadedDocument } from '@/types';
import { IStorageProvider } from './IStorageProvider';
import { ChromeStorageProvider } from './ChromeStorageProvider';
import { StorageKey, QuotaInfo, DocumentMetadata } from './StorageSchema';

export class StorageManager {
  private static provider: IStorageProvider = new ChromeStorageProvider();

  /**
   * Set custom storage provider (for testing or different implementations)
   */
  static setProvider(provider: IStorageProvider): void {
    this.provider = provider;
  }

  // ========== API Keys ==========

  /**
   * Get API key for a provider
   */
  static async getApiKey(provider: AIProvider): Promise<string | undefined> {
    return this.provider.get(`apiKeys.${provider}` as StorageKey);
  }

  /**
   * Set API key for a provider
   */
  static async setApiKey(provider: AIProvider, key: string): Promise<void> {
    await this.provider.set(`apiKeys.${provider}` as StorageKey, key);
  }

  /**
   * Get all API keys
   */
  static async getAllApiKeys(): Promise<Partial<Record<AIProvider, string>>> {
    const providers: AIProvider[] = ['groq', 'claude', 'gemini', 'chromeai'];
    const keys: Partial<Record<AIProvider, string>> = {};

    const result = await this.provider.getMultiple(
      providers.map(p => `apiKeys.${p}` as StorageKey)
    );

    for (const provider of providers) {
      const key = result[`apiKeys.${provider}`];
      if (key) keys[provider] = key;
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
