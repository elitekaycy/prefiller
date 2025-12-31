import { useState, useEffect, useRef } from 'preact/hooks';
import { AISetup } from '@/components/AISetup';
import { DocumentSelector } from '@/components/DocumentSelector';
import { FormActions } from '@/components/FormActions';
import { ExtensionSettings, AIProvider } from '@/types';
import { ChromeAI } from '@/utils/chromeai';
import { StorageManager } from '@/storage';
import { Toast, Toaster } from '@/utils/toast';
import { KEYS } from '@/utils/accessibility';

type AppStep = 'setup' | 'documents' | 'actions';

export function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('setup');
  const [settings, setSettings] = useState<ExtensionSettings>({
    aiProvider: 'claude',
    apiKey: '',
    documents: [],
    isEnabled: true
  });
  const mainRef = useRef<HTMLElement>(null);

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
        const urlContexts = await StorageManager.getUrlContexts();

        // Load API key for current provider (already decrypted by StorageManager)
        const apiKey = await StorageManager.getApiKey(aiProvider);

        const loadedSettings: ExtensionSettings = {
          aiProvider,
          apiKey: apiKey || '',
          documents,
          isEnabled,
          urlContexts,
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
          isEnabled: true,
          urlContexts: []
        });
      }
    };

    initializeDefaultProvider();
  }, []);

  // Escape key handler for going back to previous step
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === KEYS.ESCAPE) {
        // Go back to previous step
        if (currentStep === 'actions') {
          setCurrentStep('documents');
        } else if (currentStep === 'documents') {
          setCurrentStep('setup');
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [currentStep]);

  // Focus management: move focus to first heading when step changes
  useEffect(() => {
    if (mainRef.current) {
      const firstHeading = mainRef.current.querySelector('h2, h3') as HTMLElement;
      if (firstHeading) {
        firstHeading.setAttribute('tabindex', '-1');
        firstHeading.focus();
      }
    }
  }, [currentStep]);

  const updateSettings = async (newSettings: Partial<ExtensionSettings>) => {

    try {
      // Handle provider change first
      if (newSettings.aiProvider !== undefined && newSettings.aiProvider !== settings.aiProvider) {

        // Save new provider
        await StorageManager.setAIProvider(newSettings.aiProvider);

        // Load the API key for the new provider
        const providerKey = await StorageManager.getApiKey(newSettings.aiProvider);

        // Update state with new provider AND its corresponding API key
        const updated = {
          ...settings,
          aiProvider: newSettings.aiProvider,
          apiKey: providerKey || ''
        };
        setSettings(updated);
        return; // Return early to avoid double state update
      }

      // Handle API key change (only if provider didn't change)
      if (newSettings.apiKey !== undefined) {
        await StorageManager.setApiKey(settings.aiProvider, newSettings.apiKey);

        // Update state with new API key
        const updated = { ...settings, apiKey: newSettings.apiKey };
        setSettings(updated);
        return;
      }

      // Handle other settings changes
      const updated = { ...settings, ...newSettings };
      setSettings(updated);

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

      // Save URL contexts if changed
      if (newSettings.urlContexts !== undefined) {
        await StorageManager.setUrlContexts(newSettings.urlContexts);
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
            urlContexts={settings.urlContexts}
            onUrlContextsChange={(urlContexts) => updateSettings({ urlContexts })}
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
          <main id="main-content" role="main" ref={mainRef} className="gemini-content">
            <div className="step-container">
              {renderCurrentStep()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}