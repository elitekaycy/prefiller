import { StorageManager } from '@/storage';
import { BrowserAPI } from '@/utils/browserApi';
import { UsageTracker } from '@/utils/usageTracker';
import { AIProvider } from '@/types';

BrowserAPI.runtime.onInstalled.addListener(async () => {
  // Enable side panel behavior (Chrome-specific)
  try {
    await BrowserAPI.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    // Silent fail - side panel may not be available in all environments
  }

  // Create alarm for daily usage reset check (runs every hour)
  BrowserAPI.alarms.create('usage-reset-check', {
    periodInMinutes: 60, // Check every hour
  });

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

// Listen for alarm to check and reset usage daily
BrowserAPI.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'usage-reset-check') {

    const providers: AIProvider[] = ['groq', 'claude', 'gemini', 'chromeai'];

    for (const provider of providers) {
      try {
        const needsReset = await UsageTracker.checkAndResetIfNeeded(provider);
        if (needsReset) {
        }
      } catch (error) {
        console.error(`[Background] Failed to check/reset usage for ${provider}:`, error);
      }
    }
  }
});