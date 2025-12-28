/**
 * Storage Schema
 * Defines the structure and types for all storage keys
 */

import { AIProvider, UploadedDocument, ParsedDocumentData } from '@/types';

/**
 * Document Metadata
 */
export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: number;
  parsedAt?: number;
  parsedBy?: 'parser' | 'ai-enhanced';
}

/**
 * Cached Response for form filling
 */
export interface CachedResponse {
  formHash: string;
  fieldResponses: string[];
  timestamp: number;
  aiProvider: AIProvider;
  documentIds: string[];
}

/**
 * Cache Metadata
 */
export interface CacheMetadata {
  key: string;
  size: number;
  accessedAt: number;
  createdAt: number;
  expiresAt?: number;
}

/**
 * Storage Quota Information
 */
export interface QuotaInfo {
  used: number;
  available: number;
  percentage: number;
  lastChecked: number;
}

/**
 * Complete Storage Schema
 * Defines all possible storage keys and their types
 */
export interface StorageSchema {
  // Settings
  'settings.aiProvider': AIProvider;
  'settings.isEnabled': boolean;
  'settings.autoFillMode': boolean;

  // API Keys (per provider)
  'apiKeys.groq': string;
  'apiKeys.claude': string;
  'apiKeys.gemini': string;
  'apiKeys.chromeai': string;

  // Documents
  'documents.list': UploadedDocument[];
  'documents.metadata': DocumentMetadata[];

  // Parsed Document Cache (dynamic keys)
  [key: `cache.parsed.${string}`]: ParsedDocumentData;
  'cache.parsed.metadata': CacheMetadata[];

  // AI Response Cache (dynamic keys)
  [key: `cache.responses.${string}`]: CachedResponse;
  'cache.responses.metadata': CacheMetadata[];

  // Storage Metadata
  'storage.quota': QuotaInfo;
  'storage.lastCleanup': number;
}

/**
 * Type-safe storage keys
 */
export type StorageKey = keyof StorageSchema | `cache.parsed.${string}` | `cache.responses.${string}`;
