import { FormField } from '@/types';
import { FormScraper, FieldMetadata } from './scraper';
import { AIService } from '@/utils/aiService';

// Simple decoder for API key (matching the encoder in popup)
class SimpleDecoder {
  private static readonly SALT = 'prefiller-salt-2024';

  static decode(encodedText: string): string {
    try {
      const decoded = atob(encodedText);
      return decodeURIComponent(escape(decoded)).replace(this.SALT, '');
    } catch (error) {
      console.error('Failed to decode API key:', error);
      return encodedText; // Return as-is if decoding fails
    }
  }
}

class FormAnalyzer {
  private detectedForms: FormField[] = [];
  private scrapedFields: FieldMetadata[] = [];
  private scraper: FormScraper;
  private isTopFrame: boolean;

  constructor() {
    this.scraper = new FormScraper();
    this.isTopFrame = window.self === window.top;
    console.log(`🚀 FormAnalyzer initialized in ${this.isTopFrame ? 'top frame' : 'iframe'}`);
    console.log(`📍 Frame URL: ${window.location.href}`);
    console.log(`📍 Frame origin: ${window.location.origin}`);

    // Log all iframes if we're in the top frame
    if (this.isTopFrame) {
      const iframes = document.querySelectorAll('iframe');
      console.log(`🔍 Found ${iframes.length} iframe(s) in top frame`);
      iframes.forEach((iframe, index) => {
        console.log(`  Iframe ${index + 1}: ${iframe.src || 'about:blank'}`);
      });
    }

    this.init();

    // Listen for postMessage from executeScript (works across all frames)
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PREFILLER_FILL_FORMS') {
        console.log(`📨 Received PREFILLER_FILL_FORMS message in ${this.isTopFrame ? 'top frame' : 'iframe'}`);
        // Re-scan and fill
        this.analyzeFormsAsync().then(() => {
          this.fillForms();
        });
      }
    });

    // Auto-analyze forms on load
    this.analyzeFormsAsync();
  }

  private init() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.action) {
        case 'ANALYZE_FORMS':
          this.analyzeFormsAsync().then(() => {
            sendResponse({ success: true, forms: this.detectedForms });
          });
          return true; // Required for async response
        case 'FILL_FORMS':
          // Re-scan forms before filling to ensure we have the latest
          this.analyzeFormsAsync().then(() => {
            this.fillForms();
            sendResponse({ success: true });
          });
          return true; // Required for async response
      }
    });

    this.observePageChanges();
  }

  private analyzeFormsAsync(): Promise<void> {
    return new Promise((resolve) => {
      // Wait a bit for dynamic content to load
      // Much longer delay for main page to allow iframes to fully load
      // Shorter delay for iframes since they load after the parent
      const delay = this.isTopFrame ? 5000 : 2000;

      const frameContext = this.isTopFrame ? '(main page)' : '(iframe)';
      console.log(`⏳ ${frameContext} Waiting ${delay}ms before scanning...`);

      // If we're in top frame, log iframe count after delay
      if (this.isTopFrame) {
        setTimeout(() => {
          const iframes = document.querySelectorAll('iframe');
          console.log(`🔍 ${frameContext} After ${delay}ms, found ${iframes.length} iframe(s)`);
        }, delay - 100);
      }

      setTimeout(() => {
        console.log(`🔍 ${frameContext} Starting form scan now...`);

        // Use the new scraper engine (skipFilled = false to detect all fields)
        this.scrapedFields = this.scraper.scrapeFormFields(false);

        // Convert to old format for backwards compatibility
        this.detectedForms = this.scrapedFields.map(field => ({
          element: field.element,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          description: field.description
        }));

        this.highlightDetectedFields();

        console.log(`✅ ${frameContext} Analyzed ${this.scrapedFields.length} form fields with comprehensive metadata`);

        if (this.scrapedFields.length > 0) {
          console.log(`📋 ${frameContext} Field summary:`, this.scrapedFields.map(f => ({
            label: f.label,
            type: f.type,
            name: f.name
          })));
        }

        resolve();
      }, delay);
    });
  }

  private observePageChanges() {
    // Watch for DOM changes including dynamically added iframes
    const observer = new MutationObserver((mutations) => {
      let shouldRescan = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check if an iframe was added
            if (element.tagName === 'IFRAME') {
              console.log(`🎯 [${this.isTopFrame ? 'main page' : 'iframe'}] New iframe detected:`, element);
              shouldRescan = true;
            }

            // Check if any descendant iframes were added
            if (element.querySelectorAll && element.querySelectorAll('iframe').length > 0) {
              console.log(`🎯 [${this.isTopFrame ? 'main page' : 'iframe'}] Element with iframes added:`, element);
              shouldRescan = true;
            }

            // Check if form fields were added
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
              shouldRescan = true;
            }
          }
        });
      });

      if (shouldRescan) {
        console.log('📡 DOM changed, rescanning for forms...');
        this.analyzeFormsAsync();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also log any iframes that exist now
    const existingIframes = document.querySelectorAll('iframe');
    if (existingIframes.length > 0) {
      console.log(`📋 Found ${existingIframes.length} existing iframe(s) in ${this.isTopFrame ? 'main page' : 'iframe'}:`, existingIframes);
    }
  }

  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  private extractFieldInfo(element: HTMLElement): FormField | null {
    const tagName = element.tagName.toLowerCase();
    const type = (element as HTMLInputElement).type || tagName;

    if (element.hasAttribute('readonly') || element.hasAttribute('disabled')) {
      return null;
    }

    const label = this.findLabel(element);
    const placeholder = (element as HTMLInputElement).placeholder;
    const required = element.hasAttribute('required');
    const description = this.findDescription(element);

    return {
      element,
      type,
      label,
      placeholder,
      required,
      description
    };
  }

  private findLabel(element: HTMLElement): string | undefined {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        return label.textContent?.trim();
      }
    }

    const parentLabel = element.closest('label');
    if (parentLabel) {
      return parentLabel.textContent?.trim();
    }

    const previousSibling = element.previousElementSibling;
    if (previousSibling && previousSibling.tagName.toLowerCase() === 'label') {
      return previousSibling.textContent?.trim();
    }

    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }

    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) {
        return labelElement.textContent?.trim();
      }
    }

    return undefined;
  }

  private findDescription(element: HTMLElement): string | undefined {
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      const descElement = document.getElementById(ariaDescribedBy);
      if (descElement) {
        return descElement.textContent?.trim();
      }
    }

    const nextSibling = element.nextElementSibling;
    if (nextSibling && (
      nextSibling.classList.contains('help-text') ||
      nextSibling.classList.contains('description') ||
      nextSibling.classList.contains('hint')
    )) {
      return nextSibling.textContent?.trim();
    }

    return undefined;
  }

  private highlightDetectedFields() {
    document.querySelectorAll('.prefiller-highlight').forEach(el => {
      el.classList.remove('prefiller-highlight');
    });

    this.detectedForms.forEach(field => {
      field.element.classList.add('prefiller-highlight');
    });

    this.injectHighlightStyles();
  }

  private injectHighlightStyles() {
    if (document.getElementById('prefiller-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'prefiller-styles';
    style.textContent = `
      .prefiller-highlight {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
        transition: all 0.2s ease-in-out !important;
      }

      .prefiller-filled {
        outline: 2px solid #10b981 !important;
        outline-offset: 2px !important;
        background-color: rgba(16, 185, 129, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
  }

  private async fillForms() {
    const frameContext = this.isTopFrame ? '(main page)' : '(iframe)';
    console.log(`🔧 [${frameContext}] fillForms called, scrapedFields count:`, this.scrapedFields.length);

    try {
      const settings = await this.getSettings();
      console.log(`⚙️ [${frameContext}] Settings loaded:`, {
        aiProvider: settings.aiProvider,
        hasApiKey: !!settings.apiKey,
        documentsCount: settings.documents?.length || 0
      });

      if (!settings.aiProvider) {
        console.error(`❌ [${frameContext}] No AI provider configured`);
        this.showNotification('Please configure your AI provider first!', 'error');
        return;
      }

      // Chrome AI doesn't need an API key
      if (settings.aiProvider !== 'chromeai' && !settings.apiKey) {
        console.error(`❌ [${frameContext}] No API key for provider: ${settings.aiProvider}`);
        this.showNotification('Please configure your API key first!', 'error');
        return;
      }

      // Check if documents are uploaded
      if (!settings.documents || settings.documents.length === 0) {
        console.error(`❌ [${frameContext}] No documents uploaded`);
        this.showNotification('Please upload your CV/resume in the Documents step first!', 'error');
        return;
      }

      // Decode the API key if it's encoded (not needed for Chrome AI)
      const decodedApiKey = settings.apiKey ? SimpleDecoder.decode(settings.apiKey) : '';

      if (this.scrapedFields.length === 0) {
        console.log(`⚠️ [${frameContext}] No forms detected, skipping fill`);
        // Only show error in top frame to avoid duplicate notifications
        if (this.isTopFrame) {
          this.showNotification('No forms detected on this page.', 'error');
        }
        return;
      }

      console.log(`✅ [${frameContext}] Starting to fill ${this.scrapedFields.length} fields`);

      this.showNotification(`🔍 Analyzing ${this.scrapedFields.length} form fields...`, 'loading');

      // Build personal information context
      let personalInfo = 'Personal Information:\n';
      console.log(`📄 [${frameContext}] Processing ${settings.documents.length} document(s)...`);

      settings.documents.forEach((doc: any, index: number) => {
        const preview = doc.content.substring(0, 200);
        console.log(`📄 [${frameContext}] Document ${index + 1}: "${doc.name}" - ${doc.content.length} chars`);
        console.log(`📄 [${frameContext}] Preview: "${preview}..."`);
        personalInfo += `\n${doc.name}:\n${doc.content}\n`;
      });

      console.log(`📋 [${frameContext}] Total personal info length: ${personalInfo.length} chars`);

      // Build AI prompt using scraper engine
      const prompt = this.scraper.buildAIPrompt(this.scrapedFields, personalInfo);
      console.log(`📝 [${frameContext}] AI Prompt built, length:`, prompt.length);

      const providerName = AIService.getProviderName(settings.aiProvider);
      this.showNotification(`🤖 Generating responses with ${providerName}...`, 'loading');
      console.log(`🤖 [${frameContext}] Calling ${providerName} API...`);

      // Use the unified AI service
      const aiService = new AIService(settings.aiProvider, decodedApiKey);
      console.log(`🔌 [${frameContext}] AI Service created for ${settings.aiProvider}`);

      const responses = await this.getAIResponses(aiService, prompt);
      console.log(`✅ [${frameContext}] AI responses received:`, responses.length, 'responses');

      this.showNotification('✨ Filling form fields...', 'loading');

      console.log(`🎯 [${frameContext}] About to fill fields. Responses:`, responses);
      console.log(`📊 [${frameContext}] Response count: ${responses.length}, Field count: ${this.scrapedFields.length}`);

      // Use scraper engine to fill fields intelligently
      const filledCount = this.scraper.fillFields(this.scrapedFields, responses);

      console.log(`✅ [${frameContext}] Filled ${filledCount} fields successfully`);

      // Add visual indicators
      let visualCount = 0;
      this.scrapedFields.forEach((field, index) => {
        if (index < responses.length && responses[index] && responses[index] !== '[SKIP]') {
          field.element.classList.add('prefiller-filled');
          visualCount++;
        }
      });

      console.log(`🎨 [${frameContext}] Added visual indicators to ${visualCount} fields`);

      this.showNotification(`✅ Successfully filled ${filledCount} out of ${this.scrapedFields.length} fields!`, 'success');
    } catch (error) {
      console.error('Error filling forms:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.showNotification(`❌ Error: ${errorMessage}`, 'error');
    }
  }

  private async getSettings(): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        resolve(result.settings || { aiProvider: 'claude', apiKey: '', documents: [], isEnabled: true });
      });
    });
  }

  private buildContext(settings: any): string {
    let context = 'Personal Information:\n';

    settings.documents.forEach((doc: any) => {
      context += `\n${doc.name}:\n${doc.content}\n`;
    });

    context += '\nForm Fields to Fill:\n';
    this.detectedForms.forEach((field, index) => {
      context += `${index + 1}. ${field.label || field.placeholder || 'Unlabeled field'} (${field.type})`;
      if (field.description) {
        context += ` - ${field.description}`;
      }
      if (field.required) {
        context += ' [Required]';
      }
      context += '\n';
    });

    return context;
  }

  private async getAIResponses(aiService: AIService, prompt: string): Promise<string[]> {
    const frameContext = this.isTopFrame ? '(main page)' : '(iframe)';
    console.log(`🤖 [${frameContext}] Sending prompt to AI (${prompt.length} chars)...`);
    console.log(`🤖 [${frameContext}] Full prompt:`, prompt);

    try {
      const response = await aiService.generateContent(prompt);

      console.log(`📥 [${frameContext}] Raw AI response received (${response.length} chars):`);
      console.log(`📥 [${frameContext}] Response text:`, response);

      const parsedResponses = this.parseAIResponse(response);
      console.log(`📋 [${frameContext}] Parsed ${parsedResponses.length} responses from AI output`);

      return parsedResponses;
    } catch (error) {
      console.error(`❌ [${frameContext}] AI API call failed:`, error);
      console.error(`❌ [${frameContext}] Error details:`, error instanceof Error ? error.message : String(error));
      throw error; // Re-throw to be caught by fillForms
    }
  }

  private parseAIResponse(text: string): string[] {
    const frameContext = this.isTopFrame ? '(main page)' : '(iframe)';
    const lines = text.split('\n').filter(line => line.trim());
    const responses: string[] = [];

    console.log(`🔍 [${frameContext}] Parsing AI response, found ${lines.length} non-empty lines`);

    lines.forEach((line, idx) => {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        const response = match[1].trim();
        const finalResponse = response === '[SKIP]' ? '' : response;
        responses.push(finalResponse);
        console.log(`✓ [${frameContext}] Line ${idx}: Matched field response: "${finalResponse}"`);
      } else {
        console.log(`⊘ [${frameContext}] Line ${idx}: No match for: "${line.substring(0, 80)}..."`);
      }
    });

    console.log(`📊 [${frameContext}] Parse complete: ${responses.length} field responses extracted`);
    console.log(`📊 [${frameContext}] Responses:`, responses);

    return responses;
  }

  private applyResponses(responses: string[]) {
    this.detectedForms.forEach((field, index) => {
      if (index < responses.length && responses[index]) {
        const element = field.element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

        if (element.tagName.toLowerCase() === 'select') {
          this.fillSelectField(element as HTMLSelectElement, responses[index]);
        } else {
          element.value = responses[index];
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }

        element.classList.add('prefiller-filled');
      }
    });
  }

  private fillSelectField(select: HTMLSelectElement, value: string) {
    const options = Array.from(select.options);
    const matchingOption = options.find(option =>
      option.text.toLowerCase().includes(value.toLowerCase()) ||
      option.value.toLowerCase().includes(value.toLowerCase())
    );

    if (matchingOption) {
      select.value = matchingOption.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  private showNotification(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    // Only show notifications in the top frame to avoid duplicates
    if (!this.isTopFrame) {
      console.log(`[iframe] ${message}`);
      return;
    }

    const existing = document.getElementById('prefiller-notification');
    if (existing) {
      existing.remove();
    }

    const colors = {
      loading: { bg: '#1f2937', border: '#3b82f6', text: '#fff' },
      success: { bg: '#065f46', border: '#10b981', text: '#fff' },
      error: { bg: '#7f1d1d', border: '#ef4444', text: '#fff' }
    };

    const config = colors[type];
    const showSpinner = type === 'loading';

    const notification = document.createElement('div');
    notification.id = 'prefiller-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${config.bg};
        color: ${config.text};
        padding: 16px 20px;
        border-radius: 12px;
        border: 2px solid ${config.border};
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        z-index: 999999;
        font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 350px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
      ">
        ${showSpinner ? `
          <div style="
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          "></div>
        ` : ''}
        <div style="flex: 1; line-height: 1.4;">${message}</div>
      </div>
      <style>
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // Auto-dismiss success and error messages after 5 seconds, keep loading until replaced
    if (type !== 'loading') {
      setTimeout(() => {
        const el = document.getElementById('prefiller-notification');
        if (el) {
          el.style.animation = 'slideOut 0.3s ease-in';
          setTimeout(() => el.remove(), 300);
        }
      }, 5000);
    }
  }
}

new FormAnalyzer();