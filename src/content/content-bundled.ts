// Self-contained content script without external imports

// Types
interface FormField {
  element: HTMLElement;
  type: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
}

interface FieldMetadata {
  element: HTMLElement;
  type: string;
  label: string;
  placeholder: string;
  name: string;
  id: string;
  required: boolean;
  description: string;
  context: string;
  options?: string[];
  pattern?: string;
  maxLength?: number;
  min?: number;
  max?: number;
}

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

// Form scraper class
class FormScraper {
  scrapeFormFields(): FieldMetadata[] {
    const fields: FieldMetadata[] = [];

    // Expanded selectors to catch more form types
    const selectors = [
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
      'input[type="range"]',
      'input:not([type])', // Default text inputs
      'input', // All inputs as fallback
      'textarea',
      'select',
      // Additional selectors for modern forms
      '[role="textbox"]',
      '[contenteditable="true"]'
    ];

    console.log('🔍 Starting form field detection...');
    console.log('🔍 Page readyState:', document.readyState);
    console.log('🔍 Total input elements on page:', document.querySelectorAll('input').length);
    console.log('🔍 Total textarea elements on page:', document.querySelectorAll('textarea').length);
    console.log('🔍 Total select elements on page:', document.querySelectorAll('select').length);
    
    const elements = document.querySelectorAll(selectors.join(', '));
    console.log(`Found ${elements.length} potential form elements:`, elements);

    // Also try to find elements by common form classes/attributes
    const commonFormSelectors = [
      '.input',
      '.form-control',
      '.form-field',
      '[data-testid*="input"]',
      '[aria-label]',
      '[placeholder]'
    ];

    commonFormSelectors.forEach(selector => {
      const commonElements = document.querySelectorAll(selector);
      console.log(`Found ${commonElements.length} elements with selector "${selector}":`, commonElements);
    });

    elements.forEach((element, index) => {
      console.log(`Checking element ${index + 1}:`, element);
      
      if (this.isValidField(element as HTMLElement)) {
        console.log(`✅ Element ${index + 1} is valid`);
        const metadata = this.extractFieldMetadata(element as HTMLElement);
        if (metadata) {
          console.log(`✅ Extracted metadata for element ${index + 1}:`, metadata);
          fields.push(metadata);
        } else {
          console.log(`❌ Failed to extract metadata for element ${index + 1}`);
        }
      } else {
        console.log(`❌ Element ${index + 1} is not valid (readonly, disabled, hidden, or filled)`);
      }
    });

    console.log(`🔍 Scraped ${fields.length} form fields with metadata`, fields);
    return fields;
  }

  private isValidField(element: HTMLElement): boolean {
    console.log('Checking field validity for:', element);
    
    if (element.hasAttribute('readonly')) {
      console.log('❌ Field is readonly');
      return false;
    }
    
    if (element.hasAttribute('disabled')) {
      console.log('❌ Field is disabled');
      return false;
    }

    if (!this.isVisible(element)) {
      console.log('❌ Field is not visible');
      return false;
    }

    // Don't filter out fields with empty values - they should be fillable
    // Only skip fields that have actual content (not just empty string)
    const input = element as HTMLInputElement;
    if (input.value && input.value.trim().length > 0) {
      console.log('❌ Field already has content:', input.value);
      return false; // Skip fields that already have meaningful content
    }

    console.log('✅ Field is valid for filling');
    return true;
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

  private extractFieldMetadata(element: HTMLElement): FieldMetadata | null {
    const tagName = element.tagName.toLowerCase();
    const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    const metadata: FieldMetadata = {
      element,
      type: input.type || tagName,
      label: this.findLabel(element) || '',
      placeholder: (input as HTMLInputElement).placeholder || '',
      name: input.name || '',
      id: element.id || '',
      required: element.hasAttribute('required'),
      description: this.findDescription(element) || '',
      context: this.extractSurroundingContext(element)
    };

    if (tagName === 'select') {
      const select = element as HTMLSelectElement;
      metadata.options = Array.from(select.options)
        .map(opt => opt.text)
        .filter(text => text.trim().length > 0);
    }

    if ((input as HTMLInputElement).pattern) {
      metadata.pattern = (input as HTMLInputElement).pattern;
    }

    if ((input as HTMLInputElement).maxLength && (input as HTMLInputElement).maxLength > 0) {
      metadata.maxLength = (input as HTMLInputElement).maxLength;
    }

    if ((input as HTMLInputElement).min) {
      metadata.min = parseFloat((input as HTMLInputElement).min);
    }

    if ((input as HTMLInputElement).max) {
      metadata.max = parseFloat((input as HTMLInputElement).max);
    }

    return metadata;
  }

  private findLabel(element: HTMLElement): string | undefined {
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label?.textContent) {
        return this.cleanText(label.textContent);
      }
    }

