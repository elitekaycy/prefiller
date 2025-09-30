import { useState } from 'preact/hooks';
import { UploadedDocument } from '@/types';

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

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    const newDocuments: UploadedDocument[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          const content = await readFileAsText(file);
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
        }
      }

      onDocumentsChange([...documents, ...newDocuments]);
      setSelectedDocs([...selectedDocs, ...newDocuments.map(d => d.id)]);
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

        {/* Upload Area */}
        <div
          className={`document-selector border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-center space-y-2">
            <div className="text-3xl">📄</div>
            <div>
              <div className="text-gray-800 mb-2 text-sm font-medium">
                Drag & drop or
              </div>
              <label className={`gemini-button text-sm py-2 px-4 inline-block ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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
            <div className="text-xs text-gray-500">
              TXT, PDF, DOC, DOCX
            </div>
          </div>
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              Selected: {selectedDocs.length}/{documents.length}
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
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
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-400'
                    }`}>
                      {selectedDocs.includes(doc.id) && (
                        <div className="w-2 h-2 bg-white rounded-sm"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{doc.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDocument(doc.id);
                    }}
                    className="text-gray-500 hover:text-red-600 transition-colors p-1"
                  >
                    🗑️
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
          💡 Tip: Upload resumes, cover letters, or personal info to help Gemini generate more personalized form responses.
        </div>
      </div>
    </>
  );
}