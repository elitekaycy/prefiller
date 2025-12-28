/**
 * Hybrid Document Parsing Service
 * - Uses appropriate parser based on file type (PDF, TXT, DOCX)
 * - Optionally enhances with AI parsing for better quality
 * - Caches results in localStorage
 * - Returns unified format
 */

import { ParsedDocumentData } from '@/types';
import { DocumentParserFactory } from './parsers/ParserFactory';
import { AIService } from './aiService';
import type { AIProvider } from '@/types';

export class DocumentParsingService {
  /**
   * Parse document using appropriate parser based on file type
   */
  static async parseDocument(
    file: File,
    aiProvider?: AIProvider,
    apiKey?: string
  ): Promise<{ data: ParsedDocumentData; method: 'parser' | 'ai-enhanced' }> {
    try {
      // Use appropriate parser based on file type
      const parsed = await DocumentParserFactory.parse(file);

      // Optionally enhance with AI if available and confidence is low
      if (aiProvider && apiKey && aiProvider !== 'chromeai' && this.shouldEnhanceWithAI(parsed)) {
        try {
          const enhanced = await this.enhanceWithAI(parsed, aiProvider, apiKey);
          return { data: enhanced, method: 'ai-enhanced' };
        } catch (error) {
          // If AI enhancement fails, return original parsed data
          return { data: parsed, method: 'parser' };
        }
      }

      return { data: parsed, method: 'parser' };
    } catch (error) {
      throw new Error(
        `Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Determine if document should be enhanced with AI
   */
  private static shouldEnhanceWithAI(parsed: ParsedDocumentData): boolean {
    // Use AI if confidence is low or critical fields are missing
    return (
      parsed.confidence < 0.8 ||
      parsed.experience.length === 0 ||
      parsed.education.length === 0
    );
  }

  /**
   * Enhance parsed data with AI for better structure extraction
   */
  private static async enhanceWithAI(
    parsed: ParsedDocumentData,
    aiProvider: AIProvider,
    apiKey: string
  ): Promise<ParsedDocumentData> {
    const aiService = new AIService(aiProvider, apiKey);
    const prompt = this.buildAIEnhancementPrompt(parsed);

    const response = await aiService.generateContent(prompt);

    // Parse AI response (expect JSON format with enhanced data)
    const enhanced = this.parseAIResponse(response, parsed);

    return enhanced;
  }

  /**
   * Build AI prompt for enhancing parsed data
   */
  private static buildAIEnhancementPrompt(parsed: ParsedDocumentData): string {
    return `Enhance the following parsed resume/CV data by extracting structured education and experience information.

Raw Text:
${parsed.rawText}

Current Parsed Data:
- Skills found: ${parsed.skills.join(', ') || 'None'}
- Names found: ${parsed.names.join(', ') || 'None'}
- Locations found: ${parsed.locations.join(', ') || 'None'}

Extract and return ONLY valid JSON with the following structure (no markdown, no explanations):

{
  "fullName": "Full name of the person",
  "currentTitle": "Current job title",
  "currentCompany": "Current company",
  "education": [
    {
      "institution": "University/School name",
      "degree": "Degree type (BS, MS, PhD, etc.)",
      "field": "Field of study",
      "startDate": "Start date (MM/YYYY)",
      "endDate": "End date (MM/YYYY or 'Present')",
      "gpa": "GPA if mentioned",
      "location": "Location if mentioned"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "title": "Job title",
      "location": "Location",
      "startDate": "Start date (MM/YYYY)",
      "endDate": "End date (MM/YYYY or 'Present')",
      "current": true or false,
      "description": ["Array of bullet points describing responsibilities"]
    }
  ],
  "skills": ["Array of all skills mentioned"],
  "certifications": ["Array of certifications"],
  "languages": ["Array of languages"]
}

Return ONLY the JSON, nothing else.`;
  }

  /**
   * Parse AI's JSON response and merge with existing data
   */
  private static parseAIResponse(
    response: string,
    baseParsed: ParsedDocumentData
  ): ParsedDocumentData {
    try {
      // Try to extract JSON from response (AI might wrap it in markdown)
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Parse the JSON
      const enhanced = JSON.parse(jsonStr);

      // Merge enhanced data with base parsed data
      return {
        ...baseParsed,
        fullName: enhanced.fullName || baseParsed.fullName,
        currentTitle: enhanced.currentTitle,
        currentCompany: enhanced.currentCompany,
        education: enhanced.education || baseParsed.education,
        experience: enhanced.experience || baseParsed.experience,
        skills: enhanced.skills || baseParsed.skills,
        certifications: enhanced.certifications,
        languages: enhanced.languages,
        confidence: Math.max(baseParsed.confidence, 0.9), // Boost confidence with AI enhancement
      };
    } catch (error) {
      throw new Error('AI returned invalid JSON');
    }
  }

  /**
   * Cache parsed document in localStorage
   */
  static cacheParseResults(
    documentId: string,
    parsed: ParsedDocumentData,
    method: 'parser' | 'ai-enhanced'
  ): void {
    try {
      const cacheKey = `parsed_doc_${documentId}`;
      const cacheData = {
        parsed,
        method,
        cachedAt: Date.now(),
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      // Silent fail - caching is not critical
    }
  }

  /**
   * Get cached parse results
   */
  static getCachedParseResults(
    documentId: string
  ): { data: ParsedDocumentData; method: 'parser' | 'ai-enhanced' } | null {
    try {
      const cacheKey = `parsed_doc_${documentId}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);

      const age = Date.now() - cacheData.cachedAt;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age > maxAge) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return { data: cacheData.parsed, method: cacheData.method };
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear cache for a document
   */
  static clearCache(documentId: string): void {
    const cacheKey = `parsed_doc_${documentId}`;
    localStorage.removeItem(cacheKey);
  }
}
