import { URLContext } from '@/types';

export class LinkScrapingService {
  private static readonly DEFAULT_TIMEOUT = 10000;
  private static readonly MAX_CONTENT_LENGTH = 10000;

  /**
   * Scrape content from a single URL
   */
  static async scrapeUrl(url: string): Promise<URLContext> {
    const id = Date.now().toString();

    try {
      const validUrl = this.validateUrl(url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT);

      const response = await fetch(validUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Prefiller/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const extracted = this.extractContent(html, validUrl);

      return {
        id,
        url: validUrl,
        title: extracted.title,
        description: extracted.description,
        content: extracted.content,
        addedAt: Date.now(),
        scrapedAt: Date.now(),
        scraper: 'manual',
        metadata: {
          success: true,
          wordCount: extracted.content.split(/\s+/).length,
        },
      };
    } catch (error) {
      return {
        id,
        url,
        content: '',
        addedAt: Date.now(),
        scraper: 'manual',
        metadata: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          wordCount: 0,
        },
      };
    }
  }

  /**
   * Validate and normalize URL
   */
  private static validateUrl(url: string): string {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    new URL(normalized);
    return normalized;
  }

  /**
   * Extract text content from HTML
   */
  private static extractContent(html: string, url: string): {
    title?: string;
    description?: string;
    content: string;
  } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const title = doc.querySelector('title')?.textContent || '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '#content',
      'body',
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        content = this.extractTextFromElement(element);
        if (content.length > 100) break;
      }
    }

    if (content.length > this.MAX_CONTENT_LENGTH) {
      content = content.substring(0, this.MAX_CONTENT_LENGTH) + '...';
    }

    return { title, description, content };
  }

  /**
   * Extract clean text from DOM element
   */
  private static extractTextFromElement(element: Element): string {
    const clone = element.cloneNode(true) as Element;
    clone.querySelectorAll('script, style, nav, header, footer, iframe').forEach(el => el.remove());
    return clone.textContent?.replace(/\s+/g, ' ').trim() || '';
  }
}
