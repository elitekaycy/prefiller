/**
 * Storage Module Exports
 * Centralized exports for all storage-related classes and types
 */

// Core Storage Classes
export { StorageManager } from './StorageManager';
export { CacheManager } from './CacheManager';

// Storage Provider Interface and Implementation
export { IStorageProvider } from './IStorageProvider';
export { BrowserStorageProvider, ChromeStorageProvider } from './BrowserStorageProvider';

// Storage Schema and Types
export type {
  StorageSchema,
  StorageKey,
  DocumentMetadata,
  CachedResponse,
  CacheMetadata,
  QuotaInfo,
} from './StorageSchema';
