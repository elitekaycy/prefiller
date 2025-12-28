import { useState, useEffect } from 'preact/hooks';
import { AIProvider } from '@/types';
import { AIService } from '@/utils/aiService';
import { ChromeAI } from '@/utils/chromeai';

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

  useEffect(() => {
    setInputValue(apiKey);
  }, [apiKey]);

  // Check Chrome AI availability on mount
  useEffect(() => {
    checkChromeAIAvailability();
  }, []);

  const checkChromeAIAvailability = async () => {
    const status = await ChromeAI.getAvailabilityStatus();
    setChromeAIAvailable(status.available);
    setChromeAIStatus(status.message);
    console.log('Chrome AI availability:', status);
  };

  const handleSkipTest = () => {
    // Skip the API test and proceed with the key
    onApiKeyChange(inputValue.trim());
    setConnectionStatus('success');
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const handleProviderChange = (provider: AIProvider) => {
    onProviderChange(provider);
    setInputValue('');
    setConnectionStatus('idle');
    setErrorMessage('');
    setShowSkipOption(false);
  };

  const handleConnect = async () => {
    // Chrome AI doesn't need API key validation
    if (aiProvider === 'chromeai') {
      setIsConnecting(true);
      setConnectionStatus('idle');

      try {
        console.log('Testing Chrome AI connection...');
        const aiService = new AIService('chromeai', '');
        const isValid = await aiService.testConnection();

        if (isValid) {
          onApiKeyChange(''); // No API key needed
          setConnectionStatus('success');
          setTimeout(() => {
            onComplete();
          }, 1500);
        } else {
          throw new Error('Chrome AI is not available. Please enable it in chrome://flags');
        }
      } catch (error) {
        console.error('Chrome AI connection failed:', error);
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
        console.warn(`API key validation failed. Key length: ${trimmedKey.length}, starts with: ${trimmedKey.substring(0, 10)}...`);
        throw new Error(`Invalid API key format. ${expectedFormat}`);
      }

      // Test the API key
      console.log(`Testing ${aiProvider} API key...`);
      const aiService = new AIService(aiProvider, trimmedKey);

      try {
        const isValid = await aiService.testConnection();
        console.log(`API test result:`, isValid);

        if (isValid) {
          onApiKeyChange(trimmedKey);
          setConnectionStatus('success');
          setTimeout(() => {
            onComplete();
          }, 1500);
        } else {
          throw new Error('API key validation failed - the key appears to be invalid or you may not have sufficient credits');
        }
      } catch (apiError) {
        console.error('API test error:', apiError);

        // If there's a specific API error, show it
        let errorMsg = 'API connection failed';
        if (apiError instanceof Error) {
          errorMsg = apiError.message;
        }

        // For network errors, suggest skipping the test
        if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('NetworkError')) {
          errorMsg = 'Network error - unable to test API key. You can proceed anyway if you\'re sure the key is correct.';
        }

        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setShowSkipOption(true); // Show skip option when test fails
    } finally {
      setIsConnecting(false);
    }
  };

  const openApiKeyPage = () => {
    const url = AIService.getApiKeyUrl(aiProvider);
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="step-header">
        <div className="step-title">Choose AI Provider</div>
        <div className="step-subtitle">
          Select your preferred AI service and configure API access
        </div>
      </div>

      <div className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">AI Provider</label>
          <div className="grid grid-cols-1 gap-3">
            {/* Claude Option */}
            <div
              className={`provider-card ${aiProvider === 'claude' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('claude')}
            >
              <div className="flex items-center gap-3">
                <div className="provider-icon claude">
                  <span className="text-xl">🧠</span>
                </div>
                <div className="flex-1">
                  <div className="provider-name">Anthropic Claude</div>
                  <div className="provider-description">
                    {AIService.getProviderDescription('claude')}
                  </div>
                </div>
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
              <div className="flex items-center gap-3">
                <div className="provider-icon gemini">
                  <span className="text-xl">🤖</span>
                </div>
                <div className="flex-1">
                  <div className="provider-name">Google Gemini</div>
                  <div className="provider-description">
                    {AIService.getProviderDescription('gemini')}
                  </div>
                </div>
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
              <div className="flex items-center gap-3">
                <div className="provider-icon groq">
                  <span className="text-xl">🚀</span>
                </div>
                <div className="flex-1">
                  <div className="provider-name">
                    Groq (FREE) ⭐
                  </div>
                  <div className="provider-description">
                    {AIService.getProviderDescription('groq')}
                  </div>
                </div>
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
              <div className="flex items-center gap-3">
                <div className="provider-icon chromeai">
                  <span className="text-xl">⚡</span>
                </div>
                <div className="flex-1">
                  <div className="provider-name">
                    Chrome AI (FREE)
                    {chromeAIAvailable === true && <span className="text-green-600 ml-2">✓</span>}
                    {chromeAIAvailable === false && <span className="text-orange-600 ml-2">⚠</span>}
                  </div>
                  <div className="provider-description">
                    {AIService.getProviderDescription('chromeai')}
                  </div>
                  {chromeAIAvailable === false && (
                    <div className="text-xs text-orange-600 mt-1">
                      Requires setup - click to enable
                    </div>
                  )}
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {AIService.getProviderName(aiProvider)} API Key
              </label>
              <button
                onClick={openApiKeyPage}
                className="text-link text-sm"
              >
                Get API Key →
              </button>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
                placeholder={`Enter your ${AIService.getProviderName(aiProvider)} API key`}
                className="input-field"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                style={{ color: 'var(--gemini-text-secondary)' }}
              >
                <span className="material-symbols-outlined">
                  {showKey ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>

            <button
              onClick={handleConnect}
              disabled={!inputValue.trim() || isConnecting}
              className={`gemini-button primary ${
                connectionStatus === 'success' ? 'opacity-90' : ''
              } ${!inputValue.trim() || isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">
                  {connectionStatus === 'success' ? '✨' : connectionStatus === 'error' ? '⚠️' : '🔗'}
                </span>
                <span>
                  {connectionStatus === 'success'
                    ? 'Connected successfully!'
                    : isConnecting
                    ? 'Verifying...'
                    : 'Verify & Connect'}
                </span>
                {isConnecting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
              </div>
            </button>
          </div>
        ) : (
          /* Chrome AI Setup */
          <div className="space-y-4">
            <div className="info-box-blue">
              <span className="material-symbols-outlined">info</span>
              <div>
                <strong>Chrome AI Status:</strong> {chromeAIStatus}
              </div>
            </div>

            {chromeAIAvailable ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className={`gemini-button primary ${
                  connectionStatus === 'success' ? 'opacity-90' : ''
                } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xl">
                    {connectionStatus === 'success' ? '✨' : connectionStatus === 'error' ? '⚠️' : '⚡'}
                  </span>
                  <span>
                    {connectionStatus === 'success'
                      ? 'Connected successfully!'
                      : isConnecting
                      ? 'Testing Chrome AI...'
                      : 'Enable Chrome AI (FREE)'}
                  </span>
                  {isConnecting && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="error-box">
                  <span className="material-symbols-outlined">warning</span>
                  <span>Chrome AI is not available in your browser</span>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>To enable Chrome AI:</strong></p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Use Chrome 127+ (Canary, Dev, or Beta)</li>
                    <li>Go to <code className="bg-gray-100 px-1 rounded">chrome://flags</code></li>
                    <li>Enable: <code className="bg-gray-100 px-1 rounded">Prompt API for Gemini Nano</code></li>
                    <li>Enable: <code className="bg-gray-100 px-1 rounded">Optimization Guide On Device Model</code></li>
                    <li>Restart Chrome</li>
                  </ol>
                </div>
                <button
                  onClick={openApiKeyPage}
                  className="gemini-button secondary w-full"
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                  <span>Open Chrome Flags</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {connectionStatus === 'error' && (
          <div className="space-y-3">
            <div className="error-box">
              <span className="material-symbols-outlined">error</span>
              <span>{errorMessage || 'Invalid API key. Please check and try again.'}</span>
            </div>
            
            {showSkipOption && (
              <div className="space-y-2">
                <div className="info-box-blue">
                  <span>If you're confident your API key is correct, you can skip the test and proceed.</span>
                </div>
                <button
                  onClick={handleSkipTest}
                  className="gemini-button secondary"
                >
                  <span className="material-symbols-outlined">skip_next</span>
                  <span>Skip Test & Continue</span>
                </button>
              </div>
            )}
          </div>
        )}

        {connectionStatus === 'success' && (
          <div className="success-box">
            <span className="material-symbols-outlined">check_circle</span>
            <span>Successfully connected to {AIService.getProviderName(aiProvider)}! Moving to next step...</span>
          </div>
        )}

        {/* API Key Status */}
        {apiKey && connectionStatus === 'idle' && (
          <div className="text-center">
            <div className="status-indicator status-connected">
              <span className="material-symbols-outlined">check_circle</span>
              {AIService.getProviderName(aiProvider)} API Key Configured
            </div>
          </div>
        )}
      </div>
    </>
  );
}