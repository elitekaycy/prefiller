import { useState } from 'preact/hooks';
import { URLContext } from '@/types';
import { LinkScrapingService } from '@/utils/linkScrapingService';
import { Toast } from '@/utils/toast';

interface URLInputProps {
  urlContexts: URLContext[];
  onUrlContextsChange: (contexts: URLContext[]) => void;
}

export function URLInput({ urlContexts, onUrlContextsChange }: URLInputProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddUrl = async () => {
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    try {
      const scraped = await LinkScrapingService.scrapeUrl(inputUrl.trim());

      if (scraped.metadata.success) {
        onUrlContextsChange([...urlContexts, scraped]);
        setInputUrl('');
        Toast.success(`Added: ${scraped.title || scraped.url}`);
      } else {
        Toast.error(`Failed to scrape: ${scraped.metadata.error}`);
      }
    } catch (error) {
      Toast.error('Failed to add URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUrl = (id: string) => {
    onUrlContextsChange(urlContexts.filter(ctx => ctx.id !== id));
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleAddUrl();
    }
  };

  return (
    <div
      className="rounded-lg p-4 border"
      style={{
        backgroundColor: 'var(--gemini-surface)',
        borderColor: 'var(--gemini-border)'
      }}
    >
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--gemini-text-primary)' }}>
        Additional URLs (Optional)
      </h3>

      <div className="mb-3">
        <label htmlFor="url-input" className="text-sm" style={{ color: 'var(--gemini-text-secondary)' }}>
          Add URLs for extra context (LinkedIn, portfolio, etc.)
        </label>
        <div className="flex gap-2 mt-2">
          <input
            id="url-input"
            type="url"
            value={inputUrl}
            onInput={(e) => setInputUrl((e.target as HTMLInputElement).value)}
            onKeyPress={handleKeyPress}
            placeholder="https://linkedin.com/in/yourprofile"
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-md border text-sm"
            style={{
              backgroundColor: 'var(--gemini-bg)',
              borderColor: 'var(--gemini-border)',
              color: 'var(--gemini-text-primary)'
            }}
          />
          <button
            onClick={handleAddUrl}
            disabled={!inputUrl.trim() || isLoading}
            type="button"
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              backgroundColor: 'var(--gemini-accent)',
              color: 'white',
              opacity: !inputUrl.trim() || isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Adding...' : 'Add URL'}
          </button>
        </div>
      </div>

      {urlContexts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium" style={{ color: 'var(--gemini-text-primary)' }}>
            Added URLs ({urlContexts.length})
          </h4>
          <ul className="space-y-2">
            {urlContexts.map((ctx) => (
              <li
                key={ctx.id}
                className="flex items-start justify-between p-2 rounded-md border text-sm"
                style={{
                  backgroundColor: 'var(--gemini-bg)',
                  borderColor: ctx.metadata.success ? 'var(--gemini-border)' : 'var(--gemini-error)'
                }}
              >
                <div className="flex-1">
                  <div className="font-medium" style={{ color: 'var(--gemini-text-primary)' }}>
                    {ctx.title || 'Untitled'}
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--gemini-text-secondary)' }}>
                    {ctx.url}
                  </div>
                  {ctx.metadata.success && (
                    <div className="text-xs mt-1" style={{ color: 'var(--gemini-text-secondary)' }}>
                      {ctx.metadata.wordCount} words extracted
                    </div>
                  )}
                  {!ctx.metadata.success && (
                    <div className="text-xs mt-1" style={{ color: 'var(--gemini-error)' }}>
                      Error: {ctx.metadata.error}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveUrl(ctx.id)}
                  type="button"
                  className="ml-2"
                  aria-label={`Remove ${ctx.title || ctx.url}`}
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
