/**
 * PDF Text Extraction Utility
 * Uses Mozilla's PDF.js (pdfjs-dist) to extract text from PDF files
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use local bundled worker for Chrome extension
// The worker file is copied to the extension root during build
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');
} else {
  // Fallback for non-extension environments
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export class PDFParser {
  /**
   * Extract text content from a PDF file using PDF.js
   */
  static async extractText(file: File): Promise<string> {
    try {
      console.log(`📄 Starting PDF.js extraction for: ${file.name}`);
      console.log(`📄 PDF.js version: ${pdfjsLib.version}`);
      console.log(`📄 Worker URL: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      console.log(`📄 PDF loaded: ${arrayBuffer.byteLength} bytes`);

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });

      const pdf = await loadingTask.promise;
      console.log(`📄 PDF opened: ${pdf.numPages} pages`);

      // Extract text from all pages
      const textPages: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`📄 Processing page ${pageNum}/${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        textPages.push(pageText);
        console.log(`📄 Page ${pageNum}: ${pageText.length} chars extracted`);
      }

      const fullText = textPages.join('\n\n');
      console.log(`✅ PDF parsing complete: ${fullText.length} total characters`);

      if (fullText.trim().length === 0) {
        throw new Error('No text found in PDF. Please ensure your PDF has selectable text (not scanned images).');
      }

      return fullText;
    } catch (error) {
      console.error('❌ PDF parsing error:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if a file is a PDF
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }
}
