/**
 * Shared utility for building AI prompts and parsing responses
 * Extracted from duplicated code across all AI providers
 */

import { FieldMetadata, AIFormResponse, AIFieldResponse } from '@/types';

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

  /**
   * Build structured AI prompt with JSON schema
   */
  static buildStructuredFormPrompt(context: string, fields: FieldMetadata[]): string {
    const prompt = `You are an expert form-filling AI assistant with advanced reasoning capabilities.

=== YOUR TASK ===
Analyze the provided personal information and generate accurate, contextual responses for form fields.
You MUST provide responses in a strict JSON format with confidence scores and reasoning.

=== PERSONAL INFORMATION ===
${context}

=== FORM FIELDS ===
${fields.map((field, index) => `
Field ${index + 1}:
  Label: ${field.label || 'Unknown'}
  Type: ${field.type}
  Placeholder: ${field.placeholder || 'None'}
  Description: ${field.description || 'None'}
  Context: ${field.context || 'None'}
  Required: ${field.required}
  ${field.options ? `Options: [${field.options.slice(0, 20).join(', ')}${field.options.length > 20 ? '...' : ''}]` : ''}
  ${field.pattern ? `Pattern: ${field.pattern}` : ''}
  ${field.maxLength ? `Max Length: ${field.maxLength}` : ''}
`).join('\n')}

=== RESPONSE FORMAT (STRICT JSON) ===
{
  "fields": [
    {
      "fieldIndex": 1,
      "value": "actual value to fill",
      "confidence": 95,
      "reasoning": "Found 'John Doe' in resume contact section",
      "source": "resume.pdf:contact",
      "needsReview": false
    }
  ],
  "overallConfidence": 90,
  "documentsSummary": "Resume with software engineering experience"
}

=== CONFIDENCE SCORING (0-100) ===
- 90-100: Direct exact match found in documents
- 70-89: Strong inference from clear context
- 50-69: Reasonable guess from related info
- 30-49: Weak inference, multiple possibilities
- 0-29: No relevant information, speculation

Set needsReview: true when confidence < 70 or field is required but uncertain.

=== FIELD TYPE HANDLING ===
- TEXT/EMAIL/TEL: Extract EXACT values from documents
- SELECT: Choose BEST matching option semantically
- DATE: Use MM/DD/YYYY format
- NUMBER: Respect min/max constraints
- If no info: value="", confidence=0, needsReview=true

=== EXAMPLES ===

Example 1 - Direct Match:
Document: "Email: john@gmail.com"
Field: Email input (required)
Response: {
  "fieldIndex": 1,
  "value": "john@gmail.com",
  "confidence": 100,
  "reasoning": "Email found in contact section",
  "source": "resume.pdf:line-2",
  "needsReview": false
}

Example 2 - Inference:
Document: "Worked 2018-2023 at Google, 2023-2025 at Microsoft"
Field: Years of Experience (number)
Response: {
  "fieldIndex": 2,
  "value": "7",
  "confidence": 85,
  "reasoning": "Calculated: 5 years Google + 2 years Microsoft",
  "source": "resume.pdf:experience",
  "needsReview": false
}

Example 3 - No Information:
Field: LinkedIn URL
Document: No LinkedIn mentioned
Response: {
  "fieldIndex": 3,
  "value": "",
  "confidence": 0,
  "reasoning": "No LinkedIn URL found in documents",
  "source": "none",
  "needsReview": true
}

Generate ONLY the JSON object, no other text:`;

    return prompt;
  }

  /**
   * Parse structured JSON response from AI
   */
  static parseStructuredFormResponse(
    response: string,
    expectedCount: number
  ): AIFormResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed: AIFormResponse = JSON.parse(jsonMatch[0]);

      if (!parsed.fields || !Array.isArray(parsed.fields)) {
        throw new Error('Invalid response structure');
      }

      const fieldMap = new Map(parsed.fields.map(f => [f.fieldIndex, f]));
      const completeFields: AIFieldResponse[] = [];

      for (let i = 1; i <= expectedCount; i++) {
        completeFields.push(
          fieldMap.get(i) || {
            fieldIndex: i,
            value: '',
            confidence: 0,
            reasoning: 'No response generated',
            source: 'none',
            needsReview: true,
          }
        );
      }

      return {
        fields: completeFields,
        overallConfidence: parsed.overallConfidence || 0,
        documentsSummary: parsed.documentsSummary || '',
      };
    } catch (error) {
      console.error('JSON parse failed:', error);
      return this.fallbackParsing(response, expectedCount);
    }
  }

  /**
   * Fallback parser (backward compatibility)
   */
  private static fallbackParsing(
    response: string,
    expectedCount: number
  ): AIFormResponse {
    const values = this.parseFormResponse(response, expectedCount);
    return {
      fields: values.map((value, index) => ({
        fieldIndex: index + 1,
        value,
        confidence: value ? 50 : 0,
        reasoning: 'Parsed from legacy format',
        source: 'unknown',
        needsReview: true,
      })),
      overallConfidence: 50,
      documentsSummary: 'Legacy format response',
    };
  }
}
