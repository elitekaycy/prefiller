import { FormField } from '@/types';

export interface FieldMetadata {
  element: HTMLElement;
  type: string;
  label: string;
  placeholder: string;
  name: string;
  id: string;
  required: boolean;
  description: string;
  context: string; // Surrounding text/context
  options?: string[]; // For select/radio/checkbox
  pattern?: string; // Input pattern if specified
  maxLength?: number;
  min?: number;
  max?: number;
}

export class FormScraper {
  private skipFilledFields: boolean = false; // Make this configurable

  /**
   * Main scraping function - finds all fillable fields on the page/frame
   */
  scrapeFormFields(skipFilled: boolean = false): FieldMetadata[] {
    this.skipFilledFields = skipFilled;
    const fields: FieldMetadata[] = [];

    // All possible input selectors
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
      'input[type="radio"]',
      'input[type="checkbox"]',
      'input[type="file"]',
      'input:not([type])', // Default text inputs
      'textarea',
      'select',
      '[contenteditable="true"]' // For rich text editors
    ];

    const frameInfo = window.self === window.top ? 'main page' : 'iframe';
    console.log(`🔍 [${frameInfo}] Starting form scrape...`);
    console.log(`🔍 [${frameInfo}] Document URL: ${document.location.href}`);
    console.log(`🔍 [${frameInfo}] Document readyState: ${document.readyState}`);

    // Scrape current document (works in both main page and iframes)
    const elements = document.querySelectorAll(selectors.join(', '));
    console.log(`🔍 [${frameInfo}] Found ${elements.length} total elements matching selectors`);

    let skippedCount = 0;
    elements.forEach((element, index) => {
      const isValid = this.isValidField(element as HTMLElement);
      if (isValid) {
        const metadata = this.extractFieldMetadata(element as HTMLElement);
        if (metadata) {
          fields.push(metadata);
        }
      } else {
        skippedCount++;
        if (index < 5) { // Log first 5 skipped elements for debugging
          const el = element as HTMLElement;
          const reason = el.hasAttribute('readonly') ? 'readonly' :
                        el.hasAttribute('disabled') ? 'disabled' :
                        !this.isVisible(el) ? 'hidden' :
                        'already filled';
          console.log(`🔍 [${frameInfo}] Skipped element #${index}: ${el.tagName}.${el.className} - ${reason}`);
        }
      }
    });

