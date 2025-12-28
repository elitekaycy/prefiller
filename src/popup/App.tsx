import { useState, useEffect } from 'preact/hooks';
import { AISetup } from '@/components/AISetup';
import { DocumentSelector } from '@/components/DocumentSelector';
import { FormActions } from '@/components/FormActions';
import { ExtensionSettings, AIProvider } from '@/types';
import { EncryptionUtil } from '@/utils/encryption';
import { ChromeAI } from '@/utils/chromeai';

type AppStep = 'setup' | 'documents' | 'actions';

export function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('setup');
  const [settings, setSettings] = useState<ExtensionSettings>({
    aiProvider: 'claude',
    apiKey: '',
    documents: [],
    isEnabled: true
  });

  useEffect(() => {
    // Check if Chrome AI is available and set as default
    // Preference: Chrome AI (free, local) > Groq (free, fast) > Gemini (free tier)
    const initializeDefaultProvider = async () => {
      const chromeAIAvailable = await ChromeAI.isAvailable();
      const defaultProvider: AIProvider = chromeAIAvailable ? 'chromeai' : 'groq';

      chrome.storage.local.get(['settings'], (result) => {
        if (result.settings) {
          const decoded = { ...result.settings };
          if (decoded.apiKey) {
            decoded.apiKey = EncryptionUtil.decode(decoded.apiKey);
          }
          setSettings(decoded);

          // Determine initial step based on existing data
          // Chrome AI doesn't need API key, so check differently
          const hasValidSetup = decoded.aiProvider === 'chromeai'
            ? true
            : (decoded.apiKey && decoded.aiProvider);

          if (hasValidSetup) {
            setCurrentStep('documents');
          } else {
            setCurrentStep('setup');
          }
        } else {
          // No settings exist, use default provider
          setSettings({
            aiProvider: defaultProvider,
            apiKey: '',
            documents: [],
            isEnabled: true
          });
        }
      });
    };

    initializeDefaultProvider();
  }, []);

  const updateSettings = async (newSettings: Partial<ExtensionSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Encode API key before storing
    const toStore = { ...updated };
    if (toStore.apiKey) {
      toStore.apiKey = EncryptionUtil.encode(toStore.apiKey);
    }

    try {
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set({ settings: toStore }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Storage error:', error);
      alert(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStepComplete = (step: AppStep) => {
    switch (step) {
      case 'setup':
        setCurrentStep('documents');
        break;
      case 'documents':
        setCurrentStep('actions');
        break;
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'setup':
        return (
          <AISetup
            aiProvider={settings.aiProvider}
            apiKey={settings.apiKey}
            onProviderChange={(aiProvider) => updateSettings({ aiProvider })}
            onApiKeyChange={(apiKey) => updateSettings({ apiKey })}
            onComplete={() => handleStepComplete('setup')}
          />
        );
      case 'documents':
        return (
          <DocumentSelector
            documents={settings.documents}
            onDocumentsChange={(documents) => updateSettings({ documents })}
            onContinue={() => handleStepComplete('documents')}
            onBack={() => setCurrentStep('setup')}
          />
        );
      case 'actions':
        return (
          <FormActions
            isEnabled={settings.isEnabled}
            onToggle={(isEnabled) => updateSettings({ isEnabled })}
            onBack={() => setCurrentStep('documents')}
            hasDocuments={settings.documents.length > 0}
            hasApiKey={!!settings.apiKey}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="gemini-container">
      <div className="rainbow-border">
        <div className="gemini-content">
          <div className="step-container">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </div>
  );
}