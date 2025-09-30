import { useState, useEffect } from 'preact/hooks';
import { EncryptionUtil } from '@/utils/encryption';
import { GeminiAuth } from '@/utils/auth';

interface GeminiSetupProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  onComplete: () => void;
}

export function GeminiSetup({ apiKey, onApiKeyChange, onComplete }: GeminiSetupProps) {
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error' | 'waiting'>('idle');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    // Listen for API key prompt from auth flow
    const handleMessage = (message: any) => {
      if (message.action === 'PROMPT_API_KEY') {
        setConnectionStatus('waiting');
        setShowManualInput(true);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const handleConnectWithOAuth = async () => {
    setIsConnecting(true);
    setConnectionStatus('idle');
    setShowManualInput(false);

    try {
      // Open Google AI Studio in a popup
      const width = 900;
      const height = 700;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;

      const authWindow = window.open(
        'https://aistudio.google.com/app/apikey',
        'gemini-auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups for this extension.');
      }

      // Wait for user to close the window and show manual input
      setConnectionStatus('waiting');
      setIsConnecting(false);
      setShowManualInput(true);

      // Check if window is closed
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          setShowManualInput(true);
        }
      }, 500);

    } catch (error) {
      console.error('OAuth flow failed:', error);
      setConnectionStatus('error');
      setIsConnecting(false);
    }
  };

  const handleManualConnect = async () => {
    if (!inputValue.trim()) return;

    setIsConnecting(true);
    setConnectionStatus('idle');

    try {
      // Validate API key format
      if (!EncryptionUtil.isValidApiKey(inputValue.trim())) {
        throw new Error('Invalid API key format');
      }

      // Test the API key
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${inputValue.trim()}`);

      if (response.ok) {
        onApiKeyChange(inputValue.trim());
        setConnectionStatus('success');
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        throw new Error('API key validation failed');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      <div className="step-header">
        <div className="step-title">Connect to Gemini</div>
        <div className="step-subtitle">
          Sign in to Google AI Studio to get started
        </div>
      </div>

      <div className="space-y-4">
        {/* API Key Status */}
        {apiKey && !showManualInput && (
          <div className="text-center">
            <div className="status-indicator status-connected">
              ✅ API Key Configured
            </div>
          </div>
        )}

        {/* Main OAuth Button */}
        {!showManualInput && (
          <>
            <button
              onClick={handleConnectWithOAuth}
              disabled={isConnecting}
              className="gemini-button primary"
            >
              Connect with Google
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or enter manually</span>
              </div>
            </div>

            {/* Manual Input on Main Screen */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputValue}
                  onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
                  placeholder="Already have a key? Paste it here..."
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <button
                onClick={handleManualConnect}
                disabled={!inputValue.trim() || isConnecting}
                className="gemini-button"
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center gap-2">
                    <span>Verifying...</span>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : (
                  'Verify & Connect'
                )}
              </button>
            </div>
          </>
        )}

        {/* Manual Input (shown after OAuth window opens) */}
        {showManualInput && (
          <>
            <div className="info-box-blue">
              ✨ After getting your API key, paste it below
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputValue}
                  onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
                  placeholder="Paste your API key here (AIzaSy...)"
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <button
                onClick={handleManualConnect}
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

              <button
                onClick={() => {
                  setShowManualInput(false);
                  setInputValue('');
                  setConnectionStatus('idle');
                }}
                className="text-link w-full"
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {/* Status Messages */}
        {connectionStatus === 'error' && (
          <div className="error-box">
            ⚠️ Invalid API key. Please check and try again.
          </div>
        )}

        {connectionStatus === 'success' && (
          <div className="success-box">
            🎉 Successfully connected to Gemini! Moving to next step...
          </div>
        )}
      </div>
    </>
  );
}