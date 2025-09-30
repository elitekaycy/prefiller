import { useState } from 'preact/hooks';

interface ApiKeyConfigProps {
    apiKey: string;
    onApiKeyChange: (apiKey: string) => void;
}

export function ApiKeyConfig({ apiKey, onApiKeyChange }: ApiKeyConfigProps) {
    const [showKey, setShowKey] = useState(false);
    const [inputValue, setInputValue] = useState(apiKey);

    const handleSave = () => {
        onApiKeyChange(inputValue);
    };

    return (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Google Gemini API Key</h3>

            <div className="space-y-3">
                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={inputValue}
                        onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
                        placeholder="Enter your Gemini API key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        {showKey ? '👁️' : '👁️‍🗨️'}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Save
                    </button>

                    <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 px-4 py-2 text-sm underline"
                    >
                        Get API Key
                    </a>
                </div>

                {apiKey && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                        ✅ API key configured
                    </div>
                )}
            </div>
        </div>
    );
}
