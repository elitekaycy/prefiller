export type AIProvider = 'gemini' | 'claude' | 'chromeai' | 'groq';

// Export AI Provider types and errors
export { IAIProvider, ProviderConfig } from '@/utils/ai/IAIProvider';
export { ProviderError, ProviderErrorCode } from '@/utils/ai/ProviderError';

export interface ExtensionSettings {
  aiProvider: AIProvider;
  apiKey: string;
  documents: UploadedDocument[];
  isEnabled: boolean;
  urlContexts?: URLContext[];
  linkScrapingConfig?: LinkScrapingConfig;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  location?: string;
}

export interface Experience {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string[];
}

export type DocumentType = 'resume' | 'cv' | 'cover-letter' | 'transcript' | 'other';

export interface ParsedDocumentData {
  // Contact Information
  emails: string[];
  phones: string[];
  urls: string[];
  linkedin?: string;
  github?: string;
  portfolio?: string;

  // Personal Information
  names: string[];
  fullName?: string;
  locations: string[];
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;

  // Professional Information
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  skills: string[];
  certifications?: string[];
  languages?: string[];

  // Education
  education: Education[];

  // Experience
  experience: Experience[];

  // Document Structure
  sections: Array<{ title: string; content: string }>;
  keyPhrases: string[];
  dates: string[];

  // Metadata
  wordCount: number;
  documentType: DocumentType;
  isProbablyResume: boolean;
  confidence: number; // 0-1 confidence score

  // Raw Data
  rawContent: string;
  rawText: string; // Plain text without formatting

  // Form-Specific Fields
  customFields?: Record<string, string>; // For flexible field mapping
}

/**
 * URL context provided by user for additional information
 */
export interface URLContext {
  id: string;
  url: string;
  title?: string;
  description?: string;
  content: string;
  addedAt: number;
  scrapedAt?: number;
  scraper: 'manual' | 'auto';
  metadata: {
    success: boolean;
    error?: string;
    wordCount: number;
  };
}

/**
 * Link scraping configuration
 */
export interface LinkScrapingConfig {
  enabled: boolean;
  timeout: number;
  maxContentLength: number;
  cacheEnabled: boolean;
  cacheTTL: number;
}

/**
 * Field metadata for form analysis
 */
export interface FieldMetadata {
  element: HTMLElement;
  type: string;
  label: string;
  placeholder: string;
  name: string;
  id: string;
  required: boolean;
  description: string;
  context: string;
  options?: string[];
  pattern?: string;
  maxLength?: number;
  min?: number;
  max?: number;
}

/**
 * AI field response with metadata
 */
export interface AIFieldResponse {
  fieldIndex: number;
  value: string;
  confidence: number;
  reasoning: string;
  source: string;
  needsReview: boolean;
  alternatives?: string[];
}

/**
 * Complete AI form response
 */
export interface AIFormResponse {
  fields: AIFieldResponse[];
  overallConfidence: number;
  documentsSummary: string;
}

/**
 * Field validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedValue?: string;
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