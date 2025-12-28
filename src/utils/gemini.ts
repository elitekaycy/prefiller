import { GeminiResponse } from '@/types';

export class GeminiAPI {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error Response:', errorText);

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          const errorMessage = errorData.error.message;

          // Handle specific Gemini API errors with user-friendly messages
          if (errorMessage.includes('API_KEY_INVALID')) {
            throw new Error('Invalid Gemini API key. Please check your key at https://aistudio.google.com/app/apikey');
          } else if (errorMessage.includes('PERMISSION_DENIED')) {
            throw new Error('Permission denied. Please ensure your Gemini API key has the correct permissions.');
          } else if (errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('⚠️ Gemini API quota exceeded. Please check your usage limits.');
          } else {
            throw new Error(`Gemini API Error: ${errorMessage}`);
          }
        }
      } catch (parseError) {
        // Re-throw if it's already a user-friendly error
        if (parseError instanceof Error && parseError.message.includes('Gemini API')) {
          throw parseError;
        }
        // If parsing fails, use the status text
      }

      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  async generateFormResponses(context: string, fields: Array<{ label?: string; type: string; description?: string; required?: boolean; placeholder?: string }>): Promise<string[]> {
    const prompt = this.buildFormPrompt(context, fields);
    const response = await this.generateContent(prompt);
    return this.parseFormResponse(response, fields.length);
  }

  private buildFormPrompt(context: string, fields: Array<any>): string {
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

  private parseFormResponse(response: string, expectedCount: number): string[] {
    const lines = response.split('\n').filter(line => line.trim());
    const responses: string[] = [];

    for (let i = 0; i < expectedCount; i++) {
      responses.push('');
    }

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

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Gemini API connection...');

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test'
            }]
          }],
          generationConfig: {
            maxOutputTokens: 5
          }
        })
      });

      console.log('Gemini API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Gemini API response data:', data);
        return !!(data.candidates && data.candidates.length > 0);
      } else {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);

        // Parse error for better user feedback
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            // Handle specific Gemini API errors
            if (errorData.error.message.includes('API_KEY_INVALID')) {
              throw new Error('Invalid Gemini API key - please check your key at https://aistudio.google.com/app/apikey');
            } else if (errorData.error.message.includes('PERMISSION_DENIED')) {
              throw new Error('Permission denied - please ensure your Gemini API key has the correct permissions');
            } else if (errorData.error.message.includes('RESOURCE_EXHAUSTED')) {
              throw new Error('Gemini API quota exceeded - please check your usage limits');
            } else {
              throw new Error(`Gemini API Error: ${errorData.error.message}`);
            }
          }
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.startsWith('Gemini API Error:')) {
            throw parseError;
          }
          // If we can't parse the error, use the status
        }

        // Common error messages based on status codes
        if (response.status === 400) {
          throw new Error('Invalid API key - please check your Gemini API key format');
        } else if (response.status === 403) {
          throw new Error('Access forbidden - your API key may not have the required permissions or may be invalid');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded - please try again later');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found - this may indicate an API key issue');
        } else {
          throw new Error(`API request failed with status ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Gemini API connection test failed:', error);
      throw error; // Re-throw so the UI can show the specific error
    }
  }
}