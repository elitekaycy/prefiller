import { FormField } from '@/types';

class FormAnalyzer {
  private detectedForms: FormField[] = [];

  constructor() {
    this.init();
  }

  private init() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'ANALYZE_FORMS':
          this.analyzeForms();
          sendResponse({ success: true, forms: this.detectedForms });
          break;
        case 'FILL_FORMS':
          this.fillForms();
          sendResponse({ success: true });
          break;
      }
    });

    this.observePageChanges();
  }

  private observePageChanges() {
    const observer = new MutationObserver(() => {
      this.analyzeForms();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private analyzeForms() {
    this.detectedForms = [];

    const formSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="url"]',
      'input[type="password"]',
      'input[type="search"]',
      'input[type="date"]',
      'input[type="datetime-local"]',
      'input[type="month"]',
      'input[type="week"]',
      'input[type="time"]',
      'input[type="number"]',
      'input:not([type])', // inputs without type attribute default to text
      'textarea',
      'select'
    ];

    const elements = document.querySelectorAll(formSelectors.join(', '));

    elements.forEach((element) => {
      if (this.isVisible(element as HTMLElement)) {
        const formField = this.extractFieldInfo(element as HTMLElement);
        if (formField) {
          this.detectedForms.push(formField);
        }
      }
    });

    this.highlightDetectedFields();
    console.log(`Detected ${this.detectedForms.length} form fields`, this.detectedForms);
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
    const settings = await this.getSettings();

    if (!settings.apiKey) {
      this.showNotification('Please configure your Gemini API key first!', 'error');
      return;
    }

    if (this.detectedForms.length === 0) {
      this.showNotification('No forms detected on this page.', 'error');
      return;
    }

    this.showNotification(`🔍 Analyzing ${this.detectedForms.length} form fields...`, 'loading');

    try {
      const context = this.buildContext(settings);

      this.showNotification('🤖 Generating responses with AI...', 'loading');
      const responses = await this.getAIResponses(context, settings.apiKey);

      this.showNotification('✨ Filling form fields...', 'loading');
      this.applyResponses(responses);

      this.showNotification(`✅ Successfully filled ${responses.filter(r => r).length} fields!`, 'success');
    } catch (error) {
      console.error('Error filling forms:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.showNotification(`❌ Error: ${errorMessage}`, 'error');
    }
  }

  private async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        resolve(result.settings || { apiKey: '', documents: [], isEnabled: true });
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

  private async getAIResponses(context: string, apiKey: string): Promise<string[]> {
    const prompt = `
      Based on the personal information provided and the form fields listed, generate appropriate responses for each field.

      ${context}

      Please provide responses in the following format:
      1. [Response for field 1]
      2. [Response for field 2]
      3. [Response for field 3]
      etc.

      Guidelines:
      - Use the personal information to provide accurate, relevant responses
      - Keep responses concise and appropriate for form fields
      - For email fields, use a professional email format
      - For phone numbers, use a standard format
      - For dates, use MM/DD/YYYY format
      - If you don't have enough information for a field, respond with "[SKIP]"
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          throw new Error(`API Error: ${errorData.error.message}`);
        }
      } catch (e) {
        // If parsing fails, use the status text
      }

      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid response from Gemini API. Please check your API key and try again.');
    }

    const text = data.candidates[0].content.parts[0].text;

    return this.parseAIResponse(text);
  }

  private parseAIResponse(text: string): string[] {
    const lines = text.split('\n').filter(line => line.trim());
    const responses: string[] = [];

    lines.forEach(line => {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        const response = match[1].trim();
        responses.push(response === '[SKIP]' ? '' : response);
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