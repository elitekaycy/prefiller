/**
 * Document Parser - Extracts structured information from any document
 * Works with resumes, cover letters, portfolios, or any text document
 * Runs in background when documents are uploaded for faster form filling
 */

export interface ParsedDocumentData {
  // Contact Information (extracted from any document type)
  emails: string[];
  phones: string[];
  urls: string[];

  // Detected names (could be author, recipient, mentioned persons)
  names: string[];

  // Locations mentioned
  locations: string[];

  // Dates mentioned
  dates: string[];

  // Key phrases and important sentences
  keyPhrases: string[];

  // Document metadata
  wordCount: number;
  characterCount: number;
  lineCount: number;

  // Structured sections (if any are detected)
  sections: Array<{
    title: string;
    content: string;
  }>;

  // Professional info (if document appears to be a resume/CV)
  isProbablyResume: boolean;
  skills?: string[];
  education?: string[];
  experience?: string[];

  // Raw for fallback
  rawContent: string;
}

export class DocumentParser {
  /**
   * Parse any document and extract structured data
   */
  static async parse(content: string, fileName: string): Promise<ParsedDocumentData> {
    console.log(`🔍 [Parser] Starting background parsing for: ${fileName}`);
    console.log(`🔍 [Parser] Content length: ${content.length} characters`);

    const startTime = Date.now();

    // Initialize result
    const parsed: ParsedDocumentData = {
      emails: [],
      phones: [],
      urls: [],
      names: [],
      locations: [],
      dates: [],
      keyPhrases: [],
      sections: [],
      wordCount: 0,
      characterCount: content.length,
      lineCount: content.split('\n').length,
      isProbablyResume: false,
      rawContent: content
    };

    // Calculate basic metadata
    console.log(`📊 [Parser] Calculating document metadata...`);
    parsed.wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`✅ [Parser] Metadata: ${parsed.wordCount} words, ${parsed.lineCount} lines, ${parsed.characterCount} chars`);

    // Extract all contact information
    console.log(`📧 [Parser] Extracting contact information...`);
    parsed.emails = this.extractAllEmails(content);
    parsed.phones = this.extractAllPhones(content);
    parsed.urls = this.extractAllUrls(content);
    console.log(`✅ [Parser] Contact info: ${parsed.emails.length} emails, ${parsed.phones.length} phones, ${parsed.urls.length} URLs`);
    console.log(`📧 [Parser] Emails:`, parsed.emails);
    console.log(`📞 [Parser] Phones:`, parsed.phones);
    console.log(`🔗 [Parser] URLs:`, parsed.urls);

    // Extract names
    console.log(`👤 [Parser] Extracting names...`);
    parsed.names = this.extractNames(content);
    console.log(`✅ [Parser] Found ${parsed.names.length} potential names:`, parsed.names);

    // Extract locations
    console.log(`🌍 [Parser] Extracting locations...`);
    parsed.locations = this.extractLocations(content);
    console.log(`✅ [Parser] Found ${parsed.locations.length} locations:`, parsed.locations);

    // Extract dates
    console.log(`📅 [Parser] Extracting dates...`);
    parsed.dates = this.extractDates(content);
    console.log(`✅ [Parser] Found ${parsed.dates.length} dates:`, parsed.dates);

    // Extract document sections
    console.log(`📑 [Parser] Extracting document sections...`);
    parsed.sections = this.extractSections(content);
    console.log(`✅ [Parser] Found ${parsed.sections.length} sections:`, parsed.sections.map(s => s.title));

    // Extract key phrases (first sentence of each paragraph)
    console.log(`🔑 [Parser] Extracting key phrases...`);
    parsed.keyPhrases = this.extractKeyPhrases(content);
    console.log(`✅ [Parser] Found ${parsed.keyPhrases.length} key phrases`);

    // Detect if it's a resume and extract professional info
    console.log(`🎯 [Parser] Detecting document type...`);
    parsed.isProbablyResume = this.detectIfResume(content);
    console.log(`✅ [Parser] Document type: ${parsed.isProbablyResume ? 'Resume/CV' : 'General document'}`);

    if (parsed.isProbablyResume) {
      console.log(`💼 [Parser] Extracting professional information (resume detected)...`);
      parsed.skills = this.extractSkills(content);
      parsed.education = this.extractEducationSimple(content);
      parsed.experience = this.extractExperienceSimple(content);
      console.log(`✅ [Parser] Professional info: ${parsed.skills?.length || 0} skills, ${parsed.education?.length || 0} education, ${parsed.experience?.length || 0} experience`);
    }

    const duration = Date.now() - startTime;
    console.log(`🎉 [Parser] Parsing completed in ${duration}ms`);
    console.log(`📊 [Parser] Final parsed data summary:`, {
      emails: parsed.emails.length,
      phones: parsed.phones.length,
      urls: parsed.urls.length,
      names: parsed.names.length,
      sections: parsed.sections.length,
      wordCount: parsed.wordCount,
      isProbablyResume: parsed.isProbablyResume
    });

