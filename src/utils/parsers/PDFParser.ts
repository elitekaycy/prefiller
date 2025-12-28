/**
 * PDF Document Parser
 * Uses PDF.js to extract and parse PDF documents
 */

import * as pdfjsLib from 'pdfjs-dist';
import { ParsedDocumentData } from '@/types';
import { BaseDocumentParser } from './BaseDocumentParser';

// Configure PDF.js worker - use local bundled worker for Chrome extension
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');
} else {
  // Fallback for non-extension environments
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export class PDFParser extends BaseDocumentParser {
  getName(): string {
    return 'PDF Parser';
  }

  canParse(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  getSupportedTypes(): string[] {
    return ['application/pdf'];
  }

  async parse(file: File): Promise<ParsedDocumentData> {
    try {
      // Extract text from PDF using PDF.js
      const rawText = await this.extractTextFromPDF(file);

      if (rawText.trim().length === 0) {
        throw new Error('No text found in PDF. Please ensure your PDF has selectable text (not scanned images).');
      }

      // Extract information using base class methods
      const emails = this.extractEmails(rawText);
      const phones = this.extractPhones(rawText);
      const urls = this.extractURLs(rawText);
      const names = this.extractNames(rawText);
      const locations = this.extractLocations(rawText);
      const dates = this.extractDates(rawText);
      const skills = this.extractSkills(rawText);
      const keyPhrases = this.extractKeyPhrases(rawText);

      // Extract social profiles
      const linkedin = this.extractLinkedIn(rawText);
      const github = this.extractGitHub(rawText);
      const portfolio = this.extractPortfolio(rawText);

      // Detect document type
      const documentType = this.detectDocumentType(rawText);

      // Build parsed data
      const parsedData: ParsedDocumentData = {
        // Contact Information
        emails,
        phones,
        urls,
        linkedin,
        github,
        portfolio,

        // Personal Information
        names,
        fullName: names[0],
        locations,

        // Professional Information
        skills,

        // Education
        education: [],

        // Experience
        experience: [],

        // Document Structure
        sections: this.extractSections(rawText),
        keyPhrases,
        dates,

        // Metadata
        wordCount: this.countWords(rawText),
        documentType,
        isProbablyResume: documentType === 'resume' || documentType === 'cv',
        confidence: 0, // Will be calculated below

        // Raw Data
        rawContent: rawText,
        rawText,
      };

      // Calculate confidence
      parsedData.confidence = this.calculateConfidence(parsedData);

      return parsedData;
    } catch (error) {
      throw new Error(
        `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract text from PDF using PDF.js
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;

    // Extract text from all pages
    const textPages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items from the page
      const pageText = textContent.items.map((item: any) => item.str).join(' ');

      textPages.push(pageText);
    }

    return textPages.join('\n\n');
  }

  /**
   * Extract sections from PDF text
   */
  private extractSections(text: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];
    const lines = text.split('\n');

    let currentSection: { title: string; content: string } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if line looks like a section header (all caps or title case)
      if (
        trimmed.length > 0 &&
        trimmed.length < 50 &&
        (trimmed === trimmed.toUpperCase() || /^[A-Z][a-z]+/.test(trimmed))
      ) {
        // Start new section
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: trimmed, content: '' };
      } else if (currentSection && trimmed.length > 0) {
        // Add to current section
        currentSection.content += (currentSection.content ? '\n' : '') + trimmed;
      }
    }

    // Add last section
    if (currentSection) {
      sections.push(currentSection);
    }

    // If no sections found, return entire content
    if (sections.length === 0) {
      sections.push({ title: 'Content', content: text });
    }

    return sections;
  }
}
