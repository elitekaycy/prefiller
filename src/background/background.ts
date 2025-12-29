import { StorageManager } from '@/storage';
import { BrowserAPI } from '@/utils/browserApi';

BrowserAPI.runtime.onInstalled.addListener(async () => {
  // Enable side panel behavior (Chrome-specific)
  try {
    await BrowserAPI.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    // Silent fail - side panel may not be available in all environments
  }
});

BrowserAPI.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  switch (message.action) {
    case 'ANALYZE_PAGE':
      if (sender.tab?.id) {
        BrowserAPI.tabs.sendMessage(sender.tab.id, { action: 'ANALYZE_FORMS' });
      }
      break;

    case 'FILL_FORMS':
      if (sender.tab?.id) {
        BrowserAPI.tabs.sendMessage(sender.tab.id, { action: 'FILL_FORMS' });
      }
      break;
  }
});

BrowserAPI.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const isEnabled = await StorageManager.getIsEnabled();
      if (isEnabled) {
        setTimeout(() => {
          BrowserAPI.tabs.sendMessage(tabId, { action: 'ANALYZE_FORMS' });
        }, 1000);
      }
    } catch (error) {
      // Silent fail
    }
  }
});