    console.log(`🔍 [${frameInfo}] Scraped ${fields.length} valid fields, skipped ${skippedCount} fields`);
    if (fields.length > 0) {
      console.log(`🔍 [${frameInfo}] Field details:`, fields);
    }
    return fields;
  }

  /**
   * Check if a field is valid and fillable
   */
  private isValidField(element: HTMLElement): boolean {
    // Skip if readonly or disabled
    if (element.hasAttribute('readonly') || element.hasAttribute('disabled')) {
      return false;
    }

    // Skip hidden fields
    if (!this.isVisible(element)) {
      return false;
    }

    // Optionally skip if already filled (configurable)
    if (this.skipFilledFields) {
      const input = element as HTMLInputElement;
      if (input.value && input.value.trim().length > 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if element is visible
   */
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

  /**
   * Extract comprehensive metadata from a field
   */
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

    // Extract options for select/radio/checkbox
    if (tagName === 'select') {
      const select = element as HTMLSelectElement;
      metadata.options = Array.from(select.options)
        .map(opt => opt.text)
        .filter(text => text.trim().length > 0);
    }

    // Extract validation patterns
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

  /**
   * Find label for a field using multiple strategies
   */
  private findLabel(element: HTMLElement): string | undefined {
    // Strategy 1: Associated label via for attribute
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label?.textContent) {
        return this.cleanText(label.textContent);
      }
    }

    // Strategy 2: Parent label
    const parentLabel = element.closest('label');
    if (parentLabel?.textContent) {
      return this.cleanText(parentLabel.textContent);
    }

    // Strategy 3: Previous sibling label
    const previousSibling = element.previousElementSibling;
    if (previousSibling?.tagName.toLowerCase() === 'label') {
      return this.cleanText(previousSibling.textContent || '');
    }

    // Strategy 4: Look for label-like elements before the input
    const parent = element.parentElement;
    if (parent) {
      const labelElements = parent.querySelectorAll('.label, .form-label, [class*="label"]');
      for (const labelEl of Array.from(labelElements)) {
        if (labelEl !== element && labelEl.textContent) {
          return this.cleanText(labelEl.textContent);
        }
      }
    }

    // Strategy 5: ARIA label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return this.cleanText(ariaLabel);
    }

    // Strategy 6: ARIA labelledby
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement?.textContent) {
        return this.cleanText(labelElement.textContent);
      }
    }

    // Strategy 7: Name attribute as fallback
    if ((element as HTMLInputElement).name) {
      return this.humanizeFieldName((element as HTMLInputElement).name);
    }

    return undefined;
  }

  /**
   * Find description/help text for a field
   */
  private findDescription(element: HTMLElement): string | undefined {
    // ARIA describedby
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      const descElement = document.getElementById(ariaDescribedBy);
      if (descElement?.textContent) {
        return this.cleanText(descElement.textContent);
      }
    }

    // Next sibling with hint/help classes
    const nextSibling = element.nextElementSibling;
    if (nextSibling && this.isHelpText(nextSibling)) {
      return this.cleanText(nextSibling.textContent || '');
    }

    // Check parent's next sibling
    const parent = element.parentElement;
    const parentNext = parent?.nextElementSibling;
    if (parentNext && this.isHelpText(parentNext)) {
      return this.cleanText(parentNext.textContent || '');
    }

    return undefined;
  }

  /**
   * Check if element is help/hint text
   */
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

  /**
   * Extract surrounding context (nearby text)
   */
  private extractSurroundingContext(element: HTMLElement): string {
    const contexts: string[] = [];

    // Get text from parent container
    const parent = element.closest('div, fieldset, section');
    if (parent) {
      // Get heading in parent
      const heading = parent.querySelector('h1, h2, h3, h4, h5, h6, legend');
      if (heading?.textContent) {
        contexts.push(this.cleanText(heading.textContent));
      }

      // Get any instruction text
      const instructions = parent.querySelectorAll('p, .instruction, .info');
      instructions.forEach(inst => {
        if (inst.textContent && inst.textContent.trim().length > 0) {
          contexts.push(this.cleanText(inst.textContent));
        }
      });
    }

    return contexts.filter(c => c.length > 0).join(' | ');
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[*:]/g, '') // Remove asterisks and colons
      .trim();
  }

  /**
   * Convert field names like "first_name" to "First Name"
   */
  private humanizeFieldName(name: string): string {
    return name
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Build structured prompt for AI
   */
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

  /**
   * Fill fields with AI responses
   */
  fillFields(fields: FieldMetadata[], responses: string[]): number {
    let filledCount = 0;
    const frameInfo = window.self === window.top ? 'main page' : 'iframe';

    console.log(`🔧 [${frameInfo}] fillFields called with ${fields.length} fields and ${responses.length} responses`);

    fields.forEach((field, index) => {
      if (index >= responses.length) {
        console.log(`⏭️ [${frameInfo}] Field ${index}: No response available (index >= responses.length)`);
        return;
      }

      const response = responses[index];
      if (!response || response === '[SKIP]' || response.trim().length === 0) {
        console.log(`⏭️ [${frameInfo}] Field ${index} (${field.label}): Skipping - response is empty or [SKIP]`);
        return;
      }

      console.log(`📝 [${frameInfo}] Field ${index} (${field.label}): Attempting to fill with "${response}"`);

      try {
        const success = this.fillField(field, response);
        if (success) {
          filledCount++;
          console.log(`✅ [${frameInfo}] Field ${index} (${field.label}): Successfully filled!`);
        } else {
          console.log(`❌ [${frameInfo}] Field ${index} (${field.label}): Fill returned false`);
        }
      } catch (error) {
        console.error(`❌ [${frameInfo}] Field ${index} (${field.label}): Error -`, error);
      }
    });

    console.log(`📊 [${frameInfo}] fillFields complete: ${filledCount}/${fields.length} fields filled`);
    return filledCount;
  }

  /**
   * Fill a single field intelligently based on its type
   */
  private fillField(field: FieldMetadata, value: string): boolean {
    const element = field.element;

    if (element.tagName.toLowerCase() === 'select') {
      return this.fillSelectField(element as HTMLSelectElement, value);
    } else if (element.tagName.toLowerCase() === 'textarea') {
      return this.fillTextArea(element as HTMLTextAreaElement, value);
    } else {
      return this.fillInputField(element as HTMLInputElement, value, field.type);
    }
  }

  /**
   * Fill select field by matching value or text
   */
  private fillSelectField(select: HTMLSelectElement, value: string): boolean {
    const options = Array.from(select.options);
    const lowerValue = value.toLowerCase();

    // Try exact match first
    let matchingOption = options.find(
      opt => opt.value.toLowerCase() === lowerValue || opt.text.toLowerCase() === lowerValue
    );

    // Try partial match
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

  /**
   * Fill textarea
   */
  private fillTextArea(textarea: HTMLTextAreaElement, value: string): boolean {
    textarea.value = value;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  /**
   * Fill input field with type-specific handling
   */
  private fillInputField(input: HTMLInputElement, value: string, type: string): boolean {
    // Handle special input types
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

        // Trigger React/Vue events if present
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
