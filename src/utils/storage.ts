import { ExtensionSettings } from '@/types';

export class StorageManager {
  // Storage limits
  private static readonly MAX_DOCUMENT_SIZE = 500000; // 500KB per document
  private static readonly MAX_TOTAL_SIZE = 5000000; // 5MB total

  static async getSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        const defaultSettings: ExtensionSettings = {
          apiKey: '',
          documents: [],
          isEnabled: true
        };

        resolve(result.settings || defaultSettings);
      });
    });
  }

  static async saveSettings(settings: ExtensionSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      // Validate size before saving
      const settingsSize = new Blob([JSON.stringify(settings)]).size;

      if (settingsSize > this.MAX_TOTAL_SIZE) {
        reject(new Error(`Storage limit exceeded. Total size: ${Math.round(settingsSize / 1024)}KB. Maximum allowed: ${Math.round(this.MAX_TOTAL_SIZE / 1024)}KB. Please remove some documents.`));
        return;
      }

      chrome.storage.local.set({ settings }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  static async updateSettings(updates: Partial<ExtensionSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    await this.saveSettings(newSettings);
  }

  static async clearSettings(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  static validateDocumentSize(content: string, filename: string): { valid: boolean; error?: string } {
    const size = new Blob([content]).size;

    if (size > this.MAX_DOCUMENT_SIZE) {
      return {
        valid: false,
        error: `Document "${filename}" is too large (${Math.round(size / 1024)}KB). Maximum size per document is ${Math.round(this.MAX_DOCUMENT_SIZE / 1024)}KB.`
      };
    }

    return { valid: true };
  }

  static async getStorageUsage(): Promise<{ used: number; total: number; percentage: number }> {
    return new Promise((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        const total = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB default
        resolve({
          used: bytesInUse,
          total,
          percentage: Math.round((bytesInUse / total) * 100)
        });
      });
    });
  }
}