import { ExtensionSettings } from '@/types';

export class StorageManager {
  static async getSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
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
      chrome.storage.sync.set({ settings }, () => {
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
      chrome.storage.sync.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}