import { useState } from 'preact/hooks';
import { Button, Header, FixedFooter } from './ui';
import { BrowserAPI } from '@/utils/browserApi';
import { Toast } from '@/utils/toast';

interface FormActionsProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onBack: () => void;
  hasDocuments: boolean;
  hasApiKey: boolean;
}

export function FormActions({ isEnabled, onToggle, onBack, hasDocuments, hasApiKey }: FormActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [contentScriptStatus, setContentScriptStatus] = useState<'unknown' | 'loaded' | 'failed'>('unknown');

  const handleAnalyzeAndFill = async () => {
    setIsProcessing(true);

    try {
      const tabs = await BrowserAPI.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];

      if (!tab.id) {
        alert('No active tab found. Please refresh the page and try again.');
        return;
      }

      // Helper function to check if content script is loaded
      const checkContentScript = async (tabId: number) => {
        try {
          await BrowserAPI.tabs.sendMessage(tabId, { action: 'PING' });
          return true;
        } catch (error) {
          return false;
        }
      };

      // Helper function to inject content script if needed
      const ensureContentScript = async (tabId: number) => {
        const isLoaded = await checkContentScript(tabId);

        if (!isLoaded) {
          try {
            await BrowserAPI.scripting.executeScript({
              target: { tabId },
              files: ['content.js']
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            const isNowLoaded = await checkContentScript(tabId);
            if (!isNowLoaded) {
              throw new Error('Failed to load content script. Please refresh the page and try again.');
            }
          } catch (error) {
            throw new Error('Unable to inject content script. Please refresh the page and try again.');
          }
        }
      };

      await ensureContentScript(tab.id);
      setContentScriptStatus('loaded');

      // Use executeScript to run in all frames (main + iframes)
      await BrowserAPI.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
          window.postMessage({ type: 'PREFILLER_FILL_FORMS' }, '*');
        }
      });
    } catch (error) {
      setContentScriptStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshPage = async () => {
    try {
      const tabs = await BrowserAPI.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (tab?.id) {
        await BrowserAPI.tabs.reload(tab.id);
        setContentScriptStatus('unknown');
      }
    } catch (error) {
      console.error('Error refreshing page:', error);
    }
  };

  const canUseFeatures = hasApiKey && isEnabled;

  return (
    <div className="flex flex-col h-full">
      <Header title="Ready to Fill" onBack={onBack} />

      <div className="flex-1 space-y-4 pb-20">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg border p-3 text-center ${
            hasApiKey
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
              : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
          }`}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                hasApiKey ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <span className={`material-symbols-outlined text-base ${
                  hasApiKey ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {hasApiKey ? 'check_circle' : 'close'}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium">AI Provider</div>
                <div className={`text-xs font-semibold ${
                  hasApiKey ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {hasApiKey ? 'Connected' : 'Not Set'}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border p-3 text-center ${
            hasDocuments
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
              : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
          }`}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-between ${
                hasDocuments ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <span className={`material-symbols-outlined text-base ${
                  hasDocuments ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {hasDocuments ? 'description' : 'close'}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium">Documents</div>
                <div className={`text-xs font-semibold ${
                  hasDocuments ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {hasDocuments ? 'Loaded' : 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {!canUseFeatures && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center text-xs text-red-700">
            {!hasApiKey ? 'AI provider not configured' : 'Extension disabled'}
          </div>
        )}

        {/* Content Script Error */}
        {contentScriptStatus === 'failed' && (
          <div className="space-y-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-red-500 text-base">error</span>
              <div className="flex-1 text-xs text-red-800">
                Content script failed. Try refreshing the page.
              </div>
            </div>
            <Button
              onClick={handleRefreshPage}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <span className="material-symbols-outlined">refresh</span>
              <span>Refresh Page</span>
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3">
          <div className="text-xs font-medium text-blue-900 mb-1.5">How to use:</div>
          <ul className="text-xs text-gray-700 space-y-1">
            <li className="flex items-start gap-1.5">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Click button to detect and fill form fields</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Review and adjust as needed</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Fixed Footer with Analyze Button */}
      <FixedFooter>
        <Button
          onClick={handleAnalyzeAndFill}
          disabled={!canUseFeatures}
          loading={isProcessing}
          variant="primary"
          className="w-full"
        >
          <span className="material-symbols-outlined">auto_fix_high</span>
          <span>{isProcessing ? 'Processing...' : 'Analyze & Fill Forms'}</span>
        </Button>
      </FixedFooter>
    </div>
  );
}
