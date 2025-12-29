import { useState } from 'preact/hooks';
import { UploadedDocument } from '@/types';
import { DocumentParserFactory } from '@/utils/parsers/ParserFactory';
import { CacheManager } from '@/storage';
import { Header, Button, LoadingSpinner, FixedFooter } from './ui';
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

      <div className="flex-1 space-y-4 pb-20">
        {/* Document Upload Component */}
        <DocumentUpload
          documents={documents}
          onDocumentsChange={onDocumentsChange}
        />

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-blue-500 text-base mt-0.5">info</span>
          <div className="flex-1 text-xs text-gray-700">
            Upload documents to help generate personalized responses
          </div>
        </div>
      </div>

      {/* Fixed Footer with Continue Button */}
      <FixedFooter>
        <Button
          onClick={onContinue}
          variant="primary"
          className="w-full"
        >
          <span>Continue</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </Button>
      </FixedFooter>
    </div>
  );
}
