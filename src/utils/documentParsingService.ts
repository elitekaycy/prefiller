/**
 * Hybrid Document Parsing Service
 * - Tries AI parsing first (better quality, flexible)
 * - Falls back to regex-based parser if AI fails/unavailable
 * - Caches results in localStorage
 * - Returns unified format
 */

import { DocumentParser, ParsedDocumentData } from './documentParser';
import { AIService } from './aiService';
import type { AIProvider } from '@/types';

export class DocumentParsingService {
  /**
   * Parse document with AI first, fallback to regex parser
   */
  static async parseDocument(
    content: string,
    fileName: string,
    aiProvider?: AIProvider,
    apiKey?: string
  ): Promise<{ data: ParsedDocumentData; method: 'ai' | 'regex' }> {
    console.log(`\n🚀 [ParsingService] Starting hybrid parsing for: ${fileName}`);
    console.log(`📊 [ParsingService] Content length: ${content.length} chars`);

    // Try AI parsing first if provider and key available
    if (aiProvider && apiKey && aiProvider !== 'chromeai') {
      console.log(`🤖 [ParsingService] Attempting AI parsing with ${aiProvider}...`);

      try {
        const parsed = await this.parseWithAI(content, fileName, aiProvider, apiKey);
        console.log(`✅ [ParsingService] AI parsing successful!`);
        return { data: parsed, method: 'ai' };
      } catch (error) {
        console.warn(`⚠️ [ParsingService] AI parsing failed:`, error);
        console.log(`🔄 [ParsingService] Falling back to regex parser...`);
      }
    } else {
      console.log(`ℹ️ [ParsingService] AI not configured, using regex parser directly`);
    }

    // Fallback to regex parser
    console.log(`🔧 [ParsingService] Using regex-based parser...`);
    const parsed = await DocumentParser.parse(content, fileName);
    console.log(`✅ [ParsingService] Regex parsing complete!`);

    return { data: parsed, method: 'regex' };
  }

  /**
   * Parse document using AI
   */
  private static async parseWithAI(
    content: string,
    fileName: string,
    aiProvider: AIProvider,
    apiKey: string
  ): Promise<ParsedDocumentData> {
    const aiService = new AIService(aiProvider, apiKey);

    const prompt = this.buildAIParsingPrompt(content);

    console.log(`🤖 [ParsingService] Sending parsing prompt to AI (${prompt.length} chars)...`);

    const response = await aiService.generateContent(prompt);

    console.log(`📥 [ParsingService] AI response received (${response.length} chars)`);
    console.log(`📄 [ParsingService] Raw AI response:`, response);

    // Parse AI response (expect JSON format)
    const parsed = this.parseAIResponse(response, content);

    console.log(`✅ [ParsingService] AI response parsed successfully`);

    return parsed;
  }

  /**
   * Build AI prompt for document parsing
   */
  private static buildAIParsingPrompt(content: string): string {
    return `Extract structured information from the following document and return as JSON.

Document Content:
${content}

Extract the following information and return ONLY valid JSON (no markdown, no explanations):

{
  "emails": ["array of email addresses found"],
  "phones": ["array of phone numbers found"],
  "urls": ["array of URLs found"],
  "names": ["array of person names found"],
  "locations": ["array of locations/cities/countries found"],
  "dates": ["array of dates found"],
  "keyPhrases": ["3-5 most important phrases or sentences"],
  "wordCount": number,
  "sections": [{"title": "section name", "content": "section content"}],
  "isProbablyResume": true or false,
  "skills": ["array of skills if resume"],
  "education": ["array of education if resume"],
  "experience": ["array of work experience if resume"]
}

Return ONLY the JSON, nothing else.`;
  }

  /**
   * Parse AI's JSON response
   */
  private static parseAIResponse(response: string, originalContent: string): ParsedDocumentData {
    try {
      // Try to extract JSON from response (AI might wrap it in markdown)
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Parse the JSON
      const parsed = JSON.parse(jsonStr);

      // Add rawContent
      parsed.rawContent = originalContent;

      console.log(`✅ [ParsingService] AI JSON parsed successfully:`, parsed);

      return parsed as ParsedDocumentData;
    } catch (error) {
      console.error(`❌ [ParsingService] Failed to parse AI JSON response:`, error);
      console.error(`❌ [ParsingService] Raw response:`, response);
      throw new Error('AI returned invalid JSON');
    }
  }

  /**
   * Cache parsed document in localStorage
   */
  static cacheParseResults(documentId: string, parsed: ParsedDocumentData, method: 'ai' | 'regex'): void {
    try {
      const cacheKey = `parsed_doc_${documentId}`;
      const cacheData = {
        parsed,
        method,
        cachedAt: Date.now()
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 [ParsingService] Cached parsing results for document ${documentId} (method: ${method})`);
    } catch (error) {
      console.warn(`⚠️ [ParsingService] Failed to cache parsing results:`, error);
    }
  }

  /**
   * Get cached parse results
   */
  static getCachedParseResults(documentId: string): { data: ParsedDocumentData; method: 'ai' | 'regex' } | null {
    try {
      const cacheKey = `parsed_doc_${documentId}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        console.log(`ℹ️ [ParsingService] No cached results for document ${documentId}`);
        return null;
      }

      const cacheData = JSON.parse(cached);

      const age = Date.now() - cacheData.cachedAt;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age > maxAge) {
        console.log(`⏰ [ParsingService] Cached results for document ${documentId} expired (${Math.round(age / 1000 / 60)} mins old)`);
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`✅ [ParsingService] Using cached results for document ${documentId} (${cacheData.method})`);
      return { data: cacheData.parsed, method: cacheData.method };
    } catch (error) {
      console.warn(`⚠️ [ParsingService] Failed to get cached results:`, error);
      return null;
    }
  }

  /**
   * Clear cache for a document
   */
  static clearCache(documentId: string): void {
    const cacheKey = `parsed_doc_${documentId}`;
    localStorage.removeItem(cacheKey);
    console.log(`🗑️ [ParsingService] Cleared cache for document ${documentId}`);
  }
}
