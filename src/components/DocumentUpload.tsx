import { useState } from 'preact/hooks';
import { UploadedDocument } from '@/types';
import { PDFParser } from '@/utils/pdfParser';
import { DocumentParser, ParsedDocumentData } from '@/utils/documentParser';

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

    try {
      // Get settings for AI parsing
      const settings = await getSettings();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setParsingStatus(`Processing ${file.name}...`);
        console.log(`\n📄 Processing file: ${file.name} (${file.type})`);

        let content: string;

        // Handle PDFs differently from text files
        if (PDFParser.isPDF(file)) {
          setParsingStatus(`Extracting text from PDF: ${file.name}...`);
          console.log(`📄 Parsing PDF: ${file.name}`);
          content = await PDFParser.extractText(file);
          console.log(`✅ PDF parsed: ${content.length} characters extracted`);
        } else {
          setParsingStatus(`Reading text file: ${file.name}...`);
          console.log(`📄 Reading text file: ${file.name}`);
          content = await readFileAsText(file);
          console.log(`✅ Text file read: ${content.length} characters`);
        }

        const documentId = Date.now().toString() + i;

        // Parse document in background (AI first, fallback to regex)
        setParsingStatus(`Analyzing document structure: ${file.name}...`);
        console.log(`\n🔍 Starting background parsing for ${file.name}...`);
        const parseResult = await DocumentParser.parse(content, file.name);

        setParsingStatus(`✅ Found: ${parseResult.emails.length} emails, ${parseResult.phones.length} phones, ${parseResult.names.length} names`);

        const document: UploadedDocument = {
          id: documentId,
          name: file.name,
          content,
          type: file.type,
          uploadedAt: Date.now(),
          parsed: parseResult,
          parsedAt: Date.now(),
          parsedBy: 'regex' // We'll add AI parsing next
        };

        newDocuments.push(document);
        console.log(`✅ Document processed and parsed: ${file.name}`);
      }

      onDocumentsChange([...documents, ...newDocuments]);
      console.log(`\n✅ Successfully uploaded and parsed ${newDocuments.length} document(s)`);

      // Clear status after a delay
      setTimeout(() => setParsingStatus(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process document';
      setError(errorMsg);
      console.error('Document upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSettings = async (): Promise<any> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        resolve(result.settings || {});
      });
    });
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
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-2">
          <div className="text-2xl">{isProcessing ? '⏳' : '📄'}</div>
          <div className="text-gray-600">
            {isProcessing ? (
              <div className="text-sm">
                {parsingStatus || 'Processing document...'}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Supports: TXT, PDF, DOC, DOCX
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {parsingStatus && !isProcessing && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {parsingStatus}
        </div>
      )}

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