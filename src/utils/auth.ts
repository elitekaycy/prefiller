export class GeminiAuth {
  private static readonly AI_STUDIO_URL = 'https://aistudio.google.com/app/apikey';
  private static readonly MAKERSUITE_URL = 'https://makersuite.google.com/app/apikey';

  static async openAuthWindow(): Promise<string | null> {
    return new Promise((resolve) => {
      // Open the Google AI Studio API key page in a new window
      const width = 800;
      const height = 700;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;

      chrome.windows.create({
        url: this.AI_STUDIO_URL,
        type: 'popup',
        width,
        height,
        left: Math.round(left),
        top: Math.round(top)
      }, (window) => {
        if (!window || !window.id) {
          resolve(null);
          return;
        }

        const windowId = window.id;

        // Set up a listener to detect when user is done
        const checkInterval = setInterval(async () => {
          try {
            const win = await chrome.windows.get(windowId);
            // Window still exists, continue checking
          } catch (error) {
            // Window closed, prompt user to paste API key
            clearInterval(checkInterval);
            this.promptForApiKey().then(resolve);
          }
        }, 1000);

        // Also listen for window removal
        const onRemoved = (closedWindowId: number) => {
          if (closedWindowId === windowId) {
            clearInterval(checkInterval);
            chrome.windows.onRemoved.removeListener(onRemoved);
            this.promptForApiKey().then(resolve);
          }
        };

        chrome.windows.onRemoved.addListener(onRemoved);
      });
    });
  }

  private static async promptForApiKey(): Promise<string | null> {
    return new Promise((resolve) => {
      // Send message to popup to show API key input
      chrome.runtime.sendMessage({ action: 'PROMPT_API_KEY' }, (response) => {
        resolve(response?.apiKey || null);
      });
    });
  }

  static async connectWithFlow(): Promise<{ success: boolean; apiKey?: string; error?: string }> {
    try {
      // Open Google AI Studio
      const apiKey = await this.openAuthWindow();

      if (!apiKey) {
        return { success: false, error: 'No API key provided' };
      }

      // Validate the API key
      const isValid = await this.validateApiKey(apiKey);

      if (!isValid) {
        return { success: false, error: 'Invalid API key' };
      }

      return { success: true, apiKey };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  static async tryExtractApiKeyFromPage(tabId: number): Promise<string | null> {
    try {
      // Try to inject a script to extract API key from the page
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Look for API key patterns on the page
          const apiKeyPattern = /AIzaSy[a-zA-Z0-9_-]{33}/g;
          const bodyText = document.body.innerText;
          const matches = bodyText.match(apiKeyPattern);
          return matches ? matches[0] : null;
        }
      });

      return results[0]?.result || null;
    } catch (error) {
      console.error('Failed to extract API key:', error);
      return null;
    }
  }
}