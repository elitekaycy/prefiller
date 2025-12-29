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
        <div
          className="rounded-lg border p-3 flex items-start gap-2"
          style={{
            backgroundColor: 'rgba(138, 180, 248, 0.05)',
            borderColor: 'var(--gemini-border)'
          }}
        >
          <span className="material-symbols-outlined text-base mt-0.5" style={{ color: 'var(--gemini-accent)' }}>info</span>
          <div className="flex-1 text-xs" style={{ color: 'var(--gemini-text-secondary)' }}>
            Upload documents to help generate personalized responses
          </div>
        </div>
      </div>

      {/* Fixed Footer with Continue Button */}
      <FixedFooter>
        <Button
          onClick={onContinue}
          variant="primary"
          size="lg"
          className="w-full"
        >
          <span>Continue</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </Button>
      </FixedFooter>
    </div>
  );
}
