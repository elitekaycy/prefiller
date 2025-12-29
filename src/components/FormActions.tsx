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
          <div
            className="rounded-lg border p-3 text-center"
            style={{
              backgroundColor: hasApiKey ? 'rgba(129, 201, 149, 0.1)' : 'var(--gemini-surface)',
              borderColor: hasApiKey ? 'var(--gemini-success)' : 'var(--gemini-border)'
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: hasApiKey ? 'rgba(129, 201, 149, 0.2)' : 'var(--gemini-bg)'
                }}
              >
                <span
                  className="material-symbols-outlined text-base"
                  style={{ color: hasApiKey ? 'var(--gemini-success)' : 'var(--gemini-text-secondary)' }}
                >
                  {hasApiKey ? 'check_circle' : 'close'}
                </span>
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--gemini-text-secondary)' }}>AI Provider</div>
                <div
                  className="text-xs font-semibold"
                  style={{ color: hasApiKey ? 'var(--gemini-success)' : 'var(--gemini-text-secondary)' }}
                >
                  {hasApiKey ? 'Connected' : 'Not Set'}
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-lg border p-3 text-center"
            style={{
              backgroundColor: hasDocuments ? 'rgba(138, 180, 248, 0.1)' : 'var(--gemini-surface)',
              borderColor: hasDocuments ? 'var(--gemini-accent)' : 'var(--gemini-border)'
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: hasDocuments ? 'rgba(138, 180, 248, 0.2)' : 'var(--gemini-bg)'
                }}
              >
                <span
                  className="material-symbols-outlined text-base"
                  style={{ color: hasDocuments ? 'var(--gemini-accent)' : 'var(--gemini-text-secondary)' }}
                >
                  {hasDocuments ? 'description' : 'close'}
                </span>
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--gemini-text-secondary)' }}>Documents</div>
                <div
                  className="text-xs font-semibold"
                  style={{ color: hasDocuments ? 'var(--gemini-accent)' : 'var(--gemini-text-secondary)' }}
                >
                  {hasDocuments ? 'Loaded' : 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {!canUseFeatures && (
          <div
            className="rounded-lg border p-3 text-center text-xs"
            style={{
              backgroundColor: 'rgba(242, 139, 130, 0.1)',
              borderColor: 'var(--gemini-error)',
              color: 'var(--gemini-error)'
            }}
          >
            {!hasApiKey ? 'AI provider not configured' : 'Extension disabled'}
          </div>
        )}

        {/* Content Script Error */}
        {contentScriptStatus === 'failed' && (
          <div className="space-y-2">
            <div
              className="rounded-lg border p-3 flex items-start gap-2"
              style={{
                backgroundColor: 'rgba(242, 139, 130, 0.1)',
                borderColor: 'var(--gemini-error)'
              }}
            >
              <span className="material-symbols-outlined text-base" style={{ color: 'var(--gemini-error)' }}>error</span>
              <div className="flex-1 text-xs" style={{ color: 'var(--gemini-error)' }}>
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
        <div
          className="rounded-lg border p-3"
          style={{
            backgroundColor: 'rgba(138, 180, 248, 0.05)',
            borderColor: 'var(--gemini-border)'
          }}
        >
          <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--gemini-accent)' }}>How to use:</div>
          <ul className="text-xs space-y-1" style={{ color: 'var(--gemini-text-secondary)' }}>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5" style={{ color: 'var(--gemini-accent)' }}>•</span>
              <span>Click button to detect and fill form fields</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5" style={{ color: 'var(--gemini-accent)' }}>•</span>
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
          size="lg"
          className="w-full"
        >
          <span className="material-symbols-outlined">auto_fix_high</span>
          <span>{isProcessing ? 'Processing...' : 'Analyze & Fill Forms'}</span>
        </Button>
      </FixedFooter>
    </div>
  );
}
