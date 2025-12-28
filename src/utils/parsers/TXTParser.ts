/**
 * TXT Document Parser
 * Parses plain text files (.txt)
 */

import { ParsedDocumentData } from '@/types';
import { BaseDocumentParser } from './BaseDocumentParser';

export class TXTParser extends BaseDocumentParser {
  getName(): string {
    return 'TXT Parser';
  }

  canParse(file: File): boolean {
    return file.type === 'text/plain' || file.name.endsWith('.txt');
  }

  getSupportedTypes(): string[] {
    return ['text/plain'];
  }

  async parse(file: File): Promise<ParsedDocumentData> {
    const text = await file.text();
    const rawText = text;

    // Extract basic information using base class methods
    const emails = this.extractEmails(text);
    const phones = this.extractPhones(text);
    const urls = this.extractURLs(text);
    const names = this.extractNames(text);
    const locations = this.extractLocations(text);
    const dates = this.extractDates(text);
    const skills = this.extractSkills(text);
    const keyPhrases = this.extractKeyPhrases(text);

    // Extract social profiles
    const linkedin = this.extractLinkedIn(text);
    const github = this.extractGitHub(text);
    const portfolio = this.extractPortfolio(text);

    // Detect document type
    const documentType = this.detectDocumentType(text);

    // Build basic parsed data
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
      sections: [{ title: 'Content', content: text }],
      keyPhrases,
      dates,

      // Metadata
      wordCount: this.countWords(text),
      documentType,
      isProbablyResume: documentType === 'resume' || documentType === 'cv',
      confidence: 0, // Will be calculated below

      // Raw Data
      rawContent: text,
      rawText,
    };

    // Calculate confidence
    parsedData.confidence = this.calculateConfidence(parsedData);

    return parsedData;
  }
}
