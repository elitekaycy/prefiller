chrome.runtime.onInstalled.addListener(async () => {
  console.log('Prefiller extension installed');

  // Enable side panel behavior
  await chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Error setting panel behavior:', error));

  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          apiKey: '',
          documents: [],
          isEnabled: true
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'GET_SETTINGS':
      chrome.storage.local.get(['settings'], (result) => {
        sendResponse(result.settings);
      });
      return true;

    case 'SAVE_SETTINGS':
      chrome.storage.local.set({ settings: message.settings }, () => {
        sendResponse({ success: true });
      });
      return true;

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings?.isEnabled) {
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { action: 'ANALYZE_FORMS' });
        }, 1000);
      }
    });
  }
});