/**
 * Base Document Parser
 * Abstract class providing shared functionality for all document parsers
 */

import { ParsedDocumentData, DocumentType } from '@/types';
import { IDocumentParser, ParserConfig, ValidationResult } from './IDocumentParser';

export abstract class BaseDocumentParser implements IDocumentParser {
  protected config: ParserConfig;

  constructor(config: ParserConfig = {}) {
    this.config = {
      maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024, // 10MB default
      timeout: config.timeout ?? 30000, // 30s default
      enableAIParsing: config.enableAIParsing ?? true,
    };
  }

  abstract canParse(file: File): boolean;
  abstract getSupportedTypes(): string[];
  abstract parse(file: File): Promise<ParsedDocumentData>;
  abstract getName(): string;

  async validate(file: File): Promise<ValidationResult> {
    if (file.size > this.config.maxFileSize!) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${this.config.maxFileSize! / 1024 / 1024}MB`,
      };
    }

    if (!this.canParse(file)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}`,
      };
    }

    return { valid: true };
  }

  /**
   * Extract email addresses from text
   */
  protected extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return Array.from(new Set(text.match(emailRegex) || []));
  }

  /**
   * Extract phone numbers from text
   */
  protected extractPhones(text: string): string[] {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    return Array.from(new Set(text.match(phoneRegex) || []));
  }

  /**
   * Extract URLs from text
   */
  protected extractURLs(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return Array.from(new Set(text.match(urlRegex) || []));
  }

  /**
   * Extract LinkedIn profile URL
   */
  protected extractLinkedIn(text: string): string | undefined {
    const linkedInRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/i;
    const match = text.match(linkedInRegex);
    return match ? match[0] : undefined;
  }

  /**
   * Extract GitHub profile URL
   */
  protected extractGitHub(text: string): string | undefined {
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9-]+/i;
    const match = text.match(githubRegex);
    return match ? match[0] : undefined;
  }

  /**
   * Extract portfolio website URL
   */
  protected extractPortfolio(text: string): string | undefined {
    const urls = this.extractURLs(text);
    const filtered = urls.filter(url =>
      !url.includes('linkedin.com') && !url.includes('github.com')
    );
    return filtered[0];
  }

  /**
   * Extract possible names from text
   */
  protected extractNames(text: string): string[] {
    // Simple heuristic: capitalized words at the start of the document
    const lines = text.split('\n');
    const names: string[] = [];

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
      if (nameMatch) {
        names.push(nameMatch[1]);
      }
    }

    return names;
  }

  /**
   * Extract locations from text
   */
  protected extractLocations(text: string): string[] {
    const locationRegex = /\b[A-Z][a-z]+(?:,\s*[A-Z]{2}|,\s*[A-Z][a-z]+)\b/g;
    return Array.from(new Set(text.match(locationRegex) || []));
  }

  /**
   * Extract dates from text
   */
  protected extractDates(text: string): string[] {
    const datePatterns = [
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
    ];

    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    }

    return Array.from(new Set(dates));
  }

  /**
   * Detect document type from content
   */
  protected detectDocumentType(text: string): DocumentType {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('curriculum vitae') || lowerText.includes('cv')) {
      return 'cv';
    }
    if (lowerText.includes('resume') ||
        (lowerText.includes('experience') && lowerText.includes('education'))) {
      return 'resume';
    }
    if (lowerText.includes('cover letter') || lowerText.includes('dear hiring')) {
      return 'cover-letter';
    }
    if (lowerText.includes('transcript') || lowerText.includes('grade report')) {
      return 'transcript';
    }

    return 'other';
  }

  /**
   * Calculate confidence score based on extracted data quality
   */
  protected calculateConfidence(data: Partial<ParsedDocumentData>): number {
    let score = 0;
    let maxScore = 0;

    // Email found (+20%)
    maxScore += 20;
    if (data.emails && data.emails.length > 0) score += 20;

    // Phone found (+10%)
    maxScore += 10;
    if (data.phones && data.phones.length > 0) score += 10;

    // Names found (+15%)
    maxScore += 15;
    if (data.names && data.names.length > 0) score += 15;

    // Experience found (+25%)
    maxScore += 25;
    if (data.experience && data.experience.length > 0) score += 25;

    // Education found (+20%)
    maxScore += 20;
    if (data.education && data.education.length > 0) score += 20;

    // Skills found (+10%)
    maxScore += 10;
    if (data.skills && data.skills.length > 0) score += 10;

    return score / maxScore;
  }

  /**
   * Extract skills from text (basic heuristic)
   */
  protected extractSkills(text: string): string[] {
    const skillKeywords = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust',
      'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring',
      'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes',
      'git', 'agile', 'scrum', 'ci/cd',
    ];

    const lowerText = text.toLowerCase();
    const foundSkills: string[] = [];

    for (const skill of skillKeywords) {
      if (lowerText.includes(skill)) {
        foundSkills.push(skill);
      }
    }

    return foundSkills;
  }

  /**
   * Count words in text
   */
  protected countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract key phrases (simple implementation)
   */
  protected extractKeyPhrases(text: string): string[] {
    // Extract sentences with action words
    const actionWords = ['developed', 'created', 'managed', 'led', 'designed', 'implemented'];
    const sentences = text.split(/[.!?]+/);
    const keyPhrases: string[] = [];

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      for (const action of actionWords) {
        if (lower.includes(action)) {
          keyPhrases.push(sentence.trim());
          break;
        }
      }
    }

    return keyPhrases.slice(0, 10); // Top 10 key phrases
  }
}
