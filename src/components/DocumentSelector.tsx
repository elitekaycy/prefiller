import { useState } from 'preact/hooks';
import { UploadedDocument } from '@/types';
import { DocumentParserFactory } from '@/utils/parsers/ParserFactory';
import { CacheManager } from '@/storage';
import { Header, Button, LoadingSpinner } from './ui';
import { DocumentUpload } from './DocumentUpload';

interface DocumentSelectorProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function DocumentSelector({ documents, onDocumentsChange, onContinue, onBack }: DocumentSelectorProps) {
  return (
    <div className="flex flex-col h-full">
      <Header title="Upload Documents" onBack={onBack} />

      <div className="flex-1 space-y-6 pb-24">
        {/* Document Upload Component */}
        <DocumentUpload
          documents={documents}
          onDocumentsChange={onDocumentsChange}
        />

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 text-xl">lightbulb</span>
          <div className="flex-1 text-sm text-blue-800">
            Upload resumes, cover letters, or personal documents to help AI generate more accurate and personalized form responses.
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          variant="primary"
          size="lg"
          className="w-full"
        >
          <span>Continue</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </Button>
      </div>
    </div>
  );
}
