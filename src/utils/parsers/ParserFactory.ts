/**
 * Document Parser Factory
 * Manages document parsers and provides appropriate parser for each file type
 */

import { ParsedDocumentData } from '@/types';
import { IDocumentParser } from './IDocumentParser';
import { PDFParser } from './PDFParser';
import { TXTParser } from './TXTParser';

export class DocumentParserFactory {
  private static parsers: IDocumentParser[] = [
    new PDFParser(),
    new TXTParser(),
    // Add more parsers here (DOCX, etc.)
  ];

  /**
   * Get appropriate parser for file
   */
  static getParser(file: File): IDocumentParser | null {
    return this.parsers.find(parser => parser.canParse(file)) || null;
  }

  /**
   * Register custom parser
   */
  static registerParser(parser: IDocumentParser): void {
    this.parsers.push(parser);
  }

  /**
   * Get all supported file types
   */
  static getSupportedTypes(): string[] {
    return this.parsers.flatMap(parser => parser.getSupportedTypes());
  }

  /**
   * Parse file with appropriate parser
   */
  static async parse(file: File): Promise<ParsedDocumentData> {
    const parser = this.getParser(file);

    if (!parser) {
      throw new Error(`No parser available for file type: ${file.type || file.name}`);
    }

    const validation = await parser.validate(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return parser.parse(file);
  }

  /**
   * Check if file type is supported
   */
  static isSupported(file: File): boolean {
    return this.getParser(file) !== null;
  }

  /**
   * Get parser name for a file
   */
  static getParserName(file: File): string | null {
    const parser = this.getParser(file);
    return parser ? parser.getName() : null;
  }
}
