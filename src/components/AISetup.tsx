import { useState, useEffect } from 'preact/hooks';
import { AIProvider } from '@/types';
import { AIService } from '@/utils/aiService';
import { ChromeAI } from '@/utils/chromeai';
import { StorageManager } from '@/storage';
import { EncryptionUtil } from '@/utils/encryption';
import { Button, FixedFooter } from './ui';
import { Toast } from '@/utils/toast';

interface AISetupProps {
  aiProvider: AIProvider;
  apiKey: string;
  onProviderChange: (provider: AIProvider) => void;
  onApiKeyChange: (apiKey: string) => void;
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

  useEffect(() => {
    setInputValue(apiKey);
    setIsEditMode(false); // Reset edit mode when API key changes
  }, [apiKey]);

  useEffect(() => {
    checkChromeAIAvailability();
  }, []);

  const checkChromeAIAvailability = async () => {
    const status = await ChromeAI.getAvailabilityStatus();
    setChromeAIAvailable(status.available);
    setChromeAIStatus(status.message);
  };

  const handleSkipTest = () => {
    onApiKeyChange(inputValue.trim());
    setConnectionStatus('success');
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const handleProviderChange = async (provider: AIProvider) => {
    onProviderChange(provider);
    setConnectionStatus('idle');
    setErrorMessage('');
    setShowSkipOption(false);
    setIsEditMode(false);

    // Load saved API key for this provider
    try {
      const savedKey = await StorageManager.getApiKey(provider);
      if (savedKey) {
        const decodedKey = EncryptionUtil.decode(savedKey);
        setInputValue(decodedKey);
      } else {
        setInputValue('');
      }
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
          onApiKeyChange('');
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
          onApiKeyChange(trimmedKey);
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
  const showVerifyButton = aiProvider === 'chromeai' || (!apiKey || isEditMode);

  return (
    <div className="flex flex-col h-full">
      <div className="step-header">
        <div className="step-title">Choose AI Provider</div>
        <div className="step-subtitle">
          Select your preferred AI service
        </div>
      </div>

      <div className="flex-1 space-y-4 pb-20">
        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">AI Provider</label>
          <div className="grid grid-cols-1 gap-3">
            {/* Claude Option */}
            <div
              className={`provider-card ${aiProvider === 'claude' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('claude')}
            >
              <div className="flex items-center justify-between">
                <div className="provider-name">Anthropic Claude</div>
                <div className={`radio ${aiProvider === 'claude' ? 'checked' : ''}`}>
                  {aiProvider === 'claude' && <div className="radio-dot"></div>}
                </div>
              </div>
            </div>

            {/* Gemini Option */}
            <div
              className={`provider-card ${aiProvider === 'gemini' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('gemini')}
            >
              <div className="flex items-center justify-between">
                <div className="provider-name">Google Gemini</div>
                <div className={`radio ${aiProvider === 'gemini' ? 'checked' : ''}`}>
                  {aiProvider === 'gemini' && <div className="radio-dot"></div>}
                </div>
              </div>
            </div>

            {/* Groq Option - FREE */}
            <div
              className={`provider-card ${aiProvider === 'groq' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('groq')}
            >
              <div className="flex items-center justify-between">
                <div className="provider-name">Groq <span className="text-sm text-blue-600">(FREE)</span></div>
                <div className={`radio ${aiProvider === 'groq' ? 'checked' : ''}`}>
                  {aiProvider === 'groq' && <div className="radio-dot"></div>}
                </div>
              </div>
            </div>

            {/* Chrome AI Option */}
            <div
              className={`provider-card ${aiProvider === 'chromeai' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('chromeai')}
            >
              <div className="flex items-center justify-between">
                <div className="provider-name">
                  Chrome AI <span className="text-sm text-blue-600">(FREE)</span>
                  {chromeAIAvailable === true && <span className="text-green-600 ml-2 text-sm">✓</span>}
                  {chromeAIAvailable === false && <span className="text-orange-600 ml-2 text-sm">Setup Required</span>}
                </div>
                <div className={`radio ${aiProvider === 'chromeai' ? 'checked' : ''}`}>
                  {aiProvider === 'chromeai' && <div className="radio-dot"></div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Key Configuration - Hide for Chrome AI */}
        {aiProvider !== 'chromeai' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                API Key
              </label>
              <button
                onClick={openApiKeyPage}
                className="text-blue-600 hover:text-blue-700 text-xs"
              >
                Get Key →
              </button>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
                placeholder={`Enter your API key`}
                className="input-field pr-20"
                disabled={hasExistingKey}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {hasExistingKey && (
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showKey ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Chrome AI Setup */
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="text-blue-900"><strong>Status:</strong> {chromeAIStatus}</div>
            </div>

            {!chromeAIAvailable && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                <div className="text-orange-900 font-medium mb-2">Setup Required:</div>
                <ol className="list-decimal ml-4 space-y-1 text-orange-800 text-xs">
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-900">
              {errorMessage || 'Invalid API key. Please check and try again.'}
            </div>
            {showSkipOption && (
              <button
                onClick={handleSkipTest}
                className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
              >
                Skip verification and continue anyway
              </button>
            )}
          </div>
        )}

        {connectionStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900">
            ✓ Connected successfully!
          </div>
        )}

        {/* API Key Configured Indicator */}
        {apiKey && !isEditMode && connectionStatus === 'idle' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-sm text-green-900">
            ✓ API Key Configured
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
          <div className="text-center text-sm text-green-600">
            ✓ Ready to continue
          </div>
        )}
      </FixedFooter>
    </div>
  );
}
