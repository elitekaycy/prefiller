/**
 * Storage Migration Script
 * Migrates data from old storage format to new structured schema
 */

import { StorageManager } from './StorageManager';
import { CacheManager } from './CacheManager';
import { AIProvider, UploadedDocument } from '@/types';
import { ChromeStorageProvider } from './ChromeStorageProvider';

interface OldSettings {
  aiProvider?: AIProvider;
  isEnabled?: boolean;
  apiKey?: string; // Old single API key
  groqApiKey?: string;
  claudeApiKey?: string;
  geminiApiKey?: string;
  chromeaiApiKey?: string;
  documents?: UploadedDocument[];
  [key: string]: any;
}

export interface MigrationResult {
  success: boolean;
  migratedItems: string[];
  errors: string[];
  skipped: string[];
}

export class StorageMigration {
  private static provider = new ChromeStorageProvider();

  /**
   * Check if migration is needed
   */
  static async needsMigration(): Promise<boolean> {
    try {
      // Check if old 'settings' object exists
      const oldSettings = await this.getOldSettings();

      if (!oldSettings || Object.keys(oldSettings).length === 0) {
        return false;
      }

      // Check if new structure already exists
      const newAiProvider = await StorageManager.getAIProvider();

      // If we have old settings but no new structure, migration needed
      return !newAiProvider && !!oldSettings.aiProvider;
    } catch (error) {
      return false;
    }
  }

  /**
   * Run the migration
   */
  static async migrate(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedItems: [],
      errors: [],
      skipped: [],
    };

    try {
      const oldSettings = await this.getOldSettings();

      if (!oldSettings || Object.keys(oldSettings).length === 0) {
        result.skipped.push('No old settings found');
        return result;
      }

      // Migrate AI Provider setting
      if (oldSettings.aiProvider) {
        try {
          await StorageManager.setAIProvider(oldSettings.aiProvider);
          result.migratedItems.push(`AI Provider: ${oldSettings.aiProvider}`);
        } catch (error) {
          result.errors.push(`Failed to migrate AI provider: ${error}`);
          result.success = false;
        }
      }

      // Migrate isEnabled setting
      if (typeof oldSettings.isEnabled === 'boolean') {
        try {
          await StorageManager.setIsEnabled(oldSettings.isEnabled);
          result.migratedItems.push(`Enabled setting: ${oldSettings.isEnabled}`);
        } catch (error) {
          result.errors.push(`Failed to migrate isEnabled: ${error}`);
          result.success = false;
        }
      }

      // Migrate API Keys
      await this.migrateApiKeys(oldSettings, result);

      // Migrate documents
      await this.migrateDocuments(oldSettings, result);

      // Clean up old storage if migration successful
      if (result.success && result.errors.length === 0) {
        try {
          await this.cleanupOldStorage();
          result.migratedItems.push('Cleaned up old storage');
        } catch (error) {
          result.errors.push(`Failed to cleanup old storage: ${error}`);
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
      return result;
    }
  }

  /**
   * Migrate API keys from old format
   */
  private static async migrateApiKeys(
    oldSettings: OldSettings,
    result: MigrationResult
  ): Promise<void> {
    // Map of old key names to new provider names
    const keyMappings: Array<{
      oldKey: keyof OldSettings;
      provider: AIProvider;
    }> = [
      { oldKey: 'groqApiKey', provider: 'groq' },
      { oldKey: 'claudeApiKey', provider: 'claude' },
      { oldKey: 'geminiApiKey', provider: 'gemini' },
      { oldKey: 'chromeaiApiKey', provider: 'chromeai' },
    ];

    // Migrate provider-specific keys
    for (const { oldKey, provider } of keyMappings) {
      const apiKey = oldSettings[oldKey];
      if (apiKey && typeof apiKey === 'string') {
        try {
          await StorageManager.setApiKey(provider, apiKey);
          result.migratedItems.push(`API Key: ${provider}`);
        } catch (error) {
          result.errors.push(`Failed to migrate ${provider} API key: ${error}`);
          result.success = false;
        }
      }
    }

    // Migrate old single 'apiKey' if it exists
    // Assume it belongs to the current AI provider
    if (oldSettings.apiKey && oldSettings.aiProvider) {
      try {
        const existingKey = await StorageManager.getApiKey(oldSettings.aiProvider);

        // Only migrate if no provider-specific key was already set
        if (!existingKey) {
          await StorageManager.setApiKey(oldSettings.aiProvider, oldSettings.apiKey);
          result.migratedItems.push(`Legacy API Key migrated to ${oldSettings.aiProvider}`);
        } else {
          result.skipped.push(`API key for ${oldSettings.aiProvider} already exists`);
        }
      } catch (error) {
        result.errors.push(`Failed to migrate legacy API key: ${error}`);
        result.success = false;
      }
    }
  }

  /**
   * Migrate documents and cache parsed data
   */
  private static async migrateDocuments(
    oldSettings: OldSettings,
    result: MigrationResult
  ): Promise<void> {
    const documents = oldSettings.documents;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      result.skipped.push('No documents to migrate');
      return;
    }

    for (const doc of documents) {
      try {
        // Add document to new storage
        await StorageManager.addDocument(doc);
        result.migratedItems.push(`Document: ${doc.name}`);

        // If document has parsed data, cache it
        if (doc.parsedData) {
          try {
            await CacheManager.setParsedDocument(doc.id, doc.parsedData);
            result.migratedItems.push(`Cached parsed data for: ${doc.name}`);
          } catch (error) {
            result.errors.push(`Failed to cache parsed data for ${doc.name}: ${error}`);
            // Don't mark as failed, document is still migrated
          }
        }
      } catch (error) {
        result.errors.push(`Failed to migrate document ${doc.name}: ${error}`);
        result.success = false;
      }
    }
  }

  /**
   * Get old settings object
   */
  private static async getOldSettings(): Promise<OldSettings | null> {
    try {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(['settings'], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result.settings || null);
          }
        });
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean up old storage format
   */
  private static async cleanupOldStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(['settings'], () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Run migration automatically on extension startup
   * Call this from background script or popup initialization
   */
  static async autoMigrate(): Promise<void> {
    try {
      const needsMigration = await this.needsMigration();

      if (needsMigration) {
        const result = await this.migrate();

        if (result.success) {
          // Migration successful, could show notification to user
          return;
        } else {
          // Migration had errors, could show warning to user
          console.warn('Migration completed with errors:', result.errors);
        }
      }
    } catch (error) {
      // Silent fail - don't break extension if migration fails
      console.warn('Auto-migration failed:', error);
    }
  }

  /**
   * Get migration status for display in settings
   */
  static async getMigrationStatus(): Promise<{
    needed: boolean;
    hasOldData: boolean;
    hasNewData: boolean;
  }> {
    try {
      const oldSettings = await this.getOldSettings();
      const hasOldData = !!oldSettings && Object.keys(oldSettings).length > 0;

      const newAiProvider = await StorageManager.getAIProvider();
      const hasNewData = !!newAiProvider;

      const needed = hasOldData && !hasNewData;

      return {
        needed,
        hasOldData,
        hasNewData,
      };
    } catch (error) {
      return {
        needed: false,
        hasOldData: false,
        hasNewData: false,
      };
    }
  }
}
