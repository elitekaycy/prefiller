export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  id: string;
  model: string;
  role: 'assistant';
  stop_reason: string;
  stop_sequence: null;
  type: 'message';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeAPI {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';
  private model = 'claude-3-5-sonnet-20241022'; // Using Claude 3.5 Sonnet

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: this.model,
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

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          const errorType = errorData.error.type;
          const errorMessage = errorData.error.message;

          // Handle specific Claude API errors with user-friendly messages
          if (errorType === 'invalid_request_error' && errorMessage?.includes('credit balance is too low')) {
            throw new Error('⚠️ Insufficient Claude API credits. Please add credits at https://console.anthropic.com/settings/billing');
          } else if (errorType === 'authentication_error') {
            throw new Error('Invalid Claude API key. Please verify your key.');
          } else if (errorType === 'permission_error') {
            throw new Error('Permission denied. Your API key may not have the required permissions.');
          } else if (errorType === 'rate_limit_error') {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
          } else if (errorMessage) {
            throw new Error(`Claude API Error: ${errorMessage}`);
          }
        }
      } catch (parseError) {
        // Re-throw if it's already a user-friendly error
        if (parseError instanceof Error && parseError.message.includes('Claude API')) {
          throw parseError;
        }
        // If parsing fails, use the status text
      }

      throw new Error(`Claude API request failed: ${response.status} ${response.statusText}`);
    }

    const data: ClaudeResponse = await response.json();

    if (!data.content || data.content.length === 0) {
      throw new Error('No response from Claude API');
    }

    return data.content[0].text;
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
      console.log('Testing Claude API connection...');
      console.log('API Key format:', this.apiKey.substring(0, 15) + '...');
      console.log('Model:', this.model);

      const requestBody = {
        model: this.model,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi'
          }
        ]
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Claude API response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Claude API response data:', data);
        return !!(data.content && data.content.length > 0);
      } else {
        const errorText = await response.text();
        console.error('Claude API error response:', errorText);
        console.error('Status:', response.status, response.statusText);

        // Parse error for better user feedback
        try {
          const errorData = JSON.parse(errorText);
          console.error('Parsed error data:', errorData);

          if (errorData.error) {
            const errorType = errorData.error.type;
            const errorMessage = errorData.error.message;

            console.error('Error type:', errorType);
            console.error('Error message:', errorMessage);

            // Handle specific Claude API errors
            if (errorType === 'authentication_error') {
              throw new Error('Invalid Claude API key - please verify your key at https://console.anthropic.com/account/keys');
            } else if (errorType === 'permission_error') {
              throw new Error('Permission denied - your API key may not have the required permissions or sufficient credits');
            } else if (errorType === 'invalid_request_error') {
              if (errorMessage?.includes('credit balance')) {
                throw new Error('Insufficient Claude API credits. Please add credits at https://console.anthropic.com/settings/billing');
              }
              throw new Error(`Invalid request: ${errorMessage || 'Please check your API key and try again'}`);
            } else if (errorType === 'rate_limit_error') {
              throw new Error('Rate limit exceeded - please wait a moment and try again');
            } else if (errorMessage) {
              throw new Error(`Claude API Error (${errorType}): ${errorMessage}`);
            }
          }
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.includes('Claude API')) {
            throw parseError;
          }
          console.error('Failed to parse error response:', parseError);
          // If we can't parse the error, use the status
        }

        // Common error messages based on status codes
        if (response.status === 401) {
          throw new Error('Invalid API key - please check your Claude API key at https://console.anthropic.com/account/keys');
        } else if (response.status === 403) {
          throw new Error('Access forbidden - your API key may not have the required permissions or sufficient credits');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded - please wait a moment and try again');
        } else if (response.status === 400) {
          throw new Error(`Bad request (${response.status}) - Check the console for detailed error information`);
        } else if (response.status === 500) {
          throw new Error('Claude API server error - please try again later');
        } else {
          throw new Error(`API request failed with status ${response.status} - Check the console for details`);
        }
      }
    } catch (error) {
      console.error('Claude API connection test failed:', error);
      throw error; // Re-throw so the UI can show the specific error
    }
  }
}