/**
 * Shared utility for building AI prompts and parsing responses
 * Extracted from duplicated code across all AI providers
 */

import { FieldMetadata } from '@/types';

export class PromptBuilder {
  /**
   * Build a form-filling prompt from context and field metadata
   * @param context - Personal information or document content
   * @param fields - Array of form fields with metadata
   * @returns Formatted prompt for AI
   */
  static buildFormPrompt(context: string, fields: FieldMetadata[]): string {
    let prompt = `Based on the following personal information, generate appropriate responses for form fields.\n\n`;
    prompt += `Personal Information:\n${context}\n\n`;
    prompt += `Form Fields to Fill:\n`;

    fields.forEach((field, index) => {
      const label = field.label || field.placeholder || `Field ${index + 1}`;
      prompt += `${index + 1}. ${label} (${field.type})`;

      if (field.description) {
        prompt += ` - ${field.description}`;
      }

      if (field.required) {
        prompt += ' [Required]';
      }

      prompt += '\n';
    });

    prompt += `\nInstructions:
- Provide realistic, professional responses based on the personal information
- For email fields, use a professional email format
- For phone numbers, use format like (555) 123-4567
- For dates, use MM/DD/YYYY format
- Keep responses concise and appropriate for form fields
- If you don't have enough information for a field, respond with "[SKIP]"
- Format your response as a numbered list matching the field numbers above

Example format:
1. John Doe
2. john.doe@email.com
3. (555) 123-4567
4. [SKIP]

Your responses:`;

    return prompt;
  }

  /**
   * Parse AI response into array of field values
   * @param response - Raw AI response text
   * @param expectedCount - Number of fields expected
   * @returns Array of field values (empty string for skipped fields)
   */
  static parseFormResponse(response: string, expectedCount: number): string[] {
    const lines = response.split('\n').filter(line => line.trim());
    const responses: string[] = [];

    // Initialize with empty strings
    for (let i = 0; i < expectedCount; i++) {
      responses.push('');
    }

    // Parse numbered responses
    lines.forEach(line => {
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        const index = parseInt(match[1]) - 1;
        const value = match[2].trim();

        if (index >= 0 && index < expectedCount) {
          responses[index] = value === '[SKIP]' ? '' : value;
        }
      }
    });

    return responses;
  }
}
