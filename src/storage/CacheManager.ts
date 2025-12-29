/**
 * Cache Manager
 * Manages caching of parsed documents and AI responses
 */

import { ParsedDocumentData, AIProvider } from '@/types';
import { IStorageProvider } from './IStorageProvider';
import { BrowserStorageProvider } from './BrowserStorageProvider';
import { StorageKey, CacheMetadata, CachedResponse } from './StorageSchema';
import { StorageManager } from './StorageManager';

export class CacheManager {
  private static provider: IStorageProvider = new BrowserStorageProvider();
  private static readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly RESPONSE_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Set custom storage provider
   */
  static setProvider(provider: IStorageProvider): void {
    this.provider = provider;
  }

  // ========== Parsed Document Cache ==========

  /**
   * Get cached parsed document
   */
  static async getParsedDocument(documentId: string): Promise<ParsedDocumentData | undefined> {
    const key = `cache.parsed.${documentId}` as StorageKey;
    const cached = await this.provider.get(key);

    if (cached) {
      // Update access time
      await this.updateCacheMetadata(key, 'parsed');
    }

    return cached;
  }

  /**
   * Set cached parsed document
   */
  static async setParsedDocument(
    documentId: string,
    data: ParsedDocumentData
  ): Promise<void> {
    const key = `cache.parsed.${documentId}` as StorageKey;
    await this.provider.set(key, data);

    // Add cache metadata
    const metadata = await this.getCacheMetadata('parsed');

    // Remove existing metadata for this key
    const filtered = metadata.filter(m => m.key !== key);

    filtered.push({
      key,
      size: JSON.stringify(data).length,
      accessedAt: Date.now(),
      createdAt: Date.now(),
      expiresAt: Date.now() + this.MAX_CACHE_AGE,
    });

    await this.provider.set('cache.parsed.metadata', filtered);
  }

  /**
   * Remove cached parsed document
   */
  static async removeParsedDocument(documentId: string): Promise<void> {
    const key = `cache.parsed.${documentId}` as StorageKey;
    await this.provider.remove(key);

    // Remove from metadata
    const metadata = await this.getCacheMetadata('parsed');
    const filtered = metadata.filter(m => m.key !== key);
    await this.provider.set('cache.parsed.metadata', filtered);
  }

  // ========== Response Cache ==========

  /**
   * Get cached response for a form
   */
  static async getCachedResponse(formHash: string): Promise<CachedResponse | undefined> {
    const key = `cache.responses.${formHash}` as StorageKey;
    const cached = await this.provider.get(key);

    if (cached && Date.now() - cached.timestamp < this.RESPONSE_CACHE_AGE) {
      // Cache valid
      await this.updateCacheMetadata(key, 'responses');
      return cached;
    }

    // Expired, remove it
    if (cached) {
      await this.removeCachedResponse(formHash);
    }

    return undefined;
  }

  /**
   * Set cached response
   */
  static async setCachedResponse(response: CachedResponse): Promise<void> {
    const key = `cache.responses.${response.formHash}` as StorageKey;
    await this.provider.set(key, response);

    const metadata = await this.getCacheMetadata('responses');

    // Remove existing metadata for this key
    const filtered = metadata.filter(m => m.key !== key);

    filtered.push({
      key,
      size: JSON.stringify(response).length,
      accessedAt: Date.now(),
      createdAt: Date.now(),
      expiresAt: Date.now() + this.RESPONSE_CACHE_AGE,
    });

    await this.provider.set('cache.responses.metadata', filtered);
  }

  /**
   * Remove cached response
   */
  static async removeCachedResponse(formHash: string): Promise<void> {
    const key = `cache.responses.${formHash}` as StorageKey;
    await this.provider.remove(key);

    const metadata = await this.getCacheMetadata('responses');
    const filtered = metadata.filter(m => m.key !== key);
    await this.provider.set('cache.responses.metadata', filtered);
  }

  /**
   * Generate form hash for caching
   */
  static generateFormHash(fields: any[], documentIds: string[]): string {
    const fieldStr = fields.map(f => `${f.label}:${f.type}`).join('|');
    const docStr = documentIds.sort().join('|');
    return `${fieldStr}__${docStr}`;
  }

  // ========== Cache Cleanup ==========

  /**
   * Run cache cleanup (remove expired entries)
   */
  static async cleanup(): Promise<void> {
    const now = Date.now();
    const lastCleanup = await StorageManager.getSetting('storage.lastCleanup') || 0;

    // Run cleanup once per day
    if (now - lastCleanup < 24 * 60 * 60 * 1000) {
      return;
    }

    // Remove expired cache entries
    await this.removeExpiredCache('parsed');
    await this.removeExpiredCache('responses');

    await StorageManager.setSetting('storage.lastCleanup', now);
  }

  /**
   * Remove expired cache entries
   */
  private static async removeExpiredCache(type: 'parsed' | 'responses'): Promise<void> {
    const metadata = await this.getCacheMetadata(type);
    const now = Date.now();
    const expired: string[] = [];

    for (const meta of metadata) {
      if (meta.expiresAt && meta.expiresAt < now) {
        expired.push(meta.key);
      }
    }

    // Remove expired entries
    for (const key of expired) {
      await this.provider.remove(key as StorageKey);
    }

    // Update metadata
    if (expired.length > 0) {
      const filtered = metadata.filter(m => !expired.includes(m.key));
      await this.provider.set(`cache.${type}.metadata` as StorageKey, filtered);
    }
  }

  /**
   * Get cache metadata
   */
  private static async getCacheMetadata(type: 'parsed' | 'responses'): Promise<CacheMetadata[]> {
    const key = `cache.${type}.metadata` as StorageKey;
    return (await this.provider.get(key)) || [];
  }

  /**
   * Update cache metadata (access time)
   */
  private static async updateCacheMetadata(
    cacheKey: StorageKey,
    type: 'parsed' | 'responses'
  ): Promise<void> {
    const metadata = await this.getCacheMetadata(type);
    const item = metadata.find(m => m.key === cacheKey);

    if (item) {
      item.accessedAt = Date.now();
      await this.provider.set(`cache.${type}.metadata` as StorageKey, metadata);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    parsedDocuments: number;
    responses: number;
    totalSize: number;
  }> {
    const parsedMeta = await this.getCacheMetadata('parsed');
    const responsesMeta = await this.getCacheMetadata('responses');

    const totalSize = [
      ...parsedMeta,
      ...responsesMeta,
    ].reduce((sum, meta) => sum + meta.size, 0);

    return {
      parsedDocuments: parsedMeta.length,
      responses: responsesMeta.length,
      totalSize,
    };
  }

  /**
   * Clear all caches
   */
  static async clearAll(): Promise<void> {
    // Get all cache keys
    const parsedMeta = await this.getCacheMetadata('parsed');
    const responsesMeta = await this.getCacheMetadata('responses');

    // Remove all cache entries
    for (const meta of [...parsedMeta, ...responsesMeta]) {
      await this.provider.remove(meta.key as StorageKey);
    }

    // Clear metadata
    await this.provider.set('cache.parsed.metadata', []);
    await this.provider.set('cache.responses.metadata', []);
  }
}
