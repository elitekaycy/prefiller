import { useState } from 'preact/hooks';
import { UploadedDocument } from '@/types';
import { DocumentParserFactory } from '@/utils/parsers/ParserFactory';
import { CacheManager, StorageManager } from '@/storage';
import { FileValidator } from '@/utils/fileValidation';

interface DocumentUploadProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
}

export function DocumentUpload({ documents, onDocumentsChange }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsingStatus, setParsingStatus] = useState<string>('');

  const handleFileUpload = async (files: FileList) => {
    setIsProcessing(true);
    setError(null);
    const newDocuments: UploadedDocument[] = [];
    const errors: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setParsingStatus(`Validating ${file.name}...`);

        // Validate file before processing
        const validation = await FileValidator.validate(file);
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        // Show warnings if any
        if (validation.warnings && validation.warnings.length > 0) {
          console.warn(`Warnings for ${file.name}:`, validation.warnings);
        }

        setParsingStatus(`Processing ${file.name}...`);
        const documentId = Date.now().toString() + i;

        // Check if we have cached parsed data for this file
        const cached = await CacheManager.getParsedDocument(documentId);

        let parsedData;
        if (cached) {
          setParsingStatus(`Using cached data for ${file.name}...`);
          parsedData = cached;
        } else {
          // Parse document using new parser factory
          setParsingStatus(`Parsing ${file.name}...`);
          parsedData = await DocumentParserFactory.parse(file);

          // Cache the parsed data
          await CacheManager.setParsedDocument(documentId, parsedData);
        }

        setParsingStatus(
          `✅ Found: ${parsedData.emails.length} emails, ${parsedData.phones.length} phones` +
          (parsedData.education?.length ? `, ${parsedData.education.length} education entries` : '')
        );

        // Read file content for storage
        const content = await readFileContent(file);

        const document: UploadedDocument = {
          id: documentId,
          name: file.name,
          content,
          type: file.type,
          uploadedAt: Date.now(),
          parsedData,
          parsedAt: Date.now(),
          parsedBy: 'parser',
        };

        newDocuments.push(document);
      }

      onDocumentsChange([...documents, ...newDocuments]);

      // Show validation errors if any
      if (errors.length > 0) {
        setError(errors.join('\n'));
      } else {
        // Clear status after a delay if no errors
        setTimeout(() => setParsingStatus(''), 3000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process document';
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;

      // For binary files (like PDFs), read as text anyway for storage
      // The parser already extracted the actual text
      if (file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
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
    <div
      className="rounded-lg p-4 border"
      style={{
        backgroundColor: 'var(--gemini-surface)',
        borderColor: 'var(--gemini-border)'
      }}
    >
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--gemini-text-primary)' }}>Documents</h3>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isProcessing ? 'opacity-50 pointer-events-none' : ''
        }`}
        style={{
          borderColor: isDragging ? 'var(--gemini-accent)' : 'var(--gemini-border)',
          backgroundColor: isDragging ? 'rgba(138, 180, 248, 0.1)' : 'var(--gemini-bg)'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-2">
          <div className="text-2xl">{isProcessing ? '⏳' : '📄'}</div>
          <div style={{ color: 'var(--gemini-text-secondary)' }}>
            {isProcessing ? (
              <div className="text-sm">
                {parsingStatus || 'Processing document...'}
              </div>
            ) : (
              <>
                Drag & drop documents here or{' '}
                <label className="cursor-pointer underline" style={{ color: 'var(--gemini-accent)' }}>
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
              </>
            )}
          </div>
          <div className="text-sm" style={{ color: 'var(--gemini-text-secondary)' }}>
            Supports: TXT, PDF, DOC, DOCX
          </div>
        </div>
      </div>

      {error && (
        <div
          className="mt-3 p-2 rounded-lg text-xs border"
          style={{
            backgroundColor: 'rgba(242, 139, 130, 0.1)',
            borderColor: 'var(--gemini-error)',
            color: 'var(--gemini-error)'
          }}
        >
          {error}
        </div>
      )}

      {parsingStatus && !isProcessing && (
        <div
          className="mt-3 p-2 rounded-lg text-xs border"
          style={{
            backgroundColor: 'rgba(129, 201, 149, 0.1)',
            borderColor: 'var(--gemini-success)',
            color: 'var(--gemini-success)'
          }}
        >
          {parsingStatus}
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium" style={{ color: 'var(--gemini-text-primary)' }}>Uploaded Documents</h4>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-md border"
              style={{
                backgroundColor: 'var(--gemini-bg)',
                borderColor: 'var(--gemini-border)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📄</span>
                <span className="text-sm font-medium" style={{ color: 'var(--gemini-text-primary)' }}>{doc.name}</span>
                <span className="text-xs" style={{ color: 'var(--gemini-text-secondary)' }}>
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => removeDocument(doc.id)}
                className="text-gray-500 hover:text-red-600 transition-colors"
                aria-label="Remove document"
              >
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}