import { useState } from 'preact/hooks';

interface FormActionsProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onBack: () => void;
  hasDocuments: boolean;
  hasApiKey: boolean;
}

export function FormActions({ isEnabled, onToggle, onBack, hasDocuments, hasApiKey }: FormActionsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [lastAction, setLastAction] = useState<'analyze' | 'fill' | null>(null);

  const handleAnalyzePage = async () => {
    setIsAnalyzing(true);
    setLastAction('analyze');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, { action: 'ANALYZE_FORMS' });
      }
    } catch (error) {
      console.error('Error analyzing page:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFillForms = async () => {
    setIsFilling(true);
    setLastAction('fill');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, { action: 'FILL_FORMS' });
      }
    } catch (error) {
      console.error('Error filling forms:', error);
    } finally {
      setIsFilling(false);
    }
  };

  const getStatusIcon = () => {
    if (isAnalyzing) return '🔍';
    if (isFilling) return '✨';
    return '🤖';
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
            <div className="text-2xl mb-2">🔑</div>
            <div className="text-xs text-gray-600">API Key</div>
            <div className={`text-sm font-medium ${hasApiKey ? 'text-green-400' : 'text-red-400'}`}>
              {hasApiKey ? 'Connected' : 'Missing'}
            </div>
          </div>

          <div className="status-grid rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">📄</div>
            <div className="text-xs text-gray-600">Documents</div>
            <div className={`text-sm font-medium ${hasDocuments ? 'text-green-400' : 'text-yellow-400'}`}>
              {hasDocuments ? `${hasDocuments} loaded` : 'Optional'}
            </div>
          </div>
        </div>

        {/* Extension Toggle */}
        <div className="flex items-center justify-between status-grid rounded-xl p-4">
          <div>
            <div className="text-gray-800 font-medium">Auto-Fill Mode</div>
            <div className="text-xs text-gray-600">Enable form filling assistance</div>
          </div>
          <button
            onClick={() => onToggle(!isEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled
                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
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

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAnalyzePage}
            disabled={!canUseFeatures || isAnalyzing}
            className={`gemini-button w-full ${!canUseFeatures ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl">🔍</span>
              <span>{isAnalyzing ? 'Analyzing Page...' : 'Analyze Page'}</span>
              {isAnalyzing && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
            </div>
          </button>

          <button
            onClick={handleFillForms}
            disabled={!canUseFeatures || isFilling}
            className={`gemini-button primary w-full ${!canUseFeatures ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl">✨</span>
              <span>{isFilling ? 'Filling Forms...' : 'Fill Forms with AI'}</span>
              {isFilling && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
            </div>
          </button>
        </div>

        {/* Instructions */}
        {canUseFeatures ? (
          <div className="status-grid rounded-xl p-4 space-y-2 text-xs text-gray-600">
            <div className="font-medium text-gray-800 mb-2">How to use:</div>
            <div>1. Click "Analyze Page" to detect form fields</div>
            <div>2. Click "Fill Forms with AI" to auto-complete them</div>
            <div>3. Review and adjust the generated content</div>
          </div>
        ) : (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm text-center">
            {!hasApiKey ? '⚠️ API key required to use form filling features' : '⚠️ Enable auto-fill mode to continue'}
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