import { useState, useEffect } from 'preact/hooks';
import { AISetup } from '@/components/AISetup';
import { DocumentSelector } from '@/components/DocumentSelector';
import { FormActions } from '@/components/FormActions';
import { ExtensionSettings, AIProvider } from '@/types';
import { ChromeAI } from '@/utils/chromeai';
import { StorageManager } from '@/storage';
import { Toast, Toaster } from '@/utils/toast';

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
        const chromeAIAvailable = await ChromeAI.isAvailable();
        const defaultProvider: AIProvider = chromeAIAvailable ? 'chromeai' : 'groq';

        // Load settings from new storage structure
        const aiProvider = await StorageManager.getAIProvider() || defaultProvider;
        const isEnabled = await StorageManager.getIsEnabled();
        const documents = await StorageManager.getDocuments();

        // Load API key for current provider (already decrypted by StorageManager)
        const apiKey = await StorageManager.getApiKey(aiProvider);

        const loadedSettings: ExtensionSettings = {
          aiProvider,
          apiKey: apiKey || '',
          documents,
          isEnabled,
        };

        setSettings(loadedSettings);

        // Determine initial step based on existing data
        // Chrome AI doesn't need API key, so check differently
        const hasValidSetup = aiProvider === 'chromeai'
          ? true
          : (apiKey && aiProvider);

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
    console.log('[App] updateSettings called:', { newSettings, currentSettings: settings });
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      // Save AI provider if changed
      if (newSettings.aiProvider !== undefined) {
        console.log('[App] Saving provider:', newSettings.aiProvider);
        await StorageManager.setAIProvider(newSettings.aiProvider);

        // If provider changed, load that provider's API key (already decrypted)
        if (newSettings.aiProvider !== settings.aiProvider) {
          const providerKey = await StorageManager.getApiKey(newSettings.aiProvider);
          updated.apiKey = providerKey || '';
          setSettings(updated);
        }
      }

      // Save API key if changed (StorageManager will encrypt it)
      if (newSettings.apiKey !== undefined) {
        // IMPORTANT: Use updated.aiProvider which has the latest provider
        console.log('[App] Saving API key:', { provider: updated.aiProvider, keyLength: newSettings.apiKey?.length });
        await StorageManager.setApiKey(updated.aiProvider, newSettings.apiKey);
        console.log('[App] API key saved successfully');
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
      Toast.error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    <>
      <Toaster />
      <div className="gemini-container">
        {/* Skip to main content link */}
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>

        {/* Screen reader only main heading */}
        <h1 className="sr-only">Prefiller - AI Form Auto-Fill Extension</h1>

        <div className="rainbow-border">
          <main id="main-content" role="main" className="gemini-content">
            <div className="step-container">
              {renderCurrentStep()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}