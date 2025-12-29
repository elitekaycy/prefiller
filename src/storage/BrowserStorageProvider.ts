/**
 * Browser Storage Provider
 * Implementation of IStorageProvider using BrowserAPI (works across Chrome/Firefox)
 */

import { IStorageProvider } from './IStorageProvider';
import { StorageSchema, StorageKey, QuotaInfo } from './StorageSchema';
import { BrowserAPI } from '@/utils/browserApi';

export class BrowserStorageProvider implements IStorageProvider {
  constructor(private area: 'local' | 'sync' = 'local') {}

  async get<K extends StorageKey>(
    key: K
  ): Promise<K extends keyof StorageSchema ? StorageSchema[K] | undefined : any> {
    const result = await BrowserAPI.storage.local.get([key as string]);
    return result[key as string];
  }

  async set<K extends StorageKey>(
    key: K,
    value: K extends keyof StorageSchema ? StorageSchema[K] : any
  ): Promise<void> {
    await BrowserAPI.storage.local.set({ [key as string]: value });
  }

  async remove(key: StorageKey): Promise<void> {
    await BrowserAPI.storage.local.remove(key as string);
  }

  async clear(): Promise<void> {
    await BrowserAPI.storage.local.clear();
  }

  async getKeys(): Promise<string[]> {
    const items = await BrowserAPI.storage.local.get(null);
    return Object.keys(items);
  }

  async getQuota(): Promise<QuotaInfo> {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
        percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
        lastChecked: Date.now(),
      };
    } catch (error) {
      // Fallback if estimate API not available
      return {
        used: 0,
        available: 10 * 1024 * 1024, // Assume 10MB
        percentage: 0,
        lastChecked: Date.now(),
      };
    }
  }

  async getMultiple(keys: StorageKey[]): Promise<Record<string, any>> {
    return await BrowserAPI.storage.local.get(keys as string[]);
  }

  async setMultiple(items: Record<string, any>): Promise<void> {
    await BrowserAPI.storage.local.set(items);
  }
}

// Keep ChromeStorageProvider as alias for backwards compatibility
export { BrowserStorageProvider as ChromeStorageProvider };
