import { useState, useEffect } from 'preact/hooks';
import { GeminiSetup } from '@/components/GeminiSetup';
import { DocumentSelector } from '@/components/DocumentSelector';
import { FormActions } from '@/components/FormActions';
import { ExtensionSettings } from '@/types';
import { EncryptionUtil } from '@/utils/encryption';

type AppStep = 'setup' | 'documents' | 'actions';

export function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('setup');
  const [settings, setSettings] = useState<ExtensionSettings>({
    apiKey: '',
    documents: [],
    isEnabled: true
  });

  useEffect(() => {
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        const decoded = { ...result.settings };
        if (decoded.apiKey) {
          decoded.apiKey = EncryptionUtil.decode(decoded.apiKey);
        }
        setSettings(decoded);

        // Determine initial step based on existing data
        if (decoded.apiKey && EncryptionUtil.isValidApiKey(decoded.apiKey)) {
          setCurrentStep('documents');
        } else {
          setCurrentStep('setup');
        }
      }
    });
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
          <GeminiSetup
            apiKey={settings.apiKey}
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