import { useState } from 'preact/hooks';
import { Button, Header, FixedFooter } from './ui';

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
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        alert('No active tab found. Please refresh the page and try again.');
        return;
      }

      // Helper function to check if content script is loaded
      const checkContentScript = async (tabId: number) => {
        try {
          await chrome.tabs.sendMessage(tabId, { action: 'PING' });
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
            await chrome.scripting.executeScript({
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
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
          window.postMessage({ type: 'PREFILLER_FILL_FORMS' }, '*');
        }
      });
    } catch (error) {
      setContentScriptStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshPage = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.tabs.reload(tab.id);
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

      <div className="flex-1 space-y-6 pb-24">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                hasApiKey ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className={`material-symbols-outlined ${
                  hasApiKey ? 'text-green-600' : 'text-red-600'
                }`}>
                  {hasApiKey ? 'check_circle' : 'error'}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium">AI Provider</div>
                <div className={`text-sm font-semibold ${
                  hasApiKey ? 'text-green-600' : 'text-red-600'
                }`}>
                  {hasApiKey ? 'Connected' : 'Not Set'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                hasDocuments ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <span className={`material-symbols-outlined ${
                  hasDocuments ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  description
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium">Documents</div>
                <div className={`text-sm font-semibold ${
                  hasDocuments ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {hasDocuments ? 'Loaded' : 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Action */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Button
            onClick={handleAnalyzeAndFill}
            disabled={!canUseFeatures}
            loading={isProcessing}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <span className="material-symbols-outlined">auto_fix_high</span>
            <span>{isProcessing ? 'Processing...' : 'Analyze & Fill Forms'}</span>
          </Button>

          {/* Status Message */}
          <div className="mt-4 text-center">
            {!canUseFeatures ? (
              <div className="text-sm text-red-600">
                {!hasApiKey ? '⚠️ AI provider not configured' : '⚠️ Extension disabled'}
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                Click to detect and auto-fill form fields on this page
              </div>
            )}
          </div>
        </div>

        {/* Content Script Error */}
        {contentScriptStatus === 'failed' && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600">error</span>
              <div className="flex-1 text-sm text-red-800">
                Content script failed to load. This may happen on some websites with strict security policies.
              </div>
            </div>
            <Button
              onClick={handleRefreshPage}
              variant="secondary"
              className="w-full"
            >
              <span className="material-symbols-outlined">refresh</span>
              <span>Refresh Page & Try Again</span>
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-900 mb-2">💡 How to use:</div>
          <ul className="text-xs text-blue-800 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Click "Analyze & Fill Forms" to detect and auto-complete form fields</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Review and adjust the generated content as needed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Upload documents for better context and accuracy</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Fixed Footer removed - no longer needed since back button is in header */}
    </div>
  );
}
