// Chrome Built-in AI (Gemini Nano) using the Prompt API
// See: https://developer.chrome.com/docs/ai/built-in-apis

export interface AILanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

export interface AILanguageModel {
  prompt(input: string): Promise<string>;
  promptStreaming?(input: string): ReadableStream;
  destroy(): void;
}

export interface AILanguageModelFactory {
  capabilities(): Promise<AILanguageModelCapabilities>;
  create(options?: {
    systemPrompt?: string;
    temperature?: number;
    topK?: number;
  }): Promise<AILanguageModel>;
}

// Extend Window interface to include Chrome AI
declare global {
  interface Window {
    ai?: {
      languageModel?: AILanguageModelFactory;
    };
  }
}

export class ChromeAI {
  /**
   * Check if Chrome AI is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      if (!window.ai?.languageModel) {
        console.log('Chrome AI: window.ai.languageModel not available');
        return false;
      }

      const capabilities = await window.ai.languageModel.capabilities();
      console.log('Chrome AI capabilities:', capabilities);

      return capabilities.available !== 'no';
    } catch (error) {
      console.error('Chrome AI availability check failed:', error);
      return false;
    }
  }

  /**
   * Get availability status with details
   */
  static async getAvailabilityStatus(): Promise<{
    available: boolean;
    status: 'readily' | 'after-download' | 'no' | 'not-supported';
    message: string;
  }> {
    try {
      if (!window.ai?.languageModel) {
        return {
          available: false,
          status: 'not-supported',
          message: 'Chrome AI is not supported in this browser. Please use Chrome 127+ and enable the required flags.'
        };
      }

      const capabilities = await window.ai.languageModel.capabilities();

      if (capabilities.available === 'readily') {
        return {
          available: true,
          status: 'readily',
          message: 'Chrome AI is ready to use!'
        };
      } else if (capabilities.available === 'after-download') {
        return {
          available: true,
          status: 'after-download',
          message: 'Chrome AI will download on first use (may take a few minutes).'
        };
      } else {
        return {
          available: false,
          status: 'no',
          message: 'Chrome AI is not available. Please enable the required Chrome flags.'
        };
      }
    } catch (error) {
      console.error('Chrome AI status check failed:', error);
      return {
        available: false,
        status: 'not-supported',
        message: 'Unable to check Chrome AI status. Please ensure you are using Chrome 127+ with AI features enabled.'
      };
    }
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      console.log('Chrome AI: Creating session...');

      if (!window.ai?.languageModel) {
        throw new Error('Chrome AI is not available. Please use Chrome 127+ and enable the Prompt API.');
      }

      const session = await window.ai.languageModel.create({
        temperature: 0.4,
        topK: 3
      });

      console.log('Chrome AI: Session created, generating response...');

      const response = await session.prompt(prompt);

      console.log('Chrome AI: Response generated');

      // Clean up the session
      session.destroy();

      return response;
    } catch (error) {
      console.error('Chrome AI generation failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('not available')) {
          throw new Error('Chrome AI is not available. Please enable it in chrome://flags or use another AI provider.');
        }
        throw new Error(`Chrome AI Error: ${error.message}`);
      }

      throw new Error('Chrome AI request failed. Please try another AI provider.');
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
      console.log('Testing Chrome AI connection...');

      if (!window.ai?.languageModel) {
        console.error('Chrome AI: window.ai.languageModel not available');
        return false;
      }

      const capabilities = await window.ai.languageModel.capabilities();
      console.log('Chrome AI capabilities:', capabilities);

      if (capabilities.available === 'no') {
        throw new Error('Chrome AI is not available. Please enable the Prompt API in chrome://flags');
      }

      if (capabilities.available === 'after-download') {
        console.log('Chrome AI will download the model on first use...');
      }

      // Try to create a session to test
      const session = await window.ai.languageModel.create();
      const testResponse = await session.prompt('Say "OK"');
      session.destroy();

      console.log('Chrome AI test response:', testResponse);
      return testResponse.length > 0;
    } catch (error) {
      console.error('Chrome AI connection test failed:', error);
      throw error;
    }
  }
}
