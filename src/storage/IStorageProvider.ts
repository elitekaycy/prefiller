/**
 * Storage Provider Interface
 * Defines the contract for storage implementations
 */

import { StorageSchema, StorageKey, QuotaInfo } from './StorageSchema';

export interface IStorageProvider {
  /**
   * Get value for a key
   */
  get<K extends StorageKey>(
    key: K
  ): Promise<K extends keyof StorageSchema ? StorageSchema[K] | undefined : any>;

  /**
   * Set value for a key
   */
  set<K extends StorageKey>(
    key: K,
    value: K extends keyof StorageSchema ? StorageSchema[K] : any
  ): Promise<void>;

  /**
   * Remove a key
   */
  remove(key: StorageKey): Promise<void>;

  /**
   * Clear all storage
   */
  clear(): Promise<void>;

  /**
   * Get all keys
   */
  getKeys(): Promise<string[]>;

  /**
   * Get storage quota information
   */
  getQuota(): Promise<QuotaInfo>;

  /**
   * Get multiple keys at once
   */
  getMultiple(keys: StorageKey[]): Promise<Record<string, any>>;

  /**
   * Set multiple keys at once
   */
  setMultiple(items: Record<string, any>): Promise<void>;
}
