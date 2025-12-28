/**
 * Document Parser Interface
 * Defines the contract for all document parsers
 */

import { ParsedDocumentData } from '@/types';

export interface ParserConfig {
  maxFileSize?: number; // in bytes
  timeout?: number; // in ms
  enableAIParsing?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface IDocumentParser {
  /**
   * Check if this parser can handle the given file type
   */
  canParse(file: File): boolean;

  /**
   * Get supported MIME types
   */
  getSupportedTypes(): string[];

  /**
   * Parse document and extract structured data
   */
  parse(file: File): Promise<ParsedDocumentData>;

  /**
   * Get parser name for logging/debugging
   */
  getName(): string;

  /**
   * Validate file before parsing
   */
  validate(file: File): Promise<ValidationResult>;
}
