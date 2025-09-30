import { useState } from 'preact/hooks';

interface FormFillerProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function FormFiller({ isEnabled, onToggle }: FormFillerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzePage = async () => {
    setIsAnalyzing(true);

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
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, { action: 'FILL_FORMS' });
      }
    } catch (error) {
      console.error('Error filling forms:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Form Filling</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Enable Auto-Fill</span>
          <button
            onClick={() => onToggle(!isEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleAnalyzePage}
            disabled={isAnalyzing || !isEnabled}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : '🔍 Analyze Page'}
          </button>

          <button
            onClick={handleFillForms}
            disabled={!isEnabled}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            ✨ Fill Forms
          </button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Click "Analyze Page" to detect forms</p>
          <p>• Click "Fill Forms" to auto-fill with AI</p>
          <p>• Make sure to upload documents and set API key first</p>
        </div>
      </div>
    </div>
  );
}