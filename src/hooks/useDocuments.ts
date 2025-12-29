import { useState, useEffect, useCallback } from 'preact/hooks';
import { StorageManager } from '@/storage';
import { UploadedDocument } from '@/types';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await StorageManager.getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const addDocument = useCallback(async (doc: UploadedDocument) => {
    try {
      setError(null);
      await StorageManager.addDocument(doc);
      setDocuments((prev) => [...prev, doc]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document');
      throw err;
    }
  }, []);

  const removeDocument = useCallback(async (id: string) => {
    try {
      setError(null);
      await StorageManager.removeDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove document');
      throw err;
    }
  }, []);

  const updateDocument = useCallback(
    async (id: string, updates: Partial<UploadedDocument>) => {
      try {
        setError(null);
        await StorageManager.updateDocument(id, updates);
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update document');
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    loading,
    error,
    addDocument,
    removeDocument,
    updateDocument,
    reload: loadDocuments,
  };
};
