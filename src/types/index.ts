export interface ExtensionSettings {
  apiKey: string;
  documents: UploadedDocument[];
  isEnabled: boolean;
}

export interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadedAt: number;
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