    return parsed;
  }

  // Generic extraction methods (work for any document)

  private static extractAllEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex);
    return matches ? [...new Set(matches)] : [];
  }

  private static extractAllPhones(text: string): string[] {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const matches = text.match(phoneRegex);
    return matches ? [...new Set(matches)] : [];
  }

  private static extractAllUrls(text: string): string[] {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const matches = text.match(urlRegex);
    const urls = matches ? [...new Set(matches)] : [];

    // Also find LinkedIn, GitHub, etc. without https://
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
    const githubRegex = /github\.com\/[\w-]+/gi;

    const linkedin = text.match(linkedinRegex);
    const github = text.match(githubRegex);

    if (linkedin) urls.push(...linkedin.map(u => `https://${u}`));
    if (github) urls.push(...github.map(u => `https://${u}`));

    return [...new Set(urls)];
  }

  private static extractNames(text: string): string[] {
    const names: string[] = [];
    const lines = text.split('\n').slice(0, 10);

    for (const line of lines) {
      const trimmed = line.trim();
      // Look for 2-4 word names in title case
      if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(trimmed)) {
        const words = trimmed.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
          names.push(trimmed);
        }
      }
    }

    return [...new Set(names)];
  }

  private static extractLocations(text: string): string[] {
    const locations: string[] = [];

    // City, State format
    const cityStateRegex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})/g;
    let match;
    while ((match = cityStateRegex.exec(text)) !== null) {
      locations.push(`${match[1]}, ${match[2]}`);
    }

    // Countries
    const countries = ['USA', 'United States', 'Canada', 'UK', 'United Kingdom', 'Australia', 'Germany', 'France'];
    countries.forEach(country => {
      if (text.includes(country) && !locations.includes(country)) {
        locations.push(country);
      }
    });

    return [...new Set(locations)];
  }

  private static extractDates(text: string): string[] {
    const dates: string[] = [];

    // MM/DD/YYYY or MM-DD-YYYY
    const slashDateRegex = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g;
    const slashDates = text.match(slashDateRegex);
    if (slashDates) dates.push(...slashDates);

    // Month YYYY
    const monthYearRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/g;
    const monthYear = text.match(monthYearRegex);
    if (monthYear) dates.push(...monthYear);

    // Just year (2020-2024)
    const yearRegex = /\b(20[0-2]\d)\b/g;
    const years = text.match(yearRegex);
    if (years) dates.push(...years);

    return [...new Set(dates)];
  }

  private static extractSections(text: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];
    const lines = text.split('\n');

    let currentSection: { title: string; content: string } | null = null;

    lines.forEach(line => {
      const trimmed = line.trim();

      // All caps lines or lines ending with : are likely section headers
      if (trimmed.length > 0 && (trimmed === trimmed.toUpperCase() && trimmed.length > 3) || trimmed.endsWith(':')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: trimmed.replace(/:$/, ''), content: '' };
      } else if (currentSection && trimmed.length > 0) {
        currentSection.content += trimmed + ' ';
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private static extractKeyPhrases(text: string): string[] {
    const phrases: string[] = [];
    const paragraphs = text.split(/\n\n+/);

    paragraphs.forEach(para => {
      const sentences = para.split(/[.!?]+/);
      if (sentences.length > 0) {
        const firstSentence = sentences[0].trim();
        if (firstSentence.length > 20 && firstSentence.length < 200) {
          phrases.push(firstSentence);
        }
      }
    });

    return phrases.slice(0, 10); // Top 10 key phrases
  }

  private static detectIfResume(text: string): boolean {
    const resumeKeywords = [
      'EXPERIENCE', 'EDUCATION', 'SKILLS', 'WORK HISTORY',
      'EMPLOYMENT', 'RESUME', 'CV', 'CURRICULUM VITAE',
      'PROFESSIONAL SUMMARY', 'OBJECTIVE'
    ];

    let keywordCount = 0;
    resumeKeywords.forEach(keyword => {
      if (text.toUpperCase().includes(keyword)) {
        keywordCount++;
      }
    });

    return keywordCount >= 2; // If 2+ resume keywords found, probably a resume
  }

  // Optional resume-specific extraction (if document is detected as resume)

  private static extractSkills(text: string): string[] {
    const skills: Set<string> = new Set();

    const skillKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Go', 'Rust',
      'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Spring',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL',
      'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git'
    ];

    skillKeywords.forEach(skill => {
      // Escape special regex characters (e.g., C++ becomes C\+\+)
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      if (regex.test(text)) {
        skills.add(skill);
      }
    });

    return Array.from(skills);
  }

  private static extractEducationSimple(text: string): string[] {
    const education: string[] = [];
    const degrees = ['PhD', 'Ph.D', 'Masters', 'Master', 'MBA', 'Bachelor', 'BS', 'BA'];

    degrees.forEach(degree => {
      const regex = new RegExp(`${degree}[^\\n]{0,80}`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        education.push(...matches.map(m => m.trim()));
      }
    });

    return [...new Set(education)];
  }

  private static extractExperienceSimple(text: string): string[] {
    const experience: string[] = [];
    const titleKeywords = ['Engineer', 'Developer', 'Manager', 'Designer', 'Analyst', 'Director'];

    titleKeywords.forEach(keyword => {
      const regex = new RegExp(`([A-Z][a-z]+\\s+)*${keyword}[^\\n]{0,60}`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        experience.push(...matches.map(m => m.trim()));
      }
    });

    return [...new Set(experience)].slice(0, 5); // Top 5
  }
}
