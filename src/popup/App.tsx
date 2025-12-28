import { useState, useEffect } from 'preact/hooks';
import { AISetup } from '@/components/AISetup';
import { DocumentSelector } from '@/components/DocumentSelector';
import { FormActions } from '@/components/FormActions';
import { ExtensionSettings, AIProvider } from '@/types';
import { EncryptionUtil } from '@/utils/encryption';
import { ChromeAI } from '@/utils/chromeai';
import { StorageManager, StorageMigration } from '@/storage';

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
      try {
        // Run migration first
        await StorageMigration.autoMigrate();

        const chromeAIAvailable = await ChromeAI.isAvailable();
        const defaultProvider: AIProvider = chromeAIAvailable ? 'chromeai' : 'groq';

        // Load settings from new storage structure
        const aiProvider = await StorageManager.getAIProvider() || defaultProvider;
        const isEnabled = await StorageManager.getIsEnabled();
        const documents = await StorageManager.getDocuments();

        // Load API key for current provider
        const apiKey = await StorageManager.getApiKey(aiProvider);
        const decodedApiKey = apiKey ? EncryptionUtil.decode(apiKey) : '';

        const loadedSettings: ExtensionSettings = {
          aiProvider,
          apiKey: decodedApiKey,
          documents,
          isEnabled,
        };

        setSettings(loadedSettings);

        // Determine initial step based on existing data
        // Chrome AI doesn't need API key, so check differently
        const hasValidSetup = aiProvider === 'chromeai'
          ? true
          : (decodedApiKey && aiProvider);

        if (hasValidSetup) {
          setCurrentStep('documents');
        } else {
          setCurrentStep('setup');
        }
      } catch (error) {
        // Fallback to defaults if loading fails
        const chromeAIAvailable = await ChromeAI.isAvailable();
        const defaultProvider: AIProvider = chromeAIAvailable ? 'chromeai' : 'groq';

        setSettings({
          aiProvider: defaultProvider,
          apiKey: '',
          documents: [],
          isEnabled: true
        });
      }
    };

    initializeDefaultProvider();
  }, []);

  const updateSettings = async (newSettings: Partial<ExtensionSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      // Save AI provider if changed
      if (newSettings.aiProvider !== undefined) {
        await StorageManager.setAIProvider(newSettings.aiProvider);

        // If provider changed, load that provider's API key
        if (newSettings.aiProvider !== settings.aiProvider) {
          const providerKey = await StorageManager.getApiKey(newSettings.aiProvider);
          updated.apiKey = providerKey ? EncryptionUtil.decode(providerKey) : '';
          setSettings(updated);
        }
      }

      // Save API key if changed (for current provider)
      if (newSettings.apiKey !== undefined) {
        const encodedKey = EncryptionUtil.encode(newSettings.apiKey);
        await StorageManager.setApiKey(updated.aiProvider, encodedKey);
      }

      // Save documents if changed
      if (newSettings.documents !== undefined) {
        // Clear existing documents
        const existingDocs = await StorageManager.getDocuments();
        for (const doc of existingDocs) {
          await StorageManager.removeDocument(doc.id);
        }

        // Add new documents
        for (const doc of newSettings.documents) {
          await StorageManager.addDocument(doc);
        }
      }

      // Save enabled state if changed
      if (newSettings.isEnabled !== undefined) {
        await StorageManager.setIsEnabled(newSettings.isEnabled);
      }
    } catch (error) {
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