    const parentLabel = element.closest('label');
    if (parentLabel?.textContent) {
      return this.cleanText(parentLabel.textContent);
    }

    const previousSibling = element.previousElementSibling;
    if (previousSibling?.tagName.toLowerCase() === 'label') {
      return this.cleanText(previousSibling.textContent || '');
    }

    const parent = element.parentElement;
    if (parent) {
      const labelElements = parent.querySelectorAll('.label, .form-label, [class*="label"]');
      for (const labelEl of Array.from(labelElements)) {
        if (labelEl !== element && labelEl.textContent) {
          return this.cleanText(labelEl.textContent);
        }
      }
    }

    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return this.cleanText(ariaLabel);
    }

    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement?.textContent) {
        return this.cleanText(labelElement.textContent);
      }
    }

    if ((element as HTMLInputElement).name) {
      return this.humanizeFieldName((element as HTMLInputElement).name);
    }

    return undefined;
  }

  private findDescription(element: HTMLElement): string | undefined {
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      const descElement = document.getElementById(ariaDescribedBy);
      if (descElement?.textContent) {
        return this.cleanText(descElement.textContent);
      }
    }

    const nextSibling = element.nextElementSibling;
    if (nextSibling && this.isHelpText(nextSibling)) {
      return this.cleanText(nextSibling.textContent || '');
    }

    const parent = element.parentElement;
    const parentNext = parent?.nextElementSibling;
    if (parentNext && this.isHelpText(parentNext)) {
      return this.cleanText(parentNext.textContent || '');
    }

    return undefined;
  }

  private isHelpText(element: Element): boolean {
    const className = element.className.toLowerCase();
    return (
      className.includes('help') ||
      className.includes('hint') ||
      className.includes('description') ||
      className.includes('note') ||
      element.tagName.toLowerCase() === 'small'
    );
  }

  private extractSurroundingContext(element: HTMLElement): string {
    const contexts: string[] = [];

    const parent = element.closest('div, fieldset, section');
    if (parent) {
      const heading = parent.querySelector('h1, h2, h3, h4, h5, h6, legend');
      if (heading?.textContent) {
        contexts.push(this.cleanText(heading.textContent));
      }

      const instructions = parent.querySelectorAll('p, .instruction, .info');
      instructions.forEach(inst => {
        if (inst.textContent && inst.textContent.trim().length > 0) {
          contexts.push(this.cleanText(inst.textContent));
        }
      });
    }

    return contexts.filter(c => c.length > 0).join(' | ');
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[*:]/g, '')
      .trim();
  }

  private humanizeFieldName(name: string): string {
    return name
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  buildAIPrompt(fields: FieldMetadata[], personalInfo: string): string {
    let prompt = `You are a form-filling assistant. Fill out the form fields based on the personal information provided.\n\n`;

    prompt += `=== PERSONAL INFORMATION ===\n${personalInfo}\n\n`;

    prompt += `=== FORM FIELDS TO FILL ===\n`;

    fields.forEach((field, index) => {
      prompt += `\nField ${index + 1}:\n`;
      prompt += `- Label: ${field.label || 'Unknown'}\n`;
      prompt += `- Type: ${field.type}\n`;

      if (field.placeholder) {
        prompt += `- Placeholder: ${field.placeholder}\n`;
      }

      if (field.description) {
        prompt += `- Description: ${field.description}\n`;
      }

      if (field.context) {
        prompt += `- Context: ${field.context}\n`;
      }

      if (field.required) {
        prompt += `- REQUIRED FIELD\n`;
      }

      if (field.options && field.options.length > 0) {
        prompt += `- Options: ${field.options.slice(0, 10).join(', ')}\n`;
      }

      if (field.pattern) {
        prompt += `- Pattern: ${field.pattern}\n`;
      }

      if (field.maxLength) {
        prompt += `- Max Length: ${field.maxLength}\n`;
      }

      if (field.min !== undefined || field.max !== undefined) {
        prompt += `- Range: ${field.min} to ${field.max}\n`;
      }
    });

    prompt += `\n=== INSTRUCTIONS ===\n`;
    prompt += `Provide responses for each field in this exact format:\n`;
    prompt += `1. [Response for field 1]\n`;
    prompt += `2. [Response for field 2]\n`;
    prompt += `etc.\n\n`;
    prompt += `Rules:\n`;
    prompt += `- Use the personal information to provide accurate responses\n`;
    prompt += `- For select fields, choose from the provided options\n`;
    prompt += `- For date fields, use MM/DD/YYYY format\n`;
    prompt += `- For phone numbers, use standard format (e.g., (123) 456-7890)\n`;
    prompt += `- For email, provide a valid email address\n`;
    prompt += `- Respect maxLength and pattern constraints\n`;
    prompt += `- If you don't have enough information, respond with "[SKIP]"\n`;
    prompt += `- Keep responses concise and appropriate for the field type\n`;

    return prompt;
  }

  fillFields(fields: FieldMetadata[], responses: string[]): number {
    let filledCount = 0;

    console.log(`\n🔧 Starting to fill ${fields.length} fields with ${responses.length} responses`);

    fields.forEach((field, index) => {
      console.log(`\n📝 Field ${index + 1}/${fields.length}:`);
      console.log(`   Label: "${field.label}"`);
      console.log(`   Type: ${field.type}`);

      if (index >= responses.length) {
        console.log(`   ⏭️ No response available (index ${index} >= ${responses.length})`);
        return;
      }

      const response = responses[index];
      console.log(`   Response: "${response}"`);

      if (!response || response === '[SKIP]' || response.trim().length === 0) {
        console.log(`   ⏭️ Skipping (empty or [SKIP])`);
        return;
      }

      try {
        const success = this.fillField(field, response);
        if (success) {
          filledCount++;
          console.log(`   ✅ Successfully filled!`);
        } else {
          console.log(`   ❌ Fill returned false`);
        }
      } catch (error) {
        console.error(`   ❌ Error filling field ${index}:`, error);
      }
    });

    return filledCount;
  }

  private fillField(field: FieldMetadata, value: string): boolean {
    const element = field.element;

    console.log(`   🔧 Attempting to fill ${element.tagName} with value: "${value}"`);

    if (element.tagName.toLowerCase() === 'select') {
      return this.fillSelectField(element as HTMLSelectElement, value);
    } else if (element.tagName.toLowerCase() === 'textarea') {
      return this.fillTextArea(element as HTMLTextAreaElement, value);
    } else {
      return this.fillInputField(element as HTMLInputElement, value, field.type);
    }
  }

  private fillSelectField(select: HTMLSelectElement, value: string): boolean {
    const options = Array.from(select.options);
    const lowerValue = value.toLowerCase();

    let matchingOption = options.find(
      opt => opt.value.toLowerCase() === lowerValue || opt.text.toLowerCase() === lowerValue
    );

    if (!matchingOption) {
      matchingOption = options.find(
        opt =>
          opt.text.toLowerCase().includes(lowerValue) ||
          lowerValue.includes(opt.text.toLowerCase())
      );
    }

    if (matchingOption) {
      select.value = matchingOption.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    return false;
  }

  private fillTextArea(textarea: HTMLTextAreaElement, value: string): boolean {
    textarea.value = value;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  private fillInputField(input: HTMLInputElement, value: string, type: string): boolean {
    switch (type) {
      case 'checkbox':
        input.checked = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;

      case 'radio':
        if (input.value.toLowerCase() === value.toLowerCase()) {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;

      default:
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, value);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        return true;
    }
  }
}

// Main form analyzer class
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
        this.analyzeForms();
        setTimeout(() => this.fillForms(), 3000); // Give forms time to be detected
      }
    });

    // Auto-analyze forms on load
    if (document.readyState === 'complete') {
      this.analyzeForms();
    } else {
      document.addEventListener('DOMContentLoaded', () => this.analyzeForms());
      window.addEventListener('load', () => this.analyzeForms());
    }
  }

  private init() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.action) {
        case 'PING':
          sendResponse({ success: true, loaded: true });
          break;
        case 'ANALYZE_FORMS':
          // Force immediate analysis without delay for manual trigger
          this.scrapedFields = this.scraper.scrapeFormFields();
          this.detectedForms = this.scrapedFields.map(field => ({
            element: field.element,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            description: field.description
          }));
          this.highlightDetectedFields();
          console.log(`✅ Manual analysis: ${this.scrapedFields.length} form fields found`);
          sendResponse({ success: true, forms: this.detectedForms });
          break;
        case 'FILL_FORMS':
          this.fillForms();
          sendResponse({ success: true });
          break;
      }
    });

    this.observePageChanges();
    
    // Also run initial analysis when page is ready
    if (document.readyState === 'complete') {
      this.analyzeForms();
    } else {
      document.addEventListener('DOMContentLoaded', () => this.analyzeForms());
      window.addEventListener('load', () => this.analyzeForms());
    }
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
    // Add a small delay to ensure the page is fully loaded
    setTimeout(() => {
      this.scrapedFields = this.scraper.scrapeFormFields();

      this.detectedForms = this.scrapedFields.map(field => ({
        element: field.element,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        required: field.required,
        description: field.description
      }));

      this.highlightDetectedFields();
      console.log(`✅ Analyzed ${this.scrapedFields.length} form fields with comprehensive metadata`);
    }, 1000); // Wait 1 second for dynamic content to load
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

    if (!settings.apiKey || !settings.aiProvider) {
      this.showNotification('Please configure your AI provider and API key first!', 'error');
      return;
    }

    const decodedApiKey = SimpleDecoder.decode(settings.apiKey);

    if (this.scrapedFields.length === 0) {
      this.showNotification('No forms detected on this page.', 'error');
      return;
    }

    this.showNotification(`🔍 Analyzing ${this.scrapedFields.length} form fields...`, 'loading');

    try {
      let personalInfo = 'Personal Information:\n';
      console.log(`📋 Settings documents count: ${settings.documents.length}`);
      settings.documents.forEach((doc: any) => {
        personalInfo += `\n${doc.name}:\n${doc.content}\n`;
        console.log(`📄 Document: ${doc.name} (${doc.content.length} chars)`);
      });

      const prompt = this.scraper.buildAIPrompt(this.scrapedFields, personalInfo);
      console.log(`\n📝 AI Prompt built (${prompt.length} chars):`);
      console.log(prompt.substring(0, 500) + '...\n');

      const providerName = settings.aiProvider === 'claude' ? 'Anthropic Claude' : settings.aiProvider === 'groq' ? 'Groq' : 'Google Gemini';
      this.showNotification(`🤖 Generating responses with ${providerName}...`, 'loading');
      console.log(`🤖 Calling ${providerName} API...`);

      const responses = await this.getAIResponses(settings.aiProvider, decodedApiKey, prompt);
      console.log(`\n✅ AI returned ${responses.length} responses:`);
      responses.forEach((resp, i) => {
        console.log(`  ${i + 1}. "${resp}"`);
      });

      this.showNotification('✨ Filling form fields...', 'loading');
      console.log(`\n✨ Attempting to fill ${this.scrapedFields.length} fields with ${responses.length} responses...`);

      const filledCount = this.scraper.fillFields(this.scrapedFields, responses);
      console.log(`✅ Successfully filled ${filledCount} fields`);

      this.scrapedFields.forEach((field, index) => {
        if (index < responses.length && responses[index] && responses[index] !== '[SKIP]') {
          field.element.classList.add('prefiller-filled');
        }
      });

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

  private async getAIResponses(provider: string, apiKey: string, prompt: string): Promise<string[]> {
    let response;

    if (provider === 'claude') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API Error Response:', errorText);
        throw new Error(`Claude API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.content || data.content.length === 0) {
        throw new Error('No response from Claude API');
      }

      return this.parseAIResponse(data.content[0].text);
    } else if (provider === 'groq') {
      // Groq API
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API Error Response:', errorText);
        throw new Error(`Groq API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Groq API');
      }

      return this.parseAIResponse(data.choices[0].message.content);
    } else {
      // Gemini
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
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
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0]) {
        throw new Error('Invalid response from Gemini API');
      }

      return this.parseAIResponse(data.candidates[0].content.parts[0].text);
    }
  }

  private parseAIResponse(text: string): string[] {
    console.log(`\n🔍 Parsing AI response (${text.length} chars):`);
    console.log('Raw AI text:', text);

    const lines = text.split('\n').filter(line => line.trim());
    console.log(`📝 Split into ${lines.length} non-empty lines`);

    const responses: string[] = [];

    lines.forEach(line => {
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        const index = parseInt(match[1]) - 1;
        const value = match[2].trim();
        responses[index] = value === '[SKIP]' ? '' : value;
        console.log(`  ✅ Matched line ${match[1]}: "${value}"`);
      } else {
        console.log(`  ⏭️ Skipped line (no match): "${line}"`);
      }
    });

    console.log(`\n✅ Parsed ${responses.length} responses from AI`);
    return responses;
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

// Initialize the form analyzer
new FormAnalyzer();