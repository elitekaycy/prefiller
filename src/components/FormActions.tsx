import { useState } from 'preact/hooks';

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
          console.log('Content script is loaded and responding');
          return true;
        } catch (error) {
          console.log('Content script not responding:', error);
          return false;
        }
      };

      // Helper function to inject content script if needed
      const ensureContentScript = async (tabId: number) => {
        const isLoaded = await checkContentScript(tabId);
        
        if (!isLoaded) {
          try {
            console.log('Attempting to inject content script...');
            // Try to inject the content script
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['content.js']
            });
            
            // Wait a bit for the script to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check again
            const isNowLoaded = await checkContentScript(tabId);
            console.log('Content script loaded after injection:', isNowLoaded);
            if (!isNowLoaded) {
              throw new Error('Failed to load content script. Please refresh the page and try again.');
            }
          } catch (error) {
            console.error('Content script injection failed:', error);
            throw new Error('Unable to inject content script. Please refresh the page and try again.');
          }
        }
      };

      // Ensure content script is loaded
      await ensureContentScript(tab.id);
      setContentScriptStatus('loaded');

      console.log('📡 Triggering form fill in all frames...');

      // Use executeScript to run in all frames (main + iframes)
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
          // This runs in each frame (main page AND all iframes)
          window.postMessage({ type: 'PREFILLER_FILL_FORMS' }, '*');
        }
      });

      console.log('✅ Fill command sent to all frames');
    } catch (error) {
      console.error('Error processing forms:', error);
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
    <>
      <div className="step-header">
        <div className="step-title">Ready to Fill Forms</div>
        <div className="step-subtitle">
          Analyze and fill forms with AI assistance
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="status-grid rounded-xl p-4 text-center">
            <span className="material-symbols-outlined text-2xl mb-2">
              {hasApiKey ? 'check_circle' : 'error'}
            </span>
            <div className="text-xs text-gray-600">API Key</div>
            <div className={`text-sm font-medium ${hasApiKey ? 'text-green-400' : 'text-red-400'}`}>
              {hasApiKey ? 'Connected' : 'Missing'}
            </div>
          </div>

          <div className="status-grid rounded-xl p-4 text-center">
            <span className="material-symbols-outlined text-2xl mb-2">description</span>
            <div className="text-xs text-gray-600">Documents</div>
            <div className={`text-sm font-medium ${hasDocuments ? 'text-green-400' : 'text-yellow-400'}`}>
              {hasDocuments ? `${hasDocuments} loaded` : 'Optional'}
            </div>
          </div>
        </div>

        {/* Extension Toggle */}
        <div className="flex items-center justify-between status-grid rounded-xl p-4">
          <div>
            <div className="text-gray-200 font-medium">Auto-Fill Mode</div>
            <div className="text-xs text-gray-400">Enable form filling assistance</div>
          </div>
          <button
            onClick={() => onToggle(!isEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled
                ? 'bg-blue-500'
                : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAnalyzeAndFill}
          disabled={!canUseFeatures || isProcessing}
          className={`gemini-button primary w-full ${!canUseFeatures ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="material-symbols-outlined">auto_fix_high</span>
          <span>{isProcessing ? 'Processing...' : 'Analyze & Fill Forms'}</span>
          {isProcessing && (
            <div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
          )}
        </button>

        {/* Content Script Status & Refresh Button */}
        {contentScriptStatus === 'failed' && (
          <div className="space-y-3">
            <div className="error-box">
              <span className="material-symbols-outlined">error</span>
              <span>Content script failed to load. This may happen on some websites with strict security policies.</span>
            </div>
            <button
              onClick={handleRefreshPage}
              className="gemini-button secondary w-full"
            >
              <span className="material-symbols-outlined">refresh</span>
              <span>Refresh Page & Try Again</span>
            </button>
          </div>
        )}

        {/* Instructions */}
        {canUseFeatures ? (
          <div className="info-box">
            <div className="info-box-title">How to use:</div>
            <div className="text-xs space-y-1">
              <div>• Click "Analyze & Fill Forms" to detect and auto-complete form fields</div>
              <div>• Review and adjust the generated content as needed</div>
              <div>• The extension uses your personal documents for context</div>
            </div>
          </div>
        ) : (
          <div className="error-box">
            <span className="material-symbols-outlined">error</span>
            <span>{!hasApiKey ? 'API key required to use form filling features' : 'Enable auto-fill mode to continue'}</span>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={onBack}
          className="gemini-button w-full"
        >
          ← Back to Documents
        </button>
      </div>
    </>
  );
}