import { useState, useEffect } from 'preact/hooks';
import { Button, Header, FixedFooter } from './ui';
import { BrowserAPI } from '@/utils/browserApi';
import { Toast } from '@/utils/toast';
import { announceToScreenReader } from '@/utils/accessibility';
import { URLContext } from '@/types';
import { LinkScrapingService } from '@/utils/linkScrapingService';

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
  const [formUrls, setFormUrls] = useState<URLContext[]>([]);
  const [inputUrl, setInputUrl] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);

  // Announce loading state to screen readers when processing starts
  useEffect(() => {
    if (isProcessing) {
      announceToScreenReader('Processing form fill request. Please wait.', 'assertive');
    }
  }, [isProcessing]);

  const handleAddUrl = async () => {
    if (!inputUrl.trim()) return;

    setIsScrapingUrl(true);
    try {
      const scraped = await LinkScrapingService.scrapeUrl(inputUrl.trim());

      if (scraped.metadata.success) {
        setFormUrls([...formUrls, scraped]);
        setInputUrl('');
        Toast.success(`Added: ${scraped.title || scraped.url}`);
      } else {
        Toast.error(`Failed to scrape: ${scraped.metadata.error}`);
      }
    } catch (error) {
      Toast.error('Failed to add URL');
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleRemoveUrl = (id: string) => {
    setFormUrls(formUrls.filter(ctx => ctx.id !== id));
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isScrapingUrl) {
      handleAddUrl();
    }
  };

  const handleAnalyzeAndFill = async () => {
    setIsProcessing(true);

    try {
      const tabs = await BrowserAPI.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];

      if (!tab.id) {
        alert('No active tab found. Please refresh the page and try again.');
        setIsProcessing(false);
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

      // Listen for completion message from content script
      let isListening = true;
      const messageListener = (message: any) => {
        if (isListening && message.type === 'PREFILLER_PROCESSING_COMPLETE') {
          isListening = false;
          setIsProcessing(false);
          // Use chrome directly for removeListener
          chrome.runtime.onMessage.removeListener(messageListener);
        }
      };

      // Use chrome directly for addListener
      chrome.runtime.onMessage.addListener(messageListener);

      // Auto-stop loading after 60 seconds (timeout)
      const timeoutId = setTimeout(() => {
        if (isListening) {
          isListening = false;
          setIsProcessing(false);
          chrome.runtime.onMessage.removeListener(messageListener);
        }
      }, 60000);

      // Use executeScript to run in all frames (main + iframes)
      await BrowserAPI.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: (urls: any[]) => {
          window.postMessage({
            type: 'PREFILLER_FILL_FORMS',
            formUrls: urls
          }, '*');
        },
        args: [formUrls]
      });
    } catch (error) {
      setContentScriptStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Toast.error(errorMessage);
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

        {/* Form-Specific URL Context */}
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: 'var(--gemini-surface)',
            borderColor: 'var(--gemini-border)'
          }}
        >
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--gemini-text-primary)' }}>
            Form-Specific Context (Optional)
          </h3>
          <p className="text-xs mb-3" style={{ color: 'var(--gemini-text-secondary)' }}>
            Add URLs with additional context for this specific form (e.g., job posting, company page)
          </p>

          <div className="mb-3">
            <div className="flex gap-2">
              <input
                id="form-url-input"
                type="url"
                value={inputUrl}
                onInput={(e) => setInputUrl((e.target as HTMLInputElement).value)}
                onKeyPress={handleKeyPress}
                placeholder="https://company.com/job-posting"
                disabled={isScrapingUrl}
                className="flex-1 px-3 py-2 rounded-md border text-sm"
                style={{
                  backgroundColor: 'var(--gemini-bg)',
                  borderColor: 'var(--gemini-border)',
                  color: 'var(--gemini-text-primary)'
                }}
              />
              <button
                onClick={handleAddUrl}
                disabled={!inputUrl.trim() || isScrapingUrl}
                type="button"
                className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--gemini-accent)',
                  color: 'white',
                  opacity: !inputUrl.trim() || isScrapingUrl ? 0.5 : 1
                }}
              >
                {isScrapingUrl ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {formUrls.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium" style={{ color: 'var(--gemini-text-primary)' }}>
                Added URLs ({formUrls.length})
              </h4>
              <ul className="space-y-2">
                {formUrls.map((ctx) => (
                  <li
                    key={ctx.id}
                    className="flex items-start justify-between p-2 rounded-md border text-xs"
                    style={{
                      backgroundColor: 'var(--gemini-bg)',
                      borderColor: ctx.metadata.success ? 'var(--gemini-border)' : 'var(--gemini-error)'
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" style={{ color: 'var(--gemini-text-primary)' }}>
                        {ctx.title || 'Untitled'}
                      </div>
                      <div className="text-xs truncate" style={{ color: 'var(--gemini-text-secondary)' }}>
                        {ctx.url}
                      </div>
                      {ctx.metadata.success && (
                        <div className="text-xs mt-1" style={{ color: 'var(--gemini-success)' }}>
                          ✓ {ctx.metadata.wordCount} words extracted
                        </div>
                      )}
                      {!ctx.metadata.success && (
                        <div className="text-xs mt-1" style={{ color: 'var(--gemini-error)' }}>
                          ✗ Error: {ctx.metadata.error}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveUrl(ctx.id)}
                      type="button"
                      className="ml-2 flex-shrink-0"
                      aria-label={`Remove ${ctx.title || ctx.url}`}
                      style={{ color: 'var(--gemini-text-secondary)' }}
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

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
              <span>Add optional URLs above for form-specific context (e.g., job posting)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5" style={{ color: 'var(--gemini-accent)' }}>•</span>
              <span>Click button to detect and fill form fields</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5" style={{ color: 'var(--gemini-accent)' }}>•</span>
              <span>Hover over filled fields to see AI confidence scores</span>
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
          aria-label="Analyze page and fill forms with uploaded document data"
          aria-busy={isProcessing}
        >
          <span className="material-symbols-outlined" aria-hidden="true">auto_fix_high</span>
          <span>{isProcessing ? 'Processing...' : 'Analyze & Fill Forms'}</span>
        </Button>
      </FixedFooter>
    </div>
  );
}
