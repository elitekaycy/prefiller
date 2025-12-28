import { StorageMigration, StorageManager } from '@/storage';

chrome.runtime.onInstalled.addListener(async () => {
  // Enable side panel behavior
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    // Silent fail - side panel may not be available in all environments
  }

  // Run storage migration on install/update
  try {
    await StorageMigration.autoMigrate();
  } catch (error) {
    // Silent fail - migration errors shouldn't break installation
  }
});

chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  switch (message.action) {
    case 'ANALYZE_PAGE':
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { action: 'ANALYZE_FORMS' });
      }
      break;

    case 'FILL_FORMS':
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { action: 'FILL_FORMS' });
      }
      break;
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const isEnabled = await StorageManager.getIsEnabled();
      if (isEnabled) {
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { action: 'ANALYZE_FORMS' });
        }, 1000);
      }
    } catch (error) {
      // Silent fail
    }
  }
});