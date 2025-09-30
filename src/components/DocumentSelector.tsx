import { useState } from 'preact/hooks';
import { UploadedDocument } from '@/types';
import { StorageManager } from '@/utils/storage';

interface DocumentSelectorProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function DocumentSelector({ documents, onDocumentsChange, onContinue, onBack }: DocumentSelectorProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>(documents.map(d => d.id));
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    setUploadError(null);
    const newDocuments: UploadedDocument[] = [];
    const errors: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size before reading (5MB limit)
        if (file.size > 5000000) {
          errors.push(`"${file.name}" is too large (${Math.round(file.size / 1024)}KB). Maximum 5MB per file.`);
          continue;
        }

        try {
          const content = await readFileAsText(file);

          // Validate document size
          const validation = StorageManager.validateDocumentSize(content, file.name);
          if (!validation.valid) {
            errors.push(validation.error!);
            continue;
          }

          const document: UploadedDocument = {
            id: Date.now().toString() + i,
            name: file.name,
            content,
            type: file.type,
            uploadedAt: Date.now()
          };
          newDocuments.push(document);
        } catch (error) {
          console.error(`Failed to read file ${file.name}:`, error);
          errors.push(`Failed to read "${file.name}"`);
        }
      }

      if (newDocuments.length > 0) {
        onDocumentsChange([...documents, ...newDocuments]);
        setSelectedDocs([...selectedDocs, ...newDocuments.map(d => d.id)]);
      }

      if (errors.length > 0) {
        setUploadError(errors.join(' '));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removeDocument = (id: string) => {
    onDocumentsChange(documents.filter(doc => doc.id !== id));
    setSelectedDocs(selectedDocs.filter(docId => docId !== id));
  };

  const toggleDocument = (id: string) => {
    setSelectedDocs(prev =>
      prev.includes(id)
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    );
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer?.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div className="step-header">
        <div className="step-title">Personal Context</div>
        <div className="step-subtitle">
          Upload documents that will help Gemini understand you better
        </div>
      </div>

      <div className="space-y-4">
        {/* Upload Progress */}
        {isUploading && (
          <div className="info-box-blue">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Processing files...</span>
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="error-box">
            <span className="material-symbols-outlined">error</span>
            <span>{uploadError}</span>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`document-selector border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? 'border-blue-400'
              : ''
          }`}
          style={{
            borderColor: isDragging ? 'var(--gemini-accent)' : 'var(--gemini-border)',
            backgroundColor: isDragging ? 'rgba(138, 180, 248, 0.1)' : 'var(--gemini-surface)'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--gemini-accent)' }}>upload_file</span>
            <div>
              <div className="mb-2 text-sm font-medium" style={{ color: 'var(--gemini-text-primary)' }}>
                Drag & drop or
              </div>
              <label className={`gemini-button secondary text-sm py-2 px-4 inline-block ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <span className="material-symbols-outlined text-sm">folder_open</span>
                Browse files
                <input
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files) {
                      handleFileUpload(target.files);
                    }
                  }}
                />
              </label>
            </div>
            <div className="text-xs" style={{ color: 'var(--gemini-text-secondary)' }}>
              TXT, PDF, DOC, DOCX
            </div>
          </div>
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium" style={{ color: 'var(--gemini-text-primary)' }}>
              Selected: {selectedDocs.length}/{documents.length}
            </div>

            <div className="doc-list-container space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`doc-item ${
                    selectedDocs.includes(doc.id)
                      ? 'doc-item-selected'
                      : 'doc-item-unselected'
                  }`}
                  onClick={() => toggleDocument(doc.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedDocs.includes(doc.id)
                        ? 'border-blue-400'
                        : 'border-gray-500'
                    }`} style={{
                      backgroundColor: selectedDocs.includes(doc.id) ? 'var(--gemini-accent)' : 'transparent'
                    }}>
                      {selectedDocs.includes(doc.id) && (
                        <span className="material-symbols-outlined text-xs" style={{ color: '#1f1f1f' }}>check</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--gemini-text-primary)' }}>{doc.name}</div>
                      <div className="text-xs" style={{ color: 'var(--gemini-text-secondary)' }}>
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDocument(doc.id);
                    }}
                    className="transition-colors p-1"
                    style={{ color: 'var(--gemini-text-secondary)' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--gemini-error)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--gemini-text-secondary)'}
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="gemini-button flex-1"
          >
            ← Back
          </button>
          <button
            onClick={onContinue}
            className="gemini-button primary flex-1"
          >
            Continue →
          </button>
        </div>

        {/* Info */}
        <div className="info-box">
          <span className="material-symbols-outlined text-sm">lightbulb</span>
          <span>Upload resumes, cover letters, or personal info to help Gemini generate more personalized form responses.</span>
        </div>
      </div>
    </>
  );
}