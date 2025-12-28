/**
 * Storage Module Exports
 * Centralized exports for all storage-related classes and types
 */

// Core Storage Classes
export { StorageManager } from './StorageManager';
export { CacheManager } from './CacheManager';
export { StorageMigration } from './migration';

// Storage Provider Interface and Implementation
export { IStorageProvider } from './IStorageProvider';
export { ChromeStorageProvider } from './ChromeStorageProvider';

// Storage Schema and Types
export type {
  StorageSchema,
  StorageKey,
  DocumentMetadata,
  CachedResponse,
  CacheMetadata,
  QuotaInfo,
} from './StorageSchema';

export type { MigrationResult } from './migration';
