/**
 * Chrome Storage Provider
 * Implementation of IStorageProvider using chrome.storage.local
 */

import { IStorageProvider } from './IStorageProvider';
import { StorageSchema, StorageKey, QuotaInfo } from './StorageSchema';

export class ChromeStorageProvider implements IStorageProvider {
  constructor(private area: 'local' | 'sync' = 'local') {}

  async get<K extends StorageKey>(
    key: K
  ): Promise<K extends keyof StorageSchema ? StorageSchema[K] | undefined : any> {
    const storage = this.getStorage();
    return new Promise((resolve, reject) => {
      storage.get([key as string], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result[key as string]);
        }
      });
    });
  }

  async set<K extends StorageKey>(
    key: K,
    value: K extends keyof StorageSchema ? StorageSchema[K] : any
  ): Promise<void> {
    const storage = this.getStorage();
    return new Promise((resolve, reject) => {
      storage.set({ [key as string]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  async remove(key: StorageKey): Promise<void> {
    const storage = this.getStorage();
    return new Promise((resolve, reject) => {
      storage.remove(key as string, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  async clear(): Promise<void> {
    const storage = this.getStorage();
    return new Promise((resolve, reject) => {
      storage.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  async getKeys(): Promise<string[]> {
    const storage = this.getStorage();
    return new Promise((resolve, reject) => {
      storage.get(null, (items) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(Object.keys(items));
        }
      });
    });
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
    const storage = this.getStorage();
    return new Promise((resolve, reject) => {
      storage.get(keys as string[], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  async setMultiple(items: Record<string, any>): Promise<void> {
    const storage = this.getStorage();
    return new Promise((resolve, reject) => {
      storage.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  private getStorage() {
    return this.area === 'local' ? chrome.storage.local : chrome.storage.sync;
  }
}
