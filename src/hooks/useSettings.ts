import { useState, useEffect, useCallback } from 'preact/hooks';
import { StorageManager } from '@/storage';
import { AIProvider } from '@/types';

export interface Settings {
  aiProvider: AIProvider;
  isEnabled: boolean;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    aiProvider: 'groq',
    isEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [aiProvider, isEnabled] = await Promise.all([
        StorageManager.getAIProvider(),
        StorageManager.getIsEnabled(),
      ]);

      setSettings({
        aiProvider: aiProvider || 'groq',
        isEnabled: isEnabled ?? true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAIProvider = useCallback(async (provider: AIProvider) => {
    try {
      setError(null);
      setSettings((prev) => ({ ...prev, aiProvider: provider }));
      await StorageManager.setAIProvider(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update AI provider');
      await loadSettings(); // Revert on error
    }
  }, [loadSettings]);

  const updateIsEnabled = useCallback(async (enabled: boolean) => {
    try {
      setError(null);
      setSettings((prev) => ({ ...prev, isEnabled: enabled }));
      await StorageManager.setIsEnabled(enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update enabled state');
      await loadSettings(); // Revert on error
    }
  }, [loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateAIProvider,
    updateIsEnabled,
    reload: loadSettings,
  };
};
