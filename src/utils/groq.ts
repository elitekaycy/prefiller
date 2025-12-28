// Groq API - Ultra-fast free AI inference
// See: https://console.groq.com/docs/quickstart

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;
  id: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqAPI {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  // Using Llama 3.3 70B - latest and most powerful free model
  private model = 'llama-3.3-70b-versatile';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 1024,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API Error Response:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            const errorMessage = errorData.error.message;

            // Handle specific Groq API errors
            if (errorMessage.includes('Invalid API Key')) {
              throw new Error('Invalid Groq API key. Please check your key at https://console.groq.com/keys');
            } else if (errorMessage.includes('rate_limit')) {
              throw new Error('⚠️ Groq rate limit exceeded. Please wait a moment and try again.');
            } else {
              throw new Error(`Groq API Error: ${errorMessage}`);
            }
          }
        } catch (parseError) {
          // Re-throw if it's already a user-friendly error
          if (parseError instanceof Error && parseError.message.includes('Groq')) {
            throw parseError;
          }
        }

        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data: GroqResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Groq API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API request failed:', error);
      throw error;
    }
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
      console.log('Testing Groq API connection...');

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: 'Say "OK"'
            }
          ],
          max_tokens: 10
        })
      });

      console.log('Groq API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Groq API response data:', data);
        return !!(data.choices && data.choices.length > 0);
      } else {
        const errorText = await response.text();
        console.error('Groq API error response:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            const errorMessage = errorData.error.message;

            if (errorMessage.includes('Invalid API Key') || errorMessage.includes('Unauthorized')) {
              throw new Error('Invalid Groq API key. Please verify your key at https://console.groq.com/keys');
            } else if (errorMessage.includes('rate_limit')) {
              throw new Error('Rate limit exceeded. Please try again in a moment.');
            } else {
              throw new Error(`Groq API Error: ${errorMessage}`);
            }
          }
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.includes('Groq')) {
            throw parseError;
          }
        }

        // Common error messages based on status codes
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Groq API key at https://console.groq.com/keys');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Your API key may not have the required permissions.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`API request failed with status ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Groq API connection test failed:', error);
      throw error;
    }
  }
}
