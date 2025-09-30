import { useState } from 'preact/hooks';
import { UploadedDocument } from '@/types';

interface DocumentUploadProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
}

export function DocumentUpload({ documents, onDocumentsChange }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    const newDocuments: UploadedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await readFileAsText(file);

      const document: UploadedDocument = {
        id: Date.now().toString() + i,
        name: file.name,
        content,
        type: file.type,
        uploadedAt: Date.now()
      };

      newDocuments.push(document);
    }

    onDocumentsChange([...documents, ...newDocuments]);
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
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Personal Documents</h3>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-2">
          <div className="text-2xl">📄</div>
          <div className="text-gray-600">
            Drag & drop documents here or{' '}
            <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
              browse files
              <input
                type="file"
                multiple
                accept=".txt,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) {
                    handleFileUpload(target.files);
                  }
                }}
              />
            </label>
          </div>
          <div className="text-sm text-gray-500">
            Supports: TXT, PDF, DOC, DOCX
          </div>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-700">Uploaded Documents</h4>
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-sm">📄</span>
                <span className="text-sm font-medium">{doc.name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => removeDocument(doc.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}