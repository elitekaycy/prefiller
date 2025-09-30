export class FileReader {
  static async readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new globalThis.FileReader();

      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  static async readMultipleFiles(files: FileList): Promise<Array<{ name: string; content: string; type: string }>> {
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const content = await this.readAsText(file);
        results.push({
          name: file.name,
          content,
          type: file.type
        });
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
      }
    }

    return results;
  }

  static isValidFileType(file: File): boolean {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx'];

    return allowedTypes.includes(file.type) ||
           allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  static getMaxFileSize(): number {
    return 5 * 1024 * 1024;
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.isValidFileType(file)) {
      return {
        valid: false,
        error: 'File type not supported. Please use TXT, PDF, DOC, or DOCX files.'
      };
    }

    if (file.size > this.getMaxFileSize()) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 5MB.'
      };
    }

    return { valid: true };
  }
}