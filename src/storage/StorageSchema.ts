/**
 * Storage Schema
 * Defines the structure and types for all storage keys
 */

import { AIProvider, UploadedDocument, ParsedDocumentData, URLContext } from '@/types';

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
 * API Usage Tracking Data (per provider)
 */
export interface APIUsageData {
  requestCount: number;      // Number of requests made today
  dailyLimit: number;         // Configured daily limit (default: 100)
  resetDate: string;          // ISO date string for last reset (YYYY-MM-DD)
  lastRequestAt: number;      // Timestamp of last request
  warningShown: boolean;      // Whether 80% warning was shown today
}

/**
 * Computed Usage Statistics (for UI display)
 */
export interface UsageStats {
  today: number;              // Requests made today
  limit: number;              // Daily limit
  percentage: number;         // Usage percentage (0-100)
  remaining: number;          // Requests remaining
  resetAt: string;            // When usage resets (midnight local time)
  isBlocked: boolean;         // Whether requests are blocked (100%+)
  warningShown: boolean;      // Whether 80% warning was shown today
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

  // API Usage Tracking (per provider)
  'usage.groq': APIUsageData;
  'usage.claude': APIUsageData;
  'usage.gemini': APIUsageData;
  'usage.chromeai': APIUsageData;
  'usage.defaultLimit': number;  // Default daily limit (100)

  // Documents
  'documents.list': UploadedDocument[];
  'documents.metadata': DocumentMetadata[];

  // URL Contexts
  'urlContexts.list': URLContext[];

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
