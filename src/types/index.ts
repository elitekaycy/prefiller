export type AIProvider = 'gemini' | 'claude' | 'chromeai' | 'groq';

// Export AI Provider types and errors
export { IAIProvider, ProviderConfig } from '@/utils/ai/IAIProvider';
export { ProviderError, ProviderErrorCode } from '@/utils/ai/ProviderError';

export interface ExtensionSettings {
  aiProvider: AIProvider;
  apiKey: string;
  documents: UploadedDocument[];
  isEnabled: boolean;
}

export interface ParsedDocumentData {
  emails: string[];
  phones: string[];
  urls: string[];
  names: string[];
  locations: string[];
  dates: string[];
  keyPhrases: string[];
  wordCount: number;
  sections: Array<{ title: string; content: string }>;
  isProbablyResume: boolean;
  skills?: string[];
  education?: string[];
  experience?: string[];
  rawContent: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadedAt: number;
  parsed?: ParsedDocumentData; // Cached parsed data
  parsedAt?: number; // When it was parsed
  parsedBy?: 'ai' | 'regex'; // Which parser was used
}

export interface FormField {
  element: HTMLElement;
  type: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}