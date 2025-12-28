import { FormField, ProviderError } from '@/types';
import { FormScraper, FieldMetadata } from './scraper';
import { AIService } from '@/utils/aiService';
import { EncryptionUtil } from '@/utils/encryption';

class FormAnalyzer {
  private detectedForms: FormField[] = [];
  private scrapedFields: FieldMetadata[] = [];
  private scraper: FormScraper;
  private isTopFrame: boolean;

  constructor() {
    this.scraper = new FormScraper();
    this.isTopFrame = window.self === window.top;

    this.init();

    // Listen for postMessage from executeScript (works across all frames)
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PREFILLER_FILL_FORMS') {
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

      setTimeout(() => {
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
              shouldRescan = true;
            }

            // Check if any descendant iframes were added
            if (element.querySelectorAll && element.querySelectorAll('iframe').length > 0) {
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
        this.analyzeFormsAsync();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
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
    try {
      const settings = await this.getSettings();

      if (!settings.aiProvider) {
        this.showNotification('Please configure your AI provider first!', 'error');
        return;
      }

      // Chrome AI doesn't need an API key
      if (settings.aiProvider !== 'chromeai' && !settings.apiKey) {
        this.showNotification('Please configure your API key first!', 'error');
        return;
      }

      // Check if documents are uploaded
      if (!settings.documents || settings.documents.length === 0) {
        this.showNotification('Please upload your CV/resume in the Documents step first!', 'error');
        return;
      }

      // Decode the API key if it's encoded (not needed for Chrome AI)
      const decodedApiKey = settings.apiKey ? EncryptionUtil.decode(settings.apiKey) : '';

      if (this.scrapedFields.length === 0) {
        // Only show error in top frame to avoid duplicate notifications
        if (this.isTopFrame) {
          this.showNotification('No forms detected on this page.', 'error');
        }
        return;
      }

      this.showNotification(`🔍 Analyzing ${this.scrapedFields.length} form fields...`, 'loading');

      // Build personal information context
      let personalInfo = 'Personal Information:\n';

      settings.documents.forEach((doc: any) => {
        personalInfo += `\n${doc.name}:\n${doc.content}\n`;
      });

      // Build AI prompt using scraper engine
      const prompt = this.scraper.buildAIPrompt(this.scrapedFields, personalInfo);

      const providerName = AIService.getProviderName(settings.aiProvider);
      this.showNotification(`🤖 Generating responses with ${providerName}...`, 'loading');

      // Use the unified AI service
      const aiService = new AIService(settings.aiProvider, decodedApiKey);

      const responses = await this.getAIResponses(aiService, prompt);

      this.showNotification('✨ Filling form fields...', 'loading');

      // Use scraper engine to fill fields intelligently
      const filledCount = this.scraper.fillFields(this.scrapedFields, responses);

      // Add visual indicators
      this.scrapedFields.forEach((field, index) => {
        if (index < responses.length && responses[index] && responses[index] !== '[SKIP]') {
          field.element.classList.add('prefiller-filled');
        }
      });

      this.showNotification(`✅ Successfully filled ${filledCount} out of ${this.scrapedFields.length} fields!`, 'success');
    } catch (error) {
      let errorMessage = 'Unknown error occurred';

      if (error instanceof ProviderError) {
        errorMessage = error.getUserMessage();
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      this.showNotification(`❌ ${errorMessage}`, 'error');
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
    try {
      const response = await aiService.generateContent(prompt);
      const parsedResponses = this.parseAIResponse(response);
      return parsedResponses;
    } catch (error) {
      throw error; // Re-throw to be caught by fillForms
    }
  }

  private parseAIResponse(text: string): string[] {
    const lines = text.split('\n').filter(line => line.trim());
    const responses: string[] = [];

    lines.forEach((line) => {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        const response = match[1].trim();
        const finalResponse = response === '[SKIP]' ? '' : response;
        responses.push(finalResponse);
      }
    });

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