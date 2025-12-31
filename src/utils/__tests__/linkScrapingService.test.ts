import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinkScrapingService } from '../linkScrapingService';

describe('LinkScrapingService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('scrapeUrl', () => {
    it('should validate and normalize URLs without protocol', async () => {
      const mockHtml = '<html><head><title>Test</title></head><body>Content</body></html>';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await LinkScrapingService.scrapeUrl('linkedin.com/in/john');

      expect(result.url).toBe('https://linkedin.com/in/john');
      expect(result.metadata.success).toBe(true);
    });

    it('should accept URLs with protocol', async () => {
      const mockHtml = '<html><head><title>Test</title></head><body>Content</body></html>';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await LinkScrapingService.scrapeUrl('https://example.com');

      expect(result.url).toBe('https://example.com');
      expect(result.metadata.success).toBe(true);
    });

    it('should extract title from HTML', async () => {
      const mockHtml = '<html><head><title>My Profile</title></head><body>Content</body></html>';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await LinkScrapingService.scrapeUrl('https://example.com');

      expect(result.title).toBe('My Profile');
    });

    it('should extract meta description', async () => {
      const mockHtml = '<html><head><meta name="description" content="Test description"/></head><body>Content</body></html>';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await LinkScrapingService.scrapeUrl('https://example.com');

      expect(result.description).toBe('Test description');
    });

    it('should extract content from main tag', async () => {
      const mockHtml = '<html><body><main>Main content here</main></body></html>';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await LinkScrapingService.scrapeUrl('https://example.com');

      expect(result.content).toContain('Main content');
    });

    it('should remove script and style tags from content', async () => {
      const mockHtml = '<html><body><main>Content<script>alert("test")</script><style>body{}</style></main></body></html>';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await LinkScrapingService.scrapeUrl('https://example.com');

      expect(result.content).not.toContain('alert');
      expect(result.content).not.toContain('body{}');
    });

    it('should calculate word count', async () => {
      const mockHtml = '<html><body><main>One two three four five</main></body></html>';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await LinkScrapingService.scrapeUrl('https://example.com');

      expect(result.metadata.wordCount).toBe(5);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await LinkScrapingService.scrapeUrl('https://example.com');

      expect(result.metadata.success).toBe(false);
      expect(result.metadata.error).toBe('Network error');
      expect(result.content).toBe('');
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await LinkScrapingService.scrapeUrl('https://example.com');

      expect(result.metadata.success).toBe(false);
      expect(result.metadata.error).toContain('404');
    });

    it('should handle invalid URLs', async () => {
      const result = await LinkScrapingService.scrapeUrl('not-a-url');

      expect(result.metadata.success).toBe(false);
      expect(result.metadata.error).toBeDefined();
    });

    it('should limit content length to 10000 characters', async () => {
      const longContent = 'a'.repeat(15000);
      const mockHtml = `<html><body><main>${longContent}</main></body></html>`;
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await LinkScrapingService.scrapeUrl('https://example.com');

      expect(result.content.length).toBeLessThanOrEqual(10003); // 10000 + '...'
      expect(result.content).toContain('...');
    });

    it('should set scraper type to manual', async () => {
      const mockHtml = '<html><body>Content</body></html>';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await LinkScrapingService.scrapeUrl('https://example.com');

      expect(result.scraper).toBe('manual');
    });

    it('should set timestamps', async () => {
      const mockHtml = '<html><body>Content</body></html>';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const before = Date.now();
      const result = await LinkScrapingService.scrapeUrl('https://example.com');
      const after = Date.now();

      expect(result.addedAt).toBeGreaterThanOrEqual(before);
      expect(result.addedAt).toBeLessThanOrEqual(after);
      expect(result.scrapedAt).toBeGreaterThanOrEqual(before);
      expect(result.scrapedAt).toBeLessThanOrEqual(after);
    });
  });
});
