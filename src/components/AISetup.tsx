import { useState, useEffect } from 'preact/hooks';
import { AIProvider } from '@/types';
import { AIService } from '@/utils/aiService';
import { ChromeAI } from '@/utils/chromeai';
import { StorageManager } from '@/storage';
import { Button, FixedFooter } from './ui';
import { Toast } from '@/utils/toast';
import { UsageTracker } from '@/utils/usageTracker';
import { UsageStats } from '@/storage/StorageSchema';

interface AISetupProps {
  aiProvider: AIProvider;
  apiKey: string;
  onProviderChange: (provider: AIProvider) => void;
  onApiKeyChange: (apiKey: string) => void | Promise<void>;
  onComplete: () => void;
}

export function AISetup({ aiProvider, apiKey, onProviderChange, onApiKeyChange, onComplete }: AISetupProps) {
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSkipOption, setShowSkipOption] = useState(false);
  const [chromeAIAvailable, setChromeAIAvailable] = useState<boolean | null>(null);
  const [chromeAIStatus, setChromeAIStatus] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false); // For existing key editing
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    setInputValue(apiKey);
    setIsEditMode(false); // Reset edit mode when API key changes
  }, [apiKey]);

  useEffect(() => {
    checkChromeAIAvailability();
  }, []);

  useEffect(() => {
    // Load usage stats when provider changes or API key is configured
    if (apiKey && !isEditMode && aiProvider !== 'chromeai') {
      loadUsageStats();
    }
  }, [aiProvider, apiKey, isEditMode]);

  const loadUsageStats = async () => {
    setLoadingStats(true);
    try {
      const stats = await UsageTracker.getUsageStats(aiProvider);
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const checkChromeAIAvailability = async () => {
    const status = await ChromeAI.getAvailabilityStatus();
    setChromeAIAvailable(status.available);
    setChromeAIStatus(status.message);
  };

  const handleSkipTest = async () => {
    try {
      await onApiKeyChange(inputValue.trim());
      setConnectionStatus('success');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      Toast.error('Failed to save API key');
      setConnectionStatus('error');
      setErrorMessage('Failed to save API key. Please try again.');
    }
  };

  const handleProviderChange = async (provider: AIProvider) => {
    onProviderChange(provider);
    setConnectionStatus('idle');
    setErrorMessage('');
    setShowSkipOption(false);
    setIsEditMode(false);

    // Load saved API key for this provider (already decrypted)
    try {
      const savedKey = await StorageManager.getApiKey(provider);
      setInputValue(savedKey || '');
    } catch (error) {
      setInputValue('');
    }
  };

  const handleConnect = async () => {
    // Chrome AI doesn't need API key validation
    if (aiProvider === 'chromeai') {
      setIsConnecting(true);
      setConnectionStatus('idle');

      try {
        const aiService = new AIService('chromeai', '');
        const isValid = await aiService.testConnection();

        if (isValid) {
          await onApiKeyChange('');
          setConnectionStatus('success');
          setTimeout(() => {
            onComplete();
          }, 1500);
        } else {
          throw new Error('Chrome AI is not available. Please enable it in chrome://flags');
        }
      } catch (error) {
        setConnectionStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Chrome AI connection failed');
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    // For other providers, validate API key
    if (!inputValue.trim()) return;

    setIsConnecting(true);
    setConnectionStatus('idle');

    try {
      const trimmedKey = inputValue.trim();

      // Validate API key format
      if (!AIService.validateApiKeyFormat(aiProvider, trimmedKey)) {
        let expectedFormat = '';
        switch (aiProvider) {
          case 'claude':
            expectedFormat = 'Claude API keys should start with "sk-ant-" and be at least 40 characters long';
            break;
          case 'gemini':
            expectedFormat = 'Gemini API keys should start with "AIzaSy" and be exactly 39 characters long';
            break;
          case 'groq':
            expectedFormat = 'Groq API keys should start with "gsk_" and be at least 40 characters long';
            break;
        }
        throw new Error(`Invalid API key format. ${expectedFormat}`);
      }

      // Test the API key
      const aiService = new AIService(aiProvider, trimmedKey);

      try {
        const isValid = await aiService.testConnection();

        if (isValid) {
          await onApiKeyChange(trimmedKey);
          setConnectionStatus('success');
          setIsEditMode(false);
          setTimeout(() => {
            onComplete();
          }, 1500);
        } else {
          throw new Error('API key validation failed - the key appears to be invalid or you may not have sufficient credits');
        }
      } catch (apiError) {
        let errorMsg = 'API connection failed';
        if (apiError instanceof Error) {
          errorMsg = apiError.message;
        }

        if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('NetworkError')) {
          errorMsg = 'Network error - unable to test API key. You can proceed anyway if you\'re sure the key is correct.';
        }

        throw new Error(errorMsg);
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setShowSkipOption(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const openApiKeyPage = () => {
    const url = AIService.getApiKeyUrl(aiProvider);
    window.open(url, '_blank');
  };

  const hasExistingKey = apiKey && !isEditMode;
  const showVerifyButton = aiProvider === 'chromeai' || isEditMode || inputValue.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="step-header">
        <h2 className="step-title">Choose AI Provider</h2>
        <p className="step-subtitle">
          Select your preferred AI service
        </p>
      </div>

      <div className="flex-1 space-y-4 pb-20">
        {/* Provider Selection */}
        <div className="space-y-3">
          <label id="provider-selection-label" className="text-sm font-medium text-gray-700">AI Provider</label>
          <div role="radiogroup" aria-labelledby="provider-selection-label" className="grid grid-cols-1 gap-3">
            {/* Groq Option - RECOMMENDED */}
            <button
              type="button"
              role="radio"
              aria-checked={aiProvider === 'groq'}
              aria-label="Groq - Recommended provider for fast, reliable AI processing"
              className={`provider-card ${aiProvider === 'groq' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('groq')}
            >
              <div className="flex items-center justify-between">
                <div className="provider-name">Groq <span className="text-sm text-blue-600 font-semibold" aria-hidden="true">(RECOMMENDED)</span></div>
                <div className={`radio ${aiProvider === 'groq' ? 'checked' : ''}`} aria-hidden="true">
                  {aiProvider === 'groq' && <div className="radio-dot"></div>}
                </div>
              </div>
            </button>

            {/* Gemini Option */}
            <button
              type="button"
              role="radio"
              aria-checked={aiProvider === 'gemini'}
              aria-label="Google Gemini - AI provider by Google"
              className={`provider-card ${aiProvider === 'gemini' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('gemini')}
            >
              <div className="flex items-center justify-between">
                <div className="provider-name">Google Gemini</div>
                <div className={`radio ${aiProvider === 'gemini' ? 'checked' : ''}`} aria-hidden="true">
                  {aiProvider === 'gemini' && <div className="radio-dot"></div>}
                </div>
              </div>
            </button>

            {/* OpenRouter Option - DISABLED */}
            <button
              type="button"
              role="radio"
              aria-checked={false}
              aria-disabled="true"
              aria-label="OpenRouter - Currently disabled"
              className="provider-card opacity-50 cursor-not-allowed"
              disabled
            >
              <div className="flex items-center justify-between">
                <div className="provider-name">OpenRouter <span className="text-sm text-gray-500" aria-hidden="true">(DISABLED)</span></div>
                <div className="radio" aria-hidden="true">
                </div>
              </div>
            </button>

            {/* HuggingFace Option - DISABLED */}
            <button
              type="button"
              role="radio"
              aria-checked={false}
              aria-disabled="true"
              aria-label="HuggingFace - Currently disabled"
              className="provider-card opacity-50 cursor-not-allowed"
              disabled
            >
              <div className="flex items-center justify-between">
                <div className="provider-name">HuggingFace <span className="text-sm text-gray-500" aria-hidden="true">(DISABLED)</span></div>
                <div className="radio" aria-hidden="true">
                </div>
              </div>
            </button>

            {/* Claude Option - TESTING */}
            <button
              type="button"
              role="radio"
              aria-checked={aiProvider === 'claude'}
              aria-label="Anthropic Claude - AI provider currently in testing"
              className={`provider-card ${aiProvider === 'claude' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('claude')}
            >
              <div className="flex items-center justify-between">
                <div className="provider-name">Anthropic Claude <span className="text-sm text-gray-500" aria-hidden="true">(TESTING)</span></div>
                <div className={`radio ${aiProvider === 'claude' ? 'checked' : ''}`} aria-hidden="true">
                  {aiProvider === 'claude' && <div className="radio-dot"></div>}
                </div>
              </div>
            </button>

            {/* Chrome AI Option */}
            <button
              type="button"
              role="radio"
              aria-checked={aiProvider === 'chromeai'}
              aria-label={`Chrome AI - Free local AI processing${chromeAIAvailable === true ? ' - Available' : chromeAIAvailable === false ? ' - Setup required' : ''}`}
              className={`provider-card ${aiProvider === 'chromeai' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('chromeai')}
            >
              <div className="flex items-center justify-between">
                <div className="provider-name">
                  Chrome AI <span className="text-sm text-blue-600" aria-hidden="true">(FREE)</span>
                  {chromeAIAvailable === true && <span className="text-green-600 ml-2 text-sm" aria-hidden="true">✓</span>}
                  {chromeAIAvailable === false && <span className="text-orange-600 ml-2 text-sm" aria-hidden="true">Setup Required</span>}
                </div>
                <div className={`radio ${aiProvider === 'chromeai' ? 'checked' : ''}`} aria-hidden="true">
                  {aiProvider === 'chromeai' && <div className="radio-dot"></div>}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* API Key Configuration - Hide for Chrome AI */}
        {aiProvider !== 'chromeai' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="api-key-input" className="text-sm font-medium text-gray-700">
                API Key <span aria-label="required" className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={openApiKeyPage}
                className="text-blue-600 hover:text-blue-700 text-xs"
                aria-label={`Get API key for ${aiProvider}`}
              >
                Get Key →
              </button>
            </div>

            <div className="relative">
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
                placeholder={`Enter your API key`}
                className="input-field pr-20"
                disabled={hasExistingKey}
                aria-required="true"
                aria-invalid={connectionStatus === 'error'}
                aria-describedby={connectionStatus === 'error' ? 'api-key-error' : 'api-key-help'}
              />
              <span id="api-key-help" className="sr-only">
                Your API key is stored locally and encrypted for security.
              </span>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {hasExistingKey && (
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Edit API key"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  aria-pressed={showKey}
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    {showKey ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Chrome AI Setup */
          <div className="space-y-3">
            <div
              className="rounded-lg border p-3 text-sm"
              style={{
                backgroundColor: 'rgba(138, 180, 248, 0.1)',
                borderColor: 'var(--gemini-accent)'
              }}
            >
              <div style={{ color: 'var(--gemini-text-primary)' }}><strong>Status:</strong> {chromeAIStatus}</div>
            </div>

            {!chromeAIAvailable && (
              <div
                className="rounded-lg border p-3 text-sm"
                style={{
                  backgroundColor: 'rgba(253, 214, 99, 0.1)',
                  borderColor: 'var(--gemini-warning)'
                }}
              >
                <div className="font-medium mb-2" style={{ color: 'var(--gemini-warning)' }}>Setup Required:</div>
                <ol className="list-decimal ml-4 space-y-1 text-xs" style={{ color: 'var(--gemini-text-secondary)' }}>
                  <li>Use Chrome 127+</li>
                  <li>Enable flags in chrome://flags</li>
                  <li>Restart browser</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {connectionStatus === 'error' && (
          <div
            id="api-key-error"
            role="alert"
            aria-live="assertive"
            className="rounded-lg border p-3"
            style={{
              backgroundColor: 'rgba(242, 139, 130, 0.1)',
              borderColor: 'var(--gemini-error)'
            }}
          >
            <div className="text-sm" style={{ color: 'var(--gemini-error)' }}>
              {errorMessage || 'Invalid API key. Please check and try again.'}
            </div>
            {showSkipOption && (
              <button
                type="button"
                onClick={handleSkipTest}
                className="mt-2 text-xs underline"
                style={{ color: 'var(--gemini-error)' }}
                aria-label="Skip API key verification and continue anyway"
              >
                Skip verification and continue anyway
              </button>
            )}
          </div>
        )}

        {connectionStatus === 'success' && (
          <div
            className="rounded-lg border p-3 text-sm"
            style={{
              backgroundColor: 'rgba(129, 201, 149, 0.1)',
              borderColor: 'var(--gemini-success)',
              color: 'var(--gemini-success)'
            }}
          >
            ✓ Connected successfully!
          </div>
        )}

        {/* API Key Configured Indicator */}
        {apiKey && !isEditMode && connectionStatus === 'idle' && (
          <div
            className="rounded-lg border p-3 text-center text-sm"
            style={{
              backgroundColor: 'rgba(129, 201, 149, 0.1)',
              borderColor: 'var(--gemini-success)',
              color: 'var(--gemini-success)'
            }}
          >
            ✓ API Key Configured
          </div>
        )}

        {/* Usage Stats Display */}
        {apiKey && !isEditMode && aiProvider !== 'chromeai' && (
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--gemini-text-primary)' }}>
              Daily Usage
            </label>

            {loadingStats ? (
              <div className="text-sm" style={{ color: 'var(--gemini-text-secondary)' }}>
                Loading usage stats...
              </div>
            ) : usageStats && (
              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: usageStats.isBlocked
                    ? 'rgba(242, 139, 130, 0.05)'
                    : usageStats.percentage >= 80
                    ? 'rgba(253, 214, 99, 0.05)'
                    : 'rgba(138, 180, 248, 0.05)',
                  borderColor: usageStats.isBlocked
                    ? 'var(--gemini-error)'
                    : usageStats.percentage >= 80
                    ? 'var(--gemini-warning)'
                    : 'var(--gemini-accent)',
                }}
              >
                {/* Usage Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--gemini-text-primary)' }}>
                      {usageStats.today} / {usageStats.limit} requests
                    </span>
                    <span
                      style={{
                        color: usageStats.isBlocked
                          ? 'var(--gemini-error)'
                          : usageStats.percentage >= 80
                          ? 'var(--gemini-warning)'
                          : 'var(--gemini-text-secondary)',
                      }}
                    >
                      {Math.round(usageStats.percentage)}%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(usageStats.percentage, 100)}%`,
                        backgroundColor: usageStats.isBlocked
                          ? 'var(--gemini-error)'
                          : usageStats.percentage >= 80
                          ? 'var(--gemini-warning)'
                          : 'var(--gemini-success)',
                      }}
                    />
                  </div>
                </div>

                {/* Status Message */}
                <div className="text-xs" style={{ color: 'var(--gemini-text-secondary)' }}>
                  {usageStats.isBlocked ? (
                    <span style={{ color: 'var(--gemini-error)' }}>
                      <strong>Quota Exceeded:</strong> Daily limit reached. Resets at midnight.
                    </span>
                  ) : usageStats.percentage >= 80 ? (
                    <span style={{ color: 'var(--gemini-warning)' }}>
                      <strong>Warning:</strong> {usageStats.remaining} requests remaining
                    </span>
                  ) : (
                    <span>{usageStats.remaining} requests remaining today. Resets at {usageStats.resetAt}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Footer with Action Button */}
      <FixedFooter>
        {showVerifyButton ? (
          <Button
            onClick={handleConnect}
            disabled={aiProvider !== 'chromeai' && !inputValue.trim()}
            loading={isConnecting}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <span>
              {connectionStatus === 'success'
                ? 'Connected!'
                : isConnecting
                ? 'Verifying...'
                : aiProvider === 'chromeai'
                ? 'Connect'
                : 'Verify & Connect'}
            </span>
          </Button>
        ) : (
          <div className="text-center text-sm" style={{ color: 'var(--gemini-success)' }}>
            ✓ Ready to continue
          </div>
        )}
      </FixedFooter>
    </div>
  );
}
