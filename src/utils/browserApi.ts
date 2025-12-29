/**
 * Browser API Abstraction Layer
 * Provides a unified API that works across Chrome, Firefox, and other browsers
 */

type BrowserType = 'chrome' | 'firefox' | 'edge' | 'unknown';

/**
 * Detect the current browser
 */
export function detectBrowser(): BrowserType {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('edg/')) {
    return 'edge';
  }
  if (userAgent.includes('firefox')) {
    return 'firefox';
  }
  if (userAgent.includes('chrome')) {
    return 'chrome';
  }

  return 'unknown';
}

/**
 * Get the appropriate browser extension API
 * Chrome uses chrome.*, Firefox uses browser.*
 */
function getBrowserAPI(): any {
  // Firefox uses browser API
  if (typeof (window as any).browser !== 'undefined') {
    return (window as any).browser;
  }

  // Chrome/Edge use chrome API
  if (typeof chrome !== 'undefined') {
    return chrome;
  }

  throw new Error('No browser extension API available');
}

/**
 * Unified Browser API
 */
export const BrowserAPI = {
  /**
   * Get the current browser type
   */
  getBrowserType(): BrowserType {
    return detectBrowser();
  },

  /**
   * Check if running in Chrome
   */
  isChrome(): boolean {
    return detectBrowser() === 'chrome';
  },

  /**
   * Check if running in Firefox
   */
  isFirefox(): boolean {
    return detectBrowser() === 'firefox';
  },

  /**
   * Storage API - works with both chrome.storage and browser.storage
   */
  storage: {
    local: {
      get(keys: string | string[] | null): Promise<Record<string, any>> {
        const api = getBrowserAPI();
        return new Promise((resolve, reject) => {
          api.storage.local.get(keys, (result: Record<string, any>) => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
      },

      set(items: Record<string, any>): Promise<void> {
        const api = getBrowserAPI();
        return new Promise((resolve, reject) => {
          api.storage.local.set(items, () => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      },

      remove(keys: string | string[]): Promise<void> {
        const api = getBrowserAPI();
        return new Promise((resolve, reject) => {
          api.storage.local.remove(keys, () => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      },

      clear(): Promise<void> {
        const api = getBrowserAPI();
        return new Promise((resolve, reject) => {
          api.storage.local.clear(() => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      },
    },
  },

  /**
   * Runtime API
   */
  runtime: {
    get lastError() {
      const api = getBrowserAPI();
      return api.runtime.lastError;
    },

    onMessage: {
      addListener(
        callback: (
          message: any,
          sender: any,
          sendResponse: (response?: any) => void
        ) => boolean | void
      ): void {
        const api = getBrowserAPI();
        api.runtime.onMessage.addListener(callback);
      },
    },

    onInstalled: {
      addListener(callback: (details: any) => void): void {
        const api = getBrowserAPI();
        api.runtime.onInstalled.addListener(callback);
      },
    },

    sendMessage(message: any): Promise<any> {
      const api = getBrowserAPI();
      return new Promise((resolve, reject) => {
        api.runtime.sendMessage(message, (response: any) => {
          if (api.runtime.lastError) {
            reject(new Error(api.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    },
  },

  /**
   * Tabs API
   */
  tabs: {
    query(queryInfo: any): Promise<any[]> {
      const api = getBrowserAPI();
      return new Promise((resolve, reject) => {
        api.tabs.query(queryInfo, (tabs: any[]) => {
          if (api.runtime.lastError) {
            reject(new Error(api.runtime.lastError.message));
          } else {
            resolve(tabs);
          }
        });
      });
    },

    sendMessage(tabId: number, message: any): Promise<any> {
      const api = getBrowserAPI();
      return new Promise((resolve, reject) => {
        api.tabs.sendMessage(tabId, message, (response: any) => {
          if (api.runtime.lastError) {
            reject(new Error(api.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    },

    reload(tabId: number): Promise<void> {
      const api = getBrowserAPI();
      return new Promise((resolve, reject) => {
        api.tabs.reload(tabId, () => {
          if (api.runtime.lastError) {
            reject(new Error(api.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    },

    onUpdated: {
      addListener(
        callback: (tabId: number, changeInfo: any, tab: any) => void
      ): void {
        const api = getBrowserAPI();
        api.tabs.onUpdated.addListener(callback);
      },
    },
  },

  /**
   * Scripting API
   */
  scripting: {
    executeScript(options: any): Promise<any[]> {
      const api = getBrowserAPI();
      return api.scripting.executeScript(options);
    },
  },

  /**
   * Side Panel API (Chrome-specific)
   */
  sidePanel: {
    async setPanelBehavior(options: any): Promise<void> {
      const api = getBrowserAPI();

      // Side panel is Chrome-specific, skip on Firefox
      if (detectBrowser() === 'firefox') {
        return;
      }

      if (api.sidePanel?.setPanelBehavior) {
        await api.sidePanel.setPanelBehavior(options);
      }
    },
  },
};

/**
 * Export browser type for conditional logic
 */
export const BROWSER_TYPE = detectBrowser();
export const IS_CHROME = BROWSER_TYPE === 'chrome';
export const IS_FIREFOX = BROWSER_TYPE === 'firefox';
export const IS_EDGE = BROWSER_TYPE === 'edge';
